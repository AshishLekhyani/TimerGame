/** Stroke icons, sized by the CSS that wraps them. */

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const Timer = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2.5 2" />
    <path d="M9 2h6" />
  </svg>
);

export const Bolt = (p) => (
  <svg {...base} {...p}>
    <path d="M13 2 4.5 13.5H11l-1 8.5 9-11.5h-6.5z" />
  </svg>
);

export const Palette = (p) => (
  <svg {...base} {...p}>
    <path d="M12 21a9 9 0 1 1 9-9c0 1.7-1.3 3-3 3h-1.5a2 2 0 0 0-1.4 3.4A1.8 1.8 0 0 1 12 21z" />
    <circle cx="7.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="9.8" cy="8" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="14.4" cy="8" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export const Grid = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
  </svg>
);

export const Target = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

export const Search = (p) => (
  <svg {...base} {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 4.5 4.5" />
  </svg>
);

export const Eye = (p) => (
  <svg {...base} {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3.2" />
  </svg>
);

export const Calc = (p) => (
  <svg {...base} {...p}>
    <rect x="4.5" y="2.5" width="15" height="19" rx="3" />
    <path d="M8 7h8" />
    <path d="M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16.5h.01M12 16.5h.01M15.5 16.5h.01" />
  </svg>
);

export const Flame = (p) => (
  <svg {...base} {...p}>
    <path d="M12 22c4 0 6.5-2.6 6.5-6 0-4.5-4.5-6-4-11-2.5 1-4 3.5-4 6 0 1-.6 1.6-1.3 1.6-.8 0-1.2-.7-1.2-1.8C6.4 12 5.5 13.8 5.5 16c0 3.4 2.5 6 6.5 6z" />
  </svg>
);

export const Calendar = (p) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="5" width="17" height="16" rx="3" />
    <path d="M3.5 10h17" />
    <path d="M8 3v4M16 3v4" />
  </svg>
);

export const Swords = (p) => (
  <svg {...base} {...p}>
    <path d="M14.5 14.5 20 20M4 4l7.5 7.5M4 4h3.5l4 4M20 4h-3.5l-9 9M4 20l5.5-5.5M4 20h3.5l2-2M20 20h-3.5l-2-2" />
  </svg>
);

export const Chart = (p) => (
  <svg {...base} {...p}>
    <path d="M4 20V4" />
    <path d="M4 20h16" />
    <path d="m7.5 15.5 3.5-4 3 2.5 4.5-6" />
  </svg>
);

export const Share = (p) => (
  <svg {...base} {...p}>
    <path d="M12 15.5V3.5" />
    <path d="m8 7 4-3.5L16 7" />
    <path d="M5 13v5.5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V13" />
  </svg>
);

export const Check = (p) => (
  <svg {...base} {...p}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </svg>
);

export const Cross = (p) => (
  <svg {...base} {...p}>
    <path d="m6.5 6.5 11 11" />
    <path d="m17.5 6.5-11 11" />
  </svg>
);

export const Pause = (p) => (
  <svg {...base} {...p}>
    <rect x="6.5" y="4.5" width="4" height="15" rx="1.4" fill="currentColor" />
    <rect x="13.5" y="4.5" width="4" height="15" rx="1.4" fill="currentColor" />
  </svg>
);

export const Info = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5" />
    <path d="M12 7.6h.01" />
  </svg>
);

export const Lock = (p) => (
  <svg {...base} {...p}>
    <rect x="4.5" y="10" width="15" height="10.5" rx="3" />
    <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
  </svg>
);

export const Brain = (p) => (
  <svg {...base} {...p}>
    <path d="M12 5.5a3 3 0 0 0-5.7-1.3A2.8 2.8 0 0 0 4 7a2.9 2.9 0 0 0 .5 1.6A3 3 0 0 0 5 14.3V16a3 3 0 0 0 4.6 2.5A2.6 2.6 0 0 0 12 20z" />
    <path d="M12 5.5a3 3 0 0 1 5.7-1.3A2.8 2.8 0 0 1 20 7a2.9 2.9 0 0 1-.5 1.6A3 3 0 0 1 19 14.3V16a3 3 0 0 1-4.6 2.5A2.6 2.6 0 0 1 12 20z" />
    <path d="M12 5.5V20" />
  </svg>
);

export const Chain = (p) => (
  <svg {...base} {...p}>
    <path d="M10.5 13.5a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7l-1.6 1.6" />
    <path d="M13.5 10.5a4 4 0 0 0-5.7 0L5 13.3a4 4 0 0 0 5.7 5.7l1.6-1.6" />
  </svg>
);

