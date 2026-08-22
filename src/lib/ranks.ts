/** Hodnosti podle počtu zvládnutých otázek (čistě motivační vrstva). */
export type Rank = { name: string; from: number };

export const RANKS: Rank[] = [
  { name: "Nováček", from: 0 },
  { name: "Střelec", from: 100 },
  { name: "Ostrostřelec", from: 300 },
  { name: "Odstřelovač", from: 550 },
  { name: "Mistr terče", from: 750 },
];

export function rankFor(mastered: number) {
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (mastered >= RANKS[i]!.from) index = i;
  }
  const current = RANKS[index]!;
  const next = RANKS[index + 1] ?? null;
  const span = next ? next.from - current.from : 0;
  const done = mastered - current.from;
  return {
    current,
    next,
    toNext: next ? Math.max(0, next.from - mastered) : 0,
    percentToNext: next && span > 0 ? Math.min(100, (done / span) * 100) : 100,
  };
}
