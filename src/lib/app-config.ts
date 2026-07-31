/** Multi-tenant configuration. One codebase, many exam apps. */
export const CURRENT_APP_ID: string =
  (import.meta.env.VITE_CURRENT_APP_ID as string | undefined) || "zbrojak";

/** Free tier limits */
export const FREE_QUESTION_LIMIT = 50;
export const FREE_EXAM_ATTEMPTS = 1;

/** Exam ("ostrý test") settings */
export const EXAM_QUESTION_COUNT = 30;
export const EXAM_DURATION_SECONDS = 20 * 60;
export const EXAM_PASS_RATIO = 0.8;

/** Mastery rule: correct answers in a row needed to master a question */
export const MASTERY_STREAK = 2;

export const PAYWALL_COPY = {
  headline: "Uděláš zbroják napoprvé.",
  sub: "Odemkni kompletní databázi a procvičování chyb.",
  price: "299 Kč jednorázově",
  benefits: [
    "Neomezená databáze všech otázek",
    "Chytrý algoritmus na opakování chyb",
    "Kompletní vysvětlení paragrafů",
    "Garance aktualizace pro rok 2026",
  ],
};
