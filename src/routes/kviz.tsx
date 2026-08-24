import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loading } from "@/components/Loading";
import { z } from "zod";
import { QuizRunner } from "@/components/QuizRunner";
import { ExamRunner } from "@/components/ExamRunner";
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
  PRACTICE_ROUND_SIZE,
} from "@/lib/app-config";
import { getFavorites } from "@/lib/favorites";
import {
  availableQuestions,
  consumeExamAttempt,
  shuffle,
  type Question,
} from "@/lib/data";

const searchSchema = z.object({
  mode: z.enum(["exam", "mistakes", "subject", "favorites"]).default("subject"),
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

  // Free verze: okruhy k procvičení, statistiky a Mé chyby.
  // Premium: ostrý test a oblíbené otázky.
  useEffect(() => {
    if (!profile) return;
    if ((mode === "exam" || mode === "favorites") && !isPremium) {
      setBlocked(true);
    }
  }, [profile, isPremium, mode]);


  const [round, setRound] = useState(0);
  const lastRoundIds = useRef<number[]>([]);

  const set = useMemo<Question[] | null>(() => {
    if (!questions || !progress) return null;
    const pool = availableQuestions(questions, isPremium);
    if (mode === "exam") {
      // Zákon: 30 otázek losovaných z celého souboru (ne z omezené sady).
      return shuffle(questions).slice(0, EXAM_QUESTION_COUNT);
    }
    if (mode === "mistakes") {
      const wrong = progress
        .filter((p) => !p.mastered && p.times_wrong > 0)
        .sort((a, b) => b.times_wrong - a.times_wrong);
      return wrong
        .map((p) => pool.find((q) => q.id === p.question_id))
        .filter((q): q is Question => !!q);
    }
    if (mode === "favorites") {
      const favs = getFavorites();
      return favs
        .map((id) => questions.find((q) => q.id === id))
        .filter((q): q is Question => !!q);
    }
    // Subject practice: a fresh random round, avoiding an exact repeat.
    const subjectPool = pool.filter((q) => q.subject_id === subjectId);
    if (subjectPool.length <= PRACTICE_ROUND_SIZE) return shuffle(subjectPool);
    const previous = lastRoundIds.current;
    const fresh = subjectPool.filter((q) => !previous.includes(q.id));
    const picked = shuffle(fresh).slice(0, PRACTICE_ROUND_SIZE);
    if (picked.length < PRACTICE_ROUND_SIZE) {
      const filler = shuffle(
        subjectPool.filter((q) => !picked.some((p) => p.id === q.id)),
      ).slice(0, PRACTICE_ROUND_SIZE - picked.length);
      picked.push(...filler);
    }
    lastRoundIds.current = picked.map((q) => q.id);
    return shuffle(picked);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, progress, isPremium, mode, subjectId, round]);


  if (!ready || !userId || !set || !profile || !progress) {
    return <Loading />;
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

  if (mode === "exam") {
    return (
      <ExamRunner
        questions={set}
        userId={userId}
        progress={progress}
        title="Ostrý test"
      />
    );
  }

  const title =
    mode === "mistakes"
      ? "Mé chyby"
      : mode === "favorites"
        ? "Oblíbené otázky"
        : (subjects?.find((s) => s.id === subjectId)?.name ?? "Procvičování");

  return (
    <main className="mx-auto w-full max-w-md px-5 pt-6">
      <QuizRunner
        questions={set}
        mode="practice"
        title={title}
        userId={userId}
        progress={progress}
        {...(mode === "subject"
          ? { onNextRound: () => setRound((r) => r + 1) }
          : {})}
        key={`${mode}-${subjectId ?? ""}-${round}`}
      />
    </main>
  );
}
