CREATE TABLE public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL CHECK (target_type IN ('wish','giveaway')),
  wish_id uuid REFERENCES public.wishes(id) ON DELETE CASCADE,
  giveaway_id uuid REFERENCES public.giveaways(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('scam','false_information','prohibited_item','offensive','harassment','other')),
  details text CHECK (details IS NULL OR char_length(details) <= 1000),
  status public.report_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((target_type = 'wish' AND wish_id IS NOT NULL AND giveaway_id IS NULL) OR (target_type = 'giveaway' AND giveaway_id IS NOT NULL AND wish_id IS NULL))
);
GRANT SELECT, INSERT, UPDATE ON public.content_reports TO authenticated;
GRANT ALL ON public.content_reports TO service_role;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reporters file reports" ON public.content_reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid() AND status = 'open');
CREATE POLICY "Reporters and moderators read" ON public.content_reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
CREATE POLICY "Moderators update reports" ON public.content_reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

CREATE OR REPLACE FUNCTION public.admin_recent_users(_limit int DEFAULT 50)
RETURNS TABLE(id uuid, email text, display_name text, created_at timestamptz, last_sign_in_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  RETURN QUERY SELECT u.id, u.email::text, p.display_name, u.created_at, u.last_sign_in_at
    FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id
    ORDER BY greatest(u.created_at, coalesce(u.last_sign_in_at, u.created_at)) DESC LIMIT least(_limit, 200);
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_recent_users(int) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_recent_users(int) TO authenticated;

CREATE TABLE public.wish_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id uuid NOT NULL REFERENCES public.wishes(id) ON DELETE CASCADE,
  giver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  giver_display_name text NOT NULL DEFAULT 'Wishr member',
  description text NOT NULL CHECK (char_length(description) BETWEEN 5 AND 1000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','completed','withdrawn')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wish_id, giver_id)
);
GRANT SELECT, INSERT, UPDATE ON public.wish_offers TO authenticated;
GRANT ALL ON public.wish_offers TO service_role;
ALTER TABLE public.wish_offers ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_offer_party(_offer_id uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM wish_offers o JOIN wishes w ON w.id = o.wish_id
    WHERE o.id = _offer_id AND (o.giver_id = _uid OR w.user_id = _uid))
$$;
CREATE OR REPLACE FUNCTION public.is_wish_owner(_wish_id uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM wishes WHERE id = _wish_id AND user_id = _uid)
$$;
CREATE POLICY "Parties read offers" ON public.wish_offers FOR SELECT TO authenticated
  USING (giver_id = auth.uid() OR public.is_wish_owner(wish_id, auth.uid()));
CREATE POLICY "Givers make offers" ON public.wish_offers FOR INSERT TO authenticated
  WITH CHECK (giver_id = auth.uid() AND status = 'pending' AND EXISTS (SELECT 1 FROM wishes w WHERE w.id = wish_id AND w.user_id IS DISTINCT FROM auth.uid() AND w.status IN ('active','partially_funded')));
CREATE POLICY "Parties update offers" ON public.wish_offers FOR UPDATE TO authenticated
  USING (giver_id = auth.uid() OR public.is_wish_owner(wish_id, auth.uid()))
  WITH CHECK (giver_id = auth.uid() OR public.is_wish_owner(wish_id, auth.uid()));

CREATE TABLE public.wish_offer_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.wish_offers(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.wish_offer_messages TO authenticated;
GRANT ALL ON public.wish_offer_messages TO service_role;
ALTER TABLE public.wish_offer_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties read offer messages" ON public.wish_offer_messages FOR SELECT TO authenticated
  USING (public.is_offer_party(offer_id, auth.uid()));
CREATE POLICY "Parties send offer messages" ON public.wish_offer_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_offer_party(offer_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.notify_wish_offer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO notifications (user_id, title, body, link)
  SELECT w.user_id, 'Someone offered an item or service for your wish', w.title, '/wish/' || w.id
  FROM wishes w WHERE w.id = NEW.wish_id AND w.user_id IS NOT NULL;
  RETURN NEW;
END $$;
CREATE TRIGGER wish_offer_notify AFTER INSERT ON public.wish_offers FOR EACH ROW EXECUTE FUNCTION public.notify_wish_offer();