/** Kosmetické dekorace zpětné vazby v procvičování (žádná logika). */

/** Malý terč / bullseye jako "razítko" u správné odpovědi. */
export function BullseyeStamp({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className}>
      <circle cx="12" cy="12" r="10.5" fill="currentColor" opacity="0.16" />
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle
        cx="12"
        cy="12"
        r="5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
    </svg>
  );
}

/** Stylizovaný průstřel, který se objeví u chybné odpovědi. */
export function BulletHole({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 40 40" className={className}>
      <circle cx="20" cy="20" r="7" fill="#08080a" />
      <circle cx="20" cy="20" r="7" fill="currentColor" opacity="0.25" />
      <circle
        cx="20"
        cy="20"
        r="9.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="2 3"
        opacity="0.7"
      />
      <g stroke="currentColor" strokeWidth="1" opacity="0.55">
        <path d="M20 9.5 21.5 5M28.5 15 33 12.5M30 24l4.5 2M20 31l-1.5 4.5M11 26l-4.5 2.5M10.5 16 6 13.5" />
      </g>
    </svg>
  );
}
