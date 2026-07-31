import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Flame, Loader2, Target, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
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
import { availableQuestions, type Progress } from "@/lib/data";

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

/** Consecutive days with at least one answered question, ending today/yesterday. */
function computeStreak(progress: Progress[]): number {
  const days = new Set(
    progress
      .map((p) => p.last_answered_at)
      .filter((d): d is string => !!d)
      .map((d) => new Date(d).toISOString().slice(0, 10)),
  );
  if (days.size === 0) return 0;
  const today = new Date();
  const key = (d: Date) => d.toISOString().slice(0, 10);
  const cursor = new Date(today);
  if (!days.has(key(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(key(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(key(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function StatsPage() {
  const { ready } = useAuth();
  const { data: app } = useAppQuery();
  const { data: questions } = useQuestionsQuery();
  const { data: subjects } = useSubjectsQuery();
  const { data: profile } = useProfileQuery();
  const { data: progress } = useProgressQuery();
  useAppTheme(app);

  const isPremium = profile?.is_premium === true;

  if (!ready || !questions || !subjects || !progress) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const pool = availableQuestions(questions, isPremium);
  const inPool = (id: string) => pool.some((q) => q.id === id);
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
        <ProgressRing value={readiness} />
        <div className="min-w-0">
          <p className="text-sm font-semibold">Připravenost na zkoušku</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Zvládnuto {masteredCount} z {pool.length} otázek
          </p>
        </div>
      </motion.section>

      <section className="grid grid-cols-2 gap-3">
        <div className="card-surface p-4">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-primary" />
            Série
          </span>
          <p className="mt-1 text-xl font-bold tabular-nums">
            {streak} {streak === 1 ? "den" : streak >= 5 || streak === 0 ? "dní" : "dny"}
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
    </main>
  );
}
