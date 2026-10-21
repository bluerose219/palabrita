# 인수인계

이 문서는 Palabrita를 이어서 개발할 사람을 위한 안내입니다.

## 1. 한눈에 보기

| 항목 | 내용 |
|---|---|
| 배포 주소 | https://bluerose219.github.io/palabrita/ |
| 저장소 | https://github.com/bluerose219/palabrita (공개) |
| 배포 방식 | GitHub Pages, `main` 브랜치 루트(`/`). `main`에 push하면 몇 분 안에 자동으로 다시 배포됩니다. |
| 기술 | HTML, CSS, Vanilla JavaScript, JSON, localStorage. 프레임워크, 서버, 외부 API, 웹폰트 없음 |
| 현재 상태 | 1~8단계와 사용자 요청 추가 수정(7-2단계)까지 완료 |

## 2. 먼저 읽을 문서

1. [README.md](../README.md): 프로젝트 소개, 실행 방법, 사용 방법
2. [AGENTS.md](../AGENTS.md): 개발 규칙 (이모지 금지, 한국어 문서와 영어 식별자, 사용자 데이터 보호, Git 규칙, 파일별 역할, localStorage 키)
3. [design.md](design.md): 화면 구성, 데이터 구조, 품사 약어, 학습 시간 측정, 디자인 시스템과 공통 함수
4. [requirements.md](requirements.md): 기능 요구사항 번호표 (F-HOME, F-VOC, F-QUIZ, F-ADD 등)
5. [test-plan.md](test-plan.md): 테스트 항목과 실제 결과
6. [progress.md](progress.md): 단계별 작업 기록과 문제 해결 기록
7. [data/README.md](../data/README.md): 기본 단어 데이터 규칙

## 3. 개발 환경

- 편집기: 아무 편집기나 사용 가능 (VS Code 권장)
- 브라우저: Chrome 최신 버전
- Node.js: 단어 데이터 검증에만 사용 (`node tests/validate-words.js`)
- Python: 로컬 확인용 임시 서버에만 사용

```bash
python -m http.server 8000
# 브라우저에서 http://localhost:8000 열기
```

`index.html`을 파일로 직접 열면 브라우저가 `data/words.json`을 읽지 못합니다. 이 경우 화면 위에 원인과 해결 방법이 안내됩니다.

## 4. 코드 구조 요약

- `index.html` 한 파일에 화면 5개(`#home`, `#vocabulary`, `#quiz`, `#wrong`, `#stats`)가 있고 `js/app.js`가 주소의 해시로 화면을 바꿉니다.
- 스크립트는 ES 모듈 없이 순서대로 불러옵니다: `storage.js` → `vocabulary.js` → `quiz.js` → `wrong-answers.js` → `stats.js` → `app.js`
- 파일마다 전역 객체 하나(`Storage`, `Vocabulary`, `Quiz`, `WrongAnswers`, `Stats`, `App`)를 둡니다. 학습 시간 측정은 `Stats.timer`입니다.
- localStorage는 반드시 `storage.js`를 통해서만 읽고 씁니다. 키는 모두 `palabrita.`로 시작합니다.
- 아이콘은 `index.html` 맨 위 SVG 스프라이트에 있습니다. 메뉴 아이콘은 `i-*`, 카테고리 아이콘은 `c-*`입니다.

## 5. 자주 하는 작업

### 5.1 기본 단어 추가·수정

1. `data/words.json`을 수정합니다. 규칙은 [data/README.md](../data/README.md)를 따릅니다.
   - id는 바꾸지 않습니다. 사용자의 오답 기록, 학습 기록, 외운 단어 체크가 id로 연결되어 있습니다.
   - 새 단어는 파일 맨 끝에 다음 번호로 추가합니다.
   - 동사와 동사구는 `present`(현재시제 6개 형태)가 꼭 있어야 합니다.
2. `node tests/validate-words.js`로 검증합니다.
3. 카테고리별 개수를 바꾸면 검증 코드의 `CATEGORY_COUNTS`와 data/README.md를 함께 고칩니다.

### 5.2 새 기능 추가

`.claude/skills/add-feature/SKILL.md` 절차를 따릅니다. 요약하면 요구사항 확인, 관련 파일 확인, 영향 분석, `feature/<이름>` 브랜치에서 구현, 테스트, 문서 갱신, 보고 순서입니다.

### 5.3 문서 갱신

`.claude/skills/update-docs/SKILL.md` 절차를 따릅니다. 바뀐 내용에 따라 고쳐야 할 문서가 표로 정리되어 있습니다.

### 5.4 배포

1. 기능 브랜치에서 작업하고 테스트합니다.
2. Pull Request를 만들어 `main`에 병합하거나, `git merge --no-ff`로 병합한 뒤 `git push origin main`을 실행합니다.
3. 몇 분 뒤 배포 주소에서 바뀐 내용을 확인합니다. 저장소의 Actions 탭에서 "pages build and deployment" 진행 상황을 볼 수 있습니다.
4. 브라우저가 옛 파일을 보여 주면 강력 새로고침(Ctrl+Shift+R)을 합니다. 옛 `index.html`과 새 JS가 섞이면 오류가 날 수 있습니다.

## 6. 주의사항

- 사용자 데이터는 각자의 브라우저 localStorage에만 있습니다. 다른 기기나 브라우저와 공유되지 않고, 코드에서 임의로 지우면 복구할 수 없습니다.
- 배포 주소의 도메인(`bluerose219.github.io`)은 같은 계정의 다른 Pages 사이트와 저장 공간을 함께 씁니다. 그래서 키에 `palabrita.` 접두사를 붙입니다.
- 읽을 수 없는 저장값은 지우지 않고 `키.broken`에 보관합니다.
- 학습 시간 측정은 입력 감지를 이용한 추정값이며 실제 집중 여부를 판단하지 않습니다. 5분 동안 입력이 없으면 멈추므로 자리를 비우면 최대 5분이 더 기록될 수 있습니다.
- 사용자가 추가한 동사의 현재시제는 규칙 변화로 계산하므로 불규칙 동사는 실제와 다를 수 있습니다. 화면에도 이 안내가 나옵니다.
- 작업 파일의 줄바꿈이 Windows에서는 CRLF로 바뀔 수 있습니다(Git autocrlf). 스크립트로 문자열을 바꿀 때 주의하세요.
- 프로젝트 전체에서 이모지를 쓰지 않습니다. 커밋 메시지도 마찬가지입니다.

## 7. 알려진 한계

- Chrome 자동화 도구의 스크린샷 기능이 개발 중 계속 시간 초과되어, 레이아웃은 측정값(넘친 요소, 가로 스크롤 여부)으로 확인했습니다. 사람이 눈으로 화면을 확인한 것은 사용자의 시안 검토뿐입니다.
- 기본 단어의 뜻과 동사 변화형은 작성자가 확인했지만 원어민 검토는 받지 않았습니다.
- 데이터 백업(내보내기, 가져오기) 기능이 없어 기기를 바꾸면 사용자 데이터를 옮길 수 없습니다.

## 8. 개선 아이디어

- 사용자 데이터 내보내기, 가져오기 (JSON 파일)
- 퀴즈에서 외운 단어 빼기 선택
- 자주 틀린 단어는 재시험에서 두 번 이상 맞혀야 오답노트에서 빠지게 하기
- 단어장에서 보낸 시간만 따로 세어 홈 "단어 보기" 단계 기준으로 쓰기
- 스페인어 발음 듣기 (브라우저 내장 음성 합성, 외부 API 없이)
- 기본 단어 원어민 검토
