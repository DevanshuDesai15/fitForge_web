# FitForge

FitForge is a mobile-first workout tracker for planning training, logging sessions, and reviewing progress. It uses Clerk for sign-in, Supabase for user-scoped fitness data, and an authenticated Vercel function for optional OpenRouter-powered suggestions.

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?logo=clerk&logoColor=white)](https://clerk.com/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev/)

## What you can do

- Sign in securely and maintain a fitness profile with metric or imperial units.
- Browse the shared exercise catalog and create personal exercises.
- Build reusable multi-day workout templates and start a workout from a template or Quick Add.
- Log sets, reps, weight, notes, and completed workouts.
- Pause and resume the persisted workout timer without counting paused time; refreshes preserve the active session on the same browser.
- Keep the screen awake during an active workout when the browser supports the Screen Wake Lock API.
- Review workout history, personal records, volume trends, goals, and progress charts.
- Receive optional AI-assisted exercise search and progressive-overload suggestions when the server-side AI endpoint is configured.

FitForge requires a network connection for account and Supabase-backed data. It does not currently provide offline workout synchronization or push notifications.

## Architecture

| Area | Technology | Responsibility |
|---|---|---|
| Web app | React 18, Vite 6, React Router 7 | Routes, workout flows, and responsive UI |
| UI | Material UI 6, GSAP, Recharts | Components, motion, and progress visualizations |
| Authentication | Clerk | User sessions and Supabase-compatible session tokens |
| Data | Supabase Postgres, Row Level Security | Profiles, exercises, templates, workouts, goals, and AI records |
| Server state | TanStack Query | Queries, mutations, cache updates, and invalidation |
| AI | Vercel function, OpenRouter | Authenticated chat and embedding operations; secrets remain server-side |
| Observability | Sentry and PostHog | Optional error monitoring and product analytics |
| Hosting | Vercel | Vite build, SPA routing, and `/api/ai` |

Clerk's native Supabase integration adds the required claims to its normal session token. The browser passes that token to Supabase, where Row Level Security restricts user-owned rows by the Clerk subject. Public exercise-catalog reads are the intentional exception.

RLS convention: `profiles` is the identity row and compares the Clerk subject to
`profiles.id`. User-owned child tables store the same subject in `user_id` and
compare against that column. New policies should copy the current patterns in
`supabase/migrations/20260406_phase3_schema_alignment_and_rls.sql`; do not use
`profiles.user_id`, because that column does not exist.

The app uses Supabase's first-class Clerk Third-Party Auth integration. It does
not request the deprecated Clerk `supabase` JWT template.

## Local setup

### Prerequisites

- Node.js 20 or newer
- npm
- A Clerk application
- A Supabase project linked to Clerk authentication
- Optional: an OpenRouter key and a Vercel-compatible local or deployed environment for AI features

### 1. Install the project

```bash
git clone https://github.com/DevanshuDesai15/fitForge_web.git
cd fitForge_web
npm install
```

### 2. Prepare Clerk and Supabase

1. In Clerk, activate the Supabase integration for the application instance.
2. In Supabase, add Clerk under Authentication → Sign In / Providers → Third-Party Auth and use the Clerk instance domain.
3. Apply the SQL files in `supabase/migrations/` in filename order to a new database.
4. Review the resulting Row Level Security policies before using real user data.

The repository also contains `supabase/functions/clerk-webhook/` for profile synchronization when a Clerk webhook workflow is desired. The app itself additionally syncs the signed-in profile from the browser.

### 3. Configure environment variables

Copy the example file and replace its placeholders:

```bash
cp .env.example .env.local
```

The core browser app requires:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

`VITE_*` values are embedded in the browser bundle. Never put a service-role key, Clerk secret, or OpenRouter key in a `VITE_*` variable.

These values are optional for local browser development:

- `VITE_SENTRY_DSN` and `VITE_SENTRY_ENVIRONMENT`
- `VITE_POSTHOG_KEY` and `VITE_POSTHOG_HOST`
- The browser-safe OpenRouter feature controls documented in `.env.example`
- `VITE_AI_PROVIDER_PRIORITY` to control the provider's share when AI and rule-based suggestions are combined

Deprecated `VITE_HUGGINGFACE_*` and `VITE_GEMINI_*` variables remain accepted as lower-priority compatibility fallbacks, but new environments should use `VITE_OPENROUTER_*` names.

`SUPABASE_SERVICE_ROLE_KEY` is not used by the browser app. Reserve it for trusted administrative scripts, including exercise-catalog imports, and never expose it to client code.

### 4. Start the app

```bash
npm run dev
```

Vite prints the local URL, normally `http://localhost:5173`. Core authentication, workout, and progress features run through Vite once Clerk and Supabase are configured.

The AI client calls `/api/ai`, which is implemented as a Vercel function and mounted as local Vite middleware during `npm run dev`. Configure these server-only variables locally and in the deployed environment:

```env
OPENROUTER_API_KEY=sk-or-v1_...
OPENROUTER_MODEL=openai/gpt-5-mini
OPENROUTER_EMBEDDING_MODEL=intfloat/multilingual-e5-large
CLERK_SECRET_KEY=sk_test_...
# Or use CLERK_JWT_KEY instead of CLERK_SECRET_KEY
CLERK_AUTHORIZED_PARTIES=http://localhost:5173,https://your-domain.example
```

`CLERK_AUTHORIZED_PARTIES` must include every origin allowed to call the endpoint. The API rejects unauthenticated requests and supports only its fixed `chat` and `embedding` operations.

## Workspace commands

```bash
npm ci
npm run dev:web
npm run dev:mobile
npm run lint
npm run test
npm run typecheck
npm run build:web
```

## Development commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite web development server |
| `npm run dev:mobile` | Start Expo for a development build |
| `npm run build` | Create the web production bundle in `apps/web/dist/` |
| `npm run preview` | Preview the production bundle locally |
| `npm run test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run lint` | Run ESLint across the repository |

Pull requests targeting `main` run install, lint, and test checks through `.github/workflows/main.yml`.

## Project layout

```text
api/                         Vercel server functions
apps/web/                    Vite browser application
apps/mobile/                 Expo Router mobile application
packages/                    Platform-neutral TypeScript packages
scripts/                     Maintenance and exercise-import scripts
supabase/
  functions/                 Supabase Edge Functions
  migrations/                Ordered schema and RLS migrations
```

## Deployment

FitForge is configured for Vercel in `vercel.json`.

1. Run `npm run test`, `npm run lint`, and `npm run build` locally.
2. Import the repository into Vercel.
3. Add the required browser variables and any optional observability variables.
4. Add the server-only OpenRouter and Clerk variables if AI features are enabled.
5. Review a preview deployment before promoting it to production.

Do not commit `.env` or `.env.local`. After changing any browser-facing environment variable, rebuild and redeploy because Vite substitutes those values at build time.

## Troubleshooting

### The app reports a missing Clerk publishable key

Confirm `VITE_CLERK_PUBLISHABLE_KEY` is present in `.env.local`, then restart the development server.

### Sign-in works but Supabase requests fail

- Confirm `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` point to the same project.
- Confirm the Clerk Supabase integration and the Supabase Clerk Third-Party Auth provider are both enabled for the same Clerk instance domain.
- Inspect the applied migrations and live Row Level Security policies.
- Verify the authenticated Clerk subject matches the `user_id` or profile identifier stored by the app.

### AI suggestions are unavailable

- Restart `npm run dev` after changing server-only variables; Vite mounts `api/ai.js` locally at `/api/ai`.
- Check the server-only OpenRouter and Clerk variables in that environment.
- Ensure `CLERK_AUTHORIZED_PARTIES` contains the exact calling origin.
- Check `VITE_OPENROUTER_EMERGENCY_DISABLE`; setting it to `true` intentionally disables AI calls.

### Production routes return 404

Confirm the deployment uses `vercel.json`, whose SPA rewrite sends client routes to `index.html`.

## Contributing

Create a focused feature branch, follow the existing React and Material UI patterns, add or update tests for behavior changes, and run the test, lint, and build commands before opening a pull request. Update this README whenever a change affects setup, public behavior, configuration, or deployment.

## Acknowledgments

FitForge is built with React, Material UI, Clerk, Supabase, OpenRouter, and the broader open-source ecosystem.
