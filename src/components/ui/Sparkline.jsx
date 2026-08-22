import { useId } from 'react';

/**
 * A tiny trend line for a run history.
 *
 * `invert` flips the vertical axis for games where lower is better, so "up and
 * to the right" always means "getting better" no matter what is being measured.
 */
export default function Sparkline({
  values,
  invert = false,
  width = 92,
  height = 30,
  showLast = true,
}) {
  const gradientId = useId();
  if (!values || values.length < 2) return null;

  const pad = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (width - pad * 2);
    const norm = (v - min) / span;
    const t = invert ? norm : 1 - norm; // 0 = top of the box
    const y = pad + t * (height - pad * 2);
    return [x, y];
  });

  const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${width - pad} ${height} L${pad} ${height} Z`;
  const [lastX, lastY] = points.at(-1);

  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.32" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showLast && <circle cx={lastX} cy={lastY} r="2.6" fill="var(--accent)" />}
    </svg>
  );
}
