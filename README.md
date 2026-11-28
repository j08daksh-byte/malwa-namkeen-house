# Malwa Namkeen House

Full-stack e-commerce storefront and operations platform for **Malwa Namkeen House** (Ujjain, Madhya Pradesh) — specializing in artisanal Ratlami Sev, Ujjaini Sev, Fariyali snacks, sweets, and festive gifting.

**Live Storefront:** [malwanamkeenhouse.com](https://www.malwanamkeenhouse.com)

## Key Features

- **Storefront & Catalog (`src-rebuild/`)**: Responsive React 19 + TypeScript storefront with category filtering, quick-view variant selection, cart persistence, coupons, order tracking, and bilingual product discovery.
- **Authentication & RBAC (`server/routes/auth*.ts`)**: Server-authoritative JWT + HTTP-only cookies, Google Sign-In verification, OTP verification, password recovery, and role hierarchy (`super_admin` > `admin` > `customer`).
- **Admin Dashboard (`src-rebuild/pages/admin/`)**: Full inventory/variant management, category ordering, order lifecycle tracking, customer/staff management, hero banners, inquiries, and store settings.
- **Transactional Emails (`server/lib/emailService.ts`)**: Resend integration with verified sender domain, reply-to routing, PII masking, idempotent retries, and non-blocking dispatch.
- **AI Culinary Concierge (`server/routes/concierge.ts`)**: Google Gemini-powered snack pairing & recommendation assistant with automatic model fallback and rate limiting.
- **Reliability & Security**: Distributed MongoDB rate limiting, idempotency records, automatic stock/coupon restoration on cancellation, Helmet security headers, and E2E test-database isolation guards (`server/lib/dbGuard.ts`).

## Architecture

| Layer | Stack | Entry Point |
|---|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS | `src-rebuild/main.tsx` |
| Backend / API | Node.js + Express + TypeScript | `server.ts` / `server/api-entry.ts` |
| Database | MongoDB Atlas + Mongoose | `server/lib/mongodb.ts` |
| Auth | JWT + Bcrypt + Google OAuth 2.0 | `server/lib/auth.ts`, `server/routes/auth.ts` |
| Media Storage | Cloudinary | `server/lib/cloudinary.ts` |
| Transactional Email | Resend + Local Simulator | `server/lib/emailService.ts` |
| AI Concierge | Google Gemini (`@google/genai`) | `server/routes/concierge.ts` |

## Local Development

**Prerequisites:** Node.js 20+, MongoDB Atlas cluster.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment template and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```
   *(All secrets live strictly in `.env.local` or deployment environment variables and are never committed.)*
3. Build & start:
   ```bash
   npm run build
   npm start
   ```

## Verification & Quality Checks

```bash
npm run lint    # TypeScript typechecking (tsc --noEmit)
npm run build   # Frontend + API serverless bundle build
npm test        # Run automated unit & integration test suites
```

## Admin Portal

- Route: `/admin`
- Role hierarchy: `super_admin` > `admin` > `customer`
- Protected API routes: `/api/admin/*`
