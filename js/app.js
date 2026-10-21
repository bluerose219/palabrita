// 초기화, 화면 전환, 홈 화면

// 2단계 임시 데이터: 화면 모양을 확인하기 위한 값입니다.
// 4~6단계에서 실제 단어, 통계, 오답 데이터로 바꿉니다.
const SAMPLE_HOME = {
  totalWords: 500,
  learnedWords: 86,
  accuracy: 78,
  wrongWords: 12,
  chartLabels: ["10-13", "10-14", "10-15", "10-16", "10-17", "10-18", "10-19"],
  chartValues: [55, 62, 58, 80, 70, 60, 90],
  todayWord: { spanish: "mariposa", korean: "나비", category: "동물·자연", level: "A1" },
  categories: [
    { key: "user", name: "내 단어", count: 3, progress: 33 },
    { key: "greetings", name: "인사·기본 표현", count: 40, progress: 62 },
    { key: "food", name: "음식·음료", count: 70, progress: 31 },
    { key: "nature", name: "동물·자연", count: 50, progress: 18 },
    { key: "people", name: "사람·가족", count: 50, progress: 24 },
    { key: "numbers", name: "숫자·시간", count: 60, progress: 45 },
  ],
};

// 해시(#home 등)로 고를 수 있는 화면 목록
const VIEWS = ["home", "vocabulary", "quiz", "wrong", "stats"];

const App = {
  currentView: "home",

  init() {
    window.addEventListener("hashchange", () => App.showView(App.getViewFromHash()));
    App.setupSearch();
    App.renderHome();
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

    if (view === "home") {
      App.renderHome();
    }
  },

  // 상단 검색창: Enter를 누르면 단어장으로 이동합니다. 실제 검색은 4단계에서 연결합니다.
  setupSearch() {
    const input = document.getElementById("top-search");
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        location.hash = "#vocabulary";
      }
    });
  },

  renderHome() {
    const data = SAMPLE_HOME;

    document.getElementById("home-total").textContent = data.totalWords;
    document.getElementById("home-learned").textContent = data.learnedWords;
    document.getElementById("home-accuracy").textContent = data.accuracy + "%";
    document.getElementById("home-wrong").textContent = data.wrongWords;
    document.getElementById("wrong-badge-count").textContent = data.wrongWords;

    document.getElementById("today-word").textContent = data.todayWord.spanish;
    document.getElementById("today-mean").textContent = data.todayWord.korean;
    document.getElementById("today-meta").innerHTML =
      `<span class="chip">${data.todayWord.category}</span>` +
      `<span class="chip chip-sky">${data.todayWord.level}</span>`;

    Stats.drawAccuracyChart("home-chart", data.chartLabels, data.chartValues);
    App.renderCategoryCards(data.categories);
  },

  renderCategoryCards(categories) {
    const cards = categories.map((category) => {
      const isUser = category.key === "user";
      const description = isUser ? `${category.count}단어 · 직접 추가한 단어` : `${category.count}단어`;
      return `
        <div class="card cat-card${isUser ? " is-user" : ""}">
          <div class="cat-thumb thumb-${category.key}"></div>
          <div class="cat-body">
            <p class="cat-name">${category.name}</p>
            <span class="muted">${description}</span>
            <div class="progress-row">
              <div class="progress"><i style="width:${category.progress}%"></i></div>
              <span class="progress-num">${category.progress}%</span>
            </div>
            <a class="btn btn-small" href="#vocabulary">학습하기 <svg class="icon"><use href="#i-arrow"/></svg></a>
          </div>
        </div>`;
    });
    document.getElementById("cat-grid").innerHTML = cards.join("");
  },
};

App.init();
