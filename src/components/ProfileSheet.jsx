import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useArcade } from '../state/ArcadeContext.jsx';
import { GAMES } from '../data/games.js';
import { ACHIEVEMENTS, ACHIEVEMENT_TIERS } from '../data/achievements.js';
import { MEDAL_TIERS, medalFor, medalTally, nextMedalFor, titleFor } from '../data/medals.js';
import Sparkline from './ui/Sparkline.jsx';
import { Close } from './ui/Icons.jsx';
import { formatScore } from '../lib/util.js';

const TABS = [
  { id: 'bests', label: 'Bests' },
  { id: 'medals', label: 'Medals' },
  { id: 'badges', label: 'Badges' },
];

function bestLabel(game, entry) {
  if (!entry || entry.best === null || entry.best === undefined) return null;
  return game.betterIsLower ? `${Math.round(entry.best)}ms` : formatScore(entry.best);
}

export default function ProfileSheet({ onClose }) {
  const { profile, level, title, into, need, progress, setName, resetProgress } = useArcade();
  const [draft, setDraft] = useState(profile.name);
  const [tab, setTab] = useState('bests');
  const [confirmingReset, setConfirmingReset] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const displayName = profile.name || 'Anonymous';
  const initial = displayName.trim().charAt(0).toUpperCase() || '?';
  const medals = useMemo(() => medalTally(profile.scores), [profile.scores]);
  const earnedTitle = useMemo(() => titleFor(profile), [profile]);
  const unlockedCount = profile.unlocked.length;

  function save() {
    setName(draft.trim());
    inputRef.current?.blur();
  }

  return createPortal(
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Player profile"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet sheet--wide">
        <button type="button" className="iconbtn sheet__close" onClick={onClose} aria-label="Close">
          <Close />
        </button>

        <div className="profile__head">
          <div className="profile__avatar" aria-hidden="true">
            {initial}
          </div>
          <div className="profile__id">
            <div className="profile__name">{displayName}</div>
            <div className="profile__rank">
              <span className="profile__badge">{earnedTitle.label}</span>
              Level {level} · {title} · {profile.totalRuns} run{profile.totalRuns === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        <div className="field">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            maxLength={18}
            placeholder="Choose a callsign"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            aria-label="Player name"
          />
          <button
            type="button"
            className="btn"
            onClick={save}
            disabled={draft.trim() === profile.name}
          >
            Save
          </button>
        </div>

        <div className="xpbar">
          <div className="xpbar__meta">
            <span>
              Progress to level <b>{level + 1}</b>
            </span>
            <span className="num">
              {into} / {need} XP
            </span>
          </div>
          <div className="xpbar__track">
            <div className="xpbar__fill" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>

        {/* ---- headline tallies ---- */}
        <div className="trophycase">
          {MEDAL_TIERS.map((t) => (
            <div className="trophycase__cell" key={t.id} style={{ '--medal': t.color }}>
              <span className="trophycase__icon">{t.icon}</span>
              <b className="num">{medals.counts[t.id]}</b>
              <span>{t.label}</span>
            </div>
          ))}
        </div>

        {/* ---- tabs ---- */}
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className="tab"
              data-on={tab === t.id}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.id === 'badges' && (
                <i className="tab__count num">
                  {unlockedCount}/{ACHIEVEMENTS.length}
                </i>
              )}
              {t.id === 'medals' && <i className="tab__count num">{medals.total}/{GAMES.length}</i>}
            </button>
          ))}
        </div>

        {tab === 'bests' && (
          <div className="bestlist">
            {GAMES.map((game) => {
              const entry = profile.scores[game.id];
              const label = bestLabel(game, entry);
              const trend = (profile.history[game.id] ?? []).slice(-12).map((h) => h.s);
              return (
                <div className="bestrow" key={game.id} style={{ '--accent': game.accent }}>
                  <span className="bestrow__dot" style={{ background: game.accent }} />
                  <span className="bestrow__name">{game.name}</span>
                  {trend.length >= 3 && (
                    <Sparkline values={trend} invert={game.betterIsLower} width={54} height={20} showLast={false} />
                  )}
                  <span className="bestrow__plays">{entry?.plays ? `${entry.plays}×` : ''}</span>
                  <span className={`bestrow__val${label ? '' : ' is-empty'}`}>{label ?? '—'}</span>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'medals' && (
          <div className="bestlist">
            {GAMES.map((game) => {
              const entry = profile.scores[game.id];
              const medal = medalFor(game.id, entry?.best);
              const next = nextMedalFor(game.id, entry?.best);
              return (
                <div className="bestrow" key={game.id}>
                  <span
                    className="bestrow__medal"
                    style={{ '--medal': medal?.color ?? 'transparent' }}
                    title={medal ? `${medal.label} medal` : 'No medal yet'}
                  >
                    {medal ? medal.icon : '·'}
                  </span>
                  <span className="bestrow__name">{game.name}</span>
                  <span className="bestrow__next">
                    {next
                      ? `${next.tier.label} at ${formatScore(next.target)}${game.betterIsLower ? 'ms' : ''}`
                      : 'Maxed out'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'badges' && (
          <div className="badgelist">
            {ACHIEVEMENTS.map((a) => {
              const locked = !profile.unlocked.includes(a.id);
              const tier = ACHIEVEMENT_TIERS[a.tier];
              return (
                <div
                  className="badgerow"
                  key={a.id}
                  data-locked={locked}
                  style={{ '--tier': tier.color }}
                >
                  <span className="badgerow__icon">{a.icon}</span>
                  <span className="badgerow__text">
                    <b>{a.title}</b>
                    <span>{a.desc}</span>
                  </span>
                  <span className="badgerow__tier">{locked ? `+${a.xp}` : tier.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {confirmingReset ? (
          <div className="result__actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setConfirmingReset(false)}
            >
              Keep it
            </button>
            <button
              type="button"
              className="btn"
              style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
              onClick={() => {
                resetProgress();
                setConfirmingReset(false);
              }}
            >
              Erase everything
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn--ghost btn--block"
            onClick={() => setConfirmingReset(true)}
          >
            Reset progress
          </button>
        )}
      </div>
    </div>,
    document.getElementById('modal'),
  );
}
