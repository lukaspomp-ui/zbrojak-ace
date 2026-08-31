CREATE TABLE public.exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  taken_at timestamptz NOT NULL DEFAULT now(),
  correct integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  question_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_attempts TO authenticated;
GRANT ALL ON public.exam_attempts TO service_role;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own exam attempts" ON public.exam_attempts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX exam_attempts_user_taken_idx ON public.exam_attempts (user_id, taken_at DESC);

CREATE TABLE public.subject_accuracy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id text NOT NULL,
  answered integer NOT NULL DEFAULT 0,
  correct integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, subject_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subject_accuracy TO authenticated;
GRANT ALL ON public.subject_accuracy TO service_role;
ALTER TABLE public.subject_accuracy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own subject accuracy" ON public.subject_accuracy FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_subject_accuracy_updated_at BEFORE UPDATE ON public.subject_accuracy
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.bump_subject_accuracy(_subject_id text, _correct boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  INSERT INTO public.subject_accuracy (user_id, subject_id, answered, correct)
  VALUES (uid, _subject_id, 1, CASE WHEN _correct THEN 1 ELSE 0 END)
  ON CONFLICT (user_id, subject_id) DO UPDATE
    SET answered = public.subject_accuracy.answered + 1,
        correct = public.subject_accuracy.correct + CASE WHEN _correct THEN 1 ELSE 0 END,
        updated_at = now();
END;
$$;