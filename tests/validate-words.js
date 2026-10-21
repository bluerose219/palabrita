// 기본 단어 데이터(data/words.json) 검증
// 실행: node tests/validate-words.js
// 다른 파일 검사: node tests/validate-words.js 파일경로 (검증 코드 자체를 시험할 때 사용)
// 하나라도 실패하면 오류 내용을 출력하고 종료 코드 1로 끝납니다.

const fs = require("fs");
const path = require("path");

const WORDS_FILE = process.argv[2] || path.join(__dirname, "..", "data", "words.json");

// 카테고리 키와 목표 개수 (data/README.md와 같아야 함)
const CATEGORY_COUNTS = {
  greetings: 40,
  people: 50,
  food: 70,
  nature: 50,
  home: 60,
  school: 50,
  numbers: 60,
  emotions: 40,
  verbs: 50,
  adjectives: 30,
};
const TOTAL_COUNT = 500;

const REQUIRED_FIELDS = ["id", "spanish", "korean", "partOfSpeech", "category", "level"];
// gender: 명사만, present: 동사의 현재시제 6개 형태, note: 덧붙이는 설명
const OPTIONAL_FIELDS = ["gender", "present", "note"];
const LEVELS = ["A1", "A2"];
const PARTS_OF_SPEECH = [
  "noun", "verb", "adjective", "adverb", "verbPhrase",
  "pronoun", "preposition", "conjunction", "interjection", "other",
];
const GENDERS = ["masculine", "feminine", "both", "common"];

// 성별 구분이 맞는지 확인할 대표 단어 (data/README.md의 예시)
const GENDER_EXAMPLES = {
  mar: "both",
  "azúcar": "both",
  internet: "both",
  estudiante: "common",
  artista: "common",
  periodista: "common",
  libro: "masculine",
  casa: "feminine",
};

// korean 안에 품사 약어가 들어 있는지 찾는 패턴 (예: "n.m. 책")
const ABBR_PATTERN = /(^|\s)(n|v|adj|adv|pron|prep|conj|interj|etc)\.(m\.f\.|m\.|f\.|com\.|phr\.)?(\s|$)/;

const errors = [];
const warnings = [];

function readWords() {
  const text = fs.readFileSync(WORDS_FILE, "utf8");
  const words = JSON.parse(text);
  if (!Array.isArray(words)) {
    throw new Error("words.json의 최상위 값이 배열이 아닙니다.");
  }
  return words;
}

function checkFields(word, index) {
  const label = `${index + 1}번째 단어(${word.id || "id 없음"})`;

  for (const field of REQUIRED_FIELDS) {
    if (typeof word[field] !== "string" || word[field].trim() === "") {
      errors.push(`${label}: ${field} 값이 비어 있거나 문자열이 아닙니다.`);
    }
  }

  if (word.spanish && word.spanish !== word.spanish.trim().replace(/\s+/g, " ")) {
    errors.push(`${label}: spanish 앞뒤 공백이나 연속 공백이 있습니다.`);
  }
  if (word.korean && word.korean !== word.korean.trim()) {
    errors.push(`${label}: korean 앞뒤에 공백이 있습니다.`);
  }
  if (word.level && !LEVELS.includes(word.level)) {
    errors.push(`${label}: level 값 "${word.level}"은(는) 허용되지 않습니다.`);
  }
  if (word.category && !(word.category in CATEGORY_COUNTS)) {
    errors.push(`${label}: category 값 "${word.category}"은(는) 허용되지 않습니다.`);
  }
  if (word.partOfSpeech && !PARTS_OF_SPEECH.includes(word.partOfSpeech)) {
    errors.push(`${label}: partOfSpeech 값 "${word.partOfSpeech}"은(는) 허용되지 않습니다.`);
  }

  // gender는 명사에만 있고, 값이 정해진 목록 안에 있어야 합니다.
  if ("gender" in word) {
    if (word.partOfSpeech !== "noun") {
      errors.push(`${label}: 명사가 아닌데 gender가 있습니다.`);
    } else if (!GENDERS.includes(word.gender)) {
      errors.push(`${label}: gender 값 "${word.gender}"은(는) 허용되지 않습니다.`);
    }
  }

  if (word.korean && ABBR_PATTERN.test(word.korean)) {
    errors.push(`${label}: korean에 품사 약어가 들어 있습니다. ("${word.korean}")`);
  }

  // 동사와 동사구는 현재시제 6개 형태(present)가 있어야 하고, 다른 품사에는 없어야 합니다.
  const isVerb = word.partOfSpeech === "verb" || word.partOfSpeech === "verbPhrase";
  if (isVerb) {
    const ok =
      Array.isArray(word.present) &&
      word.present.length === 6 &&
      word.present.every((form) => typeof form === "string" && form.trim() !== "" && form === form.trim());
    if (!ok) {
      errors.push(`${label}: 동사인데 present가 6개의 글자 목록이 아닙니다.`);
    }
  } else if ("present" in word) {
    errors.push(`${label}: 동사가 아닌데 present가 있습니다.`);
  }
  if ("note" in word && (typeof word.note !== "string" || word.note.trim() === "")) {
    errors.push(`${label}: note 값이 비어 있거나 문자열이 아닙니다.`);
  }

  // 정해진 필드 말고 다른 필드가 있으면 알려 줍니다.
  for (const key of Object.keys(word)) {
    if (!REQUIRED_FIELDS.includes(key) && !OPTIONAL_FIELDS.includes(key)) {
      errors.push(`${label}: 알 수 없는 필드 "${key}"가 있습니다.`);
    }
  }
}

