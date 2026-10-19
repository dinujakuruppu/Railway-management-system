# Supabase backend implementation

Implemented on `codex/supabase-backend`, based on `dev` commit `e20ab40f4b2da11999230e250c598e4cb73bdd55` (19 October 2026). The feature branch is intended for review against `dev`; no merge or production deployment is performed.

## Changes

- Added request-scoped Supabase SSR clients with HttpOnly cookies, verified Auth sessions, recovery callback, protected passenger/admin layouts, and exact-origin mutation checks.
- Added Next.js API routes for catalogue/bootstrap, availability, authentication, profile, bookings/cancellations and admin catalogue writes. Strict server validation rejects forged fields, credentials in payment payloads, malformed dates and oversized bodies.
- Added PostgreSQL tables, restricted column grants, RLS, metadata-safe profile triggers and database-managed roles. Privileged helpers use an empty search path and explicit authorization. No service role credential is needed; secret/service-role keys are rejected.
- Booking/cancellation RPCs serialize capacity/seat changes with transactional advisory locks and inventory uniqueness. Requests use per-user idempotency keys, current database pricing and immutable journey snapshots. Admin timetable edits coordinate with booking row locks.
- Seeded the existing 13 stations, 18 illustrative outward/return trains, 90 classes, 18 schedules and 4 notices.
- Connected the existing UI to these APIs, removed fake sign-in and personal bookings from browser storage, separated passenger/admin booking lists and added live seat lookup. Payment methods are simulations; no card/CVV/banking fields are collected.
- Updated Next.js to 16.3.8 and refreshed the lockfile for compatible dependency security fixes. Added security headers and ignored TypeScript build cache files.

## Validation

| Check | Result |
| --- | --- |
| Clean lockfile install (`npm ci --offline --ignore-scripts`) | Passed |
| TypeScript (`npm run typecheck`) | Passed |
| Production build (`npm run build`) | Passed |
| Server validation/request tests (`npm test`) | 10 tests passed |
| Actual PostgreSQL WASM migrations/RLS/RPC tests (`npm run test:db`) | 57 assertions passed |
| Built production HTTP checks (`npm run test:http`) | 14 checks passed |
| Browser smoke | Homepage and train search rendered; missing backend shows a read-only preview and disabled booking actions |
| Dependency audit after fixes | 0 reported vulnerabilities at verification time |
| Source credential-pattern scan and diff whitespace check | Passed |
| Hosted concurrency script (`npm run test:concurrency`) | Skipped without explicit test-project credentials |

The SQL suite uses a real single-connection PostgreSQL WASM engine with a minimal Auth identity shim. It verifies migrations, RLS and database functions, including competing sequential seat requests and the allocation primary key. It does **not** prove simultaneous physical database transactions or hosted Auth/SMTP behavior. The opt-in hosted test sends concurrent requests from two independent authenticated clients and cancels its test reservations afterwards. Detailed API/browser/RLS acceptance checks are in the Sinhala guide.

## Remaining manual setup

1. Run `supabase/migrations/202610190001_backend.sql`, then `202610190002_demo_seed.sql` in the intended Supabase test project.
2. Configure Supabase Email Auth, confirmation/reset callback URLs and SMTP as described in [the Sinhala guide](SUPABASE_SETUP.si.md).
3. Copy `srirail-frontend/.env.example` to `.env.local` and set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` locally and in Vercel. Vercel root directory is `srirail-frontend`.
4. Register/confirm your own account, grant its admin role through the documented SQL, then run the live acceptance checks.

To run locally: `cd srirail-frontend`, `npm ci`, add `.env.local`, then `npm run dev` and open `http://localhost:3000`.

## Demo limits

Tickets never reserve real railway inventory and are not valid for travel. No money is charged or refunded. Seats are allocated conservatively across the whole train run/date/class, rather than resold across nonoverlapping route segments. Timetables support same-day services in Asia/Colombo, up to 90 days ahead, and 1–6 passengers per booking. Selecting a seat does not hold it. Drafts remain in memory; saved bookings are available from the dashboard after refresh/sign-in.

## Changed files

- `.gitignore`
- `README.md`
- `docs/IMPLEMENTATION.md`
- `docs/SUPABASE_SETUP.si.md`
- `srirail-frontend/.env.example`
- `srirail-frontend/app/admin/layout.tsx`
- `srirail-frontend/app/api/admin/[entity]/route.ts`
- `srirail-frontend/app/api/auth/[action]/route.ts`
- `srirail-frontend/app/api/availability/route.ts`
- `srirail-frontend/app/api/bookings/[id]/cancel/route.ts`
- `srirail-frontend/app/api/bookings/route.ts`
- `srirail-frontend/app/api/bootstrap/route.ts`
- `srirail-frontend/app/api/profile/route.ts`
- `srirail-frontend/app/auth/callback/route.ts`
- `srirail-frontend/app/dashboard/layout.tsx`
- `srirail-frontend/app/error.tsx`
- `srirail-frontend/app/forgot-password/page.tsx`
- `srirail-frontend/app/layout.tsx`
- `srirail-frontend/app/reset-password/page.tsx`
- `srirail-frontend/app/terms/page.tsx`
- `srirail-frontend/components/admin/AdminNotices.tsx`
- `srirail-frontend/components/admin/AdminOverview.tsx`
- `srirail-frontend/components/admin/AdminPassengers.tsx`
- `srirail-frontend/components/admin/AdminSchedules.tsx`
- `srirail-frontend/components/admin/AdminTrains.tsx`
- `srirail-frontend/components/admin/NoticeEditor.tsx`
- `srirail-frontend/components/admin/TrainEditor.tsx`
- `srirail-frontend/components/auth/AuthForm.tsx`
- `srirail-frontend/components/booking/BookingGuard.tsx`
- `srirail-frontend/components/booking/ClassCard.tsx`
- `srirail-frontend/components/booking/PassengerForm.tsx`
- `srirail-frontend/components/booking/PaymentForm.tsx`
- `srirail-frontend/components/booking/TrainCard.tsx`
- `srirail-frontend/components/layout/Header.tsx`
- `srirail-frontend/components/layout/Sidebar.tsx`
- `srirail-frontend/components/pages/BookingsPage.tsx`
- `srirail-frontend/components/pages/DashboardPage.tsx`
- `srirail-frontend/components/pages/ProfilePage.tsx`
- `srirail-frontend/components/pages/SeatsPage.tsx`
- `srirail-frontend/components/pages/TicketPage.tsx`
- `srirail-frontend/components/pages/TrainDetailsPage.tsx`
- `srirail-frontend/components/pages/TrainSearchPage.tsx`
- `srirail-frontend/context/AppContext.tsx`
- `srirail-frontend/lib/client-api.ts`
- `srirail-frontend/lib/server/auth.ts`
- `srirail-frontend/lib/server/config.ts`
- `srirail-frontend/lib/server/http.ts`
- `srirail-frontend/lib/server/validation.ts`
- `srirail-frontend/lib/supabase/server.ts`
- `srirail-frontend/next-env.d.ts`
- `srirail-frontend/next.config.ts`
- `srirail-frontend/package-lock.json`
- `srirail-frontend/package.json`
- `srirail-frontend/proxy.ts`
- `srirail-frontend/tests/backend.test.ts`
- `srirail-frontend/tests/http-smoke.mjs`
- `supabase/migrations/202610190001_backend.sql`
- `supabase/migrations/202610190002_demo_seed.sql`
- `supabase/tests/concurrency.mjs`
- `supabase/tests/run.mjs`
