// 단어 데이터와 단어장 화면
// 기본 단어(data/words.json, 읽기 전용)와 사용자 단어(localStorage)를 합쳐서 보여 줍니다.
// 품사 약어 함수(getPosAbbr, formatMeaning)는 퀴즈와 오답노트에서도 함께 씁니다.

// 카테고리 키와 화면 표시 이름 (data/README.md와 같은 순서)
const CATEGORY_LABELS = {
  greetings: "인사·기본 표현",
  people: "사람·가족",
  food: "음식·음료",
  nature: "동물·자연",
  home: "집·생활",
  school: "학교·직업",
  numbers: "숫자·시간",
  emotions: "감정·성격",
  verbs: "기본 동사",
  adjectives: "형용사·기타",
};

// 약어 설명 창에 보여 줄 목록 (모든 약어는 소문자)
const POS_ABBR_LIST = [
  ["n.", "명사"],
  ["n.m.", "남성 명사"],
  ["n.f.", "여성 명사"],
  ["n.m.f.", "양성 명사"],
  ["n.com.", "공통성 명사"],
  ["v.", "동사"],
  ["adj.", "형용사"],
  ["adv.", "부사"],
  ["v.phr.", "동사구"],
  ["pron.", "대명사"],
  ["prep.", "전치사"],
  ["conj.", "접속사"],
  ["interj.", "감탄사"],
  ["etc.", "기타"],
];

// 품사 값 -> 약어 (명사는 성별에 따라 GENDER_ABBR를 씀)
const POS_ABBR = {
  verb: "v.",
  adjective: "adj.",
  adverb: "adv.",
  verbPhrase: "v.phr.",
  pronoun: "pron.",
  preposition: "prep.",
  conjunction: "conj.",
  interjection: "interj.",
  other: "etc.",
};

const GENDER_ABBR = {
  masculine: "n.m.",
  feminine: "n.f.",
  both: "n.m.f.",
  common: "n.com.",
};

// 등록 폼에 보여 줄 한국어 이름
const POS_LABELS = {
  noun: "명사",
  verb: "동사",
  adjective: "형용사",
  adverb: "부사",
  verbPhrase: "동사구",
  pronoun: "대명사",
  preposition: "전치사",
  conjunction: "접속사",
  interjection: "감탄사",
  other: "기타",
};

const GENDER_LABELS = {
  masculine: "남성",
  feminine: "여성",
  both: "양성",
  common: "공통성",
};

