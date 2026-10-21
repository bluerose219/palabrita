# CLAUDE.md

Claude Code가 이 프로젝트에서 작업을 시작할 때 자동으로 읽는 안내입니다.
자세한 규칙은 아래 문서에 있으므로, 작업 전에 반드시 먼저 읽습니다.

## 먼저 읽을 문서

1. [AGENTS.md](AGENTS.md): 개발 규칙 (이모지 금지, 언어 규칙, 사용자 데이터 보호, Git 규칙, 파일별 역할, localStorage 키)
2. [docs/handover.md](docs/handover.md): 배포 주소, 코드 구조, 자주 하는 작업, 주의사항
3. 바꿀 내용에 따라 [docs/design.md](docs/design.md), [data/README.md](data/README.md)

## 꼭 지킬 것 (요약)

- 질문, 선택지, 계획, 진행 보고, 작업 결과, 문서는 모두 한국어로 씁니다. 변수명, 함수명, 파일명은 영어로 씁니다.
- 프로젝트 어디에도 이모지를 쓰지 않습니다. 커밋 메시지와 작업 보고도 마찬가지입니다.
- 사용자 데이터(localStorage의 `palabrita.*`)를 코드에서 임의로 지우거나 초기화하지 않습니다.
- 프레임워크, 서버, 외부 API, CDN, 웹폰트를 쓰지 않습니다. GitHub Pages에서 서버 없이 동작해야 합니다.

## 작업 방식

1. 새 기능이나 변경은 `.claude/skills/add-feature/SKILL.md` 절차를 따릅니다.
2. `feature/<이름>` 또는 `fix/<이름>` 브랜치에서 작업합니다. `main`에 바로 커밋하지 않습니다.
3. 화면을 바꾸는 요청은 확인용 화면(시안)을 먼저 보여 주고 사용자 확인을 받은 뒤 진행합니다.
4. 기존 기능에 영향이 있거나 결정이 필요하면 구현 전에 한국어로 묻습니다.
5. 테스트를 실제로 실행한 결과만 보고합니다.
   - 단어 데이터를 바꿨다면 `node tests/validate-words.js`
   - 화면은 `python -m http.server 8000`으로 연 페이지에서 확인
6. 코드를 바꾸면 `.claude/skills/update-docs/SKILL.md` 절차로 문서를 갱신하고, `docs/progress.md`에 기록합니다.
7. 사용자가 병합을 요청하면 `main`에 `--no-ff`로 병합하고 `git push origin main`을 실행합니다. push하면 GitHub Pages가 몇 분 안에 자동으로 다시 배포합니다.

## 배포 정보

- 사이트: https://bluerose219.github.io/palabrita/
- 저장소: https://github.com/bluerose219/palabrita (공개)
