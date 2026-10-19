# SriRail Railway Management System

Next.js 16 / React 19 frontend with a Supabase Auth and PostgreSQL backend. The existing passenger booking flow, ticket pages, passenger dashboard, and admin pages use server API routes and the signed-in user's database permissions.

This is a demonstration application. Train data is illustrative, payments are simulated, and generated tickets are **not valid for railway travel**. No railway inventory or banking service is connected.

## Setup

Follow the complete Sinhala instructions in [docs/SUPABASE_SETUP.si.md](docs/SUPABASE_SETUP.si.md). They cover the exact SQL order, Supabase Auth redirects, the first admin account, Vercel configuration, and acceptance tests.

The Next.js application lives in `srirail-frontend/`. Use Node.js 20.9 or newer.

```sh
cd srirail-frontend
npm ci
cp .env.example .env.local
# Add the values described in the setup guide to .env.local.
npm run dev
```

Open <http://localhost:3000>. A configured Supabase project and applied migrations are required for account, booking, and administration features. Missing configuration must not silently restore the old browser-only demo account.

```sh
npm run typecheck
npm test
npm run test:db
npm run build
npm run test:http
npm start
```

## Security model

- Passwords and email confirmation use Supabase Auth. Server requests validate the authenticated user; browser state is not an authorization source.
- Database row-level security restricts personal records to their owner and administration to database-managed admin roles.
- Booking and cancellation run through transactional database functions. The server calculates fares from the current database catalogue and protects capacity and seats against concurrent requests.
- The application uses the Supabase publishable key with the user's session. A service role key is not required and must never be placed in browser code or committed.
- Payment requests store only the selected demo method and the server-calculated amount. Card numbers, expiry dates, and CVVs do not belong in the API or database.

See the Sinhala guide for the supported demo limitations, endpoint details, and checks that require a live Supabase project.

`npm test` exercises server validation and request protections. `npm run test:db` runs the migrations and security/booking assertions against a local PostgreSQL WASM runtime. After a production build, `npm run test:http` checks protected production routes without live credentials. These checks do not contact your Supabase project or prove concurrent transactions. The guide includes an opt-in `npm run test:concurrency` script, live two-account API concurrency, and direct RLS acceptance checks.
