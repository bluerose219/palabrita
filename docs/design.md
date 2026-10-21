# 설계

## 1. 폴더 구조

```text
palabrita/
├── README.md
├── AGENTS.md
├── .gitignore
├── .nojekyll
├── index.html
├── css/
│   ├── style.css
│   └── responsive.css
├── js/
│   ├── app.js
│   ├── vocabulary.js
│   ├── quiz.js
│   ├── wrong-answers.js
│   ├── storage.js
│   └── stats.js
├── data/
│   ├── words.json
│   └── README.md
├── assets/
│   ├── images/
│   └── icons/
├── docs/
│   ├── requirements.md
│   ├── design.md
│   ├── tasks.md
│   ├── progress.md
│   ├── test-plan.md
│   └── handover.md
├── tests/
│   └── validate-words.js
└── .claude/
    └── skills/
        ├── add-feature/SKILL.md
        └── update-docs/SKILL.md
```

## 2. 화면 구조

`index.html` 한 파일에 화면별 `<section>`을 두고, `app.js`가 주소의 해시로 화면을 바꿉니다.

| 해시 | 화면 | 담당 파일 |
|---|---|---|
| `#home` | 홈 | `app.js` |
| `#vocabulary` | 단어장 | `vocabulary.js` |
| `#quiz` | 퀴즈 | `quiz.js` |
| `#wrong` | 오답노트 | `wrong-answers.js` |
| `#stats` | 학습 통계 | `stats.js` |

### 2.1 공통 레이아웃

- 그라데이션 배경 위에 큰 반투명 유리 프레임을 둡니다.
- 왼쪽 사이드바: 로고 "Palabrita"(보라색 한 가지), 메뉴 5개. 선택된 메뉴는 흰색 알약 모양 배경과 보라색 글씨
- 상단 바: 인사 문구, 단어 검색창(입력하면 단어장으로 이동해 검색), 오답 수 배지

### 2.2 홈

- 최근 퀴즈 정답률 선 그래프 (SVG)
- 통계 카드 4개: 전체 단어, 학습한 단어, 퀴즈 정답률, 오답 단어
- 오늘의 단어 카드: 스페인어, 뜻, 카테고리, 난이도, 퀴즈 시작/단어장 보기 버튼
- 카테고리별 학습 카드: 첫 카드는 "내 단어"(분홍 계열, 한 줄 전체), 그 뒤로 카테고리 10개와 진행률 바. 진행률은 그 카테고리에서 학습한 단어(퀴즈에서 한 번 이상 맞힌 단어)의 비율
- 내 단어가 없으면 "단어 추가하기" 버튼을 보여 주고, 누르면 단어장으로 이동해 추가 창을 엶
- 오늘의 단어: 한국 날짜로 기본 단어 하나를 고름. 하루 동안 같은 단어
- `data/words.json`을 읽지 못하면 화면 위에 원인과 해결 방법을 안내

### 2.3 단어장

- 제목 줄: 왼쪽 제목, 오른쪽 "약어 설명" 버튼과 "단어 추가" 버튼
- 필터 줄: 카테고리, 난이도, 구분 선택. 오른쪽에 색 점 범례와 단어 수
- 학습 모드 줄: 스페인어 가리기, 뜻 가리기, 섞기, 원래 순서
- 표: 스페인어(34%), 뜻(38%), 카테고리, 난이도, 구분(색 점) 5열. 관리 열은 없음
- 줄을 누르거나 줄에 포커스를 두고 Enter를 누르면 단어 상세 창. 가린 칸을 누르면 상세 창 대신 그 칸만 공개
- 상단 검색창: 입력하는 대로 걸러 보여 줌. 스페인어는 악센트 없이도 찾음(cafe로 café), 뜻은 그대로 비교
- 필터를 바꾸면 섞은 순서는 원래대로 돌아감
- 등록·수정 창: 스페인어, 뜻, 품사(선택 안 함 가능), 성별(명사일 때만), 카테고리(필수), 난이도
- 확인과 경고는 브라우저 팝업(confirm, alert) 대신 창 안에서 보여 줌
- 내 단어를 삭제하면 그 단어의 오답 기록도 함께 지움

