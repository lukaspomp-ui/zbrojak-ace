CREATE POLICY "Documents files are readable"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'documents');