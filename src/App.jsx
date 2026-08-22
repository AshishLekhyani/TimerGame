import { useCallback, useEffect, useState } from 'react';
import Backdrop from './components/Backdrop.jsx';
import TopBar from './components/TopBar.jsx';
import Hub from './components/Hub.jsx';
import ProfileSheet from './components/ProfileSheet.jsx';
import Toasts from './components/ui/Toasts.jsx';
import { ArcadeProvider } from './state/ArcadeContext.jsx';
import { GAME_BY_ID, GAMES } from './data/games.js';

import BlindCountdown from './components/games/BlindCountdown.jsx';
import ReactionRush from './components/games/ReactionRush.jsx';
import ChromaClash from './components/games/ChromaClash.jsx';
import MemoryMatrix from './components/games/MemoryMatrix.jsx';
import BullseyeBlitz from './components/games/BullseyeBlitz.jsx';
import Polymath from './components/games/Polymath.jsx';
import NumberChase from './components/games/NumberChase.jsx';
import ShadeShift from './components/games/ShadeShift.jsx';
import RapidFire from './components/games/RapidFire.jsx';
import CipherLock from './components/games/CipherLock.jsx';
import LogicChain from './components/games/LogicChain.jsx';
import Echo from './components/games/Echo.jsx';
import VectorRun from './components/games/VectorRun.jsx';
import Trapdoor from './components/games/Trapdoor.jsx';
import PulseLock from './components/games/PulseLock.jsx';
import Trigger from './components/games/Trigger.jsx';
import Verdict from './components/games/Verdict.jsx';

const SCREENS = {
  countdown: BlindCountdown,
  reaction: ReactionRush,
  chroma: ChromaClash,
  matrix: MemoryMatrix,
  blitz: BullseyeBlitz,
  polymath: Polymath,
  chase: NumberChase,
  shade: ShadeShift,
  rapid: RapidFire,
  cipher: CipherLock,
  chain: LogicChain,
  echo: Echo,
  run: VectorRun,
  trapdoor: Trapdoor,
  lock: PulseLock,
  trigger: Trigger,
  verdict: Verdict,
};

/** Hash routing keeps the browser back button working, with no router dep. */
function readHash() {
  const match = window.location.hash.match(/^#\/play\/([\w-]+)$/);
  return match && SCREENS[match[1]] ? match[1] : null;
}

function Arcade() {
  const [gameId, setGameId] = useState(readHash);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const sync = () => setGameId(readHash());
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  // Tint the whole page — backdrop orbs and all — with the active game's accent.
  useEffect(() => {
    const game = gameId ? GAME_BY_ID[gameId] : null;
    const root = document.documentElement.style;
    root.setProperty('--accent', game?.accent ?? '#22e3d6');
    root.setProperty('--accent-soft', game?.accentSoft ?? 'rgba(34, 227, 214, 0.14)');
    root.setProperty('--accent-glow', game?.accentGlow ?? 'rgba(34, 227, 214, 0.42)');
    document.title = game ? `${game.name} — Pulse Arcade` : 'Pulse Arcade — Test Your Reflexes';
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [gameId]);

  const openGame = useCallback((id) => {
    window.location.hash = `#/play/${id}`;
  }, []);

  const goHome = useCallback(() => {
    if (readHash()) window.history.back();
    else window.location.hash = '';
  }, []);

  const Screen = gameId ? SCREENS[gameId] : null;

  return (
    <div className="shell">
      <Backdrop />
      <TopBar onHome={goHome} onOpenProfile={() => setProfileOpen(true)} />

      {Screen ? (
        <Screen key={gameId} game={GAME_BY_ID[gameId]} onExit={goHome} />
      ) : (
        <Hub onPlay={openGame} />
      )}

      <footer className="wrap foot">
        <span>
          {GAMES.length} games · everything saves to this browser, nothing leaves it.
        </span>
        <span>
          Built with React ·{' '}
          <a href="https://github.com/AshishLekhyani" target="_blank" rel="noreferrer">
            Ashish Lekhyani
          </a>
        </span>
      </footer>

      {profileOpen && <ProfileSheet onClose={() => setProfileOpen(false)} />}
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <ArcadeProvider>
      <Arcade />
    </ArcadeProvider>
  );
}
