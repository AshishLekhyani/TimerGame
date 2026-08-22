/** Small shared helpers used across the arcade. */

/* ------------------------------------------------------------------
   Random source
   ------------------------------------------------------------------
   Games call the helpers below rather than Math.random directly, so the
   Daily Challenge can swap in a seeded generator and hand every player the
   exact same run. Only one game is ever live at a time, so a module-level
   source is safe — DailyRunner sets it on mount and restores it on unmount.
   ------------------------------------------------------------------ */

let randomSource = Math.random;

/** Swap the random source. Pass nothing to restore Math.random. */
export function setRandomSource(fn) {
  randomSource = typeof fn === 'function' ? fn : Math.random;
}

export const rnd = () => randomSource();

/**
 * mulberry32 — a tiny, fast, well-distributed seeded PRNG.
 * Same seed always produces the same sequence.
 */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable 32-bit hash of a string — turns "2026-08-21" into a seed. */
export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* ------------------------------------------------------------------
   Maths + collections
   ------------------------------------------------------------------ */

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

export const randInt = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

export const randFloat = (lo, hi) => lo + rnd() * (hi - lo);

export const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

/** Fisher–Yates, returns a new array. */
export function shuffle(input) {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** n distinct integers from [0, max). */
export function sampleIndices(max, n) {
  return shuffle(Array.from({ length: max }, (_, i) => i)).slice(0, n);
}

export const sum = (arr) => arr.reduce((a, b) => a + b, 0);

export const mean = (arr) => (arr.length ? sum(arr) / arr.length : 0);

/* ------------------------------------------------------------------
   Formatting
   ------------------------------------------------------------------ */

export const formatMs = (ms) => `${Math.round(ms)}ms`;

export const formatSeconds = (ms, digits = 2) => `${(ms / 1000).toFixed(digits)}s`;

export const formatScore = (n) => Math.round(n).toLocaleString('en-US');

/** Local calendar day as YYYY-MM-DD — the Daily Challenge's identity. */
export function todayKey(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Whole days between two YYYY-MM-DD keys. */
export function daysBetween(aKey, bKey) {
  const a = new Date(`${aKey}T00:00:00`);
  const b = new Date(`${bKey}T00:00:00`);
  return Math.round((b - a) / 86400000);
}

/* ------------------------------------------------------------------
   Storage
   ------------------------------------------------------------------ */

export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private-mode / quota failures are non-fatal: play continues, nothing saves.
  }
}

/** Copy text to the clipboard, falling back to a hidden textarea. */
export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
