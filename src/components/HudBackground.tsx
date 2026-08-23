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
