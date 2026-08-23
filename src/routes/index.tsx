import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Star } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Crown,
  FileText,
  Flame,
  Lock,
  type LucideIcon,
  Settings,
  Sparkles,
  SpellCheck,
  Timer,
} from "lucide-react";
import { useState } from "react";

import { ProgressRing } from "@/components/ProgressRing";
import { ScopeReticle } from "@/components/ScopeReticle";
import { RankBadge } from "@/components/RankBadge";
import { GroupEmblem } from "@/components/GroupEmblem";
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
import { useLicenseGroup } from "@/lib/license-group";

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
  const { group } = useLicenseGroup();


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
      <header className="flex items-start gap-3">
        <GroupEmblem id={group.id} className="h-14 w-14 shrink-0" />
        <div className="min-w-0 flex-1 pt-1">
          <h1 className="truncate text-xl font-extrabold leading-tight">
            Skupina {group.id}
          </h1>
          <p className="truncate text-xs text-muted-foreground">
            {group.purpose} · {group.passCorrect}/30
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Link
            to="/profil"
            aria-label="Můj profil"
            className="card-surface rounded-full p-2.5 text-muted-foreground"
          >
            <Settings className="h-4 w-4" />
          </Link>
          <RankBadge mastered={masteredCount} />
          {!isPremium && (
            <Link
              to="/premium"
              className="tint-primary flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
            >
              <Crown className="h-3 w-3" />
              Premium
            </Link>
          )}
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

      <CollapsibleSection title="Okruhy k procvičení" icon={BookOpen} defaultOpen>
        {subjects.map((subject, i) => {
          const subjectQuestions = pool.filter(
            (q) => q.subject_id === subject.id,
          );
          const total = subjectQuestions.length;
          const rows = (progress ?? []).filter((p) =>
            subjectQuestions.some((q) => q.id === p.question_id),
          );
          const mastered = rows.filter((p) => p.mastered).length;
          const wrong = rows.filter(
            (p) => !p.mastered && p.times_wrong > 0,
          ).length;
          const nove = Math.max(0, total - mastered - wrong);
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
                    {mastered} zvládnuto · {wrong} chybných · {nove} nových
                  </span>
                  <span className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-elevated">
                    <span
                      className="block h-full"
                      style={{
                        width: `${total ? (mastered / total) * 100 : 0}%`,
                        backgroundColor: "var(--success)",
                      }}
                    />
                    <span
                      className="block h-full"
                      style={{
                        width: `${total ? (wrong / total) * 100 : 0}%`,
                        backgroundColor: "var(--destructive)",
                      }}
                    />
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            </motion.div>
          );
        })}
      </CollapsibleSection>

      <CollapsibleSection title="Studium" icon={Sparkles}>
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
        <StudyLink
          to="/prochazet"
          icon={BookOpen}
          title="Procházet otázky"
          subtitle="Otázky i se správnými odpověďmi"
        />
        <Link
          to="/kviz"
          search={{ mode: "favorites" }}
          className="card-surface flex items-center gap-4 p-4"
        >
          <span className="tint-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <Star className="h-4.5 w-4.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-bold">
              Oblíbené otázky
            </span>
            <span className="block text-xs text-muted-foreground">
              Otázky označené hvězdičkou
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      </CollapsibleSection>

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
  to: "/dokumenty" | "/slovnicek" | "/statistiky" | "/prochazet";
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

function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: LucideIcon;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="card-surface flex w-full items-center justify-between p-4"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <span className="tint-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-[15px] font-bold">{title}</span>
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex flex-col gap-3 overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}



