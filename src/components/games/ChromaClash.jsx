import { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame from '../GameFrame.jsx';
import ReadySplash from '../ui/ReadySplash.jsx';
import ResultCard from '../ui/ResultCard.jsx';
import { FREE_SESSION, useGameRun } from '../../lib/useGameRun.js';
import { useRafLoop } from '../../lib/useRafLoop.js';
import { clamp, formatScore, pick, shuffle } from '../../lib/util.js';
import { play, buzz } from '../../lib/sound.js';

const COLORS = [
  { key: 'red', label: 'Red', hex: '#ff4d5e' },
  { key: 'blue', label: 'Blue', hex: '#4d8dff' },
  { key: 'green', label: 'Green', hex: '#3ddc84' },
  { key: 'yellow', label: 'Yellow', hex: '#ffd23d' },
];

const TIME_BUDGET = 9000;
const REWARD = 950;
const PENALTY = 1800;
const LIVES = 3;

/** Build a question. From question 4 on, the rule starts flipping. */
function makeQuestion(index) {
  const word = pick(COLORS);
  // Conflicting ink most of the time — that is the whole point of the game.
  const ink = Math.random() < 0.8 ? pick(COLORS.filter((c) => c.key !== word.key)) : word;
  const mode = index >= 3 && Math.random() < 0.35 ? 'word' : 'ink';
  return { word, ink, mode, answer: mode === 'ink' ? ink.key : word.key, options: shuffle(COLORS) };
}

export default function ChromaClash({ game, onExit, session = FREE_SESSION }) {
  const { finish, rearm, result } = useGameRun(game, session);

  const [phase, setPhase] = useState('ready'); // ready | playing | done
  const [question, setQuestion] = useState(() => makeQuestion(0));
  const [timeLeft, setTimeLeft] = useState(TIME_BUDGET);
  const [lives, setLives] = useState(LIVES);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, index: 0 });
  const [flash, setFlash] = useState(null); // { key, kind }

  const askedAt = useRef(0);

  // Drain the clock; it speeds up the longer you survive.
  useRafLoop(phase === 'playing', (delta) => {
    const rate = Math.min(2.2, 1 + stats.index * 0.03);
    setTimeLeft((t) => Math.max(0, t - delta * rate));
  });

  // End the run from an effect rather than inside a state updater, so React can
  // safely re-run the updater in StrictMode.
  useEffect(() => {
    if (phase === 'playing' && timeLeft <= 0) setPhase('done');
  }, [phase, timeLeft]);

  const begin = useCallback(() => {
    play('start');
    setQuestion(makeQuestion(0));
    setTimeLeft(TIME_BUDGET);
    setLives(LIVES);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setStats({ correct: 0, wrong: 0, index: 0 });
    setFlash(null);
    rearm();
    askedAt.current = performance.now();
    setPhase('playing');
  }, [rearm]);

  const answer = useCallback(
    (colorKey) => {
      if (phase !== 'playing') return;

      const correct = colorKey === question.answer;
      const took = performance.now() - askedAt.current;
      setFlash({ key: colorKey, kind: correct ? 'right' : 'wrong' });
      setTimeout(() => setFlash(null), 380);

      if (correct) {
        // Faster answers are worth more, and streaks multiply everything.
        const speed = clamp(1 - took / 1600, 0, 1);
        const nextStreak = streak + 1;
        const mult = Math.min(5, 1 + Math.floor(nextStreak / 5));
        const points = Math.round((60 + 110 * speed) * mult);

        play(nextStreak > 0 && nextStreak % 5 === 0 ? 'great' : 'good');
        buzz(8);
        setScore((s) => s + points);
        setStreak(nextStreak);
        setBestStreak((b) => Math.max(b, nextStreak));
        setTimeLeft((t) => Math.min(TIME_BUDGET, t + REWARD));
        setStats((s) => ({ ...s, correct: s.correct + 1, index: s.index + 1 }));
      } else {
        play('bad');
        buzz([18, 40, 18]);
        setStreak(0);
        setTimeLeft((t) => Math.max(0, t - PENALTY));
        setStats((s) => ({ ...s, wrong: s.wrong + 1, index: s.index + 1 }));
        const nextLives = lives - 1;
        setLives(nextLives);
        if (nextLives <= 0) setPhase('done');
      }

      setQuestion(makeQuestion(stats.index + 1));
      askedAt.current = performance.now();
    },
    [phase, question, streak, stats.index, lives],
  );

  // --- commit the run ---------------------------------------------------
  useEffect(() => {
    if (phase !== 'done') return;
    const total = stats.correct + stats.wrong;
    const accuracy = total ? Math.round((stats.correct / total) * 100) : 0;

    finish({
      score,
      stats: { bestStreak, correct: stats.correct, wrong: stats.wrong },
      scoreLabel: formatScore(score),
      unitLabel: 'points',
      verdict:
        score >= 6000
          ? 'Immune to interference'
          : score >= 3500
            ? 'Impressively unshakeable'
            : score >= 1800
              ? 'You held it together'
              : 'The words won this time',
      blurb:
        lives <= 0
          ? 'Three wrong answers ended the run. The rule flip is what gets most people.'
          : 'The clock ran dry. Correct answers buy time — hesitation costs it.',
      cells: [
        { label: 'Best streak', value: `${bestStreak}x`, tone: 'var(--magenta)' },
        { label: 'Correct', value: stats.correct },
        { label: 'Accuracy', value: `${accuracy}%` },
      ],
    });
  }, [phase, score, bestStreak, stats, lives, finish]);

  // --- keyboard: 1-4 pick the swatch in that position --------------------
  useEffect(() => {
    function onKey(e) {
      if (phase === 'ready' && (e.code === 'Space' || e.key === 'Enter')) {
        e.preventDefault();
        begin();
        return;
      }
      if (phase !== 'playing') return;
      const slot = Number(e.key);
      if (slot >= 1 && slot <= 4) answer(question.options[slot - 1].key);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, begin, answer, question]);

  const timeFrac = timeLeft / TIME_BUDGET;
  const mult = Math.min(5, 1 + Math.floor(streak / 5));

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      session={session}
      running={phase === 'playing'}
      liveScore={formatScore(score)}
    >
      <section className="stage">
        {phase === 'playing' && (
          <>
            <div className="timebar">
              <div
                className="timebar__fill"
                data-low={timeFrac < 0.28}
                style={{ transform: `scaleX(${Math.max(0, timeFrac)})` }}
              />
            </div>

            <div className="hudbar">
              <span className="lives" aria-label={`${lives} lives left`}>
                {Array.from({ length: LIVES }, (_, i) => (
                  <span key={i} className="life" data-lost={i >= lives} />
                ))}
              </span>
              <span className="hudbar__cell">
                Streak <b>{streak}</b>
              </span>
            </div>

            {mult > 1 && (
              <div className="combo" key={mult}>
                {mult}× <small>mult</small>
              </div>
            )}
          </>
        )}

        {phase === 'ready' && <ReadySplash game={game} onStart={begin} cta="Start" />}

        {phase === 'playing' && (
          <div className="stroop">
            <span className="stroop__prompt">
              Tap the <b>{question.mode === 'ink' ? 'ink colour' : 'word'}</b>
            </span>

            <span
              className="stroop__word"
              key={`${stats.index}-${question.word.key}-${question.ink.key}`}
              style={{ color: question.ink.hex }}
            >
              {question.word.label}
            </span>

            <div className="swatches">
              {question.options.map((c, i) => (
                <button
                  key={c.key}
                  type="button"
                  className="swatch"
                  style={{ '--sw': c.hex }}
                  data-flash={flash?.key === c.key ? flash.kind : undefined}
                  onClick={() => answer(c.key)}
                >
                  <span className="swatch__key">{i + 1}</span>
                  {c.label}
                </button>
              ))}
            </div>

            <p className="stage__label">
              keys <span className="kbd">1</span>–<span className="kbd">4</span> work too
            </p>
          </div>
        )}
      </section>

      {result && (
        <ResultCard {...result} gameId={game.id} onReplay={begin} onExit={onExit} />
      )}
    </GameFrame>
  );
}
