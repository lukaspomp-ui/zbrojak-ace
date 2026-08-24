import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart3, Flame, History, Target, TrendingUp, X } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader, SectionLabel } from "@/components/PageHeader";
import { AnswerReview } from "@/components/AnswerReview";
import { ProgressRing } from "@/components/ProgressRing";
import { ScopeReticle } from "@/components/ScopeReticle";
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
import { useLicenseGroup } from "@/lib/license-group";
import { getAccuracy } from "@/lib/accuracy";

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
  const { group } = useLicenseGroup();

  const [history] = useState<ExamAttempt[]>(() => getExamHistory());
  const [openAttempt, setOpenAttempt] = useState<ExamAttempt | null>(null);

  const isPremium = profile?.is_premium === true;

  if (!ready || !questions || !subjects || !progress) return <Loading />;

  const pool = availableQuestions(questions, isPremium);
  const inPool = (id: number) => pool.some((q) => q.id === id);
  const masteredCount = progress.filter((p) => p.mastered && inPool(p.question_id)).length;
  const readiness = pool.length ? Math.round((masteredCount / pool.length) * 100) : 0;
  const streak = computeStreak(progress);

  const accuracy = getAccuracy();
  const perSubject = subjects.map((subject) => {
    const total = pool.filter((q) => q.subject_id === subject.id).length;
    const mastered = progress.filter(
      (p) => p.mastered && pool.some((q) => q.id === p.question_id && q.subject_id === subject.id),
    ).length;
    const wrong = progress
      .filter((p) => pool.some((q) => q.id === p.question_id && q.subject_id === subject.id))
      .reduce((sum, p) => sum + p.times_wrong, 0);
    const acc = accuracy[subject.id];
    const uspesnost = acc && acc.answered ? Math.round((acc.correct / acc.answered) * 100) : null;
    return {
      ...subject,
      total,
      mastered,
      wrong,
      uspesnost,
      percent: total ? Math.round((mastered / total) * 100) : 0,
    };
  });

  const weakest = [...perSubject]
    .filter((s) => s.total > 0)
    .sort(
      (a, b) =>
        (a.uspesnost ?? 101) - (b.uspesnost ?? 101) || b.wrong - a.wrong || a.percent - b.percent,
    )[0];

  const weakQuestions = progress
    .filter((p) => p.times_wrong > 0 && !p.mastered && inPool(p.question_id))
    .sort((a, b) => b.times_wrong - a.times_wrong)
    .slice(0, 5)
    .map((p) => ({
      progress: p,
      question: pool.find((q) => q.id === p.question_id)!,
    }));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-5 pt-8 safe-bottom">
      <PageHeader title="Statistiky" eyebrow="Tvůj postup" icon={BarChart3} />

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-surface relative flex items-center gap-5 overflow-hidden p-5"
      >
        <ScopeReticle
          className="pointer-events-none absolute -right-16 -top-14 h-64 w-64 text-primary"
          opacity={0.16}
        />
        <div className="relative shrink-0">
          <ScopeReticle
            className="pointer-events-none absolute -inset-4 text-primary"
            opacity={0.3}
          />
          <ProgressRing value={readiness} label="připravenost" />
        </div>
        <div className="relative min-w-0">
          <p className="label-tick">Připravenost na zkoušku</p>
          <p className="mt-2 text-base font-extrabold">{readinessVerdict(readiness)}</p>
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
          <p className="mt-1 text-xl font-bold num">{masteredCount} otázek</p>
        </div>
      </section>

      {weakest && (
        <div className="card-surface flex items-center gap-3 p-4">
          <span className="tint-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <TrendingUp className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Zaměř se sem</p>
            <p className="truncate text-sm font-semibold">
              {weakest.name}
              {weakest.uspesnost !== null && (
                <span className="text-muted-foreground">
                  {" · "}
                  {weakest.uspesnost}% úsp.
                </span>
              )}
            </p>
          </div>
          <Link
            to="/kviz"
            search={{ mode: "subject", subjectId: weakest.id }}
            className="tint-primary shrink-0 rounded-full px-3.5 py-2 text-xs font-bold"
          >
            Procvičit
          </Link>
        </div>
      )}

      <section className="flex flex-col gap-2.5">
        <SectionLabel>
          <History className="h-3.5 w-3.5 text-brass" />
          Historie testů
        </SectionLabel>
        {history.length === 0 ? (
          <p className="card-surface p-4 text-sm text-muted-foreground">{EMPTY_HISTORY}</p>
        ) : (
          <>
            {history.length >= 2 && (
              <div className="card-surface p-4">
                <p className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    Zlepšování
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-0.5 w-4"
                      style={{ background: "var(--brass)" }}
                    />
                    hranice {group.passCorrect}/30
                  </span>
                </p>
                {(() => {
                  const trend = [...history].slice(0, 12).reverse();
                  const passY = 40 - (group.passCorrect / 30) * 40;
                  const pts = trend
                    .map((a, i) => {
                      const x = trend.length > 1 ? (i / (trend.length - 1)) * 100 : 0;
                      const pct = a.total ? (a.correct / a.total) * 100 : 0;
                      return `${x},${40 - (pct / 100) * 40}`;
                    })
                    .join(" ");
                  return (
                    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-24 w-full">
                      <line
                        x1="0"
                        y1={passY}
                        x2="100"
                        y2={passY}
                        stroke="var(--brass)"
                        strokeWidth="1"
                        strokeDasharray="3 2"
                        vectorEffect="non-scaling-stroke"
                      />
                      <polyline
                        points={pts}
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  );
                })()}
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
                    <p className="text-sm font-semibold num">
                      {a.correct}/{a.total} <span className="text-muted-foreground">({pct} %)</span>
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

      <>
        <section className="flex flex-col gap-2.5">
          <SectionLabel>Úspěšnost po okruzích</SectionLabel>
          {perSubject.map((s) => (
            <Link
              key={s.id}
              to="/okruh/$subjectId"
              params={{ subjectId: s.id }}
              className="card-surface block p-4"
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[15px] font-semibold">{s.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground num">
                  Hotovo {s.percent}%
                </span>
              </span>
              <span className="mt-2.5 flex items-center gap-3">
                <span className="block h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
                  <motion.span
                    className="block h-full rounded-full"
                    style={{ backgroundColor: "var(--primary)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${s.percent}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </span>
                {s.uspesnost !== null && (
                  <span
                    className={cn(
                      "num shrink-0 text-xs font-semibold",
                      s.uspesnost >= 80 ? "text-success" : "text-brass",
                    )}
                  >
                    {s.uspesnost}% úsp.
                  </span>
                )}
              </span>
            </Link>
          ))}
        </section>

        <section className="flex flex-col gap-2.5">
          <SectionLabel>Slabá místa</SectionLabel>
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
      {openAttempt && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <button
              type="button"
              onClick={() => setOpenAttempt(null)}
              className="card-surface rounded-full p-2.5 text-muted-foreground"
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
