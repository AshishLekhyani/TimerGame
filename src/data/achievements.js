import { medalTally } from './medals.js';

/**
 * Achievements.
 *
 * Each `test` receives:
 *   run     — { gameId, score, stats } for the run that just ended
 *   profile — the persisted profile *after* the run was recorded
 *
 * `tier` drives the colour of the toast and badge; `xp` is a one-off bonus
 * granted the moment it unlocks.
 */

const TIERS = {
  common: { label: 'Common', color: '#a6abc8', xp: 60 },
  rare: { label: 'Rare', color: '#4f8cff', xp: 150 },
  epic: { label: 'Epic', color: '#a78bfa', xp: 320 },
  legendary: { label: 'Legendary', color: '#fbbf24', xp: 700 },
};

export const ACHIEVEMENT_TIERS = TIERS;

const a = (id, icon, title, desc, tier, test) => ({
  id,
  icon,
  title,
  desc,
  tier,
  xp: TIERS[tier].xp,
  test,
});

/** Convenience: did this run belong to game X and clear a stat threshold? */
const stat = (gameId, key, min) => (run) =>
  run.gameId === gameId && (run.stats?.[key] ?? 0) >= min;
const scoreAtLeast = (gameId, min) => (run) => run.gameId === gameId && run.score >= min;

