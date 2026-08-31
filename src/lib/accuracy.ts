import { supabase } from "@/integrations/supabase/client";

export type AccuracyMap = Record<string, { answered: number; correct: number }>;

/**
 * Úspěšnost po okruzích je vázaná na účet (ne na zařízení) — čte se ze serveru,
 * takže se uživateli zobrazí na každém zařízení, kde je přihlášený.
 */
export async function fetchAccuracy(userId: string): Promise<AccuracyMap> {
  const { data, error } = await supabase
    .from("subject_accuracy")
    .select("subject_id, answered, correct")
    .eq("user_id", userId);
  if (error) throw error;
  const map: AccuracyMap = {};
  for (const row of data ?? []) {
    map[row.subject_id] = { answered: row.answered, correct: row.correct };
  }
  return map;
}

/** Zapíše jednu zodpovězenou otázku do úspěšnosti okruhu (server-side upsert). */
export async function recordAccuracy(subjectId: string, correct: boolean): Promise<void> {
  if (!subjectId) return;
  const { error } = await supabase.rpc("bump_subject_accuracy", {
    _subject_id: subjectId,
    _correct: correct,
  });
  if (error) throw error;
}
