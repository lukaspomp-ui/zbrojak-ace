import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Markdown } from "@/components/Markdown";
import { Loading } from "@/components/Loading";
import { PageHeader } from "@/components/PageHeader";
import { PracticeRound } from "@/components/PracticeRound";
import {
  useAppQuery,
  useAppTheme,
  useSubjectsQuery,
  useSummariesQuery,
} from "@/hooks/use-exam-data";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "procvicit", label: "Procvičit" },
  { id: "shrnuti", label: "Shrnutí" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export const Route = createFileRoute("/okruh/$subjectId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Okruh — Zbrojní průkaz 2026" },
      {
        name: "description",
        content:
          "Procvičování a shrnutí ke každému okruhu zkoušky ze zbrojního průkazu.",
      },
      { property: "og:title", content: "Okruh — Zbrojní průkaz 2026" },
      {
        property: "og:description",
        content: "Kolo otázek a rychlé shrnutí okruhu.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SubjectDetail,
});

function SubjectDetail() {
  const { subjectId } = Route.useParams();
  const [tab, setTab] = useState<TabId>("procvicit");
  const { data: app } = useAppQuery();
  const { data: subjects } = useSubjectsQuery();
  const { data: summaries } = useSummariesQuery();
  useAppTheme(app);

  const subject = subjects?.find((s) => s.id === subjectId);

  if (!subjects) return <Loading />;

  const subjectSummaries = (summaries ?? []).filter(
    (s) => s.subject_id === subjectId,
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-5 pt-8 safe-bottom">
      <PageHeader
        title={subject?.name ?? "Okruh"}
        eyebrow="Okruh k procvičení"
        icon={BookOpen}
      />

      <div
        role="tablist"
        className="card-surface flex gap-1 p-1"
        aria-label="Části okruhu"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors",
              tab === t.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col gap-3"
      >
        {tab === "procvicit" && (
          <PracticeRound
            subjectId={subjectId}
            title={subject?.name ?? "Procvičování"}
          />
        )}

        {tab === "shrnuti" && (
          <>
            {subjectSummaries.length === 0 ? (
              <div className="card-surface p-5 text-sm text-muted-foreground">
                Shrnutí k tomuto okruhu se připravuje.
              </div>
            ) : (
              subjectSummaries.map((summary) => (
                <div key={summary.id} className="card-surface p-5">
                  <Markdown>{summary.content}</Markdown>
                </div>
              ))
            )}
          </>
        )}
      </motion.div>
    </main>
  );
}
