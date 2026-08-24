import { createFileRoute } from "@tanstack/react-router";
import { Check, ListChecks, Search, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ZoomableImage } from "@/components/ZoomableImage";
import { PremiumTeaser } from "@/components/PremiumTeaser";
import {
  useAppQuery,
  useAppTheme,
  useProfileQuery,
} from "@/hooks/use-exam-data";
import { QUESTIONS, SUBJECTS } from "@/lib/data";
import { useFavorites } from "@/lib/favorites";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/prochazet")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Procházet otázky — Zbrojní průkaz 2026" },
      {
        name: "description",
        content:
          "Projdi si testové otázky i se správnými odpověďmi bez časového limitu.",
      },
    ],
  }),
  component: BrowsePage,
});

const PAGE = 30;

function BrowsePage() {
  const { data: app } = useAppQuery();
  const { data: profile } = useProfileQuery();
  useAppTheme(app);
  const isPremium = profile?.is_premium === true;
  const { favorites, isFavorite, toggle } = useFavorites();
  const [subjectId, setSubjectId] = useState<string>(SUBJECTS[0]?.id ?? "");
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("cs");
    return QUESTIONS.filter((question) => {
      if (onlyFavs) {
        if (!favorites.includes(question.id)) return false;
      } else if (question.subject_id !== subjectId) {
        return false;
      }
      if (q && !question.text.toLocaleLowerCase("cs").includes(q)) return false;
      return true;
    });
  }, [subjectId, onlyFavs, query, favorites]);

  const shown = filtered.slice(0, limit);

  if (!isPremium) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-5 pt-8 safe-bottom">
        <PageHeader
          title="Procházet otázky"
          eyebrow="Studium"
          icon={ListChecks}
        />
        <PremiumTeaser
          title="Procházení otázek je v Premium"
          text="Free verze obsahuje okruhy k procvičení, statistiky a Mé chyby. Premium odemkne procházení otázek i oblíbené."
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-5 pt-8 safe-bottom">
      <PageHeader title="Procházet otázky" eyebrow="Studium" icon={ListChecks} />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setOnlyFavs(true);
            setLimit(PAGE);
          }}
          className={cn(
            "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold",
            onlyFavs ? "tint-primary" : "card-surface text-muted-foreground",
          )}
        >
          <Star className="h-3.5 w-3.5" /> Oblíbené ({favorites.length})
        </button>
        {SUBJECTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setOnlyFavs(false);
              setSubjectId(s.id);
              setLimit(PAGE);
            }}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold",
              !onlyFavs && subjectId === s.id
                ? "tint-primary"
                : "card-surface text-muted-foreground",
            )}
          >
            {s.name.split(".")[0]}
          </button>
        ))}
      </div>

      <label className="card-surface flex items-center gap-2.5 px-4 py-3">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(PAGE);
          }}
          placeholder="Hledat v otázkách"
          className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
        />
      </label>

      {shown.length === 0 ? (
        <div className="card-surface p-5 text-sm text-muted-foreground">
          {onlyFavs
            ? "Zatím nemáš žádné oblíbené otázky. Označ je hvězdičkou při procvičování."
            : "Žádná otázka neodpovídá hledání."}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((question) => (
            <li key={question.id} className="card-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-[15px] font-semibold leading-snug">
                  {question.text}
                </h2>
                <button
                  type="button"
                  onClick={() => toggle(question.id)}
                  aria-label="Oblíbená otázka"
                  className="shrink-0"
                >
                  <Star
                    className={cn(
                      "h-5 w-5",
                      isFavorite(question.id)
                        ? "fill-current text-brass"
                        : "text-muted-foreground",
                    )}
                  />
                </button>
              </div>
              {question.images.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  {question.images.map((src) => (
                    <ZoomableImage key={src} src={src} alt={question.text} />
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-col gap-1.5">
                {question.answers.map((a) => (
                  <div
                    key={a.id}
                    className={cn(
                      "flex items-start gap-2 rounded-xl border px-3 py-2 text-[13px] leading-snug",
                      a.is_correct
                        ? "border-success bg-success/15"
                        : "border-border",
                    )}
                  >
                    {a.is_correct ? (
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                    ) : (
                      <span className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    )}
                    <span>{a.text}</span>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      {shown.length < filtered.length && (
        <button
          type="button"
          onClick={() => setLimit((l) => l + PAGE)}
          className="card-surface py-3 text-center text-sm font-semibold text-primary"
        >
          Zobrazit další ({filtered.length - shown.length})
        </button>
      )}
    </main>
  );
}
