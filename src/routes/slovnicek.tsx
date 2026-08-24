import { createFileRoute } from "@tanstack/react-router";
import { Search, SpellCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Loading } from "@/components/Loading";
import { PageHeader } from "@/components/PageHeader";
import { PremiumTeaser } from "@/components/PremiumTeaser";
import {
  useAppQuery,
  useAppTheme,
  useGlossaryQuery,
  useProfileQuery,
} from "@/hooks/use-exam-data";

export const Route = createFileRoute("/slovnicek")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Slovníček pojmů — Zbrojní průkaz 2026" },
      {
        name: "description",
        content:
          "Abecední slovníček pojmů ke zkoušce ze zbrojního průkazu s vyhledáváním.",
      },
      {
        property: "og:title",
        content: "Slovníček pojmů — Zbrojní průkaz 2026",
      },
      {
        property: "og:description",
        content: "Vyhledej si pojem a přečti si jeho vysvětlení.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GlossaryPage,
});

function GlossaryPage() {
  const { data: app } = useAppQuery();
  const { data: terms } = useGlossaryQuery();
  const { data: profile } = useProfileQuery();
  useAppTheme(app);
  const isPremium = profile?.is_premium === true;
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const list = [...(terms ?? [])].sort((a, b) =>
      a.term.localeCompare(b.term, "cs"),
    );
    const q = query.trim().toLocaleLowerCase("cs");
    if (!q) return list;
    return list.filter((t) => t.term.toLocaleLowerCase("cs").includes(q));
  }, [terms, query]);

  if (!terms) return <Loading />;

  if (!isPremium) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-5 pt-8 safe-bottom">
        <PageHeader title="Slovníček" eyebrow="Studium" icon={SpellCheck} />
        <PremiumTeaser
          title="Slovníček je v Premium"
          text="Free verze obsahuje okruhy k procvičení, statistiky a Mé chyby. Premium odemkne slovníček pojmů."
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-5 pt-8 safe-bottom">
      <PageHeader
        title="Slovníček"
        eyebrow="Studium"
        icon={SpellCheck}
      />

      <label className="card-surface flex items-center gap-2.5 px-4 py-3">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hledat pojem"
          className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
        />
      </label>

      {filtered.length === 0 ? (
        <div className="card-surface p-5 text-sm text-muted-foreground">
          Žádný pojem neodpovídá hledání.
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {filtered.map((term) => (
            <li key={term.id} className="card-surface p-4">
              <h2 className="text-[15px] font-semibold">{term.term}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {term.definition}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
