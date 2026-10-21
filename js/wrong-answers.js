// 오답노트
// 퀴즈에서 틀린 단어를 기록하고, 오답 재시험을 시작합니다.
// 저장 모양: { "w101": { count: 2, lastWrongAt: "2026-10-21" } }
// 오답 목록 화면은 6단계에서 작성합니다.

const WrongAnswers = {
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
        items.push({ word: word, count: wrongAnswers[id].count, lastWrongAt: wrongAnswers[id].lastWrongAt });
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
};
