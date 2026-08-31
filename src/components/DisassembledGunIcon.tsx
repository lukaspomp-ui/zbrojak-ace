export function DisassembledGunIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* hlaveň */}
      <rect x="10" y="3" width="8" height="2.4" rx="0.6" />
      {/* rám se spouští */}
      <path d="M4 12.5h7.5v2.2c0 1-0.8 1.8-1.8 1.8H6.2c-1 0-1.8-0.8-1.8-1.8v-1.7Z" />
      <path d="M7 16.5v2" />
      {/* zásobník */}
      <rect x="14.5" y="12" width="2.2" height="6.5" rx="0.5" />
      {/* závěr / slide */}
      <rect x="18.5" y="12.5" width="5" height="2.6" rx="0.5" />
    </svg>
  );
}
