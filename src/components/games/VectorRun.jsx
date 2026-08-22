import { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame from '../GameFrame.jsx';
import ReadySplash from '../ui/ReadySplash.jsx';
import ResultCard from '../ui/ResultCard.jsx';
import { FREE_SESSION, useGameRun } from '../../lib/useGameRun.js';
import { formatScore } from '../../lib/util.js';
import { play, buzz } from '../../lib/sound.js';
import { PALETTE, RUN_A, RUN_B, RUN_DUCK, RUN_JUMP, drawSprite } from '../../lib/pixel.js';

/**
 * Vector Run — a 16-bit endless runner.
 *
 * The world is a low-resolution pixel grid scaled up by a whole-number factor
 * with smoothing off, and it sizes itself to whatever stage it is given, so the
 * runner is a big chunky sprite on a phone as well as a desktop. Physics run on
 * a fixed timestep so the feel is identical at any frame rate.
 */

// --- world (low-res pixels) ----------------------------------------------
/** Design height. The world's *width* is derived from the canvas each frame so
 *  the game fills any stage, and the pixel scale is chosen to keep the runner
 *  big enough to see on a phone while still leaving room to react. */
const BASE_H = 92;
/** Never show less than this much world width, or obstacles arrive unfairly. */
const MIN_W = 128;
const GROUND_H = 14;
const RUN_X = 30;
const BODY_W = 12;
const BODY_H = 16;
const DUCK_H = 10;

const GRAVITY = 620;
const JUMP_V = 205;
const COYOTE = 0.09;
const STEP = 1 / 120;

const START_SPEED = 62;
const speedAt = (metres) => Math.min(150, START_SPEED + metres * 0.05);
const FLIP_EVERY = 420;

const KINDS = {
  spike: { w: 10, h: 12, lift: 0 },
  block: { w: 14, h: 17, lift: 0 },
  bar: { w: 22, h: 8, lift: 15 }, // floats at head height: duck under it
  tower: { w: 9, h: 24, lift: 0 },
};

export default function VectorRun({ game, onExit, session = FREE_SESSION }) {
  const { finish, rearm, result } = useGameRun(game, session);

  const [phase, setPhase] = useState('ready');
  const [hud, setHud] = useState({ distance: 0, pulses: 0, multiplier: 1 });

  const canvasRef = useRef(null);
  const world = useRef(null);
  const raf = useRef(0);
  const finishRef = useRef(finish);
  finishRef.current = finish;

  const makeWorld = () => ({
    t: 0,
    metres: 0,
    speed: START_SPEED,
    y: 0,
    vy: 0,
    grounded: true,
    leftGroundAt: -1,
    ducking: false,
    flipped: false,
    nextFlip: FLIP_EVERY,
    flash: 0,
    obstacles: [],
    pulses: [],
    debris: [],
    // Sized against the design height; repositioned once the canvas is measured.
    vw: 220,
    vh: BASE_H,
    stars: Array.from({ length: 26 }, () => ({
      x: Math.random() * 220,
      y: 6 + Math.random() * (BASE_H - GROUND_H * 2 - 14),
      z: 0.3 + Math.random() * 0.7,
    })),
    towers: Array.from({ length: 14 }, (_, i) => ({
      x: i * 22 + Math.random() * 10,
      h: 10 + Math.random() * 20,
      w: 10 + Math.random() * 10,
    })),
    nextObstacle: 170,
    nextPulse: 70,
    collected: 0,
    combo: 0,
    multiplier: 1,
    dead: false,
    shake: 0,
  });

  // ---------------------------------------------------------------- input
  const jump = useCallback(() => {
    const w = world.current;
    if (!w || w.dead) return;
    if (!w.grounded && w.t - w.leftGroundAt > COYOTE) return;
    w.vy = JUMP_V;
    w.grounded = false;
    w.ducking = false;
    play('click');
    buzz(6);
  }, []);

  const duck = useCallback((on) => {
    const w = world.current;
    if (!w || w.dead) return;
    w.ducking = on;
    if (on && !w.grounded) w.vy = Math.min(w.vy, -80);
  }, []);

  // ---------------------------------------------------------------- loop
  useEffect(() => {
    if (phase !== 'playing') return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let last = performance.now();
    let acc = 0;

    const tick = (now) => {
      const w = world.current;
      if (!w) return;
      acc += Math.min(0.1, (now - last) / 1000);
      last = now;
      // One free measure before the first physics step so spawns land off-screen.
      if (!w.measured) {
        const first = measure(canvas);
        if (!first) {
          raf.current = requestAnimationFrame(tick);
          return;
        }
        w.vw = first.worldW;
        w.vh = first.worldH;
        w.measured = true;
        for (const s of w.stars) {
          s.x = Math.random() * w.vw;
          s.y = 6 + Math.random() * Math.max(16, w.vh - GROUND_H * 2 - 14);
        }
        w.towers.forEach((t, i) => {
          t.x = (i * w.vw) / w.towers.length + Math.random() * 10;
        });
      }
      while (acc >= STEP) {
        step(w, STEP);
        acc -= STEP;
      }

      // Measure first: the world's dimensions depend on the canvas, and the
      // simulation needs them before it can spawn or cull anything.
      const view = measure(canvas);
      if (view) {
        w.vw = view.worldW;
        w.vh = view.worldH;
        render(view.ctx, w);
      }

      setHud({ distance: Math.floor(w.metres), pulses: w.collected, multiplier: w.multiplier });
      if (w.dead) {
        setPhase('done');
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };

    // Paint immediately rather than waiting for the first animation frame —
    // otherwise there is a visible beat where the canvas is blank.
    const first = measure(canvas);
    if (first && world.current) {
      world.current.vw = first.worldW;
      world.current.vh = first.worldH;
      world.current.measured = true;
      for (const s of world.current.stars) {
        s.x = Math.random() * world.current.vw;
        s.y = 6 + Math.random() * Math.max(16, world.current.vh - GROUND_H * 2 - 14);
      }
      world.current.towers.forEach((t, i) => {
        t.x = (i * world.current.vw) / world.current.towers.length + Math.random() * 10;
      });
      render(first.ctx, world.current);
    }

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [phase]);

  const begin = useCallback(() => {
    play('start');
    rearm();
    world.current = makeWorld();
    setHud({ distance: 0, pulses: 0, multiplier: 1 });
    setPhase('playing');
  }, [rearm]);

  // ---------------------------------------------------------------- keys
  useEffect(() => {
    const isJump = (e) => e.code === 'Space' || e.key === 'ArrowUp' || e.key.toLowerCase() === 'w';
    const isDuck = (e) => e.key === 'ArrowDown' || e.key.toLowerCase() === 's';
    function down(e) {
      if (phase === 'ready' && (e.code === 'Space' || e.key === 'Enter')) {
        e.preventDefault();
        begin();
        return;
      }
      if (phase !== 'playing') return;
      if (isJump(e)) {
        e.preventDefault();
        jump();
      } else if (isDuck(e)) {
        e.preventDefault();
        duck(true);
      }
    }
    function up(e) {
      if (isDuck(e)) duck(false);
    }
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [phase, begin, jump, duck]);

  // ---------------------------------------------------------------- commit
  useEffect(() => {
    if (phase !== 'done') return;
    const score = Math.round(hud.distance + hud.pulses * 45);
    const flips = Math.floor(hud.distance / FLIP_EVERY);
    finishRef.current({
      score,
      stats: { distance: hud.distance, pulses: hud.pulses, flips },
      scoreLabel: formatScore(score),
      unitLabel: 'points',
      verdict:
        hud.distance >= 2000
          ? 'You live on the ceiling now'
          : hud.distance >= 1200
            ? 'Serious distance'
            : hud.distance >= 600
              ? 'Getting the rhythm'
              : 'The first flip gets everyone',
      blurb:
        flips === 0
          ? `You did not reach the first flip gate at ${FLIP_EVERY}m — that is where gravity inverts and you carry on upside down.`
          : `${hud.distance} metres through ${flips} flip gate${flips === 1 ? '' : 's'}.`,
      cells: [
        { label: 'Distance', value: `${hud.distance}m`, tone: 'var(--accent)' },
        { label: 'Pulses', value: hud.pulses },
        { label: 'Flips', value: flips },
      ],
    });
  }, [phase, hud]);

  // ---------------------------------------------------------------- touch
  const onPointer = useCallback(
    (e) => {
      if (phase !== 'playing') return;
      const rect = e.currentTarget.getBoundingClientRect();
      const rel = (e.clientY - rect.top) / rect.height;
      const duckZone = world.current?.flipped ? rel < 0.35 : rel > 0.65;
      if (duckZone) {
        duck(true);
        setTimeout(() => duck(false), 430);
      } else {
        jump();
      }
    },
    [phase, jump, duck],
  );

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      session={session}
      running={phase === 'playing'}
      liveScore={`${hud.distance}m`}
      liveLabel="Distance"
    >
      <section className="stage" style={{ padding: phase === 'playing' ? 0 : undefined }}>
        {phase === 'ready' && <ReadySplash game={game} onStart={begin} cta="Run" />}

        {phase === 'playing' && (
          <div className="runwrap" onPointerDown={onPointer}>
            <canvas ref={canvasRef} className="runcanvas" />
            <div className="runhud">
              <span className="runhud__dist num">{hud.distance}m</span>
              {hud.multiplier > 1 && (
                <span className="runhud__mult num" key={hud.multiplier}>
                  ×{hud.multiplier}
                </span>
              )}
            </div>
            <p className="runhint">
              tap top to jump · tap bottom to duck · <span className="kbd">Space</span>{' '}
              <span className="kbd">↓</span>
            </p>
          </div>
        )}
      </section>

      {result && <ResultCard {...result} gameId={game.id} onReplay={begin} onExit={onExit} />}
    </GameFrame>
  );
}

/* ============================================================
   Viewport
   ============================================================ */

/**
 * Size the pixel grid to the canvas.
 *
 * The scale is the largest whole number that both keeps the runner big and
 * still shows at least MIN_W of world width — on a phone that lands around
 * 5x (a 40px-tall runner with ~2 seconds of reaction time), on a desktop
 * around 10x.
 */
function measure(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  // Before layout settles the element can report zero — drawing into a 1x1
  // buffer then would blank the canvas, so skip the frame instead.
  if (rect.width < 8 || rect.height < 8) return null;
  const pixelW = Math.max(1, Math.round(rect.width * dpr));
  const pixelH = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== pixelW || canvas.height !== pixelH) {
    canvas.width = pixelW;
    canvas.height = pixelH;
  }

  const scale = Math.max(1, Math.min(Math.floor(pixelH / BASE_H), Math.floor(pixelW / MIN_W)));
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  return {
    ctx,
    scale,
    worldW: Math.ceil(pixelW / scale),
    worldH: Math.ceil(pixelH / scale),
  };
}

/* ============================================================
   Simulation
   ============================================================ */

function step(w, dt) {
  w.t += dt;
  w.speed = speedAt(w.metres);
  w.metres += w.speed * dt * 0.42;
  if (w.shake > 0) w.shake = Math.max(0, w.shake - dt * 4);
  if (w.flash > 0) w.flash = Math.max(0, w.flash - dt * 1.8);

  w.vy -= GRAVITY * dt;
  w.y += w.vy * dt;
  if (w.y <= 0) {
    w.y = 0;
    w.vy = 0;
    w.grounded = true;
  } else if (w.grounded) {
    w.grounded = false;
    w.leftGroundAt = w.t;
  }

  if (w.metres >= w.nextFlip) {
    w.flipped = !w.flipped;
    w.nextFlip += FLIP_EVERY;
    w.flash = 1;
    w.y = 0;
    w.vy = 0;
    w.grounded = true;
    play('go');
    buzz([14, 40, 14]);
  }

  const dx = w.speed * dt;

  w.nextObstacle -= dx;
  if (w.nextObstacle <= 0) {
    spawn(w);
    w.nextObstacle = 62 + w.speed * 0.42 + Math.random() * 46;
  }

  w.nextPulse -= dx;
  if (w.nextPulse <= 0) {
    w.pulses.push({ x: w.vw + 10, y: Math.random() < 0.5 ? 6 : 26 + Math.random() * 12 });
    w.nextPulse = 90 + Math.random() * 130;
  }

  for (const o of w.obstacles) o.x -= dx;
  for (const p of w.pulses) p.x -= dx;
  for (const s of w.stars) {
    s.x -= dx * 0.12 * s.z;
    if (s.x < 0) s.x += w.vw;
  }
  for (const t of w.towers) {
    t.x -= dx * 0.3;
    if (t.x + t.w < 0) {
      t.x += w.vw + 40;
      t.h = 10 + Math.random() * 20;
    }
  }
  w.obstacles = w.obstacles.filter((o) => o.x + o.w > -16);
  w.pulses = w.pulses.filter((p) => p.x > -16 && !p.taken);

  for (const d of w.debris) {
    d.x += d.vx * dt - dx;
    d.y += d.vy * dt;
    d.vy -= 260 * dt;
    d.life -= dt;
  }
  w.debris = w.debris.filter((d) => d.life > 0);

  const body = bodyBox(w);
  for (const o of w.obstacles) {
    if (hits(body, boxOf(w, o))) {
      w.dead = true;
      w.shake = 1;
      play('bomb');
      buzz([40, 60, 40]);
      for (let i = 0; i < 16; i += 1) {
        w.debris.push({
          x: body.x + body.w / 2,
          y: body.y + body.h / 2,
          vx: (Math.random() - 0.5) * 120,
          vy: Math.random() * 120,
          life: 0.55,
        });
      }
      return;
    }
  }

  for (const p of w.pulses) {
    if (p.taken) continue;
    const py = surface(w, p.y);
    if (hits(body, { x: p.x - 3, y: py - 3, w: 6, h: 6 })) {
      p.taken = true;
      w.collected += 1;
      w.combo += 1;
      w.multiplier = Math.min(5, 1 + Math.floor(w.combo / 4));
      play('pop');
      buzz(5);
    }
  }
}

function spawn(w) {
  const r = Math.random();
  let kind;
  if (w.metres < 90) kind = 'spike';
  else if (r < 0.34) kind = 'spike';
  else if (r < 0.6) kind = 'block';
  else if (r < 0.85) kind = 'bar';
  else kind = 'tower';
  const spec = KINDS[kind];
  w.obstacles.push({ kind, x: w.vw + 12, w: spec.w, h: spec.h, lift: spec.lift });
}

/** Height above the running surface → canvas y. */
const surface = (w, height) => (w.flipped ? GROUND_H + height : w.vh - GROUND_H - height);

function bodyBox(w) {
  const h = w.ducking && w.grounded ? DUCK_H : BODY_H;
  const base = surface(w, w.y);
  return { x: RUN_X, y: w.flipped ? base : base - h, w: BODY_W, h };
}

function boxOf(w, o) {
  const base = surface(w, o.lift + o.h);
  return { x: o.x, y: w.flipped ? base - o.h : base, w: o.w, h: o.h };
}

const hits = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/* ============================================================
   Rendering — everything is fillRect on a 220x124 grid
   ============================================================ */

const SKY_TOP = '#160f2e';
const SKY_BOTTOM = '#3b1c4a';
const CITY = '#241748';
const CITY_LIT = '#f2c14e';
const GROUND_FACE = '#2f2352';
const GROUND_TOP = '#7b5cff';
const GROUND_DEEP = '#181030';
const HAZARD = '#ff3d6e';
const BLOCKS = '#8be9fd';

function render(ctx, w) {
  ctx.clearRect(0, 0, w.vw, w.vh);
  const shakeX = w.shake > 0 ? Math.round((Math.random() - 0.5) * 4 * w.shake) : 0;
  const shakeY = w.shake > 0 ? Math.round((Math.random() - 0.5) * 4 * w.shake) : 0;
  ctx.translate(shakeX, shakeY);

  // --- sky, as flat bands (no gradients: this is 16-bit) ---
  const bands = 8;
  for (let i = 0; i < bands; i += 1) {
    ctx.fillStyle = i < bands / 2 ? SKY_TOP : SKY_BOTTOM;
    ctx.fillRect(0, Math.floor((i * w.vh) / bands), w.vw, Math.ceil(w.vh / bands) + 1);
  }

  for (const s of w.stars) {
    ctx.fillStyle = s.z > 0.7 ? '#ffffff' : '#9d8cc4';
    ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1);
  }

  // --- parallax skyline ---
  for (const t of w.towers) {
    const x = Math.round(t.x);
    const tw = Math.round(t.w);
    const th = Math.round(t.h);
    const y = w.vh - GROUND_H - th;
    ctx.fillStyle = CITY;
    ctx.fillRect(x, y, tw, th);
    ctx.fillStyle = CITY_LIT;
    for (let wy = y + 3; wy < w.vh - GROUND_H - 3; wy += 5) {
      for (let wx = x + 2; wx < x + tw - 2; wx += 4) {
        if ((wx * 7 + wy * 13) % 5 === 0) ctx.fillRect(wx, wy, 1, 2);
      }
    }
  }

  // --- ground and ceiling bands ---
  const band = (y, active) => {
    ctx.fillStyle = GROUND_FACE;
    ctx.fillRect(0, y, w.vw, GROUND_H);
    ctx.fillStyle = GROUND_DEEP;
    const offset = Math.floor(w.metres * 2) % 8;
    for (let x = 0; x < w.vw; x += 8) {
      ctx.fillRect((x - offset + w.vw) % w.vw, y + 4, 1, GROUND_H - 4);
    }
    ctx.fillStyle = active ? GROUND_TOP : '#3d3168';
    // The lit edge is the surface you are actually running on.
    ctx.fillRect(0, y === 0 ? y + GROUND_H - 2 : y, w.vw, 2);
  };
  band(w.vh - GROUND_H, !w.flipped);
  band(0, w.flipped);

  // --- flip gate ---
  const toGate = w.nextFlip - w.metres;
  if (toGate < 26) {
    const gx = Math.round(RUN_X + toGate * 7);
    ctx.fillStyle = HAZARD;
    for (let y = GROUND_H; y < w.vh - GROUND_H; y += 6) ctx.fillRect(gx, y, 2, 4);
    ctx.fillRect(gx - 6, Math.floor(w.vh / 2) - 1, 14, 2);
  }

  // --- pulses ---
  for (const p of w.pulses) {
    const px = Math.round(p.x);
    const py = Math.round(surface(w, p.y));
    ctx.fillStyle = '#ffe066';
    ctx.fillRect(px - 2, py - 1, 5, 3);
    ctx.fillRect(px - 1, py - 2, 3, 5);
    ctx.fillStyle = '#fff8d0';
    ctx.fillRect(px - 1, py - 1, 2, 2);
  }

  // --- obstacles ---
  for (const o of w.obstacles) {
    const b = boxOf(w, o);
    const x = Math.round(b.x);
    const y = Math.round(b.y);
    if (o.kind === 'spike') {
      ctx.fillStyle = HAZARD;
      for (let i = 0; i < b.h; i += 1) {
        const inset = Math.floor((i * (b.w / 2)) / b.h);
        const row = w.flipped ? y + b.h - 1 - i : y + i;
        ctx.fillRect(x + inset, row, b.w - inset * 2, 1);
      }
      ctx.fillStyle = '#ff8fa8';
      ctx.fillRect(x + Math.floor(b.w / 2), w.flipped ? y : y + 1, 1, b.h - 1);
    } else if (o.kind === 'bar') {
      ctx.fillStyle = HAZARD;
      ctx.fillRect(x, y, b.w, b.h);
      ctx.fillStyle = '#ffd0da';
      ctx.fillRect(x, y, b.w, 1);
      ctx.fillStyle = '#8c1030';
      ctx.fillRect(x, y + b.h - 1, b.w, 1);
    } else {
      ctx.fillStyle = BLOCKS;
      ctx.fillRect(x, y, b.w, b.h);
      ctx.fillStyle = '#d7fbff';
      ctx.fillRect(x, y, b.w, 1);
      ctx.fillStyle = '#2b6f7d';
      ctx.fillRect(x, y + b.h - 1, b.w, 1);
      ctx.fillRect(x + b.w - 1, y, 1, b.h);
    }
  }

  // --- runner ---
  const frame = !w.grounded
    ? RUN_JUMP
    : w.ducking
      ? RUN_DUCK
      : Math.floor(w.t * 11) % 2
        ? RUN_A
        : RUN_B;
  // Every frame is a 16-row sprite whose feet sit on the last drawn row, so
  // anchor to the full body height even while ducking.
  const drawY = w.flipped
    ? Math.round(surface(w, w.y))
    : Math.round(surface(w, w.y)) - BODY_H;
  drawSprite(ctx, frame, PALETTE, RUN_X, drawY);

  // --- debris ---
  ctx.fillStyle = HAZARD;
  for (const d of w.debris) ctx.fillRect(Math.round(d.x), Math.round(d.y), 2, 2);

  // --- flip flash ---
  if (w.flash > 0) {
    ctx.globalAlpha = w.flash * 0.5;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w.vw, w.vh);
    ctx.globalAlpha = 1;
  }

  ctx.translate(-shakeX, -shakeY);
}
