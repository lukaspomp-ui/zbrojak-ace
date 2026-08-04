# Zbroják 2026

Build a mobile-first exam test-prep app. It must be a CONFIG-DRIVEN SKELETON: the same codebase will later power 5–7 different exam apps by changing one env variable + the data. First instance = Czech firearms license exam ("Zbrojní průkaz 2026"). All user-facing text in Czech.

TECH STACK

- React + Vite + Tailwind CSS + Lucide icons + Framer Motion

- Supabase (Postgres + Auth + Storage) for backend

- Dark mode by default, mobile-first (will later be wrapped with Capacitor for App Store / Google Play)

MULTI-TENANT CONFIG

- App is driven by env var VITE_CURRENT_APP_ID (default 'zbrojak')

- On load, fetch the matching row from the `apps` table and use it for theming: app name, primary color, logo. Nothing about the exam should be hardcoded — it all comes from the DB filtered by app_id.

SUPABASE SCHEMA (with Row Level Security)

- apps: id (text PK), name, primary_color, logo_url

- subjects: id, app_id (FK), name, sort_order

- questions: id, app_id (FK), subject_id (FK), text, explanation, image_url (nullable)

- answers: id, question_id (FK), text, is_correct (bool)

- profiles: id (FK auth.users), is_premium (bool default false)

- user_progress: id, user_id (FK), question_id (FK), times_wrong (int default 0), correct_streak (int default 0), mastered (bool default false), last_answered_at

- question_reports: id, user_id, question_id, message, created_at

RLS: everyone can read apps/subjects/questions/answers for their app; user_progress, profiles and question_reports are scoped to the logged-in user only.

AUTH

- Supabase Auth. Allow anonymous/guest sessions so users can try the free tier without signing up. Prompt sign-up (email) at the paywall.

SCREENS

1) Dashboard

- Overall progress in % (mastered questions ÷ total questions for this app)

- Primary button "Spustit ostrý test" → timed exam: 30 random questions, 20-minute limit, pass/fail summary at the end

- Primary button "Procvičit mé chyby" → dynamic set of the user's non-mastered wrong questions, ordered by times_wrong desc

- List of subjects (loaded from `subjects`): "Právní předpisy", "Nauka o zbraních a střelivu", "Zdravotnická příprava" → tap to practice that subject

2) Quiz screen (shared by all modes)

- Clean card UI, dark mode

- Shows: question text, optional image (tap to open fullscreen zoom), and 3 answer options

- Immediate visual feedback on tap: correct = green, wrong = red AND highlight the correct one

- After answering, an expandable box "Proč je to správně" shows the explanation + the referenced paragraph/law

- "Nahlásit chybu" button → opens a modal, saves the report into question_reports

- Progress indicator (e.g. "5 / 30"), smooth Framer Motion transitions between questions

3) Spaced repetition logic

- On WRONG answer: times_wrong++, correct_streak = 0, mastered = false

- On CORRECT answer: correct_streak++; if correct_streak >= 2 → mastered = true

- "Procvičit mé chyby" keeps serving non-mastered wrong questions until answered correctly twice in a row

4) Paywall

- Free tier: first 50 questions total + 1 trial "ostrý test"

- Gate the following behind premium: questions beyond the first 50, "Procvičit mé chyby", and additional ostré testy

- Paywall copy (Czech):

  Headline: "Uděláš zbroják napoprvé."

  Sub: "Odemkni kompletní databázi a procvičování chyb."

  Price: "299 Kč jednorázově"

  Benefits list: "Neomezená databáze všech otázek", "Chytrý algoritmus na opakování chyb", "Kompletní vysvětlení paragrafů", "Garance aktualizace pro rok 2026"

- Entitlement is the `profiles.is_premium` flag. Wire the paywall UI and all gating against this flag now. The purchase button should, for now, just set is_premium = true (placeholder), so the flow is fully testable. Real in-app purchase gets wired later.

DESIGN

- Modern, dark, no ads, clean card-based UI, rounded cards, subtle Framer Motion animations, Lucide icons

- Use the primary_color from the `apps` row for accents

SEED DATA

- Insert the 'zbrojak' row into `apps`, the 3 subjects, and ~8 sample questions across the subjects (each with 3 answers, one correct, and a Czech explanation with a paragraph reference) so the app is testable immediately.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://zbrojak-ace.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/59f1c3d3-a53b-45f6-9ca4-b71c4a274251).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
