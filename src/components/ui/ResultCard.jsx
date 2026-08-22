import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Confetti from './Confetti.jsx';
import Sparkline from './Sparkline.jsx';
import { Replay, Back, Trophy, Spark, Share, Check } from './Icons.jsx';
import { GAME_BY_ID } from '../../data/games.js';
import { useArcade } from '../../state/ArcadeContext.jsx';
import { copyText, mean } from '../../lib/util.js';

/** Where this run sits among your previous ones, in plain words. */
function standing(game, score, past) {
  if (past.length < 3) return null;
  const previous = past.slice(0, -1).map((h) => h.s);
  if (!previous.length) return null;

  const better = game.betterIsLower
    ? previous.filter((s) => score < s).length
    : previous.filter((s) => score > s).length;
  const placeFromTop = previous.length - better + 1;

  const avg = mean(previous);
  const delta = game.betterIsLower ? ((avg - score) / avg) * 100 : ((score - avg) / avg) * 100;
  const deltaLabel = `${delta >= 0 ? '+' : ''}${delta.toFixed(0)}% vs your average`;

  if (placeFromTop === 1) return { place: 'Best run yet', delta: deltaLabel, good: true };
  if (placeFromTop <= 3) return { place: `${placeFromTop === 2 ? '2nd' : '3rd'} best run`, delta: deltaLabel, good: true };
  return { place: `#${placeFromTop} of ${previous.length + 1} runs`, delta: deltaLabel, good: delta >= 0 };
}

/**
 * Shared end-of-run screen. Every game hands it the same shape, so the payoff
 * moment looks and feels identical across the arcade.
 */
export default function ResultCard({
  gameId,
  scoreLabel,
  unitLabel,
  verdict,
  blurb,
  cells = [],
  summary,
  onReplay,
  onExit,
}) {
  const { profile, level, title } = useArcade();
  const [copied, setCopied] = useState(false);
  const game = GAME_BY_ID[gameId];
  const isRecord = summary?.isRecord && summary?.previousBest !== null;

  const past = useMemo(() => profile.history[gameId] ?? [], [profile.history, gameId]);
  const trend = useMemo(() => past.slice(-14).map((h) => h.s), [past]);
  const rank = useMemo(() => (game ? standing(game, past.at(-1)?.s ?? 0, past) : null), [game, past]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onReplay();
      } else if (e.key === 'Escape') {
        onExit();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onReplay, onExit]);

  async function share() {
    const url = `${window.location.origin}${window.location.pathname}`;
    const lines = [
      `⚡ Pulse Arcade — ${game?.name ?? 'Run'}`,
      `${scoreLabel} ${unitLabel ?? game?.unit ?? ''}${isRecord ? '  🏆 personal best' : ''}`,
      `${title} · Level ${level}`,
      url,
    ];
    if (await copyText(lines.join('\n'))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  }

  return createPortal(
    <>
      {isRecord && <Confetti />}
      <div className="overlay" role="dialog" aria-modal="true" aria-label="Run complete">
        <div className="sheet result">
          <p className="result__verdict">{verdict}</p>
          <div className="result__score num">{scoreLabel}</div>
          <p className="result__unit">{unitLabel ?? game?.unit}</p>

          {isRecord && (
            <div className="result__record">
              <Trophy style={{ width: 14, height: 14 }} />
              New personal best
            </div>
          )}

          {blurb && <p className="result__blurb">{blurb}</p>}

          {cells.length > 0 && (
            <div className="result__grid">
              {cells.map((c) => (
                <div className="result__cell" key={c.label}>
                  <b style={c.tone ? { color: c.tone } : undefined}>{c.value}</b>
                  <span>{c.label}</span>
                </div>
              ))}
            </div>
          )}

          {rank && (
            <div className="standing">
              <div className="standing__text">
                <b>{rank.place}</b>
                <span style={{ color: rank.good ? 'var(--lime)' : 'var(--ink-faint)' }}>
                  {rank.delta}
                </span>
              </div>
              {trend.length >= 3 && (
                <Sparkline values={trend} invert={game?.betterIsLower} width={92} height={30} />
              )}
            </div>
          )}

          {summary?.xpGained > 0 && (
            <p className="result__xp">
              <Spark style={{ width: 15, height: 15 }} />+{summary.xpGained} XP
            </p>
          )}

          <div className="result__actions">
            <button type="button" className="btn btn--ghost" onClick={onExit}>
              <Back />
              Arcade
            </button>
            <button type="button" className="btn btn--primary" onClick={onReplay}>
              <Replay />
              Play again
            </button>
          </div>

          <button
            type="button"
            className="btn btn--ghost btn--block result__share"
            onClick={share}
            data-copied={copied}
          >
            {copied ? <Check /> : <Share />}
            {copied ? 'Copied to clipboard' : 'Share result'}
          </button>
        </div>
      </div>
    </>,
    document.getElementById('modal'),
  );
}