export const ACHIEVEMENTS = [
  // ---------------- getting started ----------------
  a('first-blood', '🎮', 'Warmed Up', 'Finish your first run.', 'common', (_r, p) => p.totalRuns >= 1),
  a('five-games', '🗺️', 'Tourist', 'Play five different games.', 'common', (_r, p) => Object.keys(p.scores).length >= 5),
  a('all-games', '🧭', 'Every Corner', 'Play all fourteen games at least once.', 'epic', (_r, p) => Object.keys(p.scores).length >= 14),
  a('grinder-25', '🔁', 'Hooked', 'Finish 25 runs.', 'common', (_r, p) => p.totalRuns >= 25),
  a('grinder-100', '♾️', 'Devoted', 'Finish 100 runs.', 'epic', (_r, p) => p.totalRuns >= 100),
  a('grinder-250', '🛐', 'Resident', 'Finish 250 runs.', 'legendary', (_r, p) => p.totalRuns >= 250),
  a('named', '📛', 'Identified', 'Set yourself a callsign.', 'common', (_r, p) => Boolean(p.name)),

  // ---------------- ranks ----------------
  a('level-5', '🎖️', 'Getting Sharp', 'Reach level 5.', 'common', (_r, p) => p.level >= 5),
  a('level-15', '👑', 'Elite', 'Reach level 15.', 'epic', (_r, p) => p.level >= 15),
  a('level-30', '🌟', 'Legend', 'Reach level 30.', 'legendary', (_r, p) => p.level >= 30),

  // ---------------- medals ----------------
  a('medal-first', '🥉', 'First Medal', 'Earn any medal.', 'common', (_r, p) => medalTally(p.scores).total >= 1),
  a('medal-five', '🎗️', 'Collector', 'Earn five medals.', 'rare', (_r, p) => medalTally(p.scores).total >= 5),
  a('medal-gold', '🥇', 'Struck Gold', 'Earn a gold medal in any game.', 'rare', (_r, p) => medalTally(p.scores).counts.gold >= 1),
  a('medal-gold-5', '🏆', 'Decorated', 'Earn five gold medals.', 'epic', (_r, p) => medalTally(p.scores).counts.gold >= 5),
  a('medal-plat', '💎', 'Flawless', 'Earn a platinum medal.', 'epic', (_r, p) => medalTally(p.scores).counts.platinum >= 1),
  a('medal-plat-5', '👸', 'Untouchable', 'Earn five platinum medals.', 'legendary', (_r, p) => medalTally(p.scores).counts.platinum >= 5),
  a('medal-all', '🌈', 'Full Cabinet', 'Earn a medal in every single game.', 'legendary', (_r, p) => medalTally(p.scores).total >= 14),

  // ---------------- Blind Countdown ----------------
  a('bullseye', '🎯', 'Dead On', 'Land a perfect round in Blind Countdown.', 'rare', stat('countdown', 'perfects', 1)),
  a('bullseye-3', '⏳', 'Metronome', 'Land three perfect rounds in one Countdown run.', 'epic', stat('countdown', 'perfects', 3)),
  a('clockwork', '⏱️', 'Clockwork', 'Score 4,000+ in Blind Countdown.', 'rare', scoreAtLeast('countdown', 4000)),

  // ---------------- Reaction Rush ----------------
  a('lightning', '⚡', 'Lightning', 'Average under 250ms in Reaction Rush.', 'rare', (r) => r.gameId === 'reaction' && r.score > 0 && r.score < 250),
  a('inhuman', '👽', 'Inhuman', 'Average under 200ms in Reaction Rush.', 'legendary', (r) => r.gameId === 'reaction' && r.score > 0 && r.score < 200),
  a('unshaken', '🧊', 'Unshaken', 'Clear Reaction Rush without a false start.', 'common', (r) => r.gameId === 'reaction' && r.stats?.falseStarts === 0),

  // ---------------- Chroma Clash ----------------
  a('stroop-10', '🌈', 'Unconfused', 'Hit a 10x streak in Chroma Clash.', 'common', stat('chroma', 'bestStreak', 10)),
  a('stroop-25', '🧠', 'Iron Focus', 'Hit a 25x streak in Chroma Clash.', 'epic', stat('chroma', 'bestStreak', 25)),
  a('stroop-40', '🔮', 'Colour Blind', 'Hit a 40x streak in Chroma Clash.', 'legendary', stat('chroma', 'bestStreak', 40)),

  // ---------------- Memory Matrix ----------------
  a('matrix-7', '🧩', 'Photographic', 'Reach level 7 in Memory Matrix.', 'rare', stat('matrix', 'level', 7)),
  a('matrix-10', '🗿', 'Total Recall', 'Reach level 10 in Memory Matrix.', 'epic', stat('matrix', 'level', 10)),
  a('matrix-flawless', '💠', 'Flawless Recall', 'Reach level 5 in Memory Matrix with no mistakes.', 'rare', (r) => r.gameId === 'matrix' && (r.stats?.level ?? 0) >= 5 && (r.stats?.mistakes ?? 1) === 0),

  // ---------------- Bullseye Blitz ----------------
  a('sniper', '🏹', 'Sniper', '90%+ accuracy in Bullseye Blitz.', 'rare', (r) => r.gameId === 'blitz' && (r.stats?.shots ?? 0) >= 15 && (r.stats?.accuracy ?? 0) >= 90),
  a('combo-15', '🔥', 'On Fire', 'Reach a 15x combo in Bullseye Blitz.', 'rare', stat('blitz', 'bestCombo', 15)),
  a('combo-30', '☄️', 'Untouchable Aim', 'Reach a 30x combo in Bullseye Blitz.', 'epic', stat('blitz', 'bestCombo', 30)),

  // ---------------- Number Chase ----------------
  a('chase-clean', '👀', 'Clean Sweep', 'Finish Number Chase without a wrong tap.', 'rare', (r) => r.gameId === 'chase' && (r.stats?.penalties ?? 1) === 0),
  a('chase-fast', '💨', 'Scanner', 'Finish Number Chase in under 25 seconds.', 'epic', (r) => r.gameId === 'chase' && (r.stats?.seconds ?? 999) < 25),

  // ---------------- Shade Shift ----------------
  a('shade-10', '🎨', 'Keen Eye', 'Reach level 10 in Shade Shift.', 'rare', stat('shade', 'level', 10)),
  a('shade-16', '🦅', 'Hawk Eye', 'Reach level 16 in Shade Shift.', 'legendary', stat('shade', 'level', 16)),

  // ---------------- Rapid Fire ----------------
  a('rapid-20', '🧮', 'Quick Sums', 'Hit a 20x streak in Rapid Fire.', 'rare', stat('rapid', 'bestStreak', 20)),
  a('rapid-95', '📐', 'Human Calculator', '95%+ accuracy in Rapid Fire.', 'epic', (r) => r.gameId === 'rapid' && (r.stats?.correct ?? 0) >= 20 && (r.stats?.accuracy ?? 0) >= 95),

  // ---------------- Polymath ----------------
  a('quiz-10', '📚', 'Well Read', 'Answer 10 in a row in Polymath.', 'rare', stat('polymath', 'bestStreak', 10)),
  a('quiz-20', '🎓', 'Polymath', 'Answer 20 in a row in Polymath.', 'epic', stat('polymath', 'bestStreak', 20)),
  a('quiz-expert', '☠️', 'No Warm-Up', 'Score 5,000+ on Polymath in Expert mode.', 'legendary', (r) => r.gameId === 'polymath' && r.stats?.expert && r.score >= 5000),
  a('quiz-sudden', '💀', 'Death Defier', 'Survive a sudden-death question.', 'rare', (r) => r.gameId === 'polymath' && (r.stats?.asked ?? 0) > 8 && (r.stats?.bestStreak ?? 0) >= 8),

  // ---------------- Cipher Lock ----------------
  a('cipher-1', '🔓', 'Way In', 'Crack a cipher lock.', 'common', stat('cipher', 'cracked', 1)),
  a('cipher-3', '🗝️', 'Locksmith', 'Crack three locks in one run.', 'epic', stat('cipher', 'cracked', 3)),
  a('cipher-5', '🕵️', 'Codebreaker', 'Crack five locks in one run.', 'legendary', stat('cipher', 'cracked', 5)),

  // ---------------- Logic Chain ----------------
  a('chain-10', '🔗', 'Pattern Seeker', 'Solve 10 sequences in one run.', 'rare', stat('chain', 'solved', 10)),
  a('chain-18', '🧬', 'Rule Breaker', 'Solve 18 sequences in one run.', 'legendary', stat('chain', 'solved', 18)),

  // ---------------- Echo ----------------
  a('echo-3', '🔊', 'Three Back', 'Reach N = 3 in Echo.', 'rare', stat('echo', 'n', 3)),
  a('echo-4', '🛰️', 'Four Back', 'Reach N = 4 in Echo.', 'epic', stat('echo', 'n', 4)),
  a('echo-5', '🧿', 'Five Back', 'Reach N = 5 in Echo. Almost nobody does.', 'legendary', stat('echo', 'n', 5)),

  // ---------------- Vector Run ----------------
  a('run-flip', '🙃', 'Upside Down', 'Pass a flip gate in Vector Run.', 'common', stat('run', 'flips', 1)),
  a('run-1000', '🏃', 'Long Hauler', 'Run 1,000 metres in Vector Run.', 'rare', stat('run', 'distance', 1000)),
  a('run-2500', '🚀', 'Ceiling Dweller', 'Run 2,500 metres in Vector Run.', 'legendary', stat('run', 'distance', 2500)),
  a('run-pulses', '💛', 'Magpie', 'Collect 20 pulses in one run.', 'rare', stat('run', 'pulses', 20)),

  // ---------------- Trapdoor ----------------
  a('trap-bank', '🏦', 'Knew When', 'Bank a pot in Trapdoor.', 'common', (r) => r.gameId === 'trapdoor' && r.score > 0),
  a('trap-tower', '🗼', 'Top Floor', 'Clear a whole Trapdoor tower.', 'epic', stat('trapdoor', 'towers', 1)),
  a('trap-2', '😈', 'Tempting Fate', 'Clear two Trapdoor towers in one run.', 'legendary', stat('trapdoor', 'towers', 2)),
];

export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((x) => [x.id, x]));

export const ACHIEVEMENT_COUNT = ACHIEVEMENTS.length;
