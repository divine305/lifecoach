# LifeOS

LifeOS is a student productivity workspace. The frontend foundation includes responsive marketing and dashboard views, shared navigation, and a dark/light theme. Supabase authentication, profile onboarding, and the initial database schema are now wired for Phase 2.

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
- Protected application routes — require a valid session and completed onboarding.
- `/dashboard` — dashboard layout with clearly labeled sample data; task interactions remain local preview behavior and are not persisted.
- Theme preference — dark/light toggle saved locally and to the user's preferences.

## Supabase setup

1. Create a Supabase project and copy its project URL and anon/publishable key into `.env.local` using the names in `.env.example`. The frontend key is public; never put a service-role key in a `VITE_*` variable.
2. Apply `supabase/migrations/20261119140000_initial_schema.sql` to that project. With the Supabase CLI installed, run `npx supabase init` if this checkout has no `supabase/config.toml`, then `npx supabase login`, `npx supabase link --project-ref <project-ref>`, and `npx supabase db push`.
3. In Supabase Authentication settings, set the Site URL to your frontend origin and allow redirects to `<frontend-origin>/onboarding` and `<frontend-origin>/reset-password`.
4. Restart Vite after changing environment variables.

The migration creates profiles, preferences, and the core LifeOS tables; enables RLS for every user-owned table; constrains related rows to the same owner; and creates profile/preferences rows when an auth user is registered. Live authentication/database behavior still needs to be verified against a configured Supabase project.

## Deploy on Netlify

1. Push the project to a Git provider and import that repository in Netlify.
2. Netlify reads `netlify.toml`: build command `npm run build`, publish directory `dist`, and a single-page-app redirect for React Router routes.
3. In **Site configuration → Environment variables**, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` using the Supabase project URL and publishable key. Never add a service-role or secret key.
4. Deploy the site, then copy its primary HTTPS URL (for example, `https://your-site.netlify.app`).
5. In Supabase **Authentication → URL Configuration**, set the Site URL to that HTTPS origin and add `<site-url>/onboarding` and `<site-url>/reset-password` as redirect URLs.
6. Trigger a new Netlify deploy after changing environment variables. Test registration, email verification, password recovery, and a protected route refresh.
