import type { LicenseGroupId } from "@/lib/license-group";

const SHIELD = "M23 2 L41 8 V24 C41 34 33 41 23 44 C13 41 5 34 5 24 V8 Z";

function EmblemSymbol({ id }: { id: LicenseGroupId }) {
  const s = { fill: "none", stroke: "#ff9d3d", strokeWidth: 2 } as const;
  switch (id) {
    case "A": // sběratelské — drahokam
      return (
        <path d="M23 12 L31 20 L23 34 L15 20 Z" {...s} strokeLinejoin="round" />
      );
    case "B": // sportovní — terč
      return (
        <>
          <circle cx="23" cy="22" r="10" {...s} />
          <circle cx="23" cy="22" r="4.5" {...s} />
          <circle cx="23" cy="22" r="1.6" fill="#ff9d3d" stroke="none" />
        </>
      );
    case "C": // lovecké — parohy
      return (
        <g {...s} strokeLinecap="round">
          <path d="M23 32 V18" />
          <path d="M23 21 C19 19 17 15 15 12" />
          <path d="M15 16 L11 14" />
          <path d="M23 21 C27 19 29 15 31 12" />
          <path d="M31 16 L35 14" />
        </g>
      );
    case "D": // výkon povolání — hvězda
      return (
        <path
          d="M23 11 l3.2 6.5 7.2 1 -5.2 5.1 1.2 7.1 -6.4 -3.4 -6.4 3.4 1.2 -7.1 -5.2 -5.1 7.2 -1 Z"
          {...s}
          strokeLinejoin="round"
        />
      );
    case "E": // ochrana — kříž
      return (
        <g {...s} strokeLinecap="round">
          <path d="M23 13 v14 M18 20 h10" />
        </g>
      );
    default:
      return null;
  }
}

/** Distinct crest-style logo for each licence group (A–E). */
export function GroupEmblem({
  id,
  className,
}: {
  id: LicenseGroupId;
  className?: string;
}) {
  const gid = `ge-${id}`;
  return (
    <svg
      viewBox="0 0 46 46"
      className={className}
      aria-hidden="true"
      style={{ filter: "drop-shadow(0 3px 8px rgba(255,125,26,0.25))" }}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffce8a" />
          <stop offset="1" stopColor="#ff6a00" />
        </linearGradient>
      </defs>
      <path
        d={SHIELD}
        fill="var(--background-lift)"
        stroke={`url(#${gid})`}
        strokeWidth="2"
      />
      <EmblemSymbol id={id} />
    </svg>
  );
}
