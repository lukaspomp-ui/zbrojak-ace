import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchApp,
  fetchDocuments,
  fetchGlossary,
  fetchLessons,
  fetchSummaries,
  fetchProgress,
  fetchProfile,
  fetchQuestions,
  fetchSubjects,
  type AppRow,
} from "@/lib/data";
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

export function useSubjectsQuery() {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: fetchSubjects,
    staleTime: 300_000,
  });
}

export function useQuestionsQuery() {
  return useQuery({
    queryKey: ["questions"],
    queryFn: fetchQuestions,
    staleTime: 300_000,
  });
}

export function useProfileQuery() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: () => fetchProfile(userId as string),
    enabled: !!userId,
  });
}

export function useProgressQuery() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["progress", userId],
    queryFn: () => fetchProgress(userId as string),
    enabled: !!userId,
  });
}

export function useLessonsQuery() {
  return useQuery({
    queryKey: ["lessons"],
    queryFn: fetchLessons,
    staleTime: 300_000,
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