function checkIds(words) {
  words.forEach((word, index) => {
    const expected = "w" + String(index + 1).padStart(3, "0");
    if (word.id !== expected) {
      errors.push(`${index + 1}번째 단어: id가 "${word.id}"입니다. 순서대로 "${expected}"이어야 합니다.`);
    }
  });
}

function checkDuplicates(words) {
  const seenSpanish = {};
  const seenKorean = {};

  for (const word of words) {
    if (!word.spanish || !word.korean) {
      continue;
    }

    const spanishKey = word.spanish.toLowerCase();
    if (seenSpanish[spanishKey]) {
      errors.push(`spanish 중복: "${word.spanish}" (${seenSpanish[spanishKey]}, ${word.id})`);
    } else {
      seenSpanish[spanishKey] = word.id;
    }

    // 뜻이 완전히 같으면 객관식 보기가 헷갈릴 수 있어 경고만 합니다.
    if (seenKorean[word.korean]) {
      warnings.push(`korean 중복: "${word.korean}" (${seenKorean[word.korean]}, ${word.id})`);
    } else {
      seenKorean[word.korean] = word.id;
    }
  }
}

function checkGenderExamples(words) {
  for (const spanish in GENDER_EXAMPLES) {
    const word = words.find((item) => item.spanish === spanish);
    if (!word) {
      continue; // 아직 작성하지 않은 카테고리일 수 있음
    }
    if (word.gender !== GENDER_EXAMPLES[spanish]) {
      errors.push(`성별 예시 단어 "${spanish}"의 gender가 "${word.gender}"입니다. "${GENDER_EXAMPLES[spanish]}"이어야 합니다.`);
    }
  }
}

// 카테고리별 진행 상황을 표로 출력하고, 개수가 맞지 않으면 오류로 기록합니다.
function checkCounts(words) {
  console.log("카테고리별 단어 수");
  for (const category in CATEGORY_COUNTS) {
    const count = words.filter((word) => word.category === category).length;
    const target = CATEGORY_COUNTS[category];
    let status = "완료";
    if (count === 0) {
      status = "미작성";
    } else if (count < target) {
      status = "부족";
    } else if (count > target) {
      status = "초과";
    }
    console.log(`  ${category.padEnd(11)} ${String(count).padStart(3)} / ${target}  ${status}`);
    if (count !== target) {
      errors.push(`${category}: ${count}개 (목표 ${target}개)`);
    }
  }
  console.log(`  ${"합계".padEnd(10)} ${String(words.length).padStart(3)} / ${TOTAL_COUNT}`);
  if (words.length !== TOTAL_COUNT) {
    errors.push(`전체 단어 수: ${words.length}개 (목표 ${TOTAL_COUNT}개)`);
  }
}

function main() {
  let words;
  try {
    words = readWords();
  } catch (error) {
    console.log("words.json을 읽을 수 없습니다: " + error.message);
    process.exit(1);
  }

  words.forEach(checkFields);
  checkIds(words);
  checkDuplicates(words);
  checkGenderExamples(words);
  checkCounts(words);

  if (warnings.length > 0) {
    console.log(`\n경고 ${warnings.length}건 (검증 실패는 아님)`);
    warnings.forEach((message) => console.log("  - " + message));
  }

  if (errors.length > 0) {
    console.log(`\n검증 실패: 오류 ${errors.length}건`);
    errors.forEach((message) => console.log("  - " + message));
    process.exit(1);
  }

  console.log("\n검증 통과: 모든 검사를 통과했습니다.");
}

main();
