// 오답노트
// 퀴즈에서 틀린 단어를 기록하고, 목록을 보여 주고, 오답 재시험을 시작합니다.
// 저장 모양: { "w101": { count: 2, lastWrongAt: "2026-10-21" } }

const WrongAnswers = {
  // ---------- 데이터 ----------

  // 틀린 단어를 기록합니다. 이미 있으면 틀린 횟수를 늘립니다.
  record(wordId) {
    const wrongAnswers = Storage.getWrongAnswers();
    const item = wrongAnswers[wordId] || { count: 0, lastWrongAt: "" };
    item.count++;
    item.lastWrongAt = Stats.kstDateKey(Date.now());
    wrongAnswers[wordId] = item;
    Storage.saveWrongAnswers(wrongAnswers);
  },

  // 오답노트에서 뺍니다. 실제로 빠졌으면 true
  remove(wordId) {
    const wrongAnswers = Storage.getWrongAnswers();
    if (!wrongAnswers[wordId]) {
      return false;
    }
    delete wrongAnswers[wordId];
    return Storage.saveWrongAnswers(wrongAnswers);
  },

  // 오답노트에 있는 단어 목록 (지금 단어장에 있는 단어만)
  // 틀린 횟수가 많은 순, 같으면 최근에 틀린 순
  getItems() {
    const wrongAnswers = Storage.getWrongAnswers();
    const items = [];
    for (const id in wrongAnswers) {
      const word = Vocabulary.findById(id);
      if (word) {
        items.push({ word: word, count: wrongAnswers[id].count, lastWrongAt: wrongAnswers[id].lastWrongAt || "" });
      }
    }
    items.sort((a, b) => b.count - a.count || b.lastWrongAt.localeCompare(a.lastWrongAt));
    return items;
  },

  // 오답 단어만으로 재시험을 시작합니다.
  startReview(mode) {
    const words = WrongAnswers.getItems().map((item) => item.word);
    if (words.length === 0) {
      App.notify("오답노트가 비어 있습니다.");
      Quiz.showSetup();
      return;
    }
    Quiz.startReview(words, mode);
  },

  // ---------- 화면 ----------

  init() {
    document.getElementById("review-choice").addEventListener("click", () => WrongAnswers.startReview("choice"));
    document.getElementById("review-write").addEventListener("click", () => WrongAnswers.startReview("write"));
    document.getElementById("wrong-body").addEventListener("click", (event) => {
      const button = event.target.closest("[data-remove]");
      if (button) {
        WrongAnswers.remove(button.dataset.remove);
        App.updateWrongBadge();
        WrongAnswers.render();
        App.notify("오답노트에서 뺐습니다.");
      }
    });
  },

  render() {
    const items = WrongAnswers.getItems();
    const hasItems = items.length > 0;

    document.getElementById("wrong-count").textContent = `${items.length}개`;
    document.getElementById("wrong-table-card").hidden = !hasItems;
    document.getElementById("wrong-empty").hidden = hasItems;
    document.getElementById("review-choice").disabled = !hasItems;
    document.getElementById("review-write").disabled = !hasItems;

    document.getElementById("wrong-body").innerHTML = items
      .map(
        (item) => `
        <tr>
          <td class="es">${Vocabulary.escape(item.word.spanish)}</td>
          <td>${Vocabulary.meaningHtml(item.word)}</td>
          <td class="num is-wrong">${item.count}</td>
          <td class="num">${item.lastWrongAt}</td>
          <td><button class="link-btn" type="button" data-remove="${item.word.id}" aria-label="${Vocabulary.escape(item.word.spanish)} 오답노트에서 빼기">목록에서 빼기</button></td>
        </tr>`
      )
      .join("");

    WrongAnswers.renderReviewHistory();
  },

  renderReviewHistory() {
    const history = Storage.getStats().reviewHistory.slice(-5).reverse();
    const list = document.getElementById("review-history");
    if (history.length === 0) {
      list.innerHTML = '<li class="muted">아직 재시험 기록이 없어요.</li>';
      return;
    }
    list.innerHTML = history
      .map((item) => {
        const mode = item.mode === "choice" ? "객관식" : "주관식";
        return `<li><span>${item.date.slice(5)} · ${mode} ${item.total}문제 · 오답노트에서 ${item.cleared}개 빠짐</span><span class="num">${item.correct} / ${item.total}</span></li>`;
      })
      .join("");
  },
};
