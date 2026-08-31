import { supabase } from "@/integrations/supabase/client";
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

const MAX = 100;

/**
 * Historie ostrých testů je vázaná na účet — uloží se na server, takže ji
 * uživatel vidí na každém zařízení, kde je přihlášený (nejnovější první).
 */
export async function fetchExamHistory(userId: string): Promise<ExamAttempt[]> {
  const { data, error } = await supabase
    .from("exam_attempts")
    .select("id, taken_at, correct, total, passed, sections, question_ids, answers")
    .eq("user_id", userId)
    .order("taken_at", { ascending: false })
    .limit(MAX);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    date: row.taken_at,
    correct: row.correct,
    total: row.total,
    passed: row.passed,
    sections: (row.sections ?? []) as unknown as SectionScore[],
    questionIds: (row.question_ids ?? []) as unknown as number[],
    answers: (row.answers ?? {}) as unknown as Record<number, AnswerKey>,
  }));
}

export async function saveExamAttempt(
  userId: string,
  attempt: Omit<ExamAttempt, "id">,
): Promise<void> {
  const { error } = await supabase.from("exam_attempts").insert({
    user_id: userId,
    taken_at: attempt.date,
    correct: attempt.correct,
    total: attempt.total,
    passed: attempt.passed,
    sections: attempt.sections as never,
    question_ids: attempt.questionIds as never,
    answers: attempt.answers as never,
  });
  if (error) throw error;
}
