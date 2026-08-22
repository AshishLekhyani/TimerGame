import { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame from '../GameFrame.jsx';
import ReadySplash from '../ui/ReadySplash.jsx';
import ResultCard from '../ui/ResultCard.jsx';
import { FREE_SESSION, useGameRun } from '../../lib/useGameRun.js';
import { formatScore, sampleIndices } from '../../lib/util.js';
import { play, buzz } from '../../lib/sound.js';

const LIVES = 3;

/** The board grows as you climb, which keeps the density roughly constant. */
const gridSize = (level) => (level <= 4 ? 4 : level <= 8 ? 5 : 6);
const patternSize = (level) => Math.min(level + 2, Math.floor(gridSize(level) ** 2 * 0.45));
const showDuration = (level, count) => Math.max(700, 620 + count * 240 - level * 30);

export default function MemoryMatrix({ game, onExit, session = FREE_SESSION }) {
  const { finish, rearm, result } = useGameRun(game, session);

  const [phase, setPhase] = useState('ready'); // ready | show | input | cleared | reveal | done
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(LIVES);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [pattern, setPattern] = useState([]);
  const [found, setFound] = useState([]);
  const [wrongTile, setWrongTile] = useState(null);
  // The board only resizes when a new pattern is dealt, so the "cleared" beat
  // does not reflow the grid under the tiles you just tapped.
  const [boardLevel, setBoardLevel] = useState(1);

  const inputStartedAt = useRef(0);
  const size = gridSize(boardLevel);
  const cells = size * size;

  const startLevel = useCallback(
    (lvl) => {
      const count = patternSize(lvl);
      const next = sampleIndices(gridSize(lvl) ** 2, count);
      setPattern(next);
      setFound([]);
      setWrongTile(null);
      setBoardLevel(lvl);
      setPhase('show');
      play('tick');
    },
    [],
  );

  const begin = useCallback(() => {
    play('start');
    setLevel(1);
    setLives(LIVES);
    setScore(0);
    setMistakes(0);
    rearm();
    startLevel(1);
  }, [startLevel, rearm]);

  // Hide the pattern once the memorise window is up.
  useEffect(() => {
    if (phase !== 'show') return undefined;
    const id = setTimeout(() => {
      inputStartedAt.current = performance.now();
      setPhase('input');
    }, showDuration(level, pattern.length));
    return () => clearTimeout(id);
  }, [phase, level, pattern.length]);

  // After a miss, flash the answer, then retry the same level.
  useEffect(() => {
    if (phase !== 'reveal') return undefined;
    const id = setTimeout(() => {
      if (lives <= 0) setPhase('done');
      else startLevel(level);
    }, 1400);
    return () => clearTimeout(id);
  }, [phase, lives, level, startLevel]);

  const tapTile = useCallback(
    (index) => {
      if (phase !== 'input' || found.includes(index)) return;

      if (!pattern.includes(index)) {
        play('bad');
        buzz([20, 50, 20]);
        setWrongTile(index);
        setMistakes((m) => m + 1);
        const nextLives = lives - 1;
        setLives(nextLives);
        setPhase('reveal');
        return;
      }

      const nextFound = [...found, index];
      setFound(nextFound);

      if (nextFound.length < pattern.length) {
        play('click');
        buzz(6);
        return;
      }

      // Level cleared — award points plus a bonus for recalling it quickly.
      const took = performance.now() - inputStartedAt.current;
      const par = pattern.length * 900;
      const speedBonus = Math.max(0, Math.round((1 - Math.min(1, took / par)) * level * 60));
      play('great');
      buzz([10, 30, 10]);
      setScore((s) => s + level * 120 + speedBonus);
      setLevel(level + 1);
      setPhase('cleared');
    },
    [phase, found, pattern, lives, level],
  );

  // Let the completed pattern glow for a beat, then deal the next level.
  useEffect(() => {
    if (phase !== 'cleared') return undefined;
    const id = setTimeout(() => startLevel(level), 700);
    return () => clearTimeout(id);
  }, [phase, level, startLevel]);

  // --- commit the run ---------------------------------------------------
  useEffect(() => {
    if (phase !== 'done') return;
    const held = patternSize(Math.max(1, level - 1));

    finish({
      score,
      stats: { level, mistakes },
      scoreLabel: formatScore(score),
      unitLabel: 'points',
      verdict:
        level >= 9
          ? 'Photographic'
          : level >= 6
            ? 'Serious recall'
            : level >= 4
              ? 'Solid working memory'
              : 'Room to grow',
      blurb: `You held ${held} tiles in your head at once. Most people top out around seven.`,
      cells: [
        { label: 'Level', value: level, tone: 'var(--violet)' },
        { label: 'Tiles held', value: held },
        { label: 'Mistakes', value: mistakes },
      ],
    });
  }, [phase, score, level, mistakes, finish]);

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

  function tileState(i) {
    if (phase === 'show' && pattern.includes(i)) return 'lit';
    if (phase === 'reveal') {
      if (i === wrongTile) return 'miss';
      if (pattern.includes(i)) return 'lit';
      return 'idle';
    }
    if (found.includes(i)) return 'hit';
    return 'idle';
  }

  const phaseLabel =
    phase === 'show'
      ? 'Memorise'
      : phase === 'input'
        ? `Tap ${pattern.length - found.length} more`
        : phase === 'reveal'
          ? 'That was the pattern'
          : phase === 'cleared'
            ? 'Clear!'
            : '';

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      session={session}
      running={phase !== 'ready' && phase !== 'done'}
      liveScore={formatScore(score)}
    >
      <section className="stage">
        {phase !== 'ready' && phase !== 'done' && (
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
        )}

        {phase === 'ready' && <ReadySplash game={game} onStart={begin} cta="Start" />}

        {phase !== 'ready' && phase !== 'done' && (
          <>
            <p className="matrix__phase">{phaseLabel}</p>

            <div
              className="matrix"
              data-locked={phase !== 'input'}
              style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
            >
              {Array.from({ length: cells }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  className="tile"
                  data-state={tileState(i)}
                  disabled={phase !== 'input'}
                  onClick={() => tapTile(i)}
                  aria-label={`Tile ${i + 1}`}
                  style={
                    phase === 'show' && pattern.includes(i)
                      ? { transitionDelay: `${pattern.indexOf(i) * 60}ms` }
                      : undefined
                  }
                />
              ))}
            </div>

            <p className="stage__hint">
              {phase === 'show'
                ? `${pattern.length} tiles — order does not matter.`
                : phase === 'reveal'
                  ? 'Same level again. Take a breath.'
                  : phase === 'cleared'
                    ? 'One more tile next time.'
                    : 'Rebuild it from memory.'}
            </p>
          </>
        )}
      </section>

      {result && (
        <ResultCard {...result} gameId={game.id} onReplay={begin} onExit={onExit} />
      )}
    </GameFrame>
  );
}
