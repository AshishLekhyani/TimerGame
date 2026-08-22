import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { randFloat } from '../../lib/util.js';

const COLORS = ['#22e3d6', '#a3e635', '#f0499b', '#a78bfa', '#fbbf24', '#ffffff'];

/**
 * A short canvas confetti burst for personal records. Runs entirely on rAF and
 * removes itself once every piece has fallen past the bottom edge.
 */
export default function Confetti({ pieces = 130 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const bits = Array.from({ length: pieces }, () => ({
      x: width / 2 + randFloat(-90, 90),
      y: height / 2 + randFloat(-60, 20),
      vx: randFloat(-9, 9),
      vy: randFloat(-16, -4),
      w: randFloat(5, 11),
      h: randFloat(4, 9),
      rot: randFloat(0, Math.PI * 2),
      spin: randFloat(-0.24, 0.24),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    let frame = 0;
    let raf = 0;

    function tick() {
      frame += 1;
      ctx.clearRect(0, 0, width, height);
      let alive = false;

      for (const b of bits) {
        b.vy += 0.42; // gravity
        b.vx *= 0.992; // drag
        b.x += b.vx;
        b.y += b.vy;
        b.rot += b.spin;

        if (b.y < height + 40) alive = true;

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.globalAlpha = Math.max(0, 1 - frame / 190);
        ctx.fillStyle = b.color;
        ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        ctx.restore();
      }

      if (alive && frame < 200) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, width, height);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [pieces]);

  return createPortal(
    <canvas ref={canvasRef} className="confetti" aria-hidden="true" />,
    document.getElementById('modal'),
  );
}
