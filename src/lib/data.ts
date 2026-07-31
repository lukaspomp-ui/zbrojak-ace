import { supabase } from "@/integrations/supabase/client";
import {
  CURRENT_APP_ID,
  FREE_QUESTION_LIMIT,
  MASTERY_STREAK,
} from "./app-config";

export type AppRow = {
  id: string;
  name: string;
  primary_color: string;
  logo_url: string | null;
};

export type Subject = {
  id: string;
  app_id: string;
  name: string;
  sort_order: number;
};

export type Answer = {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
  sort_order: number;
};

export type Question = {
  id: string;
  app_id: string;
  subject_id: string;
  text: string;
  explanation: string;
  image_url: string | null;
  sort_order: number;
  answers: Answer[];
};

export type Progress = {
  question_id: string;
  times_wrong: number;
  correct_streak: number;
  mastered: boolean;
};

export type Profile = {
  id: string;
  is_premium: boolean;
  exam_attempts_used: number;
};

const QUESTION_SELECT =
  "id, app_id, subject_id, text, explanation, image_url, sort_order, answers(id, question_id, text, is_correct, sort_order)";

function sortAnswers(rows: Question[]): Question[] {
  return rows.map((q) => ({
    ...q,
    answers: [...(q.answers ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  }));
}

export async function fetchApp(): Promise<AppRow | null> {
  const { data, error } = await supabase
    .from("apps")
    .select("id, name, primary_color, logo_url")
    .eq("id", CURRENT_APP_ID)
    .maybeSingle();
  if (error) throw error;
  return (data as AppRow | null) ?? null;
}

export async function fetchSubjects(): Promise<Subject[]> {
  const { data, error } = await supabase
    .from("subjects")
    .select("id, app_id, name, sort_order")
    .eq("app_id", CURRENT_APP_ID)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as Subject[];
}

/** All questions of the app, in stable order (used for free-tier slicing). */
export async function fetchQuestions(): Promise<Question[]> {
  const { data, error } = await supabase
    .from("questions")
    .select(QUESTION_SELECT)
    .eq("app_id", CURRENT_APP_ID)
    .order("sort_order");
  if (error) throw error;
  return sortAnswers((data ?? []) as unknown as Question[]);
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
    .select("question_id, times_wrong, correct_streak, mastered")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []) as Progress[];
}

/** Questions available to the user given their entitlement. */
export function availableQuestions(
  questions: Question[],
  isPremium: boolean,
): Question[] {
  return isPremium ? questions : questions.slice(0, FREE_QUESTION_LIMIT);
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
  questionId: string,
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
    },
    { onConflict: "user_id,question_id" },
  );
  if (error) throw error;
  return next;
}

export async function reportQuestion(
  userId: string,
  questionId: string,
  message: string,
): Promise<void> {
  const { error } = await supabase
    .from("question_reports")
    .insert({ user_id: userId, question_id: questionId, message });
  if (error) throw error;
}

export async function unlockPremium(userId: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ is_premium: true })
    .eq("id", userId);
  if (error) throw error;
}

export async function consumeExamAttempt(
  userId: string,
  used: number,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ exam_attempts_used: used + 1 })
    .eq("id", userId);
  if (error) throw error;
}
