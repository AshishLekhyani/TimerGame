import { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame from '../GameFrame.jsx';
import ReadySplash from '../ui/ReadySplash.jsx';
import ResultCard from '../ui/ResultCard.jsx';
import { FREE_SESSION, useGameRun } from '../../lib/useGameRun.js';
import { formatScore, pick, randInt } from '../../lib/util.js';
import { play, buzz } from '../../lib/sound.js';

/**
 * Echo — a dual N-back.
 *
 * Two streams run at once: a square lights up somewhere on a 3×3 grid, and a
 * letter is shown. You have to say whether *each* stream matches what it was
 * N steps ago. It is the standard working-memory task from the research
 * literature and it is genuinely brutal past N=2.
 */

const LETTERS = ['K', 'M', 'Q', 'R', 'T', 'V', 'X', 'Z'];
const CELLS = 9;
const TRIALS_PER_LEVEL = 20;
const STEP_MS = 2600;
/** Chance a stream is deliberately made to match, so matches are not rare. */
const MATCH_RATE = 0.28;

export default function Echo({ game, onExit, session = FREE_SESSION }) {
  const { finish, rearm, result } = useGameRun(game, session);

  const [phase, setPhase] = useState('ready'); // ready | playing | levelend | done
  const [n, setN] = useState(2);
  const [trial, setTrial] = useState(0);
  const [current, setCurrent] = useState(null); // { cell, letter }
  const [blank, setBlank] = useState(false);
  const [marked, setMarked] = useState({ position: false, letter: false });
  const [tally, setTally] = useState({ hits: 0, misses: 0, falseAlarms: 0 });
  const [score, setScore] = useState(0);
  const [bestN, setBestN] = useState(2);
  const [levelSummary, setLevelSummary] = useState(null);

  const history = useRef([]);
  const markedRef = useRef({ position: false, letter: false });
  const timer = useRef(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  /** Grade the trial that just ended, then deal the next one. */
  const step = useCallback(
    (level, trialIndex) => {
      const past = history.current;
      const back = past.length > level ? past[past.length - 1 - level] : null;
      const now = past[past.length - 1];

      // Score the trial that just finished (skip the first N — nothing to match).
      if (now && back) {
        const truth = { position: now.cell === back.cell, letter: now.letter === back.letter };
        const said = markedRef.current;
        let hits = 0;
        let misses = 0;
        let falseAlarms = 0;

        for (const stream of ['position', 'letter']) {
          if (truth[stream] && said[stream]) hits += 1;
          else if (truth[stream] && !said[stream]) misses += 1;
          else if (!truth[stream] && said[stream]) falseAlarms += 1;
        }

        setTally((t) => ({
          hits: t.hits + hits,
          misses: t.misses + misses,
          falseAlarms: t.falseAlarms + falseAlarms,
        }));
        setScore((s) => Math.max(0, s + hits * level * 90 - falseAlarms * level * 45));
        if (hits) play('good');
        if (falseAlarms) play('tick');
      }

      if (trialIndex >= TRIALS_PER_LEVEL) {
        setPhase('levelend');
        return;
      }

      // Deal the next stimulus, biasing toward matches so they actually occur.
      const backForNext = past.length >= level ? past[past.length - level] : null;
      const forcePosition = backForNext && Math.random() < MATCH_RATE;
      const forceLetter = backForNext && Math.random() < MATCH_RATE;
      const next = {
        cell: forcePosition ? backForNext.cell : randInt(0, CELLS - 1),
        letter: forceLetter ? backForNext.letter : pick(LETTERS),
      };

      history.current = [...past, next];
      markedRef.current = { position: false, letter: false };
      setMarked({ position: false, letter: false });
        setCurrent(next);
      setTrial(trialIndex + 1);
      setBlank(false);
      buzz(4);

      // Show the stimulus for most of the step, then blank before the next.
      timer.current = setTimeout(() => setBlank(true), STEP_MS - 700);
      setTimeout(() => {
        if (timer.current !== null) {
          timer.current = setTimeout(() => step(level, trialIndex + 1), 700);
        }
      }, STEP_MS - 700);
    },
    [],
  );

  const startLevel = useCallback(
    (level) => {
      clearTimer();
      history.current = [];
      markedRef.current = { position: false, letter: false };
      setN(level);
      setBestN((b) => Math.max(b, level));
      setTrial(0);
      setTally({ hits: 0, misses: 0, falseAlarms: 0 });
      setLevelSummary(null);
      setPhase('playing');
      play('start');
      timer.current = setTimeout(() => step(level, 0), 900);
    },
    [step],
  );

  const begin = useCallback(() => {
    rearm();
    setScore(0);
    setBestN(2);
    startLevel(2);
  }, [rearm, startLevel]);

  const mark = useCallback(
    (stream) => {
      if (phase !== 'playing' || markedRef.current[stream]) return;
      if (history.current.length <= n) return; // nothing to compare against yet
      markedRef.current = { ...markedRef.current, [stream]: true };
      setMarked({ ...markedRef.current });
      play('click');
      buzz(6);
    },
    [phase, n],
  );

  useEffect(() => clearTimer, []);

  // --- level boundary: 80%+ accuracy promotes you, under 50% ends the run ---
  useEffect(() => {
    if (phase !== 'levelend') return undefined;
    clearTimer();
    const attempts = tally.hits + tally.misses;
    const accuracy = attempts ? tally.hits / attempts : 0;
    const clean = accuracy >= 0.8 && tally.falseAlarms <= 4;
    setLevelSummary({ accuracy: Math.round(accuracy * 100), promoted: clean });
    play(clean ? 'levelup' : 'gameover');

    const id = setTimeout(() => {
      if (clean) startLevel(n + 1);
      else setPhase('done');
    }, 2600);
    return () => clearTimeout(id);
  }, [phase, tally, n, startLevel]);

  // --- commit the run ----------------------------------------------------
  useEffect(() => {
    if (phase !== 'done') return;
    const attempts = tally.hits + tally.misses;
    const accuracy = attempts ? Math.round((tally.hits / attempts) * 100) : 0;

    finish({
      score,
      stats: { n: bestN, accuracy, falseAlarms: tally.falseAlarms },
      scoreLabel: formatScore(score),
      unitLabel: 'points',
      verdict:
        bestN >= 5
          ? 'Extraordinary working memory'
          : bestN >= 4
            ? 'Exceptional'
            : bestN >= 3
              ? 'Well above average'
              : 'Solid start',
      blurb:
        bestN >= 4
          ? `You held ${bestN} steps of two independent streams at once. Very few people get past 4.`
          : 'Most people plateau around N=2 or 3 — the trick is not to rehearse, but to let the pattern sit.',
      cells: [
        { label: 'Reached', value: `N = ${bestN}`, tone: 'var(--accent)' },
        { label: 'Hit rate', value: `${accuracy}%` },
        { label: 'False alarms', value: tally.falseAlarms },
      ],
    });
  }, [phase, score, bestN, tally, finish]);

  useEffect(() => {
    function onKey(e) {
      if (phase === 'ready' && (e.code === 'Space' || e.key === 'Enter')) {
        e.preventDefault();
        begin();
        return;
      }
      if (phase !== 'playing') return;
      if (e.key.toLowerCase() === 'a') mark('position');
      if (e.key.toLowerCase() === 'l') mark('letter');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, begin, mark]);

  const canAnswer = phase === 'playing' && history.current.length > n;

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      session={session}
      running={phase === 'playing' || phase === 'levelend'}
      liveScore={formatScore(score)}
    >
      <section className="stage">
        {phase !== 'ready' && phase !== 'done' && (
          <div className="hudbar">
            <span className="hudbar__cell">
              N = <b>{n}</b>
            </span>
            <span className="hudbar__cell">
              Trial <b>{Math.min(trial, TRIALS_PER_LEVEL)}/{TRIALS_PER_LEVEL}</b>
            </span>
          </div>
        )}

        {phase === 'ready' && <ReadySplash game={game} onStart={begin} cta="Start at N = 2" />}

        {phase === 'levelend' && levelSummary && (
          <div className="verdict">
            <span
              className="verdict__grade"
              style={{ color: levelSummary.promoted ? 'var(--lime)' : 'var(--danger)' }}
            >
              {levelSummary.promoted ? `N = ${n + 1}` : 'Run over'}
            </span>
            <span className="verdict__delta num">
              {levelSummary.accuracy}% hit rate · {tally.falseAlarms} false alarm
              {tally.falseAlarms === 1 ? '' : 's'}
            </span>
            <p className="stage__hint">
              {levelSummary.promoted
                ? 'Promoted. One more step to hold in your head.'
                : 'You need 80% of the matches and at most four false alarms to advance.'}
            </p>
          </div>
        )}

        {phase === 'playing' && (
          <div className="echo">
            <div className="echogrid">
              {Array.from({ length: CELLS }, (_, i) => (
                <span
                  key={i}
                  className="echocell"
                  data-on={!blank && current?.cell === i}
                  aria-hidden="true"
                />
              ))}
              <span className="echoletter num" aria-live="polite">
                {!blank && current ? current.letter : ''}
              </span>
            </div>

            <div className="echo__buttons">
              <button
                type="button"
                className="echobtn"
                data-marked={marked.position}
                disabled={!canAnswer}
                onClick={() => mark('position')}
              >
                <b>Position match</b>
                <span>
                  <span className="kbd">A</span>
                </span>
              </button>
              <button
                type="button"
                className="echobtn"
                data-marked={marked.letter}
                disabled={!canAnswer}
                onClick={() => mark('letter')}
              >
                <b>Letter match</b>
                <span>
                  <span className="kbd">L</span>
                </span>
              </button>
            </div>

            <p className="stage__label">
              {canAnswer
                ? `does either stream match ${n} step${n > 1 ? 's' : ''} back?`
                : `filling the buffer — ${n + 1 - history.current.length} to go`}
            </p>
          </div>
        )}
      </section>

      {result && <ResultCard {...result} gameId={game.id} onReplay={begin} onExit={onExit} />}
    </GameFrame>
  );
}
