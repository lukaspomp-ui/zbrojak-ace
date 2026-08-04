import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchApp,
  fetchDocuments,
  fetchGlossary,
  fetchSummaries,
  fetchProgress,
  fetchProfile,
  QUESTIONS,
  SUBJECTS,
  type AppRow,
  type Question,
  type Subject,
} from "@/lib/data";
import { DEV_OPEN } from "@/lib/app-config";
import { useAuth } from "./use-auth";

/** Applies the tenant's primary color to the design system at runtime. */
export function useAppTheme(app: AppRow | null | undefined) {
  useEffect(() => {
    if (!app?.primary_color) return;
    document.documentElement.style.setProperty("--primary", app.primary_color);
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

export function useDocumentsQuery() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: fetchDocuments,
    staleTime: 300_000,
  });
}
