// 객관식, 주관식 퀴즈
// 스페인어 단어를 보고 한국어 뜻을 맞힙니다. 오답노트 재시험에서도 같은 화면을 씁니다.

const QUIZ_COUNTS = [10, 20, 30];
const REVIEW_MAX = 30; // 오답 재시험은 한 번에 최대 30문제

// 주관식 답 앞에 붙은 품사 약어를 지우는 패턴 (예: "n.m. 책" -> "책")
const ANSWER_ABBR_PATTERN = /^(n|v|adj|adv|pron|prep|conj|interj|etc)\.(m\.f\.|m\.|f\.|com\.|phr\.)?\s*/i;

const Quiz = {
  settings: { mode: "choice", count: 10, scope: "all" },

  // 진행 중인 퀴즈. 없으면 null
  // { words, index, correct, mode, review, answered, wrongWords, notice }
  session: null,

  init() {
    for (const button of document.querySelectorAll("[data-quiz-mode]")) {
      button.addEventListener("click", () => {
        Quiz.settings.mode = button.dataset.quizMode;
        Quiz.renderSetup();
      });
    }
    for (const button of document.querySelectorAll("[data-quiz-count]")) {
      button.addEventListener("click", () => {
        Quiz.settings.count = Number(button.dataset.quizCount);
        Quiz.renderSetup();
      });
    }
    document.getElementById("quiz-scope").addEventListener("change", (event) => {
      Quiz.settings.scope = event.target.value;
      Quiz.renderSetup();
    });
    document.getElementById("quiz-start").addEventListener("click", Quiz.startFromSettings);

    document.getElementById("quiz-options").addEventListener("click", (event) => {
      const button = event.target.closest("[data-choice]");
      if (button) {
        Quiz.answerChoice(Number(button.dataset.choice));
      }
    });
    document.getElementById("quiz-write-form").addEventListener("submit", (event) => {
      event.preventDefault();
      Quiz.answerWrite(document.getElementById("quiz-answer").value);
    });
    document.getElementById("quiz-next").addEventListener("click", Quiz.next);
    document.getElementById("quiz-quit").addEventListener("click", Quiz.quit);
    document.getElementById("result-retry").addEventListener("click", Quiz.retry);
    document.getElementById("result-setup").addEventListener("click", Quiz.showSetup);

    // 객관식은 숫자 키 1~4로 고르고, 답한 뒤에는 Enter로 다음 문제로 갑니다.
    document.addEventListener("keydown", Quiz.handleKey);
  },

  // ---------- 설정 화면 ----------

  // 화면에 들어올 때 호출됩니다. 진행 중인 퀴즈가 있으면 그대로 보여 줍니다.
  render() {
    if (Quiz.session && !Quiz.session.finished) {
      Quiz.showPanel("play");
    } else if (Quiz.session && Quiz.session.finished) {
      Quiz.showPanel("result");
    } else {
      Quiz.showSetup();
    }
  },

  showSetup() {
    Quiz.session = null;
    Quiz.fillScopeSelect();
    Quiz.renderSetup();
    Quiz.showPanel("setup");
  },

  showPanel(name) {
    document.getElementById("quiz-setup").hidden = name !== "setup";
    document.getElementById("quiz-play").hidden = name !== "play";
    document.getElementById("quiz-result").hidden = name !== "result";
  },

  fillScopeSelect() {
    const select = document.getElementById("quiz-scope");
    let options = '<option value="all">전체 단어</option>';
    for (const key in CATEGORY_LABELS) {
      options += `<option value="${key}">${CATEGORY_LABELS[key]}</option>`;
    }
    options += '<option value="user">내 단어</option>';
    select.innerHTML = options;
    select.value = Quiz.settings.scope;
  },

  getPool(scope) {
    const words = Vocabulary.getAllWords();
    if (scope === "all") return words;
    if (scope === "user") return words.filter((word) => word.isUser);
    return words.filter((word) => word.category === scope);
  },

  renderSetup() {
    for (const button of document.querySelectorAll("[data-quiz-mode]")) {
      button.setAttribute("aria-pressed", String(button.dataset.quizMode === Quiz.settings.mode));
    }
    for (const button of document.querySelectorAll("[data-quiz-count]")) {
      button.setAttribute("aria-pressed", String(Number(button.dataset.quizCount) === Quiz.settings.count));
    }

    const pool = Quiz.getPool(Quiz.settings.scope);
    const problem = Quiz.checkCanStart(pool, Quiz.settings.mode);
    const available = document.getElementById("quiz-available");
    const message = document.getElementById("quiz-setup-message");

    available.textContent = `출제할 수 있는 단어: ${pool.length}개`;
    if (problem) {
      message.textContent = problem;
      message.hidden = false;
    } else if (pool.length < Quiz.settings.count) {
      message.textContent = `이 범위에는 단어가 ${pool.length}개뿐이라 ${pool.length}문제로 출제합니다.`;
      message.hidden = false;
    } else {
      message.hidden = true;
    }
    message.className = "form-message " + (problem ? "is-error" : "is-confirm");
    document.getElementById("quiz-start").disabled = problem !== "";
  },

  // 퀴즈를 시작할 수 없으면 이유를, 시작할 수 있으면 빈 문자열을 돌려줍니다.
  checkCanStart(pool, mode) {
    if (pool.length === 0) {
      return "출제할 단어가 없습니다. 다른 범위를 고르거나 단어장에서 단어를 추가해 주세요.";
    }
    if (mode === "choice" && Vocabulary.getAllWords().length < 4) {
      return "객관식은 보기 4개를 만들 단어가 4개 이상 필요합니다. 주관식을 고르거나 단어를 더 추가해 주세요.";
    }
    return "";
  },

  startFromSettings() {
    const pool = Quiz.getPool(Quiz.settings.scope);
    if (Quiz.checkCanStart(pool, Quiz.settings.mode)) {
      return;
    }
    const words = Quiz.shuffle(pool).slice(0, Quiz.settings.count);
    let notice = "";
    if (words.length < Quiz.settings.count) {
      notice = `단어가 부족해 ${words.length}문제로 출제했습니다.`;
    }
    Quiz.start(words, Quiz.settings.mode, false, notice);
  },

  // 오답노트에서 부릅니다. 틀린 단어만으로 재시험을 봅니다.
  startReview(words, mode) {
    const problem = Quiz.checkCanStart(words, mode);
    if (problem) {
      App.notify(problem);
      return;
    }
    const selected = Quiz.shuffle(words).slice(0, REVIEW_MAX);
    let notice = "오답 재시험입니다. 맞힌 단어는 오답노트에서 빠집니다.";
    if (words.length > REVIEW_MAX) {
      notice += ` 오답이 ${words.length}개라 이번에는 ${REVIEW_MAX}개만 출제합니다.`;
    }
    Quiz.start(selected, mode, true, notice);
    location.hash = "#quiz";
  },

  start(words, mode, review, notice) {
    Quiz.session = {
      words: words,
      index: 0,
      correct: 0,
      mode: mode,
      review: review,
      answered: false,
      finished: false,
      wrongWords: [],
      clearedCount: 0, // 재시험에서 오답노트에서 빠진 단어 수
      notice: notice,
    };
    Quiz.showPanel("play");
    Quiz.showQuestion();
  },

  // ---------- 문제 ----------

  showQuestion() {
    const session = Quiz.session;
    const word = session.words[session.index];
    session.answered = false;

    document.getElementById("quiz-mode-label").textContent =
      (session.review ? "오답 재시험 · " : "") + (session.mode === "choice" ? "객관식" : "주관식");
    document.getElementById("quiz-progress-text").textContent =
      `문제 ${session.index + 1} / ${session.words.length} · 정답 ${session.correct}`;
    document.getElementById("quiz-progress-bar").style.width = (session.index / session.words.length) * 100 + "%";

    const notice = document.getElementById("quiz-notice");
    notice.textContent = session.notice;
    notice.hidden = session.notice === "";

    document.getElementById("quiz-word").textContent = word.spanish;
    document.getElementById("quiz-feedback").hidden = true;
    document.getElementById("quiz-next").hidden = true;

    const options = document.getElementById("quiz-options");
    const form = document.getElementById("quiz-write-form");
    const input = document.getElementById("quiz-answer");

    if (session.mode === "choice") {
      form.hidden = true;
      options.hidden = false;
      session.choices = Quiz.makeChoices(word);
      options.innerHTML = session.choices
        .map((choice, index) => `<button class="option" type="button" data-choice="${index}"><b>${index + 1}</b><span>${Vocabulary.escape(choice.text)}</span></button>`)
        .join("");
      options.querySelector("button").focus();
    } else {
      options.hidden = true;
      form.hidden = false;
      input.value = "";
      input.disabled = false;
      form.querySelector("button").disabled = false;
      input.focus();
    }
  },

  // 정답 1개와 오답 3개로 보기를 만듭니다. 보기에는 품사 약어를 넣지 않습니다.
  makeChoices(word) {
    const target = Vocabulary.normalizeSpanish(word.spanish);

    // 철자가 같은 단어와 뜻이 겹치는 단어는 오답 보기에서 뺍니다. (둘 다 정답처럼 보이므로)
    const candidates = Vocabulary.getAllWords().filter(
      (other) =>
        other.id !== word.id &&
        Vocabulary.normalizeSpanish(other.spanish) !== target &&
        !Vocabulary.hasSameMeaning(other.korean, word.korean)
    );

    // 같은 품사 단어를 먼저 고르고, 모자라면 나머지에서 채웁니다.
    const samePos = Quiz.shuffle(candidates.filter((other) => word.partOfSpeech && other.partOfSpeech === word.partOfSpeech));
    const others = Quiz.shuffle(candidates.filter((other) => !samePos.includes(other)));

    const picked = [];
    for (const other of samePos.concat(others)) {
      // 보기끼리도 뜻이 겹치지 않게 합니다.
      const overlaps = picked.some((item) => Vocabulary.hasSameMeaning(item.korean, other.korean));
      if (!overlaps) {
        picked.push(other);
      }
      if (picked.length === 3) break;
    }

    const choices = [{ text: word.korean, correct: true }].concat(
      picked.map((other) => ({ text: other.korean, correct: false }))
    );
    return Quiz.shuffle(choices);
  },

  answerChoice(index) {
    const session = Quiz.session;
    if (!session || session.answered || session.mode !== "choice") return;
    const choice = session.choices[index];
    if (!choice) return;

    const buttons = document.querySelectorAll("#quiz-options .option");
    session.choices.forEach((item, i) => {
      buttons[i].disabled = true;
      if (item.correct) buttons[i].classList.add("correct");
    });
    if (!choice.correct) {
      buttons[index].classList.add("wrong");
    }
    Quiz.finishAnswer(choice.correct, choice.text);
  },

  answerWrite(text) {
    const session = Quiz.session;
    if (!session || session.answered || session.mode !== "write") return;
    if (text.trim() === "") {
      Quiz.showFeedback("답을 입력해 주세요.", "hint");
      return;
    }
    const word = session.words[session.index];
    const correct = Quiz.isCorrectAnswer(word, text);
    document.getElementById("quiz-answer").disabled = true;
    document.querySelector("#quiz-write-form button").disabled = true;
    Quiz.finishAnswer(correct, text.trim());
  },

  // 비교하기 쉽게 답을 정리합니다: 앞의 품사 약어, 물결표, 모든 공백을 지우고 소문자로
  normalizeAnswer(text) {
    return text.trim().replace(ANSWER_ABBR_PATTERN, "").replace(/~/g, "").replace(/\s+/g, "").toLowerCase();
  },

  // 정답으로 인정할 답 목록. 철자가 같은 다른 단어의 뜻도 인정합니다.
  getAcceptedAnswers(word) {
    const sameSpelling = [word].concat(Vocabulary.findSameSpelling(word.spanish, word.id));
    const answers = [];
    for (const item of sameSpelling) {
      for (const meaning of Vocabulary.splitMeanings(item.korean)) {
        answers.push(Quiz.normalizeAnswer(meaning));
        // "배(과일)"은 "배"로도, "(만나서) 반가운"은 "반가운"으로도 인정합니다.
        answers.push(Quiz.normalizeAnswer(meaning.replace(/\([^)]*\)/g, "")));
        answers.push(Quiz.normalizeAnswer(meaning.replace(/[()]/g, "")));
      }
    }
    return answers.filter((answer) => answer !== "");
  },

  isCorrectAnswer(word, text) {
    return Quiz.getAcceptedAnswers(word).includes(Quiz.normalizeAnswer(text));
  },

  finishAnswer(correct, answerText) {
    const session = Quiz.session;
    const word = session.words[session.index];
    session.answered = true;

    // 한 문제마다 바로 저장합니다. 중간에 그만두어도 푼 문제는 정답률에 반영됩니다.
    Stats.recordAnswer(word.id, correct);
    if (correct) {
      session.correct++;
      if (session.review && WrongAnswers.remove(word.id)) {
        session.clearedCount++;
      }
    } else {
      WrongAnswers.record(word.id);
      session.wrongWords.push({ word: word, answer: answerText });
    }

    const explanation = `${Vocabulary.escape(word.spanish)} — ${Vocabulary.meaningHtml(word)}`;
    if (correct) {
      Quiz.showFeedback(`정답입니다. ${explanation}`, "correct");
    } else {
      Quiz.showFeedback(`오답입니다. 정답: ${explanation}`, "wrong");
    }

    document.getElementById("quiz-progress-text").textContent =
      `문제 ${session.index + 1} / ${session.words.length} · 정답 ${session.correct}`;
    const nextButton = document.getElementById("quiz-next");
    nextButton.textContent = session.index === session.words.length - 1 ? "결과 보기" : "다음 문제";
    nextButton.hidden = false;
    nextButton.focus();
    App.updateWrongBadge();
  },

  // type: correct, wrong, hint
  showFeedback(html, type) {
    const feedback = document.getElementById("quiz-feedback");
    feedback.innerHTML = html;
    feedback.className = "feedback is-" + type;
    feedback.hidden = false;
  },

  next() {
    const session = Quiz.session;
    if (!session || !session.answered) return;
    if (session.index < session.words.length - 1) {
      session.index++;
      Quiz.showQuestion();
    } else {
      Quiz.finish();
    }
  },

  handleKey(event) {
    const session = Quiz.session;
    if (!session || session.finished || App.currentView !== "quiz" || App.openModalId) return;
    if (session.answered && event.key === "Enter" && event.target.id !== "quiz-next") {
      event.preventDefault();
      Quiz.next();
      return;
    }
    const isTyping = event.target.matches("input, select, textarea");
    if (!session.answered && session.mode === "choice" && !isTyping && ["1", "2", "3", "4"].includes(event.key)) {
      Quiz.answerChoice(Number(event.key) - 1);
    }
  },

  // ---------- 결과 ----------

  finish() {
    const session = Quiz.session;
    session.finished = true;
    const total = session.words.length;
    const accuracy = Math.round((session.correct / total) * 100);

    Stats.recordQuiz({
      mode: session.mode,
      total: total,
      correct: session.correct,
      review: session.review,
      cleared: session.clearedCount,
    });

    document.getElementById("result-title").textContent = session.review ? "오답 재시험 결과" : "퀴즈 결과";
    document.getElementById("result-score").textContent = session.correct;
    document.getElementById("result-total").textContent = total;
    document.getElementById("result-accuracy").textContent = `정답률 ${accuracy}%`;

    const reviewNote = document.getElementById("result-review-note");
    reviewNote.hidden = !session.review;
    reviewNote.textContent = `오답노트에서 ${session.clearedCount}개 단어가 빠졌습니다.`;

    const list = document.getElementById("result-wrong-list");
    if (session.wrongWords.length === 0) {
      list.innerHTML = '<p class="muted">모든 문제를 맞혔어요.</p>';
    } else {
      list.innerHTML =
        '<p class="card-title">틀린 단어</p><ul class="result-list">' +
        session.wrongWords
          .map((item) => `<li><span class="es-word">${Vocabulary.escape(item.word.spanish)}</span> — ${Vocabulary.meaningHtml(item.word)} <span class="muted">(내 답: ${Vocabulary.escape(item.answer)})</span></li>`)
          .join("") +
        "</ul>";
    }

    Quiz.showPanel("result");
    document.getElementById("result-retry").focus();
  },

  // 같은 설정으로 다시 풀기 (재시험이었다면 남은 오답으로 다시)
  retry() {
    const session = Quiz.session;
    if (session && session.review) {
      WrongAnswers.startReview(session.mode);
      return;
    }
    Quiz.startFromSettings();
  },

  quit() {
    Quiz.showSetup();
    App.notify("퀴즈를 그만두었습니다. 이미 푼 문제는 정답률에 반영됩니다.");
  },

  // 배열을 섞은 새 배열을 돌려줍니다. (피셔-예이츠 섞기)
  shuffle(list) {
    const result = list.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  },
};
