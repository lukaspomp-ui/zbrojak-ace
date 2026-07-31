import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { QuizRunner, type QuizMode } from "@/components/QuizRunner";
import { Button } from "@/components/Button";
import { useAuth } from "@/hooks/use-auth";
import {
  useAppQuery,
  useAppTheme,
  useProfileQuery,
  useProgressQuery,
  useQuestionsQuery,
  useSubjectsQuery,
} from "@/hooks/use-exam-data";
import {
  EXAM_QUESTION_COUNT,
  FREE_EXAM_ATTEMPTS,
} from "@/lib/app-config";
import {
  availableQuestions,
  consumeExamAttempt,
  shuffle,
  type Question,
} from "@/lib/data";

const searchSchema = z.object({
  mode: z.enum(["exam", "mistakes", "subject"]).default("subject"),
  subjectId: z.string().optional(),
});

export const Route = createFileRoute("/kviz")({
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Test — Zbrojní průkaz 2026" },
      {
        name: "description",
        content:
          "Procvičuj otázky ke zbrojnímu průkazu s okamžitou zpětnou vazbou a vysvětlením paragrafů.",
      },
      { property: "og:title", content: "Test — Zbrojní průkaz 2026" },
      {
        property: "og:description",
        content: "Okamžitá zpětná vazba a vysvětlení paragrafů u každé otázky.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuizPage,
});

function QuizPage() {
  const { mode, subjectId } = Route.useSearch();
  const navigate = useNavigate();
  const { ready, userId } = useAuth();
  const { data: app } = useAppQuery();
  const { data: questions } = useQuestionsQuery();
  const { data: subjects } = useSubjectsQuery();
  const { data: profile } = useProfileQuery();
  const { data: progress } = useProgressQuery();
  useAppTheme(app);

  const isPremium = profile?.is_premium === true;
  const attemptCharged = useRef(false);
  const [blocked, setBlocked] = useState(false);

  // Gate premium features against profiles.is_premium
  useEffect(() => {
    if (!profile) return;
    if (mode === "mistakes" && !isPremium) setBlocked(true);
    if (
      mode === "exam" &&
      !isPremium &&
      (profile.exam_attempts_used ?? 0) >= FREE_EXAM_ATTEMPTS
    ) {
      setBlocked(true);
    }
  }, [profile, isPremium, mode]);

  // Consume the free trial exam attempt once
  useEffect(() => {
    if (mode !== "exam" || !profile || !userId || isPremium) return;
    if (attemptCharged.current || blocked) return;
    attemptCharged.current = true;
    void consumeExamAttempt(userId, profile.exam_attempts_used ?? 0);
  }, [mode, profile, userId, isPremium, blocked]);

  const set = useMemo<Question[] | null>(() => {
    if (!questions || !progress) return null;
    const pool = availableQuestions(questions, isPremium);
    if (mode === "exam") {
      return shuffle(pool).slice(0, EXAM_QUESTION_COUNT);
    }
    if (mode === "mistakes") {
      const wrong = progress
        .filter((p) => !p.mastered && p.times_wrong > 0)
        .sort((a, b) => b.times_wrong - a.times_wrong);
      return wrong
        .map((p) => pool.find((q) => q.id === p.question_id))
        .filter((q): q is Question => !!q);
    }
    return pool.filter((q) => q.subject_id === subjectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, progress, isPremium, mode, subjectId]);

  if (!ready || !userId || !set || !profile || !progress) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (blocked) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-4 px-5">
        <div className="card-surface p-6 text-center">
          <h1 className="text-lg font-bold">Tato část je v Premium</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Odemkni kompletní databázi a procvičování chyb.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Button full onClick={() => navigate({ to: "/premium" })}>
              Zobrazit Premium
            </Button>
            <Link to="/">
              <Button variant="outline" full>
                Zpět na přehled
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const title =
    mode === "exam"
      ? "Ostrý test"
      : mode === "mistakes"
        ? "Mé chyby"
        : (subjects?.find((s) => s.id === subjectId)?.name ?? "Procvičování");

  return (
    <main className="mx-auto w-full max-w-md px-5 pt-6">
      <QuizRunner
        questions={set}
        mode={mode === "exam" ? "exam" : "practice"}
        title={title}
        userId={userId}
        progress={progress}
      />
    </main>
  );
}
