ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS times_seen integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS correct_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mastery_level integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_review_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_answer_correct boolean;

-- Backfill compatible values from the existing columns (no data loss).
UPDATE public.user_progress
SET times_seen = GREATEST(times_seen, times_wrong + correct_streak),
    correct_count = GREATEST(correct_count, correct_streak),
    mastery_level = GREATEST(mastery_level, CASE WHEN mastered THEN 2 ELSE correct_streak END)
WHERE times_seen = 0 AND correct_count = 0 AND mastery_level = 0;

-- Premium entitlement must not be settable by the client.
CREATE OR REPLACE FUNCTION public.protect_profile_entitlements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role' OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
    RAISE EXCEPTION 'is_premium cannot be changed by the client';
  END IF;
  IF NEW.exam_attempts_used IS DISTINCT FROM OLD.exam_attempts_used THEN
    RAISE EXCEPTION 'exam_attempts_used cannot be changed directly';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_entitlements ON public.profiles;
CREATE TRIGGER protect_profile_entitlements
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_entitlements();

-- Secure, server-side consumption of one exam attempt for the caller.
CREATE OR REPLACE FUNCTION public.consume_exam_attempt()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  new_used integer;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  INSERT INTO public.profiles (id) VALUES (uid) ON CONFLICT (id) DO NOTHING;
  UPDATE public.profiles
    SET exam_attempts_used = exam_attempts_used + 1
    WHERE id = uid
    RETURNING exam_attempts_used INTO new_used;
  RETURN new_used;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_exam_attempt() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_exam_attempt() TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_exam_attempt() TO service_role;