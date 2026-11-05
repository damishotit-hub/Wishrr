CREATE TABLE public.device_fingerprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_hash text NOT NULL CHECK (char_length(device_hash) BETWEEN 16 AND 128),
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_hash)
);
CREATE INDEX device_fingerprints_hash_idx ON public.device_fingerprints(device_hash);
GRANT ALL ON public.device_fingerprints TO service_role;
ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.record_device(_hash text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR _hash !~ '^[a-f0-9]{16,128}$' THEN RETURN; END IF;
  INSERT INTO public.device_fingerprints(user_id, device_hash) VALUES (auth.uid(), _hash)
  ON CONFLICT (user_id, device_hash) DO UPDATE SET last_seen_at = now();
END $$;
REVOKE ALL ON FUNCTION public.record_device(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_device(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_shared_devices()
RETURNS TABLE(device_hash text, user_id uuid, email text, display_name text, username text, created_at timestamptz, first_seen_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN QUERY
  SELECT d.device_hash, d.user_id, u.email::text, p.display_name, p.username, u.created_at, d.first_seen_at
  FROM public.device_fingerprints d
  JOIN auth.users u ON u.id = d.user_id
  LEFT JOIN public.profiles p ON p.id = d.user_id
  WHERE d.device_hash IN (SELECT f.device_hash FROM public.device_fingerprints f GROUP BY f.device_hash HAVING count(*) > 1)
  ORDER BY d.device_hash, u.created_at;
END $$;
REVOKE ALL ON FUNCTION public.admin_shared_devices() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_shared_devices() TO authenticated;