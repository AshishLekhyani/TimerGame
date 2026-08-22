import { createPortal } from 'react-dom';
import { useArcade } from '../../state/ArcadeContext.jsx';

/** Achievement / level-up notifications, rendered above everything. */
export default function Toasts() {
  const { toasts } = useArcade();
  if (!toasts.length) return null;

  return createPortal(
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast"
          style={t.tone ? { '--accent': t.tone, borderColor: t.tone } : undefined}
        >
          <div className="toast__icon" aria-hidden="true">
            {t.icon}
          </div>
          <div className="toast__body">
            <span className="toast__kicker">{t.kicker}</span>
            <span className="toast__title">{t.title}</span>
            <span className="toast__desc">{t.desc}</span>
          </div>
        </div>
      ))}
    </div>,
    document.getElementById('modal'),
  );
}
