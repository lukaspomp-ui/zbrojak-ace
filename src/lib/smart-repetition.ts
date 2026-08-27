import { MASTERY_STREAK } from "./app-config";
import type { Question } from "./questions";
import { shuffle } from "./shuffle";

/**
 * Stav jedné otázky u jednoho uživatele. Odpovídá řádku v `user_progress`
 * (snake_case zůstává, aby nevznikl druhý paralelní model).
 */
export type QuestionState = {
  question_id: number;
  times_seen: number;
  correct_count: number;
  times_wrong: number;
  correct_streak: number;
  mastery_level: number;
  mastered: boolean;
  last_answered_at: string | null;
  next_review_at: string | null;
  last_answer_correct: boolean | null;
};

export const MASTERY_MAX = 6;

/** Intervaly opakování v minutách — jediné místo, kde jsou definované. */
export const REVIEW_INTERVALS_MINUTES = [
  10, // po chybě
  24 * 60, // 1 den
  3 * 24 * 60, // 3 dny
  7 * 24 * 60, // 7 dní
  14 * 24 * 60, // 14 dní
  30 * 24 * 60, // 30 dní
];

export function emptyState(questionId: number): QuestionState {
  return {
    question_id: questionId,
    times_seen: 0,
    correct_count: 0,
    times_wrong: 0,
    correct_streak: 0,
    mastery_level: 0,
    mastered: false,
    last_answered_at: null,
    next_review_at: null,
    last_answer_correct: null,
  };
}

/** Kdy otázku ukázat znovu. Centrální funkce, nikde jinde se intervaly nepočítají. */
export function calculateNextReview(input: {
  currentStreak: number;
  wrongCount: number;
  lastAnswerCorrect: boolean | null;
  now?: Date;
}): string {
  const now = input.now ?? new Date();
  if (input.lastAnswerCorrect === false) {
    return new Date(now.getTime() + REVIEW_INTERVALS_MINUTES[0]! * 60_000).toISOString();
  }
  const step = Math.min(Math.max(input.currentStreak, 1), REVIEW_INTERVALS_MINUTES.length - 1);
  const minutes = REVIEW_INTERVALS_MINUTES[step]!;
  return new Date(now.getTime() + minutes * 60_000).toISOString();
}

/** Přechod stavu po odpovědi. */
export function applyAnswer(
  current: QuestionState | undefined,
  questionId: number,
  wasCorrect: boolean,
  now: Date = new Date(),
): QuestionState {
  const prev = current ?? emptyState(questionId);
  const correct_streak = wasCorrect ? prev.correct_streak + 1 : 0;
  const mastery_level = wasCorrect
    ? Math.min(prev.mastery_level + 1, MASTERY_MAX)
    : Math.max(prev.mastery_level - 1, 0);

  const next: QuestionState = {
    question_id: questionId,
    times_seen: prev.times_seen + 1,
    correct_count: prev.correct_count + (wasCorrect ? 1 : 0),
    times_wrong: prev.times_wrong + (wasCorrect ? 0 : 1),
    correct_streak,
    mastery_level,
    mastered: wasCorrect && correct_streak >= MASTERY_STREAK,
    last_answered_at: now.toISOString(),
    last_answer_correct: wasCorrect,
    next_review_at: calculateNextReview({
      currentStreak: correct_streak,
      wrongCount: prev.times_wrong + (wasCorrect ? 0 : 1),
      lastAnswerCorrect: wasCorrect,
      now,
    }),
  };

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info("Smart repetition", {
      questionId,
      previous: {
        streak: prev.correct_streak,
        mastery: prev.mastery_level,
        wrong: prev.times_wrong,
      },
      answer: wasCorrect ? "correct" : "wrong",
      newStreak: next.correct_streak,
      newMastery: next.mastery_level,
      nextReviewAt: next.next_review_at,
      priority: priorityScore(next, now, false),
    });
  }

  return next;
}

const RECENT_MISTAKE_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Priorita otázky pro trénink. Vyšší = dřív se objeví.
 * 1) nedávná chyba, 2) více chyb, 3) splatný review, 4) nízké mastery,
 * 5) nová otázka, 6) mastered (nikdy úplně nevypadne).
 */
export function priorityScore(
  state: QuestionState | undefined,
  now: Date = new Date(),
  withRandomness = true,
): number {
  const jitter = withRandomness ? Math.random() * 10 : 0;
  if (!state || state.times_seen === 0) return 20 + jitter;

  let score = 0;
  const answeredAt = state.last_answered_at ? new Date(state.last_answered_at).getTime() : 0;
  if (
    state.last_answer_correct === false &&
    now.getTime() - answeredAt < RECENT_MISTAKE_WINDOW_MS
  ) {
    score += 100;
  }
  if (state.times_wrong > 0) score += Math.min(80, 30 + state.times_wrong * 10);
  if (state.next_review_at && new Date(state.next_review_at).getTime() <= now.getTime()) {
    score += 60;
  }
  if (!state.mastered && state.correct_streak < MASTERY_STREAK) score += 40;
  if (state.mastered) score = Math.max(5, score - 60);
  return score + jitter;
}

export type PriorityLabel = "vysoká" | "střední" | "nízká";

export function priorityLabel(score: number): PriorityLabel {
  if (score >= 90) return "vysoká";
  if (score >= 40) return "střední";
  return "nízká";
}

export function stateMap(progress: QuestionState[]): Map<number, QuestionState> {
  return new Map(progress.map((p) => [p.question_id, p]));
}

