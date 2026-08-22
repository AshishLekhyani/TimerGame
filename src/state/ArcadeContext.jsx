import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GAME_BY_ID, levelFromXp, rankTitle } from '../data/games.js';
import { ACHIEVEMENTS, ACHIEVEMENT_TIERS } from '../data/achievements.js';
import { medalFor, medalIndexFor } from '../data/medals.js';
import { clamp, daysBetween, readJSON, todayKey, writeJSON } from '../lib/util.js';
import { play, setSoundEnabled } from '../lib/sound.js';

const STORAGE_KEY = 'pulse-arcade:v1';
/** How many past runs per game we keep for the trend sparklines. */
const HISTORY_CAP = 40;

const DEFAULT_PROFILE = {
  name: '',
  xp: 0,
  totalRuns: 0,
  /** gameId -> { best, plays, last } */
  scores: {},
  /** gameId -> [{ s: score, t: epoch ms }] — newest last */
  history: {},
  unlocked: [],
  sound: true,
  onboarded: false,
  /** Gauntlet: all games back to back. */
  gauntlet: { best: 0, plays: 0, lastBreakdown: null },
  /** Daily Challenge: one seeded attempt per calendar day. */
  daily: { day: null, breakdown: {}, total: 0, complete: false, streak: 0, bestStreak: 0, best: 0 },
};

const ArcadeContext = createContext(null);

/** XP is normalised per game so no single mode is the obvious farm. */
function xpForRun(game, score) {
  if (game.betterIsLower) {
    // Reaction Rush: 600ms → 0xp, 150ms → 450xp
    return clamp(Math.round(600 - score), 15, 450);
  }
  return clamp(Math.round(score / 12), 15, 450);
}

function isBetter(game, score, previous) {
  if (previous === undefined || previous === null) return true;
  return game.betterIsLower ? score < previous : score > previous;
}

/** Merge a stored profile over the defaults so new fields appear on old saves. */
function hydrate(stored) {
  return {
    ...DEFAULT_PROFILE,
    ...stored,
    scores: { ...stored?.scores },
    history: { ...stored?.history },
    unlocked: [...(stored?.unlocked ?? [])],
    gauntlet: { ...DEFAULT_PROFILE.gauntlet, ...stored?.gauntlet },
    daily: { ...DEFAULT_PROFILE.daily, ...stored?.daily },
  };
}

