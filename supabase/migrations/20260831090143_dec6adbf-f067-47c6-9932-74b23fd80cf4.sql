REVOKE ALL ON FUNCTION public.bump_subject_accuracy(text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bump_subject_accuracy(text, boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.consume_exam_attempt() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_exam_attempt() TO authenticated;