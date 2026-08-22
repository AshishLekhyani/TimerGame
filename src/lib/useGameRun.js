import { useCallback, useRef, useState } from 'react';
import { useArcade } from '../state/ArcadeContext.jsx';
import { play } from './sound.js';

/** What a game gets when nobody is orchestrating it. */
export const FREE_SESSION = { mode: 'free' };

/**
 * The end-of-run contract shared by every game.
 *
 * A game calls `finish()` exactly once with its score plus the presentation
 * bits for the result screen. In free play that commits the run and hands back
 * a result to render; inside the Gauntlet or the Daily Challenge the orchestrator
 * takes over instead and the game simply reports upward.
 *
 * @param {object} game    the catalogue entry
 * @param {object} session { mode, onFinish?, leg?, legCount? }
 */
export function useGameRun(game, session = FREE_SESSION) {
  const { recordRun } = useArcade();
  const [result, setResult] = useState(null);
  // Guards against a state machine that manages to fire its done-effect twice.
  const finished = useRef(false);

  const finish = useCallback(
    (payload) => {
      if (finished.current) return;
      finished.current = true;
      play('gameover');

      if (session.mode === 'free') {
        const summary = recordRun(game.id, payload.score, payload.stats ?? {});
        setResult({ ...payload, summary });
      } else {
        setResult({ ...payload, summary: null });
        session.onFinish?.({ gameId: game.id, ...payload });
      }
    },
    [game.id, recordRun, session],
  );

  /** Call at the top of a game's begin()/restart handler. */
  const rearm = useCallback(() => {
    finished.current = false;
    setResult(null);
  }, []);

  return {
    finish,
    rearm,
    /** Non-null once the run is over. Only rendered in free play. */
    result: session.mode === 'free' ? result : null,
    isFree: session.mode === 'free',
    session,
  };
}
