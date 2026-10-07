ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username_confirmed boolean NOT NULL DEFAULT false;
UPDATE public.profiles SET username_confirmed = true WHERE username IS NOT NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_location_len CHECK (location IS NULL OR char_length(location) BETWEEN 2 AND 80);

CREATE OR REPLACE FUNCTION public.get_member_count() RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT count(*) FROM public.profiles $$;
GRANT EXECUTE ON FUNCTION public.get_member_count() TO anon, authenticated;

DROP FUNCTION IF EXISTS public.get_public_profile(text);
CREATE FUNCTION public.get_public_profile(_username text)
RETURNS TABLE(id uuid, username text, display_name text, bio text, avatar_url text, is_verified boolean, created_at timestamptz, location text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.username, p.display_name, p.bio, p.avatar_url, p.is_verified, p.created_at, p.location
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL AND lower(p.username) = lower(trim(leading '@' from _username))
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_public_profile(text) TO authenticated;

DROP FUNCTION IF EXISTS public.admin_recent_users(integer);
CREATE FUNCTION public.admin_recent_users(_limit integer DEFAULT 50)
RETURNS TABLE(id uuid, email text, display_name text, username text, location text, created_at timestamptz, last_sign_in_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  RETURN QUERY SELECT u.id, u.email::text, p.display_name, p.username, p.location, u.created_at, u.last_sign_in_at
    FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id
    ORDER BY greatest(u.created_at, coalesce(u.last_sign_in_at, u.created_at)) DESC LIMIT least(_limit, 200);
END $$;
GRANT EXECUTE ON FUNCTION public.admin_recent_users(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_team()
RETURNS TABLE(user_id uuid, role app_role, email text, display_name text, username text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  RETURN QUERY SELECT r.user_id, r.role, u.email::text, p.display_name, p.username
    FROM public.user_roles r JOIN auth.users u ON u.id = r.user_id LEFT JOIN public.profiles p ON p.id = r.user_id
    WHERE r.role IN ('admin','moderator') ORDER BY r.role, r.created_at;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_team() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_role(_user_id uuid, _role app_role, _grant boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF _grant THEN
    IF _role = 'moderator' AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = 'moderator')
       AND (SELECT count(*) FROM user_roles WHERE role = 'moderator') >= 5 THEN
      RAISE EXCEPTION 'The moderator team is full (maximum 5).';
    END IF;
    INSERT INTO user_roles (user_id, role) VALUES (_user_id, _role) ON CONFLICT DO NOTHING;
  ELSE
    IF _user_id = auth.uid() AND _role = 'admin' THEN RAISE EXCEPTION 'You cannot remove your own admin role'; END IF;
    DELETE FROM user_roles WHERE user_id = _user_id AND role = _role;
  END IF;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.admin_find_user(_email text)
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  SELECT u.id INTO _id FROM auth.users u WHERE lower(u.email) = lower(trim(_email)) LIMIT 1;
  RETURN _id;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_find_user(text) TO authenticated;

-- Moderators act only on items that have been reported.
CREATE OR REPLACE FUNCTION public.moderate_content(_kind text, _id uuid, _action text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF _action NOT IN ('approve','hide','remove') THEN RAISE EXCEPTION 'Unknown action'; END IF;
  IF NOT public.has_role(auth.uid(), 'admin') AND NOT EXISTS (
    SELECT 1 FROM content_reports WHERE (_kind = 'wish' AND wish_id = _id) OR (_kind = 'giveaway' AND giveaway_id = _id)
  ) THEN RAISE EXCEPTION 'Moderators can only act on reported items'; END IF;
  IF _kind = 'wish' THEN
    IF _action = 'remove' THEN DELETE FROM wishes WHERE id = _id;
    ELSIF _action = 'approve' THEN UPDATE wishes SET status = 'active', verification_status = 'verified' WHERE id = _id;
    ELSE UPDATE wishes SET status = 'closed' WHERE id = _id; END IF;
  ELSIF _kind = 'giveaway' THEN
    IF _action = 'remove' THEN DELETE FROM giveaways WHERE id = _id;
    ELSE UPDATE giveaways SET status = CASE WHEN _action = 'approve' THEN 'active'::giveaway_status ELSE 'cancelled'::giveaway_status END WHERE id = _id; END IF;
  ELSE RAISE EXCEPTION 'Unknown kind'; END IF;
  RETURN true;
END $$;
GRANT EXECUTE ON FUNCTION public.moderate_content(text, uuid, text) TO authenticated;

-- Direct messages
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL,
  user_b uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversations_order CHECK (user_a < user_b),
  CONSTRAINT conversations_pair UNIQUE (user_a, user_b)
);
GRANT SELECT ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties read conversations" ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 2000),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX direct_messages_conv_idx ON public.direct_messages (conversation_id, created_at);
GRANT SELECT, INSERT ON public.direct_messages TO authenticated;
GRANT UPDATE (read_at) ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_conversation_party(_conversation_id uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM conversations WHERE id = _conversation_id AND (_uid = user_a OR _uid = user_b))
$$;

CREATE POLICY "Parties read messages" ON public.direct_messages FOR SELECT TO authenticated
  USING (public.is_conversation_party(conversation_id, auth.uid()));
CREATE POLICY "Parties send messages" ON public.direct_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_conversation_party(conversation_id, auth.uid()));
CREATE POLICY "Recipients mark read" ON public.direct_messages FOR UPDATE TO authenticated
  USING (sender_id <> auth.uid() AND public.is_conversation_party(conversation_id, auth.uid()))
  WITH CHECK (sender_id <> auth.uid() AND public.is_conversation_party(conversation_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.start_conversation(_other uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _me uuid := auth.uid(); _a uuid; _b uuid; _id uuid;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF _other = _me THEN RAISE EXCEPTION 'You cannot message yourself'; END IF;
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = _other) THEN RAISE EXCEPTION 'Member not found'; END IF;
  _a := least(_me, _other); _b := greatest(_me, _other);
  INSERT INTO conversations (user_a, user_b) VALUES (_a, _b) ON CONFLICT (user_a, user_b) DO NOTHING;
  SELECT id INTO _id FROM conversations WHERE user_a = _a AND user_b = _b;
  RETURN _id;
END $$;
GRANT EXECUTE ON FUNCTION public.start_conversation(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.my_conversations()
RETURNS TABLE(id uuid, other_id uuid, other_username text, other_display_name text, other_avatar_url text, last_body text, last_message_at timestamptz, unread bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, o.id, o.username, o.display_name, o.avatar_url,
    (SELECT m.body FROM direct_messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1),
    c.last_message_at,
    (SELECT count(*) FROM direct_messages m WHERE m.conversation_id = c.id AND m.sender_id <> auth.uid() AND m.read_at IS NULL)
  FROM conversations c
  JOIN profiles o ON o.id = CASE WHEN c.user_a = auth.uid() THEN c.user_b ELSE c.user_a END
  WHERE auth.uid() IN (c.user_a, c.user_b)
  ORDER BY c.last_message_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.my_conversations() TO authenticated;

CREATE OR REPLACE FUNCTION public.on_direct_message() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _c conversations; _to uuid; _name text;
BEGIN
  SELECT * INTO _c FROM conversations WHERE id = NEW.conversation_id;
  UPDATE conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  _to := CASE WHEN _c.user_a = NEW.sender_id THEN _c.user_b ELSE _c.user_a END;
  SELECT display_name INTO _name FROM profiles WHERE id = NEW.sender_id;
  IF NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = _to AND link = '/messages/' || NEW.conversation_id AND is_read = false) THEN
    INSERT INTO notifications (user_id, title, body, link)
    VALUES (_to, 'New message from ' || coalesce(_name, 'a member'), left(NEW.body, 140), '/messages/' || NEW.conversation_id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER direct_message_after_insert AFTER INSERT ON public.direct_messages
  FOR EACH ROW EXECUTE FUNCTION public.on_direct_message();

ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;