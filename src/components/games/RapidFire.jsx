import { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame from '../GameFrame.jsx';
import ReadySplash from '../ui/ReadySplash.jsx';
import ResultCard from '../ui/ResultCard.jsx';
import { FREE_SESSION, useGameRun } from '../../lib/useGameRun.js';
import { useRafLoop } from '../../lib/useRafLoop.js';
import { clamp, formatScore, pick, randInt } from '../../lib/util.js';
import { play, buzz } from '../../lib/sound.js';
import { Check, Cross } from '../ui/Icons.jsx';

const TIME_BUDGET = 10000;
const REWARD = 1100;
const PENALTY = 2200;
const LIVES = 3;

/**
 * Build an equation and a proposed answer, which is right about half the time.
 *
 * The lies are deliberately near-misses — off by one, off by ten, a digit
 * transposed, or the right answer to the wrong operator. You cannot eyeball
 * the magnitude and guess; you have to actually compute it.
 */
function makeProblem(index) {
  const tier = index < 5 ? 1 : index < 12 ? 2 : index < 22 ? 3 : 4;
  let text;
  let value;

  if (tier === 1) {
    const a = randInt(6, 40);
    const b = randInt(4, 30);
    const plus = Math.random() < 0.5;
    text = `${a} ${plus ? '+' : '−'} ${b}`;
    value = plus ? a + b : a - b;
  } else if (tier === 2) {
    const style = randInt(0, 2);
    if (style === 0) {
      const a = randInt(3, 12);
      const b = randInt(3, 12);
      text = `${a} × ${b}`;
      value = a * b;
    } else if (style === 1) {
      const a = randInt(40, 190);
      const b = randInt(20, 90);
      text = `${a} − ${b}`;
      value = a - b;
    } else {
      const b = randInt(3, 12);
      const q = randInt(3, 12);
      text = `${b * q} ÷ ${b}`;
      value = q;
    }
  } else if (tier === 3) {
    const style = randInt(0, 2);
    if (style === 0) {
      const a = randInt(11, 25);
      const b = randInt(6, 19);
      text = `${a} × ${b}`;
      value = a * b;
    } else if (style === 1) {
      const a = randInt(4, 14);
      const b = randInt(3, 11);
      const c = randInt(5, 30);
      text = `${a} × ${b} + ${c}`;
      value = a * b + c;
    } else {
      const a = randInt(5, 15);
      text = `${a}²`;
      value = a * a;
    }
  } else {
    const style = randInt(0, 2);
    if (style === 0) {
      const a = randInt(3, 11);
      const b = randInt(3, 11);
      const c = randInt(2, 9);
      text = `(${a} + ${b}) × ${c}`;
      value = (a + b) * c;
    } else if (style === 1) {
      const a = randInt(12, 30);
      const b = randInt(12, 30);
      text = `${a} × ${b}`;
      value = a * b;
    } else {
      const a = randInt(6, 14);
      const b = randInt(4, 12);
      const c = randInt(3, 12);
      text = `${a} × ${b} − ${c}`;
      value = a * b - c;
    }
  }

  const truthful = Math.random() < 0.5;
  let shown = value;

  if (!truthful) {
    const magnitude = Math.abs(value);
    const candidates = [
      value + pick([1, -1, 2, -2]),
      value + pick([10, -10]),
      magnitude > 20 ? value + pick([9, -9, 11, -11]) : value + 3,
      // Digit transposition — looks completely plausible at a glance.
      Number(String(Math.abs(value)).split('').reverse().join('')) * Math.sign(value || 1),
    ].filter((n) => Number.isFinite(n) && n !== value);
    shown = pick(candidates.length ? candidates : [value + 1]);
  }

  return { text, value, shown, truthful, tier };
}

export default function RapidFire({ game, onExit, session = FREE_SESSION }) {
  const { finish, rearm, result } = useGameRun(game, session);

  const [phase, setPhase] = useState('ready'); // ready | playing | done
  const [problem, setProblem] = useState(() => makeProblem(0));
  const [timeLeft, setTimeLeft] = useState(TIME_BUDGET);
  const [lives, setLives] = useState(LIVES);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, index: 0 });
  const [flash, setFlash] = useState(null);

  const askedAt = useRef(0);
  const timeRef = useRef(TIME_BUDGET);

  useRafLoop(phase === 'playing', (delta) => {
    // The drain accelerates the longer you last.
    const rate = Math.min(2.4, 1 + stats.index * 0.035);
    timeRef.current = Math.max(0, timeRef.current - delta * rate);
    setTimeLeft(timeRef.current);
  });

  useEffect(() => {
    if (phase === 'playing' && timeLeft <= 0) setPhase('done');
  }, [phase, timeLeft]);

  const begin = useCallback(() => {
    play('start');
    rearm();
    setProblem(makeProblem(0));
    setLives(LIVES);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setStats({ correct: 0, wrong: 0, index: 0 });
    setFlash(null);
    timeRef.current = TIME_BUDGET;
    setTimeLeft(TIME_BUDGET);
    askedAt.current = performance.now();
    setPhase('playing');
  }, [rearm]);

  const answer = useCallback(
    (saysTrue) => {
      if (phase !== 'playing') return;
      const correct = saysTrue === problem.truthful;
      const took = performance.now() - askedAt.current;

      setFlash(correct ? 'right' : 'wrong');
      setTimeout(() => setFlash(null), 320);

      if (correct) {
        const speed = clamp(1 - took / 2200, 0, 1);
        const nextStreak = streak + 1;
        const multiplier = Math.min(5, 1 + Math.floor(nextStreak / 5));
        const points = Math.round((50 + 60 * speed) * problem.tier * multiplier);

        play(nextStreak % 5 === 0 ? 'great' : 'good');
        buzz(7);
        setScore((s) => s + points);
        setStreak(nextStreak);
        setBestStreak((b) => Math.max(b, nextStreak));
        setStats((s) => ({ ...s, correct: s.correct + 1, index: s.index + 1 }));
        timeRef.current = Math.min(TIME_BUDGET, timeRef.current + REWARD);
        setTimeLeft(timeRef.current);
      } else {
        play('bad');
        buzz([20, 45, 20]);
        setStreak(0);
        setStats((s) => ({ ...s, wrong: s.wrong + 1, index: s.index + 1 }));
        timeRef.current = Math.max(0, timeRef.current - PENALTY);
        setTimeLeft(timeRef.current);
        const nextLives = lives - 1;
        setLives(nextLives);
        if (nextLives <= 0) setPhase('done');
      }

      setProblem(makeProblem(stats.index + 1));
      askedAt.current = performance.now();
    },
    [phase, problem, streak, stats.index, lives],
  );

  // --- commit the run ----------------------------------------------------
  useEffect(() => {
    if (phase !== 'done') return;
    const total = stats.correct + stats.wrong;
    const accuracy = total ? Math.round((stats.correct / total) * 100) : 0;

    finish({
      score,
      stats: { bestStreak, correct: stats.correct, wrong: stats.wrong, accuracy },
      scoreLabel: formatScore(score),
      unitLabel: 'points',
      verdict:
        score >= 7000
          ? 'Calculator-grade'
          : score >= 4000
            ? 'Very quick arithmetic'
            : score >= 2000
              ? 'Solid mental maths'
              : 'The digits got you',
      blurb: `${stats.correct} correct out of ${total}. The wrong answers are only ever off by a little — that is the whole trick.`,
      cells: [
        { label: 'Best streak', value: `${bestStreak}x`, tone: 'var(--accent)' },
        { label: 'Correct', value: stats.correct },
        { label: 'Accuracy', value: `${accuracy}%` },
      ],
    });
  }, [phase, score, bestStreak, stats, finish]);

  useEffect(() => {
    function onKey(e) {
      if (phase === 'ready' && (e.code === 'Space' || e.key === 'Enter')) {
        e.preventDefault();
        begin();
        return;
      }
      if (phase !== 'playing') return;
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') answer(true);
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'l') answer(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, begin, answer]);

  const timeFrac = timeLeft / TIME_BUDGET;
  const multiplier = Math.min(5, 1 + Math.floor(streak / 5));

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      session={session}
      running={phase === 'playing'}
      liveScore={formatScore(score)}
    >
      <section className={`stage${flash === 'wrong' ? ' shake' : ''}`}>
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
            {multiplier > 1 && (
              <div className="combo" key={multiplier}>
                {multiplier}× <small>mult</small>
              </div>
            )}
          </>
        )}

        {phase === 'ready' && <ReadySplash game={game} onStart={begin} cta="Start" />}

        {phase === 'playing' && (
          <div className="rapid">
            <p className="rapid__prompt">Is this correct?</p>
            <div className="rapid__eq num" key={stats.index}>
              {problem.text} <span className="rapid__eq-op">=</span> {problem.shown}
            </div>

            <div className="rapid__buttons">
              <button type="button" className="rapidbtn rapidbtn--yes" onClick={() => answer(true)}>
                <Check />
                True
              </button>
              <button type="button" className="rapidbtn rapidbtn--no" onClick={() => answer(false)}>
                <Cross />
                False
              </button>
            </div>

            <p className="stage__label">
              <span className="kbd">A</span> / <span className="kbd">L</span> or the arrow keys
            </p>
          </div>
        )}
      </section>

      {result && <ResultCard {...result} gameId={game.id} onReplay={begin} onExit={onExit} />}
    </GameFrame>
  );
}
