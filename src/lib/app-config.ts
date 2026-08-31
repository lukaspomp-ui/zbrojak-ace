/**
 * TEMPORARY TESTING FLAG — set to true to skip login + force Premium.
 * false = reálné rozdělení Free / Premium.
 */
export const DEV_OPEN = false;

/** Multi-tenant configuration. One codebase, many exam apps. */
export const CURRENT_APP_ID: string =
  (import.meta.env.VITE_CURRENT_APP_ID as string | undefined) || "zbrojak";

/** Free tier limits */
export const FREE_QUESTION_LIMIT = 50;
export const FREE_EXAM_ATTEMPTS = 1;

/** Free tier: how many documents are downloadable */
export const FREE_DOCUMENT_LIMIT = 1;

/** Exam ("ostrý test") settings */
export const EXAM_QUESTION_COUNT = 30;
export const EXAM_DURATION_SECONDS = 40 * 60;
// Reálná hranice úspěchu: 26 správných z 30 pro obecné oprávnění
// (rozšířené oprávnění vyžaduje 28 z 30).
export const EXAM_PASS_CORRECT = 26;

/** Subject practice: one round serves this many random questions */
export const PRACTICE_ROUND_SIZE = 5;

/** Mastery rule: correct answers in a row needed to master a question */
export const MASTERY_STREAK = 2;

export const PAYWALL_COPY = {
  headline: "Nauč se na testy.",
  sub: "Odemkni kompletní databázi a procvičování chyb.",
  price: "99 Kč jednorázově",
  benefits: [
    "Neomezená databáze všech otázek",
    "Ostrý test na 30 otázek s časomírou",
    "Dokumenty ke stažení a slovníček pojmů",
    "Procházení otázek a oblíbené",
    "Garance aktualizace pro rok 2026",
  ],
};
