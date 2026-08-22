import { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame from '../GameFrame.jsx';
import ReadySplash from '../ui/ReadySplash.jsx';
import ResultCard from '../ui/ResultCard.jsx';
import { FREE_SESSION, useGameRun } from '../../lib/useGameRun.js';
import { clamp, formatScore, sampleIndices } from '../../lib/util.js';
import { play, buzz } from '../../lib/sound.js';
import {
  COIN,
  HERO_FALL,
  HERO_IDLE,
  HERO_STEP,
  PALETTE,
  SKULL,
  TORCH_A,
  TORCH_B,
  drawBrickWall,
  drawNumber,
  drawSprite,
  drawStone,
  measureNumber,
} from '../../lib/pixel.js';

/**
 * Trapdoor — a pixel-art dungeon shaft with a bank button.
 *
 * The whole scene is drawn on a low-resolution canvas (208 x 236) scaled up by
 * a whole number with smoothing off: brick walls, torches, stone planks that
 * swing away when they give, and a sprite adventurer who falls when they do.
 *
 * The unfairness is signposted — skulls beside each row say how many of its
 * five planks will drop you — so the odds are always knowable. What hurts is
 * greed: the pot grows with every row and falling on your last life loses
 * everything you have not banked. Rows marked with a red "?" lie by exactly one.
 */

const COLUMNS = 5;
const ROWS = 10;
const LIVES = 3;
const BASE = -1;

// --- pixel layout ---------------------------------------------------------
const GUTTER_L = 34; // skulls
const GUTTER_R = 36; // row value
const PLANK_W = 26;
const PLANK_GAP = 2;
const PLANK_H = 5;
const ROW_H = 20;
const EXIT_H = 22;
const BASE_H = 18;
const W = GUTTER_L + COLUMNS * PLANK_W + (COLUMNS - 1) * PLANK_GAP + GUTTER_R;
const H = EXIT_H + ROWS * ROW_H + BASE_H;

const plankX = (col) => GUTTER_L + col * (PLANK_W + PLANK_GAP);
/** Canvas y of the top of a row's planks. Row 0 is the lowest. */
const rowY = (row) => EXIT_H + (ROWS - 1 - row) * ROW_H + (ROW_H - PLANK_H);

const trapsForRow = (row, tower) => clamp(1 + Math.floor((row + tower * 2) / 4), 1, COLUMNS - 1);
const rowValue = (row, tower) => Math.round((60 + row * 45) * (1 + tower * 0.5));

function buildTower(tower) {
  return Array.from({ length: ROWS }, (_, row) => {
    const traps = trapsForRow(row, tower);
    const lies = tower >= 1 && row >= 2 && Math.random() < 0.22;
    return {
      traps: new Set(sampleIndices(COLUMNS, traps)),
      count: traps,
      shown: lies ? clamp(traps + (Math.random() < 0.5 ? -1 : 1), 1, COLUMNS - 1) : traps,
      lies,
      opened: new Set(),
      stepped: null,
    };
  });
}

export default function Trapdoor({ game, onExit, session = FREE_SESSION }) {
  const { finish, rearm, result } = useGameRun(game, session);

  const [phase, setPhase] = useState('ready'); // ready | playing | pause | done
  const [tower, setTower] = useState(0);
  const [rows, setRows] = useState([]);
  const [row, setRow] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [banked, setBanked] = useState(0);
  const [pot, setPot] = useState(0);
  const [towersCleared, setTowersCleared] = useState(0);
  const [shake, setShake] = useState(false);
  const [standingRow, setStandingRow] = useState(BASE);
  const [column, setColumn] = useState(2);
  const [falling, setFalling] = useState(false);

  const canvasRef = useRef(null);
  const raf = useRef(0);
  const view = useRef({ scale: 1, offsetX: 0, offsetY: 0, dpr: 1 });
  // The draw loop reads live state through a ref so it never restarts.
  const scene = useRef({});
  scene.current = { rows, row, lives, standingRow, column, falling, phase, tower, pot };
  const fallStart = useRef(0);
  const popup = useRef(null);

  const flash = useCallback((text, colour) => {
    popup.current = { text, colour, at: performance.now() };
  }, []);

  const startTower = useCallback((index) => {
    setRows(buildTower(index));
    setRow(0);
    setStandingRow(BASE);
    setColumn(2);
    setFalling(false);
    setTower(index);
    setPhase('playing');
    play('start');
  }, []);

  const begin = useCallback(() => {
    rearm();
    setLives(LIVES);
    setBanked(0);
    setPot(0);
    setTowersCleared(0);
    popup.current = null;
    startTower(0);
  }, [rearm, startTower]);

  const endRun = useCallback(
    (keepPot) => {
      setBanked((b) => b + (keepPot ? pot : 0));
      setPot(0);
      setPhase('done');
    },
    [pot],
  );

  const step = useCallback(
    (col) => {
      if (phase !== 'playing') return;
      const current = rows[row];
      if (!current || current.opened.has(col) || current.stepped === col) return;

      const isTrap = current.traps.has(col);
      setColumn(col);
      setRows((prev) =>
        prev.map((r, i) =>
          i === row
            ? {
                ...r,
                opened: isTrap ? new Set([...r.opened, col]) : r.opened,
                stepped: isTrap ? r.stepped : col,
              }
            : r,
        ),
      );

      if (isTrap) {
        const nextLives = lives - 1;
        play('bomb');
        buzz([34, 70, 34]);
        setLives(nextLives);
        setFalling(true);
        fallStart.current = performance.now();
        setShake(true);
        flash('TRAP!', '#ff5470');
        setTimeout(() => setShake(false), 450);
        if (nextLives <= 0) {
          setPhase('pause');
          setTimeout(() => endRun(false), 1700);
        } else {
          setTimeout(() => setFalling(false), 950);
        }
        return;
      }

      const value = rowValue(row, tower);
      play(row >= ROWS - 2 ? 'great' : 'good');
      buzz(7);
      setPot((p) => p + value);
      setStandingRow(row);
      flash(`+${value}`, '#f5c542');

      if (row + 1 >= ROWS) {
        play('perfect');
        const bonus = 500 * (tower + 1);
        setTowersCleared((t) => t + 1);
        setBanked((b) => b + pot + value + bonus);
        setPot(0);
        setPhase('pause');
        flash('CLEAR!', '#3ecf6d');
        setTimeout(() => startTower(tower + 1), 1800);
      } else {
        setRow(row + 1);
      }
    },
    [phase, rows, row, lives, tower, pot, endRun, startTower, flash],
  );

  const bank = useCallback(() => {
    if (phase !== 'playing' || pot === 0) return;
    play('levelup');
    buzz([10, 30, 10]);
    endRun(true);
  }, [phase, pot, endRun]);

  // ---------------------------------------------------------------- render
  useEffect(() => {
    if (phase === 'ready' || phase === 'done') return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const tick = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const pw = Math.max(1, Math.round(rect.width * dpr));
      const ph = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
      }
      const raw = Math.min(pw / W, ph / H);
      const scale = raw >= 1 ? Math.floor(raw) : raw;
      const offsetX = Math.floor((pw - W * scale) / 2);
      const offsetY = Math.floor((ph - H * scale) / 2);
      view.current = { scale, offsetX, offsetY, dpr };

      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, pw, ph);
      ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
      drawScene(ctx, scene.current, performance.now(), fallStart.current, popup.current);

      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [phase]);

  /** Turn a click on the canvas into a plank in the current row. */
  const onCanvasClick = useCallback(
    (e) => {
      if (phase !== 'playing') return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const { scale, offsetX, dpr } = view.current;
      const worldX = ((e.clientX - rect.left) * dpr - offsetX) / scale;
      for (let c = 0; c < COLUMNS; c += 1) {
        if (worldX >= plankX(c) - PLANK_GAP && worldX <= plankX(c) + PLANK_W + PLANK_GAP) {
          step(c);
          return;
        }
      }
    },
    [phase, step],
  );

  // ---------------------------------------------------------------- commit
  useEffect(() => {
    if (phase !== 'done') return;
    finish({
      score: banked,
      stats: { towers: towersCleared, row: row + 1, banked },
      scoreLabel: formatScore(banked),
      unitLabel: 'points banked',
      verdict:
        towersCleared >= 2
          ? 'Nerves of steel'
          : banked >= 2500
            ? 'Knew when to stop'
            : banked > 0
              ? 'Walked away with something'
              : 'Lost it all',
      blurb:
        banked === 0
          ? 'You fell on your last life with an unbanked pot. Banking early is not cowardice — it is the entire strategy.'
          : `You banked ${formatScore(banked)} across ${towersCleared + 1} tower${towersCleared === 0 ? '' : 's'}, stopping on row ${row + 1}.`,
      cells: [
        { label: 'Banked', value: formatScore(banked), tone: 'var(--accent)' },
        { label: 'Towers', value: towersCleared },
        { label: 'Highest row', value: row + 1 },
      ],
    });
  }, [phase, banked, towersCleared, row, finish]);

  useEffect(() => {
    function onKey(e) {
      if (phase === 'ready' && (e.code === 'Space' || e.key === 'Enter')) {
        e.preventDefault();
        begin();
        return;
      }
      if (phase !== 'playing') return;
      const n = Number(e.key);
      if (n >= 1 && n <= COLUMNS) step(n - 1);
      if (e.key.toLowerCase() === 'b') bank();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, begin, step, bank]);

  const currentRow = rows[row];
  const odds = currentRow ? Math.round(((COLUMNS - currentRow.count) / COLUMNS) * 100) : 0;

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      session={session}
      running={phase === 'playing' || phase === 'pause'}
      liveScore={formatScore(banked + pot)}
      liveLabel="Pot"
    >
      <section className={`stage${shake ? ' shake' : ''}`}>
        {phase !== 'ready' && phase !== 'done' && (
          <div className="hudbar">
            <span className="lives" aria-label={`${lives} lives left`}>
              {Array.from({ length: LIVES }, (_, i) => (
                <span key={i} className="life" data-lost={i >= lives} />
              ))}
            </span>
            <span className="hudbar__cell">
              Tower <b>{tower + 1}</b>
            </span>
          </div>
        )}

        {phase === 'ready' && <ReadySplash game={game} onStart={begin} cta="Climb" />}

        {phase !== 'ready' && phase !== 'done' && (
          <div className="tower">
            <div className="tower__pot">
              <span className="tower__potlabel">Unbanked</span>
              <span className="tower__potvalue num">{formatScore(pot)}</span>
              <button
                type="button"
                className="btn btn--primary tower__bank"
                onClick={bank}
                disabled={pot === 0 || phase !== 'playing'}
              >
                Bank it
              </button>
            </div>

            <canvas
              ref={canvasRef}
              className="shaftcanvas"
              onPointerDown={onCanvasClick}
              aria-label="The shaft. Use keys 1 to 5 to pick a plank."
            />

            {/* Keyboard/screen-reader path — the canvas itself is decorative. */}
            <div className="sr">
              {Array.from({ length: COLUMNS }, (_, c) => (
                <button key={c} type="button" onClick={() => step(c)}>
                  Step on plank {c + 1}
                </button>
              ))}
            </div>

            <p className="stage__hint">
              {currentRow?.lies
                ? 'This row is lying about its skulls — it is off by one, in some direction.'
                : `${currentRow?.count} of ${COLUMNS} planks will drop you · ${odds}% safe · keys 1–5`}
            </p>
          </div>
        )}
      </section>

      {result && <ResultCard {...result} gameId={game.id} onReplay={begin} onExit={onExit} />}
    </GameFrame>
  );
}

