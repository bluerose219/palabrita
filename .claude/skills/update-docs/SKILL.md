---
name: update-docs
description: Palabrita의 코드나 데이터가 바뀐 뒤 관련 문서를 확인하고 갱신할 때 사용한다. 변경 내용에 따라 어떤 문서를 고쳐야 하는지 정리되어 있다.
---

# 문서 갱신 절차

코드나 데이터를 바꾼 뒤 아래 순서로 문서를 확인하고 갱신한다. 문서는 한국어로 쓰고 이모지를 넣지 않는다.

## 1. 변경 내용 파악

- `git status`와 `git diff`로 바뀐 파일과 내용을 확인한다.
- 바뀐 내용을 기능, 화면, 데이터 구조, 규칙, 실행 방법으로 나눠 정리한다.

## 2. 갱신할 문서 찾기

| 바뀐 내용 | 확인할 문서 |
|---|---|
| 기능 추가, 변경 | `docs/requirements.md`, `README.md`의 주요 기능 |
| 화면 구성, 디자인 | `docs/design.md`의 화면 구조와 디자인 시스템 |
| 데이터 구조, localStorage 키 | `docs/design.md`의 데이터 구조, `AGENTS.md`의 localStorage 키 표 |
| 기본 단어 데이터, 품사 규칙 | `data/README.md` |
| 파일 추가, 역할 변경 | `AGENTS.md`의 파일별 역할, `README.md`와 `docs/design.md`의 폴더 구조 |
| 실행, 배포 방법 | `README.md`, `docs/handover.md` |
| 테스트 추가, 결과 | `docs/test-plan.md` |
| 단계 진행 | `docs/tasks.md`의 체크리스트 |
| 모든 작업 | `docs/progress.md` |

## 3. 문서 갱신

- 실제로 바뀐 내용만 적는다. 계획만 있고 구현하지 않은 내용은 "예정"이라고 표시한다.
- `docs/progress.md`에는 날짜, 한 일, 발생한 문제와 해결 방법을 기록한다.
- `docs/tasks.md`에서 완료한 항목만 체크한다.
- `docs/test-plan.md`에는 실제로 실행한 테스트 결과만 적는다.
- 문서 사이에 서로 다른 내용이 없는지 확인한다. 예: localStorage 키 표가 `AGENTS.md`와 `docs/design.md`에서 같은지

## 4. 확인

- 문서에 이모지가 없는지 확인한다.
- 문서 안의 링크와 파일 경로가 실제 파일과 맞는지 확인한다.
- 문서 변경은 `docs: 한국어 설명` 형식으로 커밋한다.

## 5. 보고

갱신한 문서와 바꾼 내용을 한국어로 짧게 보고한다.
