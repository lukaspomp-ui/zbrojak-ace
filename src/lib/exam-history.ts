import type { AnswerKey } from "./data";

export type SectionScore = { name: string; correct: number; total: number };

export type ExamAttempt = {
  id: string;
  date: string; // ISO timestamp
  correct: number;
  total: number;
  passed: boolean;
  sections: SectionScore[];
  questionIds: number[];
  answers: Record<number, AnswerKey>;
};

const KEY = "zbrojak:exam-history";
const MAX = 100;

/** Completed exams are stored on the device (newest first). */
export function getExamHistory(): ExamAttempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ExamAttempt[]) : [];
  } catch {
    return [];
  }
}

export function saveExamAttempt(attempt: ExamAttempt): ExamAttempt[] {
  if (typeof window === "undefined") return [];
  const list = [attempt, ...getExamHistory()].slice(0, MAX);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage full / unavailable — history is best-effort */
  }
  return list;
}

export function newAttemptId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
