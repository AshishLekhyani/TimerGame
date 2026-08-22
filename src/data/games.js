/**
 * The arcade catalogue.
 *
 * `betterIsLower` flips how personal bests are compared — Reaction Rush is
 * scored in milliseconds, everything else in points.
 * `duration` is a rough "how long is one run" hint, used by the hub and by the
 * Gauntlet to estimate how much of your life you are about to spend.
 */

export const GAMES = [
  {
    id: 'countdown',
    name: 'Blind Countdown',
    short: 'Countdown',
    tag: 'Timing',
    icon: 'timer',
    accent: '#22e3d6',
    accentSoft: 'rgba(34, 227, 214, 0.14)',
    accentGlow: 'rgba(34, 227, 214, 0.42)',
    tagline: 'Stop the clock without seeing it',
    description:
      'The timer vanishes a heartbeat after it starts. Five rounds, five targets — land each one on instinct alone.',
    unit: 'points',
    betterIsLower: false,
    duration: 60,
    rules: [
      'A target time appears, then the clock goes dark.',
      'Hit STOP the moment you think you have reached it.',
      'The closer you land, the bigger the multiplier.',
    ],
  },
  {
    id: 'reaction',
    name: 'Reaction Rush',
    short: 'Reaction',
    tag: 'Reflex',
    icon: 'bolt',
    accent: '#a3e635',
    accentSoft: 'rgba(163, 230, 53, 0.14)',
    accentGlow: 'rgba(163, 230, 53, 0.42)',
    tagline: 'How fast is your wiring, really?',
    description:
      'Wait for green, then strike. Five rounds averaged into one raw number — the one benchmark you cannot fake.',
    unit: 'avg ms',
    betterIsLower: true,
    duration: 40,
    rules: [
      'The pad turns red. Hold still — the delay is random.',
      'The instant it flashes green, click or press SPACE.',
      'Jump early and the round is voided.',
    ],
  },
  {
    id: 'chroma',
    name: 'Chroma Clash',
    short: 'Chroma',
    tag: 'Focus',
    icon: 'palette',
    accent: '#f0499b',
    accentSoft: 'rgba(240, 73, 155, 0.14)',
    accentGlow: 'rgba(240, 73, 155, 0.42)',
    tagline: 'Your eyes and your brain disagree',
    description:
      'The word says one colour, the ink says another. The rule flips without warning and the clock never stops draining.',
    unit: 'points',
    betterIsLower: false,
    duration: 45,
    rules: [
      'Match either the INK colour or the WORD — read the prompt.',
      'Right answers buy you time, wrong ones cost a life.',
      'Chain correct answers to build a multiplier.',
    ],
  },
  {
    id: 'matrix',
    name: 'Memory Matrix',
    short: 'Matrix',
    tag: 'Memory',
    icon: 'grid',
    accent: '#a78bfa',
    accentSoft: 'rgba(167, 139, 250, 0.14)',
    accentGlow: 'rgba(167, 139, 250, 0.42)',
    tagline: 'Photograph the pattern. Rebuild it.',
    description:
      'Tiles flash for a moment and go dark. Repeat the pattern from memory as it grows one tile deeper every level.',
    unit: 'points',
    betterIsLower: false,
    duration: 60,
    rules: [
      'Watch the tiles light up, then tap them back.',
      'Order does not matter — accuracy does.',
      'Three mistakes and the run is over.',
    ],
  },
  {
    id: 'blitz',
    name: 'Bullseye Blitz',
    short: 'Blitz',
    tag: 'Aim',
    icon: 'target',
    accent: '#fbbf24',
    accentSoft: 'rgba(251, 191, 36, 0.14)',
    accentGlow: 'rgba(251, 191, 36, 0.42)',
    tagline: 'Thirty seconds. Everything moving.',
    description:
      'Pop targets before they collapse, chase the gold ones, and whatever you do — do not touch the red.',
    unit: 'points',
    betterIsLower: false,
    duration: 30,
    rules: [
      'Hit targets fast — points decay as they shrink.',
      'Gold targets are worth triple. Red ones detonate.',
      'Missed clicks break your combo chain.',
    ],
  },
  {
    id: 'chase',
    name: 'Number Chase',
    short: 'Chase',
    tag: 'Search',
    icon: 'search',
    accent: '#4f8cff',
    accentSoft: 'rgba(79, 140, 255, 0.14)',
    accentGlow: 'rgba(79, 140, 255, 0.42)',
    tagline: 'Find 1 to 25 before the board moves',
    description:
      'A scrambled grid of twenty-five numbers. Tap them in order — and every five taps, the whole board rearranges itself.',
    unit: 'points',
    betterIsLower: false,
    duration: 45,
    rules: [
      'Tap the numbers in order, 1 through 25.',
      'From 10 on, the grid reshuffles every five taps.',
      'A wrong tap adds two seconds to your time.',
    ],
  },
  {
    id: 'shade',
    name: 'Shade Shift',
    short: 'Shade',
    tag: 'Perception',
    icon: 'eye',
    accent: '#2fd97a',
    accentSoft: 'rgba(47, 217, 122, 0.14)',
    accentGlow: 'rgba(47, 217, 122, 0.42)',
    tagline: 'One tile is lying to you',
    description:
      'Every square is the same colour except one. The grid grows, the difference shrinks, and eventually your eyes give up before your brain does.',
    unit: 'points',
    betterIsLower: false,
    duration: 60,
    rules: [
      'Tap the tile whose shade is different.',
      'Each level adds tiles and narrows the gap.',
      'Wrong taps cost you three seconds.',
    ],
  },
  {
    id: 'rapid',
    name: 'Rapid Fire',
    short: 'Rapid',
    tag: 'Numbers',
    icon: 'calc',
    accent: '#ff6b4a',
    accentSoft: 'rgba(255, 107, 74, 0.14)',
    accentGlow: 'rgba(255, 107, 74, 0.42)',
    tagline: 'True or false, and hurry up',
    description:
      'Equations fly past with an answer attached. Half of them are wrong — some by a single digit. Decide fast, decide often.',
    unit: 'points',
    betterIsLower: false,
    duration: 50,
    rules: [
      'Is the equation correct? Hit TRUE or FALSE.',
      'Wrong answers cost a life, right ones buy time.',
      'The maths gets uglier the longer you last.',
    ],
  },
  {
    id: 'polymath',
    name: 'Polymath',
    short: 'Quiz',
    tag: 'Knowledge',
    icon: 'brain',
    accent: '#7dd3fc',
    accentSoft: 'rgba(125, 211, 252, 0.14)',
    accentGlow: 'rgba(125, 211, 252, 0.42)',
    tagline: 'Three lives. Questions that bite back.',
    description:
      'Over 2,500 questions across sixteen fields, in a different order every single run. A gentle warm-up, then the clock tightens and every seventh question becomes sudden death.',
    unit: 'points',
    betterIsLower: false,
    duration: 120,
    rules: [
      'Answer before the clock runs out — three lives, no mercy.',
      'Every 7th question is sudden death: one wrong answer ends the run.',
      'Three lifelines per run: 50:50, +12 seconds, and one skip.',
    ],
  },
  {
    id: 'cipher',
    name: 'Cipher Lock',
    short: 'Cipher',
    tag: 'Deduction',
    icon: 'lock',
    accent: '#d946ef',
    accentSoft: 'rgba(217, 70, 239, 0.14)',
    accentGlow: 'rgba(217, 70, 239, 0.42)',
    tagline: 'Crack the code from what it refuses to tell you',
    description:
      'A hidden combination. Every guess returns two numbers and nothing else: how many digits are exactly right, and how many are right but misplaced. Deduce the rest.',
    unit: 'points',
    betterIsLower: false,
    duration: 180,
    rules: [
      'Guess the hidden code, then read the feedback carefully.',
      'Each lock is longer than the last — three digits up to six.',
      'Run out of guesses and it costs a life.',
    ],
  },
  {
    id: 'chain',
    name: 'Logic Chain',
    short: 'Chain',
    tag: 'Reasoning',
    icon: 'chain',
    accent: '#14b8a6',
    accentSoft: 'rgba(20, 184, 166, 0.14)',
    accentGlow: 'rgba(20, 184, 166, 0.42)',
    tagline: 'Find the rule, then break the sequence',
    description:
      'Five numbers, one missing sixth. Start with arithmetic and end at interleaved sequences and digit-sum rules. Every puzzle is generated fresh — there is nothing to memorise.',
    unit: 'points',
    betterIsLower: false,
    duration: 120,
    rules: [
      'Work out what turns each term into the next.',
      'The rules get uglier every level — and the clock is draining.',
      'Correct answers buy time. Three mistakes end the run.',
    ],
  },
  {
    id: 'echo',
    name: 'Echo',
    short: 'Echo',
    tag: 'Working memory',
    icon: 'echo',
    accent: '#f43f5e',
    accentSoft: 'rgba(244, 63, 94, 0.14)',
    accentGlow: 'rgba(244, 63, 94, 0.42)',
    tagline: 'The hardest thing in this arcade',
    description:
      'A dual N-back — the working-memory task from the research literature. Two streams at once, and you must say whether each matches what it was N steps ago. Most people stall at N = 3.',
    unit: 'points',
    betterIsLower: false,
    duration: 150,
    rules: [
      'Watch the square and the letter. Both are separate streams.',
      'Press A if the position repeats from N steps back, L if the letter does.',
      'Hit 80% with few false alarms and N goes up.',
    ],
  },
  {
    id: 'run',
    name: 'Vector Run',
    short: 'Run',
    tag: 'Endless',
    icon: 'run',
    accent: '#fde047',
    accentSoft: 'rgba(253, 224, 71, 0.14)',
    accentGlow: 'rgba(253, 224, 71, 0.42)',
    tagline: 'Run until gravity turns on you',
    description:
      'An endless runner that never stops speeding up. Jump the spikes, duck the bars, grab the pulses — and every 420 metres a flip gate inverts gravity and you finish the run upside down.',
    unit: 'points',
    betterIsLower: false,
    duration: 90,
    rules: [
      'Tap the upper half or press SPACE to jump.',
      'Tap the lower half or hold DOWN to duck under the red bars.',
      'Flip gates invert the world. Your reflexes will not like it.',
    ],
  },
  {
    id: 'trapdoor',
    name: 'Trapdoor',
    short: 'Trapdoor',
    tag: 'Nerve',
    icon: 'trapdoor',
    accent: '#9ca3af',
    accentSoft: 'rgba(156, 163, 175, 0.16)',
    accentGlow: 'rgba(156, 163, 175, 0.45)',
    tagline: 'It tells you the odds. Never the tile.',
    description:
      'Climb a tower of hidden trapdoors. Every row admits how many of its five tiles will drop you — and some rows lie by exactly one. Bank your pot early, or keep climbing and risk the lot.',
    unit: 'points banked',
    betterIsLower: false,
    duration: 120,
    rules: [
      'Pick a tile in each row. The number on the right is how many are traps.',
      'Bank whenever you like — falling on your last life loses everything unbanked.',
      'Rows marked with a red ? are lying by one, in some direction.',
    ],
  },
  {
    id: 'lock',
    name: 'Pulse Lock',
    short: 'Lock',
    tag: 'Precision',
    icon: 'lock2',
    accent: '#38bdf8',
    accentSoft: 'rgba(56, 189, 248, 0.14)',
    accentGlow: 'rgba(56, 189, 248, 0.42)',
    tagline: 'Stop the sweep dead centre',
    description:
      'A marker races back and forth across a bar. Lock it inside the target zone — which shrinks and speeds up every single time you hit it. Dead centre is worth four times an edge clip.',
    unit: 'points',
    betterIsLower: false,
    duration: 70,
    rules: [
      'Hit SPACE or tap to stop the sweeping marker.',
      'Land inside the zone. The closer to the centre, the more it pays.',
      'The zone shrinks every level. Three misses ends the run.',
    ],
  },
  {
    id: 'trigger',
    name: 'Trigger',
    short: 'Trigger',
    tag: 'Inhibition',
    icon: 'trigger',
    accent: '#4ade80',
    accentSoft: 'rgba(74, 222, 128, 0.14)',
    accentGlow: 'rgba(74, 222, 128, 0.42)',
    tagline: 'Fire on green. Do not fire on red.',
    description:
      'A go/no-go task. Reaction Rush measures how fast you can move; this measures how fast you can move and stop. A third of the cues are traps, and firing on one costs more than a slow answer.',
    unit: 'points',
    betterIsLower: false,
    duration: 60,
    rules: [
      'A green circle means fire. A red square means hold.',
      'Firing on a hold costs far more than reacting slowly.',
      'The gap between cues keeps shrinking.',
    ],
  },
  {
    id: 'verdict',
    name: 'Verdict',
    short: 'Verdict',
    tag: 'Snap recall',
    icon: 'gavel',
    accent: '#c084fc',
    accentSoft: 'rgba(192, 132, 252, 0.14)',
    accentGlow: 'rgba(192, 132, 252, 0.42)',
    tagline: 'One claim, two seconds, true or false',
    description:
      'The same 2,500-question bank as Polymath, but with no time to think. Every false claim is built from the question’s own distractors, so it is always a plausible answer — you cannot spot the lie by feel.',
    unit: 'points',
    betterIsLower: false,
    duration: 60,
    rules: [
      'Read the question, then judge the answer shown below it.',
      'Right answers buy time, wrong ones cost a life.',
      'Harder questions are worth more.',
    ],
  },
];

