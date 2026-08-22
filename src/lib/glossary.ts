import raw from "@/data/zbrojak-slovnicek.json";

type RawFile = {
  verze: string;
  pojmy: { pojem: string; definice: string }[];
};

const file = raw as RawFile;

export type GlossaryTerm = {
  id: string;
  term: string;
  definition: string;
  sort_order: number;
};

export const GLOSSARY_VERSION = file.verze;

/** Terms come from the bundled official glossary file, sorted alphabetically. */
export const GLOSSARY: GlossaryTerm[] = file.pojmy
  .map((p, index) => ({
    id: `pojem-${index + 1}`,
    term: p.pojem,
    definition: p.definice,
    sort_order: index,
  }))
  .sort((a, b) => a.term.localeCompare(b.term, "cs"));
