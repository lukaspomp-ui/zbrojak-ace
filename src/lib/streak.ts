import type { Progress } from "./data";

/** Consecutive days with at least one answered question, ending today/yesterday. */
export function computeStreak(progress: Progress[]): number {
  const days = new Set(
    progress
      .map((p) => p.last_answered_at)
      .filter((d): d is string => !!d)
      .map((d) => new Date(d).toISOString().slice(0, 10)),
  );
  if (days.size === 0) return 0;
  const key = (d: Date) => d.toISOString().slice(0, 10);
  const cursor = new Date();
  if (!days.has(key(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(key(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(key(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
