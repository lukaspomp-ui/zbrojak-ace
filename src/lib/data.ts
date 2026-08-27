import { supabase } from "@/integrations/supabase/client";
import { CURRENT_APP_ID } from "./app-config";
import { applyAnswer, type QuestionState } from "./smart-repetition";

export {
  availableQuestions,
  getQuestion,
  getSubject,
  QUESTIONS,
  QUESTIONS_VERSION,
  SUBJECTS,
} from "./questions";
export { DOCUMENTS, DOCUMENTS_VERSION } from "./documents";
export { GLOSSARY, GLOSSARY_VERSION } from "./glossary";
export { shuffle } from "./shuffle";
export type { GlossaryTerm } from "./glossary";
export type { Answer, AnswerKey, Question, Subject } from "./questions";

export type AppRow = {
  id: string;
  name: string;
  primary_color: string;
  logo_url: string | null;
};

/**
 * Progress rows are keyed on the official question number ("cislo") and are the
 * single source of truth for Smart Repetition.
 */
export type Progress = QuestionState;


export type DocumentRow = {
  id: string;
  subject_id: string | null;
  title: string;
  description: string;
  file_url: string;
  sort_order: number;
};

export type Profile = {
  id: string;
  is_premium: boolean;
  exam_attempts_used: number;
};

export async function fetchApp(): Promise<AppRow | null> {
  const { data, error } = await supabase
    .from("apps")
    .select("id, name, primary_color, logo_url")
    .eq("id", CURRENT_APP_ID)
    .maybeSingle();
  if (error) throw error;
  return (data as AppRow | null) ?? null;
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, is_premium, exam_attempts_used")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return data as Profile;
  // Fallback if the signup trigger has not landed yet.
  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({ id: userId })
    .select("id, is_premium, exam_attempts_used")
    .maybeSingle();
  if (insertError) return null;
  return (created as Profile | null) ?? null;
}

export async function fetchProgress(userId: string): Promise<Progress[]> {
  const { data, error } = await supabase
    .from("user_progress")
    .select("question_id, times_wrong, correct_streak, mastered, last_answered_at")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []) as unknown as Progress[];
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Spaced repetition write: applied after every answer. */
export async function recordAnswer(
  userId: string,
  questionId: number,
  wasCorrect: boolean,
  current: Progress | undefined,
): Promise<Progress> {
  const next: Progress = wasCorrect
    ? {
        question_id: questionId,
        times_wrong: current?.times_wrong ?? 0,
        correct_streak: (current?.correct_streak ?? 0) + 1,
        mastered: (current?.correct_streak ?? 0) + 1 >= MASTERY_STREAK,
      }
    : {
        question_id: questionId,
        times_wrong: (current?.times_wrong ?? 0) + 1,
        correct_streak: 0,
        mastered: false,
      };

  const { error } = await supabase.from("user_progress").upsert(
    {
      user_id: userId,
      question_id: questionId,
      times_wrong: next.times_wrong,
      correct_streak: next.correct_streak,
      mastered: next.mastered,
      last_answered_at: new Date().toISOString(),
    } as never,
    { onConflict: "user_id,question_id" },
  );
  if (error) throw error;
  return next;
}

export async function reportQuestion(
  userId: string,
  questionId: number,
  message: string,
): Promise<void> {
  const { error } = await supabase
    .from("question_reports")
    .insert({ user_id: userId, question_id: questionId, message } as never);
  if (error) throw error;
}

export async function unlockPremium(userId: string): Promise<void> {
  const { error } = await supabase.from("profiles").update({ is_premium: true }).eq("id", userId);
  if (error) throw error;
}

export async function consumeExamAttempt(userId: string, used: number): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ exam_attempts_used: used + 1 })
    .eq("id", userId);
  if (error) throw error;
}

/* ---------- Educational content (data-driven per app_id) ---------- */

export async function fetchDocuments(): Promise<DocumentRow[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("id, subject_key, title, description, file_url, sort_order")
    .eq("app_id", CURRENT_APP_ID)
    .order("sort_order");
  if (error) throw error;
  return (
    (data ?? []) as unknown as (Omit<DocumentRow, "subject_id"> & {
      subject_key: string | null;
    })[]
  ).map(({ subject_key, ...rest }) => ({ ...rest, subject_id: subject_key }));
}

/**
 * Documents may store either an absolute URL or a path inside the private
 * "documents" storage bucket — resolve both to something openable.
 */
export async function resolveDocumentUrl(fileUrl: string): Promise<string> {
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  const path = fileUrl.replace(/^\/+/, "");
  const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) throw error ?? new Error("Soubor nenalezen");
  return data.signedUrl;
}
