import { useEffect, useRef } from 'react';

/**
 * Run a callback on every animation frame while `active` is true.
 *
 * The callback is kept in a ref so games can close over fresh state without
 * tearing down and restarting the loop on every render.
 *
 * @param {boolean} active
 * @param {(deltaMs: number, now: number) => void} callback
 */
export function useRafLoop(active, callback) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!active) return undefined;
    let raf = 0;
    let last = performance.now();

    const tick = (now) => {
      const delta = now - last;
      last = now;
      cbRef.current(delta, now);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}

/** setTimeout that cleans itself up, and can be cancelled by flipping `delay` to null. */
export function useTimeout(delay, callback) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (delay === null || delay === undefined) return undefined;
    const id = setTimeout(() => cbRef.current(), delay);
    return () => clearTimeout(id);
  }, [delay]);
}
