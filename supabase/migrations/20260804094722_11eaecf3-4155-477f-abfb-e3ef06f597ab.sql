-- Progress and reports now reference the official question number (integer)
ALTER TABLE public.user_progress DROP CONSTRAINT IF EXISTS user_progress_question_id_fkey;
ALTER TABLE public.question_reports DROP CONSTRAINT IF EXISTS question_reports_question_id_fkey;

DELETE FROM public.user_progress;
DELETE FROM public.question_reports;

ALTER TABLE public.user_progress
  ALTER COLUMN question_id TYPE integer USING NULL;
ALTER TABLE public.question_reports
  ALTER COLUMN question_id TYPE integer USING NULL;

-- Educational content is keyed to the okruh slug from the bundled question file
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS subject_key text;
ALTER TABLE public.summaries ADD COLUMN IF NOT EXISTS subject_key text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS subject_key text;

UPDATE public.lessons l SET subject_key = 'okruh-' || (s.sort_order + 1)
FROM public.subjects s WHERE l.subject_id = s.id AND l.subject_key IS NULL;
UPDATE public.summaries su SET subject_key = 'okruh-' || (s.sort_order + 1)
FROM public.subjects s WHERE su.subject_id = s.id AND su.subject_key IS NULL;
UPDATE public.documents d SET subject_key = 'okruh-' || (s.sort_order + 1)
FROM public.subjects s WHERE d.subject_id = s.id AND d.subject_key IS NULL;

ALTER TABLE public.lessons DROP COLUMN IF EXISTS subject_id;
ALTER TABLE public.summaries DROP COLUMN IF EXISTS subject_id;
ALTER TABLE public.documents DROP COLUMN IF EXISTS subject_id;

-- Questions/answers/subjects now live in the bundled JSON file
DROP TABLE IF EXISTS public.answers;
DROP TABLE IF EXISTS public.questions;
DROP TABLE IF EXISTS public.subjects;