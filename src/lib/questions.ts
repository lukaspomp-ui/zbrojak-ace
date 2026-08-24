import raw from "@/data/zbrojak-otazky.json";
import { FREE_QUESTION_LIMIT } from "./app-config";

type RawFile = {
  verze: string;
  okruhy: string[];
  otazky: {
    cislo: number;
    okruh: string;
    otazka: string;
    A: string;
    B: string;
    C: string;
    spravne: string;
    obrazek: string | null;
    obrazky: string[] | null;
    vysvetleni?: string;
  }[];
};

const file = raw as RawFile;

export type AnswerKey = "A" | "B" | "C";

export type Answer = {
  id: AnswerKey;
  text: string;
  is_correct: boolean;
};

export type Subject = {
  /** Stable slug derived from the okruh order, e.g. "okruh-1". */
  id: string;
  name: string;
  sort_order: number;
};

export type Question = {
  /** Official question number ("cislo") — the unique id across the app. */
  id: number;
  subject_id: string;
  text: string;
  explanation: string;
  images: string[];
  sort_order: number;
  answers: Answer[];
};

/** Version label of the bundled official question file. */
export const QUESTIONS_VERSION = file.verze;

export const SUBJECTS: Subject[] = file.okruhy.map((name, i) => ({
  id: `okruh-${i + 1}`,
  name,
  sort_order: i,
}));

const subjectIdByName = new Map(SUBJECTS.map((s) => [s.name, s.id]));

function imagesOf(q: RawFile["otazky"][number]): string[] {
  const list = q.obrazky?.length ? q.obrazky : q.obrazek ? [q.obrazek] : [];
  return list.map((name) => (name.startsWith("/") ? name : `/${name}`));
}

export const QUESTIONS: Question[] = [...file.otazky]
  .sort((a, b) => a.cislo - b.cislo)
  .map((q) => ({
    id: q.cislo,
    subject_id: subjectIdByName.get(q.okruh) ?? SUBJECTS[0]!.id,
    text: q.otazka,
    explanation: q.vysvetleni ?? "",
    images: imagesOf(q),
    sort_order: q.cislo,
    answers: (["A", "B", "C"] as AnswerKey[]).map((key) => ({
      id: key,
      text: q[key],
      is_correct: q.spravne === key,
    })),
  }));

const questionById = new Map(QUESTIONS.map((q) => [q.id, q]));

export function getQuestion(id: number): Question | undefined {
  return questionById.get(id);
}

export function getSubject(id: string): Subject | undefined {
  return SUBJECTS.find((s) => s.id === id);
}

/** Questions available to the user: free tier = first N by official number. */
export function availableQuestions(questions: Question[], isPremium: boolean): Question[] {
  return isPremium ? questions : questions.slice(0, FREE_QUESTION_LIMIT);
}
