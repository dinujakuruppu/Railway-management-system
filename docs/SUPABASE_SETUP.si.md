# SriRail — Supabase backend එක සකස් කරන ආකාරය

මෙය Next.js frontend එකට සම්බන්ධ Supabase backend එකක් සහිත **demo railway booking application** එකකි. Supabase database එක තුළ booking එකක් සහ `simulated` payment record එකක් සෑදෙන නමුත් සැබෑ railway seat එකක් reserve වීමක් හෝ මුදල් අයකිරීමක් සිදු නොවේ. මෙම ticket එක දුම්රියේ ගමන් කිරීමට වලංගු නොවේ. Test කරන විට sample NIC/passport සහ mobile විස්තර පමණක් භාවිත කරන්න.

ඔබ අතින් කළ යුත්තේ Supabase project එක සෑදීම, පහත SQL files නියමිත පිළිවෙළට run කිරීම, Auth settings සහ environment values ඇතුළත් කිරීම පමණි. Repository එක තුළ සැබෑ credentials දමා නැත.

## 1. Supabase project එක

1. [Supabase Dashboard](https://supabase.com/dashboard) වෙත ගොස් නව project එකක් සාදන්න. මෙම application එකට වෙනම development/test project එකක් භාවිත කිරීම පහසුය.
2. Project එක සූදානම් වූ පසු **Connect / API settings** හරහා Project URL එක සහ **publishable key** එක ලබාගන්න. Dashboard අනුව මේවා **Settings → API** යටතේත් පෙන්විය හැක.
3. Project URL එක `https://YOUR_PROJECT_REF.supabase.co` ආකාරයේය. Publishable key එක `sb_publishable_...` ආකාරයේය. පැරණි project එකක `anon` public key එක තිබේ නම් එයත් භාවිත කළ හැක.
4. Database password, JWT secret, `service_role` key හෝ `sb_secret_...` key එක application environment එකට දාන්න එපා. මෙම implementation එකට service role key එකක් අවශ්‍ය නැත.

## 2. Database SQL — අනිවාර්ය පිළිවෙළ

Supabase **SQL Editor → New query** වෙත ගොස් migration file එකේ සම්පූර්ණ content එක copy කර run කරන්න. Schema migration එක මුලින්ද sample data migration එක දෙවනුවද run කරන්න. Migration files සහ නිවැරදි order එක මෙම guide එකේ පහත migration table එකෙන් ලබාගන්න.

| පිළිවෙළ | Run කළ යුතු file එක | කරන්නේ කුමක්ද |
| --- | --- | --- |
| 1 | [`supabase/migrations/202610190001_backend.sql`](../supabase/migrations/202610190001_backend.sql) | Tables, Auth profile trigger, roles, RLS, transactional booking/cancellation සහ admin functions |
| 2 | [`supabase/migrations/202610190002_demo_seed.sql`](../supabase/migrations/202610190002_demo_seed.sql) | Frontend එකට ගැළපෙන sample stations, trains/classes, schedules සහ notices |

එක් file එකක් සාර්ථක වූ පසු පමණක් ඊළඟ file එක run කරන්න. Error එකක් ඇත්නම් එම error එක විසඳාගෙන ඉදිරියට යන්න. දැනටමත් migrate කළ project එකට නැවත schema file එක run කිරීම වෙනුවට migration history එක රඳවාගෙන, අලුත් migration පමණක් apply කරන්න. Existing production tables වෙත අහඹු ලෙස SQL run නොකරන්න.

Sample train names, fares, schedules සහ notices demonstration data වේ. පරණ browser session එකේ `sessionStorage` තුළ තිබුණු bookings හෝ demo account එක database එකට import කරන්නේ නැත. Supabase Auth account එකක් අලුතින් register කරන්න.

Seed file එක sample stations 13ක්, outward/return trains 18ක් සහ notices 4ක් දමයි. Users, passwords, admin accounts හෝ bookings seed කරන්නේ නැත. `ON CONFLICT DO NOTHING` නිසා seed එකෙන් දැනට තිබෙන catalogue records overwrite නොකරයි.

**Project Settings → API / Data API → Exposed schemas** යටතේ application tables/RPC සඳහා `public` schema එක expose වී තිබිය යුතුය. Migration එකේ internal helpers සඳහා ඇති **`private` schema එක Exposed schemas list එකට එකතු නොකරන්න**. App එක public RPC wrappers භාවිත කරයි; private helpers තමන්ගේ authorization checks සහ restricted execute grants යටතේ ක්‍රියා කරයි.

## 3. Supabase Auth settings

1. **Authentication → Sign In / Providers → Email** යටතේ Email/password sign-in enable කරන්න.
2. **Confirm email** enable කර තබන්න. Account එකක් register කළ පසු inbox එකේ confirmation email එකෙන් verify කරන්න. Verification අවසන් වන තුරු sign-in කිරීම Supabase මඟින් ප්‍රතික්ෂේප කළ හැක.
3. Password minimum length එක අවම වශයෙන් **8** ලෙස සකස් කරන්න. Supabase plan එකේ තිබේ නම් leaked-password protection සහ Auth rate limits සක්‍රීය කරන්න.
4. **Authentication → URL Configuration** යටතේ local development සඳහා Site URL එක `http://localhost:3000` කරන්න. Production deploy කළ පසු එය ඔබගේ සත්‍ය HTTPS domain එකට වෙනස් කරන්න.
5. Allowed Redirect URLs වෙත පහත local URLs එකතු කරන්න:

   ```text
   http://localhost:3000/auth/callback
   http://localhost:3000/auth/callback?next=/reset-password
   ```

6. Deploy කළ පසු ඔබගේ domain එකෙන්ද එම paths allow කරන්න. උදාහරණයේ hostname එක ඔබගේ URL එකෙන් ප්‍රතිස්ථාපනය කරන්න:

   ```text
   https://YOUR_APP.vercel.app/auth/callback
   https://YOUR_APP.vercel.app/auth/callback?next=/reset-password
   ```

7. Email templates වෙනස් කර නොමැති නම් default `{{ .ConfirmationURL }}` link එක තබන්න. මේ application එක PKCE `code` callback flow එක භාවිත කරයි. වෙනත් application එකක `/auth/confirm?token_hash=...` template එක copy කිරීමෙන් මෙම callback flow එක වෙනස් නොකරන්න.
8. Confirmation/reset email එක **ඉල්ලීම කළ එම browser/device එකේම** open කරන්න. PKCE verifier cookie එක එම browser එකේ තිබිය යුතුය. Private window එකක්, වෙනත් browser එකක් හෝ link scanner එකක් නිසා link එක consume වී තිබේ නම් අලුත් confirmation/reset request එකක් කරන්න.
9. Password reset සඳහා `/forgot-password` භාවිත කරන්න. Email link එක callback එක හරහා `/reset-password` වෙත ගෙන යයි. අලුත් password එක සුරැකීමෙන් පසු sign-in පරීක්ෂා කරන්න.

Supabase hosted email service එකේ limits/recipient restrictions තිබිය හැක. තමන්ගේ email එකට mail නොලැබේ නම් Dashboard Auth logs, spam folder සහ [custom SMTP settings](https://supabase.com/docs/guides/auth/auth-smtp) බලන්න. Public demo එකක් සඳහා ඔබගේ SMTP provider එක සකස් කරන්න. Auth rate-limit settings production භාවිතයට පෙර පරීක්ෂා කරන්න.

## 4. Local environment values

Terminal එකෙන් repository එකේ `srirail-frontend` directory එකට යන්න:

```sh
cd srirail-frontend
npm ci
cp .env.example .env.local
```

`srirail-frontend/.env.local` file එකේ placeholders වෙනුවට ඔබගේ project values දාන්න:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_PUBLIC_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`SUPABASE_URL` සහ `SUPABASE_PUBLISHABLE_KEY` server එකේ Supabase client එකට භාවිත වේ. `NEXT_PUBLIC_SITE_URL` යනු email callback සඳහා ඔබගේ app එකේ origin එකයි; `/auth/callback` path එක හෝ trailing path එක ඒ value එකට දාන්න එපා. මෙම value එක `https://` production domain එකට හරියටම ගැළපිය යුතුය. `.env.local` Git වෙත commit කරන්න එපා. Environment එක වෙනස් කළ පසු development server එක restart කරන්න.

```sh
npm run dev
```

Browser එකේ [http://localhost:3000](http://localhost:3000) open කරන්න. Database/configuration error එකක් තිබේ නම් එය නිවැරදි කරන්න; account/booking actions සාර්ථක වුණා සේ browser-only records සාදන්නේ නැත.

## 5. පළමු admin account එක

App එකේ `/register` page එකෙන් ඔබගේ email එක භාවිත කර register වී confirmation එක අවසන් කරන්න. Password එක Supabase Auth මඟින්ම කළමනාකරණය වේ. Registration form එකේ හෝ browser storage එකේ `role: admin` ඇතුළත් කිරීමෙන් admin බලය ලැබෙන්නේ නැත.

Supabase SQL Editor එකේ පහත query එක run කරන්න. `YOUR_CONFIRMED_EMAIL` වෙනුවට ඔබ confirm කළ email එක **හරියටම** දාන්න. මෙය application form එකක හෝ browser console එකේ run කළ යුතු query එකක් නොවේ.

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where email = 'YOUR_CONFIRMED_EMAIL'
  and email_confirmed_at is not null
on conflict (user_id) do update set role = excluded.role;
```

නිවැරදි account එකට role එක ලැබීද බලන්න:

```sql
select u.email, r.role
from auth.users u
join public.user_roles r on r.user_id = u.id
where u.email = 'YOUR_CONFIRMED_EMAIL';
```

Rows නොපෙනේ නම් email එක හෝ confirmation තත්ත්වය පරීක්ෂා කරන්න. Admin බලය නැවත ඉවත් කිරීමට SQL Editor එකේම පහත query එක භාවිත කළ හැක:

```sql
update public.user_roles
set role = 'passenger'
where user_id = (
  select id from auth.users where email = 'YOUR_CONFIRMED_EMAIL'
);
```

Admin role එක ලබා දුන් පසු app එකේ logout වී නැවත login කරන්න. `/admin` වෙත ගොස් trains, schedules, notices, bookings සහ passenger information පරීක්ෂා කරන්න. අනෙක් සාමාන්‍ය account එකකින් `/admin` හෝ admin API භාවිත කළ නොහැකි බවත් පරීක්ෂා කරන්න. Admin credentials, user password හෝ user token කෙනෙකුට share කරන්න එපා.

## 6. Vercel deployment

1. GitHub repository එක Vercel වෙත import කරන්න. **Root Directory** එක `srirail-frontend` ලෙස දාන්න.
2. Framework preset එක **Next.js** තෝරන්න. Install command `npm ci`, Build command `npm run build`, සහ Node.js runtime එක package එකේ අවම version එකට ගැළපෙන supported version එකක් භාවිත කරන්න.
3. **Settings → Environment Variables** යටතේ `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` එකතු කරන්න. `NEXT_PUBLIC_SITE_URL` සඳහා local URL එක නොව deploy කරන `https://...` app origin එක දෙන්න.
4. Environment values අවශ්‍ය **Preview / Production** scopes වෙත පමණක් දාන්න. Preview එකට වෙනම Supabase project එකක් තබාගැනීම සුදුසුය. Preview callback URL එක Supabase allow-list එකටත් එකතු කරන්න. Public wildcard එකක් වෙනුවට ඔබ පාලනය කරන exact deployment URL එකක් භාවිත කරන්න.
5. Supabase Auth Site URL සහ Redirect URLs එම deployment එකට ගළපන්න. අලුත් Vercel URL එක දැනගත් පසු environment value සහ Auth allow-list දෙකම update කර නැවත deploy කරන්න.
6. මෙම වැඩ සඳහා නිර්මාණය කළ feature branch එකෙන් preview deployment එකක් review කරන්න. `main` වෙත merge කිරීම හෝ production release එක වෙනම ඔබගේ තීරණයකි.

## 7. දත්ත සහ ආරක්ෂක ක්‍රියාකාරීත්වය

- Public train/station/schedule/notice data API හරහා ලබාගනී. Publish නොකළ notices සාමාන්‍ය පරිශීලකයාට නොපෙන්විය යුතුය.
- Profile, booking, passenger සහ payment data සඳහා database row-level security (RLS) යොදා ඇත. Server API එකත් user session එක හා admin role එක පරීක්ෂා කරයි.
- Browser එකෙන් එවන fare/total, user ID, role, ticket status හෝ payment status විශ්වාස නොකරයි. Booking transaction එක database catalogue එකේ fare සහ booking rules භාවිත කරයි.
- Seat selection එක draft එකක් පමණි. Pay demo action එක database transaction එකේ සාර්ථක වන තුරු seat එකක් hold කරන්නේ නැත. වෙනත් account එකක් එම seat එක කලින් ගෙන ඇත්නම් conflict error එක පෙන්විය යුතුය.
- මෙම demo එක seat/capacity එක train එකේ සම්පූර්ණ එදින run එක සඳහා reserve කරයි. මැද station එකකින් බසින passenger කෙනෙකුගේ seat එක පසුව වෙනත් segment එකට resell නොකරයි.
- Unreserved class එකක් book කළත් capacity check එක තිබේ; නිශ්චිත seat number එකක් සහතික කරන්නේ නැත.
- Timetable එක Sri Lanka වේලාවෙන් **එකම දිනක** ගමනක් නිරූපණය කරයි. Overnight services හෝ real railway route/seat segments මෙම schema එකේ model කර නැත.
- Payment method පමණක් simulation සඳහා ගබඩා වේ. Card number, CVV, expiry හෝ බැංකු credentials ඇතුළත් කරන fields නැත. Method එක තෝරා demo agreement එක confirm කළ පසු booking request එක යවයි.
- Session එකේ cookies HttpOnly server cookies වේ. Logout කළ පසු protected API හරහා data ලබාගත නොහැකි විය යුතුය. Browser draft එක personal booking database එකක් නොවේ.

## 8. Local checks

```sh
cd srirail-frontend
npm run typecheck
npm test
npm run test:db
npm run build
npm run test:http
```

Build/typecheck එක සාර්ථක වීමෙන් Supabase project එකේ SQL, SMTP සහ RLS settings ක්‍රියාත්මක බව තහවුරු නොවේ. පහත live acceptance checks project එක configure කළ පසු කරන්න.

`npm test` යනු API body validation, origin checks, request size සහ error handling සඳහා local tests වේ. `npm run test:db` [`supabase/tests/run.mjs`](../supabase/tests/run.mjs) හරහා migrations දෙක actual PostgreSQL WASM runtime එකක run කර RLS, Auth trigger, admin rules, fare, seat, idempotency, cancellation සහ capacity assertions පරීක්ෂා කරයි. එය external Supabase service එකක් අමතන්නේ නැත; එක connection එකකින් run වන නිසා concurrent transaction proof එකක්ද නොවේ. Build එකෙන් පසු `npm run test:http` තාවකාලික production server එකක protected routes, redirects, origin, JSON සහ body limits පරීක්ෂා කරයි; එයත් live credentials භාවිත කරන්නේ නැත. Hosted login/email/browser flow සහ සැබෑ concurrency පහත test වලින් තහවුරු කරන්න.

### API routes

| Route | ක්‍රියාව / permission |
| --- | --- |
| `GET /api/bootstrap` | Public catalogue; login වී ඇත්නම් own profile/bookings; adminට authorized admin records |
| `GET /api/availability?trainId=...&date=YYYY-MM-DD&classId=...` | Active demo service එකේ shared seat numbers/count; passenger details නොමැත |
| `POST /api/auth/register`, `/api/auth/login` | Supabase email/password Auth |
| `POST /api/auth/forgot-password`, `/api/auth/update-password`, `/api/auth/logout` | Recovery, signed-in password update, logout |
| `GET /auth/callback` | PKCE code exchange; account/reset redirect |
| `PATCH /api/profile` | Own `fullName`, `identity`, `mobile` පමණක් |
| `GET /api/bookings`, `POST /api/bookings` | Own bookings read / transactional demo booking |
| `POST /api/bookings/:id/cancel` | Owner/admin; departure එකට පෙර cancellation |
| `PUT /api/admin/trains`, `/api/admin/schedules`, `/api/admin/notices` | Database admin role අවශ්‍යයි |

Mutation requests `Content-Type: application/json` සහ `Origin: NEXT_PUBLIC_SITE_URL` හරියටම ගැළපීම අවශ්‍ය කරයි. API උපරිම body size එක 32 KiB ය. Unknown fields ප්‍රතික්ෂේප කරයි. Browser fetch එක Same-origin HttpOnly cookies භාවිත කරයි; access token `localStorage`/`sessionStorage` එකේ තබන්නේ නැත.

### Browser acceptance checklist

1. Account A හා B දෙකක් register කර email confirm කරගන්න. Wrong password එකක් දුන් විට login එක ප්‍රතික්ෂේප විය යුතුය. Demo bypass එකක් නොතිබිය යුතුය.
2. A account එකෙන් profile එක edit කර page එක refresh කරන්න; database එකේ සුරැකි values නැවත පෙන්විය යුතුය. Email/password වෙනස් කිරීම profile data patch එකකින් කළ නොහැකි විය යුතුය.
3. ඉදිරි දින 1–90 අතර available journey එකක් search කරන්න. Passenger details → class/seats → summary → demo payment → success → ticket flow එක පරීක්ෂා කරන්න. Future date එකක් භාවිත කරන්න; එදින දැනටමත් පිටත් වූ service එකක් book නොකළ යුතුය.
4. Refresh සහ logout/login කළ පසුවත් booking එක `/dashboard/bookings` යටතේ තිබිය යුතුය. Booking snapshot එකේ train/times/fares පසුව admin train edit එකකින් වෙනස් නොවිය යුතුය.
5. B account එකෙන් Aගේ booking/ticket ID එක URL එකට දමා විවෘත කරන්න. Data නොපෙන්විය යුතුය; API request එක 403/404 විය හැක. Bට Aගේ passengers/payment/profile කියවීමට හෝ cancel කිරීමට නොහැකි විය යුතුය.
6. Booking එක departure එකට පෙර cancel කර වෙනත් account එකකින් එම seat එක book කළ හැකි බව බලන්න. Cancelled ticket එක confirmed ලෙස නොපෙන්විය යුතුය. Departure පසු cancellation ප්‍රතික්ෂේප විය යුතුය.
7. සාමාන්‍ය account එකෙන් admin URL/API වෙත access කිරීම ප්‍රතික්ෂේප විය යුතුය. Admin account එකෙන් train, schedule, notice save කර refresh කළ පසු වෙනස්කම් database එකේ තිබිය යුතුය.
8. Admin account එකෙන් unpublished notice එකක් සාදා incognito browser එකෙන් බලන්න; එය public notices අතර නොතිබිය යුතුය.
9. `/forgot-password` හරහා reset email ඉල්ලා එම browser එකේ link එක open කර password update කරන්න. Old password fail වීම සහ new password සාර්ථක වීම පරීක්ෂා කරන්න.
10. Browser Network panel එකේ payment request බලන්න. Card number/CVV/expiry API body එකේ නොතිබිය යුතුය; database payment record එක `simulated` විය යුතුය.

### එකම seat එකට සැබෑ concurrent requests

**ස්වයංක්‍රීය hosted test එක (optional):** [`supabase/tests/concurrency.mjs`](../supabase/tests/concurrency.mjs) එක Supabase RPC වෙත accounts දෙකෙන් එකවර booking requests යවා seat protection පරීක්ෂා කරයි. මෙය **වෙනම seeded test project එකක පමණක්** run කරන්න. Accounts දෙකම confirmed විය යුතුය. Script එක test booking එක cancel කර seats නිදහස් කරන නමුත් cancelled demo booking/payment history database එකේ ඉතිරි වේ. Cleanup fail වුණොත් test project dashboard එකේ test booking එක cancel කරන්න.

`srirail-frontend` directory එකේ මෙය run කළ හැක. Passwords terminal history එකට දාන්නේ නැත. Prompt කළ Supabase project values test project එකෙන්ම ගන්න. මෙම opt-in test එක credentials නැතිව `SKIP` වීම hosted verification එකක් ලෙස ගණන් නොගන්න.

```sh
python3 - <<'PY'
import getpass, os, subprocess
env = dict(os.environ)
env['RUN_SUPABASE_SMOKE'] = 'true'
env['SUPABASE_URL'] = input('Dedicated TEST Supabase URL: ').strip()
env['SUPABASE_PUBLISHABLE_KEY'] = getpass.getpass('TEST publishable/anon key: ').strip()
for account in ('A', 'B'):
    env[f'TEST_USER_{account}_EMAIL'] = input(f'Confirmed test account {account} email: ').strip()
    env[f'TEST_USER_{account}_PASSWORD'] = getpass.getpass(f'Test account {account} password: ')
raise SystemExit(subprocess.run(['npm', 'run', 'test:concurrency'], env=env).returncode)
PY
```

මෙම script එක RPC/database concurrency පරීක්ෂා කරයි. පහත curl test එක app API, cookie auth සහ database transaction එක එකට පරීක්ෂා කරයි.

මෙම test එක live app එක සහ configured Supabase project එක භාවිත කරයි. වෙනස් accounts දෙකක requests එකවර යවයි; sequential browser clicks පමණක් concurrency test එකක් නොවේ. `curl` සහ Python 3 අවශ්‍යය. පළමුව account A සහ B confirm කරගන්න. App එක `http://localhost:3000` හි run කර මේ commands එකම terminal session එකේ run කරන්න. වෙනත් port/deployment එකක් නම් `SR_APP_ORIGIN` නිවැරදි origin එකට වෙනස් කරන්න.

```sh
export SR_APP_ORIGIN='http://localhost:3000'
export SR_TEST_DIR="$(mktemp -d)"
chmod 700 "$SR_TEST_DIR"
trap 'rm -rf "$SR_TEST_DIR"' EXIT

python3 - <<'PY'
import getpass, json, os
from pathlib import Path
folder = Path(os.environ['SR_TEST_DIR'])
for name in ('a', 'b'):
    email = input(f'Confirmed account {name.upper()} email: ').strip()
    password = getpass.getpass(f'Account {name.upper()} password: ')
    path = folder / f'login-{name}.json'
    path.write_text(json.dumps({'email': email, 'password': password}))
    path.chmod(0o600)
PY

curl --silent --show-error --fail-with-body \
  -c "$SR_TEST_DIR/session-a.txt" \
  -H "Origin: $SR_APP_ORIGIN" -H 'Content-Type: application/json' \
  --data-binary "@$SR_TEST_DIR/login-a.json" \
  "$SR_APP_ORIGIN/api/auth/login"

curl --silent --show-error --fail-with-body \
  -c "$SR_TEST_DIR/session-b.txt" \
  -H "Origin: $SR_APP_ORIGIN" -H 'Content-Type: application/json' \
  --data-binary "@$SR_TEST_DIR/login-b.json" \
  "$SR_APP_ORIGIN/api/auth/login"
```

Login දෙකම `{"ok":true}` විය යුතුය. මෙහි cookie files/password files temporary private directory එකේ පමණක් ඇත. ඒවා commit/share නොකරන්න. පහත script එක catalogue එකෙන් හෙට දින ධාවනය වන reserved class එකක් සහ එහි free seat එකක් තෝරා requests දෙක සකසයි. Passenger details මෙහි sample values ය.

```sh
python3 - <<'PY'
import datetime, json, os, urllib.parse, urllib.request, uuid
from pathlib import Path
from zoneinfo import ZoneInfo
folder = Path(os.environ['SR_TEST_DIR'])
origin = os.environ['SR_APP_ORIGIN']
def get(path):
    with urllib.request.urlopen(origin + path) as response:
        return json.load(response)
catalog = get('/api/bootstrap')
day = datetime.datetime.now(ZoneInfo('Asia/Colombo')).date() + datetime.timedelta(days=1)
schedules = {s['trainId']: s for s in catalog['schedules']}
choice = None
for train in catalog['trains']:
    schedule = schedules.get(train['id'])
    if not schedule or not schedule['active']:
        continue
    rule = schedule['days']
    if rule == 'Weekdays' and day.weekday() > 4:
        continue
    if rule == 'Weekends' and day.weekday() < 5:
        continue
    for travel_class in train['classes']:
        if not travel_class['reserved']:
            continue
        query = urllib.parse.urlencode({'trainId': train['id'], 'date': str(day), 'classId': travel_class['id']})
        available = get('/api/availability?' + query)
        occupied = set(available['seats'])
        seats = [f'{i // 4 + 1}{"ABCD"[i % 4]}' for i in range(travel_class['capacity'])]
        free = next((seat for seat in seats if seat not in occupied), None)
        if free and available['available'] > 0:
            choice = (train, travel_class, free)
            break
    if choice:
        break
if not choice:
    raise SystemExit('No available reserved journey tomorrow; enable a future demo service first.')
train, travel_class, seat = choice
for account in ('a', 'b'):
    request = {
        'trainId': train['id'], 'from': train['departureStation'], 'to': train['arrivalStation'],
        'date': str(day), 'count': 1, 'classId': travel_class['id'], 'seats': [seat],
        'method': 'lankaqr', 'idempotencyKey': str(uuid.uuid4()),
        'quotedPrice': ((travel_class['price'] + 5) // 10) * 10, 'quotedDepartureTime': train['departureTime'],
        'quotedArrivalTime': train['arrivalTime'],
        'passengers': [{'id': 'test-' + account, 'fullName': 'Demo Passenger ' + account.upper(),
          'identity': '200012345678', 'email': 'sample@example.com', 'mobile': '0771234567',
          'type': 'Adult', 'gender': 'Not specified'}],
    }
    (folder / f'booking-{account}.json').write_text(json.dumps(request))
print('Race target:', train['id'], day, travel_class['id'], seat)
PY

curl --silent --show-error -o "$SR_TEST_DIR/result-a.json" -w '%{http_code}\n' \
  -b "$SR_TEST_DIR/session-a.txt" -c "$SR_TEST_DIR/session-a.txt" \
  -H "Origin: $SR_APP_ORIGIN" -H 'Content-Type: application/json' \
  --data-binary "@$SR_TEST_DIR/booking-a.json" \
  "$SR_APP_ORIGIN/api/bookings" > "$SR_TEST_DIR/status-a.txt" &
SR_PID_A=$!

curl --silent --show-error -o "$SR_TEST_DIR/result-b.json" -w '%{http_code}\n' \
  -b "$SR_TEST_DIR/session-b.txt" -c "$SR_TEST_DIR/session-b.txt" \
  -H "Origin: $SR_APP_ORIGIN" -H 'Content-Type: application/json' \
  --data-binary "@$SR_TEST_DIR/booking-b.json" \
  "$SR_APP_ORIGIN/api/bookings" > "$SR_TEST_DIR/status-b.txt" &
SR_PID_B=$!
wait "$SR_PID_A" "$SR_PID_B"

python3 - <<'PY'
import json, os
from pathlib import Path
folder = Path(os.environ['SR_TEST_DIR'])
codes = [int((folder / f'status-{name}.txt').read_text()) for name in ('a', 'b')]
assert sorted(codes) == [201, 409], codes
for name, code in zip(('a', 'b'), codes):
    result = json.loads((folder / f'result-{name}.json').read_text())
    print(name.upper(), code, result['booking']['id'] if code == 201 else result['error'])
print('PASS: Exactly one request reserved the seat.')
PY
```

එක් request එකකට `201` සහ අනෙකට seat conflict `409` ලැබිය යුතුය. `201` දෙකක් හෝ database booking දෙකක් සෑදීම failure එකකි. `403` නම් Origin value එකද, `401` නම් account/cookiesද, `503` නම් configuration/migrationsද බලන්න. Seat එක අතරතුර වෙනත් test එකකින් reserve වී `409` දෙකක් ලැබුණේ නම් වෙනත් free seat එකක් තෝරා test එක නැවත කරන්න.

සාර්ථක request එකේ JSON body සහ එහි `idempotencyKey` එක **වෙනස් නොකර**, එම account cookie එකෙන් නැවත POST කරන්න. `201` සමඟ කලින් ලැබුණු **එම booking ID එකම** නැවත ලැබිය යුතුය; දෙවන booking/payment එකක් සෑදිය නොහැක. එම key එකෙන් seat/method/passenger වෙනස් කළ request එකක් `409` විය යුතුය. Browser account දෙකෙන් ticket lists refresh කර එකම seat එකෙන් confirmed ticket එකක් පමණක් තිබෙන බවත් බලන්න. Test එක අවසන් වූ පසු winner account එකෙන් cancel කර seat එක නැවත available වන බව තහවුරු කරන්න.

### RLS එක API එකෙන් වෙන්ව පරීක්ෂා කිරීම

API permission checks සමත් වුණත් direct Supabase REST access එකත් පරීක්ෂා කරන්න. **SQL Editor එකේ සාමාන්‍ය `select` කිරීම RLS test එකක් නොවේ**, එය privileged database role එකෙන් ක්‍රියා කළ හැකි නිසාය. පහත commands user Bගේ JWT එකෙන් Supabase REST අමතයි. කලින් test session එකේ temporary folder සහ confirmed B login file එක තවම තිබිය යුතුය.

```sh
export SR_SUPABASE_URL='https://YOUR_PROJECT_REF.supabase.co'
export SR_PUBLIC_KEY='YOUR_PUBLISHABLE_OR_ANON_KEY'

curl --silent --show-error --fail-with-body \
  -H "apikey: $SR_PUBLIC_KEY" -H 'Content-Type: application/json' \
  --data-binary "@$SR_TEST_DIR/login-b.json" \
  "$SR_SUPABASE_URL/auth/v1/token?grant_type=password" \
  > "$SR_TEST_DIR/token-b.json"

export SR_B_TOKEN="$(python3 -c 'import json, os; print(json.load(open(os.environ["SR_TEST_DIR"] + "/token-b.json"))["access_token"])')"
```

A account එකට අයත් booking UUID එක මෙහි දාන්න. Race test එක B win කළා නම් A account එකෙන් වෙනම seat එකක් book කර එම ID එක භාවිත කරන්න. JWT හෝ token file එක terminal screenshot/repository එකකට දාන්න එපා.

```sh
export SR_A_BOOKING_ID='ACCOUNT_A_BOOKING_UUID'

curl --silent --show-error --fail-with-body \
  -H "apikey: $SR_PUBLIC_KEY" -H "Authorization: Bearer $SR_B_TOKEN" \
  "$SR_SUPABASE_URL/rest/v1/bookings?id=eq.$SR_A_BOOKING_ID&select=id,reference"

curl --silent --show-error --fail-with-body \
  -H "apikey: $SR_PUBLIC_KEY" -H "Authorization: Bearer $SR_B_TOKEN" \
  "$SR_SUPABASE_URL/rest/v1/booking_passengers?booking_id=eq.$SR_A_BOOKING_ID&select=id,full_name"

curl --silent --show-error --fail-with-body \
  -H "apikey: $SR_PUBLIC_KEY" -H "Authorization: Bearer $SR_B_TOKEN" \
  "$SR_SUPABASE_URL/rest/v1/payments?booking_id=eq.$SR_A_BOOKING_ID&select=id,amount"
```

මෙම requests තුනම `[]` විය යුතුය. Bට Aගේ details එකක් හෝ පෙන්වීම failure එකකි. `public.user_roles` direct role write එකත් තහනම් බව බලන්න:

```sh
export SR_B_USER_ID="$(python3 -c 'import json, os; print(json.load(open(os.environ["SR_TEST_DIR"] + "/token-b.json"))["user"]["id"])')"

curl --silent --show-error -i -X PATCH \
  -H "apikey: $SR_PUBLIC_KEY" -H "Authorization: Bearer $SR_B_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"role":"admin"}' \
  "$SR_SUPABASE_URL/rest/v1/user_roles?user_id=eq.$SR_B_USER_ID"
```

`permission denied` / HTTP `403` ලැබිය යුතුය. Profile `email`/`id` columns වෙනස් කිරීම සහ bookings, booking_passengers, booking_seats, payments වෙත direct `INSERT/UPDATE/DELETE` කිරීමත් ප්‍රතික්ෂේප විය යුතුය. සාමාන්‍ය user කෙනෙකුට own profile `full_name`, `identity`, `mobile` පමණක් direct update කළ හැක. Trains සඳහා checked admin RPC එක පමණක් ඇත; schedules/notices writes database admin role එකට පමණක් RLS යටතේ ලබා දී ඇත.

```sh
unset SR_B_TOKEN SR_B_USER_ID
rm -rf "$SR_TEST_DIR"
unset SR_TEST_DIR
```

## 9. Troubleshooting

| ලක්ෂණය | පරීක්ෂා කළ යුතු දේ |
| --- | --- |
| Supabase configuration missing / 503 | `.env.local` path එක, Vercel root directory එක, variables සහ server restart/redeploy |
| Relation/function does not exist | Schema SQL මුලින් සහ seed SQL පසුව සාර්ථකව run කළාද; application එක නිවැරදි Supabase project එකටද යන්නේ |
| Invalid API key / JWT | Project URL සහ publishable/anon key එක එකම project එකෙන්ද; `service_role`/secret key භාවිත කර නැද්ද |
| Email confirmation/reset localhost වෙත යයි | Supabase Site URL, allowed redirect URLs සහ `NEXT_PUBLIC_SITE_URL` එකම deployment එකට ගැළපෙනවාද |
| Auth code/verifier missing or expired | Email request කළ browser/device එකේම link open කරන්න; cookies block කර ඇත්ද බලන්න; අලුත් link එකක් ඉල්ලන්න |
| Email නොලැබේ | Auth logs, rate limits, spam folder, SMTP recipient restrictions සහ custom SMTP configuration |
| Permission denied / 403 on admin | නිවැරදි confirmed account එකට database admin role එක දී ඇත්ද; logout/login කර නැවත බලන්න |
| Seat conflict / unavailable | වෙනත් booking එකක් transaction එක කලින් අවසන් කර ඇත; seats refresh කර වෙනත් seat එකක් තෝරන්න |
| Departure හෝ date error | Sri Lanka local time, date එක next 90 days ඇතුළතද, schedule active ද, train පිටත් වී නැද්ද බලන්න |

නිල Supabase මාර්ගෝපදේශ: [SSR Auth](https://supabase.com/docs/guides/auth/server-side), [PKCE flow](https://supabase.com/docs/guides/auth/sessions/pkce-flow), [Auth Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).
