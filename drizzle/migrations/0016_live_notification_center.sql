GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON public.notifications(user_id, created_at DESC) WHERE is_read = false;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; END IF; END $$;
CREATE OR REPLACE FUNCTION public.notify_giveaway_delivery() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _giver uuid; _title text;
BEGIN
 IF NEW.status = 'delivered' AND OLD.status IS DISTINCT FROM 'delivered' THEN
  SELECT giver_id, title INTO _giver, _title FROM public.giveaways WHERE id = NEW.giveaway_id;
  IF _giver IS NOT NULL AND _giver IS DISTINCT FROM NEW.user_id THEN
   INSERT INTO public.notifications(user_id,title,body,link) VALUES (_giver,'Giveaway delivery confirmed',coalesce(_title,'Your giveaway') || ' has been marked as delivered.','/giveaways/' || NEW.giveaway_id), (NEW.user_id,'Giveaway delivery confirmed',coalesce(_title,'Your giveaway') || ' has been marked as delivered.','/giveaways/' || NEW.giveaway_id);
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER giveaway_delivery_notify AFTER UPDATE OF status ON public.giveaway_recipients FOR EACH ROW EXECUTE FUNCTION public.notify_giveaway_delivery();
CREATE OR REPLACE FUNCTION public.notify_confirmed_wish_support() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _owner uuid; _title text;
BEGIN
 IF NEW.payment_status = 'succeeded' AND OLD.payment_status IS DISTINCT FROM 'succeeded' THEN
  SELECT user_id,title INTO _owner,_title FROM public.wishes WHERE id = NEW.wish_id;
  IF _owner IS NOT NULL THEN
   INSERT INTO public.notifications(user_id,title,body,link) VALUES (_owner,'Wish funding confirmed','Confirmed support for ' || coalesce(_title,'your wish') || ' now counts toward its goal.','/wish/' || NEW.wish_id);
  END IF;
  IF NEW.contributor_id IS NOT NULL AND NEW.contributor_id IS DISTINCT FROM _owner THEN
   INSERT INTO public.notifications(user_id,title,body,link) VALUES (NEW.contributor_id,'Your support was confirmed','The wish owner confirmed receiving your support for ' || coalesce(_title,'this wish') || '.','/wish/' || NEW.wish_id);
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER wish_support_confirmed_notify AFTER UPDATE OF payment_status ON public.contributions FOR EACH ROW EXECUTE FUNCTION public.notify_confirmed_wish_support();
REVOKE ALL ON FUNCTION public.notify_giveaway_delivery() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_confirmed_wish_support() FROM PUBLIC, anon, authenticated;