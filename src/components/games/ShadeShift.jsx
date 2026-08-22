import { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame from '../GameFrame.jsx';
import ReadySplash from '../ui/ReadySplash.jsx';
import ResultCard from '../ui/ResultCard.jsx';
import { FREE_SESSION, useGameRun } from '../../lib/useGameRun.js';
import { useRafLoop } from '../../lib/useRafLoop.js';
import { clamp, formatScore, randInt, randFloat } from '../../lib/util.js';
import { play, buzz } from '../../lib/sound.js';

const RUN_MS = 60000;
const WRONG_PENALTY = 3000;
const CORRECT_BONUS = 900;

/** Grid grows every other level, up to 7×7. */
const gridFor = (level) => clamp(2 + Math.floor((level - 1) / 2), 2, 7);

/**
 * How different the odd tile is, in HSL lightness percent.
 * Starts obvious, ends at the edge of what a screen can even show.
 */
const deltaFor = (level) => Math.max(1.6, 26 * Math.pow(0.86, level - 1));

function makeLevel(level) {
  const cells = gridFor(level) ** 2;
  const hue = randInt(0, 359);
  const saturation = randInt(58, 78);
  const lightness = randFloat(42, 60);
  const delta = deltaFor(level);
  // Half the time the odd one out is lighter, half the time darker — you cannot
  // learn to only scan for "the bright one".
  const direction = Math.random() < 0.5 ? 1 : -1;

  return {
    size: gridFor(level),
    odd: randInt(0, cells - 1),
    base: `hsl(${hue} ${saturation}% ${lightness}%)`,
    target: `hsl(${hue} ${saturation}% ${clamp(lightness + delta * direction, 12, 92)}%)`,
    delta,
  };
}

export default function ShadeShift({ game, onExit, session = FREE_SESSION }) {
  const { finish, rearm, result } = useGameRun(game, session);

  const [phase, setPhase] = useState('ready'); // ready | playing | done
  const [level, setLevel] = useState(1);
  const [board, setBoard] = useState(() => makeLevel(1));
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(RUN_MS);
  const [misses, setMisses] = useState(0);
  const [wrongCell, setWrongCell] = useState(null);
  const [bestLevel, setBestLevel] = useState(1);

  const levelStartedAt = useRef(0);
  const timeRef = useRef(RUN_MS);

  useRafLoop(phase === 'playing', (delta) => {
    timeRef.current = Math.max(0, timeRef.current - delta);
    setTimeLeft(timeRef.current);
  });

  useEffect(() => {
    if (phase === 'playing' && timeLeft <= 0) setPhase('done');
  }, [phase, timeLeft]);

  const begin = useCallback(() => {
    play('start');
    rearm();
    setLevel(1);
    setBoard(makeLevel(1));
    setScore(0);
    setMisses(0);
    setBestLevel(1);
    setWrongCell(null);
    timeRef.current = RUN_MS;
    setTimeLeft(RUN_MS);
    levelStartedAt.current = performance.now();
    setPhase('playing');
  }, [rearm]);

  const tap = useCallback(
    (index) => {
      if (phase !== 'playing') return;

      if (index !== board.odd) {
        play('bad');
        buzz([18, 45, 18]);
        timeRef.current = Math.max(0, timeRef.current - WRONG_PENALTY);
        setTimeLeft(timeRef.current);
        setMisses((m) => m + 1);
        setWrongCell(index);
        setTimeout(() => setWrongCell(null), 380);
        return;
      }

      // Found it. Faster finds are worth more, and the level itself scales.
      const took = performance.now() - levelStartedAt.current;
      const speed = clamp(1 - took / 6000, 0, 1);
      const points = Math.round(level * 70 * (1 + speed));
      const nextLevel = level + 1;

      play(level % 5 === 0 ? 'great' : 'good');
      buzz(7);
      setScore((s) => s + points);
      setLevel(nextLevel);
      setBestLevel((b) => Math.max(b, nextLevel));
      setBoard(makeLevel(nextLevel));
      timeRef.current = Math.min(RUN_MS, timeRef.current + CORRECT_BONUS);
      setTimeLeft(timeRef.current);
      levelStartedAt.current = performance.now();
    },
    [phase, board, level],
  );

  // --- commit the run ----------------------------------------------------
  useEffect(() => {
    if (phase !== 'done') return;
    const reached = bestLevel - 1;

    finish({
      score,
      stats: { level: reached, misses, delta: deltaFor(Math.max(1, reached)) },
      scoreLabel: formatScore(score),
      unitLabel: 'points',
      verdict:
        reached >= 18
          ? 'Inhuman colour vision'
          : reached >= 13
            ? 'Exceptional discrimination'
            : reached >= 9
              ? 'Sharp eyes'
              : reached >= 5
                ? 'Perfectly normal'
                : 'Try a brighter screen',
      blurb: `You got to level ${reached}, where the odd tile differs by about ${deltaFor(Math.max(1, reached)).toFixed(1)}% lightness on a ${gridFor(Math.max(1, reached))}×${gridFor(Math.max(1, reached))} grid.`,
      cells: [
        { label: 'Level', value: reached, tone: 'var(--accent)' },
        { label: 'Grid', value: `${gridFor(Math.max(1, reached))}²` },
        { label: 'Misses', value: misses },
      ],
    });
  }, [phase, score, bestLevel, misses, finish]);

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

  const timeFrac = timeLeft / RUN_MS;

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
                data-low={timeFrac < 0.22}
                style={{ transform: `scaleX(${Math.max(0, timeFrac)})` }}
              />
            </div>
            <div className="hudbar">
              <span className="hudbar__cell">
                Level <b>{level}</b>
              </span>
              <span className="hudbar__cell">
                <b>{(timeLeft / 1000).toFixed(1)}s</b>
              </span>
            </div>
          </>
        )}

        {phase === 'ready' && <ReadySplash game={game} onStart={begin} cta="Start" />}

        {phase === 'playing' && (
          <>
            <div
              className="shade"
              style={{ gridTemplateColumns: `repeat(${board.size}, 1fr)` }}
              key={level}
            >
              {Array.from({ length: board.size ** 2 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  className="shadecell"
                  data-wrong={i === wrongCell}
                  style={{ background: i === board.odd ? board.target : board.base }}
                  onClick={() => tap(i)}
                  aria-label={`Tile ${i + 1}`}
                />
              ))}
            </div>
            <p className="stage__label">
              {board.delta < 4 ? 'good luck' : `${board.size}×${board.size} · find the odd one`}
            </p>
          </>
        )}
      </section>

      {result && <ResultCard {...result} gameId={game.id} onReplay={begin} onExit={onExit} />}
    </GameFrame>
  );
}
