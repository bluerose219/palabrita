// localStorage 읽기와 쓰기
// 다른 파일은 localStorage를 직접 쓰지 않고 이 파일의 함수만 씁니다.
// 모든 키 앞에는 "palabrita."를 붙입니다. (같은 주소를 쓰는 다른 사이트와 섞이지 않게)

const STORAGE_PREFIX = "palabrita.";

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// 통계의 기본 모양. 저장된 값에 빠진 항목이 있으면 이 값으로 채웁니다.
function createDefaultStats() {
  return {
    quizCount: 0, // 끝까지 푼 퀴즈 횟수 (오답 재시험 포함)
    totalQuestions: 0, // 답한 문제 수
    correctAnswers: 0, // 맞힌 문제 수
    learnedIds: [], // 한 번 이상 맞힌 단어 id
    history: [], // 퀴즈 기록 { date, mode, total, correct, review }
    reviewHistory: [], // 오답 재시험 기록 { date, mode, total, correct, cleared }
  };
}

const Storage = {
  // 저장에 실패했을 때 화면에 알려 줄 함수. app.js에서 정합니다.
  onSaveError: null,

  // 저장된 값을 읽습니다. 없거나 읽을 수 없으면 defaultValue를 돌려줍니다.
  // isValid: 값의 모양이 맞는지 확인하는 함수 (예: Array.isArray)
  load(name, defaultValue, isValid) {
    const key = STORAGE_PREFIX + name;
    let text = null;
    try {
      text = localStorage.getItem(key);
    } catch (error) {
      // 사이트 데이터가 차단된 경우 등. 저장소 없이도 화면은 동작하게 합니다.
      return defaultValue;
    }

    if (text === null) {
      return defaultValue;
    }

    try {
      const value = JSON.parse(text);
      if (isValid && !isValid(value)) {
        throw new Error("저장된 값의 모양이 맞지 않습니다.");
      }
      return value;
    } catch (error) {
      Storage.backupBroken(key, text);
      return defaultValue;
    }
  },

  // 읽을 수 없는 값은 지우지 않고 "키.broken"에 그대로 옮겨 둡니다.
  backupBroken(key, text) {
    try {
      if (localStorage.getItem(key + ".broken") === null) {
        localStorage.setItem(key + ".broken", text);
      }
    } catch (error) {
      // 백업도 할 수 없으면 아무것도 하지 않습니다.
    }
    console.warn(`${key} 값을 읽을 수 없어 ${key}.broken에 보관했습니다.`);
  },

  // 값을 저장합니다. 성공하면 true, 실패하면(저장 공간 부족 등) false를 돌려줍니다.
  save(name, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + name, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`${STORAGE_PREFIX}${name} 저장 실패:`, error);
      if (Storage.onSaveError) {
        Storage.onSaveError("저장하지 못했습니다. 브라우저 저장 공간이 부족하거나 사이트 데이터 저장이 막혀 있습니다. 기존 데이터는 그대로 있습니다.");
      }
      return false;
    }
  },

  // ---------- 항목별 함수 ----------

  getUserWords() {
    return Storage.load("userWords", [], Array.isArray);
  },
  saveUserWords(words) {
    return Storage.save("userWords", words);
  },

  // { "w101": { count: 2, lastWrongAt: "2026-10-21" } }
  getWrongAnswers() {
    return Storage.load("wrongAnswers", {}, isPlainObject);
  },
  saveWrongAnswers(wrongAnswers) {
    return Storage.save("wrongAnswers", wrongAnswers);
  },

  getStats() {
    const saved = Storage.load("stats", {}, isPlainObject);
    // 빠진 항목은 기본값으로 채웁니다. (저장된 값은 그대로 유지)
    return Object.assign(createDefaultStats(), saved);
  },
  saveStats(stats) {
    return Storage.save("stats", stats);
  },

  // 단어장 가리기 설정 { hideSpanish, hideKorean }
  getVocabView() {
    const saved = Storage.load("vocabView", {}, isPlainObject);
    return { hideSpanish: saved.hideSpanish === true, hideKorean: saved.hideKorean === true };
  },
  saveVocabView(view) {
    return Storage.save("vocabView", view);
  },

  // 외운 단어로 체크한 단어 { "w101": "2026-10-21" } (체크한 날짜)
  getMemorized() {
    return Storage.load("memorized", {}, isPlainObject);
  },
  saveMemorized(memorized) {
    return Storage.save("memorized", memorized);
  },

  // 날짜별 학습 시간(초) { "2026-10-21": 1080 }
  getStudyTime() {
    return Storage.load("studyTime", {}, isPlainObject);
  },
  saveStudyTime(studyTime) {
    return Storage.save("studyTime", studyTime);
  },

  // 여러 탭 중 학습 시간을 재는 탭 { tabId, updatedAt }
  getTimerOwner() {
    return Storage.load("studyTimerOwner", null, isPlainObject);
  },
  saveTimerOwner(owner) {
    return Storage.save("studyTimerOwner", owner);
  },
};