const Vocabulary = {
  baseWords: [],
  userWords: [],
  loadError: "",

  // 단어장 필터 상태
  filters: { category: "all", level: "all", source: "all", query: "" },
  shuffledIds: null, // 섞은 순서 (섞지 않았으면 null). 저장하지 않습니다.
  view: { hideSpanish: false, hideKorean: false },

  editingId: null, // 수정 중인 단어 id (새 단어면 null)
  duplicateConfirmed: false, // 같은 철자 단어를 따로 저장하기로 확인했는지
  detailId: null, // 상세 창에 보이는 단어 id

  // ---------- 데이터 ----------

  async load() {
    Vocabulary.userWords = Storage.getUserWords();
    Vocabulary.view = Storage.getVocabView();
    try {
      const response = await fetch("data/words.json");
      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }
      Vocabulary.baseWords = await response.json();
    } catch (error) {
      console.warn("words.json을 불러오지 못했습니다:", error);
      Vocabulary.baseWords = [];
      Vocabulary.loadError =
        "기본 단어를 불러오지 못했습니다. index.html을 파일로 직접 열면 브라우저가 data/words.json을 읽지 못합니다. " +
        "배포된 주소로 접속하거나, README의 실행 방법대로 임시 서버를 켠 뒤 다시 열어 주세요.";
    }
  },

  getAllWords() {
    return Vocabulary.baseWords.concat(Vocabulary.userWords);
  },

  findById(id) {
    return Vocabulary.getAllWords().find((word) => word.id === id) || null;
  },

  getCategoryLabel(key) {
    return CATEGORY_LABELS[key] || "분류 없음";
  },

  // ---------- 품사 약어 (공통 함수) ----------

  // 품사 정보가 없으면 빈 문자열을 돌려줍니다. 임의로 품사를 붙이지 않습니다.
  getPosAbbr(word) {
    if (word.partOfSpeech === "noun") {
      return GENDER_ABBR[word.gender] || "n.";
    }
    return POS_ABBR[word.partOfSpeech] || "";
  },

  // "n.m. 책" 처럼 약어 + 공백 + 뜻 (글자만)
  formatMeaning(word) {
    const abbr = Vocabulary.getPosAbbr(word);
    return abbr ? abbr + " " + word.korean : word.korean;
  },

  // 화면에 넣을 HTML. 약어는 작고 연한 글자로 보입니다.
  meaningHtml(word) {
    const abbr = Vocabulary.getPosAbbr(word);
    const korean = Vocabulary.escape(word.korean);
    return abbr ? `<em class="pos">${abbr}</em> ${korean}` : korean;
  },

  // 사용자가 입력한 글자를 HTML에 넣기 전에 특수 문자를 바꿉니다.
  escape(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  },

  // ---------- 비교용 정리 함수 ----------

  // 같은 단어인지 비교할 때 씁니다. 악센트는 그대로 둡니다. (papa와 papá는 다른 단어)
  normalizeSpanish(text) {
    return text.trim().replace(/\s+/g, " ").toLowerCase();
  },

  // "배낭, 책가방" -> ["배낭", "책가방"]
  splitMeanings(korean) {
    return korean
      .split(",")
      .map((part) => part.trim().replace(/\s+/g, " "))
      .filter((part) => part !== "");
  },

  // 검색할 때는 악센트를 빼고 비교합니다. (cafe로 café를 찾을 수 있게)
  removeAccents(text) {
    return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  },

  // 철자가 같은 다른 단어들 (exceptId는 비교에서 뺌)
  findSameSpelling(spanish, exceptId) {
    const target = Vocabulary.normalizeSpanish(spanish);
    return Vocabulary.getAllWords().filter(
      (word) => word.id !== exceptId && Vocabulary.normalizeSpanish(word.spanish) === target
    );
  },

  // 두 뜻 문자열에 겹치는 뜻이 있는지
  hasSameMeaning(koreanA, koreanB) {
    const partsB = Vocabulary.splitMeanings(koreanB);
    return Vocabulary.splitMeanings(koreanA).some((part) => partsB.includes(part));
  },

  // ---------- 필터와 목록 ----------

  setFilters(changes) {
    Object.assign(Vocabulary.filters, changes);
    Vocabulary.shuffledIds = null;
    Vocabulary.render();
  },

  getFilteredWords() {
    const { category, level, source, query } = Vocabulary.filters;
    const spanishQuery = Vocabulary.removeAccents(query.trim());
    const koreanQuery = query.trim();

    const words = Vocabulary.getAllWords().filter((word) => {
      if (category !== "all" && word.category !== category) return false;
      if (level !== "all" && word.level !== level) return false;
      if (source === "base" && word.isUser) return false;
      if (source === "user" && !word.isUser) return false;
      if (koreanQuery === "") return true;
      return (
        Vocabulary.removeAccents(word.spanish).includes(spanishQuery) ||
        word.korean.includes(koreanQuery)
      );
    });

    if (Vocabulary.shuffledIds) {
      const order = Vocabulary.shuffledIds;
      words.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    }
    return words;
  },

  shuffle() {
    const ids = Vocabulary.getFilteredWords().map((word) => word.id);
    // 피셔-예이츠 섞기: 뒤에서부터 하나씩 무작위 자리와 바꿉니다.
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    Vocabulary.shuffledIds = ids;
    Vocabulary.render();
  },

  resetOrder() {
    Vocabulary.shuffledIds = null;
    Vocabulary.render();
  },

  // ---------- 화면 그리기 ----------

  init() {
    Vocabulary.fillSelects();
    Vocabulary.renderAbbrTable();

    document.getElementById("vocab-category").addEventListener("change", (event) => {
      Vocabulary.setFilters({ category: event.target.value });
    });
    document.getElementById("vocab-level").addEventListener("change", (event) => {
      Vocabulary.setFilters({ level: event.target.value });
    });
    document.getElementById("vocab-source").addEventListener("change", (event) => {
      Vocabulary.setFilters({ source: event.target.value });
    });

    document.getElementById("hide-es").addEventListener("click", () => Vocabulary.toggleHide("hideSpanish"));
    document.getElementById("hide-ko").addEventListener("click", () => Vocabulary.toggleHide("hideKorean"));
    document.getElementById("shuffle").addEventListener("click", Vocabulary.shuffle);
    document.getElementById("reset-order").addEventListener("click", Vocabulary.resetOrder);
    document.getElementById("add-word").addEventListener("click", () => Vocabulary.openForm(null));

    const tbody = document.getElementById("vocab-body");
    tbody.addEventListener("click", Vocabulary.handleRowClick);
    tbody.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && event.target.matches("tr[data-id]")) {
        Vocabulary.openDetail(event.target.dataset.id);
      }
    });

    Vocabulary.setupAbbrPopover();
    Vocabulary.setupDetail();
    Vocabulary.setupForm();
  },

  // 카테고리 선택 상자에 목록을 채웁니다.
  fillSelects() {
    let options = "";
    for (const key in CATEGORY_LABELS) {
      options += `<option value="${key}">${CATEGORY_LABELS[key]}</option>`;
    }
    document.getElementById("vocab-category").innerHTML = '<option value="all">전체 카테고리</option>' + options;
    document.getElementById("form-category").innerHTML = '<option value="">카테고리 선택</option>' + options;

    let posOptions = '<option value="">선택 안 함</option>';
    for (const key in POS_LABELS) {
      posOptions += `<option value="${key}">${POS_LABELS[key]}</option>`;
    }
    document.getElementById("form-pos").innerHTML = posOptions;

    let genderOptions = '<option value="">미분류</option>';
    for (const key in GENDER_LABELS) {
      genderOptions += `<option value="${key}">${GENDER_LABELS[key]}</option>`;
    }
    document.getElementById("form-gender").innerHTML = genderOptions;
  },

  render() {
    const { category, level, source } = Vocabulary.filters;
    document.getElementById("vocab-category").value = category;
    document.getElementById("vocab-level").value = level;
    document.getElementById("vocab-source").value = source;

    const table = document.getElementById("vocab-table");
    table.classList.toggle("hide-es", Vocabulary.view.hideSpanish);
    table.classList.toggle("hide-ko", Vocabulary.view.hideKorean);
    document.getElementById("hide-es").setAttribute("aria-pressed", String(Vocabulary.view.hideSpanish));
    document.getElementById("hide-ko").setAttribute("aria-pressed", String(Vocabulary.view.hideKorean));
    document.getElementById("reset-order").disabled = Vocabulary.shuffledIds === null;

    const words = Vocabulary.getFilteredWords();
    const total = Vocabulary.getAllWords().length;
    document.getElementById("vocab-count").textContent =
      words.length === total ? `총 ${total}개` : `${words.length}개 / 전체 ${total}개`;

    const tbody = document.getElementById("vocab-body");
    if (words.length === 0) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="5">조건에 맞는 단어가 없습니다.</td></tr>';
      return;
    }
    tbody.innerHTML = words.map(Vocabulary.rowHtml).join("");
  },

  rowHtml(word) {
    const type = word.isUser ? "내 단어" : "기본 단어";
    return `
      <tr class="${word.isUser ? "row-user" : "row-base"}" data-id="${word.id}" tabindex="0">
        <td class="es"><span>${Vocabulary.escape(word.spanish)}</span></td>
        <td class="ko"><span>${Vocabulary.meaningHtml(word)}</span></td>
        <td>${Vocabulary.getCategoryLabel(word.category)}</td>
        <td><span class="chip chip-sky">${word.level}</span></td>
        <td><i class="dot" role="img" title="${type}" aria-label="${type}"></i></td>
      </tr>`;
  },

  toggleHide(name) {
    Vocabulary.view[name] = !Vocabulary.view[name];
    Storage.saveVocabView(Vocabulary.view);
    Vocabulary.render();
  },

  // 가린 칸을 누르면 그 칸만 보이고, 그 밖의 곳을 누르면 상세 창이 열립니다.
  handleRowClick(event) {
    const cell = event.target.closest("td.es, td.ko");
    const table = document.getElementById("vocab-table");
    if (cell && !cell.classList.contains("revealed")) {
      const hidden =
        (cell.classList.contains("es") && table.classList.contains("hide-es")) ||
        (cell.classList.contains("ko") && table.classList.contains("hide-ko"));
      if (hidden) {
        cell.classList.add("revealed");
        return;
      }
    }
    const row = event.target.closest("tr[data-id]");
    if (row) {
      Vocabulary.openDetail(row.dataset.id);
    }
  },

  // ---------- 약어 설명 창 ----------

  renderAbbrTable() {
    document.getElementById("abbr-body").innerHTML = POS_ABBR_LIST.map(
      (item) => `<tr><td>${item[0]}</td><td>${item[1]}</td></tr>`
    ).join("");
  },

  setupAbbrPopover() {
    const button = document.getElementById("abbr-button");
    const popover = document.getElementById("abbr-pop");

    button.addEventListener("click", () => Vocabulary.setAbbrOpen(popover.hidden));
    document.getElementById("abbr-close").addEventListener("click", () => Vocabulary.setAbbrOpen(false));

    // 바깥을 누르면 닫습니다.
    document.addEventListener("click", (event) => {
      if (!popover.hidden && !event.target.closest(".pop-anchor")) {
        Vocabulary.setAbbrOpen(false, false);
      }
    });
  },

  // moveFocus가 true면 열 때는 창으로, 닫을 때는 버튼으로 포커스를 옮깁니다.
  setAbbrOpen(open, moveFocus = true) {
    const button = document.getElementById("abbr-button");
    const popover = document.getElementById("abbr-pop");
    popover.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
    if (!moveFocus) return;
    if (open) {
      popover.focus();
    } else {
      button.focus();
    }
  },

  isAbbrOpen() {
    return !document.getElementById("abbr-pop").hidden;
  },

  // ---------- 상세 창 ----------

  setupDetail() {
    document.getElementById("detail-edit").addEventListener("click", () => {
      const id = Vocabulary.detailId;
      App.closeModal();
      Vocabulary.openForm(id);
    });
    document.getElementById("detail-delete").addEventListener("click", () => {
      document.getElementById("delete-confirm").hidden = false;
      document.getElementById("detail-actions").hidden = true;
      document.getElementById("delete-cancel").focus();
    });
    document.getElementById("delete-cancel").addEventListener("click", () => {
      document.getElementById("delete-confirm").hidden = true;
      document.getElementById("detail-actions").hidden = false;
    });
    document.getElementById("delete-ok").addEventListener("click", () => {
      Vocabulary.deleteWord(Vocabulary.detailId);
      App.closeModal();
    });
  },

  openDetail(id) {
    const word = Vocabulary.findById(id);
    if (!word) return;
    Vocabulary.detailId = id;

    document.getElementById("detail-type").textContent = word.isUser ? "내 단어" : "기본 단어";
    document.getElementById("detail-title").innerHTML =
      `<span class="es-word">${Vocabulary.escape(word.spanish)}</span> — ${Vocabulary.meaningHtml(word)}`;
    document.getElementById("detail-meta").innerHTML =
      `<span class="chip">${Vocabulary.getCategoryLabel(word.category)}</span>` +
      `<span class="chip chip-sky">${word.level}</span>`;

    const notes = [];
    if (word.isUser && !Vocabulary.getPosAbbr(word)) {
      notes.push("품사 정보가 없는 단어입니다. 수정에서 추가할 수 있습니다.");
    }
    if (Vocabulary.findSameSpelling(word.spanish, word.id).length > 0) {
      notes.push("같은 철자의 다른 단어가 단어장에 있습니다.");
    }
    if (!word.isUser) {
      notes.push("기본 단어는 읽기 전용입니다.");
    }
    document.getElementById("detail-note").textContent = notes.join(" ");

    document.getElementById("detail-actions").hidden = !word.isUser;
    document.getElementById("delete-confirm").hidden = true;
    App.openModal("detail-overlay", "detail-dialog");
  },

  // ---------- 등록, 수정 폼 ----------

  setupForm() {
    const form = document.getElementById("word-form");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      Vocabulary.submitForm();
    });

    // 명사를 고를 때만 성별 선택을 보여 줍니다.
    document.getElementById("form-pos").addEventListener("change", Vocabulary.updateGenderField);

    // 입력을 바꾸면 "따로 저장" 확인을 다시 받습니다.
    form.addEventListener("input", () => {
      if (Vocabulary.duplicateConfirmed) {
        Vocabulary.duplicateConfirmed = false;
        Vocabulary.showFormMessage("");
      }
    });
  },

  updateGenderField() {
    const isNoun = document.getElementById("form-pos").value === "noun";
    document.getElementById("form-gender-field").hidden = !isNoun;
  },

  openForm(id) {
    const word = id ? Vocabulary.findById(id) : null;
    Vocabulary.editingId = word ? word.id : null;
    Vocabulary.duplicateConfirmed = false;

    document.getElementById("word-form-title").textContent = word ? "단어 수정" : "단어 추가";
    document.getElementById("form-spanish").value = word ? word.spanish : "";
    document.getElementById("form-korean").value = word ? word.korean : "";
    document.getElementById("form-pos").value = word && word.partOfSpeech ? word.partOfSpeech : "";
    document.getElementById("form-gender").value = word && word.gender ? word.gender : "";
    document.getElementById("form-category").value = word ? word.category || "" : "";
    document.getElementById("form-level").value = word ? word.level : "A1";
    Vocabulary.updateGenderField();
    Vocabulary.showFormMessage("");

    App.openModal("word-form-overlay", "form-spanish");
  },

  // type: "error"(빨강) 또는 "confirm"(보라). 빈 문자열이면 숨깁니다.
  showFormMessage(text, type = "error") {
    const message = document.getElementById("form-message");
    message.textContent = text;
    message.hidden = text === "";
    message.className = "form-message is-" + type;
    document.getElementById("form-submit").textContent = type === "confirm" && text ? "따로 저장" : "저장";
  },

  readForm() {
    const word = {
      spanish: document.getElementById("form-spanish").value.trim().replace(/\s+/g, " "),
      korean: Vocabulary.splitMeanings(document.getElementById("form-korean").value).join(", "),
      partOfSpeech: document.getElementById("form-pos").value,
      gender: document.getElementById("form-gender").value,
      category: document.getElementById("form-category").value,
      level: document.getElementById("form-level").value,
    };
    return word;
  },

  submitForm() {
    const input = Vocabulary.readForm();

    if (input.spanish === "" || input.korean === "") {
      Vocabulary.showFormMessage("스페인어와 뜻을 모두 입력해 주세요.");
      return;
    }
    if (input.category === "") {
      Vocabulary.showFormMessage("카테고리를 선택해 주세요.");
      return;
    }

    // 같은 철자의 단어 검사
    const sameSpelling = Vocabulary.findSameSpelling(input.spanish, Vocabulary.editingId);
    const sameMeaning = sameSpelling.find((word) => Vocabulary.hasSameMeaning(word.korean, input.korean));
    if (sameMeaning) {
      const type = sameMeaning.isUser ? "내 단어" : "기본 단어";
      Vocabulary.showFormMessage(
        `이미 단어장에 있는 단어입니다: ${sameMeaning.spanish} — ${Vocabulary.formatMeaning(sameMeaning)} (${type})`
      );
      return;
    }
    // 수정하면서 철자를 그대로 두었다면 이미 확인한 단어이므로 다시 묻지 않습니다.
    const original = Vocabulary.editingId ? Vocabulary.findById(Vocabulary.editingId) : null;
    const spellingUnchanged =
      original && Vocabulary.normalizeSpanish(original.spanish) === Vocabulary.normalizeSpanish(input.spanish);
    if (sameSpelling.length > 0 && !spellingUnchanged && !Vocabulary.duplicateConfirmed) {
      const list = sameSpelling.map((word) => `${word.spanish} — ${Vocabulary.formatMeaning(word)}`).join(", ");
      Vocabulary.duplicateConfirmed = true;
      Vocabulary.showFormMessage(
        `같은 철자의 단어가 있습니다: ${list}. 뜻이 다른 단어로 따로 저장하려면 "따로 저장"을 한 번 더 눌러 주세요.`,
        "confirm"
      );
      return;
    }

    if (Vocabulary.saveWord(input)) {
      App.closeModal();
    }
  },

  // 폼 내용을 사용자 단어로 저장합니다. 성공하면 true.
  saveWord(input) {
    const word = {
      id: Vocabulary.editingId || "u" + Date.now(),
      spanish: input.spanish,
      korean: input.korean,
      category: input.category,
      level: input.level,
      isUser: true,
    };
    // 품사는 고른 경우에만, 성별은 명사이고 고른 경우에만 저장합니다.
    if (input.partOfSpeech) {
      word.partOfSpeech = input.partOfSpeech;
    }
    if (input.partOfSpeech === "noun" && input.gender) {
      word.gender = input.gender;
    }

    const words = Vocabulary.userWords.slice();
    const index = words.findIndex((item) => item.id === word.id);
    if (index >= 0) {
      words[index] = word;
    } else {
      words.push(word);
    }

    if (!Storage.saveUserWords(words)) {
      Vocabulary.showFormMessage("저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요. 입력한 내용은 그대로 있습니다.");
      return false;
    }
    Vocabulary.userWords = words;
    Vocabulary.render();
    App.notify(index >= 0 ? "단어를 수정했습니다." : "단어를 추가했습니다.");
    return true;
  },

  deleteWord(id) {
    const words = Vocabulary.userWords.filter((word) => word.id !== id);
    if (!Storage.saveUserWords(words)) {
      return;
    }
    Vocabulary.userWords = words;

    // 지운 단어의 오답 기록도 함께 지웁니다.
    const wrongAnswers = Storage.getWrongAnswers();
    if (wrongAnswers[id]) {
      delete wrongAnswers[id];
      Storage.saveWrongAnswers(wrongAnswers);
    }

    Vocabulary.render();
    App.notify("단어를 삭제했습니다.");
  },
};
