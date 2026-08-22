import { QUESTIONS, BY_DIFFICULTY } from '../data/quiz/index.js';
import { pick, readJSON, shuffle, writeJSON } from './util.js';

const SEEN_KEY = 'pulse-arcade:quiz-seen';
/** How many recent question ids to remember so back-to-back runs feel fresh. */
const SEEN_CAP = 600;

/**
 * The difficulty ladder.
 *
 * Each row is [upToQuestionIndex, weights] where weights are the relative
 * chances of drawing an easy / medium / hard question. The run starts gentle
 * and only really turns on you past question twenty.
 */
const LADDER = [
  // A genuine warm-up: the first handful should feel good to answer.
  [5, [10, 1, 0, 0]],
  [10, [7, 5, 0, 0]],
  [16, [3, 8, 2, 0]],
  [23, [1, 6, 5, 1]],
  [31, [0, 4, 6, 3]],
  [40, [0, 2, 6, 5]],
  [Infinity, [0, 0, 5, 8]],
];

/** Expert runs skip the warm-up entirely and open on the hard tiers. */
const EXPERT_LADDER = [
  [4, [0, 0, 8, 4]],
  [10, [0, 0, 5, 7]],
  [Infinity, [0, 0, 2, 10]],
];

function difficultyFor(index, expert) {
  const [, weights] = (expert ? EXPERT_LADDER : LADDER).find(([upTo]) => index < upTo);
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < weights.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return i + 1;
  }
  return 2;
}

/**
 * A deck for one run.
 *
 * Order is randomised every single time: the pool is shuffled, the answer
 * options are shuffled, and questions you have seen recently are pushed to the
 * back of the queue so consecutive runs do not replay the same set.
 */
export function createDeck({ category = null, expert = false } = {}) {
  const recentlySeen = new Set(readJSON(SEEN_KEY, []));
  const usedThisRun = new Set();
  const drawnIds = [];

  const matchesCategory = (q) => !category || q.category === category;

  // Pre-shuffle each difficulty tier once, then walk it — cheaper than
  // re-shuffling the whole bank for every single question.
  const tiers = {
    1: shuffle(BY_DIFFICULTY[1].filter(matchesCategory)),
    2: shuffle(BY_DIFFICULTY[2].filter(matchesCategory)),
    3: shuffle(BY_DIFFICULTY[3].filter(matchesCategory)),
    4: shuffle(BY_DIFFICULTY[4].filter(matchesCategory)),
  };
  const cursors = { 1: 0, 2: 0, 3: 0, 4: 0 };

  /** Walk a tier for the first question that is fresh enough to use. */
  function takeFrom(tier, allowRecent) {
    const pool = tiers[tier];
    if (!pool.length) return null;
    const start = cursors[tier];
    for (let step = 0; step < pool.length; step += 1) {
      const i = (start + step) % pool.length;
      const q = pool[i];
      if (usedThisRun.has(q.id)) continue;
      if (!allowRecent && recentlySeen.has(q.id)) continue;
      cursors[tier] = (i + 1) % pool.length;
      return q;
    }
    return null;
  }

  function drawQuestion(index, forceDifficulty) {
    const wanted = forceDifficulty ?? difficultyFor(index, expert);
    // Try the wanted tier fresh, then nearby tiers fresh, then allow repeats.
    // Sorting by distance keeps a hard run hard when a tier runs dry.
    const order = [wanted, ...[1, 2, 3, 4].filter((d) => d !== wanted).sort(
      (a, b) => Math.abs(a - wanted) - Math.abs(b - wanted),
    )];
    for (const allowRecent of [false, true]) {
      for (const tier of order) {
        const q = takeFrom(tier, allowRecent);
        if (q) return q;
      }
    }
    // Absolute last resort: the whole bank, ignoring every constraint.
    return pick(QUESTIONS.filter(matchesCategory)) ?? pick(QUESTIONS);
  }

  return {
    /**
     * @param {number} index          how many questions have been asked
     * @param {number=} forceDifficulty pin the tier (used by sudden-death rounds)
     */
    draw(index, forceDifficulty) {
      const q = drawQuestion(index, forceDifficulty);
      usedThisRun.add(q.id);
      drawnIds.push(q.id);
      return {
        ...q,
        // Fresh option order every single time a question is served.
        options: shuffle([q.correct, ...q.wrong]),
      };
    },

    /** Remember what was asked so the next run picks different questions. */
    commit() {
      const merged = [...readJSON(SEEN_KEY, []), ...drawnIds];
      writeJSON(SEEN_KEY, merged.slice(-SEEN_CAP));
    },
  };
}

/** How many questions are available for a given category / mode. */
export function poolSize(category, expert = false) {
  return QUESTIONS.filter(
    (q) => (!category || q.category === category) && (!expert || q.d >= 3),
  ).length;
}
