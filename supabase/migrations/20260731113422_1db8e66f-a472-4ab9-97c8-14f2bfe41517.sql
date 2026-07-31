
CREATE TABLE public.apps (
  id text PRIMARY KEY,
  name text NOT NULL,
  primary_color text NOT NULL DEFAULT '#f59e0b',
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.apps TO anon, authenticated;
GRANT ALL ON public.apps TO service_role;
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Apps are public" ON public.apps FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id text NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.subjects TO anon, authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subjects are public" ON public.subjects FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id text NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  text text NOT NULL,
  explanation text NOT NULL DEFAULT '',
  image_url text,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.questions TO anon, authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions are public" ON public.questions FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  text text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.answers TO anon, authenticated;
GRANT ALL ON public.answers TO service_role;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Answers are public" ON public.answers FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_premium boolean NOT NULL DEFAULT false,
  exam_attempts_used int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  times_wrong int NOT NULL DEFAULT 0,
  correct_streak int NOT NULL DEFAULT 0,
  mastered boolean NOT NULL DEFAULT false,
  last_answered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_progress TO authenticated;
GRANT ALL ON public.user_progress TO service_role;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own progress" ON public.user_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.question_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.question_reports TO authenticated;
GRANT ALL ON public.question_reports TO service_role;
ALTER TABLE public.question_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own reports read" ON public.question_reports FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own reports insert" ON public.question_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Seed data
INSERT INTO public.apps (id, name, primary_color, logo_url)
VALUES ('zbrojak', 'Zbrojní průkaz 2026', '#f0a021', null);

INSERT INTO public.subjects (id, app_id, name, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'zbrojak', 'Právní předpisy', 1),
  ('22222222-2222-2222-2222-222222222222', 'zbrojak', 'Nauka o zbraních a střelivu', 2),
  ('33333333-3333-3333-3333-333333333333', 'zbrojak', 'Zdravotnická příprava', 3);

INSERT INTO public.questions (id, app_id, subject_id, text, explanation, sort_order) VALUES
  ('aaaa0001-0000-0000-0000-000000000001','zbrojak','11111111-1111-1111-1111-111111111111','Od kolika let lze zpravidla vydat zbrojní průkaz skupiny B, C, D nebo E?','Podle § 18 zákona č. 119/2002 Sb. o střelných zbraních a střelivu lze zbrojní průkaz skupiny B, C, D nebo E vydat osobě starší 21 let; u skupiny A (sběratelské) rovněž 21 let. Výjimky pro sportovce a myslivce od 18 let stanoví § 19.',1),
  ('aaaa0001-0000-0000-0000-000000000002','zbrojak','11111111-1111-1111-1111-111111111111','Jak dlouho je platný zbrojní průkaz vydaný po 1. 1. 2021?','Zbrojní průkaz je podle § 23 zákona č. 119/2002 Sb. platný 10 let. Před uplynutím platnosti je nutné požádat o vydání nového a předložit nový posudek o zdravotní způsobilosti.',2),
  ('aaaa0001-0000-0000-0000-000000000003','zbrojak','11111111-1111-1111-1111-111111111111','Do kdy musí držitel zbraně kategorie B ohlásit její ztrátu nebo odcizení?','Podle § 42 odst. 1 zákona č. 119/2002 Sb. je držitel povinen ohlásit ztrátu nebo odcizení zbraně, střeliva, zbrojního průkazu nebo průkazu zbraně neprodleně, nejpozději do 2 pracovních dnů, kterémukoli policejnímu útvaru.',3),
  ('aaaa0001-0000-0000-0000-000000000004','zbrojak','22222222-2222-2222-2222-222222222222','Co znamená pojem „kalibr“ u kulové zbraně?','Kalibr vyjadřuje jmenovitý průměr vývrtu hlavně (u drážkovaného vývrtu měřený mezi poli), případně rozměrové označení odpovídajícího náboje. Terminologii upravuje ČSN 39 5002 a vyhláška č. 221/2017 Sb.',1),
  ('aaaa0001-0000-0000-0000-000000000005','zbrojak','22222222-2222-2222-2222-222222222222','Jak se správně postupuje před odložením zbraně na stole na střelnici?','Zbraň se vždy vybije, vyjme se zásobník, zkontroluje se nábojová komora a zbraň se odkládá s otevřeným závěrem a hlavní směřující do bezpečného prostoru. Vyplývá to z § 29 odst. 1 zákona č. 119/2002 Sb. (povinnost dbát zvýšené opatrnosti) a z provozního řádu střelnice dle § 55.',2),
  ('aaaa0001-0000-0000-0000-000000000006','zbrojak','22222222-2222-2222-2222-222222222222','K čemu slouží tzv. „přebíjecí“ (zápalková) slož v náboji?','Zápalková slož po úderu zápalníku iniciuje zážeh výmetné náplně (prachu), jejíž plyny udělí střele rychlost. Náboj se skládá z nábojnice, zápalky, výmetné náplně a střely – viz základní nauka o střelivu a vyhláška č. 221/2017 Sb.',3),
  ('aaaa0001-0000-0000-0000-000000000007','zbrojak','33333333-3333-3333-3333-333333333333','Jaká je správná frekvence stlačení hrudníku při resuscitaci dospělého?','Podle platných doporučení (Guidelines ERC) je frekvence 100–120 stlačení za minutu do hloubky 5–6 cm, v poměru 30 stlačení : 2 vdechy. Znalost první pomoci vyžaduje § 21 zákona č. 119/2002 Sb. v rámci zkoušky odborné způsobilosti.',1),
  ('aaaa0001-0000-0000-0000-000000000008','zbrojak','33333333-3333-3333-3333-333333333333','Jak zastavíme masivní tepenné krvácení na paži?','Přiložíme tlakový obvaz, a pokud krvácení nelze zastavit, použijeme zaškrcovadlo (turniket) nad ránou a zaznamenáme čas přiložení. Následně voláme 155. Postup odpovídá standardům první pomoci vyučovaným v rámci zdravotnické přípravy ke zkoušce dle § 21 zákona č. 119/2002 Sb.',2);

INSERT INTO public.answers (question_id, text, is_correct, sort_order) VALUES
  ('aaaa0001-0000-0000-0000-000000000001','Od 18 let',false,1),
  ('aaaa0001-0000-0000-0000-000000000001','Od 21 let',true,2),
  ('aaaa0001-0000-0000-0000-000000000001','Od 25 let',false,3),
  ('aaaa0001-0000-0000-0000-000000000002','5 let',false,1),
  ('aaaa0001-0000-0000-0000-000000000002','10 let',true,2),
  ('aaaa0001-0000-0000-0000-000000000002','Neomezeně',false,3),
  ('aaaa0001-0000-0000-0000-000000000003','Neprodleně, nejpozději do 2 pracovních dnů',true,1),
  ('aaaa0001-0000-0000-0000-000000000003','Do 30 dnů',false,2),
  ('aaaa0001-0000-0000-0000-000000000003','Není povinnost hlásit',false,3),
  ('aaaa0001-0000-0000-0000-000000000004','Délku hlavně v milimetrech',false,1),
  ('aaaa0001-0000-0000-0000-000000000004','Jmenovitý průměr vývrtu hlavně, resp. rozměr náboje',true,2),
  ('aaaa0001-0000-0000-0000-000000000004','Hmotnost střely v gramech',false,3),
  ('aaaa0001-0000-0000-0000-000000000005','Zbraň vybít, vyjmout zásobník, otevřít závěr, hlaveň do bezpečného prostoru',true,1),
  ('aaaa0001-0000-0000-0000-000000000005','Stačí zajistit pojistkou a odložit nabitou',false,2),
  ('aaaa0001-0000-0000-0000-000000000005','Odložit hlavní směrem ke střelcům, aby byla po ruce',false,3),
  ('aaaa0001-0000-0000-0000-000000000006','Iniciuje zážeh výmetné náplně po úderu zápalníku',true,1),
  ('aaaa0001-0000-0000-0000-000000000006','Zvyšuje hmotnost střely',false,2),
  ('aaaa0001-0000-0000-0000-000000000006','Chladí hlaveň při výstřelu',false,3),
  ('aaaa0001-0000-0000-0000-000000000007','60–80 stlačení za minutu',false,1),
  ('aaaa0001-0000-0000-0000-000000000007','100–120 stlačení za minutu',true,2),
  ('aaaa0001-0000-0000-0000-000000000007','140–160 stlačení za minutu',false,3),
  ('aaaa0001-0000-0000-0000-000000000008','Tlakový obvaz, případně turniket nad ránou a záznam času',true,1),
  ('aaaa0001-0000-0000-0000-000000000008','Ránu vymyjeme vodou a necháme volně krvácet',false,2),
  ('aaaa0001-0000-0000-0000-000000000008','Přiložíme led a čekáme na příjezd záchranky',false,3);
