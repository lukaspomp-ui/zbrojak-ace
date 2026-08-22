import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Flame,
  History,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { AnswerReview } from "@/components/AnswerReview";
import { ProgressRing } from "@/components/ProgressRing";
import { PremiumTeaser } from "@/components/PremiumTeaser";
import { useAuth } from "@/hooks/use-auth";
import {
  useAppQuery,
  useAppTheme,
  useProfileQuery,
  useProgressQuery,
  useQuestionsQuery,
  useSubjectsQuery,
} from "@/hooks/use-exam-data";
import { availableQuestions, QUESTIONS } from "@/lib/data";
import { computeStreak } from "@/lib/streak";
import { EMPTY_HISTORY, readinessVerdict, streakLabel } from "@/lib/copy";
import { Loading } from "@/components/Loading";
import { getExamHistory, type ExamAttempt } from "@/lib/exam-history";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/statistiky")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Statistiky přípravy — Zbrojní průkaz 2026" },
      {
        name: "description",
        content:
          "Připravenost na zkoušku, úspěšnost po okruzích, slabá místa a série aktivních dnů.",
      },
      {
        property: "og:title",
        content: "Statistiky přípravy — Zbrojní průkaz 2026",
      },
      {
        property: "og:description",
        content: "Sleduj svou připravenost na zkoušku a odhal slabá místa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  const { ready } = useAuth();
  const { data: app } = useAppQuery();
  const { data: questions } = useQuestionsQuery();
  const { data: subjects } = useSubjectsQuery();
  const { data: profile } = useProfileQuery();
  const { data: progress } = useProgressQuery();
  useAppTheme(app);

  const [history] = useState<ExamAttempt[]>(() => getExamHistory());
  const [openAttempt, setOpenAttempt] = useState<ExamAttempt | null>(null);

  const isPremium = profile?.is_premium === true;

  if (!ready || !questions || !subjects || !progress) return <Loading />;

  const pool = availableQuestions(questions, isPremium);
  const inPool = (id: number) => pool.some((q) => q.id === id);
  const masteredCount = progress.filter(
    (p) => p.mastered && inPool(p.question_id),
  ).length;
  const readiness = pool.length
    ? Math.round((masteredCount / pool.length) * 100)
    : 0;
  const streak = computeStreak(progress);

  const perSubject = subjects.map((subject) => {
    const total = pool.filter((q) => q.subject_id === subject.id).length;
    const mastered = progress.filter(
      (p) =>
        p.mastered &&
        pool.some((q) => q.id === p.question_id && q.subject_id === subject.id),
    ).length;
    const wrong = progress
      .filter((p) =>
        pool.some((q) => q.id === p.question_id && q.subject_id === subject.id),
      )
      .reduce((sum, p) => sum + p.times_wrong, 0);
    return {
      ...subject,
      total,
      mastered,
      wrong,
      percent: total ? Math.round((mastered / total) * 100) : 0,
    };
  });

  const weakest = [...perSubject]
    .filter((s) => s.total > 0)
    .sort((a, b) => b.wrong - a.wrong || a.percent - b.percent)[0];

  const weakQuestions = progress
    .filter((p) => p.times_wrong > 0 && !p.mastered && inPool(p.question_id))
    .sort((a, b) => b.times_wrong - a.times_wrong)
    .slice(0, 5)
    .map((p) => ({
      progress: p,
      question: pool.find((q) => q.id === p.question_id)!,
    }));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-5 pt-6 safe-bottom">
      <header className="flex items-center gap-3">
        <Link
          to="/"
          className="rounded-full bg-card p-2.5 text-muted-foreground"
          aria-label="Zpět"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-[17px] font-bold">Statistiky</h1>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-surface flex items-center gap-5 p-5"
      >
        <ProgressRing value={readiness} label="připravenost" />
        <div className="min-w-0">
          <p className="label-tick">Připravenost na zkoušku</p>
          <p className="mt-2 text-base font-extrabold">
            {readinessVerdict(readiness)}
          </p>
          <p className="num mt-1 text-xs leading-relaxed text-muted-foreground">
            Zvládnuto {masteredCount} z {pool.length} otázek
          </p>
        </div>
      </motion.section>

      <section className="grid grid-cols-2 gap-3">
        <div className="card-surface p-4">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-primary" />
            Na střelnici
          </span>
          <p className="num mt-1 text-sm font-extrabold leading-snug">
            {streak > 0 ? streakLabel(streak) : "Zatím bez série"}
          </p>
        </div>
        <div className="card-surface p-4">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Target className="h-3.5 w-3.5 text-primary" />
            Zvládnuto
          </span>
          <p className="mt-1 text-xl font-bold tabular-nums">
            {masteredCount} otázek
          </p>
        </div>
      </section>

      {weakest && (
        <p className="card-surface flex items-center gap-2 p-4 text-sm">
          <TrendingUp className="h-4 w-4 shrink-0 text-primary" />
          <span>
            Zaměř se na:{" "}
            <span className="font-semibold">{weakest.name}</span>
          </span>
        </p>
      )}

      <section className="flex flex-col gap-2.5">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <History className="h-4 w-4" />
          Historie testů
        </h2>
        {history.length === 0 ? (
          <p className="card-surface p-4 text-sm text-muted-foreground">
            {EMPTY_HISTORY}
          </p>
        ) : (
          <>
            {history.length >= 2 && (
              <div className="card-surface p-4">
                <p className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  Zlepšování (poslední testy)
                </p>
                <div className="flex h-24 items-end gap-1.5">
                  {[...history]
                    .slice(0, 12)
                    .reverse()
                    .map((a) => {
                      const pct = a.total
                        ? Math.round((a.correct / a.total) * 100)
                        : 0;
                      return (
                        <div
                          key={a.id}
                          className="flex flex-1 items-end justify-center self-stretch"
                          title={`${pct} %`}
                        >
                          <span
                            className="w-full rounded-t"
                            style={{
                              height: `${Math.max(pct, 4)}%`,
                              backgroundColor: a.passed
                                ? "var(--success)"
                                : "var(--destructive)",
                            }}
                          />
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            {history.slice(0, 10).map((a) => {
              const pct = a.total ? Math.round((a.correct / a.total) * 100) : 0;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setOpenAttempt(a)}
                  className="card-surface flex items-center justify-between gap-3 p-4 text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold tabular-nums">
                      {a.correct}/{a.total}{" "}
                      <span className="text-muted-foreground">({pct} %)</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(a.date).toLocaleString("cs-CZ", {
                        day: "numeric",
                        month: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      a.passed
                        ? "bg-success/20 text-success"
                        : "bg-destructive/20 text-destructive",
                    )}
                  >
                    {a.passed ? "Prospěl" : "Neprospěl"}
                  </span>
                </button>
              );
            })}
          </>
        )}
      </section>

      {isPremium ? (
        <>
          <section className="flex flex-col gap-2.5">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Úspěšnost po okruzích
            </h2>
            {perSubject.map((s) => (
              <Link
                key={s.id}
                to="/okruh/$subjectId"
                params={{ subjectId: s.id }}
                className="card-surface block p-4"
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[15px] font-semibold">
                    {s.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {s.mastered} / {s.total}
                  </span>
                </span>
                <span className="mt-2.5 block h-1.5 overflow-hidden rounded-full bg-elevated">
                  <motion.span
                    className="block h-full rounded-full"
                    style={{ backgroundColor: "var(--primary)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${s.percent}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </span>
              </Link>
            ))}
          </section>

          <section className="flex flex-col gap-2.5">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Slabá místa
            </h2>
            {weakQuestions.length === 0 ? (
              <p className="card-surface p-4 text-sm text-muted-foreground">
                Zatím žádné chyby — pokračuj v procvičování.
              </p>
            ) : (
              <>
                {weakQuestions.map(({ progress: p, question }) => (
                  <div key={p.question_id} className="card-surface p-4">
                    <p className="text-sm leading-snug">{question.text}</p>
                    <p className="mt-1.5 text-xs font-medium text-destructive">
                      {p.times_wrong}× chybně
                    </p>
                  </div>
                ))}
                <Link
                  to="/kviz"
                  search={{ mode: "mistakes" }}
                  className="tint-primary rounded-2xl px-4 py-3 text-center text-sm font-semibold"
                >
                  Procvičit mé chyby
                </Link>
              </>
            )}
          </section>
        </>
      ) : (
        <PremiumTeaser
          title="Kompletní statistiky jsou v Premium"
          text="Premium ukáže úspěšnost po jednotlivých okruzích a tvá slabá místa s otázkami k opravě."
        />
      )}
      {openAttempt && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <button
              type="button"
              onClick={() => setOpenAttempt(null)}
              className="rounded-full bg-card p-2.5 text-muted-foreground"
              aria-label="Zavřít"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                Test {openAttempt.correct}/{openAttempt.total}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(openAttempt.date).toLocaleString("cs-CZ", {
                  day: "numeric",
                  month: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <div className="mx-auto w-full max-w-md flex-1 overflow-y-auto px-5 py-5 safe-bottom">
            <AnswerReview
              questions={openAttempt.questionIds
                .map((id) => QUESTIONS.find((q) => q.id === id))
                .filter((q): q is (typeof QUESTIONS)[number] => !!q)}
              answers={openAttempt.answers}
            />
          </div>
        </div>
      )}
    </main>
  );
}
