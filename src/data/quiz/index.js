import science from './banks/science.js';
import history from './banks/history.js';
import geography from './banks/geography.js';
import arts from './banks/arts.js';
import entertainment from './banks/entertainment.js';
import technology from './banks/technology.js';
import sports from './banks/sports.js';
import nature from './banks/nature.js';
import space from './banks/space.js';
import language from './banks/language.js';
import culture from './banks/culture.js';
import world from './banks/world.js';
import hard from './banks/hard.js';
import brutal from './banks/brutal.js';
import movies from './banks/movies.js';
import gaming from './banks/gaming.js';
import mythology from './banks/mythology.js';
import assorted from './banks/assorted.js';
import { COUNTRIES, ELEMENTS, PHRASES, VOCAB } from './tables.js';
import { LANGUAGES, VOCAB_EXTRA, WORKS } from './tables2.js';

/**
 * The question bank.
 *
 * Hand-written questions live in ./banks; the rest are generated from the
 * reference tables. Generated distractors are pulled from the same slice of
 * the table (same continent, adjacent atomic numbers) so they stay plausible
 * instead of being obvious throwaways.
 */

export const CATEGORIES = {
  science: { label: 'Science', icon: '🔬' },
  history: { label: 'History', icon: '🏛️' },
  geography: { label: 'Geography', icon: '🗺️' },
  arts: { label: 'Art & Books', icon: '🎨' },
  entertainment: { label: 'Screen & Sound', icon: '🎬' },
  technology: { label: 'Tech', icon: '💻' },
  sports: { label: 'Sport', icon: '🏅' },
  nature: { label: 'Nature', icon: '🦉' },
  space: { label: 'Space', icon: '🪐' },
  language: { label: 'Words', icon: '🔤' },
  culture: { label: 'Culture', icon: '🌍' },
  world: { label: 'Discovery', icon: '💡' },
  movies: { label: 'Movies', icon: '🎥' },
  gaming: { label: 'Games', icon: '🕹️' },
  mythology: { label: 'Myth', icon: '🐉' },
  assorted: { label: 'Mixed Bag', icon: '🎲' },
  expert: { label: 'Expert', icon: '☠️' },
};

const HAND_WRITTEN = {
  science,
  history,
  geography,
  arts,
  entertainment,
  technology,
  sports,
  nature,
  space,
  language,
  culture,
  world,
  movies,
  gaming,
  mythology,
  assorted,
  expert: [...hard, ...brutal],
};

let uid = 0;
const makeQuestion = (category, text, correct, wrong, difficulty) => ({
  id: `q${(uid += 1)}`,
  category,
  q: text,
  correct,
  wrong,
  d: difficulty,
});

