# Pulse Arcade

**How sharp are you really?** Seventeen games that measure seventeen different things your brain
does — timing, reflex, inhibition, focus, memory, perception, deduction, arithmetic, nerve, and
everything you have ever read — wrapped in one arcade with medals, ranks and 57 achievements.

No sign-up, no backend, no tracking. Everything you score is stored in your own browser.

---

## The games

### Reflex & motor

| | Game | Tests | How it works |
|---|---|---|---|
| ⏱️ | **Blind Countdown** | Timing | A target time appears, then the clock blurs out. Stop it on instinct. Five rounds. |
| ⚡ | **Reaction Rush** | Reflex | Wait for green, then strike. Five rounds averaged into one raw millisecond number. |
| 🎯 | **Bullseye Blitz** | Aim | Thirty seconds of shrinking targets. Gold is triple, red detonates, missed clicks break your combo. |
| 🏃 | **Vector Run** | Endless | A 16-bit endless runner that never stops speeding up — and every 420 metres a flip gate inverts gravity. |
| 🎚️ | **Pulse Lock** | Precision | A marker sweeps across a bar. Lock it dead centre — the zone shrinks and speeds up every time you hit it. |
| 🟢 | **Trigger** | Inhibition | Go/no-go. Fire on the green circle, hold on the red square. Stopping yourself is the hard half. |

### Perception & memory

| | Game | Tests | How it works |
|---|---|---|---|
| 🎨 | **Chroma Clash** | Focus | Stroop interference: the word says one colour, the ink says another, and the rule flips mid-run. |
| 🧩 | **Memory Matrix** | Memory | Tiles flash and go dark. Rebuild the pattern as it grows a tile deeper every level. |
| 👁️ | **Shade Shift** | Perception | One tile is a slightly different shade. The grid grows, the gap narrows, your eyes give up first. |
| 🔍 | **Number Chase** | Visual search | Tap 1 → 25 in a scrambled grid that reshuffles itself every five taps. |
| 🔊 | **Echo** | Working memory | A dual N-back — the real one from the research literature. Two streams at once. Most people stall at N = 3. |

### Mind

| | Game | Tests | How it works |
|---|---|---|---|
| 🧠 | **Polymath** | Knowledge | 1,900 questions across fourteen fields. Warm-up first, then it bites. Lifelines, sudden-death rounds and an Expert mode. |
| 🔒 | **Cipher Lock** | Deduction | Mastermind. Each guess returns only "how many exact, how many misplaced". Locks run three to six digits. |
| 🔗 | **Logic Chain** | Reasoning | Generated number sequences, from arithmetic progressions up to interleaved series and digit-sum rules. |
| ➕ | **Rapid Fire** | Arithmetic | Equations with an answer attached. Half are wrong — by one digit. True or false, fast. |
| ⚖️ | **Verdict** | Snap recall | The same question bank with no time to think. Every false claim is built from that question's own distractors. |
| 🪤 | **Trapdoor** | Nerve | Climb a shaft of hidden trapdoors. Every row tells you the odds; some rows lie by one. Bank early, or lose the lot. |

Every game runs on mouse, touch and keyboard, and each has its own control scheme
(<kbd>Space</kbd> everywhere, <kbd>1</kbd>–<kbd>4</kbd> for multiple choice, <kbd>A</kbd>/<kbd>L</kbd>
for the two-way games).

## The quiz bank

**2,520 questions, none of them in the same order twice.**

- ~1,450 hand-written across seventeen categories: Science, History, Geography, Movies, Games,
  Myth, Art & Books, Screen & Sound, Tech, Sport, Nature, Space, Words, Culture and Discovery.
- ~1,070 generated from reference tables (countries, chemical elements, creators and their works,
  languages, Latin phrases, vocabulary, Roman numerals) — with distractors drawn from the *same
  slice* of the table, so a wrong answer is always a real country on the right continent, a
  neighbouring element or a painter from the same medium, never a giveaway.
- A dedicated **Expert** pool of 720 hard and brutal questions, from the Chandrasekhar limit to
  the Battle of Manzikert.

The ladder is deliberately gentle at the start: the first five questions are a warm-up, medium
does not take over until around question ten, and sudden-death rounds do not begin until Q8.

Every run shuffles the question pool *and* the answer options, and remembers the last 600 questions
you were asked so consecutive runs stay fresh.

## Progression

- **XP and ranks** — Rookie through Legend, normalised per game so no mode is the obvious farm.
- **Medals** — bronze / silver / gold / platinum thresholds in all fourteen games, shown on the
  hub cards with your next target.
- **57 achievements** across four rarity tiers, each paying out bonus XP on unlock.
- **Earned titles** — Newcomer through Arcade Legend, based on your medal cabinet.
- **Personal bests and trend sparklines**, plus a "2nd best run, +18% vs your average" readout.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle into dist/
npm run preview  # serve the built bundle
npm run lint
```

## How it is built

React 19 on Vite. **No runtime dependencies beyond React** — every piece is hand-rolled:

- **Pixel art** is drawn from string-map sprites onto a low-resolution canvas which is then scaled
  by a whole number with smoothing off — genuinely chunky 16-bit output rather than a blurred-up
  vector drawing (`src/lib/pixel.js`, including a 3×5 bitmap digit font). Vector Run derives its
  world size from whatever stage it is given, so the runner stays a big readable sprite on a phone
  as well as a desktop; Trapdoor renders a full dungeon shaft with brick walls, torches and stone
  planks.
- **Sound** is synthesised at runtime with the Web Audio API (`src/lib/sound.js`) — oscillator
  bursts and filtered noise shaped per effect, so the app ships with zero audio assets.
- **Game clocks** run `requestAnimationFrame` against `performance.now()` on a fixed timestep, so
  physics feel identical at any frame rate and scoring is honest to the millisecond.
- **Sequence puzzles** are generated from eighteen rule families with near-miss distractors
  (`src/lib/sequences.js`), so there is nothing to memorise.
- **Confetti** is a self-cleaning canvas particle system.
- **Routing** is a twelve-line hash router — the browser back button works without a router dep.
- **Persistence** is a single versioned `localStorage` key, guarded so private-mode failures
  degrade to "nothing saves" rather than crashing.

### Layout

```
src/
├── data/
│   ├── games.js        the catalogue, rank ladder, score normalisation
│   ├── medals.js       medal thresholds and earned titles
│   ├── achievements.js 57 achievements across four tiers
│   └── quiz/           question banks, reference tables, bank builder
├── lib/                sound, pixel-art renderer, rAF hooks, quiz engine,
│                       sequence generator, run lifecycle, helpers
├── state/              ArcadeContext — profile, XP, bests, medals, unlocks
├── styles/             tokens, shell, stage chrome, per-game visuals, mobile
└── components/
    ├── games/          the seventeen games
    └── ui/             icons, result card, sparkline, toasts, confetti
```

Each game owns its own state machine and calls a shared `finish()` with the same payload shape, so
the payoff moment is identical everywhere while the rules stay completely independent — and the
same games can be driven by an orchestrator without changes.

## Deploying

```bash
npm run deploy   # GitHub Pages via gh-pages
```

Netlify works from a plain `npm run build` → `dist`; `public/_redirects` handles the SPA fallback.

---

Built by [Ashish Lekhyani](https://github.com/AshishLekhyani).
