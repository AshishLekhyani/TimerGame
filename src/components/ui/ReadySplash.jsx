import { GAME_ICONS, Play } from './Icons.jsx';

/** The "here are the rules, press start" panel every game opens with. */
export default function ReadySplash({ game, onStart, cta = 'Start' }) {
  const Icon = GAME_ICONS[game.icon];

  return (
    <div className="ready">
      <span className="ready__icon">
        <Icon />
      </span>
      <h2>{game.tagline}</h2>

      <div className="ready__rules">
        {game.rules.map((rule, i) => (
          <p className="ready__rule" key={rule}>
            <i>{i + 1}</i>
            {rule}
          </p>
        ))}
      </div>

      <button type="button" className="btn btn--primary btn--lg" onClick={onStart}>
        <Play />
        {cta}
      </button>
      <p className="stage__label">
        or press <span className="kbd">Space</span>
      </p>
    </div>
  );
}
