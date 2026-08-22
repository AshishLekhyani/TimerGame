/**
 * A tiny pixel-art toolkit.
 *
 * Sprites are arrays of strings — one character per pixel — plus a palette
 * mapping characters to colours. `.` is transparent. Everything is drawn with
 * fillRect at integer coordinates onto a low-resolution canvas which is then
 * scaled up with smoothing disabled, so the result is genuinely chunky rather
 * than a blurred-up vector drawing.
 */

/** Set a canvas up for crisp integer-scaled pixel art. */
export function preparePixelCanvas(canvas, worldW, worldH) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const targetW = Math.max(1, Math.round(rect.width * dpr));
  const targetH = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, targetW, targetH);

  // Whole-number scale keeps pixels square; fall back to fractional only if the
  // canvas is smaller than one world pixel per screen pixel.
  const raw = Math.min(targetW / worldW, targetH / worldH);
  const scale = raw >= 1 ? Math.floor(raw) : raw;
  const offsetX = Math.floor((targetW - worldW * scale) / 2);
  const offsetY = Math.floor((targetH - worldH * scale) / 2);
  ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
  return { ctx, scale, offsetX, offsetY, targetW, targetH };
}

/** Draw a string-map sprite at (x, y). `flip` mirrors it horizontally. */
export function drawSprite(ctx, sprite, palette, x, y, { flip = false, alpha = 1 } = {}) {
  const previousAlpha = ctx.globalAlpha;
  if (alpha !== 1) ctx.globalAlpha = alpha;
  const width = sprite[0].length;

  for (let row = 0; row < sprite.length; row += 1) {
    const line = sprite[row];
    for (let col = 0; col < line.length; col += 1) {
      const key = line[col];
      if (key === '.') continue;
      const colour = palette[key];
      if (!colour) continue;
      ctx.fillStyle = colour;
      ctx.fillRect(x + (flip ? width - 1 - col : col), y + row, 1, 1);
    }
  }
  ctx.globalAlpha = previousAlpha;
}

/** A stone block with a lit top edge and a shadowed underside. */
export function drawStone(ctx, x, y, w, h, palette, { lit = false } = {}) {
  ctx.fillStyle = lit ? palette.stoneLit : palette.stone;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = lit ? palette.stoneHighlightLit : palette.stoneHighlight;
  ctx.fillRect(x, y, w, 1);
  ctx.fillStyle = palette.stoneShadow;
  ctx.fillRect(x, y + h - 1, w, 1);
  // Mortar notches — three per block, offset so the blocks do not look tiled.
  ctx.fillStyle = palette.stoneShadow;
  for (let i = 1; i < 3; i += 1) {
    const nx = x + Math.floor((w / 3) * i);
    ctx.fillRect(nx, y + 1, 1, h - 2);
  }
}

/** Repeating brick wall used as a backdrop. */
export function drawBrickWall(ctx, x, y, w, h, palette, tick = 0) {
  ctx.fillStyle = palette.wall;
  ctx.fillRect(x, y, w, h);

  const brickW = 16;
  const brickH = 8;
  ctx.fillStyle = palette.wallLine;
  for (let row = 0; row * brickH < h; row += 1) {
    const by = y + row * brickH;
    ctx.fillRect(x, by, w, 1);
    const stagger = row % 2 === 0 ? 0 : brickW / 2;
    for (let bx = stagger; bx < w; bx += brickW) {
      ctx.fillRect(x + bx, by, 1, brickH);
    }
  }

  // A slow vertical light gradient, faked with scanline bands.
  ctx.fillStyle = palette.wallShade;
  for (let i = 0; i < h; i += 4) {
    ctx.globalAlpha = 0.06 + 0.05 * Math.sin((i + tick) * 0.04);
    ctx.fillRect(x, y + i, w, 2);
  }
  ctx.globalAlpha = 1;
}

/* ============================================================
   Sprites
   ============================================================ */

/** 12 x 16 adventurer, facing right. */
export const HERO_IDLE = [
  '....HHHH....',
  '...HHHHHH...',
  '..HKSSSSKH..',
  '..HKSWSWKH..',
  '..HKSSSSKH..',
  '...KSSSSK...',
  '...KKAAKK...',
  '..AAAAAAAA..',
  '.SAABAABAAS.',
  '.SAABAABAAS.',
  '.S.AAAAAA.S.',
  '...BBBBBB...',
  '...BB..BB...',
  '...BB..BB...',
  '..KKK..KKK..',
  '..KKK..KKK..',
];

/** Mid-stride, so standing still and moving read differently. */
export const HERO_STEP = [
  '....HHHH....',
  '...HHHHHH...',
  '..HKSSSSKH..',
  '..HKSWSWKH..',
  '..HKSSSSKH..',
  '...KSSSSK...',
  '...KKAAKK...',
  '..AAAAAAAA..',
  '.SAABAABAAS.',
  '.SAABAABAAS.',
  '.S.AAAAAA.S.',
  '...BBBBBB...',
  '..BB....BB..',
  '..BB....BB..',
  '.KKK.....KKK',
  '.KKK.....KKK',
];

/** Arms up, legs flailing — used while falling down the shaft. */
export const HERO_FALL = [
  '.S........S.',
  '.S.HHHHHH.S.',
  '.SHKSSSSKHS.',
  '..HKSWWSKH..',
  '..HKSSSSKH..',
  '...KSSSSK...',
  '...KKAAKK...',
  '..AAAAAAAA..',
  '..AABAABAA..',
  '..AABAABAA..',
  '...AAAAAA...',
  '..BB....BB..',
  '.BB......BB.',
  '.BB......BB.',
  'KKK........K',
  'KK.........K',
];

