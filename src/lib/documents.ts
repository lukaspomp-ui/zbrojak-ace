import raw from "@/data/zbrojak-dokumenty.json";

/** Same shape as DocumentRow — documents are bundled with the app, not in the DB. */
export type DocumentItem = {
  id: string;
  subject_id: string | null;
  title: string;
  description: string;
  file_url: string;
  sort_order: number;
};

type RawDocs = { verze: string; dokumenty: DocumentItem[] };

const file = raw as RawDocs;

export const DOCUMENTS_VERSION = file.verze;

export const DOCUMENTS: DocumentItem[] = [...file.dokumenty].sort(
  (a, b) => a.sort_order - b.sort_order,
);
