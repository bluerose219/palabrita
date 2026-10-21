# Palabrita

Palabrita는 스페인어 A1~A2 수준의 기본 단어를 학습하는 웹사이트입니다.
기본 단어 500개를 공부하고, 자신만의 단어를 추가하고, 객관식·주관식 퀴즈와 오답노트로 복습할 수 있습니다.

수업 미니 프로젝트로 만들었으며, 서버 없이 GitHub Pages에서 동작합니다.

## 주요 기능

- 홈: 전체 단어 수, 학습한 단어 수, 퀴즈 정답률, 오답 단어 수, 오늘의 단어, 카테고리별 학습 진행률
- 단어장: 카테고리·난이도 필터, 검색, 사용자 단어 등록·수정·삭제, 스페인어/뜻 가리기, 섞기, 품사 약어 표시와 약어 설명
- 퀴즈: 스페인어 단어를 보고 한국어 뜻 맞히기 (객관식 4지선다, 주관식 입력)
- 오답노트: 틀린 단어 자동 기록, 오답 재시험, 복습 결과 저장
- 학습 통계: 총 퀴즈 횟수, 정답률, 학습한 단어 수, 오답 단어 수, 주간 학습 기록(자동 학습 시간 측정)

## 기술 스택

HTML5, CSS3, Vanilla JavaScript, JSON, localStorage, Git/GitHub, GitHub Pages

프레임워크, 백엔드 서버, 외부 API를 사용하지 않습니다.

## 배포 URL

아직 배포하지 않았습니다. 8단계에서 GitHub Pages로 배포한 뒤 이곳에 주소를 적습니다.

## 실행 방법

### 배포된 사이트에서 사용

배포 URL로 접속하면 바로 사용할 수 있습니다.

### 내 컴퓨터에서 확인

`index.html`을 파일로 직접 열면 브라우저 보안 정책 때문에 `data/words.json`을 읽지 못합니다.
로컬에서 확인할 때는 프로젝트 폴더에서 임시 정적 서버를 실행합니다. 이 서버는 확인용일 뿐이고 사이트 자체는 서버가 필요하지 않습니다.

```bash
python -m http.server 8000
```

그다음 브라우저에서 `http://localhost:8000`을 엽니다.

### 단어 데이터 검증

Node.js가 설치되어 있으면 다음 명령으로 기본 단어 데이터를 검증합니다.

```bash
node tests/validate-words.js
```

## 사용 방법

1. 홈에서 학습 현황을 확인하고 "퀴즈 시작" 또는 "단어장 보기"를 누릅니다.
2. 단어장에서 단어를 찾아보고, "단어 추가"로 나만의 단어를 등록합니다.
3. 퀴즈에서 객관식 또는 주관식, 문제 수, 카테고리를 고르고 문제를 풉니다.
4. 틀린 단어는 오답노트에 자동으로 기록되며, "오답 재시험"으로 다시 풀 수 있습니다.
5. 학습 통계에서 정답률과 주간 학습 시간을 확인합니다.

사용자 단어, 오답 기록, 통계는 브라우저의 localStorage에 저장됩니다.
같은 브라우저에서는 새로고침해도 유지되지만, 다른 기기나 다른 브라우저에서는 보이지 않습니다.

## 폴더 구조

```text
palabrita/
├── README.md              프로젝트 소개
├── AGENTS.md              개발 규칙
├── .gitignore
├── .nojekyll              GitHub Pages의 Jekyll 처리 끄기
├── index.html             단일 페이지
├── css/
│   ├── style.css          디자인 시스템과 화면 스타일
│   └── responsive.css     반응형 스타일
├── js/
│   ├── app.js             초기화, 화면 전환, 홈
│   ├── vocabulary.js      단어장
│   ├── quiz.js            퀴즈
│   ├── wrong-answers.js   오답노트
│   ├── storage.js         localStorage 관리
│   └── stats.js           학습 통계, 학습 시간 측정
├── data/
│   ├── words.json         기본 단어 500개
│   └── README.md          단어 데이터 설명
├── assets/
│   ├── images/
│   └── icons/
├── docs/                  개발 문서
├── tests/
│   └── validate-words.js  단어 데이터 검증
└── .claude/skills/        Claude 작업 절차 (add-feature, update-docs)
```

## 문서

- [개발 규칙](AGENTS.md)
- [요구사항](docs/requirements.md)
- [설계](docs/design.md)
- [작업 계획](docs/tasks.md)
- [진행 기록](docs/progress.md)
- [테스트 계획](docs/test-plan.md)
- [인수인계](docs/handover.md)
- [단어 데이터](data/README.md)
