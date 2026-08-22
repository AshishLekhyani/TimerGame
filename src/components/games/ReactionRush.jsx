import { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame from '../GameFrame.jsx';
import ReadySplash from '../ui/ReadySplash.jsx';
import ResultCard from '../ui/ResultCard.jsx';
import { FREE_SESSION, useGameRun } from '../../lib/useGameRun.js';
import { mean, randInt } from '../../lib/util.js';
import { play, buzz } from '../../lib/sound.js';

const ROUNDS = 5;
/** Each false start adds this to your final average — jumping the gun costs. */
const FALSE_START_PENALTY = 25;

const VERDICTS = [
  { under: 180, title: 'Superhuman', blurb: 'That is at the edge of what nerves can do.' },
  { under: 220, title: 'Elite', blurb: 'Fighter-pilot territory. Genuinely fast.' },
  { under: 260, title: 'Sharp', blurb: 'Well above average — your wiring is in good shape.' },
  { under: 320, title: 'Solid', blurb: 'Right around where a well-rested human lands.' },
  { under: 420, title: 'Human', blurb: 'Perfectly normal. Coffee might shave 20ms off.' },
  { under: Infinity, title: 'Sleepy', blurb: 'Try again when the screen has your full attention.' },
];

export default function ReactionRush({ game, onExit, session = FREE_SESSION }) {
  const { finish, rearm, result } = useGameRun(game, session);

  const [phase, setPhase] = useState('ready'); // ready | wait | go | early | scored | done
  const [times, setTimes] = useState([]);
  const [falseStarts, setFalseStarts] = useState(0);
  const [lastMs, setLastMs] = useState(null);

  const goAt = useRef(0);
  const waitTimer = useRef(null);

  const clearWait = () => {
    if (waitTimer.current) clearTimeout(waitTimer.current);
    waitTimer.current = null;
  };

  /** Arm the next round: red pad, random delay, then green. */
  const arm = useCallback(() => {
    clearWait();
    setPhase('wait');
    waitTimer.current = setTimeout(() => {
      goAt.current = performance.now();
      play('go');
      buzz(10);
      setPhase('go');
    }, randInt(1300, 4200));
  }, []);

  const beginRun = useCallback(() => {
    play('start');
    setTimes([]);
    setFalseStarts(0);
    setLastMs(null);
    rearm();
    arm();
  }, [arm, rearm]);

  const strike = useCallback(() => {
    if (phase === 'ready') {
      beginRun();
      return;
    }

    if (phase === 'wait') {
      clearWait();
      play('bad');
      buzz([16, 50, 16]);
      setFalseStarts((n) => n + 1);
      setPhase('early');
      return;
    }

    if (phase === 'go') {
      const ms = performance.now() - goAt.current;
      play(ms < 220 ? 'great' : 'good');
      buzz(12);
      setLastMs(ms);
      setTimes((prev) => [...prev, ms]);
      setPhase('scored');
      return;
    }

    if (phase === 'early') {
      arm();
      return;
    }

    // 'scored' deliberately ignores input: the auto-advance timer owns it, so a
    // stray click cannot arm two rounds at once.
  }, [phase, beginRun, arm]);

  // Auto-advance out of the per-round result so the run keeps its rhythm.
  useEffect(() => {
    if (phase !== 'scored') return undefined;
    const id = setTimeout(() => {
      if (times.length >= ROUNDS) setPhase('done');
      else arm();
    }, 1200);
    return () => clearTimeout(id);
  }, [phase, times.length, arm]);

  useEffect(() => clearWait, []);

  // --- commit the run ---------------------------------------------------
  useEffect(() => {
    if (phase !== 'done' || !times.length) return;
    const best = Math.min(...times);
    const worst = Math.max(...times);
    const avg = mean(times);
    const score = Math.round(avg + falseStarts * FALSE_START_PENALTY);
    const verdict = VERDICTS.find((v) => score < v.under);

    finish({
      score,
      stats: { falseStarts, best, avg },
      scoreLabel: `${score}`,
      unitLabel: 'average ms',
      verdict: verdict.title,
      blurb: verdict.blurb,
      cells: [
        { label: 'Fastest', value: `${Math.round(best)}ms`, tone: 'var(--lime)' },
        { label: 'Slowest', value: `${Math.round(worst)}ms` },
        { label: 'False starts', value: falseStarts },
      ],
    });
  }, [phase, times, falseStarts, finish]);

  // --- keyboard ---------------------------------------------------------
  useEffect(() => {
    function onKey(e) {
      if (e.code !== 'Space' && e.key !== 'Enter') return;
      if (phase === 'done') return;
      e.preventDefault();
      strike();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, strike]);

  const liveAvg = times.length ? `${Math.round(mean(times))}ms` : '—';

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      session={session}
      running={phase !== 'ready' && phase !== 'done'}
      liveScore={liveAvg}
      liveLabel="Avg"
    >
      <section className="stage" style={{ padding: 0 }}>
        {phase === 'ready' ? (
          <div style={{ padding: '2rem 1.25rem' }}>
            <ReadySplash game={game} onStart={beginRun} cta="Arm the pad" />
          </div>
        ) : (
          <div
            className="pad"
            data-phase={phase}
            role="button"
            tabIndex={0}
            onPointerDown={strike}
            onKeyDown={(e) => e.preventDefault()}
            aria-label="Reaction pad"
          >
            {phase === 'wait' && (
              <>
                <p className="pad__big">Wait…</p>
                <p className="pad__sub">Hands off. The pad turns green when it is ready.</p>
              </>
            )}

            {phase === 'go' && (
              <p className="pad__big pad__go" style={{ color: '#b6ff7a' }}>
                GO!
              </p>
            )}

            {phase === 'early' && (
              <>
                <p className="pad__big" style={{ color: 'var(--danger)' }}>
                  Too soon
                </p>
                <p className="pad__sub">
                  You went before the green. Round voided — {FALSE_START_PENALTY}ms added to your
                  average. Click to retry.
                </p>
              </>
            )}

            {phase === 'scored' && lastMs !== null && (
              <>
                <p className="pad__ms num" style={{ color: lastMs < 250 ? '#b6ff7a' : '#fff' }}>
                  {Math.round(lastMs)}
                  <span style={{ fontSize: '0.35em', marginLeft: '0.15em' }}>ms</span>
                </p>
                <p className="pad__sub">
                  {times.length >= ROUNDS ? 'Last round — tallying up…' : 'Get ready for the next one.'}
                </p>
              </>
            )}

            <div className="rounds" style={{ marginTop: '1.5rem' }}>
              {Array.from({ length: ROUNDS }, (_, i) => (
                <span
                  key={i}
                  className="roundchip"
                  data-state={
                    times[i] === undefined ? 'pending' : times[i] < 280 ? 'good' : 'bad'
                  }
                >
                  {times[i] === undefined ? '—' : Math.round(times[i])}
                </span>
              ))}
            </div>

            {falseStarts > 0 && (
              <p style={{ fontSize: '0.74rem', color: 'var(--danger)', marginTop: '0.4rem' }}>
                {falseStarts} false start{falseStarts > 1 ? 's' : ''} · +
                {falseStarts * FALSE_START_PENALTY}ms
              </p>
            )}
          </div>
        )}
      </section>

      {result && (
        <ResultCard {...result} gameId={game.id} onReplay={beginRun} onExit={onExit} />
      )}
    </GameFrame>
  );
}
