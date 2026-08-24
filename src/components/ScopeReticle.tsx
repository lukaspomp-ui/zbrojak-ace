/** Decorative scope reticle: crosshair with rings + tick marks. */
export function ScopeReticle({
  className = "",
  opacity = 0.5,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <svg aria-hidden viewBox="0 0 200 200" className={className} style={{ opacity }}>
      <g fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
        <circle cx="100" cy="100" r="92" strokeDasharray="3 7" />
        <circle cx="100" cy="100" r="70" />
        <circle cx="100" cy="100" r="46" strokeOpacity="0.6" />
        <path d="M100 4v34M100 162v34M4 100h34M162 100h34" />
        <path d="M100 58v14M100 128v14M58 100h14M128 100h14" strokeOpacity="0.7" />
        {[20, 40, 60, 80, 120, 140, 160, 180].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 100 + Math.cos(rad) * 84;
          const y1 = 100 + Math.sin(rad) * 84;
          const x2 = 100 + Math.cos(rad) * 92;
          const y2 = 100 + Math.sin(rad) * 92;
          return <path key={deg} d={`M${x1} ${y1}L${x2} ${y2}`} strokeOpacity="0.8" />;
        })}
      </g>
    </svg>
  );
}
