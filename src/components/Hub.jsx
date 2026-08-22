import { useArcade } from '../state/ArcadeContext.jsx';
import { GAMES } from '../data/games.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { medalFor, medalTally, nextMedalFor } from '../data/medals.js';
import { GAME_ICONS, Arrow } from './ui/Icons.jsx';
import { formatScore } from '../lib/util.js';

function GameCard({ game, index, entry, onPlay }) {
  const Icon = GAME_ICONS[game.icon];
  const best =
    entry?.best === null || entry?.best === undefined
      ? null
      : game.betterIsLower
        ? `${Math.round(entry.best)}ms`
        : formatScore(entry.best);
  const medal = medalFor(game.id, entry?.best);
  const next = nextMedalFor(game.id, entry?.best);

  return (
    <button
      type="button"
      className="card"
      onClick={() => onPlay(game.id)}
      style={{
        '--accent': game.accent,
        '--accent-soft': game.accentSoft,
        '--accent-glow': game.accentGlow,
        animationDelay: `${index * 70}ms`,
      }}
    >
      <div className="card__top">
        <span className="card__icon">
          <Icon />
        </span>
        <span className="card__badges">
          {medal && (
            <span className="card__medal" style={{ '--medal': medal.color }} title={`${medal.label} medal`}>
              {medal.icon}
            </span>
          )}
          <span className="card__tag">{game.tag}</span>
        </span>
      </div>

      <h3>{game.name}</h3>
      <p className="card__desc">{game.description}</p>

      <div className="card__foot">
        <span className="card__best">
          <span>{best ? 'Your best' : 'Not played'}</span>
          <b className={best ? '' : 'is-empty'}>{best ?? '—'}</b>
        </span>
        <span className="card__play">
          {next && best ? `${next.tier.label} at ${formatScore(next.target)}` : 'Play'}
          <Arrow />
        </span>
      </div>
    </button>
  );
}

export default function Hub({ onPlay }) {
  const { profile, level, title } = useArcade();

  const played = Object.values(profile.scores).length;
  const medals = medalTally(profile.scores);
  const greeting = profile.name
    ? `Welcome back, ${profile.name}.`
    : `${GAMES.length} games. One question.`;

  return (
    <main className="wrap">
      <section className="hero">
        <span className="hero__eyebrow">
          <span className="hero__dot" />
          {profile.totalRuns > 0 ? `${title} · Level ${level}` : 'No sign-up · Plays offline'}
        </span>
        <h1>
          How sharp
          <br />
          are you <em>really</em>?
        </h1>
        <p>
          {greeting} Reflexes, memory, perception, mental arithmetic and everything you have ever
          read — each one takes a minute, and every single one keeps score.
        </p>

        <div className="hero__stats">
          <span className="hero__stat">
            <b className="num">{GAMES.length}</b>
            <span>Games</span>
          </span>
          <span className="hero__stat">
            <b className="num">{profile.totalRuns}</b>
            <span>Runs played</span>
          </span>
          <span className="hero__stat">
            <b className="num">
              {profile.unlocked.length}
              <span style={{ color: 'var(--ink-faint)', fontSize: '0.7em' }}>
                /{ACHIEVEMENTS.length}
              </span>
            </b>
            <span>Badges</span>
          </span>
          <span className="hero__stat">
            <b className="num">
              {medals.total}
              <span style={{ color: 'var(--ink-faint)', fontSize: '0.7em' }}>/{GAMES.length}</span>
            </b>
            <span>Medals</span>
          </span>
        </div>
      </section>

      <div className="sechead">
        <h2>Choose your game</h2>
        <span className="sechead__rule" />
        <span className="sechead__note">
          {played}/{GAMES.length} tried
        </span>
      </div>

      <div className="cards">
        {GAMES.map((game, i) => (
          <GameCard
            key={game.id}
            game={game}
            index={i}
            entry={profile.scores[game.id]}
            onPlay={onPlay}
          />
        ))}
      </div>
    </main>
  );
}
