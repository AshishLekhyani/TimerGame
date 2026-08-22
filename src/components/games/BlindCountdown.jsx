import { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame from '../GameFrame.jsx';
import ReadySplash from '../ui/ReadySplash.jsx';
import ResultCard from '../ui/ResultCard.jsx';
import { FREE_SESSION, useGameRun } from '../../lib/useGameRun.js';
import { useRafLoop } from '../../lib/useRafLoop.js';
import { clamp, formatScore, randFloat } from '../../lib/util.js';
import { play, buzz } from '../../lib/sound.js';

const ROUNDS = 5;
/** How long the clock stays readable before it blurs out. */
const REVEAL_MS = 650;
/** Error beyond this scores nothing. */
const MISS_MS = 1200;
/** Auto-stop so a forgotten round cannot hang the run. */
const OVERRUN = 2.2;

/** Round targets widen as the run goes on. */
const BANDS = [
  [1.6, 2.8],
  [2.4, 4.2],
  [3.5, 5.8],
  [4.5, 7.5],
  [6.0, 10.0],
];

const GRADES = [
  { under: 50, label: 'PERFECT', tone: 'var(--amber)', sound: 'perfect' },
  { under: 150, label: 'GREAT', tone: 'var(--lime)', sound: 'great' },
  { under: 350, label: 'GOOD', tone: 'var(--cyan)', sound: 'good' },
  { under: 700, label: 'CLOSE', tone: 'var(--ink)', sound: 'click' },
  { under: Infinity, label: 'MISS', tone: 'var(--danger)', sound: 'bad' },
];

const gradeFor = (error) => GRADES.find((g) => error < g.under);

function scoreRound(error) {
  const base = Math.round(1000 * clamp(1 - error / MISS_MS, 0, 1));
  return error < 50 ? base + 250 : base;
}

const makeTargets = () => BANDS.map(([lo, hi]) => Number(randFloat(lo, hi).toFixed(2)));

export default function BlindCountdown({ game, onExit, session = FREE_SESSION }) {
  const { finish, rearm, result } = useGameRun(game, session);

  const [phase, setPhase] = useState('ready'); // ready | armed | running | verdict | done
  const [targets, setTargets] = useState(makeTargets);
  const [round, setRound] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [results, setResults] = useState([]);

  const startedAt = useRef(0);
  const target = targets[round];
  const targetMs = target * 1000;

  // --- the clock -------------------------------------------------------
  useRafLoop(phase === 'running', () => {
    const value = performance.now() - startedAt.current;
    setElapsed(value);
    if (value >= targetMs * OVERRUN) stopRound(value);
  });

  const beginRun = useCallback(() => {
    play('start');
    rearm();
    setTargets(makeTargets());
    setResults([]);
    setRound(0);
    setElapsed(0);
    setPhase('armed');
  }, [rearm]);

  const startRound = useCallback(() => {
    play('go');
    startedAt.current = performance.now();
    setElapsed(0);
    setPhase('running');
  }, []);

  const stopRound = useCallback(
    (rawElapsed) => {
      const value = rawElapsed ?? performance.now() - startedAt.current;
      const error = Math.abs(value - targetMs);
      const grade = gradeFor(error);
      play(grade.sound);
      buzz(error < 150 ? [8, 40, 8] : 14);

      setElapsed(value);
      setResults((prev) => [
        ...prev,
        { target, elapsed: value, error, points: scoreRound(error), grade: grade.label },
      ]);
      setPhase('verdict');
    },
    [target, targetMs],
  );

  // --- advance out of the verdict pause --------------------------------
  useEffect(() => {
    if (phase !== 'verdict') return undefined;
    const id = setTimeout(() => {
      if (round + 1 >= ROUNDS) {
        setPhase('done');
      } else {
        setRound(round + 1);
        setElapsed(0);
        setPhase('armed');
      }
    }, 1500);
    return () => clearTimeout(id);
  }, [phase, round]);

  // --- commit the run ---------------------------------------------------
  useEffect(() => {
    if (phase !== 'done') return;
    const total = results.reduce((sum, r) => sum + r.points, 0);
    const perfects = results.filter((r) => r.grade === 'PERFECT').length;
    const avgError = results.reduce((sum, r) => sum + r.error, 0) / (results.length || 1);

    finish({
      score: total,
      stats: { perfects, avgError },
      scoreLabel: formatScore(total),
      unitLabel: 'points',
      verdict:
        total >= 5000
          ? 'Internal clock: calibrated'
          : total >= 3500
            ? 'Sharp sense of time'
            : total >= 2000
              ? 'Not bad at all'
              : 'Time got away from you',
      blurb:
        perfects > 0
          ? `${perfects} perfect round${perfects > 1 ? 's' : ''} — you landed inside 50 milliseconds.`
          : `You were off by ${(avgError / 1000).toFixed(2)}s on average. Perfect rounds need under 0.05s.`,
      cells: [
        { label: 'Avg error', value: `${(avgError / 1000).toFixed(2)}s` },
        { label: 'Perfect', value: perfects, tone: 'var(--amber)' },
        { label: 'Rounds', value: ROUNDS },
      ],
    });
  }, [phase, results, finish]);

  // --- keyboard ---------------------------------------------------------
  useEffect(() => {
    function onKey(e) {
      if (e.code !== 'Space' && e.key !== 'Enter') return;
      if (phase === 'done') return; // the result card owns the keyboard
      e.preventDefault();
      if (phase === 'ready') beginRun();
      else if (phase === 'armed') startRound();
      else if (phase === 'running') stopRound();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, beginRun, startRound, stopRound]);

  // --- dial geometry ----------------------------------------------------
  const R = 46;
  const CIRC = 2 * Math.PI * R;
  const blind = phase === 'running' && elapsed > REVEAL_MS;
  const sweepMax = targetMs * 1.5;
  const shownElapsed = phase === 'verdict' ? elapsed : blind ? REVEAL_MS : elapsed;
  const sweep = clamp(shownElapsed / sweepMax, 0, 1);
  const overshoot = phase === 'verdict' && elapsed > targetMs;

  const runningTotal = results.reduce((sum, r) => sum + r.points, 0);
  const last = results[results.length - 1];

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      session={session}
      running={phase !== 'ready' && phase !== 'done'}
      liveScore={formatScore(runningTotal)}
    >
      <section className="stage">
        {phase !== 'ready' && phase !== 'done' && (
          <div className="hudbar">
            <span className="hudbar__cell">
              Round <b>{round + 1}/{ROUNDS}</b>
            </span>
            <span className="pips">
              {Array.from({ length: ROUNDS }, (_, i) => (
                <span
                  key={i}
                  className="pip"
                  data-state={
                    results[i]
                      ? results[i].grade === 'MISS'
                        ? 'bad'
                        : 'good'
                      : i === round
                        ? 'active'
                        : 'idle'
                  }
                />
              ))}
            </span>
          </div>
        )}

        {phase === 'ready' && <ReadySplash game={game} onStart={beginRun} cta="Start the run" />}

        {phase !== 'ready' && phase !== 'done' && (
          <>
            <div className="dial">
              <svg className="dial__svg" viewBox="0 0 100 100">
                <circle className="dial__track" cx="50" cy="50" r={R} />
                <g className="dial__ticks">
                  {Array.from({ length: 12 }, (_, i) => {
                    const a = (i / 12) * Math.PI * 2;
                    return (
                      <line
                        key={i}
                        x1={50 + Math.cos(a) * (R - 9)}
                        y1={50 + Math.sin(a) * (R - 9)}
                        x2={50 + Math.cos(a) * (R - 13)}
                        y2={50 + Math.sin(a) * (R - 13)}
                      />
                    );
                  })}
                </g>
                <circle
                  className="dial__arc"
                  cx="50"
                  cy="50"
                  r={R}
                  data-over={overshoot}
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - sweep)}
                  style={{ opacity: blind ? 0.25 : 1, transition: 'opacity 400ms ease' }}
                />
              </svg>

              <div className="dial__face">
                {phase === 'armed' && (
                  <>
                    <span className="dial__caption">Target</span>
                    <span className="dial__readout num">{target.toFixed(2)}</span>
                    <span className="dial__caption">seconds</span>
                  </>
                )}

                {phase === 'running' && (
                  <>
                    <span className="dial__caption">
                      Target <span className="dial__target num">{target.toFixed(2)}s</span>
                    </span>
                    <span className="dial__readout num" data-blind={blind}>
                      {(elapsed / 1000).toFixed(2)}
                    </span>
                    <span className="dial__caption">{blind ? 'clock hidden' : 'watch it go'}</span>
                  </>
                )}

                {phase === 'verdict' && last && (
                  <div className="verdict">
                    <span className="verdict__grade" style={{ color: gradeFor(last.error).tone }}>
                      {last.grade}
                    </span>
                    <span className="dial__readout num" data-over={overshoot}>
                      {(last.elapsed / 1000).toFixed(2)}
                    </span>
                    <span className="verdict__delta num">
                      {last.elapsed > last.target * 1000 ? '+' : '−'}
                      {(last.error / 1000).toFixed(2)}s · +{last.points}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {phase === 'armed' && (
              <>
                <button type="button" className="btn btn--primary btn--lg" onClick={startRound}>
                  Start round {round + 1}
                </button>
                <p className="stage__hint">
                  The clock blurs out after half a second. Everything after that is instinct.
                </p>
              </>
            )}

            {phase === 'running' && (
              <>
                <button type="button" className="btn btn--primary btn--lg" onClick={() => stopRound()}>
                  Stop
                </button>
                <p className="stage__label">
                  press <span className="kbd">Space</span> to stop
                </p>
              </>
            )}

            {phase === 'verdict' && <p className="stage__label">next round…</p>}
          </>
        )}
      </section>

      {result && (
        <ResultCard {...result} gameId={game.id} onReplay={beginRun} onExit={onExit} />
      )}
    </GameFrame>
  );
}
