# 인수인계

이 문서는 Palabrita를 이어서 개발할 사람을 위한 안내입니다. 8단계에서 최종 내용으로 완성합니다.

## 1. 먼저 읽을 문서

1. [README.md](../README.md): 프로젝트 소개와 실행 방법
2. [AGENTS.md](../AGENTS.md): 개발 규칙 (이모지 금지, 언어 규칙, Git 규칙)
3. [design.md](design.md): 화면, 데이터 구조, 디자인 시스템
4. [progress.md](progress.md): 지금까지 한 작업과 문제 해결 기록

## 2. 개발 환경

- 편집기: 아무 편집기나 사용 가능 (VS Code 권장)
- 브라우저: Chrome 최신 버전
- Node.js: 단어 데이터 검증에만 사용
- Python: 로컬 확인용 임시 서버에만 사용 (`python -m http.server 8000`)

## 3. 현재 상태

- 3단계(기본 단어 500개와 검증)까지 완료했습니다.
- 홈 숫자는 아직 `js/app.js`의 임시 데이터 `SAMPLE_HOME`입니다. 4단계에서 실제 데이터와 연결합니다.
- 진행 상황은 [tasks.md](tasks.md)의 체크리스트를 확인하세요.

## 4. 자주 하는 작업

### 4.1 기본 단어 추가·수정

1. `data/words.json`을 수정합니다. 규칙은 [data/README.md](../data/README.md)를 따릅니다.
2. `node tests/validate-words.js`로 검증합니다.
3. 카테고리별 개수를 바꾸면 검증 코드와 data/README.md를 함께 고칩니다.

### 4.2 새 기능 추가

`.claude/skills/add-feature/SKILL.md` 절차를 따릅니다.

### 4.3 문서 갱신

`.claude/skills/update-docs/SKILL.md` 절차를 따릅니다.

## 5. 주의사항

- `index.html`을 파일로 직접 열면 `words.json`을 읽지 못합니다. 임시 서버나 배포 URL로 확인하세요.
- 사용자 데이터는 브라우저 localStorage에 있습니다. 코드에서 임의로 지우지 마세요.
- 배포 주소의 도메인(`<계정>.github.io`)을 같은 계정의 다른 Pages 사이트와 함께 쓰므로 localStorage 키에는 항상 `palabrita.` 접두사를 붙입니다.
- 학습 시간 측정은 입력 감지를 이용한 추정값이며 실제 집중 여부를 판단하지 않습니다.

## 6. 남은 작업과 개선 아이디어

8단계에서 정리합니다.
