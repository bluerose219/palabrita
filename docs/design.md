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
- 카테고리별 학습 카드: 첫 카드는 "내 단어"(분홍 계열), 그 뒤로 카테고리 카드와 진행률 바

### 2.3 단어장

- 제목 줄: 왼쪽 제목, 오른쪽 "약어 설명" 버튼과 "단어 추가" 버튼
- 필터 줄: 카테고리, 난이도, 구분 선택. 오른쪽에 색 점 범례와 단어 수
- 학습 모드 줄: 스페인어 가리기, 뜻 가리기, 섞기, 원래 순서
- 표: 스페인어(34%), 뜻(38%), 카테고리, 난이도, 구분(색 점) 5열. 관리 열은 없음
- 줄을 누르면 단어 상세 창. 가린 칸을 누르면 상세 창 대신 그 칸만 공개
- 등록·수정 창: 스페인어, 뜻, 품사, 성별(명사일 때만), 카테고리, 난이도

### 2.4 퀴즈

- 설정: 객관식/주관식, 문제 수 10/20/30, 카테고리
- 문제: 진행률 바, 스페인어 단어 카드, 보기 4개 또는 입력창
- 피드백: 정답/오답 색 표시, 해설 `biblioteca — n.f. 도서관`
- 결과: 점수, 정답률, 다시 풀기, 오답노트 이동

### 2.5 오답노트

- 오답 목록 표: 스페인어, 뜻(약어 포함), 틀린 횟수, 마지막으로 틀린 날, 목록에서 제거
- 오답 재시험 버튼

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
- JSON 파싱에 실패하면 기본값을 돌려주고 기존 값은 덮어쓰지 않습니다.
- 저장에 실패하면(저장 공간 부족 등) 안내를 띄우고 기존 데이터는 그대로 둡니다.

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

`stats.js`의 `StudyTimer`가 1초마다 다음 조건을 모두 확인하고, 맞으면 지난 시간(최대 2초)을 더합니다.

1. 현재 화면이 단어장, 퀴즈, 오답노트 중 하나
2. 탭이 보이는 상태(`document.visibilityState === "visible"`)이고 창에 포커스가 있음(`document.hasFocus()`)
3. 마지막 입력(pointer, key, wheel, touch, scroll) 후 5분이 지나지 않음 (`IDLE_LIMIT`)
4. 이 탭이 측정 담당 탭임 (`palabrita.studyTimerOwner`의 다른 탭 갱신이 3초보다 오래됨)

- 날짜 키는 한국 시간(UTC+9) 기준 `YYYY-MM-DD`이며, 매 초 그 시각의 날짜에 더하므로 자정을 넘기면 자동으로 나뉩니다.
- 메모리에 모았다가 5초마다, 그리고 탭을 숨길 때와 페이지를 닫을 때(`pagehide`) localStorage에 읽고-더하고-쓰는 방식으로 저장합니다.
- 입력 감지는 보조 수단이며 실제 집중 여부를 판단하지 않습니다.
- 테스트를 위해 `StudyTimer.now`와 `IDLE_LIMIT`를 바꿀 수 있게 합니다.

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

- 아이콘: 라인 스타일 SVG (stroke 1.8, 둥근 끝)
- 애니메이션: hover 전환만 사용, `prefers-reduced-motion`이면 끔
- 반응형: 1024px 이하 아이콘만 있는 사이드바, 768px 이하 하단 탭 바와 1열 카드
