# LiftLog (Supabase Edition)

A multi-file React + Vite workout tracker upgraded from a single-file localStorage MVP to a production-ready architecture using **Supabase Auth + Postgres + Row Level Security**.

## Why this architecture

- The original app is a React SPA with `templates`, `history`, and `activeWorkout` stored in one `localStorage` key, so the biggest production gaps are auth, sync, multi-device persistence, and secure user ownership. The uploaded code makes those limitations explicit. citeturn1search1
- Supabase is a strong fit because it gives you a React-friendly JavaScript client, a managed Postgres database, and built-in auth. Supabase documents the browser setup with a project URL + publishable key, and it explicitly states that service-role keys must never be used in the browser because they bypass RLS. citeturn3search21turn3search22

## What is included

- Multi-file Vite React app
- Email/password auth flow
- Supabase data layer
- SQL schema with RLS policies
- LocalStorage import migration
- Views for dashboard, active workout, templates, history, and progress

## Project structure

```text
liftlog-supabase/
  package.json
  vite.config.js
  .env.example
  supabase/
    schema.sql
  src/
    main.jsx
    styles.css
    App.jsx
    lib/
      supabase.js
      format.js
      workout-utils.js
      transformers.js
    hooks/
      useAuth.js
      useWorkoutAppData.js
    services/
      auth.js
      workouts.js
      templates.js
      migration.js
    components/
      AuthScreen.jsx
      TopNav.jsx
      SectionHeader.jsx
      StatCard.jsx
      EmptyState.jsx
      ExerciseCard.jsx
      LoadingScreen.jsx
    views/
      DashboardView.jsx
      ActiveWorkoutView.jsx
      TemplatesView.jsx
      HistoryView.jsx
      ProgressView.jsx
```

## 1) Create the Supabase project

1. Create a new Supabase project.
2. Copy the **Project URL** and **Publishable key** from the project connect/API settings. Supabase’s React quickstart uses those exact variables in `.env.local`. citeturn3search21
3. In **Authentication > Providers**, enable **Email** sign-in.
4. In **SQL Editor**, run the contents of `supabase/schema.sql`.

## 2) Configure environment variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Then set:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Use only the publishable/anon browser-safe key in the frontend. Do **not** expose `SUPABASE_SERVICE_ROLE_KEY`; Supabase says that key bypasses RLS and must stay server-side only. citeturn3search22

## 3) Install and run

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## 4) First-time workflow

1. Sign up with email + password.
2. Log in.
3. If you used the old localStorage MVP in this same browser profile, click **Import local data**.
4. Start a blank workout or a template workout.
5. Finish a workout to populate History and Progress.

## 5) How data works now

- **Remote source of truth:** templates, workouts, history, and sets live in Supabase.
- **Local draft cache:** an active workout is also mirrored in localStorage for resilience.
- **History:** a finished workout is just a row in `workouts` with `status='finished'`, matching the original app’s behavior. citeturn1search1

## 6) Troubleshooting

### Auth works but queries fail
- Re-check that you ran `supabase/schema.sql` completely.
- Make sure RLS policies were created.
- Verify the user is logged in.

### I get “Missing Supabase env vars”
- Make sure `.env.local` exists.
- Restart `npm run dev` after editing env vars.

### Import did nothing
- The import only works if the browser already has the original localStorage key:
  `weightlifting-tracker-v1`.

## 7) Suggested next improvements

- Add Google OAuth after email/password is stable.
- Move the “create workout from template” workflow into a Postgres function or Edge Function if you want a single server-side transaction.
- Add a progress SQL view if history gets large.

## 8) Production notes

- Deploy the React app to Vercel/Netlify/static hosting.
- Add only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to frontend hosting.
- Keep any future server-only secrets in Supabase secrets or your server environment; Supabase documents secret handling for server-side functions separately. citeturn3search22
