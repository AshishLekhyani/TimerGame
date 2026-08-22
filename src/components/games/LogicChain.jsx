import { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame from '../GameFrame.jsx';
import ReadySplash from '../ui/ReadySplash.jsx';
import ResultCard from '../ui/ResultCard.jsx';
import { FREE_SESSION, useGameRun } from '../../lib/useGameRun.js';
import { useRafLoop } from '../../lib/useRafLoop.js';
import { makeSequence } from '../../lib/sequences.js';
import { clamp, formatScore } from '../../lib/util.js';
import { play, buzz } from '../../lib/sound.js';

const LIVES = 3;
const TIME_BUDGET = 22000;
const REWARD = 6000;
const PENALTY = 5000;

const TIER_LABEL = { 1: 'Simple', 2: 'Moderate', 3: 'Hard', 4: 'Brutal' };
const BASE_POINTS = { 1: 120, 2: 260, 3: 480, 4: 850 };

export default function LogicChain({ game, onExit, session = FREE_SESSION }) {
  const { finish, rearm, result } = useGameRun(game, session);

  const [phase, setPhase] = useState('ready'); // ready | playing | reveal | done
  const [level, setLevel] = useState(1);
  const [puzzle, setPuzzle] = useState(() => makeSequence(1));
  const [picked, setPicked] = useState(null);
  const [lives, setLives] = useState(LIVES);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [solved, setSolved] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_BUDGET);

  const timeRef = useRef(TIME_BUDGET);
  const askedAt = useRef(0);

  useRafLoop(phase === 'playing', (delta) => {
    timeRef.current = Math.max(0, timeRef.current - delta);
    setTimeLeft(timeRef.current);
  });

  const begin = useCallback(() => {
    play('start');
    rearm();
    setLevel(1);
    setPuzzle(makeSequence(1));
    setPicked(null);
    setLives(LIVES);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setSolved(0);
    timeRef.current = TIME_BUDGET;
    setTimeLeft(TIME_BUDGET);
    askedAt.current = performance.now();
    setPhase('playing');
  }, [rearm]);

  const advance = useCallback(
    (livesLeft, nextLevel) => {
      if (livesLeft <= 0 || timeRef.current <= 0) {
        setPhase('done');
        return;
      }
      setLevel(nextLevel);
      setPuzzle(makeSequence(nextLevel));
      setPicked(null);
      askedAt.current = performance.now();
      setPhase('playing');
    },
    [],
  );

  const answer = useCallback(
    (value) => {
      if (phase !== 'playing') return;
      const correct = value === puzzle.answer;
      const took = performance.now() - askedAt.current;

      setPicked(value);
      setPhase('reveal');

      if (correct) {
        const speed = clamp(1 - took / 14000, 0, 1);
        const nextStreak = streak + 1;
        const multiplier = Math.min(4, 1 + Math.floor(nextStreak / 3));
        const points = Math.round(
          (BASE_POINTS[puzzle.tier] ?? 200) * (0.7 + 0.6 * speed) * multiplier,
        );

        play(puzzle.tier >= 3 ? 'perfect' : 'great');
        buzz(9);
        setScore((s) => s + points);
        setStreak(nextStreak);
        setBestStreak((b) => Math.max(b, nextStreak));
        setSolved((s) => s + 1);
        timeRef.current = Math.min(TIME_BUDGET, timeRef.current + REWARD);
        setTimeLeft(timeRef.current);
        setTimeout(() => advance(lives, level + 1), 1500);
      } else {
        const nextLives = lives - 1;
        play('bad');
        buzz([22, 55, 22]);
        setStreak(0);
        setLives(nextLives);
        timeRef.current = Math.max(0, timeRef.current - PENALTY);
        setTimeLeft(timeRef.current);
        setTimeout(() => advance(nextLives, level + 1), 2400);
      }
    },
    [phase, puzzle, streak, lives, level, advance],
  );

  // Running out of time ends the run immediately.
  useEffect(() => {
    if (phase === 'playing' && timeLeft <= 0) {
      play('bad');
      setPhase('done');
    }
  }, [phase, timeLeft]);

  // --- commit the run ----------------------------------------------------
  useEffect(() => {
    if (phase !== 'done') return;
    finish({
      score,
      stats: { solved, level, bestStreak },
      scoreLabel: formatScore(score),
      unitLabel: 'points',
      verdict:
        solved >= 16
          ? 'Pattern-recognition machine'
          : solved >= 11
            ? 'Genuinely sharp'
            : solved >= 6
              ? 'Solid reasoning'
              : 'The chain broke early',
      blurb:
        solved >= 11
          ? 'You got well into the brutal tier — interleaved sequences and digit-sum rules.'
          : 'The trick is to write the differences between terms in your head first. If those form a pattern, you have it.',
      cells: [
        { label: 'Solved', value: solved, tone: 'var(--accent)' },
        { label: 'Reached', value: `Lv ${level}` },
        { label: 'Best streak', value: `${bestStreak}x` },
      ],
    });
  }, [phase, score, solved, level, bestStreak, finish]);

  useEffect(() => {
    function onKey(e) {
      if (phase === 'ready' && (e.code === 'Space' || e.key === 'Enter')) {
        e.preventDefault();
        begin();
        return;
      }
      if (phase !== 'playing') return;
      const slot = Number(e.key);
      if (slot >= 1 && slot <= 4) answer(puzzle.options[slot - 1]);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, begin, answer, puzzle]);

  const timeFrac = timeLeft / TIME_BUDGET;
  const multiplier = Math.min(4, 1 + Math.floor(streak / 3));

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      session={session}
      running={phase === 'playing' || phase === 'reveal'}
      liveScore={formatScore(score)}
    >
      <section className="stage">
        {phase !== 'ready' && phase !== 'done' && (
          <>
            <div className="timebar">
              <div
                className="timebar__fill"
                data-low={timeFrac < 0.3}
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
                Level <b>{level}</b>
              </span>
            </div>
            {multiplier > 1 && (
              <div className="combo" key={multiplier}>
                {multiplier}× <small>streak {streak}</small>
              </div>
            )}
          </>
        )}

        {phase === 'ready' && <ReadySplash game={game} onStart={begin} cta="Start" />}

        {phase !== 'ready' && phase !== 'done' && (
          <div className="chain">
            <span className="chain__tier" data-t={puzzle.tier}>
              {TIER_LABEL[puzzle.tier]}
            </span>

            <div className="chain__terms" key={level}>
              {puzzle.terms.map((t, i) => (
                <span key={i} className="chainterm num">
                  {t.toLocaleString('en-US')}
                </span>
              ))}
              <span className="chainterm chainterm--blank num">?</span>
            </div>

            <div className="chain__options">
              {puzzle.options.map((option, i) => {
                const isAnswer = option === puzzle.answer;
                const state =
                  phase !== 'reveal'
                    ? undefined
                    : isAnswer
                      ? 'correct'
                      : option === picked
                        ? 'wrong'
                        : 'dim';
                return (
                  <button
                    key={option}
                    type="button"
                    className="chainopt num"
                    data-state={state}
                    disabled={phase !== 'playing'}
                    onClick={() => answer(option)}
                  >
                    <span className="quizopt__key num">{i + 1}</span>
                    {option.toLocaleString('en-US')}
                  </button>
                );
              })}
            </div>

            {phase === 'reveal' && (
              <p className="chain__rule">
                Rule: <b>{puzzle.rule}</b>
              </p>
            )}
          </div>
        )}
      </section>

      {result && <ResultCard {...result} gameId={game.id} onReplay={begin} onExit={onExit} />}
    </GameFrame>
  );
}
