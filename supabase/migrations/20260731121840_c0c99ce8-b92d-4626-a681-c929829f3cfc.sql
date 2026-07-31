CREATE TABLE public.lessons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id text NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lessons TO anon, authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lessons are public" ON public.lessons FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.summaries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id text NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.summaries TO anon, authenticated;
GRANT ALL ON public.summaries TO service_role;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Summaries are public" ON public.summaries FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.glossary (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id text NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  term text NOT NULL,
  definition text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.glossary TO anon, authenticated;
GRANT ALL ON public.glossary TO service_role;
ALTER TABLE public.glossary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Glossary is public" ON public.glossary FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id text NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  file_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.documents TO anon, authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Documents are public" ON public.documents FOR SELECT TO anon, authenticated USING (true);

CREATE INDEX lessons_app_subject_idx ON public.lessons (app_id, subject_id, sort_order);
CREATE INDEX summaries_app_subject_idx ON public.summaries (app_id, subject_id, sort_order);
CREATE INDEX glossary_app_idx ON public.glossary (app_id, sort_order);
CREATE INDEX documents_app_idx ON public.documents (app_id, sort_order);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_summaries_updated_at BEFORE UPDATE ON public.summaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_glossary_updated_at BEFORE UPDATE ON public.glossary
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.lessons (app_id, subject_id, title, content, sort_order)
SELECT s.app_id, s.id,
  'UKÁZKA – ' || s.name,
  E'**UKÁZKA – nahradit oficiálním obsahem.**\n\nZde bude studijní text k okruhu „' || s.name || E'“.\n\n- Odkaz na paragraf: § …\n- Odkaz na paragraf: § …\n\n> Tento text je pouze zástupný a neobsahuje právní informace.',
  s.sort_order
FROM public.subjects s;

INSERT INTO public.summaries (app_id, subject_id, content, sort_order)
SELECT s.app_id, s.id,
  E'**UKÁZKA – nahradit oficiálním obsahem.**\n\n- Klíčový fakt 1 (zástupný)\n- Klíčový fakt 2 (zástupný)\n- Klíčový fakt 3 (zástupný)',
  s.sort_order
FROM public.subjects s;

INSERT INTO public.glossary (app_id, term, definition, sort_order) VALUES
  ('zbrojak', 'UKÁZKA – Pojem A', 'UKÁZKA – nahradit oficiálním obsahem. Zástupná definice pojmu A.', 0),
  ('zbrojak', 'UKÁZKA – Pojem B', 'UKÁZKA – nahradit oficiálním obsahem. Zástupná definice pojmu B.', 1),
  ('zbrojak', 'UKÁZKA – Pojem C', 'UKÁZKA – nahradit oficiálním obsahem. Zástupná definice pojmu C.', 2);

INSERT INTO public.documents (app_id, subject_id, title, description, file_url, sort_order)
VALUES ('zbrojak', NULL, 'UKÁZKA – Zástupný dokument',
  'UKÁZKA – nahradit oficiálním obsahem. Sem patří studijní materiál ke stažení.',
  'https://kxfaqlpphlowahmflhur.supabase.co/storage/v1/object/public/documents/ukazka.pdf', 0);