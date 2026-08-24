import { createFileRoute } from "@tanstack/react-router";
import { FileText, Loader2, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Loading } from "@/components/Loading";
import { Markdown } from "@/components/Markdown";
import { PageHeader, SectionLabel } from "@/components/PageHeader";
import { PremiumTeaser } from "@/components/PremiumTeaser";
import {
  useAppQuery,
  useAppTheme,
  useDocumentsQuery,
  useProfileQuery,
  useSubjectsQuery,
} from "@/hooks/use-exam-data";
import { FREE_DOCUMENT_LIMIT } from "@/lib/app-config";
import { resolveDocumentUrl, type DocumentRow } from "@/lib/data";

export const Route = createFileRoute("/dokumenty")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Dokumenty ke studiu — Zbrojní průkaz 2026" },
      {
        name: "description",
        content:
          "Studijní materiály a dokumenty ke zkoušce ze zbrojního průkazu ke stažení, seřazené podle okruhů.",
      },
      {
        property: "og:title",
        content: "Dokumenty ke studiu — Zbrojní průkaz 2026",
      },
      {
        property: "og:description",
        content: "Materiály ke stažení, přehledně podle okruhů.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DocumentsPage,
});

function DocumentsPage() {
  const { data: app } = useAppQuery();
  const { data: documents } = useDocumentsQuery();
  const { data: subjects } = useSubjectsQuery();
  const { data: profile } = useProfileQuery();
  useAppTheme(app);

  const isPremium = profile?.is_premium === true;

  if (!documents) return <Loading />;

  if (!isPremium) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-5 pt-8 safe-bottom">
        <PageHeader title="Dokumenty" eyebrow="Studium" icon={FileText} />
        <PremiumTeaser
          title="Dokumenty jsou v Premium"
          text="Free verze obsahuje okruhy k procvičení, statistiky a Mé chyby. Premium odemkne dokumenty ke stažení."
        />
      </main>
    );
  }

  const bySubject = new Map<string, DocumentRow[]>();
  const general: DocumentRow[] = [];
  for (const doc of documents) {
    if (doc.subject_id) {
      const list = bySubject.get(doc.subject_id) ?? [];
      list.push(doc);
      bySubject.set(doc.subject_id, list);
    } else {
      general.push(doc);
    }
  }

  const allowed = new Set(
    (isPremium ? documents : documents.slice(0, FREE_DOCUMENT_LIMIT)).map(
      (d) => d.id,
    ),
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-5 pt-8 safe-bottom">
      <PageHeader title="Dokumenty" eyebrow="Studium" icon={FileText} />

      {documents.length === 0 && (
        <div className="card-surface p-5 text-sm text-muted-foreground">
          Zatím tu nejsou žádné dokumenty.
        </div>
      )}

      {general.length > 0 && (
        <DocumentGroup title="Obecné" docs={general} allowed={allowed} />
      )}

      {(subjects ?? []).map((subject) => {
        const docs = bySubject.get(subject.id);
        if (!docs?.length) return null;
        return (
          <DocumentGroup
            key={subject.id}
            title={subject.name}
            docs={docs}
            allowed={allowed}
          />
        );
      })}

      {!isPremium && documents.length > FREE_DOCUMENT_LIMIT && (
        <PremiumTeaser
          title="Všechny dokumenty jsou v Premium"
          text="Ve free verzi je dostupný jeden ukázkový materiál. Premium odemkne všechny dokumenty."
        />
      )}
    </main>
  );
}

function DocumentGroup({
  title,
  docs,
  allowed,
}: {
  title: string;
  docs: DocumentRow[];
  allowed: Set<string>;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <SectionLabel>{title}</SectionLabel>
      {docs.map((doc) => (
        <DocumentCard key={doc.id} doc={doc} locked={!allowed.has(doc.id)} />
      ))}
    </section>
  );
}

function DocumentCard({
  doc,
  locked,
}: {
  doc: DocumentRow;
  locked: boolean;
}) {
  const [opening, setOpening] = useState(false);

  async function open() {
    if (locked) {
      toast.error("Tento dokument je dostupný v Premium.");
      return;
    }
    setOpening(true);
    try {
      const url = await resolveDocumentUrl(doc.file_url);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Soubor se nepodařilo otevřít.");
    } finally {
      setOpening(false);
    }
  }

  return (
    <button
      type="button"
      onClick={open}
      className="card-surface flex items-start gap-4 p-4 text-left active:scale-[0.99]"
    >
      <span className="tint-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
        {locked ? (
          <Lock className="h-4 w-4" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold">{doc.title}</span>
        {doc.description && (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            <Markdown className="text-xs">{doc.description}</Markdown>
          </span>
        )}
      </span>
      {opening && (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
      )}
    </button>
  );
}