### 2.3.1 같은 스페인어 등록 처리

| 경우 (기존: banco — 은행, 벤치) | 동작 |
|---|---|
| 철자가 같고 겹치는 뜻이 있음 (`banco` / `은행`, `banco` / `의자, 벤치`) | 저장하지 않고 "이미 단어장에 있는 단어입니다"와 기존 단어 안내 |
| 철자만 같고 뜻이 모두 다름 (`banco` / `의자`) | 창 안에 확인 문구를 띄우고, "따로 저장"을 한 번 더 눌러야 저장 |
| 수정하면서 철자를 바꾸지 않음 | 다시 확인하지 않음 (겹치는 뜻 검사는 그대로) |

- 철자 비교: 앞뒤 공백 제거, 연속 공백 하나로, 대소문자 무시. 악센트는 구분(papa와 papá는 다른 단어)
- 뜻 비교: 쉼표로 나눈 뜻 조각 중 하나라도 같으면 겹치는 뜻
- 퀴즈 영향: 객관식은 같은 철자 단어의 뜻을 오답 보기에서 빼고, 주관식은 같은 철자 단어의 뜻도 정답으로 인정

### 2.4 퀴즈

- 설정: 객관식/주관식, 문제 수 10/20/30, 출제 범위(전체, 카테고리 10개, 내 단어)
  - 범위의 단어가 문제 수보다 적으면 있는 만큼 출제하고 안내
  - 범위에 단어가 없거나, 객관식인데 전체 단어가 4개 미만이면 시작 버튼을 끄고 안내
- 문제: 진행률 바, 스페인어 단어 카드, 보기 4개 또는 입력창
  - 객관식 보기: 뜻만 표시(약어 없음). 오답 보기는 같은 품사에서 먼저 뽑고, 문제 단어와 뜻이 겹치거나 철자가 같은 단어, 보기끼리 뜻이 겹치는 단어는 뺌
  - 주관식 채점: 앞의 품사 약어, 물결표(~), 모든 공백을 지우고 비교. 쉼표로 나눈 뜻 하나만 맞아도 정답. 괄호 부분은 빼거나 넣어도 정답("배(과일)"은 "배"로도 정답). 철자가 같은 다른 단어의 뜻도 정답
  - 키보드: 객관식은 숫자 키 1~4로 답하고, 답한 뒤 Enter로 다음 문제
- 피드백: 정답/오답 색 표시, 해설 `biblioteca — n.f. 도서관`
- 결과: 점수, 정답률, 틀린 단어와 내 답, 다시 풀기, 오답노트 이동, 설정으로
- 기록 시점: 한 문제에 답할 때마다 정답률과 학습한 단어, 오답을 저장합니다. 퀴즈 횟수와 기록 목록은 끝까지 풀었을 때만 늘어납니다. 그만두기를 눌러도 이미 푼 문제는 정답률에 남습니다.
- 다른 화면에 갔다가 돌아오면 진행 중이던 문제가 그대로 이어집니다.

### 2.5 오답노트

- 오답 목록 표: 스페인어, 뜻(약어 포함), 틀린 횟수, 마지막으로 틀린 날, 목록에서 빼기. 틀린 횟수가 많은 순, 같으면 최근에 틀린 순
- 객관식으로 재시험, 주관식으로 재시험 버튼 (오답이 없으면 비활성). 한 번에 최대 30문제
- 재시험에서 맞힌 단어는 오답노트에서 빠지고, 틀리면 틀린 횟수가 늘어남
- 최근 재시험 결과 5개 (날짜, 유형, 문제 수, 오답노트에서 빠진 수, 점수)
- 오답이 없으면 안내 카드와 "퀴즈 풀기" 버튼

### 2.6 학습 통계

위에서부터 다음 순서로 배치합니다.

