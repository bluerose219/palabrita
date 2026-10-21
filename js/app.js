// 초기화, 화면 전환, 홈 화면, 공통 창(모달)과 알림

// 해시(#home 등)로 고를 수 있는 화면 목록
const VIEWS = ["home", "vocabulary", "quiz", "wrong", "stats"];

const App = {
  currentView: "home",
  openModalId: null, // 열려 있는 창의 id
  lastFocus: null, // 창을 열기 전에 포커스가 있던 요소
  toastTimer: null,
  openFormAfterMove: false, // 단어장으로 이동한 뒤 단어 추가 폼을 열지

  async init() {
    Storage.onSaveError = App.notify;

    await Vocabulary.load();
    if (Vocabulary.loadError) {
      const box = document.getElementById("load-error");
      box.textContent = Vocabulary.loadError;
      box.hidden = false;
    }

    Vocabulary.init();
    App.setupSearch();
    App.setupHomeLinks();
    App.setupModals();

    window.addEventListener("hashchange", () => App.showView(App.getViewFromHash()));
    App.showView(App.getViewFromHash());
  },

  // 주소의 해시에서 화면 이름을 꺼냅니다. 모르는 이름이면 홈으로 갑니다.
  getViewFromHash() {
    const name = location.hash.slice(1);
    if (VIEWS.includes(name)) {
      return name;
    }
    return "home";
  },

  showView(view) {
    App.currentView = view;
    App.closeModal(false);
    if (Vocabulary.isAbbrOpen()) {
      Vocabulary.setAbbrOpen(false, false);
    }

    for (const section of document.querySelectorAll("[data-section]")) {
      section.hidden = section.dataset.section !== view;
    }

    for (const link of document.querySelectorAll(".nav-item")) {
      const isActive = link.dataset.view === view;
      link.classList.toggle("active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    }

    App.updateWrongBadge();
    if (view === "home") {
      App.renderHome();
    } else if (view === "vocabulary") {
      Vocabulary.render();
      if (App.openFormAfterMove) {
        App.openFormAfterMove = false;
        Vocabulary.openForm(null);
      }
    }
  },

  // 다른 화면에서 단어장을 특정 필터로 엽니다.
  goToVocabulary(filters) {
    Vocabulary.filters = Object.assign({ category: "all", level: "all", source: "all", query: Vocabulary.filters.query }, filters);
    Vocabulary.shuffledIds = null;
    if (location.hash === "#vocabulary") {
      Vocabulary.render();
    } else {
      location.hash = "#vocabulary";
    }
  },

  // 상단 검색창: 입력하는 대로 단어장을 걸러 보여 줍니다.
  setupSearch() {
    const input = document.getElementById("top-search");
    input.addEventListener("input", () => {
      Vocabulary.filters.query = input.value;
      Vocabulary.shuffledIds = null;
      if (App.currentView === "vocabulary") {
        Vocabulary.render();
      }
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && App.currentView !== "vocabulary") {
        location.hash = "#vocabulary";
      }
    });
  },

  updateWrongBadge() {
    document.getElementById("wrong-badge-count").textContent = Stats.getSummary().wrongCount;
  },

  // ---------- 홈 ----------

  setupHomeLinks() {
    // 홈의 "전체 보기", 카테고리 카드의 "학습하기", "단어 추가하기" 버튼
    document.querySelector('[data-section="home"]').addEventListener("click", (event) => {
      const button = event.target.closest("[data-go-vocab], [data-add-word]");
      if (!button) return;
      if (button.hasAttribute("data-add-word")) {
        // 화면을 바꾸면 열려 있던 창이 닫히므로, 단어장으로 이동한 뒤에 폼을 엽니다.
        App.openFormAfterMove = true;
        App.goToVocabulary({ source: "user" });
        return;
      }
      const target = button.dataset.goVocab;
      if (target === "user") {
        App.goToVocabulary({ source: "user" });
      } else if (target === "all") {
        App.goToVocabulary({});
      } else {
        App.goToVocabulary({ category: target });
      }
    });
  },

  renderHome() {
    const summary = Stats.getSummary();
    document.getElementById("home-total").textContent = summary.totalWords;
    document.getElementById("home-learned").textContent = summary.learnedCount;
    document.getElementById("home-accuracy").textContent = summary.accuracy + "%";
    document.getElementById("home-wrong").textContent = summary.wrongCount;

    const recent = Stats.getRecentAccuracy(7);
    Stats.drawAccuracyChart("home-chart", recent.labels, recent.values);

    App.renderTodayWord();
    App.renderCategoryCards(new Set(summary.learnedIds));
  },

  // 오늘의 단어: 한국 날짜를 숫자로 바꿔 기본 단어 중 하나를 고릅니다. 하루 동안 같은 단어가 나옵니다.
  renderTodayWord() {
    const words = Vocabulary.baseWords;
    if (words.length === 0) {
      document.getElementById("today-word").textContent = "-";
      document.getElementById("today-mean").textContent = "단어를 불러오지 못했습니다.";
      document.getElementById("today-meta").innerHTML = "";
      return;
    }
    const dateKey = Stats.kstDateKey(Date.now());
    let seed = 0;
    for (const char of dateKey) {
      seed = (seed * 31 + char.charCodeAt(0)) % 100000;
    }
    const word = words[seed % words.length];

    document.getElementById("today-word").textContent = word.spanish;
    document.getElementById("today-mean").innerHTML = Vocabulary.meaningHtml(word);
    document.getElementById("today-meta").innerHTML =
      `<span class="chip">${Vocabulary.getCategoryLabel(word.category)}</span>` +
      `<span class="chip chip-sky">${word.level}</span>`;
  },

  // 첫 카드는 "내 단어"(한 줄 전체), 그 아래 카테고리 10개
  renderCategoryCards(learnedSet) {
    const allWords = Vocabulary.getAllWords();
    const cards = [];

    const userWords = Vocabulary.userWords;
    if (userWords.length === 0) {
      cards.push(`
        <div class="card cat-card is-user is-wide">
          <div class="cat-thumb thumb-user"></div>
          <div class="cat-body">
            <p class="cat-name">내 단어</p>
            <span class="muted">아직 추가한 단어가 없어요. 외우고 싶은 단어를 직접 추가해 보세요.</span>
            <button class="btn btn-small" type="button" data-add-word>단어 추가하기 <svg class="icon"><use href="#i-plus"/></svg></button>
          </div>
        </div>`);
    } else {
      cards.push(App.categoryCardHtml("user", "내 단어", userWords, learnedSet, "is-user is-wide", " · 직접 추가한 단어"));
    }

    for (const key in CATEGORY_LABELS) {
      const words = allWords.filter((word) => word.category === key);
      cards.push(App.categoryCardHtml(key, CATEGORY_LABELS[key], words, learnedSet, "", ""));
    }
    document.getElementById("cat-grid").innerHTML = cards.join("");
  },

  categoryCardHtml(key, name, words, learnedSet, extraClass, extraText) {
    const learned = words.filter((word) => learnedSet.has(word.id)).length;
    const progress = words.length > 0 ? Math.round((learned / words.length) * 100) : 0;
    return `
      <div class="card cat-card ${extraClass}">
        <div class="cat-thumb thumb-${key}"></div>
        <div class="cat-body">
          <p class="cat-name">${name}</p>
          <span class="muted">${words.length}단어${extraText} · 학습 ${learned}개</span>
          <div class="progress-row">
            <div class="progress" role="progressbar" aria-label="${name} 학습 진행률" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"><i style="width:${progress}%"></i></div>
            <span class="progress-num">${progress}%</span>
          </div>
          <button class="btn btn-small" type="button" data-go-vocab="${key}">학습하기 <svg class="icon"><use href="#i-arrow"/></svg></button>
        </div>
      </div>`;
  },

  // ---------- 공통 창(모달) ----------

  setupModals() {
    for (const overlay of document.querySelectorAll(".overlay")) {
      // 바깥(어두운 배경)을 누르면 닫습니다.
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay || event.target.closest("[data-close]")) {
          App.closeModal();
        }
      });
    }

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (App.openModalId) {
        App.closeModal();
      } else if (Vocabulary.isAbbrOpen()) {
        Vocabulary.setAbbrOpen(false);
      }
    });
  },

  // overlayId 창을 열고 focusId 요소로 포커스를 옮깁니다.
  openModal(overlayId, focusId) {
    if (App.openModalId) {
      App.closeModal(false);
    }
    App.lastFocus = document.activeElement;
    App.openModalId = overlayId;
    document.getElementById(overlayId).hidden = false;
    document.getElementById(focusId).focus();
  },

  // restoreFocus가 true면 창을 열기 전의 요소로 포커스를 돌려줍니다.
  closeModal(restoreFocus = true) {
    if (!App.openModalId) return;
    document.getElementById(App.openModalId).hidden = true;
    App.openModalId = null;
    if (restoreFocus && App.lastFocus && document.contains(App.lastFocus)) {
      App.lastFocus.focus();
    }
  },

  // 화면 아래에 잠깐 보이는 알림
  notify(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(App.toastTimer);
    App.toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 3500);
  },
};

App.init();
