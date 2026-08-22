/**
 * Tiny synthesised sound engine.
 *
 * Every effect is generated with the Web Audio API at runtime, so the arcade
 * ships with zero audio assets. The AudioContext is created lazily on the first
 * play() call — browsers block it until a user gesture has happened, and by
 * then the player has already clicked something.
 */

let ctx = null;
let master = null;
let enabled = true;

function ensureContext() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function setSoundEnabled(next) {
  enabled = next;
  if (next) ensureContext();
}

/** One shaped oscillator burst. */
function blip({ freq = 440, to = null, dur = 0.12, type = 'sine', gain = 0.5, delay = 0 }) {
  const ac = ensureContext();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const env = ac.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to && to !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);

  // quick attack, exponential tail — reads as "clicky" rather than "beepy"
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  osc.connect(env);
  env.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/** Filtered white noise — used for impacts and misses. */
function noise({ dur = 0.16, gain = 0.35, freq = 1200, q = 1 }) {
  const ac = ensureContext();
  if (!ac) return;
  const t0 = ac.currentTime;
  const frames = Math.floor(ac.sampleRate * dur);
  const buffer = ac.createBuffer(1, frames, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  }

  const src = ac.createBufferSource();
  src.buffer = buffer;

  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value = q;

  const env = ac.createGain();
  env.gain.setValueAtTime(gain, t0);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  src.connect(filter);
  filter.connect(env);
  env.connect(master);
  src.start(t0);
}

const RECIPES = {
  tick: () => blip({ freq: 900, dur: 0.03, type: 'square', gain: 0.12 }),
  click: () => blip({ freq: 620, to: 420, dur: 0.07, type: 'triangle', gain: 0.4 }),
  start: () => {
    blip({ freq: 392, dur: 0.1, type: 'triangle', gain: 0.4 });
    blip({ freq: 587, dur: 0.14, type: 'triangle', gain: 0.4, delay: 0.09 });
  },
  go: () => blip({ freq: 880, to: 1320, dur: 0.14, type: 'square', gain: 0.45 }),
  good: () => {
    blip({ freq: 784, dur: 0.09, type: 'sine', gain: 0.45 });
    blip({ freq: 1175, dur: 0.13, type: 'sine', gain: 0.32, delay: 0.06 });
  },
  great: () => {
    blip({ freq: 784, dur: 0.08, type: 'triangle', gain: 0.4 });
    blip({ freq: 1046, dur: 0.08, type: 'triangle', gain: 0.4, delay: 0.06 });
    blip({ freq: 1568, dur: 0.22, type: 'triangle', gain: 0.34, delay: 0.12 });
  },
  perfect: () => {
    [523, 659, 784, 1046, 1318].forEach((f, i) =>
      blip({ freq: f, dur: 0.3, type: 'sine', gain: 0.3, delay: i * 0.055 }),
    );
  },
  bad: () => {
    blip({ freq: 220, to: 110, dur: 0.24, type: 'sawtooth', gain: 0.3 });
    noise({ dur: 0.14, gain: 0.2, freq: 420 });
  },
  pop: () => {
    blip({ freq: 1200, to: 500, dur: 0.06, type: 'sine', gain: 0.4 });
    noise({ dur: 0.06, gain: 0.16, freq: 2600, q: 2 });
  },
  bomb: () => {
    blip({ freq: 150, to: 45, dur: 0.4, type: 'sawtooth', gain: 0.4 });
    noise({ dur: 0.3, gain: 0.4, freq: 260, q: 0.6 });
  },
  levelup: () => {
    [523, 659, 784, 1046].forEach((f, i) =>
      blip({ freq: f, dur: 0.26, type: 'triangle', gain: 0.3, delay: i * 0.075 }),
    );
  },
  gameover: () => {
    [440, 370, 294, 220].forEach((f, i) =>
      blip({ freq: f, dur: 0.3, type: 'triangle', gain: 0.32, delay: i * 0.13 }),
    );
  },
  unlock: () => {
    blip({ freq: 1046, dur: 0.1, type: 'sine', gain: 0.34 });
    blip({ freq: 1568, dur: 0.28, type: 'sine', gain: 0.28, delay: 0.08 });
  },
};

/** Play a named effect. Unknown names are ignored rather than throwing. */
export function play(name) {
  if (!enabled) return;
  const recipe = RECIPES[name];
  if (!recipe) return;
  try {
    recipe();
  } catch {
    // Audio is a nicety — never let it break gameplay.
  }
}

/** Short haptic buzz on devices that support it. */
export function buzz(pattern = 12) {
  if (!enabled) return;
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* ignore */
    }
  }
}
