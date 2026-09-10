-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
CREATE TYPE public.wish_status AS ENUM ('draft','pending_verification','active','partially_funded','fulfilled','closed');
CREATE TYPE public.verification_status AS ENUM ('unverified','pending','verified','rejected');
CREATE TYPE public.payment_status AS ENUM ('pending','succeeded','failed','refunded');
CREATE TYPE public.report_reason AS ENUM ('fraud','misleading','offensive','duplicate','other');
CREATE TYPE public.report_status AS ENUM ('open','reviewing','resolved','dismissed');

-- UPDATED_AT HELPER
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Wishr member',
  bio TEXT,
  avatar_url TEXT,
  email TEXT,
  phone TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- NEW USER TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CATEGORIES
CREATE TABLE public.wish_categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.wish_categories TO anon, authenticated;
GRANT ALL ON public.wish_categories TO service_role;
ALTER TABLE public.wish_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are public" ON public.wish_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage categories" ON public.wish_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.wish_categories (slug, name, sort_order) VALUES
  ('education','Education',1),('family','Family',2),('emergency','Emergency',3),
  ('business','Business',4),('technology','Technology',5),('personal','Personal',6),
  ('creative','Creative',7),('other','Other',8);

-- WISHES
CREATE TABLE public.wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  description TEXT NOT NULL,
  category TEXT NOT NULL REFERENCES public.wish_categories(slug),
  goal_amount NUMERIC(12,2) NOT NULL CHECK (goal_amount > 0),
  amount_raised NUMERIC(12,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  deadline DATE,
  status public.wish_status NOT NULL DEFAULT 'active',
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  verification_status public.verification_status NOT NULL DEFAULT 'unverified',
  creator_display_name TEXT NOT NULL DEFAULT 'Wishr member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX wishes_status_idx ON public.wishes (status, created_at DESC);
CREATE INDEX wishes_category_idx ON public.wishes (category);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishes TO authenticated;
GRANT SELECT ON public.wishes TO anon;
GRANT ALL ON public.wishes TO service_role;
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER wishes_updated_at BEFORE UPDATE ON public.wishes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Published wishes are public" ON public.wishes FOR SELECT TO anon, authenticated
  USING (status IN ('active','partially_funded','fulfilled') AND verification_status <> 'rejected');
CREATE POLICY "Creators read own wishes" ON public.wishes FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Creators insert own wishes" ON public.wishes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Creators update own wishes" ON public.wishes FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Creators delete own wishes" ON public.wishes FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- CONTRIBUTIONS
CREATE TABLE public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id UUID NOT NULL REFERENCES public.wishes(id) ON DELETE CASCADE,
  contributor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contributor_display_name TEXT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  message TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  transaction_reference TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX contributions_wish_idx ON public.contributions (wish_id, created_at DESC);
GRANT SELECT, INSERT ON public.contributions TO authenticated;
GRANT SELECT ON public.contributions TO anon;
GRANT ALL ON public.contributions TO service_role;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Successful contributions are public" ON public.contributions FOR SELECT TO anon, authenticated USING (payment_status = 'succeeded');
CREATE POLICY "Contributors read own" ON public.contributions FOR SELECT TO authenticated USING (contributor_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Contributors insert own" ON public.contributions FOR INSERT TO authenticated WITH CHECK (contributor_id = auth.uid());

-- keep amount_raised in sync
CREATE OR REPLACE FUNCTION public.sync_wish_amount_raised()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target UUID; total NUMERIC; goal NUMERIC; cur public.wish_status;
BEGIN
  target := COALESCE(NEW.wish_id, OLD.wish_id);
  SELECT COALESCE(SUM(amount),0) INTO total FROM public.contributions WHERE wish_id = target AND payment_status = 'succeeded';
  SELECT goal_amount, status INTO goal, cur FROM public.wishes WHERE id = target;
  UPDATE public.wishes SET amount_raised = total,
    status = CASE
      WHEN cur IN ('draft','pending_verification','closed') THEN cur
      WHEN total >= goal THEN 'fulfilled'::public.wish_status
      WHEN total > 0 THEN 'partially_funded'::public.wish_status
      ELSE 'active'::public.wish_status END
  WHERE id = target;
  RETURN NULL;
END; $$;
CREATE TRIGGER contributions_sync AFTER INSERT OR UPDATE OR DELETE ON public.contributions FOR EACH ROW EXECUTE FUNCTION public.sync_wish_amount_raised();

-- WISH UPDATES
CREATE TABLE public.wish_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id UUID NOT NULL REFERENCES public.wishes(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wish_updates TO authenticated;
GRANT SELECT ON public.wish_updates TO anon;
GRANT ALL ON public.wish_updates TO service_role;
ALTER TABLE public.wish_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Wish updates are public" ON public.wish_updates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Creators write updates" ON public.wish_updates FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.wishes w WHERE w.id = wish_id AND w.user_id = auth.uid()));
CREATE POLICY "Creators delete updates" ON public.wish_updates FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- REPORTS
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id UUID NOT NULL REFERENCES public.wishes(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason public.report_reason NOT NULL,
  details TEXT,
  status public.report_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reporters insert" ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Admins read reports" ON public.reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator') OR reporter_id = auth.uid());
CREATE POLICY "Admins update reports" ON public.reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notifications" ON public.notifications FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- SEED SAMPLE WISHES
INSERT INTO public.wishes (id, title, summary, description, category, goal_amount, deadline, status, is_anonymous, verification_status, creator_display_name, created_at) VALUES
('11111111-1111-4111-8111-000000000001','Help me complete my final year project','I need materials and printing for my final year engineering project.','I am in my final semester studying mechanical engineering. The project needs components, printing and binding, and the department deadline is in three weeks. I have covered part of it from my holiday job, but the rest is out of reach right now. Anything at all moves me closer.','education',120000,current_date + 21,'active',false,'verified','Chidera O.', now() - interval '2 days'),
('11111111-1111-4111-8111-000000000002','Help me get a laptop for school','My studies moved online and I have been borrowing a laptop.','Most of my coursework and submissions are now online. I have been borrowing a friend''s laptop late at night, which means I often submit at the last minute. A basic laptop of my own would change how I study completely.','technology',350000,current_date + 40,'active',false,'verified','Amaka E.', now() - interval '5 days'),
('11111111-1111-4111-8111-000000000003','I want to surprise my mum','She turns 60 this year and has never had a day that was just hers.','My mother raised four of us on a small trading income and has never once celebrated herself. I want to give her a proper birthday: a small gathering, a good meal, and a photograph she can frame. Nothing extravagant, just hers.','family',150000,current_date + 30,'active',false,'unverified','Tunde B.', now() - interval '1 day'),
('11111111-1111-4111-8111-000000000004','Help me start my photography business','I have the skill and the clients. I need my own camera.','I have been shooting with rented equipment for two years and giving most of what I earn back to the rental shop. Owning a body and one lens would let me take bookings any day of the week and finally keep what I earn.','business',500000,current_date + 60,'active',false,'verified','Ifeanyi A.', now() - interval '9 days'),
('11111111-1111-4111-8111-000000000005','A second grill for my suya stand','Business has outgrown one burner and I turn people away.','My stand by the roundabout gets busy from six in the evening. With one grill I can only serve about half the queue before people leave. A modest second grill means I stop turning customers away during the rush.','business',120000,current_date + 25,'active',false,'unverified','Adaeze N.', now() - interval '3 days'),
('11111111-1111-4111-8111-000000000006','Physiotherapy sessions for my father','He has been on his feet for forty years and his back gave out.','My father worked as a carpenter his whole life. Last month his back gave out and he can barely walk to the gate. The clinic recommended six physiotherapy sessions. We have managed two. Four more would get him walking to the market again.','emergency',96000,current_date + 14,'active',true,'verified','Anonymous', now() - interval '6 hours'),
('11111111-1111-4111-8111-000000000007','Studio time to finish my first EP','Four songs recorded, two to go.','I have been writing for three years and finally have six songs I believe in. Four are recorded. The studio charges per session and I have run out. Two more sessions and mixing would let me release properly instead of leaving it unfinished.','creative',180000,current_date + 45,'active',false,'unverified','Zainab M.', now() - interval '11 days'),
('11111111-1111-4111-8111-000000000008','A sewing machine to restart my tailoring shop','The flood took my machine. My customers are still waiting.','Last year''s flood destroyed the shop, including the industrial machine I had saved four years for. My regular customers still call. One machine is all I need to open the doors again and start taking orders.','personal',220000,current_date + 35,'active',false,'verified','Grace U.', now() - interval '15 days');

INSERT INTO public.contributions (wish_id, contributor_display_name, amount, is_anonymous, payment_status, transaction_reference, message, created_at) VALUES
('11111111-1111-4111-8111-000000000001','Anonymous',25000,true,'succeeded','seed-001','', now() - interval '1 day'),
('11111111-1111-4111-8111-000000000001','Bola A.',12000,false,'succeeded','seed-002','You are almost there.', now() - interval '20 hours'),
('11111111-1111-4111-8111-000000000001','Anonymous',38000,true,'succeeded','seed-003',NULL, now() - interval '6 hours'),
('11111111-1111-4111-8111-000000000002','Emeka D.',120000,false,'succeeded','seed-004','Good luck with school.', now() - interval '4 days'),
('11111111-1111-4111-8111-000000000002','Anonymous',90000,true,'succeeded','seed-005',NULL, now() - interval '2 days'),
('11111111-1111-4111-8111-000000000003','Anonymous',60000,true,'succeeded','seed-006','Mothers deserve this.', now() - interval '18 hours'),
('11111111-1111-4111-8111-000000000003','Kemi S.',30000,false,'succeeded','seed-007',NULL, now() - interval '10 hours'),
('11111111-1111-4111-8111-000000000004','Anonymous',180000,true,'succeeded','seed-008',NULL, now() - interval '7 days'),
('11111111-1111-4111-8111-000000000005','Uche P.',48000,false,'succeeded','seed-009','Enjoy your suya money back.', now() - interval '2 days'),
('11111111-1111-4111-8111-000000000006','Anonymous',72000,true,'succeeded','seed-010',NULL, now() - interval '5 hours'),
('11111111-1111-4111-8111-000000000006','Dr. Nnamdi',24000,false,'succeeded','seed-011','Wishing him a quick recovery.', now() - interval '2 hours'),
('11111111-1111-4111-8111-000000000007','Anonymous',35000,true,'succeeded','seed-012',NULL, now() - interval '8 days'),
('11111111-1111-4111-8111-000000000008','Anonymous',150000,true,'succeeded','seed-013',NULL, now() - interval '12 days'),
('11111111-1111-4111-8111-000000000008','Chika O.',30000,false,'succeeded','seed-014','Welcome back.', now() - interval '3 days');

INSERT INTO public.wish_updates (wish_id, body, created_at) VALUES
('11111111-1111-4111-8111-000000000001','Thank you all. I have bought the components and started assembly this week.', now() - interval '12 hours'),
('11111111-1111-4111-8111-000000000006','He completed his third session today and walked to the gate on his own.', now() - interval '3 hours');