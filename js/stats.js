// 학습 통계와 학습 시간 측정
// 통계 화면과 학습 시간 측정은 6단계에서 작성합니다.

// 한국 시간은 UTC보다 9시간 빠릅니다.
const KST_OFFSET = 9 * 60 * 60 * 1000;

const Stats = {
  // 한국 시간 기준 날짜 문자열 "YYYY-MM-DD"
  kstDateKey(ms) {
    return new Date(ms + KST_OFFSET).toISOString().slice(0, 10);
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
