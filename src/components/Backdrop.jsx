/** Fixed, purely decorative background: drifting grid, blurred orbs, grain. */
export default function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop__grid" />
      <div className="orb orb--a" />
      <div className="orb orb--b" />
      <div className="orb orb--c" />
      <div className="backdrop__vignette" />
      <div className="backdrop__noise" />
    </div>
  );
}