export const GAME_BY_ID = Object.fromEntries(GAMES.map((g) => [g.id, g]));

export const GAME_IDS = GAMES.map((g) => g.id);

/** Rank ladder. Level is derived from total XP; the title comes from level. */
export const RANKS = [
  { at: 1, title: 'Rookie' },
  { at: 3, title: 'Novice' },
  { at: 6, title: 'Sharp' },
  { at: 10, title: 'Quick' },
  { at: 15, title: 'Elite' },
  { at: 21, title: 'Master' },
  { at: 30, title: 'Legend' },
];

/** XP needed to finish a given level — a gentle curve, not a grind. */
export const xpForLevel = (level) => 400 + (level - 1) * 220;

export function levelFromXp(totalXp) {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level += 1;
  }
  return { level, into: remaining, need: xpForLevel(level) };
}

export function rankTitle(level) {
  let title = RANKS[0].title;
  for (const r of RANKS) if (level >= r.at) title = r.title;
  return title;
}

/**
 * Normalise a raw game score to roughly 0–1000 so scores from different games
 * can be added together in the Gauntlet and the Daily Challenge.
 * `par` is a solid-but-not-elite run; hitting par scores 500.
 */
const PAR = {
  countdown: 3200,
  reaction: 300, // ms — lower is better
  chroma: 3000,
  matrix: 1800,
  blitz: 2200,
  chase: 3600,
  shade: 3000,
  rapid: 3000,
  polymath: 5000,
  cipher: 3500,
  chain: 3500,
  echo: 2500,
  run: 1400,
  trapdoor: 2500,
  lock: 3200,
  trigger: 2600,
  verdict: 3800,
};

export function normaliseScore(gameId, score) {
  const par = PAR[gameId] ?? 1000;
  const game = GAME_BY_ID[gameId];
  if (!game) return 0;
  const ratio = game.betterIsLower ? par / Math.max(1, score) : score / par;
  // Square-root the tail so a monster run cannot dwarf the other seven games.
  const scaled = ratio <= 1 ? ratio * 500 : 500 + Math.sqrt(ratio - 1) * 420;
  return Math.round(Math.max(0, Math.min(1000, scaled)));
}
