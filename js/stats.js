// 학습 통계와 학습 시간 측정
// - 퀴즈 기록 저장, 통계 화면, 주간 학습 기록
// - Stats.timer: 단어장, 퀴즈, 오답노트를 이용하는 동안 학습 시간을 자동으로 잽니다.

// 한국 시간은 UTC보다 9시간 빠릅니다.
const KST_OFFSET = 9 * 60 * 60 * 1000;
const DAY_NAMES = ["월", "화", "수", "목", "금", "토", "일"];

const Stats = {
  viewMonday: null, // 주간 기록에서 보고 있는 주의 월요일 "YYYY-MM-DD"

  // ---------- 날짜 ----------

  // 한국 시간 기준 날짜 문자열 "YYYY-MM-DD"
  kstDateKey(ms) {
    return new Date(ms + KST_OFFSET).toISOString().slice(0, 10);
  },

  // "2026-10-21"에 n일을 더한 날짜
  addDays(dateKey, n) {
    const date = new Date(dateKey + "T00:00:00Z");
    date.setUTCDate(date.getUTCDate() + n);
    return date.toISOString().slice(0, 10);
  },

  // 그 날짜가 속한 주의 월요일 (한 주는 월요일부터 일요일까지)
  mondayOf(dateKey) {
    const day = new Date(dateKey + "T00:00:00Z").getUTCDay(); // 0=일요일, 1=월요일
    return Stats.addDays(dateKey, -((day + 6) % 7));
  },

  // 초 -> "1시간 5분" 또는 "45분"
  formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}시간 ${minutes % 60}분`;
    }
    return `${minutes}분`;
  },

  // 홈과 통계 화면에 보여 줄 숫자를 계산합니다.
  // 지금 단어장에 없는 단어(삭제한 사용자 단어 등)의 기록은 세지 않습니다.
  getSummary() {
    const stats = Storage.getStats();
    const wrongAnswers = Storage.getWrongAnswers();
    const allWords = Vocabulary.getAllWords();
    const existingIds = new Set(allWords.map((word) => word.id));

    const learnedIds = stats.learnedIds.filter((id) => existingIds.has(id));
    const wrongIds = Object.keys(wrongAnswers).filter((id) => existingIds.has(id));
    let accuracy = 0;
    if (stats.totalQuestions > 0) {
      accuracy = Math.round((stats.correctAnswers / stats.totalQuestions) * 100);
    }

    return {
      totalWords: allWords.length,
      learnedIds: learnedIds,
      learnedCount: learnedIds.length,
      wrongCount: wrongIds.length,
      accuracy: accuracy,
      quizCount: stats.quizCount,
      totalQuestions: stats.totalQuestions,
      history: stats.history,
    };
  },

  // 한 문제에 답할 때마다 부릅니다.
  recordAnswer(wordId, correct) {
    const stats = Storage.getStats();
    stats.totalQuestions++;
    if (correct) {
      stats.correctAnswers++;
      if (!stats.learnedIds.includes(wordId)) {
        stats.learnedIds.push(wordId);
      }
    }
    Storage.saveStats(stats);
  },

  // 퀴즈를 끝까지 풀면 부릅니다. result: { mode, total, correct, review, cleared }
  recordQuiz(result) {
    const stats = Storage.getStats();
    const date = Stats.kstDateKey(Date.now());
    stats.quizCount++;
    stats.history.push({ date: date, mode: result.mode, total: result.total, correct: result.correct, review: result.review });
    if (result.review) {
      stats.reviewHistory.push({ date: date, mode: result.mode, total: result.total, correct: result.correct, cleared: result.cleared });
    }
    // 기록이 너무 길어지지 않게 최근 200개만 남깁니다.
    stats.history = stats.history.slice(-200);
    stats.reviewHistory = stats.reviewHistory.slice(-200);
    Storage.saveStats(stats);
  },

  // 최근 퀴즈 count회의 날짜(MM-DD)와 정답률
  getRecentAccuracy(count) {
    const recent = Storage.getStats().history.slice(-count);
    return {
      labels: recent.map((item) => item.date.slice(5)),
      values: recent.map((item) => (item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0)),
    };
  },

  // ---------- 통계 화면 ----------

  init() {
    document.getElementById("week-prev").addEventListener("click", () => Stats.moveWeek(-7));
    document.getElementById("week-next").addEventListener("click", () => Stats.moveWeek(7));
    document.getElementById("week-today").addEventListener("click", () => {
      Stats.viewMonday = null;
      Stats.renderWeek();
    });
  },

  render() {
    const summary = Stats.getSummary();
    document.getElementById("stat-quiz-count").textContent = summary.quizCount;
    document.getElementById("stat-accuracy").textContent = summary.accuracy + "%";
    document.getElementById("stat-learned").textContent = summary.learnedCount;
    document.getElementById("stat-wrong").textContent = summary.wrongCount;

    Stats.renderWeek();

    const recent = Stats.getRecentAccuracy(10);
    Stats.drawAccuracyChart("stats-chart", recent.labels, recent.values);
    Stats.renderHistory(summary.history);
  },

  renderHistory(history) {
    const list = document.getElementById("history-list");
    const recent = history.slice(-8).reverse();
    if (recent.length === 0) {
      list.innerHTML = '<li class="muted">아직 퀴즈 기록이 없어요.</li>';
      return;
    }
    list.innerHTML = recent
      .map((item) => {
        const mode = item.mode === "choice" ? "객관식" : "주관식";
        const label = item.review ? "오답 재시험" : mode;
        const detail = item.review ? ` (${mode})` : "";
        return `<li><span>${item.date.slice(5)} · ${label} ${item.total}문제${detail}</span><span class="num">${item.correct} / ${item.total}</span></li>`;
      })
      .join("");
  },

  moveWeek(days) {
    const thisMonday = Stats.mondayOf(Stats.kstDateKey(Stats.timer.now()));
    Stats.viewMonday = Stats.addDays(Stats.viewMonday || thisMonday, days);
    Stats.renderWeek();
  },

  // 기록이 있는 가장 오래된 주의 월요일. 기록이 없으면 이번 주
  getEarliestMonday(studyTime, thisMonday) {
    const keys = Object.keys(studyTime).filter((key) => studyTime[key] > 0).sort();
    return keys.length > 0 ? Stats.mondayOf(keys[0]) : thisMonday;
  },

  renderWeek() {
    const today = Stats.kstDateKey(Stats.timer.now());
    const thisMonday = Stats.mondayOf(today);
    const studyTime = Stats.timer.getAll();
    const earliest = Stats.getEarliestMonday(studyTime, thisMonday);

    // 보고 있는 주가 범위를 벗어나지 않게 합니다.
    let monday = Stats.viewMonday || thisMonday;
    if (monday > thisMonday) monday = thisMonday;
    if (monday < earliest) monday = earliest;
    Stats.viewMonday = monday;

    const days = [];
    for (let i = 0; i < 7; i++) {
      const key = Stats.addDays(monday, i);
      const isFuture = key > today;
      days.push({
        key: key,
        seconds: isFuture ? 0 : studyTime[key] || 0, // 미래 날짜는 기록이 있어도 보여 주지 않습니다.
        isFuture: isFuture,
        isToday: key === today,
      });
    }

    const total = days.reduce((sum, day) => sum + day.seconds, 0);
    const studiedDays = days.filter((day) => day.seconds >= 60).length; // 1분 이상 학습한 날
    const maxMinutes = Math.max(...days.map((day) => day.seconds / 60));
    const scaleMinutes = Math.max(60, Math.ceil(maxMinutes / 30) * 30); // 막대 높이 기준 (최소 60분)

    const sunday = Stats.addDays(monday, 6);
    document.getElementById("week-range").textContent =
      `${monday.replace(/-/g, ".")} (월) - ${sunday.slice(5).replace("-", ".")} (일)`;
    document.getElementById("week-current-chip").hidden = monday !== thisMonday;
    document.getElementById("week-total").textContent = Stats.formatDuration(total);
    document.getElementById("week-days").innerHTML = `${studiedDays}일 <small>/ 7일</small>`;

    document.getElementById("week-dots").innerHTML = days
      .map((day) => {
        let className = "";
        if (day.isFuture) className = "future";
        else if (day.seconds >= 60) className = "on";
        return `<i class="${className}"></i>`;
      })
      .join("");

    const chart = document.getElementById("week-chart");
    chart.setAttribute("aria-label", `요일별 학습 시간, 합계 ${Stats.formatDuration(total)}`);
    chart.innerHTML = days
      .map((day, index) => {
        const minutes = Math.floor(day.seconds / 60);
        const height = day.isFuture ? 0 : Math.round((minutes / scaleMinutes) * 100);
        const classes = ["day-col"];
        if (day.isFuture) classes.push("future");
        if (day.isToday) classes.push("today");
        return `
          <div class="${classes.join(" ")}">
            <span class="day-name">${DAY_NAMES[index]}</span>
            <span class="day-date">${day.key.slice(5).replace("-", ".")}</span>
            <div class="day-track"><div class="day-fill" style="height:${height}%"></div></div>
            <span class="day-value">${day.isFuture ? "-" : minutes + "분"}</span>
          </div>`;
      })
      .join("");

    document.getElementById("week-prev").disabled = monday <= earliest;
    document.getElementById("week-next").disabled = monday >= thisMonday;
    document.getElementById("week-today").disabled = monday === thisMonday;
  },

  // 정답률(0~100) 선 그래프를 SVG로 그립니다.
  // labels: x축 글자 목록, values: 정답률 목록 (labels와 개수가 같아야 함)
  drawAccuracyChart(targetId, labels, values) {
    const target = document.getElementById(targetId);
    if (!target) {
      return;
    }

    if (values.length === 0) {
      target.innerHTML = '<p class="muted">아직 퀴즈 기록이 없어요.</p>';
      return;
    }

    const width = 320;
    const height = 170;
    const left = 34;
    const right = 14;
    const top = 16;
    const bottom = 26;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;

    // 값 하나를 화면 좌표로 바꿉니다.
    function x(index) {
      if (values.length === 1) {
        return left + plotWidth / 2;
      }
      return left + (plotWidth * index) / (values.length - 1);
    }
    function y(value) {
      return top + plotHeight - (plotHeight * value) / 100;
    }

    let svg = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="최근 ${values.length}회 퀴즈 정답률">`;
    svg += `<defs><linearGradient id="${targetId}-fill" x1="0" y1="0" x2="0" y2="1">`;
    svg += '<stop offset="0" stop-color="#7b6cd9" stop-opacity="0.28"/>';
    svg += '<stop offset="1" stop-color="#7b6cd9" stop-opacity="0"/></linearGradient></defs>';

    // 가로 눈금선 (0%, 50%, 100%)
    for (const tick of [0, 50, 100]) {
      svg += `<line x1="${left}" x2="${width - right}" y1="${y(tick)}" y2="${y(tick)}" stroke="#ffffff" stroke-width="1"/>`;
      svg += `<text x="${left - 6}" y="${y(tick) + 3}" text-anchor="end">${tick}%</text>`;
    }

    // 선과 아래 채우기
    const points = values.map((value, index) => `${x(index)} ${y(value)}`);
    const line = "M" + points.join(" L");
    const lastIndex = values.length - 1;
    const area = `${line} L${x(lastIndex)} ${y(0)} L${x(0)} ${y(0)} Z`;
    svg += `<path d="${area}" fill="url(#${targetId}-fill)"/>`;
    svg += `<path d="${line}" fill="none" stroke="#7b6cd9" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`;

    // 마지막 값 강조
    const lastValue = values[lastIndex];
    svg += `<circle cx="${x(lastIndex)}" cy="${y(lastValue)}" r="4.5" fill="#ffffff" stroke="#7b6cd9" stroke-width="2"/>`;
    svg += `<text class="chart-last" x="${x(lastIndex) - 8}" y="${y(lastValue) - 8}" text-anchor="end">${lastValue}%</text>`;

    // x축 글자
    labels.forEach((label, index) => {
      svg += `<text x="${x(index)}" y="${height - 8}" text-anchor="middle">${label}</text>`;
    });

    target.innerHTML = svg + "</svg>";
  },
};

