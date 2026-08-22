import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useArcade } from '../state/ArcadeContext.jsx';
import { Back, Info } from './ui/Icons.jsx';
import { formatScore } from '../lib/util.js';
import { FREE_SESSION } from '../lib/useGameRun.js';

/**
 * Chrome shared by every game screen: back button, title, best/live score
 * chips, and the "quit mid-run?" guard. Games render their play surface as
 * children.
 */
export default function GameFrame({
  game,
  onExit,
  liveScore,
  liveLabel = 'Score',
  session = FREE_SESSION,
  /** True while a run is actually in progress — enables the quit guard. */
  running = false,
  children,
}) {
  const { profile } = useArcade();
  const [confirmQuit, setConfirmQuit] = useState(false);

  const entry = profile.scores[game.id];
  const hasBest = entry?.best !== null && entry?.best !== undefined;
  const best = hasBest
    ? game.betterIsLower
      ? `${Math.round(entry.best)}ms`
      : formatScore(entry.best)
    : '—';

  const requestExit = useCallback(() => {
    if (running) setConfirmQuit(true);
    else onExit();
  }, [running, onExit]);

  useEffect(() => {
    function onKey(e) {
      if (e.key !== 'Escape') return;
      if (confirmQuit) setConfirmQuit(false);
      else requestExit();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmQuit, requestExit]);

  const inSeries = session.mode !== 'free';

  return (
    <main className="wrap frame">
      <div className="frame__head">
        <button
          type="button"
          className="iconbtn"
          onClick={requestExit}
          aria-label="Back to the arcade"
          title="Back (Esc)"
        >
          <Back />
        </button>

        <div className="frame__title">
          <h1>{game.name}</h1>
          <p>{game.tagline}</p>
        </div>

        <div className="frame__scores">
          {liveScore !== undefined && liveScore !== null && (
            <div className="scorechip scorechip--accent">
              <span>{liveLabel}</span>
              <b>{liveScore}</b>
            </div>
          )}
          {inSeries ? (
            <div className="scorechip">
              <span>{session.mode === 'daily' ? 'Daily' : 'Gauntlet'}</span>
              <b>
                {session.leg + 1}/{session.legCount}
              </b>
            </div>
          ) : (
            <div className="scorechip">
              <span>Best</span>
              <b className={hasBest ? '' : 'is-empty'}>{best}</b>
            </div>
          )}
        </div>
      </div>

      {children}

      {confirmQuit &&
        createPortal(
          <div className="overlay" role="dialog" aria-modal="true" aria-label="Quit run">
            <div className="sheet" style={{ width: 'min(400px, 100%)' }}>
              <span className="ready__icon" style={{ marginBottom: '1rem' }}>
                <Info />
              </span>
              <h2 className="sheet__title" style={{ marginBottom: '0.5rem' }}>
                Leave this run?
              </h2>
              <p className="result__blurb" style={{ marginTop: 0, marginBottom: '1.5rem' }}>
                {inSeries
                  ? 'The whole series ends here and nothing gets recorded.'
                  : 'This run will not be scored.'}
              </p>
              <div className="result__actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setConfirmQuit(false)}
                >
                  Keep playing
                </button>
                <button type="button" className="btn btn--primary" onClick={onExit}>
                  Leave
                </button>
              </div>
            </div>
          </div>,
          document.getElementById('modal'),
        )}
    </main>
  );
}