1. 통계 카드 4개: 총 퀴즈 횟수, 전체 정답률, 학습한 단어, 오답 단어
2. 주간 학습 기록 카드 (전체 폭)
   - 윗줄: 제목, "이번 주" 표시, 날짜 범위, 이전 주/이번 주/다음 주 버튼
   - 왼쪽 요약: 총 학습 시간, 학습 일수(n일 / 7일)와 요일별 점 7개
   - 오른쪽 막대그래프: 월~일. 각 열은 위에서부터 요일, 날짜, 막대, 학습 시간
   - 오늘은 하늘색 막대. 미래 날짜는 점선 빈 막대와 "-"
   - 다음 주 버튼은 이번 주에서, 이전 주 버튼은 가장 오래된 기록 주에서 비활성
3. 최근 퀴즈 정답률 그래프와 최근 기록 목록

## 3. 데이터 구조

### 3.1 기본 단어 (`data/words.json`)

```json
{
  "id": "w101",
  "spanish": "libro",
  "korean": "책",
  "partOfSpeech": "noun",
  "gender": "masculine",
  "category": "school",
  "level": "A1"
}
```

- `id`: `w` + 세 자리 번호 (`w001` ~ `w500`)
- `category`: 영어 키. 화면 표시명은 `vocabulary.js`의 `CATEGORY_LABELS`에서 대응
- `level`: `A1` 또는 `A2`
- `korean`에는 뜻만 저장합니다. 품사 약어를 넣지 않습니다.
- 자세한 규칙은 `data/README.md`를 참고합니다.

### 3.2 사용자 단어

기본 단어와 같은 필드에 `isUser: true`를 붙입니다. id는 `u` + 타임스탬프입니다.
품사가 없는 사용자 단어도 허용하며, 이 경우 약어 없이 뜻만 표시합니다.

### 3.3 localStorage

| 키 | 구조 |
|---|---|
| `palabrita.userWords` | `[ { id, spanish, korean, partOfSpeech, gender, category, level, isUser } ]` |
| `palabrita.wrongAnswers` | `{ "w101": { count, lastWrongAt } }` |
| `palabrita.stats` | `{ quizCount, totalQuestions, correctAnswers, learnedIds: [], history: [ { date, mode, total, correct } ], reviewHistory: [ ... ] }` |
| `palabrita.vocabView` | `{ hideSpanish, hideKorean }` |
| `palabrita.studyTime` | `{ "2026-10-21": 1080 }` (한국 시간 기준 날짜별 학습 시간, 초) |
| `palabrita.studyTimerOwner` | `{ tabId, updatedAt }` |

- 모든 읽기와 쓰기는 `storage.js`를 거칩니다.
- 값을 읽을 수 없으면(JSON이 깨졌거나 모양이 다름) 원래 값을 `키.broken`(예: `palabrita.stats.broken`)에 그대로 보관하고 기본값으로 동작합니다. 사용자 데이터가 사라지지 않게 하기 위해서입니다.
- 통계는 저장된 값에 빠진 항목만 기본값으로 채웁니다.
- 저장에 실패하면(저장 공간 부족 등) 화면 아래 알림으로 안내하고 기존 데이터는 그대로 둡니다. 단어 폼은 입력 내용을 지우지 않습니다.

## 4. 품사 약어

### 4.1 변환 규칙

| partOfSpeech | gender | 약어 |
|---|---|---|
| noun | 없음 | n. |
| noun | masculine | n.m. |
| noun | feminine | n.f. |
| noun | both | n.m.f. |
| noun | common | n.com. |
| verb | - | v. |
| adjective | - | adj. |
| adverb | - | adv. |
| verbPhrase | - | v.phr. |
| pronoun | - | pron. |
| preposition | - | prep. |
| conjunction | - | conj. |
| interjection | - | interj. |
| other | - | etc. |
| 없음 | - | 표시 안 함 |

- 모든 약어는 소문자입니다.
- 공통 함수: `vocabulary.js`의 `getPosAbbr(word)`, `formatMeaning(word)`(약어 + 공백 + 뜻), 상수 `POS_ABBR_LIST`
- 표시 위치: 단어장 뜻 칸, 단어 상세 창, 오답노트, 퀴즈 해설. 객관식 보기에는 표시하지 않습니다.
- 뜻 가리기는 약어까지 가립니다.

### 4.2 약어 설명 창

