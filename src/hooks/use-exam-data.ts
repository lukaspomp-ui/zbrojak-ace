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




export function useSummariesQuery() {
  return useQuery({
    queryKey: ["summaries"],
    queryFn: fetchSummaries,
    staleTime: 300_000,
  });
}

export function useGlossaryQuery() {
  return useQuery({
    queryKey: ["glossary"],
    queryFn: fetchGlossary,
    staleTime: 300_000,
  });
}

/** Documents come from the bundled file (valid laws + official links). */
export function useDocumentsQuery() {
  return { data: DOCUMENTS };
}