// ---------- 자동 학습 시간 측정 ----------
// 1초마다 아래 조건을 모두 확인하고, 맞으면 지난 시간을 오늘 날짜에 더합니다.
// 1. 지금 화면이 단어장, 퀴즈, 오답노트 중 하나
// 2. 탭이 화면에 보이고 창에 포커스가 있음
// 3. 마지막 입력(마우스, 키보드, 터치, 스크롤) 후 5분이 지나지 않음
// 4. 이 탭이 측정 담당 탭임 (여러 탭을 열어도 한 탭만 잼)
// 입력 감지는 보조 수단일 뿐, 실제로 집중했는지는 알 수 없습니다.
Stats.timer = {
  STUDY_VIEWS: ["vocabulary", "quiz", "wrong"],
  IDLE_LIMIT: 5 * 60 * 1000, // 5분 동안 입력이 없으면 멈춤
  OWNER_TIMEOUT: 3000, // 담당 탭이 3초 넘게 소식이 없으면 다른 탭이 맡음
  SAVE_INTERVAL: 5000, // 5초마다 저장
  MAX_STEP: 2000, // 한 번에 더하는 시간은 최대 2초 (탭이 멈췄다 돌아온 경우 대비)

  tabId: "tab-" + Date.now() + "-" + Math.floor(Math.random() * 100000),
  view: "home",
  lastActivity: 0,
  lastTick: 0,
  lastSave: 0,
  pending: {}, // 아직 저장하지 않은 시간 { "2026-10-21": 초 }
  intervalId: null,

  // 테스트에서 시간을 바꿔 볼 수 있도록 현재 시각을 함수로 둡니다.
  now() {
    return Date.now();
  },

  start() {
    const timer = Stats.timer;
    const now = timer.now();
    timer.lastActivity = now;
    timer.lastTick = now;
    timer.lastSave = now;

    const markActivity = () => {
      timer.lastActivity = timer.now();
    };
    for (const name of ["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "scroll"]) {
      window.addEventListener(name, markActivity, { passive: true, capture: true });
    }

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        timer.save();
        timer.releaseOwner();
      } else {
        // 숨겨져 있던 동안의 시간은 세지 않습니다.
        timer.lastTick = timer.now();
      }
    });
    window.addEventListener("blur", () => timer.save());
    window.addEventListener("pagehide", () => {
      timer.save();
      timer.releaseOwner();
    });

    timer.intervalId = setInterval(timer.tick, 1000);
  },

  // 화면이 바뀔 때 app.js가 부릅니다.
  setView(view) {
    Stats.timer.view = view;
    Stats.timer.lastActivity = Stats.timer.now();
  },

  isStudying(now) {
    const timer = Stats.timer;
    return (
      timer.STUDY_VIEWS.includes(timer.view) &&
      document.visibilityState === "visible" &&
      document.hasFocus() &&
      now - timer.lastActivity < timer.IDLE_LIMIT
    );
  },

  // 다른 탭이 측정 중이면 false. 아니면 이 탭이 맡고 true
  claimOwner(now) {
    const timer = Stats.timer;
    const owner = Storage.getTimerOwner();
    if (owner && owner.tabId !== timer.tabId && now - owner.updatedAt < timer.OWNER_TIMEOUT) {
      return false;
    }
    Storage.saveTimerOwner({ tabId: timer.tabId, updatedAt: now });
    return true;
  },

  // 탭을 숨기거나 닫을 때 다른 탭이 바로 맡을 수 있게 비켜 줍니다.
  releaseOwner() {
    const owner = Storage.getTimerOwner();
    if (owner && owner.tabId === Stats.timer.tabId) {
      Storage.saveTimerOwner({ tabId: owner.tabId, updatedAt: 0 });
    }
  },

  tick() {
    const timer = Stats.timer;
    const now = timer.now();
    const step = Math.min(Math.max(now - timer.lastTick, 0), timer.MAX_STEP);
    timer.lastTick = now;

    if (step > 0 && timer.isStudying(now) && timer.claimOwner(now)) {
      timer.addTime(now - step, now);
    }
    if (now - timer.lastSave >= timer.SAVE_INTERVAL) {
      timer.save();
    }
  },

  // start~end 사이의 시간을 날짜별로 나눠 더합니다. (자정을 넘기면 두 날짜로 나뉨)
  addTime(start, end) {
    const timer = Stats.timer;
    const endKey = Stats.kstDateKey(end);
    const startKey = Stats.kstDateKey(start);
    if (startKey === endKey) {
      timer.pending[endKey] = (timer.pending[endKey] || 0) + (end - start) / 1000;
      return;
    }
    // 한국 시간 자정 시각 (UTC 기준으로는 전날 15시)
    const midnight = Date.parse(endKey + "T00:00:00Z") - KST_OFFSET;
    timer.pending[startKey] = (timer.pending[startKey] || 0) + (midnight - start) / 1000;
    timer.pending[endKey] = (timer.pending[endKey] || 0) + (end - midnight) / 1000;
  },

  // 모아 둔 시간을 저장된 값에 더해 저장합니다. 다른 탭이 저장한 값도 지워지지 않습니다.
  save() {
    const timer = Stats.timer;
    timer.lastSave = timer.now();
    const keys = Object.keys(timer.pending);
    if (keys.length === 0) return;

    const studyTime = Storage.getStudyTime();
    for (const key of keys) {
      const total = (Number(studyTime[key]) || 0) + timer.pending[key];
      studyTime[key] = Math.round(total * 10) / 10;
    }
    if (Storage.saveStudyTime(studyTime)) {
      timer.pending = {};
    }
  },

  // 저장된 시간 + 아직 저장하지 않은 시간
  getAll() {
    const studyTime = Object.assign({}, Storage.getStudyTime());
    for (const key in Stats.timer.pending) {
      studyTime[key] = (Number(studyTime[key]) || 0) + Stats.timer.pending[key];
    }
    return studyTime;
  },
};