- 단어장 제목 줄 오른쪽 "약어 설명" 버튼
- 데스크톱: 버튼 아래 폭 300px 팝오버. 표를 가리지 않는 크기
- 768px 이하: 화면 아래에서 올라오는 시트
- 14개 약어와 설명을 2열 표로 표시
- 닫기 버튼, 바깥 클릭, Esc로 닫음. 열리면 창으로, 닫히면 버튼으로 포커스 이동. `aria-expanded`로 상태 표시

## 5. 자동 학습 시간 측정

`stats.js`의 `Stats.timer`가 1초마다 다음 조건을 모두 확인하고, 맞으면 지난 시간(최대 2초)을 더합니다. 파일마다 전역 객체 하나를 둔다는 규칙에 맞춰 `Stats` 안에 두었습니다.

1. 현재 화면이 단어장, 퀴즈, 오답노트 중 하나
2. 탭이 보이는 상태(`document.visibilityState === "visible"`)이고 창에 포커스가 있음(`document.hasFocus()`)
3. 마지막 입력(pointer, key, wheel, touch, scroll) 후 5분이 지나지 않음 (`IDLE_LIMIT`)
4. 이 탭이 측정 담당 탭임 (`palabrita.studyTimerOwner`의 다른 탭 갱신이 3초보다 오래됨)

- 날짜 키는 한국 시간(UTC+9) 기준 `YYYY-MM-DD`입니다. 한 번 더하는 구간이 한국 시간 자정을 넘으면 자정 앞뒤로 나눠 두 날짜에 더합니다.
- 메모리(`pending`)에 모았다가 5초마다, 그리고 창이 포커스를 잃을 때, 탭을 숨길 때, 페이지를 닫을 때(`pagehide`) localStorage에 읽고-더하고-쓰는 방식으로 저장합니다. 그래서 새로고침하거나 닫아도 잃는 시간은 최대 몇 초입니다.
- 탭을 숨기거나 닫으면 측정 담당을 내려놓아(`updatedAt: 0`) 다른 탭이 바로 이어받습니다.
- 숨겨져 있던 탭으로 돌아오면 숨겨진 동안의 시간은 세지 않습니다.
- 입력 감지는 보조 수단이며 실제 집중 여부를 판단하지 않습니다. 5분 기준이므로 자리를 비우면 마지막 입력 후 최대 5분이 더 기록될 수 있습니다.
- 테스트를 위해 `Stats.timer.now`(현재 시각 함수)와 `Stats.timer.IDLE_LIMIT`를 바꿀 수 있게 했습니다.

### 5.1 주간 학습 기록 계산

- 한 주는 월요일부터 일요일까지. 주 합계는 날짜별 기록을 더해 계산합니다.
- 학습 일수는 그날 1분 이상 학습한 날입니다.
- 미래 날짜는 기록이 있어도 표시하지 않고 "-"와 점선 막대로 보여 줍니다. 기록이 없는 지난 날은 0분입니다.
- 막대 높이는 그 주의 가장 긴 날을 30분 단위로 올린 값(최소 60분)을 기준으로 합니다.
- 이전 주 버튼은 기록이 있는 가장 오래된 주에서, 다음 주 버튼은 이번 주에서 비활성입니다.

## 6. 디자인 시스템

`css/style.css`의 `:root`에서 관리합니다.

| 변수 | 값 | 용도 |
|---|---|---|
| `--bg-1`, `--bg-2`, `--bg-3` | #f7f5ff, #ece6fb, #e3f0fb | 배경 그라데이션 (화이트, 연보라, 연하늘) |
| `--glass` | rgba(255,255,255,0.48) | 유리 카드 배경 |
| `--glass-strong` | rgba(255,255,255,0.72) | 버튼, 입력창 배경 |
| `--glass-border` | rgba(255,255,255,0.85) | 얇은 밝은 테두리 |
| `--text` | #2e2a4a | 본문 글자 |
| `--text-sub` | #77739a | 보조 글자 |
| `--primary` | #7b6cd9 | 주 색상 (보라) |
| `--primary-soft` | #e9e4fd | 연한 보라 배경 |
| `--sky` | #8cc4ea | 보조 색상 (하늘) |
| `--correct` | #3fa98a | 정답 |
| `--wrong` | #e0718c | 오답, 내 단어 |
| `--font` | "Segoe UI", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif | 시스템 폰트 |
| `--radius-lg`, `--radius-md`, `--radius-pill` | 28px, 20px, 999px | 둥근 모서리 |
| `--shadow` | 0 10px 30px rgba(110,96,190,0.12) | 그림자 |
| `--blur` | blur(20px) | 유리 효과 |

