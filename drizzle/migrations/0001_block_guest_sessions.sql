CREATE POLICY "No guest access" ON public.profiles AS RESTRICTIVE FOR ALL TO authenticated USING (((auth.jwt() ->> 'is_anonymous')::boolean) IS NOT TRUE) WITH CHECK (((auth.jwt() ->> 'is_anonymous')::boolean) IS NOT TRUE);
CREATE POLICY "No guest access" ON public.user_progress AS RESTRICTIVE FOR ALL TO authenticated USING (((auth.jwt() ->> 'is_anonymous')::boolean) IS NOT TRUE) WITH CHECK (((auth.jwt() ->> 'is_anonymous')::boolean) IS NOT TRUE);
CREATE POLICY "No guest access" ON public.exam_attempts AS RESTRICTIVE FOR ALL TO authenticated USING (((auth.jwt() ->> 'is_anonymous')::boolean) IS NOT TRUE) WITH CHECK (((auth.jwt() ->> 'is_anonymous')::boolean) IS NOT TRUE);
CREATE POLICY "No guest access" ON public.subject_accuracy AS RESTRICTIVE FOR ALL TO authenticated USING (((auth.jwt() ->> 'is_anonymous')::boolean) IS NOT TRUE) WITH CHECK (((auth.jwt() ->> 'is_anonymous')::boolean) IS NOT TRUE);
CREATE POLICY "No guest access" ON public.question_reports AS RESTRICTIVE FOR ALL TO authenticated USING (((auth.jwt() ->> 'is_anonymous')::boolean) IS NOT TRUE) WITH CHECK (((auth.jwt() ->> 'is_anonymous')::boolean) IS NOT TRUE);

CREATE OR REPLACE FUNCTION public.bump_subject_accuracy(_subject_id text, _correct boolean)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL OR ((auth.jwt() ->> 'is_anonymous')::boolean) IS TRUE THEN RAISE EXCEPTION 'not authenticated'; END IF;
  INSERT INTO public.subject_accuracy (user_id, subject_id, answered, correct)
  VALUES (uid, _subject_id, 1, CASE WHEN _correct THEN 1 ELSE 0 END)
  ON CONFLICT (user_id, subject_id) DO UPDATE
    SET answered = public.subject_accuracy.answered + 1,
        correct = public.subject_accuracy.correct + CASE WHEN _correct THEN 1 ELSE 0 END,
        updated_at = now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.consume_exam_attempt()
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE uid uuid := auth.uid(); new_used integer;
BEGIN
  IF uid IS NULL OR ((auth.jwt() ->> 'is_anonymous')::boolean) IS TRUE THEN RAISE EXCEPTION 'not authenticated'; END IF;
  INSERT INTO public.profiles (id) VALUES (uid) ON CONFLICT (id) DO NOTHING;
  UPDATE public.profiles SET exam_attempts_used = exam_attempts_used + 1
    WHERE id = uid RETURNING exam_attempts_used INTO new_used;
  RETURN new_used;
END;
$function$;