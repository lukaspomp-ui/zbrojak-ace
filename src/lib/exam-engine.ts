import { EXAM_QUESTION_COUNT } from "./app-config";
import {
  categoryOfQuestion,
  EXAM_BLUEPRINT,
  EXAM_CATEGORY_ORDER,
  groupByCategory,
  type ExamCategory,
} from "./exam-categories";
import type { Question } from "./questions";
import { shuffle } from "./shuffle";

export type ExamComposition = Record<ExamCategory, number>;

export class ExamCompositionError extends Error {
  readonly available: ExamComposition;
  constructor(message: string, available: ExamComposition) {
    super(message);
    this.name = "ExamCompositionError";
    this.available = available;
  }
}

function randomQuestions(pool: Question[], count: number): Question[] {
  return shuffle(pool).slice(0, count);
}

export function countByCategory(questions: Question[]): ExamComposition {
  const out: ExamComposition = { legal: 0, weapons: 0, safe_handling: 0, first_aid: 0 };
  for (const q of questions) out[categoryOfQuestion(q)] += 1;
  return out;
}

/**
 * Ostrý test: přesně 17 právní předpisy + 5 nauka + 5 bezpečné nakládání
 * + 3 zdravotnické minimum = 30 otázek, náhodně uvnitř kategorií a poté
 * promíchaných. Skladba se validuje; při nesplnění se test nespustí.
 */
export function generateExam(questions: Question[]): Question[] {
  const groups = groupByCategory(questions);
  const available: ExamComposition = {
    legal: groups.legal.length,
    weapons: groups.weapons.length,
    safe_handling: groups.safe_handling.length,
    first_aid: groups.first_aid.length,
  };

  for (const category of EXAM_CATEGORY_ORDER) {
    if (available[category] < EXAM_BLUEPRINT[category]) {
      throw new ExamCompositionError(
        `Exam engine: nedostatek otázek v kategorii "${category}" (potřeba ${EXAM_BLUEPRINT[category]}, k dispozici ${available[category]}).`,
        available,
      );
    }
  }

  const picked = EXAM_CATEGORY_ORDER.flatMap((category) =>
    randomQuestions(groups[category], EXAM_BLUEPRINT[category]),
  );
  const exam = shuffle(picked);

  validateExam(exam);
  logExam(exam);
  return exam;
}

export function validateExam(exam: Question[]): void {
  const counts = countByCategory(exam);
  const unique = new Set(exam.map((q) => q.id));
  const problems: string[] = [];
  if (exam.length !== EXAM_QUESTION_COUNT) {
    problems.push(`počet otázek ${exam.length} !== ${EXAM_QUESTION_COUNT}`);
  }
  if (unique.size !== exam.length) problems.push("test obsahuje duplicitní otázky");
  for (const category of EXAM_CATEGORY_ORDER) {
    if (counts[category] !== EXAM_BLUEPRINT[category]) {
      problems.push(`${category}: ${counts[category]} !== ${EXAM_BLUEPRINT[category]}`);
    }
  }
  if (problems.length) {
    throw new ExamCompositionError(`Exam engine validace selhala: ${problems.join("; ")}`, counts);
  }
}

function logExam(exam: Question[]): void {
  if (!import.meta.env.DEV) return;
  const counts = countByCategory(exam);
  // eslint-disable-next-line no-console
  console.info(
    `Exam generated:\nlegal: ${counts.legal}\nweapon: ${counts.weapons}\nsafe handling: ${counts.safe_handling}\nfirst aid: ${counts.first_aid}\ntotal: ${exam.length}`,
  );
}
