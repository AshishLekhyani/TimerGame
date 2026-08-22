import { GAME_BY_ID } from './games.js';

/**
 * Per-game medals.
 *
 * Four thresholds per game, calibrated so bronze is "you finished and paid
 * attention", gold is "you are good at this", and platinum is a genuine brag.
 * Reaction Rush is milliseconds, so its thresholds descend.
 */

export const MEDAL_TIERS = [
  { id: 'bronze', label: 'Bronze', icon: '🥉', color: '#cd7f47' },
  { id: 'silver', label: 'Silver', icon: '🥈', color: '#c3cbd8' },
  { id: 'gold', label: 'Gold', icon: '🥇', color: '#f5c542' },
  { id: 'platinum', label: 'Platinum', icon: '💎', color: '#7dd3fc' },
];

/** [bronze, silver, gold, platinum] */
export const THRESHOLDS = {
  countdown: [2000, 3200, 4500, 5600],
  reaction: [340, 295, 255, 215], // lower is better
  chroma: [1800, 3000, 4500, 6500],
  matrix: [1000, 1800, 2800, 4000],
  blitz: [1300, 2200, 3200, 4500],
  chase: [2400, 3600, 5000, 6500],
  shade: [1800, 3000, 4500, 6000],
  rapid: [1800, 3000, 4500, 6500],
  polymath: [2500, 5000, 8500, 13000],
  cipher: [1800, 3500, 5500, 8000],
  chain: [1800, 3500, 5500, 8000],
  echo: [1200, 2500, 4200, 6000],
  run: [600, 1400, 2600, 4000],
  trapdoor: [1200, 2500, 4500, 7000],
};

/**
 * Which medal a score earns.
 * @returns {number} -1 for none, otherwise the index into MEDAL_TIERS.
 */
export function medalIndexFor(gameId, score) {
  const steps = THRESHOLDS[gameId];
  const game = GAME_BY_ID[gameId];
  if (!steps || score === null || score === undefined) return -1;

  let earned = -1;
  steps.forEach((threshold, i) => {
    const reached = game?.betterIsLower ? score <= threshold : score >= threshold;
    if (reached) earned = i;
  });
  return earned;
}

export function medalFor(gameId, score) {
  const index = medalIndexFor(gameId, score);
  return index >= 0 ? MEDAL_TIERS[index] : null;
}

/** The next medal to chase, and what it needs. */
export function nextMedalFor(gameId, score) {
  const steps = THRESHOLDS[gameId];
  if (!steps) return null;
  const index = medalIndexFor(gameId, score);
  if (index >= MEDAL_TIERS.length - 1) return null;
  return { tier: MEDAL_TIERS[index + 1], target: steps[index + 1] };
}

/** Total medals earned across every game, and the tally per tier. */
export function medalTally(scores) {
  const counts = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
  let total = 0;
  for (const [gameId, entry] of Object.entries(scores ?? {})) {
    const medal = medalFor(gameId, entry?.best);
    if (medal) {
      counts[medal.id] += 1;
      total += 1;
    }
  }
  return { counts, total };
}

/**
 * Cosmetic titles unlocked by play. The highest one you qualify for is the one
 * shown next to your name.
 */
export const TITLES = [
  { id: 'newcomer', label: 'Newcomer', test: () => true },
  { id: 'regular', label: 'Regular', test: (p) => p.totalRuns >= 10 },
  { id: 'collector', label: 'Collector', test: (p) => medalTally(p.scores).total >= 4 },
  { id: 'medalist', label: 'Medalist', test: (p) => medalTally(p.scores).total >= 8 },
  { id: 'decorated', label: 'Decorated', test: (p) => medalTally(p.scores).counts.gold >= 4 },
  { id: 'completionist', label: 'Completionist', test: (p) => Object.keys(p.scores).length >= 14 },
  { id: 'perfectionist', label: 'Perfectionist', test: (p) => medalTally(p.scores).counts.platinum >= 3 },
  { id: 'arcade-legend', label: 'Arcade Legend', test: (p) => medalTally(p.scores).counts.platinum >= 8 },
];

export function titleFor(profile) {
  let best = TITLES[0];
  for (const t of TITLES) {
    try {
      if (t.test(profile)) best = t;
    } catch {
      /* a malformed save should never break the header */
    }
  }
  return best;
}