/** 7 x 9 wall torch. Two flame frames. */
export const TORCH_A = [
  '...F...',
  '..FFF..',
  '..FGF..',
  '.FFGFF.',
  '..FFF..',
  '...K...',
  '...K...',
  '..KKK..',
  '...K...',
];

export const TORCH_B = [
  '..F.F..',
  '...F...',
  '..FGF..',
  '..FGF..',
  '.FFFF..',
  '...K...',
  '...K...',
  '..KKK..',
  '...K...',
];

/** 7 x 7 skull, used as the trap-count marker. */
export const SKULL = [
  '.KKKKK.',
  'KWWWWWK',
  'KWKWKWK',
  'KWWWWWK',
  'KWKKKWK',
  '.KWKWK.',
  '..KKK..',
];

/** 7 x 7 coin for the row value. */
export const COIN = [
  '..CCC..',
  '.CDDDC.',
  'CDDLDDC',
  'CDLLLDC',
  'CDDLDDC',
  '.CDDDC.',
  '..CCC..',
];

/* ---------------- Vector Run sprites (12 x 16) ---------------- */

/** Running, frame A — front leg forward. */
export const RUN_A = [
  '....RRRR....',
  '...RKKKKR...',
  '...RKWWKR...',
  '...RKKKKR...',
  '....NNNN....',
  '..SNNNNNNS..',
  '..SNNPPNNS..',
  '..SNNPPNNS..',
  '...NNPPNN...',
  '....PPPP....',
  '....PP.PP...',
  '...PP...PP..',
  '..PP.....PP.',
  '..KKK....KK.',
  '............',
  '............',
];

/** Running, frame B — legs crossed. */
export const RUN_B = [
  '....RRRR....',
  '...RKKKKR...',
  '...RKWWKR...',
  '...RKKKKR...',
  '....NNNN....',
  '.SNNNNNNNS..',
  '.SNNPPNNS...',
  '..NNPPNN....',
  '...NNPPNN...',
  '....PPPP....',
  '.....PP.....',
  '....PPPP....',
  '...PP..PP...',
  '..KKK..KKK..',
  '............',
  '............',
];

/** Airborne — knees tucked, arms out. */
export const RUN_JUMP = [
  '....RRRR....',
  '...RKKKKR...',
  '...RKWWKR...',
  '...RKKKKR...',
  'S...NNNN...S',
  'SNNNNNNNNNNS',
  '..NNPPPPNN..',
  '..NNPPPPNN..',
  '...NPPPPN...',
  '...PPPPPP...',
  '..PPP..PPP..',
  '..KK....KK..',
  '............',
  '............',
  '............',
  '............',
];

/** Ducking — 12 x 10, sits flush to the ground. */
export const RUN_DUCK = [
  '............',
  '............',
  '............',
  '............',
  '............',
  '..RRRR......',
  '.RKKKKRNNNS.',
  '.RKWWKRNNNS.',
  '..NNNNPPPP..',
  '..KKK..KKK..',
  '............',
  '............',
  '............',
  '............',
  '............',
  '............',
];

/* ---------------- 3 x 5 bitmap digits ---------------- */

const DIGITS = {
  0: ['111', '101', '101', '101', '111'],
  1: ['010', '110', '010', '010', '111'],
  2: ['111', '001', '111', '100', '111'],
  3: ['111', '001', '111', '001', '111'],
  4: ['101', '101', '111', '001', '001'],
  5: ['111', '100', '111', '001', '111'],
  6: ['111', '100', '111', '101', '111'],
  7: ['111', '001', '010', '010', '010'],
  8: ['111', '101', '111', '101', '111'],
  9: ['111', '101', '111', '001', '111'],
  '+': ['000', '010', '111', '010', '000'],
  '-': ['000', '000', '111', '000', '000'],
  x: ['000', '101', '010', '101', '000'],
  ' ': ['000', '000', '000', '000', '000'],
};

/** Width in pixels of `text` rendered by drawNumber (1px letter spacing). */
export const measureNumber = (text) => String(text).length * 4 - 1;

/** Draw a short numeric string in the 3x5 font. Unknown glyphs are skipped. */
export function drawNumber(ctx, text, x, y, colour) {
  ctx.fillStyle = colour;
  let cursor = x;
  for (const ch of String(text)) {
    const glyph = DIGITS[ch];
    if (glyph) {
      for (let row = 0; row < glyph.length; row += 1) {
        for (let col = 0; col < 3; col += 1) {
          if (glyph[row][col] === '1') ctx.fillRect(cursor + col, y + row, 1, 1);
        }
      }
    }
    cursor += 4;
  }
}

export const PALETTE = {
  // hero
  H: '#7b4a2d', // hair / helmet
  K: '#1b1526', // outline
  S: '#f0b184', // skin
  W: '#ffffff', // eye / bone
  A: '#3ecf6d', // armour
  B: '#1f8f4a', // armour shadow
  // torch
  F: '#ff7a2f',
  G: '#ffe066',
  // coin
  C: '#a86a1c',
  D: '#f5c542',
  L: '#fff3b0',
  // runner
  R: '#ff3d6e', // helmet
  N: '#ffe066', // suit
  P: '#ff9f1c', // suit shadow
  // world
  wall: '#241d33',
  wallLine: '#1a1428',
  wallShade: '#0d0a16',
  stone: '#5a5570',
  stoneLit: '#7a7594',
  stoneHighlight: '#8f8aa8',
  stoneHighlightLit: '#b9b4cc',
  stoneShadow: '#2c2840',
  void: '#0a0714',
};
