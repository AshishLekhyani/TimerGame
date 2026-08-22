import { useArcade } from '../state/ArcadeContext.jsx';
import { Logo, SoundOn, SoundOff, User } from './ui/Icons.jsx';

export default function TopBar({ onHome, onOpenProfile }) {
  const { profile, level, title, progress, into, need, toggleSound } = useArcade();

  return (
    <header className="topbar">
      <div className="wrap topbar__inner">
        <button type="button" className="brand" onClick={onHome} aria-label="Back to the arcade">
          <span className="brand__mark">
            <Logo />
          </span>
          <span className="brand__name">
            Pulse<span>Arcade</span>
          </span>
        </button>

        <span className="topbar__spacer" />

        <button
          type="button"
          className="rankpill"
          onClick={onOpenProfile}
          aria-label={`Profile — level ${level}, ${title}, ${into} of ${need} XP`}
        >
          <span className="rankpill__lvl num">{level}</span>
          <span className="rankpill__meta">
            <span className="rankpill__top">
              <span className="rankpill__title">{title}</span>
              <span className="rankpill__xp num">
                {into}
                <i>/{need}</i>
              </span>
            </span>
            <span className="rankpill__bar">
              <span className="rankpill__fill" style={{ width: `${progress * 100}%` }} />
            </span>
          </span>
        </button>

        <button
          type="button"
          className="iconbtn"
          data-on={profile.sound}
          onClick={toggleSound}
          aria-label={profile.sound ? 'Mute sound' : 'Unmute sound'}
          title={profile.sound ? 'Sound on' : 'Sound off'}
        >
          {profile.sound ? <SoundOn /> : <SoundOff />}
        </button>

        <button
          type="button"
          className="iconbtn"
          onClick={onOpenProfile}
          aria-label="Open profile"
          title="Profile"
        >
          <User />
        </button>
      </div>
    </header>
  );
}
