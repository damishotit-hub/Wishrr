ALTER TABLE public.giveaways DROP CONSTRAINT IF EXISTS giveaways_category_fkey;
ALTER TABLE public.giveaways ADD CONSTRAINT giveaways_category_check CHECK (category IN ('phones_tech','education','fashion','home','money','food','services','creative','other')) NOT VALID;
ALTER TABLE public.giveaways ADD COLUMN selection_mode text NOT NULL DEFAULT 'giver_selects' CHECK (selection_mode IN ('giver_selects','first_come','free_claim'));
ALTER TABLE public.giveaways ADD COLUMN extra_images text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.giveaways ADD COLUMN eligibility text;
ALTER TABLE public.giveaway_recipients ADD CONSTRAINT giveaway_recipients_unique UNIQUE (giveaway_id, user_id);
ALTER TABLE public.giveaway_entries ADD CONSTRAINT giveaway_entries_unique UNIQUE (giveaway_id, user_id);

CREATE TABLE public.giveaway_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES public.giveaway_recipients(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.giveaway_messages TO authenticated;
GRANT ALL ON public.giveaway_messages TO service_role;
ALTER TABLE public.giveaway_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_giveaway_party(_recipient_id uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM giveaway_recipients r JOIN giveaways g ON g.id = r.giveaway_id
    WHERE r.id = _recipient_id AND r.status <> 'cancelled' AND (r.user_id = _uid OR g.giver_id = _uid))
$$;
CREATE POLICY "Parties read messages" ON public.giveaway_messages FOR SELECT TO authenticated
  USING (public.is_giveaway_party(recipient_id, auth.uid()));
CREATE POLICY "Parties send messages" ON public.giveaway_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_giveaway_party(recipient_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.notify_giveaway_recipient()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO notifications (user_id, title, body, link)
  SELECT NEW.user_id, 'Congratulations! You were selected for this giveaway.', g.title, '/giveaways/' || g.id
  FROM giveaways g WHERE g.id = NEW.giveaway_id;
  UPDATE giveaway_entries SET status = 'selected' WHERE giveaway_id = NEW.giveaway_id AND user_id = NEW.user_id;
  RETURN NEW;
END $$;
CREATE TRIGGER giveaway_recipient_notify AFTER INSERT ON public.giveaway_recipients
  FOR EACH ROW EXECUTE FUNCTION public.notify_giveaway_recipient();

CREATE OR REPLACE FUNCTION public.auto_select_giveaway_entry()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g giveaways; taken int;
BEGIN
  SELECT * INTO g FROM giveaways WHERE id = NEW.giveaway_id FOR UPDATE;
  IF g.status <> 'active' THEN RAISE EXCEPTION 'This giveaway is not open'; END IF;
  IF g.selection_mode IN ('first_come','free_claim') THEN
    SELECT count(*) INTO taken FROM giveaway_recipients WHERE giveaway_id = g.id AND status <> 'cancelled';
    IF taken < g.recipient_count THEN
      INSERT INTO giveaway_recipients (giveaway_id, user_id) VALUES (g.id, NEW.user_id);
      IF taken + 1 >= g.recipient_count THEN
        UPDATE giveaways SET status = 'recipient_selected' WHERE id = g.id;
      END IF;
    END IF;
  END IF;
  INSERT INTO notifications (user_id, title, body, link)
  VALUES (g.giver_id, 'New entry on your giveaway', g.title, '/giveaways/' || g.id);
  RETURN NEW;
END $$;
CREATE TRIGGER giveaway_entry_auto_select AFTER INSERT ON public.giveaway_entries
  FOR EACH ROW EXECUTE FUNCTION public.auto_select_giveaway_entry();

CREATE POLICY "Recipients update own delivery" ON public.giveaway_recipients FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND status IN ('confirmed','delivered'));