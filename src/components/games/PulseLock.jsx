import { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame from '../GameFrame.jsx';
import ReadySplash from '../ui/ReadySplash.jsx';
import ResultCard from '../ui/ResultCard.jsx';
import { FREE_SESSION, useGameRun } from '../../lib/useGameRun.js';
import { useRafLoop } from '../../lib/useRafLoop.js';
import { formatScore, randFloat } from '../../lib/util.js';
import { play, buzz } from '../../lib/sound.js';

/**
 * Pulse Lock — precision timing.
 *
 * A marker sweeps back and forth across a bar. Stop it inside the target zone.
 * Every hit shrinks the zone and speeds the sweep up, so the run is a slow
 * squeeze rather than a difficulty cliff — and dead-centre hits are worth
 * several times an edge clip, which keeps you greedy.
 */

const LIVES = 3;
/** Zone half-width as a fraction of the bar, by level. */
const zoneFor = (level) => Math.max(0.022, 0.15 * Math.pow(0.9, level - 1));
/** Sweeps per second. */
const speedFor = (level) => Math.min(1.55, 0.42 + level * 0.055);

export default function PulseLock({ game, onExit, session = FREE_SESSION }) {
  const { finish, rearm, result } = useGameRun(game, session);

  const [phase, setPhase] = useState('ready'); // ready | running | verdict | done
  const [level, setLevel] = useState(1);
  const [pos, setPos] = useState(0); // 0..1 across the bar
  const [target, setTarget] = useState(0.5);
  const [lives, setLives] = useState(LIVES);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [perfects, setPerfects] = useState(0);
  const [last, setLast] = useState(null); // { grade, error, points }

  const dir = useRef(1);
  const posRef = useRef(0);

  useRafLoop(phase === 'running', (delta) => {
    const speed = speedFor(level) * (delta / 1000) * 2; // 2 = full sweep there and back
    let next = posRef.current + dir.current * speed;
    if (next >= 1) {
      next = 1;
      dir.current = -1;
    } else if (next <= 0) {
      next = 0;
      dir.current = 1;
    }
    posRef.current = next;
    setPos(next);
  });

  const nextRound = useCallback((lvl) => {
    // Keep the zone away from the very edges — a marker that reverses inside
    // the zone would make it far too easy.
    setTarget(randFloat(0.18, 0.82));
    posRef.current = Math.random() < 0.5 ? 0 : 1;
    dir.current = posRef.current === 0 ? 1 : -1;
    setPos(posRef.current);
    setLevel(lvl);
    setPhase('running');
  }, []);

  const begin = useCallback(() => {
    play('start');
    rearm();
    setLives(LIVES);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setPerfects(0);
    setLast(null);
    nextRound(1);
  }, [rearm, nextRound]);

  const lock = useCallback(() => {
    if (phase !== 'running') return;
    const zone = zoneFor(level);
    const error = Math.abs(posRef.current - target);
    const hit = error <= zone;

    if (!hit) {
      const nextLives = lives - 1;
      play('bad');
      buzz([22, 55, 22]);
      setLives(nextLives);
      setStreak(0);
      setLast({ grade: 'MISS', error, points: 0 });
      setPhase('verdict');
      setTimeout(() => {
        if (nextLives <= 0) setPhase('done');
        else nextRound(level);
      }, 1300);
      return;
    }

    // Accuracy inside the zone drives everything: dead centre is worth 4x an edge.
    const accuracy = 1 - error / zone;
    const perfect = accuracy >= 0.9;
    const nextStreak = streak + 1;
    const multiplier = Math.min(5, 1 + Math.floor(nextStreak / 4));
    const points = Math.round((60 + 240 * accuracy * accuracy) * level * 0.6 * multiplier);

    play(perfect ? 'perfect' : nextStreak % 4 === 0 ? 'great' : 'good');
    buzz(perfect ? [10, 30, 10] : 8);
    setScore((s) => s + points);
    setStreak(nextStreak);
    setBestStreak((b) => Math.max(b, nextStreak));
    if (perfect) setPerfects((p) => p + 1);
    setLast({ grade: perfect ? 'PERFECT' : accuracy > 0.55 ? 'CLEAN' : 'EDGE', error, points });
    setPhase('verdict');
    setTimeout(() => nextRound(level + 1), 900);
  }, [phase, level, target, lives, streak, nextRound]);

  // --- commit the run ----------------------------------------------------
  useEffect(() => {
    if (phase !== 'done') return;
    finish({
      score,
      stats: { level, bestStreak, perfects },
      scoreLabel: formatScore(score),
      unitLabel: 'points',
      verdict:
        level >= 22
          ? 'Surgical'
          : level >= 15
            ? 'Very steady hands'
            : level >= 9
              ? 'Good control'
              : 'The zone gets small fast',
      blurb: `You reached level ${level}, where the target zone is about ${(zoneFor(level) * 200).toFixed(1)}% of the bar wide.`,
      cells: [
        { label: 'Level', value: level, tone: 'var(--accent)' },
        { label: 'Perfect locks', value: perfects },
        { label: 'Best streak', value: `${bestStreak}x` },
      ],
    });
  }, [phase, score, level, bestStreak, perfects, finish]);

  useEffect(() => {
    function onKey(e) {
      if (e.code !== 'Space' && e.key !== 'Enter') return;
      if (phase === 'done') return;
      e.preventDefault();
      if (phase === 'ready') begin();
      else if (phase === 'running') lock();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, begin, lock]);

  const zone = zoneFor(level);
  const multiplier = Math.min(5, 1 + Math.floor(streak / 4));

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      session={session}
      running={phase === 'running' || phase === 'verdict'}
      liveScore={formatScore(score)}
    >
      <section className={`stage${last?.grade === 'MISS' && phase === 'verdict' ? ' shake' : ''}`}>
        {phase !== 'ready' && phase !== 'done' && (
          <>
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
          <div className="lockgame">
            <div className="lockbar">
              {/* the target zone */}
              <span
                className="lockzone"
                style={{
                  left: `${(target - zone) * 100}%`,
                  width: `${zone * 200}%`,
                }}
              />
              <span className="lockzone__centre" style={{ left: `${target * 100}%` }} />
              {/* the sweeping marker */}
              <span
                className="lockmarker"
                data-stopped={phase === 'verdict'}
                style={{ left: `${pos * 100}%` }}
              />
            </div>

            {phase === 'verdict' && last ? (
              <div className="verdict">
                <span
                  className="verdict__grade"
                  style={{
                    color:
                      last.grade === 'PERFECT'
                        ? 'var(--amber)'
                        : last.grade === 'MISS'
                          ? 'var(--danger)'
                          : 'var(--accent)',
                  }}
                >
                  {last.grade}
                </span>
                <span className="verdict__delta num">
                  {last.points > 0 ? `+${last.points}` : `off by ${(last.error * 100).toFixed(1)}%`}
                </span>
              </div>
            ) : (
              <button type="button" className="btn btn--primary btn--lg" onClick={lock}>
                Lock it
              </button>
            )}

            <p className="stage__label">
              press <span className="kbd">Space</span> · zone shrinks every level
            </p>
          </div>
        )}
      </section>

      {result && <ResultCard {...result} gameId={game.id} onReplay={begin} onExit={onExit} />}
    </GameFrame>
  );
}
