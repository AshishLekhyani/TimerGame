import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GameFrame from '../GameFrame.jsx';
import ResultCard from '../ui/ResultCard.jsx';
import { FREE_SESSION, useGameRun } from '../../lib/useGameRun.js';
import { useRafLoop } from '../../lib/useRafLoop.js';
import { createDeck, poolSize } from '../../lib/quizEngine.js';
import { CATEGORIES, QUESTION_COUNT } from '../../data/quiz/index.js';
import { clamp, formatScore } from '../../lib/util.js';
import { play, buzz } from '../../lib/sound.js';
import { Play, Check, Cross } from '../ui/Icons.jsx';

const LIVES = 3;
/** Every Nth question is sudden death: hardest tier, triple points, no second chance. */
const SUDDEN_DEATH_EVERY = 7;
/** No sudden-death rounds until you are past the warm-up. */
const SUDDEN_DEATH_FROM = 8;
const BASE_POINTS = { 1: 90, 2: 180, 3: 340, 4: 600 };

/** The clock tightens as you go, but never below a genuinely readable window —
 *  these are questions you have to think about, not reflex tests. */
const timeForQuestion = (index, suddenDeath) =>
  suddenDeath ? 25000 : clamp(20000 - index * 300, 10000, 20000);

const DIFF_LABEL = { 1: 'Warm-up', 2: 'Standard', 3: 'Hard', 4: 'Brutal' };

const LIFELINES = [
  { id: 'fifty', label: '50:50', hint: 'Remove two wrong answers' },
  { id: 'freeze', label: '+12s', hint: 'Add twelve seconds to the clock' },
  { id: 'skip', label: 'Skip', hint: 'Move on, no points, no penalty' },
];

