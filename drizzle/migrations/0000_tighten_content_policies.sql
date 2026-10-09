DROP POLICY IF EXISTS "Lessons are public" ON public.lessons;
DROP POLICY IF EXISTS "Summaries are public" ON public.summaries;
DROP POLICY IF EXISTS "Glossary is public" ON public.glossary;
DROP POLICY IF EXISTS "Documents are public" ON public.documents;
DROP POLICY IF EXISTS "Apps are public" ON public.apps;
DROP POLICY IF EXISTS "Documents files are readable" ON storage.objects;
CREATE POLICY "Premium users can read document files" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_premium = true)
);