import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { Loading } from "@/components/Loading";
import { PageHeader } from "@/components/PageHeader";
import { PracticeRound } from "@/components/PracticeRound";
import { useAppQuery, useAppTheme, useSubjectsQuery } from "@/hooks/use-exam-data";

export const Route = createFileRoute("/okruh/$subjectId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Okruh — Zbrojní průkaz 2026" },
      {
        name: "description",
        content: "Procvičování otázek ke každému okruhu zkoušky ze zbrojního průkazu.",
      },
      { property: "og:title", content: "Okruh — Zbrojní průkaz 2026" },
      {
        property: "og:description",
        content: "Kolo pěti náhodných otázek z vybraného okruhu.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SubjectDetail,
});

function SubjectDetail() {
  const { subjectId } = Route.useParams();
  const { data: app } = useAppQuery();
  const { data: subjects } = useSubjectsQuery();
  useAppTheme(app);

  const subject = subjects?.find((s) => s.id === subjectId);

  if (!subjects) return <Loading />;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-5 pt-8 safe-bottom">
      <PageHeader title={subject?.name ?? "Okruh"} eyebrow="Okruh k procvičení" icon={BookOpen} />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col gap-3"
      >
        <PracticeRound subjectId={subjectId} title={subject?.name ?? "Procvičování"} />
      </motion.div>
    </main>
  );
}