- 아이콘: 라인 스타일 SVG (stroke 1.8, 둥근 끝). `index.html` 맨 위의 SVG 스프라이트(`<symbol id="i-...">`)에 모아 두고 `<svg class="icon"><use href="#i-home"/></svg>`로 씁니다. 외부 파일로 분리하면 `file://`에서 열 때 아이콘이 보이지 않아 한 파일 안에 둡니다.
- 애니메이션: hover 전환만 사용, `prefers-reduced-motion`이면 끔
- 반응형: 1100px 이하 홈 카드와 통계 카드 2열, 1024px 이하 아이콘만 있는 사이드바, 768px 이하 하단 탭 바와 1열 카드
  - 768px 이하: 단어장 표의 카테고리 열과 오답노트 표의 날짜 열을 숨김, 퀴즈 보기 1열, 약어 설명은 하단 시트, 주간 기록은 요약이 위
  - 창(모달) 너비는 `min(440px, 100%)`라 좁은 화면에서도 넘치지 않음
- 주의: `backdrop-filter`가 있는 요소 안에서는 `position: fixed`가 화면이 아니라 그 요소 기준으로 배치됩니다. 그래서 768px 이하에서는 `.app`의 블러를 끄고 하단 탭 바를 화면에 고정합니다.

### 6.1 공통 컴포넌트 (`style.css`)

| 클래스 | 용도 |
|---|---|
| `.card` | 유리 카드 |
| `.btn`, `.btn-primary`, `.btn-small` | 버튼 (기본, 강조, 작은 버튼) |
| `.chip`, `.chip-sky` | 카테고리, 난이도 표시 |
| `.progress` | 진행률 바 (`<div class="progress"><i style="width:40%"></i></div>`) |
| `.stat`, `.stat-value`, `.stat-label` | 숫자 통계 카드 |
| `.section-head`, `.section-title` | 구역 제목 줄 |
| `.muted`, `.eyebrow` | 보조 글자, 작은 머리글 |
| `.icon` | SVG 아이콘 |
| `.thumb-<카테고리 키>` | 카테고리 카드의 그라데이션 그림 |

### 6.2 공통 함수

| 함수 | 파일 | 설명 |
|---|---|---|
| `Stats.drawAccuracyChart(targetId, labels, values)` | `stats.js` | 정답률(0~100) 선 그래프. 홈과 통계 화면에서 함께 씀 |
| `Stats.kstDateKey(ms)` | `stats.js` | 한국 시간 기준 날짜 "YYYY-MM-DD" |
| `Stats.getSummary()` | `stats.js` | 전체 단어, 학습한 단어, 정답률, 오답 수 |
| `App.showView(view)` | `app.js` | 화면 전환과 메뉴 활성 표시 |
| `App.openModal(overlayId, focusId)`, `App.closeModal()` | `app.js` | 창 열기, 닫기. 바깥 클릭과 Esc로 닫히고 포커스를 되돌림 |
| `App.notify(message)` | `app.js` | 화면 아래 짧은 알림 |
| `Vocabulary.getPosAbbr(word)`, `formatMeaning(word)`, `meaningHtml(word)` | `vocabulary.js` | 품사 약어, "약어 뜻" 글자, 화면용 HTML |
| `Vocabulary.escape(text)` | `vocabulary.js` | 사용자 입력을 HTML에 넣기 전에 특수 문자 바꾸기 |
| `Vocabulary.normalizeSpanish(text)`, `splitMeanings(korean)`, `findSameSpelling(spanish, exceptId)` | `vocabulary.js` | 같은 단어 비교. 퀴즈에서도 씀 |
