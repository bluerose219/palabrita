# 기본 단어 데이터

`words.json`에는 스페인어 A1~A2 수준의 기본 단어 500개가 들어 있습니다.
기본 단어는 읽기 전용이며, 사용자가 추가한 단어는 이 파일이 아니라 브라우저 localStorage에 저장됩니다.

현재 상태: 1단계에서는 빈 배열입니다. 3단계에서 500개를 채웁니다.

## 1. 필드

| 필드 | 필수 | 설명 | 예 |
|---|---|---|---|
| `id` | 예 | `w` + 세 자리 번호 | `"w101"` |
| `spanish` | 예 | 스페인어. 명사는 관사 없이, 동사는 원형 | `"libro"` |
| `korean` | 예 | 한국어 뜻. 여러 뜻은 `, `로 구분. 품사 약어를 넣지 않음 | `"배낭, 책가방"` |
| `partOfSpeech` | 예 | 품사 (아래 표) | `"noun"` |
| `gender` | 명사만 | 명사 성별 (아래 표). 명사가 아니면 넣지 않음 | `"masculine"` |
| `category` | 예 | 카테고리 키 (아래 표) | `"school"` |
| `level` | 예 | `"A1"` 또는 `"A2"` | `"A1"` |

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

## 2. 카테고리

| 키 | 표시 이름 | 개수 |
|---|---|---|
| `greetings` | 인사·기본 표현 | 40 |
| `people` | 사람·가족 | 50 |
| `food` | 음식·음료 | 70 |
| `nature` | 동물·자연 | 50 |
| `home` | 집·생활 | 60 |
| `school` | 학교·직업 | 50 |
| `numbers` | 숫자·시간 | 60 |
| `emotions` | 감정·성격 | 40 |
| `verbs` | 기본 동사 | 50 |
| `adjectives` | 형용사·기타 | 30 |
| 합계 | | 500 |

## 3. 품사와 약어

Palabrita에서 쓰는 자체 표기 규칙입니다. 모든 약어는 소문자입니다.
약어는 화면에 표시할 때만 `약어 + 공백 + 뜻` 형태로 만들고, `korean`에는 저장하지 않습니다.

| partOfSpeech | 약어 | 설명 |
|---|---|---|
| `noun` | n. 등 (성별에 따라) | 명사 |
| `verb` | v. | 동사 |
| `adjective` | adj. | 형용사 |
| `adverb` | adv. | 부사 |
| `verbPhrase` | v.phr. | 동사구 |
| `pronoun` | pron. | 대명사 |
| `preposition` | prep. | 전치사 |
| `conjunction` | conj. | 접속사 |
| `interjection` | interj. | 감탄사 |
| `other` | etc. | 기타 |

## 4. 명사 성별

| gender | 약어 | 설명 | 예 |
|---|---|---|---|
| (없음) | n. | 성별 미분류 명사 | |
| `masculine` | n.m. | 남성 명사 | libro (책) |
| `feminine` | n.f. | 여성 명사 | casa (집) |
| `both` | n.m.f. | 양성 명사 | mar (바다) |
| `common` | n.com. | 공통성 명사 | estudiante (학생) |

### 양성 명사와 공통성 명사의 차이

두 유형은 서로 다르므로 반드시 구분합니다.

- 양성 명사(`both`, n.m.f.): 같은 의미로 남성 관사와 여성 관사를 모두 쓸 수 있는 명사입니다.
  - 예: el mar / la mar (바다), el azúcar / la azúcar (설탕), el internet / la internet (인터넷)
- 공통성 명사(`common`, n.com.): 형태는 같지만 가리키는 사람의 성별에 따라 관사가 달라지는 명사입니다.
  - 예: el estudiante / la estudiante (학생), artista (예술가), periodista (기자), turista (관광객), dentista (치과 의사), cantante (가수)
- 형태가 바뀌는 명사(hermano / hermana 등)는 각각 따로 등록하고 `masculine`, `feminine`으로 표시합니다.

## 5. 품사를 정하기 애매한 단어

| 유형 | 처리 | 예 |
|---|---|---|
| 고정 표현, 인사말 구 | `other` (etc.) | buenos días, por favor |
| 한 단어 인사말, 감탄 | `interjection` (interj.) | hola, adiós |
| 기수 | `other` (etc.) | uno, dos |
| 서수 | `adjective` (adj.) | primero |
| 동사구 | `verbPhrase` (v.phr.) | tener que + 동사원형 |

## 6. 작성 규칙

- 철자와 악센트(á, é, í, ó, ú, ñ, ü)를 정확히 씁니다.
- 명사는 관사 없이 단수 기본형, 형용사는 남성 단수형, 동사는 원형으로 씁니다.
- 같은 철자의 단어는 한 번만 등록합니다. 여러 카테고리에 해당하면 가장 대표적인 카테고리에 둡니다.
- id는 중간에 비는 번호 없이 순서대로 붙입니다.

## 7. 검증

```bash
node tests/validate-words.js
```

검사 항목 (3단계에서 구현):

- 총 500개, 카테고리별 개수
- 필수 필드와 빈 값
- id 중복, spanish 중복(소문자 기준)
- level, partOfSpeech, gender 값 범위
- gender가 명사에만 있는지
- korean에 품사 약어가 들어 있지 않은지

하나라도 실패하면 오류 내용을 출력하고 종료 코드 1로 끝납니다.