/** Otázky seřazené podle Smart Repetition priority. */
export function sortByPriority(
  questions: Question[],
  progress: QuestionState[],
  now: Date = new Date(),
): { question: Question; state: QuestionState | undefined; score: number }[] {
  const states = stateMap(progress);
  return questions
    .map((question) => {
      const state = states.get(question.id);
      return { question, state, score: priorityScore(state, now) };
    })
    .sort((a, b) => b.score - a.score);
}

/** Trénink: vybere `size` otázek podle priority (s malou náhodnou složkou). */
export function buildTrainingSet(
  pool: Question[],
  progress: QuestionState[],
  size: number,
  now: Date = new Date(),
): Question[] {
  if (pool.length <= size) return shuffle(pool);
  return shuffle(
    sortByPriority(pool, progress, now)
      .slice(0, size)
      .map((entry) => entry.question),
  );
}

/** Otázky pro sekci „Mé chyby“ — stejný engine, jen filtr na chyby. */
export function buildMistakesSet(
  pool: Question[],
  progress: QuestionState[],
  now: Date = new Date(),
): { question: Question; state: QuestionState; score: number }[] {
  return sortByPriority(pool, progress, now)
    .filter((entry): entry is { question: Question; state: QuestionState; score: number } =>
      !!entry.state && entry.state.times_wrong > 0,
    )
    .sort((a, b) => {
      const recency =
        new Date(b.state.last_answered_at ?? 0).getTime() -
        new Date(a.state.last_answered_at ?? 0).getTime();
      if (b.state.times_wrong !== a.state.times_wrong) {
        return b.state.times_wrong - a.state.times_wrong;
      }
      if (a.state.mastery_level !== b.state.mastery_level) {
        return a.state.mastery_level - b.state.mastery_level;
      }
      return recency;
    });
}

export function dueCount(progress: QuestionState[], now: Date = new Date()): number {
  return progress.filter(
    (p) => p.next_review_at && new Date(p.next_review_at).getTime() <= now.getTime(),
  ).length;
}

export type ReadinessInput = {
  progress: QuestionState[];
  poolSize: number;
  /** Poslední ostré testy: procenta správných odpovědí, nejnovější první. */
  examPercentages?: number[];
  /** Prošel uživatel alespoň jeden ostrý test? */
  examPassed?: boolean;
  now?: Date;
};

export type Readiness = {
  score: number;
  answered: number;
  correct: number;
  accuracy: number;
  mastered: number;
  due: number;
  wrong: number;
  unmastered: number;
  verdict: string;
};

export function readinessVerdictFor(score: number): string {
  if (score >= 90) return "Připraven na zkoušku";
  if (score >= 80) return "Velmi dobrá připravenost";
  if (score >= 60) return "Dobrá cesta";
  return "Ještě nejsi připraven";
}

/**
 * Připravenost není jen podíl správných odpovědí. Kombinuje pokrytí,
 * mastery, přesnost, kritické chyby, splatná opakování a ostré testy.
 */
export function calculateReadinessScore(input: ReadinessInput): Readiness {
  const now = input.now ?? new Date();
  const progress = input.progress;
  const answered = progress.reduce((sum, p) => sum + Math.max(p.times_seen, 0), 0);
  const correct = progress.reduce((sum, p) => sum + Math.max(p.correct_count, 0), 0);
  const accuracy = answered ? Math.round((correct / answered) * 100) : 0;
  const mastered = progress.filter((p) => p.mastered).length;
  const wrong = progress.reduce((sum, p) => sum + p.times_wrong, 0);
  const unmastered = progress.filter((p) => !p.mastered && p.times_wrong > 0).length;
  const due = dueCount(progress, now);
  const poolSize = Math.max(input.poolSize, 1);

  const coverage = Math.min(1, progress.length / poolSize); // kolik otázek vůbec viděl
  const masteryRatio = Math.min(1, mastered / poolSize);
  const accuracyRatio = answered ? correct / answered : 0;
  const examRatio = input.examPercentages?.length
    ? input.examPercentages.slice(0, 3).reduce((s, p) => s + p, 0) /
      (100 * Math.min(3, input.examPercentages.length))
    : null;

  // Váhy: mastery 40 %, přesnost 25 %, pokrytí 20 %, ostré testy 15 %.
  let score =
    masteryRatio * 40 +
    accuracyRatio * 25 +
    coverage * 20 +
    (examRatio === null ? 0 : examRatio * 15);
  if (examRatio === null) score *= 0.9; // bez ostrého testu nelze být „připraven“

  // Penalizace za nedořešené chyby a nahromaděná opakování.
  const criticalPenalty = Math.min(15, unmastered * 0.5);
  const duePenalty = Math.min(10, due * 0.3);
  score = Math.max(0, score - criticalPenalty - duePenalty);

  // Strop: bez zvládnuté většiny otázek nebo bez úspěšného ostrého testu
  // se uživatel nikdy neoznačí jako plně připravený.
  if (!input.examPassed) score = Math.min(score, 85);
  if (masteryRatio < 0.8) score = Math.min(score, 79);
  if (accuracy < 80 && answered > 0) score = Math.min(score, 75);

  const rounded = Math.round(Math.min(100, score));
  return {
    score: rounded,
    answered,
    correct,
    accuracy,
    mastered,
    due,
    wrong,
    unmastered,
    verdict: readinessVerdictFor(rounded),
  };
}
