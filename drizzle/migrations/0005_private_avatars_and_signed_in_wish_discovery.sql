CREATE POLICY "Members can view profile avatars" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'profile-avatars');
CREATE POLICY "Members upload own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Members replace own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'profile-avatars' AND (storage.foldername(name))[1] = auth.uid()::text) WITH CHECK (bucket_id = 'profile-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Members remove own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'profile-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Published wishes are public" ON public.wishes;
CREATE POLICY "Signed in members browse published wishes" ON public.wishes FOR SELECT TO authenticated USING (status IN ('active', 'partially_funded', 'fulfilled') AND verification_status <> 'rejected');
REVOKE SELECT ON public.wishes FROM anon;