export default function Polymath({ game, onExit, session = FREE_SESSION }) {
  const { finish, rearm, result } = useGameRun(game, session);

  const [phase, setPhase] = useState('ready'); // ready | playing | reveal | done
  const [category, setCategory] = useState(null);
  const [expert, setExpert] = useState(false);
  const [question, setQuestion] = useState(null);
  const [hidden, setHidden] = useState([]); // options removed by 50:50
  const [picked, setPicked] = useState(null);
  const [timeLeft, setTimeLeft] = useState(20000);
  const [questionTime, setQuestionTime] = useState(20000);
  const [lives, setLives] = useState(LIVES);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [asked, setAsked] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [used, setUsed] = useState([]); // spent lifelines
  const [flash, setFlash] = useState(null); // 'right' | 'wrong' | 'timeout'

  const deck = useRef(null);
  const askedAt = useRef(0);
  /**
   * What the pending reveal should do once its pause is over.
   *
   * This lives in a ref, and the timer that consumes it is scheduled from an
   * effect keyed only on `phase`. Scheduling it from an effect that also
   * depends on `asked`/`lives` meant React tore the timer down the moment
   * those values changed — which is exactly what happens on a timeout — and
   * the run hung with no next question.
   */
  const pending = useRef(null);

  const isSuddenDeath = question?.suddenDeath ?? false;
  const available = useMemo(() => poolSize(category, expert), [category, expert]);

  // --- the question clock ------------------------------------------------
  useRafLoop(phase === 'playing', (delta) => {
    setTimeLeft((t) => Math.max(0, t - delta));
  });

  const serve = useCallback((index) => {
    const suddenDeath = index >= SUDDEN_DEATH_FROM && (index + 1) % SUDDEN_DEATH_EVERY === 0;
    const drawn = deck.current.draw(index, suddenDeath ? 4 : undefined);
    const budget = timeForQuestion(index, suddenDeath);
    setQuestion({ ...drawn, suddenDeath });
    setQuestionTime(budget);
    setTimeLeft(budget);
    setHidden([]);
    setPicked(null);
    setFlash(null);
    askedAt.current = performance.now();
    setPhase('playing');
    if (suddenDeath) play('bomb');
  }, []);

  const begin = useCallback(() => {
    play('start');
    rearm();
    pending.current = null;
    deck.current = createDeck({ category, expert });
    setLives(LIVES);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setAsked(0);
    setCorrectCount(0);
    setUsed([]);
    serve(0);
  }, [category, expert, rearm, serve]);

  /** Move the run on: either the next question or the end. */
  const advance = useCallback(
    (livesLeft, nextIndex) => {
      if (livesLeft <= 0) {
        deck.current?.commit();
        setPhase('done');
      } else {
        serve(nextIndex);
      }
    },
    [serve],
  );

  const answer = useCallback(
    (choice) => {
      if (phase !== 'playing' || !question) return;

      const correct = choice === question.correct;
      const took = performance.now() - askedAt.current;
      const nextAsked = asked + 1;

      setPicked(choice);
      setAsked(nextAsked);
      setPhase('reveal');

      if (correct) {
        // Speed matters, streaks multiply, sudden death triples.
        const speed = clamp(1 - took / (questionTime * 0.8), 0, 1);
        const nextStreak = streak + 1;
        const multiplier = Math.min(5, 1 + Math.floor(nextStreak / 4));
        const base = BASE_POINTS[question.d] ?? 200;
        const points = Math.round(
          base * (0.6 + 0.7 * speed) * multiplier * (question.suddenDeath ? 3 : 1),
        );

        play(question.suddenDeath ? 'perfect' : nextStreak % 4 === 0 ? 'great' : 'good');
        buzz(8);
        setScore((s) => s + points);
        setStreak(nextStreak);
        setBestStreak((b) => Math.max(b, nextStreak));
        setCorrectCount((c) => c + 1);
        setFlash('right');
        pending.current = { livesLeft: lives, nextAsked, delay: 1100 };
      } else {
        // Sudden death ends the run outright, whatever your lives say.
        const cost = question.suddenDeath ? lives : 1;
        const livesLeft = lives - cost;
        play('bad');
        buzz([22, 60, 22]);
        setStreak(0);
        setLives(livesLeft);
        setFlash('wrong');
        pending.current = { livesLeft, nextAsked, delay: 2100 };
      }
    },
    [phase, question, asked, streak, questionTime, lives],
  );

  // --- running out of time counts as a wrong answer ----------------------
  useEffect(() => {
    if (phase !== 'playing' || timeLeft > 0 || !question) return;
    const cost = question.suddenDeath ? lives : 1;
    const livesLeft = lives - cost;
    const nextAsked = asked + 1;
    play('bad');
    buzz([30, 60, 30]);
    setAsked(nextAsked);
    setStreak(0);
    setLives(livesLeft);
    setPicked(null);
    setFlash('timeout');
    pending.current = { livesLeft, nextAsked, delay: 2100 };
    setPhase('reveal');
  }, [phase, timeLeft, question, lives, asked]);

  // The single owner of the reveal pause. Depends only on `phase`, so nothing
  // that happens during a reveal can cancel the timer that ends it.
  useEffect(() => {
    if (phase !== 'reveal') return undefined;
    const next = pending.current;
    if (!next) return undefined;
    const id = setTimeout(() => {
      pending.current = null;
      advance(next.livesLeft, next.nextAsked);
    }, next.delay);
    return () => clearTimeout(id);
  }, [phase, advance]);

  const spendLifeline = useCallback(
    (id) => {
      if (phase !== 'playing' || used.includes(id) || !question) return;
      setUsed((u) => [...u, id]);
      play('click');

      if (id === 'fifty') {
        const wrongOnes = question.options.filter((o) => o !== question.correct);
        setHidden(wrongOnes.slice(0, 2));
      } else if (id === 'freeze') {
        setTimeLeft((t) => t + 12000);
        setQuestionTime((t) => t + 12000);
      } else if (id === 'skip') {
        const nextAsked = asked + 1;
        setAsked(nextAsked);
        serve(nextAsked);
      }
    },
    [phase, used, question, asked, serve],
  );

  // --- commit the run ----------------------------------------------------
  useEffect(() => {
    if (phase !== 'done') return;
    const accuracy = asked ? Math.round((correctCount / asked) * 100) : 0;

    finish({
      score,
      stats: { bestStreak, correct: correctCount, asked, accuracy, category, expert },
      scoreLabel: formatScore(score),
      unitLabel: 'points',
      verdict:
        score >= (expert ? 9000 : 12000)
          ? 'Polymath'
          : score >= 7000
            ? 'Formidably well-read'
            : score >= 3500
              ? 'Broadly informed'
              : score >= 1500
                ? 'Some solid ground'
                : 'Plenty left to learn',
      blurb: `You answered ${correctCount} of ${asked} correctly, with a best run of ${bestStreak} in a row.`,
      cells: [
        { label: 'Best streak', value: `${bestStreak}x`, tone: 'var(--accent)' },
        { label: 'Correct', value: `${correctCount}/${asked}` },
        { label: 'Accuracy', value: `${accuracy}%` },
      ],
    });
  }, [phase, score, bestStreak, correctCount, asked, category, expert, finish]);

  // --- keyboard ----------------------------------------------------------
  useEffect(() => {
    function onKey(e) {
      if (phase === 'ready' && (e.code === 'Space' || e.key === 'Enter')) {
        e.preventDefault();
        begin();
        return;
      }
      if (phase !== 'playing' || !question) return;
      const slot = Number(e.key);
      if (slot >= 1 && slot <= 4) {
        const option = question.options[slot - 1];
        if (option && !hidden.includes(option)) answer(option);
      }
      if (e.key.toLowerCase() === 'f') spendLifeline('fifty');
      if (e.key.toLowerCase() === 't') spendLifeline('freeze');
      if (e.key.toLowerCase() === 's') spendLifeline('skip');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, question, hidden, begin, answer, spendLifeline]);

  const timeFrac = questionTime ? timeLeft / questionTime : 0;
  const multiplier = Math.min(5, 1 + Math.floor(streak / 4));
  const meta = question ? CATEGORIES[question.category] : null;

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      session={session}
      running={phase === 'playing' || phase === 'reveal'}
      liveScore={formatScore(score)}
    >
      <section className={`stage${flash === 'wrong' || flash === 'timeout' ? ' shake' : ''}`}>
        {phase === 'ready' && (
          <div className="ready">
            <span className="ready__icon">
              <Play />
            </span>
            <h2>{QUESTION_COUNT.toLocaleString('en-US')} questions. Three lives.</h2>
            <p className="stage__hint" style={{ marginTop: '-0.4rem' }}>
              Questions get harder and the clock gets shorter the longer you survive. Every{' '}
              {SUDDEN_DEATH_EVERY}th question is <b style={{ color: 'var(--danger)' }}>sudden death</b> —
              one wrong answer and the run is over, whatever your lives say.
            </p>

            <div className="modeswitch">
              <button
                type="button"
                className="modeopt"
                data-on={!expert}
                onClick={() => setExpert(false)}
              >
                <b>Standard</b>
                <span>Ramps from easy to brutal</span>
              </button>
              <button
                type="button"
                className="modeopt"
                data-on={expert}
                onClick={() => setExpert(true)}
              >
                <b>☠️ Expert</b>
                <span>Hard and brutal only, from question one</span>
              </button>
            </div>

            <div className="catgrid">
              <button
                type="button"
                className="cat"
                data-on={category === null}
                onClick={() => setCategory(null)}
              >
                <span className="cat__icon">🌐</span>
                <span className="cat__label">Everything</span>
                <span className="cat__count num">{QUESTION_COUNT.toLocaleString('en-US')}</span>
              </button>
              {Object.entries(CATEGORIES).map(([id, c]) => (
                <button
                  key={id}
                  type="button"
                  className="cat"
                  data-on={category === id}
                  onClick={() => setCategory(id)}
                >
                  <span className="cat__icon">{c.icon}</span>
                  <span className="cat__label">{c.label}</span>
                  <span className="cat__count num">{poolSize(id, expert)}</span>
                </button>
              ))}
            </div>

            <button type="button" className="btn btn--primary btn--lg" onClick={begin}>
              <Play />
              Start · {available.toLocaleString('en-US')} in the pool
            </button>
          </div>
        )}

        {(phase === 'playing' || phase === 'reveal') && question && (
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
                Q<b>{asked + (phase === 'reveal' ? 0 : 1)}</b>
              </span>
            </div>

            {multiplier > 1 && (
              <div className="combo" key={multiplier}>
                {multiplier}× <small>streak {streak}</small>
              </div>
            )}

            <div className="quiz">
              <div className="quiz__meta">
                {isSuddenDeath ? (
                  <span className="quiz__stakes">⚠ Sudden death · triple points</span>
                ) : (
                  <span className="quiz__cat">
                    {meta?.icon} {meta?.label}
                  </span>
                )}
                <span className="quiz__diff" data-d={question.d} title={DIFF_LABEL[question.d]}>
                  {'●'.repeat(question.d)}
                  {'○'.repeat(4 - question.d)}
                </span>
              </div>

              <h2 className="quiz__q" key={question.id}>
                {question.q}
              </h2>

              <div className="quiz__options">
                {question.options.map((option, i) => {
                  const isCorrect = option === question.correct;
                  const state =
                    phase !== 'reveal'
                      ? undefined
                      : isCorrect
                        ? 'correct'
                        : option === picked
                          ? 'wrong'
                          : 'dim';
                  return (
                    <button
                      key={option}
                      type="button"
                      className="quizopt"
                      data-state={state}
                      data-gone={hidden.includes(option)}
                      disabled={phase !== 'playing' || hidden.includes(option)}
                      onClick={() => answer(option)}
                    >
                      <span className="quizopt__key num">{i + 1}</span>
                      <span className="quizopt__text">{option}</span>
                      {state === 'correct' && <Check className="quizopt__mark" />}
                      {state === 'wrong' && <Cross className="quizopt__mark" />}
                    </button>
                  );
                })}
              </div>

              {phase === 'reveal' && flash === 'timeout' && (
                <p className="quiz__verdict" style={{ color: 'var(--danger)' }}>
                  Out of time.
                </p>
              )}

              <div className="lifelines">
                {LIFELINES.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    className="lifeline"
                    disabled={used.includes(l.id) || phase !== 'playing'}
                    onClick={() => spendLifeline(l.id)}
                    title={l.hint}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      {result && <ResultCard {...result} gameId={game.id} onReplay={begin} onExit={onExit} />}
    </GameFrame>
  );
}
