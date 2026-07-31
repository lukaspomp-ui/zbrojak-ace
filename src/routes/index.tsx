import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  Crown,
  FileText,
  Loader2,
  Lock,
  type LucideIcon,
  Settings,
  Sparkles,
  SpellCheck,
  Target,
  Timer,
} from "lucide-react";
import { ProgressRing } from "@/components/ProgressRing";
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
import { FREE_EXAM_ATTEMPTS, FREE_QUESTION_LIMIT } from "@/lib/app-config";
import { availableQuestions } from "@/lib/data";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Zbrojní průkaz 2026 — testy a procvičování" },
      {
        name: "description",
        content:
          "Připrav se na zkoušku ze zbrojního průkazu 2026. Ostré testy, procvičování chyb a vysvětlení paragrafů v mobilu.",
      },
      { property: "og:title", content: "Zbrojní průkaz 2026 — testy a procvičování" },
      {
        property: "og:description",
        content:
          "Ostré testy, chytré opakování chyb a kompletní vysvětlení paragrafů.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const { ready, isGuest } = useAuth();
  const { data: app } = useAppQuery();
  const { data: subjects } = useSubjectsQuery();
  const { data: questions } = useQuestionsQuery();
  const { data: profile } = useProfileQuery();
  const { data: progress } = useProgressQuery();
  useAppTheme(app);

  const isPremium = profile?.is_premium === true;
  const loading = !ready || !questions || !subjects;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const pool = availableQuestions(questions, isPremium);
  const masteredCount = (progress ?? []).filter(
    (p) => p.mastered && pool.some((q) => q.id === p.question_id),
  ).length;
  const percent = pool.length ? (masteredCount / pool.length) * 100 : 0;
  const wrongCount = (progress ?? []).filter(
    (p) => !p.mastered && p.times_wrong > 0,
  ).length;
  const examAttemptsLeft = isPremium
    ? Infinity
    : Math.max(0, FREE_EXAM_ATTEMPTS - (profile?.exam_attempts_used ?? 0));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-5 pt-8 safe-bottom">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {app?.logo_url ? (
            <img
              src={app.logo_url}
              alt={app.name}
              className="h-10 w-10 rounded-xl object-cover"
            />
          ) : (
            <span className="tint-primary flex h-10 w-10 items-center justify-center rounded-xl">
              <Target className="h-5 w-5" />
            </span>
          )}
          <div>
            <h1 className="text-[17px] font-bold leading-tight">
              {app?.name ?? "Příprava na zkoušku"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isPremium ? "Premium" : "Free verze"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isPremium && (
            <Link
              to="/premium"
              className="tint-primary flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold"
            >
              <Crown className="h-3.5 w-3.5" />
              Premium
            </Link>
          )}
          <Link
            to="/profil"
            aria-label="Můj profil"
            className="rounded-full bg-card p-2.5 text-muted-foreground"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-surface flex items-center gap-5 p-5"
      >
        <ProgressRing value={percent} />
        <div className="min-w-0">
          <p className="text-sm font-semibold">Tvůj pokrok</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Zvládnuto {masteredCount} z {pool.length} otázek
            {!isPremium && questions.length > FREE_QUESTION_LIMIT
              ? ` · free ${FREE_QUESTION_LIMIT}`
              : ""}
          </p>
          {wrongCount > 0 && (
            <p className="mt-2 text-xs font-medium text-destructive">
              {wrongCount} otázek k opravě
            </p>
          )}
        </div>
      </motion.section>

      <section className="flex flex-col gap-3">
        <Button
          full
          onClick={() =>
            examAttemptsLeft > 0
              ? navigate({ to: "/kviz", search: { mode: "exam" } })
              : navigate({ to: "/premium" })
          }
        >
          <Timer className="h-4 w-4" />
          Spustit ostrý test
          {!isPremium && examAttemptsLeft <= 0 && <Lock className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          full
          onClick={() =>
            isPremium
              ? navigate({ to: "/kviz", search: { mode: "mistakes" } })
              : navigate({ to: "/premium" })
          }
        >
          <Sparkles className="h-4 w-4 text-primary" />
          Procvičit mé chyby
          {!isPremium && <Lock className="h-4 w-4 text-muted-foreground" />}
        </Button>
        {!isPremium && (
          <p className="text-center text-[11px] text-muted-foreground">
            {examAttemptsLeft > 0
              ? `Zbývá ${examAttemptsLeft} zkušební ostrý test`
              : "Zkušební ostrý test jsi využil"}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Okruhy k procvičení
        </h2>
        {subjects.map((subject, i) => {
          const subjectQuestions = pool.filter(
            (q) => q.subject_id === subject.id,
          );
          const mastered = (progress ?? []).filter(
            (p) =>
              p.mastered &&
              subjectQuestions.some((q) => q.id === p.question_id),
          ).length;
          return (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              <Link
                to="/okruh/$subjectId"
                params={{ subjectId: subject.id }}
                className="card-surface flex items-center gap-4 p-4"
              >
                <span className="tint-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                  <BookOpen className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">
                    {subject.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {mastered} / {subjectQuestions.length} zvládnuto
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            </motion.div>
          );
        })}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Studium</h2>
        <StudyLink
          to="/dokumenty"
          icon={FileText}
          title="Dokumenty"
          subtitle="Materiály ke stažení"
        />
        <StudyLink
          to="/slovnicek"
          icon={SpellCheck}
          title="Slovníček"
          subtitle="Pojmy a jejich vysvětlení"
        />
        <StudyLink
          to="/statistiky"
          icon={BarChart3}
          title="Statistiky"
          subtitle="Připravenost a slabá místa"
        />
      </section>

      {isGuest && (
        <Link
          to="/prihlaseni"
          className="text-center text-xs text-muted-foreground underline"
        >
          Zkoušíš jako host — zaregistrovat se a nepřijít o pokrok
        </Link>
      )}
    </main>
  );
}

function StudyLink({
  to,
  icon: Icon,
  title,
  subtitle,
}: {
  to: "/dokumenty" | "/slovnicek" | "/statistiky";
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <Link to={to} className="card-surface flex items-center gap-4 p-4">
      <span className="tint-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{subtitle}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
