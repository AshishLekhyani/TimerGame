import { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame from '../GameFrame.jsx';
import ReadySplash from '../ui/ReadySplash.jsx';
import ResultCard from '../ui/ResultCard.jsx';
import { FREE_SESSION, useGameRun } from '../../lib/useGameRun.js';
import { useRafLoop } from '../../lib/useRafLoop.js';
import { formatScore, shuffle } from '../../lib/util.js';
import { play, buzz } from '../../lib/sound.js';

const SIZE = 5;
const TOTAL = SIZE * SIZE;
/** The board stops sitting still once you reach this number. */
const CHAOS_FROM = 10;
const RESHUFFLE_EVERY = 5;
const WRONG_PENALTY = 2000;

const makeBoard = () => shuffle(Array.from({ length: TOTAL }, (_, i) => i + 1));

export default function NumberChase({ game, onExit, session = FREE_SESSION }) {
  const { finish, rearm, result } = useGameRun(game, session);

  const [phase, setPhase] = useState('ready'); // ready | playing | done
  const [board, setBoard] = useState(makeBoard);
  const [next, setNext] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [penalties, setPenalties] = useState(0);
  const [wrongCell, setWrongCell] = useState(null);
  const [justShuffled, setJustShuffled] = useState(false);

  const startedAt = useRef(0);
  const penaltyRef = useRef(0);

  useRafLoop(phase === 'playing', () => {
    setElapsed(performance.now() - startedAt.current + penaltyRef.current);
  });

  const begin = useCallback(() => {
    play('start');
    rearm();
    setBoard(makeBoard());
    setNext(1);
    setPenalties(0);
    setWrongCell(null);
    penaltyRef.current = 0;
    startedAt.current = performance.now();
    setElapsed(0);
    setPhase('playing');
  }, [rearm]);

  const tap = useCallback(
    (value) => {
      if (phase !== 'playing') return;

      if (value !== next) {
        play('bad');
        buzz([20, 50, 20]);
        penaltyRef.current += WRONG_PENALTY;
        setPenalties((p) => p + 1);
        setWrongCell(value);
        setTimeout(() => setWrongCell(null), 400);
        return;
      }

      if (value === TOTAL) {
        play('perfect');
        setNext(TOTAL + 1);
        setPhase('done');
        return;
      }

      play('click');
      buzz(6);
      setNext(value + 1);

      // The board starts moving once you are past the halfway mark.
      if (value >= CHAOS_FROM && value % RESHUFFLE_EVERY === 0) {
        setBoard(makeBoard());
        setJustShuffled(true);
        play('tick');
        setTimeout(() => setJustShuffled(false), 420);
      }
    },
    [phase, next],
  );

  // --- commit the run ----------------------------------------------------
  useEffect(() => {
    if (phase !== 'done') return;
    const total = elapsed;
    const seconds = total / 1000;
    const score = Math.round(90000 / Math.max(8, seconds));

    finish({
      score,
      stats: { seconds, penalties },
      scoreLabel: formatScore(score),
      unitLabel: 'points',
      verdict:
        seconds <= 18
          ? 'Scanning like a machine'
          : seconds <= 26
            ? 'Very quick eyes'
            : seconds <= 38
              ? 'Solid visual search'
              : 'The board won that one',
      blurb:
        penalties === 0
          ? `Clean sweep in ${seconds.toFixed(1)}s — not one wrong tap.`
          : `${seconds.toFixed(1)}s including ${penalties * (WRONG_PENALTY / 1000)}s of penalties from ${penalties} wrong tap${penalties > 1 ? 's' : ''}.`,
      cells: [
        { label: 'Time', value: `${seconds.toFixed(1)}s`, tone: 'var(--accent)' },
        { label: 'Wrong taps', value: penalties },
        { label: 'Reshuffles', value: Math.floor((TOTAL - CHAOS_FROM) / RESHUFFLE_EVERY) + 1 },
      ],
    });
  }, [phase, elapsed, penalties, finish]);

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

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      session={session}
      running={phase === 'playing'}
      liveScore={`${(elapsed / 1000).toFixed(1)}s`}
      liveLabel="Time"
    >
      <section className="stage">
        {phase === 'playing' && (
          <div className="hudbar">
            <span className="hudbar__cell">
              Find <b>{next}</b>
            </span>
            <span className="hudbar__cell">
              {penalties > 0 && (
                <span style={{ color: 'var(--danger)' }}>
                  +{penalties * (WRONG_PENALTY / 1000)}s
                </span>
              )}
            </span>
          </div>
        )}

        {phase === 'ready' && <ReadySplash game={game} onStart={begin} cta="Start the chase" />}

        {phase === 'playing' && (
          <>
            <div className="chasenext">
              <span className="chasenext__label">Next</span>
              <span className="chasenext__num num" key={next}>
                {next}
              </span>
            </div>

            <div className="chase" data-shuffled={justShuffled}>
              {board.map((value) => (
                <button
                  key={`${value}-${board.indexOf(value)}`}
                  type="button"
                  className="chasecell num"
                  data-done={value < next}
                  data-wrong={value === wrongCell}
                  onClick={() => tap(value)}
                >
                  {value}
                </button>
              ))}
            </div>

            <p className="stage__label">
              {next > CHAOS_FROM ? 'the board is moving now' : `board reshuffles from ${CHAOS_FROM}`}
            </p>
          </>
        )}
      </section>

      {result && <ResultCard {...result} gameId={game.id} onReplay={begin} onExit={onExit} />}
    </GameFrame>
  );
}
