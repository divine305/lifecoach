# LifeOS

LifeOS is a student productivity workspace built with React, TypeScript, and Supabase. Signed-in users can manage their own tasks, calendar, coursework, focus sessions, habits, goals, finances, notes, reminders, and preferences.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Copy `.env.example` to `.env.local`, fill in your Supabase project URL and anon/publishable key, then run `npm run dev`. Without valid credentials, public pages remain available and auth pages explain which setup is missing.

## Validation

```sh
npm run lint
npm run build
```

## Current scope

- `/` — responsive LifeOS landing page.
- `/register`, `/login`, `/forgot-password`, and `/reset-password` — Supabase email/password auth, email verification support, and recovery flow.
- `/onboarding` — authenticated student profile and preferences setup. Optional academic details can be skipped.
- `/dashboard` — account-derived task, schedule, focus, grade, goal, weekly calendar, assignment, exam, habit, and monthly finance summaries; dashboard task actions persist to Supabase.
- `/ai-coach` — private conversation history and a contextual AI coach for study planning and deadlines. Suggested tasks and calendar events require your confirmation before they are saved.
- Protected application routes — planner, calendar, courses, assignments, exams, grades, focus timer, habits and daily completions, goals and milestones, manual finances, notes, in-app reminders, analytics, settings, and a private weekly review.
- User records are stored in Supabase and queried by authenticated user; database row-level security is enabled for user-owned data.
- Entries are manual. There is no bank sync, Google Calendar sync, email reminder, or push notification integration.
- Theme and profile preferences are saved to the user's account; the theme is also cached locally.

## Supabase setup

1. Create a Supabase project and copy its project URL and anon/publishable key into `.env.local` using the names in `.env.example`. The frontend key is public; never put a service-role key in a `VITE_*` variable.
2. With the CLI installed, run `npx supabase login`, `npx supabase link --project-ref <project-ref>`, and `npx supabase db push` to apply the migrations in order. For an existing project, review the migration history before pushing; do not reapply a schema that was installed outside the CLI.
3. In Supabase Authentication settings, set the Site URL to your frontend origin and allow redirects to `<frontend-origin>/onboarding` and `<frontend-origin>/reset-password`.
4. Restart Vite after changing environment variables.

The migrations create profiles, preferences, and the LifeOS tables; enable RLS for every user-owned table; constrain related rows to the same owner; and create profile/preferences rows when an auth user is registered. Build and lint checks do not replace testing against your configured Supabase project.

### AI Life Coach setup

The AI coach calls the `lifeos-ai-coach` Supabase Edge Function. Deploy it with `npx supabase functions deploy lifeos-ai-coach`, then add `OPENAI_API_KEY` as a Supabase Edge Function secret. Optionally set `OPENAI_MODEL` (defaults to `gpt-4o-mini`) and `LIFEOS_ALLOWED_ORIGINS` to a comma-separated list of exact frontend origins, including `http://localhost:5173` for local development and your deployed HTTPS origin (for example, `https://lifeui.netlify.app`). Keep the provider key in Supabase secrets; never put it in `.env.local`, a `VITE_*` variable, or frontend code.

The function validates the signed-in user, loads only that user's relevant records, and stores each conversation with row-level security. AI-proposed tasks and calendar events are not written automatically; review and confirm each proposal in the chat.

## Deploy on Netlify

1. Push the project to a Git provider and import that repository in Netlify.
2. Netlify reads `netlify.toml`: build command `npm run build`, publish directory `dist`, and a single-page-app redirect for React Router routes.
3. In **Site configuration → Environment variables**, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` using the Supabase project URL and publishable key. Never add a service-role or secret key.
4. Deploy the site, then copy its primary HTTPS URL (for example, `https://your-site.netlify.app`).
5. In Supabase **Authentication → URL Configuration**, set the Site URL to that HTTPS origin and add `<site-url>/onboarding` and `<site-url>/reset-password` as redirect URLs.
6. Add the deployed origin to `LIFEOS_ALLOWED_ORIGINS` in Supabase Edge Function secrets if using the AI coach.
7. Trigger a new Netlify deploy after changing environment variables. Test registration, email verification, password recovery, and a protected route refresh.

## Testing the workspace

After applying the migrations and signing in, add calendar events, coursework, a habit, a transaction, and a budget to verify the dashboard previews against your records. Start a focus session and confirm it appears in Focus history and Analytics. Open **AI Life Coach**, send a prompt, create a new conversation, and confirm any proposed task or event only appears in your records after selecting **Add**. On a narrow viewport, check the navigation drawer and scroll the weekly timetable horizontally without page-level horizontal overflow.
