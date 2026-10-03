CREATE TABLE public.wish_appreciations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id uuid NOT NULL UNIQUE REFERENCES public.wishes(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 5 AND 2000),
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wish_appreciations TO authenticated;
GRANT ALL ON public.wish_appreciations TO service_role;
ALTER TABLE public.wish_appreciations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read appreciations of granted wishes" ON public.wish_appreciations FOR SELECT TO authenticated
  USING (author_id = auth.uid() OR EXISTS (SELECT 1 FROM public.wishes w WHERE w.id = wish_id AND w.status = 'fulfilled'));
CREATE POLICY "Owners write appreciation for granted wish" ON public.wish_appreciations FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.wishes w WHERE w.id = wish_id AND w.user_id = auth.uid() AND w.status = 'fulfilled'));
CREATE POLICY "Owners edit appreciation" ON public.wish_appreciations FOR UPDATE TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "Owners delete appreciation" ON public.wish_appreciations FOR DELETE TO authenticated
  USING (author_id = auth.uid());
CREATE TRIGGER wish_appreciations_updated_at BEFORE UPDATE ON public.wish_appreciations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();