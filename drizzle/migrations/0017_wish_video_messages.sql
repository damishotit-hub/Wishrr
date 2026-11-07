ALTER TABLE public.wishes ADD COLUMN video_path text, ADD COLUMN video_duration_seconds double precision;
ALTER TABLE public.wishes ADD CONSTRAINT wish_video_duration_check CHECK ((video_path IS NULL AND video_duration_seconds IS NULL) OR (video_path IS NOT NULL AND video_duration_seconds > 0 AND video_duration_seconds <= 60 AND video_duration_seconds <> 'NaN'::double precision));
ALTER TABLE public.wishes ADD CONSTRAINT wish_video_owner_folder CHECK (video_path IS NULL OR split_part(video_path, '/', 1) = user_id::text);
COMMENT ON COLUMN public.wishes.audio_path IS 'DEPRECATED: replaced by video_path; legacy audio files retained but not displayed.';
COMMENT ON COLUMN public.wishes.audio_duration_seconds IS 'DEPRECATED: replaced by video_duration_seconds.';
CREATE POLICY "Owners upload wish video" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'wish-video' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Members watch visible wish video" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'wish-video' AND ((storage.foldername(name))[1] = auth.uid()::text OR EXISTS (SELECT 1 FROM public.wishes w WHERE w.video_path = objects.name)));
CREATE POLICY "Owners delete wish video" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'wish-video' AND (storage.foldername(name))[1] = auth.uid()::text);