DROP POLICY IF EXISTS "Contributors insert own" ON public.contributions;
CREATE POLICY "Contributors insert own" ON public.contributions
FOR INSERT TO authenticated
WITH CHECK (
  contributor_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM public.wishes w
    WHERE w.id = contributions.wish_id AND w.user_id = auth.uid()
  )
);