/* ============================================================
   Pixel rendering
   ============================================================ */

function drawScene(ctx, s, now, fellAt, popup) {
  const { rows, row, standingRow, column, falling, tower } = s;
  const tick = now * 0.06;

  // --- walls ---
  drawBrickWall(ctx, 0, 0, W, H, PALETTE, tick);

  // --- the void below ---
  ctx.fillStyle = PALETTE.void;
  ctx.fillRect(0, H - BASE_H + 6, W, BASE_H - 6);

  // --- exit at the top ---
  ctx.fillStyle = '#f5e6a8';
  ctx.fillRect(GUTTER_L + 24, 0, W - GUTTER_L - GUTTER_R - 48, 3);
  ctx.fillStyle = '#8a7a3a';
  for (let x = GUTTER_L + 24; x < W - GUTTER_R - 24; x += 3) {
    ctx.fillRect(x, 3, 1, 4 + ((x + Math.floor(tick * 0.4)) % 3));
  }

  // --- torches on the walls ---
  for (let i = 0; i < 4; i += 1) {
    const ty = EXIT_H + 12 + i * 56;
    if (ty > H - BASE_H - 12) break;
    const frame = Math.floor(now / 130 + i) % 2 ? TORCH_A : TORCH_B;
    drawSprite(ctx, frame, PALETTE, 2, ty);
    drawSprite(ctx, frame, PALETTE, W - 9, ty + 20);
  }

  // --- rows ---
  for (let r = 0; r < ROWS; r += 1) {
    const data = rows[r];
    if (!data) continue;
    const y = rowY(r);
    const isCurrent = r === row && s.phase === 'playing';

    // skulls: one per trap in this row
    for (let k = 0; k < data.shown; k += 1) {
      drawSprite(ctx, SKULL, PALETTE, 2 + k * 8, y - 2, { alpha: isCurrent ? 1 : 0.45 });
    }
    if (data.lies) {
      drawNumber(ctx, '-', 2 + data.shown * 8 + 1, y, '#ff5470');
    }

    // planks
    for (let c = 0; c < COLUMNS; c += 1) {
      const x = plankX(c);
      if (data.opened.has(c)) {
        // The trapdoor gave way: a dark hole with the plank hanging from a hinge.
        ctx.fillStyle = PALETTE.void;
        ctx.fillRect(x, y, PLANK_W, PLANK_H);
        ctx.fillStyle = '#3a2030';
        ctx.fillRect(x, y, 2, PLANK_H + 5);
        ctx.fillRect(x + PLANK_W - 2, y, 2, PLANK_H + 5);
      } else {
        drawStone(ctx, x, y, PLANK_W, PLANK_H, PALETTE, {
          lit: isCurrent || data.stepped === c,
        });
        if (data.stepped === c) {
          ctx.fillStyle = '#3ecf6d';
          ctx.fillRect(x, y, PLANK_W, 1);
        }
      }
    }

    // row value in the right gutter
    const value = rowValue(r, tower);
    const label = `+${value}`;
    drawNumber(
      ctx,
      label,
      W - GUTTER_R + 12,
      y - 1,
      isCurrent ? '#f5c542' : 'rgba(245,197,66,0.45)',
    );
    drawSprite(ctx, COIN, PALETTE, W - GUTTER_R + 3, y - 3, { alpha: isCurrent ? 1 : 0.4 });
    void measureNumber(label);
  }

  // --- base platform ---
  drawStone(ctx, GUTTER_L, H - BASE_H, COLUMNS * PLANK_W + (COLUMNS - 1) * PLANK_GAP, 6, PALETTE, {
    lit: true,
  });

  // --- the adventurer ---
  const heroX = plankX(column) + Math.floor(PLANK_W / 2) - 6;
  if (falling) {
    const elapsed = now - fellAt;
    const drop = Math.min(90, (elapsed / 950) * 90);
    const y = rowY(row) - 16 + drop;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - elapsed / 950);
    drawSprite(ctx, HERO_FALL, PALETTE, heroX, Math.round(y));
    ctx.restore();
  } else {
    const baseY = standingRow === BASE ? H - BASE_H - 16 : rowY(standingRow) - 16;
    const bob = Math.floor(now / 420) % 2;
    drawSprite(ctx, bob ? HERO_IDLE : HERO_STEP, PALETTE, heroX, baseY);
  }

  // --- floating popup ---
  if (popup) {
    const age = now - popup.at;
    if (age < 1100) {
      const rise = Math.floor((age / 1100) * 18);
      ctx.globalAlpha = Math.max(0, 1 - age / 1100);
      drawNumber(ctx, popup.text, Math.floor(W / 2) - 10, Math.floor(H / 2) - rise, popup.colour);
      ctx.globalAlpha = 1;
    }
  }
}
