/**
 * App-wide cinematic backdrop: near-black gradient, warm spotlight at the top,
 * a faint HUD grid of tiny crosshair marks and a soft vignette at the bottom.
 * Purely decorative — sits behind all content and never intercepts taps.
 */
const CROSSHAIR = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><g stroke="#808080" stroke-width="1" stroke-linecap="round"><path d="M22 17.5v9M17.5 22h9"/></g></svg>`,
);

export function HudBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, var(--background-lift) 0%, var(--background) 45%, var(--background-deep) 100%)",
        }}
      />
      {/* warm spotlight glow at the top */}
      <div
        className="absolute inset-x-0 top-0 h-[52vh]"
        style={{
          background:
            "radial-gradient(90% 100% at 50% -10%, color-mix(in oklab, var(--primary) 26%, transparent) 0%, transparent 70%)",
          opacity: 0.55,
        }}
      />
      {/* graphic reticle motif — the "aim at your goal" theme */}
      <svg
        className="absolute left-1/2 top-[8%] -translate-x-1/2"
        width="360"
        height="360"
        viewBox="0 0 200 200"
        aria-hidden="true"
        style={{ opacity: 0.13 }}
      >
        <g fill="none" stroke="var(--primary)" strokeWidth="1.3">
          <circle cx="100" cy="100" r="94" />
          <circle cx="100" cy="100" r="70" />
          <circle cx="100" cy="100" r="46" />
          <circle cx="100" cy="100" r="22" />
          <line x1="100" y1="2" x2="100" y2="40" />
          <line x1="100" y1="160" x2="100" y2="198" />
          <line x1="2" y1="100" x2="40" y2="100" />
          <line x1="160" y1="100" x2="198" y2="100" />
        </g>
      </svg>
      <svg
        className="absolute -right-10 bottom-[12%]"
        width="150"
        height="150"
        viewBox="0 0 100 100"
        aria-hidden="true"
        style={{ opacity: 0.09 }}
      >
        <g fill="none" stroke="var(--brass)" strokeWidth="1.3">
          <circle cx="50" cy="50" r="46" />
          <circle cx="50" cy="50" r="28" />
          <line x1="50" y1="0" x2="50" y2="100" />
          <line x1="0" y1="50" x2="100" y2="50" />
        </g>
      </svg>
      {/* faint HUD grid of crosshair marks */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,${CROSSHAIR}")`,
          backgroundSize: "44px 44px",
          opacity: 0.05,
        }}
      />
      {/* vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 30%, transparent 40%, var(--hud-vignette) 100%)",
        }}
      />
    </div>
  );
}
