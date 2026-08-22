import { pick, randInt, shuffle } from './util.js';

/**
 * Generated sequence puzzles.
 *
 * Each family produces `{ terms, answer, rule }`. Difficulty tiers gate which
 * families can appear, so the run starts with arithmetic progressions and ends
 * somewhere genuinely unpleasant. Nothing is hard-coded — the numbers are
 * regenerated every time, so nobody memorises a puzzle list.
 */

const FAMILIES = [
  // ---------------- tier 1: you should get these ----------------
  {
    tier: 1,
    rule: 'add a constant',
    make() {
      const start = randInt(2, 20);
      const step = randInt(2, 9);
      const terms = Array.from({ length: 5 }, (_, i) => start + step * i);
      return { terms, answer: start + step * 5 };
    },
  },
  {
    tier: 1,
    rule: 'multiply by a constant',
    make() {
      const start = randInt(1, 5);
      const factor = randInt(2, 4);
      const terms = Array.from({ length: 5 }, (_, i) => start * factor ** i);
      return { terms, answer: start * factor ** 5 };
    },
  },
  {
    tier: 1,
    rule: 'alternating steps',
    make() {
      const start = randInt(3, 15);
      const up = randInt(4, 11);
      const down = randInt(1, 3);
      const terms = [start];
      for (let i = 1; i < 6; i += 1) terms.push(terms[i - 1] + (i % 2 ? up : -down));
      return { terms: terms.slice(0, 5), answer: terms[5] };
    },
  },

  // ---------------- tier 2: takes a moment ----------------
  {
    tier: 2,
    rule: 'growing differences',
    make() {
      const start = randInt(1, 12);
      const step = randInt(1, 4);
      const grow = randInt(1, 4);
      const terms = [start];
      let d = step;
      for (let i = 1; i < 6; i += 1) {
        terms.push(terms[i - 1] + d);
        d += grow;
      }
      return { terms: terms.slice(0, 5), answer: terms[5] };
    },
  },
  {
    tier: 2,
    rule: 'squares with an offset',
    make() {
      const offset = randInt(-6, 8);
      const from = randInt(1, 4);
      const terms = Array.from({ length: 5 }, (_, i) => (from + i) ** 2 + offset);
      return { terms, answer: (from + 5) ** 2 + offset };
    },
  },
  {
    tier: 2,
    rule: 'Fibonacci-style: each term is the sum of the previous two',
    make() {
      const a = randInt(1, 9);
      const b = randInt(1, 9);
      const terms = [a, b];
      for (let i = 2; i < 6; i += 1) terms.push(terms[i - 1] + terms[i - 2]);
      return { terms: terms.slice(0, 5), answer: terms[5] };
    },
  },
  {
    tier: 2,
    rule: 'double and add a constant',
    make() {
      const start = randInt(1, 8);
      const add = randInt(1, 7);
      const terms = [start];
      for (let i = 1; i < 6; i += 1) terms.push(terms[i - 1] * 2 + add);
      return { terms: terms.slice(0, 5), answer: terms[5] };
    },
  },

  // ---------------- tier 3: properly hard ----------------
  {
    tier: 3,
    rule: 'two interleaved sequences',
    make() {
      const a0 = randInt(2, 14);
      const aStep = randInt(3, 9);
      const b0 = randInt(20, 60);
      const bStep = -randInt(3, 9);
      const terms = [];
      for (let i = 0; i < 6; i += 1) {
        terms.push(i % 2 === 0 ? a0 + aStep * (i / 2) : b0 + bStep * ((i - 1) / 2));
      }
      return { terms: terms.slice(0, 5), answer: terms[5] };
    },
  },
  {
    tier: 3,
    rule: 'cubes with an offset',
    make() {
      const offset = randInt(-4, 6);
      const from = randInt(1, 3);
      const terms = Array.from({ length: 5 }, (_, i) => (from + i) ** 3 + offset);
      return { terms, answer: (from + 5) ** 3 + offset };
    },
  },
  {
    tier: 3,
    rule: 'multiply by one constant, add another',
    make() {
      const start = randInt(2, 7);
      const factor = randInt(2, 4);
      const add = randInt(2, 11);
      const terms = [start];
      for (let i = 1; i < 6; i += 1) terms.push(terms[i - 1] * factor + add);
      return { terms: terms.slice(0, 5), answer: terms[5] };
    },
  },
  {
    tier: 3,
    rule: 'prime numbers',
    make() {
      const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71];
      const from = randInt(0, PRIMES.length - 7);
      return { terms: PRIMES.slice(from, from + 5), answer: PRIMES[from + 5] };
    },
  },
  {
    tier: 3,
    rule: 'differences follow their own pattern',
    make() {
      const start = randInt(2, 12);
      const d0 = randInt(2, 6);
      const factor = 2;
      const terms = [start];
      let d = d0;
      for (let i = 1; i < 6; i += 1) {
        terms.push(terms[i - 1] + d);
        d *= factor;
      }
      return { terms: terms.slice(0, 5), answer: terms[5] };
    },
  },

  // ---------------- tier 4: brutal ----------------
  {
    tier: 4,
    rule: 'each term is the previous times its own index',
    make() {
      const start = randInt(2, 5);
      const terms = [start];
      for (let i = 1; i < 6; i += 1) terms.push(terms[i - 1] * (i + 1));
      return { terms: terms.slice(0, 5), answer: terms[5] };
    },
  },
  {
    tier: 4,
    rule: 'sum of the previous two, minus a constant',
    make() {
      const a = randInt(6, 18);
      const b = randInt(6, 18);
      const sub = randInt(1, 6);
      const terms = [a, b];
      for (let i = 2; i < 6; i += 1) terms.push(terms[i - 1] + terms[i - 2] - sub);
      return { terms: terms.slice(0, 5), answer: terms[5] };
    },
  },
  {
    tier: 4,
    rule: 'triangular numbers with an offset',
    make() {
      const offset = randInt(-5, 9);
      const from = randInt(2, 6);
      const tri = (n) => (n * (n + 1)) / 2;
      const terms = Array.from({ length: 5 }, (_, i) => tri(from + i) + offset);
      return { terms, answer: tri(from + 5) + offset };
    },
  },
  {
    tier: 4,
    rule: 'squares and cubes alternating',
    make() {
      const from = randInt(2, 5);
      const terms = [];
      for (let i = 0; i < 6; i += 1) {
        const n = from + Math.floor(i / 2);
        terms.push(i % 2 === 0 ? n ** 2 : n ** 3);
      }
      return { terms: terms.slice(0, 5), answer: terms[5] };
    },
  },
  {
    tier: 4,
    rule: 'previous term plus the sum of its digits',
    make() {
      const start = randInt(14, 48);
      const digitSum = (n) =>
        String(Math.abs(n))
          .split('')
          .reduce((a, c) => a + Number(c), 0);
      const terms = [start];
      for (let i = 1; i < 6; i += 1) terms.push(terms[i - 1] + digitSum(terms[i - 1]));
      return { terms: terms.slice(0, 5), answer: terms[5] };
    },
  },
];

