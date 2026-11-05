REVOKE ALL ON public.device_fingerprints FROM anon, authenticated;
CREATE UNIQUE INDEX device_fingerprints_user_idx ON public.device_fingerprints(user_id);
CREATE OR REPLACE FUNCTION public.record_device(_hash text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR _hash !~ '^[a-f0-9]{64}$' THEN RETURN; END IF;
  INSERT INTO public.device_fingerprints(user_id, device_hash) VALUES (auth.uid(), _hash)
  ON CONFLICT (user_id) DO NOTHING;
END $$;
CREATE OR REPLACE FUNCTION public.capture_signup_device() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE fingerprint text;
BEGIN
  fingerprint := NEW.raw_user_meta_data->>'signup_device_hash';
  IF fingerprint ~ '^[a-f0-9]{64}$' THEN
    INSERT INTO public.device_fingerprints(user_id, device_hash) VALUES (NEW.id, fingerprint)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.capture_signup_device() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER wishr_capture_signup_device AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.capture_signup_device();
COMMENT ON TABLE public.device_fingerprints IS 'Private, best-effort signup browser hashes. Matching hashes are review signals only; they never block registration.';