export const Echo = (p) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="2" fill="currentColor" fillOpacity="0.35" />
    <path d="M13.5 7h4.2a2.8 2.8 0 0 1 2.8 2.8V11" />
    <path d="M10.5 17H6.3A2.8 2.8 0 0 1 3.5 14.2V13" />
  </svg>
);

export const Run = (p) => (
  <svg {...base} {...p}>
    <circle cx="15.5" cy="4.6" r="2.1" />
    <path d="m13 21 1.6-5.2-3.1-2.6.9-4.8 3.6 2.2 3 .9" />
    <path d="m11.4 8.4-3.3 1.4L6.7 13" />
    <path d="M3 17.5h4" />
    <path d="M2 13.5h2.5" />
  </svg>
);

export const Trapdoor = (p) => (
  <svg {...base} {...p}>
    <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="3" />
    <path d="M3.2 12h17.6" />
    <path d="M12 3.2v17.6" />
    <path d="m8.5 15.5 3 3M15.5 8.5l-3-3" strokeOpacity="0.5" />
  </svg>
);

export const Lock2 = (p) => (
  <svg {...base} {...p}>
    <path d="M3 12h18" />
    <path d="M7 8v8M17 8v8" />
    <circle cx="12" cy="12" r="2.6" fill="currentColor" />
  </svg>
);

export const TriggerIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="8" cy="8.5" r="4" />
    <rect x="12.5" y="12" width="8" height="8" rx="1.6" />
  </svg>
);

export const Gavel = (p) => (
  <svg {...base} {...p}>
    <path d="m13.5 6.5 4 4" />
    <rect x="9.6" y="3.4" width="8" height="4.4" rx="1.4" transform="rotate(45 13.6 5.6)" />
    <path d="M11 9 4.5 15.5a2.1 2.1 0 0 0 3 3L14 12" />
    <path d="M14.5 20.5h7" />
  </svg>
);

export const Arrow = (p) => (
  <svg {...base} {...p}>
    <path d="M5 12h13" />
    <path d="m12.5 6 6 6-6 6" />
  </svg>
);

export const Back = (p) => (
  <svg {...base} {...p}>
    <path d="M19 12H6" />
    <path d="m11.5 6-6 6 6 6" />
  </svg>
);

export const Play = (p) => (
  <svg {...base} {...p}>
    <path d="M7 4.5 19.5 12 7 19.5z" fill="currentColor" />
  </svg>
);

export const Replay = (p) => (
  <svg {...base} {...p}>
    <path d="M20 11a8 8 0 1 0-2 6.2" />
    <path d="M20 4.5V11h-6.2" />
  </svg>
);

export const SoundOn = (p) => (
  <svg {...base} {...p}>
    <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z" />
    <path d="M15.8 9.2a4 4 0 0 1 0 5.6" />
    <path d="M18.4 6.6a7.6 7.6 0 0 1 0 10.8" />
  </svg>
);

export const SoundOff = (p) => (
  <svg {...base} {...p}>
    <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z" />
    <path d="m16.5 9.5 5 5" />
    <path d="m21.5 9.5-5 5" />
  </svg>
);

export const User = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8.5" r="3.7" />
    <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
  </svg>
);

export const Close = (p) => (
  <svg {...base} {...p}>
    <path d="m6.5 6.5 11 11" />
    <path d="m17.5 6.5-11 11" />
  </svg>
);

export const Trophy = (p) => (
  <svg {...base} {...p}>
    <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
    <path d="M7 5.5H4.5V7A3.5 3.5 0 0 0 8 10.5" />
    <path d="M17 5.5h2.5V7A3.5 3.5 0 0 1 16 10.5" />
    <path d="M12 14v3.5" />
    <path d="M8.5 20h7" />
  </svg>
);

export const Spark = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.3l-1.8-5.7L4.5 10.8 10.2 9z" />
  </svg>
);

export const Logo = (p) => (
  <svg viewBox="0 0 48 24" fill="none" {...p}>
    <path
      d="M2 14h7l3.5-10L19 20l4-11 3 5h10"
      stroke="url(#logoGrad)"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="logoGrad" x1="2" y1="4" x2="46" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#22e3d6" />
        <stop offset="0.5" stopColor="#a78bfa" />
        <stop offset="1" stopColor="#f0499b" />
      </linearGradient>
    </defs>
  </svg>
);

// eslint-disable-next-line react-refresh/only-export-components
export const GAME_ICONS = {
  timer: Timer,
  bolt: Bolt,
  palette: Palette,
  grid: Grid,
  target: Target,
  search: Search,
  eye: Eye,
  calc: Calc,
  brain: Brain,
  lock: Lock,
  chain: Chain,
  echo: Echo,
  run: Run,
  trapdoor: Trapdoor,
  lock2: Lock2,
  trigger: TriggerIcon,
  gavel: Gavel,
};
