export type AccuracyMap = Record<string, { answered: number; correct: number }>;

const KEY = "zbrojak:accuracy";

function read(): AccuracyMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AccuracyMap) : {};
  } catch {
    return {};
  }
}

/** Success rate per okruh, aggregated from every answered question on the device. */
export function getAccuracy(): AccuracyMap {
  return read();
}

export function recordAccuracy(subjectId: string, correct: boolean): void {
  if (typeof window === "undefined" || !subjectId) return;
  const map = read();
  const cur = map[subjectId] ?? { answered: 0, correct: 0 };
  cur.answered += 1;
  if (correct) cur.correct += 1;
  map[subjectId] = cur;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* best-effort */
  }
}
