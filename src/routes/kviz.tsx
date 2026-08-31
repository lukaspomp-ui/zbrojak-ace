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
import { FREE_EXAM_ATTEMPTS, PRACTICE_ROUND_SIZE } from "@/lib/app-config";
import { getFavorites } from "@/lib/favorites";
import { generateExam } from "@/lib/exam-engine";
import { buildMistakesSet, buildTrainingSet } from "@/lib/smart-repetition";
import { availableQuestions, shuffle, type Question } from "@/lib/data";


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
  const [blocked, setBlocked] = useState(false);
  const [examError, setExamError] = useState<string | null>(null);

  // Free verze: okruhy k procvičení, statistiky, Mé chyby a 1 ostrý test.
  // Premium: neomezené ostré testy a oblíbené otázky.
  const attemptsUsed = profile?.exam_attempts_used ?? 0;
  useEffect(() => {
    if (!profile) return;
    if (mode === "favorites" && !isPremium) setBlocked(true);
    if (mode === "exam" && !isPremium && attemptsUsed >= FREE_EXAM_ATTEMPTS) setBlocked(true);
  }, [profile, isPremium, mode, attemptsUsed]);

  const [round, setRound] = useState(0);
  const lastRoundIds = useRef<number[]>([]);

  const set = useMemo<Question[] | null>(() => {
    if (!questions || !progress) return null;
    const pool = availableQuestions(questions, isPremium);
    if (mode === "exam") {
      // Zákonná skladba: 17 / 5 / 5 / 3 z celého souboru otázek.
      try {
        return generateExam(questions);
      } catch (error) {
        console.error("[exam] nelze sestavit ostrý test", error);
        setExamError(
          error instanceof Error ? error.message : "Ostrý test nelze sestavit ze sady otázek.",
        );
        return [];
      }
    }
    if (mode === "mistakes") {
      return buildMistakesSet(pool, progress).map((entry) => entry.question);
    }
    if (mode === "favorites") {
      const favs = getFavorites();
      return favs.map((id) => questions.find((q) => q.id === id)).filter((q): q is Question => !!q);
    }
    // Procvičování okruhu: Smart Repetition kolo, bez okamžitého opakování.
    const subjectPool = pool.filter((q) => q.subject_id === subjectId);
    const previous = lastRoundIds.current;
    const fresh = subjectPool.filter((q) => !previous.includes(q.id));
    const source = fresh.length >= PRACTICE_ROUND_SIZE ? fresh : subjectPool;
    const picked = buildTrainingSet(source, progress, PRACTICE_ROUND_SIZE);
    lastRoundIds.current = picked.map((q) => q.id);
    return shuffle(picked);

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
            {mode === "exam"
              ? "Zdarma máš jeden ostrý test. Další ostré testy jsou v Premium."
              : "Oblíbené otázky jsou součástí Premium."}
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

  if (mode === "exam" && (examError || set.length === 0)) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-4 px-5">
        <div className="card-surface p-6 text-center">
          <h1 className="text-lg font-bold">Ostrý test nelze spustit</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sadu otázek se nepodařilo sestavit podle zkouškové skladby. Zkus to prosím znovu později.
          </p>
          <Link to="/" className="mt-5 block">
            <Button variant="outline" full>
              Zpět na přehled
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  if (mode === "exam") {
    return <ExamRunner questions={set} userId={userId} progress={progress} title="Ostrý test" />;
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
        {...(mode === "subject" ? { onNextRound: () => setRound((r) => r + 1) } : {})}
        mistakesMode={mode === "mistakes"}
        key={`${mode}-${subjectId ?? ""}-${round}`}
      />
    </main>
  );
}
