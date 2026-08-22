import { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame from '../GameFrame.jsx';
import ReadySplash from '../ui/ReadySplash.jsx';
import ResultCard from '../ui/ResultCard.jsx';
import { FREE_SESSION, useGameRun } from '../../lib/useGameRun.js';
import { useRafLoop } from '../../lib/useRafLoop.js';
import { clamp, formatScore, randFloat } from '../../lib/util.js';
import { play, buzz } from '../../lib/sound.js';

const RUN_MS = 30000;
const MAX_ON_SCREEN = 5;
const BOMB_TIME_COST = 2000;

const KINDS = {
  normal: { color: '#fbbf24', multiplier: 1 },
  bonus: { color: '#22e3d6', multiplier: 3 },
  bomb: { color: '#ff5470', multiplier: 0 },
};

/** Spawn interval and target lifetime both tighten as the run goes on. */
const spawnGap = (elapsed) => Math.max(360, 900 - (elapsed / RUN_MS) * 520);
const targetLife = (elapsed) => Math.max(820, 1650 - (elapsed / RUN_MS) * 850);

function rollKind(elapsed) {
  const r = Math.random();
  // Bombs stay rare early so nobody gets blown up in the first two seconds.
  const bombChance = elapsed < 4000 ? 0.02 : 0.09;
  if (r < bombChance) return 'bomb';
  if (r < bombChance + 0.1) return 'bonus';
  return 'normal';
}

export default function BullseyeBlitz({ game, onExit, session = FREE_SESSION }) {
  const { finish, rearm, result } = useGameRun(game, session);

  const [phase, setPhase] = useState('ready'); // ready | playing | done
  const [elapsed, setElapsed] = useState(0);
  const [targets, setTargets] = useState([]);
  const [pops, setPops] = useState([]);
  const [floats, setFloats] = useState([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [shots, setShots] = useState({ hits: 0, total: 0 });
  const [shaking, setShaking] = useState(false);

  const nextSpawn = useRef(0);
  const nextId = useRef(0);
  const arenaRef = useRef(null);
  // The clock lives in a ref so the frame loop never has to read stale state.
  const elapsedRef = useRef(0);

  const spawn = useCallback((at) => {
    nextId.current += 1;
    const kind = rollKind(at);
    const target = {
      id: nextId.current,
      kind,
      size: kind === 'bonus' ? randFloat(46, 62) : randFloat(58, 96),
      // Percentages keep targets inside the arena at any viewport size.
      x: randFloat(10, 90),
      y: randFloat(14, 86),
      born: at,
      life: targetLife(at),
    };
    setTargets((prev) => (prev.length >= MAX_ON_SCREEN ? prev : [...prev, target]));
  }, []);

  // --- the run clock: spawns, expiry and the countdown all live here -----
  useRafLoop(phase === 'playing', (delta) => {
    const now = Math.min(RUN_MS, elapsedRef.current + delta);
    elapsedRef.current = now;

    if (now < RUN_MS && now >= nextSpawn.current) {
      nextSpawn.current = now + spawnGap(now);
      spawn(now);
    }

    setTargets((list) => {
      const alive = list.filter((t) => now - t.born < t.life);
      return alive.length === list.length ? list : alive;
    });
    setElapsed(now);
  });

  useEffect(() => {
    if (phase === 'playing' && elapsed >= RUN_MS) setPhase('done');
  }, [phase, elapsed]);

  const begin = useCallback(() => {
    play('start');
    elapsedRef.current = 0;
    setElapsed(0);
    setTargets([]);
    setPops([]);
    setFloats([]);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setShots({ hits: 0, total: 0 });
    rearm();
    nextSpawn.current = 300;
    setPhase('playing');
  }, [rearm]);

  const addFloat = useCallback((x, y, text, color) => {
    const id = `${Date.now()}-${Math.random()}`;
    setFloats((prev) => [...prev.slice(-6), { id, x, y, text, color }]);
    setTimeout(() => setFloats((prev) => prev.filter((f) => f.id !== id)), 900);
  }, []);

  const hitTarget = useCallback(
    (target, event) => {
      event.stopPropagation();
      const age = elapsed - target.born;
      const freshness = clamp(1 - age / target.life, 0, 1);
      const rect = arenaRef.current?.getBoundingClientRect();
      const px = rect ? event.clientX - rect.left : 0;
      const py = rect ? event.clientY - rect.top : 0;

      setTargets((prev) => prev.filter((t) => t.id !== target.id));
      setPops((prev) => [
        ...prev.slice(-8),
        { id: target.id, x: target.x, y: target.y, size: target.size, color: KINDS[target.kind].color },
      ]);
      setTimeout(() => setPops((prev) => prev.filter((p) => p.id !== target.id)), 430);

      if (target.kind === 'bomb') {
        play('bomb');
        buzz([30, 60, 30]);
        setScore((s) => Math.max(0, s - 150));
        setCombo(0);
        elapsedRef.current = Math.min(RUN_MS, elapsedRef.current + BOMB_TIME_COST);
        setElapsed(elapsedRef.current);
        setShots((s) => ({ hits: s.hits, total: s.total + 1 }));
        setShaking(true);
        setTimeout(() => setShaking(false), 400);
        addFloat(px, py, '−150', 'var(--danger)');
        return;
      }

      const nextCombo = combo + 1;
      const comboMult = 1 + Math.min(nextCombo, 20) * 0.1;
      const points = Math.round(
        (40 + 60 * freshness) * KINDS[target.kind].multiplier * comboMult,
      );

      play(target.kind === 'bonus' ? 'great' : 'pop');
      buzz(8);
      setScore((s) => s + points);
      setCombo(nextCombo);
      setBestCombo((b) => Math.max(b, nextCombo));
      setShots((s) => ({ hits: s.hits + 1, total: s.total + 1 }));
      addFloat(px, py, `+${points}`, KINDS[target.kind].color);
    },
    [elapsed, combo, addFloat],
  );

  /** A click that did not land on a target breaks the chain. */
  const missShot = useCallback(() => {
    if (phase !== 'playing') return;
    play('click');
    setCombo(0);
    setShots((s) => ({ hits: s.hits, total: s.total + 1 }));
  }, [phase]);

  // --- commit the run ---------------------------------------------------
  useEffect(() => {
    if (phase !== 'done') return;
    const accuracy = shots.total ? Math.round((shots.hits / shots.total) * 100) : 0;

    finish({
      score,
      stats: { accuracy, bestCombo, shots: shots.total },
      scoreLabel: formatScore(score),
      unitLabel: 'points',
      verdict:
        score >= 4000
          ? 'Surgical'
          : score >= 2500
            ? 'Very quick hands'
            : score >= 1200
              ? 'Respectable aim'
              : 'Keep your eyes moving',
      blurb:
        accuracy >= 90
          ? 'Barely a wasted click. That is where the big combos come from.'
          : 'Every missed click resets your combo — slowing down often scores more.',
      cells: [
        { label: 'Accuracy', value: `${accuracy}%`, tone: 'var(--amber)' },
        { label: 'Best combo', value: `${bestCombo}x` },
        { label: 'Targets hit', value: shots.hits },
      ],
    });
  }, [phase, score, shots, bestCombo, finish]);

  useEffect(() => {
    function onKey(e) {
      if (phase === 'ready' && (e.code === 'Space' || e.key === 'Enter')) {
        e.preventDefault();
        begin();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, begin]);

  const timeLeft = Math.max(0, RUN_MS - elapsed);
  const timeFrac = timeLeft / RUN_MS;
  const comboMultLabel = (1 + Math.min(combo, 20) * 0.1).toFixed(1);

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      session={session}
      running={phase === 'playing'}
      liveScore={formatScore(score)}
    >
      <section className={`stage${shaking ? ' shake' : ''}`} style={{ padding: 0 }}>
        {phase === 'playing' && (
          <>
            <div className="timebar">
              <div
                className="timebar__fill"
                data-low={timeFrac < 0.2}
                style={{ transform: `scaleX(${Math.max(0, timeFrac)})` }}
              />
            </div>
            <div className="hudbar">
              <span className="hudbar__cell">
                Time <b>{(timeLeft / 1000).toFixed(1)}s</b>
              </span>
              <span className="hudbar__cell">
                Hits <b>{shots.hits}</b>
              </span>
            </div>
            {combo >= 2 && (
              <div className="combo" key={combo}>
                {comboMultLabel}× <small>combo</small>
              </div>
            )}
          </>
        )}

        {phase === 'ready' && (
          <div style={{ padding: '2rem 1.25rem' }}>
            <ReadySplash game={game} onStart={begin} cta="Go" />
          </div>
        )}

        {phase === 'playing' && (
          <div className="arena" ref={arenaRef} onPointerDown={missShot}>
            {targets.map((t) => {
              const age = elapsed - t.born;
              const freshness = clamp(1 - age / t.life, 0, 1);
              const scale = 0.42 + freshness * 0.58;
              return (
                <div
                  key={t.id}
                  className="target"
                  data-kind={t.kind}
                  style={{
                    '--tc': KINDS[t.kind].color,
                    left: `${t.x}%`,
                    top: `${t.y}%`,
                    width: t.size,
                    height: t.size,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    opacity: 0.35 + freshness * 0.65,
                  }}
                  onPointerDown={(e) => hitTarget(t, e)}
                >
                  <span className="target__ring" />
                  <span className="target__mid" />
                  <span className="target__core" />
                </div>
              );
            })}

            {pops.map((p) => (
              <span
                key={p.id}
                className="pop"
                style={{
                  '--tc': p.color,
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: p.size,
                  height: p.size,
                }}
              />
            ))}

            {floats.map((f) => (
              <span
                key={f.id}
                className="floatscore"
                style={{ left: f.x, top: f.y, color: f.color }}
              >
                {f.text}
              </span>
            ))}

            <p className="crosshair-note">
              gold = ×3 · red = trouble · missed clicks break the chain
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
