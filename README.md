# Food Recommendations

An internal Triomics tool for sharing and discovering the best dishes around — submit a recommendation with photos, browse/filter/search everyone else's, like and comment on them, and moderate the results as an admin.

Live at: https://food-recommendations-six.vercel.app

## Features

- **Submit a recommendation** — dish name, restaurant, star rating, price, up to 5 photos (camera capture on phones, drag-and-drop on desktop; large photos and iPhone HEIC are resized/converted to JPEG in the browser to stay under Vercel's 4.5MB request limit), optional notes and reviewer name, with a live card preview. The category (Biryani, Chicken, Paneer, Chinese, South Indian, Rolls & Bowls, Other) is auto-detected from the dish name and can be overridden. No account needed: a secret edit token is generated per submission and kept in the browser's `localStorage`, letting the submitter edit or delete it later.
- **Browse, filter, sort, search** — by category, star rating, price, and a fuzzy (typo-tolerant) search over dish/restaurant name backed by Postgres `pg_trgm`. Sort by newest, most liked, highest rated, or trending (this ISO week). Cursor-based (keyset) pagination, not offset-based.
- **Likes and reports** — one like/report per browser per recommendation (tracked client-side), rate-limited server-side per IP.
- **Comments and a photo gallery** on each recommendation's permalink page (`/recommendation/[id]`).
- **Curated Spots** (`/restaurants`, `/restaurants/[slug]`) — every restaurant with its dish count, average rating, price range and likes; names typed differently ("Meghana Foods" / "meghana  foods") are grouped as one spot.
- **Leaderboard** (`/leaderboard`) — top recommenders (by the name entered on each post), most-liked dishes, best-rated spots.
- **On this device** (`/me`) — posts made from this browser and bookmarked ("saved") dishes, both kept in `localStorage`; there are no user accounts.
- **Tasting Guidelines** (`/guidelines`) — rating scale, what makes useful notes and photos, how categories are detected, reporting.
- **Admin dashboard** (`/admin`) — lists every recommendation, delete any of them, export everything as CSV.
- **Admin accounts and audit log** — the owner signs in with `ADMIN_PASSWORD` (username left blank) and can add/remove named admins and reset their passwords on `/admin/team`. Sessions are stored server-side (`AdminSession`), so removing an admin, resetting their password or changing `ADMIN_PASSWORD` signs the affected sessions out. Every sign-in, failed sign-in, delete, report dismissal, export and team change is recorded in `/admin/audit` under the admin's name.
- **Moderation queue** (`/admin/reports`) — recommendations with open reports, sorted by report count, with a one-click dismiss.
- **New-review notifications** — a 🔔 in the header shows every visitor how many recommendations *other people* submitted since they last checked (your own never count), polled every 30s. The owner also gets an email per new submission when `NOTIFY_EMAIL` is set.
- **Dark mode** — automatic, follows the OS/browser color scheme.
- **Rate limiting** on every mutating endpoint (submit, like, report, comment, admin login) via Upstash Redis, IP-scoped.
- **Error monitoring** via Sentry, including build-time source-map upload so stack traces show real source, not minified code.

## Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Prisma 7** (driver-adapter architecture) against **Postgres**, hosted on **Supabase** (Storage is also Supabase, for uploaded photos)
- **Tailwind CSS v4**
- **Upstash Redis** for rate limiting
- **Resend** for transactional email (optional)
- **Sentry** for error monitoring + source maps
- **Playwright** for end-to-end tests, run in **GitHub Actions** (on push/PR and a daily scheduled run)
- Deployed on **Vercel**

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll need a `.env` file first — see below.

## Environment variables

Set these in `.env` for local development (gitignored, never commit real values):

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string. On Vercel use Supabase's **transaction** pooler (port 6543): it multiplexes many serverless instances onto few DB connections. Locally and for `prisma migrate`, the session pooler (port 5432) |
| `SUPABASE_URL` | yes | Supabase project URL, used for Storage |
| `SUPABASE_SECRET_KEY` | yes | Supabase service key for Storage uploads (bypasses RLS — server-only) |
| `ADMIN_PASSWORD` | yes | The owner's `/admin` password (sign in with the username left blank). Changing it signs out existing owner sessions |
| `SITE_URL` | yes | Public site origin, used in metadata/sitemap/robots and in emailed links |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | yes | Rate-limit storage |
| `NEXT_PUBLIC_SENTRY_DSN` | yes | Sentry error ingest endpoint (public by design — a DSN is write-only) |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | no | Enables build-time source-map upload to Sentry; omit and it's skipped |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | no | Enables outgoing email (owner notifications); omit and it silently no-ops |
| `NOTIFY_EMAIL` | no | Where new-submission notifications go. Until a sending domain is verified in Resend, this must be the Resend account's own signup email |

For running tests locally, copy the equivalent values into `.env.test` pointed at a **separate** Supabase project — the test suite seeds and deletes rows directly, and you don't want that anywhere near production data.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (also uploads Sentry source maps if configured) |
| `npm run lint` | ESLint |
| `npm run typecheck` | Regenerates Next's route types, then `tsc --noEmit` |
| `npm run test:e2e` | Full Playwright suite (starts its own dev server on port 3100; set `PLAYWRIGHT_PORT` if that's taken) |
| `npm run test:e2e:ui` | Same, with Playwright's UI mode |
| `npm run test:prod` | Smoke suite against the live site (`PROD_URL` to point elsewhere): every page, filter, sort and search read-only, plus one full submit → like → comment → report → edit → delete cycle on a clearly-named test dish that it removes again |

A pre-commit hook (husky + lint-staged) runs `eslint --fix` on staged `.ts`/`.tsx` files.

## Testing

Playwright specs live in `tests/`. They talk to a dedicated test Supabase project (via `.env.test`), seed rows directly over SQL to stay under real rate limits, and clean up after themselves. See `tests/helpers/db.ts` for the seeding helpers and the budget-conscious comments throughout the specs — the rate limits are real, not mocked, so tests are written to stay within them even across back-to-back runs.

## CI/CD

- **GitHub Actions** (`.github/workflows/ci.yml`): a `Lint & Typecheck` job and a `Playwright E2E` job, triggered on push/PR to `main` and once daily (12:00 PM IST). The daily run (and a manual "Run workflow") also runs `Production smoke (read-only)` against the live site — every page, filter, sort, search and the admin lock — without creating any data. The E2E job always uploads the HTML report as an artifact and writes a pass/fail line to the run's job summary, so results are checkable at a glance without downloading anything.
- **Deploying**: `git push` only runs CI — it does not deploy. Shipping to production is a separate, explicit step: `vercel deploy --prod`. Environment variable changes in Vercel only take effect on the next deploy after being set.

## Project structure notes

- `app/` — Next.js App Router pages and API routes.
- `components/` — shared UI components.
- `lib/` — business logic (recommendations queries/caching, pagination, rate limiting, validation, email, storage).
- `prisma/` — schema and migrations.
- `tests/` — Playwright specs and helpers.

This project targets a recent Next.js version with real breaking changes from what most training data assumes — see `AGENTS.md` before making framework-level changes.