/** Which tiers are in play at a given level. */
function tiersFor(level) {
  if (level <= 3) return [1];
  if (level <= 6) return [1, 2];
  if (level <= 10) return [2, 3];
  if (level <= 15) return [3, 4];
  return [4];
}

/**
 * Plausible wrong answers: off-by-a-step, the pattern continued incorrectly,
 * digits transposed. Never something wildly out of range.
 */
function makeDistractors(terms, answer) {
  const lastGap = answer - terms[terms.length - 1];
  const prevGap = terms[terms.length - 1] - terms[terms.length - 2];
  const pool = new Set();

  const add = (n) => {
    const v = Math.round(n);
    if (Number.isFinite(v) && v !== answer && v > -1000 && v < 10_000_000) pool.add(v);
  };

  add(answer + Math.max(1, Math.round(Math.abs(lastGap) * 0.5)));
  add(answer - Math.max(1, Math.round(Math.abs(lastGap) * 0.5)));
  add(terms[terms.length - 1] + prevGap); // "the gap stayed the same"
  add(answer + 1);
  add(answer - 1);
  add(answer + 10);
  add(Math.round(answer * 1.1));
  add(Math.round(answer * 0.9));

  const digits = String(Math.abs(answer));
  if (digits.length > 1) {
    add(Number(digits.slice(1) + digits[0]) * Math.sign(answer || 1));
  }

  return shuffle([...pool]).slice(0, 3);
}

/** One puzzle for the given level. */
export function makeSequence(level) {
  const allowed = tiersFor(level);
  const family = pick(FAMILIES.filter((f) => allowed.includes(f.tier)));
  const { terms, answer } = family.make();
  const wrong = makeDistractors(terms, answer);

  // Degenerate generation (all distractors collided) — try once more.
  if (wrong.length < 3) return makeSequence(level);

  return {
    terms,
    answer,
    rule: family.rule,
    tier: family.tier,
    options: shuffle([answer, ...wrong]),
  };
}
