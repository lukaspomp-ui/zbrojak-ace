import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Archive,
  BarChart3,
  BookOpen,
  Briefcase,
  Check,
  ChevronRight,
  Crown,
  FileText,
  Flame,
  Lock,
  type LucideIcon,
  Medal,
  PawPrint,
  Settings,
  Shield,
  Sparkles,
  SpellCheck,
  Target,
  Timer,
} from "lucide-react";

import { ProgressRing } from "@/components/ProgressRing";
import { ScopeReticle } from "@/components/ScopeReticle";
import { RankBadge } from "@/components/RankBadge";
import { Loading } from "@/components/Loading";
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
import { readinessVerdict, streakLabel } from "@/lib/copy";
import { computeStreak } from "@/lib/streak";
import { LICENSE_GROUPS, useLicenseGroup } from "@/lib/license-group";

const GROUP_ICONS: Record<string, LucideIcon> = {
  Archive,
  Medal,
  PawPrint,
  Briefcase,
  Shield,
};


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
  const { group, select } = useLicenseGroup();

  const isPremium = profile?.is_premium === true;
  const loading = !ready || !questions || !subjects;

  if (loading) return <Loading />;

  const pool = availableQuestions(questions, isPremium);
  const masteredCount = (progress ?? []).filter(
    (p) => p.mastered && pool.some((q) => q.id === p.question_id),
  ).length;
  const percent = pool.length ? (masteredCount / pool.length) * 100 : 0;
  const wrongCount = (progress ?? []).filter(
    (p) => !p.mastered && p.times_wrong > 0,
  ).length;
  const streak = computeStreak(progress ?? []);
  const examAttemptsLeft = isPremium
    ? Infinity
    : Math.max(0, FREE_EXAM_ATTEMPTS - (profile?.exam_attempts_used ?? 0));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-5 pt-8 safe-bottom">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
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
          <div className="min-w-0">
            <h1 className="truncate text-[17px] font-extrabold leading-tight">
              {app?.name ?? "Příprava na zkoušku"}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <RankBadge mastered={masteredCount} />
              {!isPremium && (
                <span className="text-[11px] text-muted-foreground">Free</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isPremium && (
            <Link
              to="/premium"
              className="tint-primary flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold"
            >
              <Crown className="h-3.5 w-3.5" />
              Premium
            </Link>
          )}
          <Link
            to="/profil"
            aria-label="Můj profil"
            className="card-surface rounded-full p-2.5 text-muted-foreground"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero: the scope reticle aims at the readiness ring */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-surface relative overflow-hidden p-5"
      >
        <ScopeReticle
          className="pointer-events-none absolute -right-16 -top-14 h-64 w-64 text-primary"
          opacity={0.16}
        />
        <div className="relative flex items-center gap-5">
          <div className="relative shrink-0">
            <ScopeReticle
              className="pointer-events-none absolute -inset-4 text-primary"
              opacity={0.3}
            />
            <ProgressRing value={percent} label="připravenost" />
          </div>
          <div className="min-w-0">
            <p className="label-tick">Připravenost na zkoušku</p>
            <p className="mt-2 text-lg font-extrabold leading-tight">
              {readinessVerdict(percent)}
            </p>
            <p className="num mt-1 text-xs leading-relaxed text-muted-foreground">
              Zvládnuto {masteredCount} z {pool.length} otázek
              {!isPremium && questions.length > FREE_QUESTION_LIMIT
                ? ` · free ${FREE_QUESTION_LIMIT}`
                : ""}
            </p>
            {wrongCount > 0 && (
              <p className="num mt-2 text-xs font-semibold text-destructive">
                {wrongCount} otázek k opravě
              </p>
            )}
          </div>
        </div>
        <div className="brass-rule my-4" />
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-primary" />
            {streak > 0 ? streakLabel(streak) : "Dnes ještě bez zásahu"}
          </span>
          <span className="num text-xs font-bold text-brass">
            {Math.round(percent)} %
          </span>
        </div>
      </motion.section>

      <section className="flex flex-col gap-3">
        <h2 className="label-tick">
          <span className="h-2 w-2 rounded-full bg-brass" />
          Vyber skupinu zbrojního průkazu
        </h2>
        {LICENSE_GROUPS.map((g) => {
          const Icon = GROUP_ICONS[g.iconName];
          const active = group.id === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => select(g.id)}
              aria-pressed={active}
              className={
                active
                  ? "card-surface flex items-center gap-4 border border-primary bg-primary/10 p-4 text-left"
                  : "card-surface flex items-center gap-4 p-4 text-left"
              }
            >
              <span className="tint-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-bold">
                  {g.id} — {g.purpose}
                </span>
                <span className="num block text-xs text-muted-foreground">
                  {g.scopeLabel} · {g.passCorrect} z 30
                </span>
              </span>
              {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
            </button>
          );
        })}
      </section>

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
        {!isPremium && (
          <p className="text-center text-[11px] text-muted-foreground">
            {examAttemptsLeft > 0
              ? `Zbývá ${examAttemptsLeft} zkušební ostrý test`
              : "Zkušební ostrý test jsi využil"}
          </p>
        )}

        <div className="grid grid-cols-3 gap-3">
          <Tile
            label="Mé chyby"
            icon={Sparkles}
            locked={!isPremium}
            onClick={() =>
              isPremium
                ? navigate({ to: "/kviz", search: { mode: "mistakes" } })
                : navigate({ to: "/premium" })
            }
          />
          <Tile
            label="Statistiky"
            icon={BarChart3}
            onClick={() => navigate({ to: "/statistiky" })}
          />
          <Tile
            label="Dokumenty"
            icon={FileText}
            onClick={() => navigate({ to: "/dokumenty" })}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="label-tick">
          <span className="h-2 w-2 rounded-full bg-brass" />
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
          const pct = subjectQuestions.length
            ? Math.round((mastered / subjectQuestions.length) * 100)
            : 0;
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
                  <span className="block truncate text-[15px] font-bold">
                    {subject.name}
                  </span>
                  <span className="num block text-xs text-muted-foreground">
                    {mastered} / {subjectQuestions.length} zvládnuto
                  </span>
                  <span className="mt-2 block h-1 overflow-hidden rounded-full bg-elevated">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: "var(--primary)",
                      }}
                    />
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            </motion.div>
          );
        })}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="label-tick">
          <span className="h-2 w-2 rounded-full bg-brass" />
          Studium
        </h2>
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

function Tile({
  label,
  icon: Icon,
  onClick,
  locked,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  locked?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card-surface flex flex-col items-center gap-2 px-2 py-4 text-center transition-transform active:scale-[0.97]"
    >
      <span className="tint-primary flex h-9 w-9 items-center justify-center rounded-lg">
        {locked ? <Lock className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </span>
      <span className="text-[12px] font-bold leading-tight">{label}</span>
    </button>
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
        <span className="block truncate text-[15px] font-bold">{title}</span>
        <span className="block text-xs text-muted-foreground">{subtitle}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