/** Pick `n` distinct values from `pool`, never equal to `exclude`. */
function distractors(pool, exclude, n = 3) {
  const seen = new Set([exclude]);
  const out = [];
  // Walk a shuffled copy so repeated calls do not always yield the same trio.
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  for (const value of shuffled) {
    if (out.length >= n) break;
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out.length === n ? out : null;
}

function buildGeographyQuestions() {
  const out = [];
  const byContinent = {};
  for (const row of COUNTRIES) {
    (byContinent[row[2]] ??= []).push(row);
  }

  for (const [country, capital, continent, currency] of COUNTRIES) {
    const neighbours = byContinent[continent];
    const capitalPool = neighbours.map((r) => r[1]);
    const countryPool = neighbours.map((r) => r[0]);

    const capWrong = distractors(capitalPool, capital);
    if (capWrong) {
      out.push(
        makeQuestion('geography', `What is the capital of ${country}?`, capital, capWrong, 2),
      );
    }

    const countryWrong = distractors(countryPool, country);
    if (countryWrong) {
      out.push(
        makeQuestion(
          'geography',
          `${capital} is the capital of which country?`,
          country,
          countryWrong,
          2,
        ),
      );
    }

    const continentWrong = distractors(
      ['Europe', 'Asia', 'Africa', 'North America', 'South America', 'Oceania'],
      continent,
    );
    if (continentWrong) {
      out.push(
        makeQuestion('geography', `On which continent is ${country}?`, continent, continentWrong, 1),
      );
    }

    // Currency questions only where the currency is reasonably distinctive.
    const currencyPool = COUNTRIES.map((r) => r[3]).filter((c) => c !== currency);
    const currencyWrong = distractors(currencyPool, currency);
    if (currencyWrong && !['Euro', 'US dollar'].includes(currency)) {
      out.push(
        makeQuestion(
          'geography',
          `Which currency is used in ${country}?`,
          currency,
          currencyWrong,
          3,
        ),
      );
    }
  }
  return out;
}

function buildChemistryQuestions() {
  const out = [];
  const names = ELEMENTS.map((e) => e[2]);
  const symbols = ELEMENTS.map((e) => e[1]);

  ELEMENTS.forEach(([number, symbol, name], index) => {
    // Neighbouring elements make far better wrong answers than random ones.
    const near = ELEMENTS.slice(Math.max(0, index - 5), index + 6);

    const symbolWrong = distractors(near.map((e) => e[1]).concat(symbols), symbol);
    if (symbolWrong) {
      out.push(
        makeQuestion(
          'science',
          `What is the chemical symbol for ${name.toLowerCase()}?`,
          symbol,
          symbolWrong,
          number <= 20 ? 1 : 2,
        ),
      );
    }

    const nameWrong = distractors(near.map((e) => e[2]).concat(names), name);
    if (nameWrong) {
      out.push(
        makeQuestion(
          'science',
          `Which element has the chemical symbol ${symbol}?`,
          name,
          nameWrong,
          number <= 20 ? 1 : 2,
        ),
      );
    }

    if (number <= 30) {
      const numberWrong = distractors(
        near.map((e) => String(e[0])),
        String(number),
      );
      if (numberWrong) {
        out.push(
          makeQuestion(
            'science',
            `What is the atomic number of ${name.toLowerCase()}?`,
            String(number),
            numberWrong,
            3,
          ),
        );
      }
    }
  });
  return out;
}

function buildWordQuestions() {
  const out = [];

  const phraseMeanings = PHRASES.map((p) => p[1]);
  for (const [phrase, meaning] of PHRASES) {
    const wrong = distractors(phraseMeanings, meaning);
    if (wrong) {
      out.push(makeQuestion('language', `What does "${phrase}" mean?`, meaning, wrong, 2));
    }
  }

  const definitions = VOCAB.map((v) => v[1]);
  const terms = VOCAB.map((v) => v[0]);
  for (const [term, definition] of VOCAB) {
    const wrongDefs = distractors(definitions, definition);
    if (wrongDefs) {
      out.push(makeQuestion('language', `What does "${term.toLowerCase()}" mean?`, definition, wrongDefs, 2));
    }
    const wrongTerms = distractors(terms, term);
    if (wrongTerms) {
      out.push(
        makeQuestion('language', `Which word means "${definition.toLowerCase()}"?`, term, wrongTerms, 3),
      );
    }
  }
  return out;
}

function buildWorkQuestions() {
  const out = [];
  const creators = [...new Set(WORKS.map((w) => w[1]))];
  const byField = {};
  for (const row of WORKS) (byField[row[2]] ??= []).push(row);

  for (const [work, creator, field] of WORKS) {
    // Distractors are creators working in the same medium — no free giveaways.
    const sameField = byField[field].map((r) => r[1]);
    const wrongCreators = distractors(sameField.concat(creators), creator);
    if (wrongCreators) {
      out.push(
        makeQuestion(
          field === 'painting' || field === 'sculpture' ? 'arts' : field === 'composition' ? 'entertainment' : 'arts',
          `Who created "${work}"?`,
          creator,
          wrongCreators,
          2,
        ),
      );
    }

    const sameFieldWorks = byField[field].filter((r) => r[1] !== creator).map((r) => r[0]);
    const wrongWorks = distractors(sameFieldWorks, work);
    if (wrongWorks) {
      out.push(
        makeQuestion(
          'arts',
          `Which of these did ${creator} create?`,
          work,
          wrongWorks,
          3,
        ),
      );
    }
  }
  return out;
}

function buildLanguageQuestions() {
  const out = [];
  const allLanguages = [...new Set(LANGUAGES.map((r) => r[1]))];

  for (const [country, language] of LANGUAGES) {
    const wrong = distractors(allLanguages, language);
    if (wrong) {
      out.push(
        makeQuestion(
          'language',
          `What is the main language of ${country}?`,
          language,
          wrong,
          2,
        ),
      );
    }
  }

  // The reverse direction only works where the language maps to one country.
  const counts = {};
  for (const [, language] of LANGUAGES) counts[language] = (counts[language] ?? 0) + 1;
  const countryPool = LANGUAGES.map((r) => r[0]);
  for (const [country, language] of LANGUAGES) {
    if (counts[language] !== 1) continue;
    const wrong = distractors(countryPool, country);
    if (wrong) {
      out.push(
        makeQuestion('language', `${language} is the main language of which country?`, country, wrong, 3),
      );
    }
  }
  return out;
}

function buildExtraVocabQuestions() {
  const out = [];
  const definitions = VOCAB_EXTRA.map((v) => v[1]);
  const terms = VOCAB_EXTRA.map((v) => v[0]);
  for (const [term, definition] of VOCAB_EXTRA) {
    const wrongDefs = distractors(definitions, definition);
    if (wrongDefs) {
      out.push(
        makeQuestion('language', `What does "${term.toLowerCase()}" mean?`, definition, wrongDefs, 3),
      );
    }
    const wrongTerms = distractors(terms, term);
    if (wrongTerms) {
      out.push(
        makeQuestion('language', `Which word means "${definition.toLowerCase()}"?`, term, wrongTerms, 3),
      );
    }
  }
  return out;
}

function buildRomanNumeralQuestions() {
  const VALUES = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  const toRoman = (n) => {
    let rest = n;
    let out = '';
    for (const [value, glyph] of VALUES) {
      while (rest >= value) {
        out += glyph;
        rest -= value;
      }
    }
    return out;
  };

  const out = [];
  const numbers = [4, 9, 14, 19, 24, 40, 44, 49, 59, 64, 79, 89, 90, 99, 104, 149, 199, 400, 444, 499, 900, 949, 1066, 1492, 1776, 1984, 2024];
  for (const n of numbers) {
    const correct = toRoman(n);
    const pool = [toRoman(n + 1), toRoman(n - 1), toRoman(n + 10), toRoman(n - 10), toRoman(n + 5), toRoman(n * 2)];
    const wrong = distractors(pool, correct);
    if (wrong) {
      out.push(
        makeQuestion('culture', `What is ${n} in Roman numerals?`, correct, wrong, n > 500 ? 3 : 2),
      );
      out.push(
        makeQuestion(
          'culture',
          `Which number is the Roman numeral ${correct}?`,
          String(n),
          [String(n + 1), String(n - 1), String(n + 10)],
          n > 500 ? 3 : 2,
        ),
      );
    }
  }
  return out;
}

function buildAll() {
  const out = [];
  // Hand-written questions go in first so that when a generator happens to
  // produce the same prompt, the curated version (with better distractors) wins.
  for (const [category, rows] of Object.entries(HAND_WRITTEN)) {
    for (const [text, correct, w1, w2, w3, difficulty] of rows) {
      out.push(makeQuestion(category, text, correct, [w1, w2, w3], difficulty ?? 2));
    }
  }
  out.push(...buildGeographyQuestions());
  out.push(...buildChemistryQuestions());
  out.push(...buildWordQuestions());
  out.push(...buildRomanNumeralQuestions());
  out.push(...buildWorkQuestions());
  out.push(...buildLanguageQuestions());
  out.push(...buildExtraVocabQuestions());

  const seen = new Set();
  return out.filter((q) => {
    const key = q.q.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Every question in the bank, built once at module load. */
export const QUESTIONS = buildAll();

export const QUESTION_COUNT = QUESTIONS.length;

/** Questions grouped by difficulty tier, for the escalating ladder. */
export const BY_DIFFICULTY = {
  1: QUESTIONS.filter((q) => q.d === 1),
  2: QUESTIONS.filter((q) => q.d === 2),
  3: QUESTIONS.filter((q) => q.d === 3),
  4: QUESTIONS.filter((q) => q.d === 4),
};

/** Everything the Expert ladder is allowed to draw from. */
export const EXPERT_POOL = QUESTIONS.filter((q) => q.d >= 3);

export const COUNT_BY_CATEGORY = QUESTIONS.reduce((acc, q) => {
  acc[q.category] = (acc[q.category] ?? 0) + 1;
  return acc;
}, {});
