# AGENTS.md

Palabrita 프로젝트에서 작업하는 사람과 AI 에이전트가 따라야 할 규칙입니다.
작업을 시작하기 전에 이 문서를 먼저 읽어 주세요.

## 1. 최우선 규칙

### 1.1 이모지 사용 금지

프로젝트 전체에서 이모지를 사용하지 않습니다.

- 웹사이트의 제목, 메뉴, 버튼, 카드, 알림에 이모지를 넣지 않습니다.
- README.md, AGENTS.md, docs 문서, 코드 주석, 커밋 메시지, PR 설명에 이모지를 넣지 않습니다.
- 폴더 구조를 설명할 때도 이모지를 쓰지 않습니다.
- 작업 결과 보고와 설명에도 이모지를 쓰지 않습니다.
- 장식이 필요하면 CSS 또는 `assets/icons/`의 SVG 아이콘(라인 스타일, 한 세트로 통일)을 사용합니다.

### 1.2 언어 규칙

- 질문, 선택지, 계획, 진행 보고, 작업 결과는 한국어로 작성합니다.
- README.md, AGENTS.md, docs 문서, data/README.md는 한국어로 작성합니다.
- 코드 주석은 한국어로 작성합니다.
- 변수명, 함수명, 파일명, 폴더명, localStorage 키, JSON 필드명은 영어로 작성합니다.

### 1.3 사용자 데이터 보호

- localStorage의 사용자 데이터(사용자 단어, 오답 기록, 통계, 학습 시간)를 코드에서 임의로 지우거나 초기화하지 않습니다.
- 저장된 값을 읽다가 오류가 나도 기본값만 돌려주고 기존 값을 덮어쓰지 않습니다.
- 전체 초기화 기능은 사용자의 명시적인 확인을 거쳐야만 실행됩니다.

## 2. 기술 규칙

- 사용 기술: HTML5, CSS3, Vanilla JavaScript, JSON, localStorage
- 사용 금지: React, Vue 등 프레임워크, Flask, Django 등 백엔드, 외부 데이터베이스, 외부 API, CDN, 웹폰트
- GitHub Pages에서 서버 없이 동작해야 합니다. 모든 경로는 상대 경로로 씁니다.
- ES 모듈(`import`/`export`)을 쓰지 않고 일반 `<script>` 태그로 불러옵니다.
- Python 기초만 배운 학생도 읽을 수 있게 짧고 단순하게 작성합니다.
  - 파일마다 전역 객체 하나를 둡니다. 예: `Storage`, `Vocabulary`, `Quiz`
  - 함수는 한 가지 일만 하도록 짧게 나눕니다.
  - 복잡한 문법보다 읽기 쉬운 문법을 우선합니다.
- 색상, 폰트, 둥근 모서리, 그림자, 유리 효과는 `css/style.css`의 `:root` CSS 변수로 관리합니다.
- 애니메이션은 hover 전환 정도로만 사용합니다.

## 3. 파일별 역할

| 파일 | 역할 |
|---|---|
| `index.html` | 단일 페이지. 화면별 `<section>`과 스크립트 로드 |
| `css/style.css` | CSS 변수, 공통 컴포넌트, 화면별 스타일 |
| `css/responsive.css` | 1024px, 768px 기준 반응형 스타일 |
| `js/storage.js` | localStorage 읽기와 쓰기. 다른 파일은 localStorage를 직접 쓰지 않음 |
| `js/vocabulary.js` | 단어 데이터 로드, 기본/사용자 단어 병합, 검색과 필터(여러 카테고리), 페이지 나누기, 외운 단어 체크, 동사 현재시제, 사용자 단어 등록/수정/삭제, 품사 약어 공통 함수, 단어장 화면 |
| `js/quiz.js` | 객관식/주관식 퀴즈 출제, 채점, 결과 화면 |
| `js/wrong-answers.js` | 오답 기록, 오답 목록, 오답 재시험 |
| `js/stats.js` | 학습 통계 계산과 화면, 주간 학습 기록, 자동 학습 시간 측정 |
| `js/app.js` | 초기화, 화면 전환(해시 라우팅), 홈 화면 |
| `data/words.json` | 기본 단어 500개 (읽기 전용) |
| `tests/validate-words.js` | 기본 단어 데이터 검증 (Node로 실행) |
| `docs/` | 요구사항, 설계, 작업 계획, 진행 기록, 테스트 계획, 인수인계 문서 |

스크립트 로드 순서: `storage.js` → `vocabulary.js` → `quiz.js` → `wrong-answers.js` → `stats.js` → `app.js`

## 4. localStorage 키

모든 키는 `palabrita.` 접두사를 씁니다. 같은 GitHub 계정의 다른 Pages 사이트와 저장 공간을 함께 쓰기 때문입니다.

| 키 | 내용 |
|---|---|
| `palabrita.userWords` | 사용자 단어 배열 |
| `palabrita.wrongAnswers` | 오답 기록 |
| `palabrita.stats` | 퀴즈 통계와 기록 |
| `palabrita.vocabView` | 단어장 가리기 설정 |
| `palabrita.memorized` | 외운 단어로 체크한 단어와 체크한 날짜 |
| `palabrita.studyTime` | 날짜별 학습 시간(초) |
| `palabrita.studyTimerOwner` | 여러 탭 중 학습 시간을 측정하는 탭 정보 |

새 키를 추가하면 이 표와 `docs/design.md`를 함께 갱신합니다.

## 5. Git 규칙

- 기본 브랜치는 `main`입니다.
- 기능마다 `feature/<이름>` 브랜치를 만들어 작업합니다. 예: `feature/vocabulary`
- 기능 단위로 작게 커밋합니다.
- 커밋 메시지는 `종류: 한국어 설명` 형식으로 씁니다. 이모지는 넣지 않습니다.
  - `feat`: 기능 추가
  - `fix`: 버그 수정
  - `docs`: 문서 변경
  - `style`: 디자인, CSS 변경
  - `refactor`: 동작 변화 없는 코드 정리
  - `test`: 테스트 추가, 수정
  - `chore`: 설정, 기타
  - 예: `feat: 단어장 검색 기능 추가`
- 작업이 끝나면 Pull Request로 `main`에 병합하는 것을 권장합니다. 원격 저장소가 없을 때는 `git merge --no-ff`로 병합합니다.
- 원격 저장소 생성, push, 배포 설정은 사용자의 승인을 받은 뒤 진행합니다.

## 6. 작업 절차

- 새 기능은 `.claude/skills/add-feature/SKILL.md` 절차를 따릅니다.
- 코드를 바꾸면 `.claude/skills/update-docs/SKILL.md` 절차로 관련 문서를 갱신합니다.
- 작업 결과는 다음 항목으로 보고합니다: 완료한 작업, 생성하거나 수정한 파일, 테스트 결과, 발생한 문제, 다음 작업
- 실제로 실행하지 않은 테스트나 작업을 완료했다고 보고하지 않습니다.
- `docs/progress.md`에 진행 상황과 문제 해결 내역을 기록합니다.
