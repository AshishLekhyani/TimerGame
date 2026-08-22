import { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame from '../GameFrame.jsx';
import ReadySplash from '../ui/ReadySplash.jsx';
import ResultCard from '../ui/ResultCard.jsx';
import { FREE_SESSION, useGameRun } from '../../lib/useGameRun.js';
import { useRafLoop } from '../../lib/useRafLoop.js';
import { createDeck } from '../../lib/quizEngine.js';
import { CATEGORIES } from '../../data/quiz/index.js';
import { clamp, formatScore, pick } from '../../lib/util.js';
import { play, buzz } from '../../lib/sound.js';
import { Check, Cross } from '../ui/Icons.jsx';

/**
 * Verdict — snap judgement on the same 2,500-question bank.
 *
 * Polymath gives you four options and time to think. This gives you one claim
 * and about two seconds. Half the claims are false, and the false ones are
 * built from the question's own distractors, so they are always plausible
 * answers to the question being asked — you cannot spot the lie by vibe.
 */

const LIVES = 3;
const TIME_BUDGET = 12000;
const REWARD = 900;
const PENALTY = 2400;

export default function Verdict({ game, onExit, session = FREE_SESSION }) {
  const { finish, rearm, result } = useGameRun(game, session);

  const [phase, setPhase] = useState('ready'); // ready | playing | done
  const [claim, setClaim] = useState(null);
  const [timeLeft, setTimeLeft] = useState(TIME_BUDGET);
  const [lives, setLives] = useState(LIVES);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [tally, setTally] = useState({ correct: 0, wrong: 0, index: 0 });
  const [flash, setFlash] = useState(null);

  const deck = useRef(null);
  const askedAt = useRef(0);
  const timeRef = useRef(TIME_BUDGET);

  useRafLoop(phase === 'playing', (delta) => {
    // Drains faster the longer you last.
    const rate = Math.min(2.1, 1 + tally.index * 0.028);
    timeRef.current = Math.max(0, timeRef.current - delta * rate);
    setTimeLeft(timeRef.current);
  });

  useEffect(() => {
    if (phase === 'playing' && timeLeft <= 0) setPhase('done');
  }, [phase, timeLeft]);

  const serve = useCallback((index) => {
    const q = deck.current.draw(index);
    const truthful = Math.random() < 0.5;
    setClaim({
      question: q.q,
      // A false claim uses one of the question's own distractors.
      answer: truthful ? q.correct : pick(q.wrong),
      truthful,
      correct: q.correct,
      category: q.category,
      d: q.d,
    });
    askedAt.current = performance.now();
  }, []);

  const begin = useCallback(() => {
    play('start');
    rearm();
    deck.current = createDeck({});
    setLives(LIVES);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTally({ correct: 0, wrong: 0, index: 0 });
    setFlash(null);
    timeRef.current = TIME_BUDGET;
    setTimeLeft(TIME_BUDGET);
    setPhase('playing');
    serve(0);
  }, [rearm, serve]);

  const judge = useCallback(
    (saysTrue) => {
      if (phase !== 'playing' || !claim) return;
      const right = saysTrue === claim.truthful;
      const took = performance.now() - askedAt.current;

      setFlash(right ? 'right' : 'wrong');
      setTimeout(() => setFlash(null), 300);

      if (right) {
        const speed = clamp(1 - took / 2600, 0, 1);
        const nextStreak = streak + 1;
        const multiplier = Math.min(5, 1 + Math.floor(nextStreak / 5));
        const points = Math.round((70 + 110 * speed) * (claim.d >= 3 ? 1.7 : 1) * multiplier);

        play(nextStreak % 5 === 0 ? 'great' : 'good');
        buzz(7);
        setScore((s) => s + points);
        setStreak(nextStreak);
        setBestStreak((b) => Math.max(b, nextStreak));
        setTally((t) => ({ ...t, correct: t.correct + 1, index: t.index + 1 }));
        timeRef.current = Math.min(TIME_BUDGET, timeRef.current + REWARD);
        setTimeLeft(timeRef.current);
        serve(tally.index + 1);
      } else {
        const nextLives = lives - 1;
        play('bad');
        buzz([20, 50, 20]);
        setStreak(0);
        setLives(nextLives);
        setTally((t) => ({ ...t, wrong: t.wrong + 1, index: t.index + 1 }));
        timeRef.current = Math.max(0, timeRef.current - PENALTY);
        setTimeLeft(timeRef.current);
        if (nextLives <= 0) {
          deck.current?.commit();
          setPhase('done');
        } else {
          serve(tally.index + 1);
        }
      }
    },
    [phase, claim, streak, lives, tally.index, serve],
  );

  // --- commit the run ----------------------------------------------------
  useEffect(() => {
    if (phase !== 'done') return;
    deck.current?.commit();
    const total = tally.correct + tally.wrong;
    const accuracy = total ? Math.round((tally.correct / total) * 100) : 0;

    finish({
      score,
      stats: { bestStreak, correct: tally.correct, wrong: tally.wrong, accuracy },
      scoreLabel: formatScore(score),
      unitLabel: 'points',
      verdict:
        score >= 8000
          ? 'Instant recall'
          : score >= 4500
            ? 'Very quick judgement'
            : score >= 2000
              ? 'Solid instincts'
              : 'Second-guessed yourself',
      blurb: `${tally.correct} correct out of ${total}. Every false claim is a real answer to a different question — that is what makes it hard.`,
      cells: [
        { label: 'Best streak', value: `${bestStreak}x`, tone: 'var(--accent)' },
        { label: 'Correct', value: tally.correct },
        { label: 'Accuracy', value: `${accuracy}%` },
      ],
    });
  }, [phase, score, bestStreak, tally, finish]);

  useEffect(() => {
    function onKey(e) {
      if (phase === 'ready' && (e.code === 'Space' || e.key === 'Enter')) {
        e.preventDefault();
        begin();
        return;
      }
      if (phase !== 'playing') return;
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') judge(true);
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'l') judge(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, begin, judge]);

  const timeFrac = timeLeft / TIME_BUDGET;
  const multiplier = Math.min(5, 1 + Math.floor(streak / 5));
  const meta = claim ? CATEGORIES[claim.category] : null;

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

        {phase === 'playing' && claim && (
          <div className="verdictgame">
            <span className="quiz__cat">
              {meta?.icon} {meta?.label}
            </span>

            <p className="verdictgame__q" key={`q${tally.index}`}>
              {claim.question}
            </p>

            <div className="verdictgame__claim" key={`a${tally.index}`}>
              {claim.answer}
            </div>

            <div className="rapid__buttons">
              <button type="button" className="rapidbtn rapidbtn--yes" onClick={() => judge(true)}>
                <Check />
                True
              </button>
              <button type="button" className="rapidbtn rapidbtn--no" onClick={() => judge(false)}>
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
