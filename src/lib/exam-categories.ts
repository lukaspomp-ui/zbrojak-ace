import type { Question } from "./questions";

/**
 * Skladba ostrého testu podle skutečné struktury zkoušky.
 * Kategorie jsou DERIVOVANÉ z existujícího datového modelu (okruh v JSON) —
 * obsah otázek se nijak nemění.
 */
export type ExamCategory = "legal" | "weapons" | "safe_handling" | "first_aid";

export const EXAM_BLUEPRINT: Record<ExamCategory, number> = {
  legal: 17,
  weapons: 5,
  safe_handling: 5,
  first_aid: 3,
};

export const EXAM_CATEGORY_ORDER: ExamCategory[] = [
  "legal",
  "weapons",
  "safe_handling",
  "first_aid",
];

export const EXAM_CATEGORY_LABELS: Record<ExamCategory, string> = {
  legal: "Právní předpisy",
  weapons: "Nauka o zbraních a střelivu",
  safe_handling: "Zásady bezpečného nakládání se zbraněmi a střelivem",
  first_aid: "Zdravotnické minimum",
};

/** Okruhy I–III = právní předpisy, IV = nauka, V = zdravotnické minimum. */
const LEGAL_SUBJECTS = new Set(["okruh-1", "okruh-2", "okruh-3"]);
const WEAPONS_SUBJECT = "okruh-4";
const FIRST_AID_SUBJECT = "okruh-5";

/**
 * Bundlovaný oficiální soubor nemá samostatný okruh "zásady bezpečného
 * nakládání" — tyto otázky jsou součástí okruhu IV. Vyčleníme je podle
 * tématu (deterministicky, bez zásahu do dat).
 */
const SAFE_HANDLING_PATTERN =
  /(bezpečn|manipulac|manipul|nabíj|vybíj|nabit|vybit|hlaveň|mířit|zamiř|střelnic|zacház|nakládán|přeprav|úschov|uložen|pojistk)/i;

export function categoryOfQuestion(question: Question): ExamCategory {
  if (question.subject_id === FIRST_AID_SUBJECT) return "first_aid";
  if (question.subject_id === WEAPONS_SUBJECT) {
    return SAFE_HANDLING_PATTERN.test(question.text) ? "safe_handling" : "weapons";
  }
  if (LEGAL_SUBJECTS.has(question.subject_id)) return "legal";
  return "legal";
}

export function groupByCategory(questions: Question[]): Record<ExamCategory, Question[]> {
  const out: Record<ExamCategory, Question[]> = {
    legal: [],
    weapons: [],
    safe_handling: [],
    first_aid: [],
  };
  for (const q of questions) out[categoryOfQuestion(q)].push(q);
  return out;
}
