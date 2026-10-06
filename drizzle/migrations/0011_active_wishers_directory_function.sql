CREATE OR REPLACE FUNCTION public.get_active_wishers(_limit integer DEFAULT 8)
RETURNS TABLE(
  profile_id uuid,
  username text,
  display_name text,
  avatar_url text,
  is_verified boolean,
  wish_id uuid,
  wish_title text,
  wish_summary text,
  goal_amount numeric,
  amount_raised numeric,
  wish_updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (p.id)
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.is_verified,
    w.id,
    w.title,
    w.summary,
    w.goal_amount,
    w.amount_raised,
    w.updated_at
  FROM public.profiles p
  JOIN public.wishes w ON w.user_id = p.id
  WHERE auth.uid() IS NOT NULL
    AND p.username IS NOT NULL
    AND w.is_anonymous = false
    AND w.status IN ('active'::public.wish_status, 'partially_funded'::public.wish_status)
    AND w.verification_status <> 'rejected'::public.verification_status
    AND w.goal_amount > w.amount_raised
    AND w.user_id IS DISTINCT FROM auth.uid()
  ORDER BY p.id, w.updated_at DESC
  LIMIT least(greatest(coalesce(_limit, 8), 1), 20);
$$;

GRANT EXECUTE ON FUNCTION public.get_active_wishers(integer) TO authenticated;
REVOKE ALL ON FUNCTION public.get_active_wishers(integer) FROM anon;