export function ArcadeProvider({ children }) {
  const [profile, setProfile] = useState(() => hydrate(readJSON(STORAGE_KEY, DEFAULT_PROFILE)));
  const [toasts, setToasts] = useState([]);

  // Mutations need the freshest profile synchronously (they return a summary the
  // result screen renders immediately), so mirror state into a ref.
  const profileRef = useRef(profile);
  profileRef.current = profile;

  useEffect(() => {
    writeJSON(STORAGE_KEY, profile);
  }, [profile]);

  useEffect(() => {
    setSoundEnabled(profile.sound);
  }, [profile.sound]);

  const derived = useMemo(() => {
    const { level, into, need } = levelFromXp(profile.xp);
    return { level, into, need, title: rankTitle(level), progress: need ? into / need : 0 };
  }, [profile.xp]);

  const pushToast = useCallback((toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-2), { ...toast, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  /** Announce anything the run unlocked, staggered so toasts do not stack up. */
  const announce = useCallback(
    (levelUp, afterLevel, freshlyUnlocked) => {
      if (levelUp) {
        play('levelup');
        pushToast({
          icon: '🏅',
          kicker: 'Level up',
          title: `Level ${afterLevel} — ${rankTitle(afterLevel)}`,
          desc: 'Your rank just went up.',
        });
      }
      freshlyUnlocked.forEach((a, i) => {
        setTimeout(
          () => {
            play('unlock');
            pushToast({
              icon: a.icon,
              kicker: `${ACHIEVEMENT_TIERS[a.tier]?.label ?? 'Achievement'} · +${a.xp} XP`,
              title: a.title,
              desc: a.desc,
              tone: ACHIEVEMENT_TIERS[a.tier]?.color,
            });
          },
          (levelUp ? 700 : 0) + i * 550,
        );
      });
    },
    [pushToast],
  );

  /** Shared tail for every scoring path: grant XP, check achievements, commit. */
  const commit = useCallback(
    (next, xpGained, runInfo) => {
      const beforeLevel = levelFromXp(profileRef.current.xp).level;
      const committed = { ...next, xp: next.xp + xpGained };
      const afterLevel = levelFromXp(committed.xp).level;

      const snapshot = { ...committed, level: afterLevel };
      const freshlyUnlocked = ACHIEVEMENTS.filter(
        (a) => !committed.unlocked.includes(a.id) && a.test(runInfo, snapshot),
      );
      if (freshlyUnlocked.length) {
        committed.unlocked = [...committed.unlocked, ...freshlyUnlocked.map((a) => a.id)];
        // Unlocking pays out on top of the run's own XP.
        committed.xp += freshlyUnlocked.reduce((sum, a) => sum + (a.xp ?? 0), 0);
      }

      profileRef.current = committed;
      setProfile(committed);

      const levelUp = afterLevel > beforeLevel;
      announce(levelUp, afterLevel, freshlyUnlocked);
      return { levelUp, afterLevel, unlocked: freshlyUnlocked };
    },
    [announce],
  );

  /**
   * Commit a finished single-game run. Returns a summary for the result screen.
   */
  const recordRun = useCallback(
    (gameId, score, stats = {}) => {
      const game = GAME_BY_ID[gameId];
      if (!game) return { isRecord: false, xpGained: 0, previousBest: null, levelUp: false };

      const current = profileRef.current;
      const entry = current.scores[gameId];
      const previousBest = entry?.best ?? null;
      const isRecord = isBetter(game, score, previousBest);
      const xpGained = xpForRun(game, score) + (isRecord && entry ? 120 : 0);

      const past = current.history[gameId] ?? [];
      const next = {
        ...current,
        totalRuns: current.totalRuns + 1,
        scores: {
          ...current.scores,
          [gameId]: {
            best: isRecord ? score : previousBest,
            plays: (entry?.plays ?? 0) + 1,
            last: score,
          },
        },
        history: {
          ...current.history,
          [gameId]: [...past, { s: score, t: Date.now() }].slice(-HISTORY_CAP),
        },
      };

      // A medal upgrade is worth calling out on its own.
      const beforeMedal = medalIndexFor(gameId, previousBest);
      const afterMedal = medalIndexFor(gameId, isRecord ? score : previousBest);
      const newMedal = afterMedal > beforeMedal ? medalFor(gameId, score) : null;

      const { levelUp, unlocked } = commit(next, xpGained, { gameId, score, stats });

      if (newMedal) {
        setTimeout(() => {
          play('levelup');
          pushToast({
            icon: newMedal.icon,
            kicker: `${newMedal.label} medal`,
            title: `${game.name}`,
            desc: `You just moved up a medal tier.`,
            tone: newMedal.color,
          });
        }, 320);
      }

      return { isRecord, xpGained, previousBest, levelUp, unlocked, medal: newMedal };
    },
    [commit, pushToast],
  );

  /** Commit a Gauntlet run (all games, one combined score). */
  const recordGauntlet = useCallback(
    (total, breakdown) => {
      const current = profileRef.current;
      const previousBest = current.gauntlet.best || null;
      const isRecord = total > (previousBest ?? -1);
      const xpGained = clamp(Math.round(total / 14), 40, 700);

      const next = {
        ...current,
        gauntlet: {
          best: Math.max(total, current.gauntlet.best ?? 0),
          plays: (current.gauntlet.plays ?? 0) + 1,
          lastBreakdown: breakdown,
        },
      };

      const { levelUp, unlocked } = commit(next, xpGained, {
        gameId: 'gauntlet',
        score: total,
        stats: { breakdown },
      });
      return { isRecord, xpGained, previousBest, levelUp, unlocked };
    },
    [commit],
  );

  /** Record one leg of today's Daily Challenge. */
  const recordDailyLeg = useCallback((day, gameId, score) => {
    setProfile((p) => {
      const daily = p.daily.day === day ? p.daily : { ...DEFAULT_PROFILE.daily, day, streak: p.daily.streak, bestStreak: p.daily.bestStreak, best: p.daily.best };
      const updated = {
        ...p,
        daily: { ...daily, day, breakdown: { ...daily.breakdown, [gameId]: score } },
      };
      profileRef.current = updated;
      return updated;
    });
  }, []);

  /** Seal today's Daily Challenge and roll the streak forward. */
  const completeDaily = useCallback(
    (day, total, breakdown) => {
      const current = profileRef.current;
      const alreadyDone = current.daily.day === day && current.daily.complete;
      if (alreadyDone) return { isRecord: false, xpGained: 0, streak: current.daily.streak };

      const gap = current.daily.day && current.daily.complete ? daysBetween(current.daily.day, day) : null;
      const streak = gap === 1 ? (current.daily.streak ?? 0) + 1 : 1;
      const isRecord = total > (current.daily.best ?? 0);
      const xpGained = clamp(Math.round(total / 12), 60, 800) + streak * 20;

      const next = {
        ...current,
        daily: {
          day,
          breakdown,
          total,
          complete: true,
          streak,
          bestStreak: Math.max(streak, current.daily.bestStreak ?? 0),
          best: Math.max(total, current.daily.best ?? 0),
        },
      };

      const { levelUp, unlocked } = commit(next, xpGained, {
        gameId: 'daily',
        score: total,
        stats: { streak, breakdown },
      });
      return { isRecord, xpGained, streak, levelUp, unlocked, previousBest: current.daily.best || null };
    },
    [commit],
  );

  const setName = useCallback((name) => {
    setProfile((p) => ({ ...p, name: name.slice(0, 18), onboarded: true }));
  }, []);

  const dismissOnboarding = useCallback(() => {
    setProfile((p) => ({ ...p, onboarded: true }));
  }, []);

  const toggleSound = useCallback(() => {
    const sound = !profileRef.current.sound;
    setSoundEnabled(sound);
    if (sound) play('click');
    setProfile((p) => ({ ...p, sound }));
  }, []);

  const resetProgress = useCallback(() => {
    const fresh = {
      ...DEFAULT_PROFILE,
      name: profileRef.current.name,
      sound: profileRef.current.sound,
      onboarded: true,
    };
    profileRef.current = fresh;
    setProfile(fresh);
  }, []);

  /** Today's daily state, with stale days treated as "not started". */
  const daily = useMemo(() => {
    const day = todayKey();
    const stored = profile.daily;
    if (stored.day !== day) {
      return { day, breakdown: {}, total: 0, complete: false, streak: stored.streak ?? 0, bestStreak: stored.bestStreak ?? 0, best: stored.best ?? 0 };
    }
    return { ...stored, day };
  }, [profile.daily]);

  const value = useMemo(
    () => ({
      profile,
      ...derived,
      daily,
      toasts,
      recordRun,
      recordGauntlet,
      recordDailyLeg,
      completeDaily,
      setName,
      dismissOnboarding,
      toggleSound,
      resetProgress,
      pushToast,
    }),
    [
      profile,
      derived,
      daily,
      toasts,
      recordRun,
      recordGauntlet,
      recordDailyLeg,
      completeDaily,
      setName,
      dismissOnboarding,
      toggleSound,
      resetProgress,
      pushToast,
    ],
  );

  return <ArcadeContext.Provider value={value}>{children}</ArcadeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useArcade() {
  const ctx = useContext(ArcadeContext);
  if (!ctx) throw new Error('useArcade must be used inside <ArcadeProvider>');
  return ctx;
}
