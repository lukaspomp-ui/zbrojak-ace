import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchApp,
  DOCUMENTS,
  GLOSSARY,
  fetchProgress,
  fetchProfile,
  QUESTIONS,
  SUBJECTS,
  type AppRow,
  type GlossaryTerm,
  type Question,
  type Subject,
} from "@/lib/data";
import { DEV_OPEN } from "@/lib/app-config";
import { fetchAccuracy } from "@/lib/accuracy";
import { fetchExamHistory } from "@/lib/exam-history";
import { useAuth } from "./use-auth";

/**
 * Exposes the tenant's brand color as `--tenant-primary`. The design system's
 * blaze-orange `--primary` stays intact so the visual identity is consistent.
 */
export function useAppTheme(app: AppRow | null | undefined) {
  useEffect(() => {
    if (!app?.primary_color) return;
    document.documentElement.style.setProperty(
      "--tenant-primary",
      app.primary_color,
    );
  }, [app?.primary_color]);
}

export function useAppQuery() {
  return useQuery({ queryKey: ["app"], queryFn: fetchApp, staleTime: 300_000 });
}

/** Subjects (okruhy) come from the bundled official question file. */
export function useSubjectsQuery(): { data: Subject[] } {
  return { data: SUBJECTS };
}

/** Questions come from the bundled official question file. */
export function useQuestionsQuery(): { data: Question[] } {
  return { data: QUESTIONS };
}

export function useProfileQuery() {
  const { userId } = useAuth();
  const query = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => fetchProfile(userId as string),
    enabled: !!userId,
  });
  // TEMPORARY (DEV_OPEN): everyone is treated as Premium, paywall never shows.
  if (DEV_OPEN) {
    return {
      ...query,
      data: {
        id: userId ?? "dev-open",
        exam_attempts_used: query.data?.exam_attempts_used ?? 0,
        is_premium: true,
      },
    } as typeof query;
  }
  return query;
}

export function useProgressQuery() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["progress", userId],
    queryFn: () => fetchProgress(userId as string),
    enabled: !!userId,
  });
}

/** Historie ostrých testů je vázaná na účet (server), ne na zařízení. */
export function useExamHistoryQuery() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["exam-history", userId],
    queryFn: () => fetchExamHistory(userId as string),
    enabled: !!userId,
  });
}

/** Úspěšnost po okruzích je vázaná na účet (server), ne na zařízení. */
export function useAccuracyQuery() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["accuracy", userId],
    queryFn: () => fetchAccuracy(userId as string),
    enabled: !!userId,
  });
}




/** Glossary terms come from the bundled official glossary file. */
export function useGlossaryQuery(): { data: GlossaryTerm[] } {
  return { data: GLOSSARY };
}

/** Documents come from the bundled file (valid laws + official links). */
export function useDocumentsQuery() {
  return { data: DOCUMENTS };
}
