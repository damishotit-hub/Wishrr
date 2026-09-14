CREATE TYPE public.giveaway_status AS ENUM ('draft','pending_review','active','closed','recipient_selected','fulfilled','cancelled');
CREATE TYPE public.giveaway_type AS ENUM ('item','service','space','skill','other');
CREATE TYPE public.giveaway_entry_status AS ENUM ('pending','shortlisted','selected','declined','withdrawn');
CREATE TYPE public.giveaway_recipient_status AS ENUM ('selected','confirmed','delivered','cancelled');

CREATE TABLE public.giveaways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  giver_display_name TEXT NOT NULL DEFAULT 'Wishr member',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  image_caption TEXT,
  category TEXT NOT NULL REFERENCES public.wish_categories(slug),
  giveaway_type public.giveaway_type NOT NULL DEFAULT 'item',
  location TEXT,
  deadline DATE,
  status public.giveaway_status NOT NULL DEFAULT 'active',
  recipient_count INTEGER NOT NULL DEFAULT 1,
  entry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.giveaways TO authenticated;
GRANT SELECT ON public.giveaways TO anon;
GRANT ALL ON public.giveaways TO service_role;

ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published giveaways are public" ON public.giveaways
  FOR SELECT TO anon, authenticated
  USING (status IN ('active','closed','recipient_selected','fulfilled'));
CREATE POLICY "Givers read own giveaways" ON public.giveaways
  FOR SELECT TO authenticated
  USING (giver_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Givers insert own giveaways" ON public.giveaways
  FOR INSERT TO authenticated
  WITH CHECK (giver_id = auth.uid());
CREATE POLICY "Givers update own giveaways" ON public.giveaways
  FOR UPDATE TO authenticated
  USING (giver_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (giver_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Givers delete own giveaways" ON public.giveaways
  FOR DELETE TO authenticated
  USING (giver_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER giveaways_updated_at BEFORE UPDATE ON public.giveaways
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX giveaways_status_created_idx ON public.giveaways (status, created_at DESC);

CREATE TABLE public.giveaway_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giveaway_id UUID NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entrant_display_name TEXT NOT NULL DEFAULT 'Wishr member',
  message TEXT,
  status public.giveaway_entry_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (giveaway_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.giveaway_entries TO authenticated;
GRANT ALL ON public.giveaway_entries TO service_role;

ALTER TABLE public.giveaway_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Entrants read own entries" ON public.giveaway_entries
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.giveaways g WHERE g.id = giveaway_id AND g.giver_id = auth.uid()));
CREATE POLICY "Entrants insert own entries" ON public.giveaway_entries
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()
    AND NOT EXISTS (SELECT 1 FROM public.giveaways g WHERE g.id = giveaway_id AND g.giver_id = auth.uid()));
CREATE POLICY "Entrants update own entries" ON public.giveaway_entries
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.giveaways g WHERE g.id = giveaway_id AND g.giver_id = auth.uid()))
  WITH CHECK (user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.giveaways g WHERE g.id = giveaway_id AND g.giver_id = auth.uid()));
CREATE POLICY "Entrants delete own entries" ON public.giveaway_entries
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE public.giveaway_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giveaway_id UUID NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.giveaway_recipient_status NOT NULL DEFAULT 'selected',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (giveaway_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.giveaway_recipients TO authenticated;
GRANT ALL ON public.giveaway_recipients TO service_role;

ALTER TABLE public.giveaway_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recipients read" ON public.giveaway_recipients
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.giveaways g WHERE g.id = giveaway_id AND g.giver_id = auth.uid()));
CREATE POLICY "Givers manage recipients" ON public.giveaway_recipients
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.giveaways g WHERE g.id = giveaway_id AND g.giver_id = auth.uid()));
CREATE POLICY "Givers update recipients" ON public.giveaway_recipients
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.giveaways g WHERE g.id = giveaway_id AND g.giver_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.giveaways g WHERE g.id = giveaway_id AND g.giver_id = auth.uid()));
CREATE POLICY "Givers delete recipients" ON public.giveaway_recipients
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.giveaways g WHERE g.id = giveaway_id AND g.giver_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.sync_giveaway_entry_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE target UUID; total INTEGER;
BEGIN
  target := COALESCE(NEW.giveaway_id, OLD.giveaway_id);
  SELECT COUNT(*) INTO total FROM public.giveaway_entries WHERE giveaway_id = target;
  UPDATE public.giveaways SET entry_count = total WHERE id = target;
  RETURN NULL;
END; $$;

CREATE TRIGGER giveaway_entries_sync
AFTER INSERT OR DELETE ON public.giveaway_entries
FOR EACH ROW EXECUTE FUNCTION public.sync_giveaway_entry_count();