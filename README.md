# MishtiChaat

Premium mithai, authentic Banarasi chaat and festive gifting — Bengaluru.

## Architecture

| Layer | Stack | Entry point |
|---|---|---|
| Frontend | React 19 + Vite + TypeScript | `src-rebuild/` → `src-rebuild/main.tsx` |
| Backend | Express 4 + TypeScript | `server.ts` |
| Database | Supabase (PostgreSQL) | `supabase/migration_000_initial_schema.sql` → `001` → `002` |
| Auth | Supabase Auth (admin only) | `server/lib/adminAuth.ts` |
| Email | Resend | `server/lib/email.ts` |

## Local Development

**Prerequisites:** Node.js 20+, a Supabase project.

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and fill in values (see file for required keys).
3. Run the dev server: `npm run dev`

   Or run Vite standalone (port 5173, proxies /api to port 3000): `npx vite`

## Database Setup

Run in Supabase SQL Editor in order:

1. `supabase/migration_000_initial_schema.sql` — creates the four base enquiry tables
2. `supabase/migration_001.sql` — adds locations, business_hours, extends enquiry tables
3. `supabase/migration_002.sql` — adds admin_profiles, business_settings, indexes

**Existing database:** skip migration_000; run only 001 and 002 (they are safe to re-run).

## Production Build

```
npm run build
npm start
```

`npm run build` outputs frontend to `dist/` and backend to `dist/server.cjs`.

## Admin Dashboard

`/admin` — Supabase Auth login with a matching `admin_profiles` row.

Routes: `/admin`, `/admin/dashboard`, `/admin/reservations`, `/admin/enquiries`, `/admin/settings`

## Public Routes

`/`, `/privacy-policy`, `/terms-and-conditions`, `/cancellation-policy`, `/refund-policy`
