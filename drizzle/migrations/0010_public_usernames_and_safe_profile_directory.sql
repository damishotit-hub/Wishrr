ALTER TABLE public.profiles ADD COLUMN username text;

UPDATE public.profiles
SET username = left(regexp_replace(lower(coalesce(nullif(display_name, ''), split_part(coalesce(email, 'member'), '@', 1))), '[^a-z0-9_]+', '', 'g'), 18) || '_' || substr(replace(id::text, '-', ''), 1, 5)
WHERE username IS NULL;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_format CHECK (username IS NULL OR username ~ '^[a-z0-9_]{3,24}$');
CREATE UNIQUE INDEX profiles_username_lower_unique ON public.profiles (lower(username)) WHERE username IS NOT NULL;

CREATE OR REPLACE FUNCTION public.assign_profile_username()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base text;
BEGIN
  IF NEW.username IS NULL OR NEW.username = '' THEN
    base := left(regexp_replace(lower(coalesce(nullif(NEW.display_name, ''), split_part(coalesce(NEW.email, 'member'), '@', 1))), '[^a-z0-9_]+', '', 'g'), 18);
    IF length(base) < 3 THEN base := 'member'; END IF;
    NEW.username := base || '_' || substr(replace(NEW.id::text, '-', ''), 1, 5);
  ELSE
    NEW.username := lower(trim(NEW.username));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_assign_username
BEFORE INSERT OR UPDATE OF username ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.assign_profile_username();

CREATE OR REPLACE FUNCTION public.search_public_profiles(_query text, _limit integer DEFAULT 8)
RETURNS TABLE(id uuid, username text, display_name text, bio text, avatar_url text, is_verified boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.username, p.display_name, p.bio, p.avatar_url, p.is_verified
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND p.username IS NOT NULL
    AND (
      p.username ILIKE '%' || trim(leading '@' from coalesce(_query, '')) || '%'
      OR p.display_name ILIKE '%' || coalesce(_query, '') || '%'
    )
  ORDER BY
    CASE WHEN lower(p.username) = lower(trim(leading '@' from coalesce(_query, ''))) THEN 0 ELSE 1 END,
    p.updated_at DESC
  LIMIT least(greatest(coalesce(_limit, 8), 1), 20);
$$;

CREATE OR REPLACE FUNCTION public.get_public_profile(_username text)
RETURNS TABLE(id uuid, username text, display_name text, bio text, avatar_url text, is_verified boolean, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.username, p.display_name, p.bio, p.avatar_url, p.is_verified, p.created_at
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL AND lower(p.username) = lower(trim(leading '@' from _username))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.search_public_profiles(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profile(text) TO authenticated;
REVOKE ALL ON FUNCTION public.search_public_profiles(text, integer) FROM anon;
REVOKE ALL ON FUNCTION public.get_public_profile(text) FROM anon;