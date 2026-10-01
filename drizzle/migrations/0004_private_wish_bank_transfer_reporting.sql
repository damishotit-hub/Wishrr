CREATE TABLE public.wish_bank_details (
  wish_id uuid PRIMARY KEY REFERENCES public.wishes(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bank_name_length CHECK (char_length(bank_name) BETWEEN 2 AND 100),
  CONSTRAINT account_name_length CHECK (char_length(account_name) BETWEEN 2 AND 120),
  CONSTRAINT account_number_format CHECK (account_number ~ '^[0-9]{10}$')
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wish_bank_details TO authenticated;
GRANT ALL ON public.wish_bank_details TO service_role;
ALTER TABLE public.wish_bank_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read bank details" ON public.wish_bank_details FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owners add bank details" ON public.wish_bank_details FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.wishes w WHERE w.id = wish_id AND w.user_id = auth.uid()));
CREATE POLICY "Owners edit bank details" ON public.wish_bank_details FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.wishes w WHERE w.id = wish_id AND w.user_id = auth.uid()));
CREATE POLICY "Owners remove bank details" ON public.wish_bank_details FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE OR REPLACE FUNCTION public.get_wish_bank_details(_wish_id uuid)
RETURNS TABLE(bank_name text, account_number text, account_name text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to view transfer details'; END IF;
  RETURN QUERY SELECT b.bank_name, b.account_number, b.account_name
  FROM public.wish_bank_details b JOIN public.wishes w ON w.id = b.wish_id
  WHERE b.wish_id = _wish_id AND w.status IN ('active', 'partially_funded')
    AND w.user_id IS DISTINCT FROM auth.uid();
END; $$;
REVOKE ALL ON FUNCTION public.get_wish_bank_details(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_wish_bank_details(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.notify_wish_transfer_reported()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE wish_owner uuid; wish_title text;
BEGIN
  SELECT w.user_id, w.title INTO wish_owner, wish_title FROM public.wishes w WHERE w.id = NEW.wish_id;
  IF NEW.payment_status = 'pending' AND wish_owner IS NOT NULL AND NEW.contributor_id IS DISTINCT FROM wish_owner THEN
    INSERT INTO public.notifications(user_id, title, body, link)
    VALUES (wish_owner, 'Payment reported for your wish', 'A giver reported sending ₦' || to_char(NEW.amount, 'FM999,999,999,990') || ' for ' || wish_title || '. Check your bank account before confirming.', '/wish/' || NEW.wish_id);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER notify_transfer_reported AFTER INSERT ON public.contributions FOR EACH ROW EXECUTE FUNCTION public.notify_wish_transfer_reported();
CREATE OR REPLACE FUNCTION public.confirm_wish_transfer(_contribution_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to confirm a transfer'; END IF;
  UPDATE public.contributions c SET payment_status = 'succeeded'
  FROM public.wishes w WHERE c.id = _contribution_id AND c.wish_id = w.id
    AND w.user_id = auth.uid() AND c.payment_status = 'pending';
  RETURN FOUND;
END; $$;
REVOKE ALL ON FUNCTION public.confirm_wish_transfer(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_wish_transfer(uuid) TO authenticated;
DROP POLICY IF EXISTS "Contributors insert own" ON public.contributions;
CREATE POLICY "Contributors report own pending transfer" ON public.contributions FOR INSERT TO authenticated WITH CHECK (contributor_id = auth.uid() AND payment_status = 'pending' AND amount >= 500 AND amount <= 100000000 AND EXISTS (SELECT 1 FROM public.wishes w WHERE w.id = wish_id AND w.user_id IS DISTINCT FROM auth.uid() AND w.status IN ('active', 'partially_funded')));
CREATE POLICY "Wish owners read pending transfers" ON public.contributions FOR SELECT TO authenticated USING (payment_status = 'pending' AND EXISTS (SELECT 1 FROM public.wishes w WHERE w.id = wish_id AND w.user_id = auth.uid()));