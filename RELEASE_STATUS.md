# Malwa Namkeen House — Release Verification Status

**Document Version:** 1.5.0
**Updated:** 17 October 2026
**Target Branch:** `main`
**Current Canonical Production main SHA:** `8e9d031c26b52a138bb36279f19630c79ca2e4c9` (Consolidated via merge `bf2ef58d6a9e8b1c644f4d8072640f787a16bab9` and pushed to `daksh_repo/main` and `origin/main`)
**Previous Production main SHA:** `8dca7583a27b7ef8034cbd364b6db55ea8c87d48`
**Candidate Merge Commit SHA (on main):** `bf2ef58d6a9e8b1c644f4d8072640f787a16bab9`
**Consolidated Candidate SHA:** `7fca7c3b1e23b38ac443a9856a117b6d29f55781`
**Active Integration Branch:** `feat/comprehensive-integration-pass` (HEAD: `78feac2` + uncommitted working changes)
**Canonical Remote:** `daksh_repo` (`https://github.com/j08daksh-byte/malwa-namkeen-house.git`)
**Vercel Production Project:** `malwa-namkeen` (`dakshs-projects-45d693b3`)
**Active Production Deployment:** [`dpl_DayLHyctUicwMKCshgVRtsVLXFET`](https://malwa-namkeen-77c9d7yf7-dakshs-projects-45d693b3.vercel.app) (Status: **● Ready** on baseline `9fd812d` / `8dca758`)
**Canonical Production URL:** [https://malwa-namkeen.vercel.app](https://malwa-namkeen.vercel.app)
**Production Database:** `malwa_namkeen` (MongoDB Atlas — Protected / Untouched)
**Active Isolated Test Database:** `malwa_namkeen_test` (MongoDB Atlas)

---

## 1. Production Gates Verification Matrix

| Gate | Description | Status | Evidence / Notes |
| :--- | :--- | :---: | :--- |
| **Gate 1** | Consolidate Repositories Safely | **PASS (On main)** | Linear consolidation merged cleanly into `main` (`9fd812d` -> `bf2ef58` -> `8e9d031`). Canonical baseline preserved. |
| **Gate 3** | Implement Transactional Email | **CODE & MOCK VERIFIED (UNVERIFIED IN PRODUCTION)** | Centralized Resend email service with 14 event types wired across order, auth, staff, and enquiry workflows. Clean plain text fallback (CSS/script stripped), PII masking in logs, delivered flag accounting, duplicate event prevention on retried events, and non-blocking fault isolation. 24/24 tests passing in `tests/transactional_email.test.ts`. **Live network delivery is UNVERIFIED**: `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are unpopulated in Vercel; domain DNS records (SPF/DKIM/DMARC) are unverified in Resend. |
| **Gate 4** | Branding and UI Excellence | **PASS (On main & branch)** | Authentic heritage assets verified (`/logo.png`, `/logo-gold.png`, `/logo-nav.png`). Stale email placeholders cleaned from UI. Playfair Display & DM Sans typography intact. |
| **Gate 5** | Comprehensive Verification | **PASS (348 / 348 across 22 suites)** | TypeScript check (`npm run lint`): **PASS (0 errors)**. Production build (`npm run build`): **PASS (0 errors)**. Baseline `main` had 18 suites (206 tests); active integration branch has 22 suites (348 tests passing in `tests/run_all.mjs`). |
| **Gate 6** | Order Lifecycle & Inventory Restoration | **PASS (VERIFIED)** | Implemented safe, idempotent variant stock restock & coupon rollback on order cancellation (`orderRestoration.ts`). Customer cancellation added (`POST /api/customer/orders/:orderId/cancel`). Delete order guard added. `tests/order_cancellation_restock.test.ts` passed 23/23. Verified on genuine checkout order in `tests/comprehensive_integration.test.ts`. |
| **Gate 7** | Storefront Product Card Availability | **PASS (On main & branch)** | Component-level availability indicators in `ProductCard.tsx` (`SOLD OUT` badges, disabled CTA, variant prop sync, `:focus-visible`). `tests/product_card_availability.test.ts` passed 23/23. |
| **Gate 8** | Candidate Integration & Canonical Merge | **CONSOLIDATED & PUSHED (main)** | Merged candidate `7fca7c3` into canonical `main` (`bf2ef58` -> `8e9d031`) via `--no-ff`. Fast-forward pushed to `daksh_repo/main` and `origin/main`. |
| **Gate 9** | Implement Razorpay Payment Integration | **CODE & MOCK VERIFIED (UNVERIFIED IN PRODUCTION)** | Server-side Razorpay order creation using strictly server-validated amounts in paise. Constant-time HMAC-SHA256 signature verification (`crypto.timingSafeEqual`). Idempotent webhook processing with replay attack protection. Unpaid order cancellation with stock/coupon restoration and retry support. COD regression preserved. 24/24 tests passing in `tests/razorpay_payment.test.ts`. **Live payment charges are UNVERIFIED**: pending merchant credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) in Vercel. |
| **Gate 10** | Implement Shiprocket Logistics Integration | **CODE & MOCK VERIFIED (UNVERIFIED IN PRODUCTION)** | Server-side Shiprocket client with Bearer token caching, package weight parsing strictly from server metadata (no invented dimensions/weights), duplicate shipment prevention (HTTP 409), AWB assignment, live tracking, webhook verification, replay protection via `processedShippingEvents`, and COD auto-reconciliation upon verified delivery. Preserved manual tracking in admin routes. 32/32 tests passing in `tests/shiprocket_shipping.test.ts`. **Live courier dispatch is UNVERIFIED**: pending live credentials (`SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SHIPROCKET_WEBHOOK_TOKEN`) in Vercel. |
| **Gate 11** | Comprehensive Automated Integration & Regression Pass | **PASS (Branch feat/comprehensive-integration-pass)** | End-to-end integration pass across real application code covering all 9 operational & security domains: product catalog & cart totals, COD checkout, Razorpay, Resend email mocks, Shiprocket logistics mocks, genuine checkout stock decrement & cancellation restock, RBAC & auth recovery, input validation & concurrency boundaries, and storefront/admin regressions. 32/32 tests passing in `tests/comprehensive_integration.test.ts`. Uncommitted on branch. |
| **Gate 12** | Shiprocket Webhook Safety Hardening | **PASS (Branch feat/comprehensive-integration-pass)** | Route-level safety hardening for `/api/shipping/webhook/shiprocket`: (1) Cancelled order guard (late events never transition, mark paid, or alter inventory of cancelled orders), (2) Stable event identity (removed `Date.now()` fallback; deterministic IDs from provider header or stable shipment attributes), (3) Concurrent replay protection (atomic `$addToSet` + `findOneAndUpdate` guard), (4) Cryptographic timing-safe webhook token verification (`crypto.timingSafeEqual`), (5) Guarded COD delivery reconciliation, (6) Endpoint aliases (`/api/shipping/webhook`, `/api/shipping`). 16/16 tests passing in `tests/webhook_shiprocket.test.ts`. Uncommitted on branch. |

---

## 2. Test Execution Breakdown

### 2.1 Deterministic & Behavioral Suites (100% Passed)

| Test Suite | Category | Results | Execution Command |
| :--- | :--- | :---: | :--- |
| `webhook_shiprocket.test.ts` | Route-Level Webhook Safety, Auth & Concurrency | **16 / 16 PASS** | `npx tsx tests/webhook_shiprocket.test.ts` |
| `comprehensive_integration.test.ts` | 9-Domain Real App Integration & Regression Pass | **32 / 32 PASS** | `npx tsx tests/comprehensive_integration.test.ts` |
| `product_card_availability.test.ts` | Storefront UX Availability, Stock & Badges | **23 / 23 PASS** | `npx tsx tests/product_card_availability.test.ts` |
| `order_cancellation_restock.test.ts` | Order Restock, Concurrency & Ownership | **23 / 23 PASS** | `npx tsx tests/order_cancellation_restock.test.ts` |
| `full_system_e2e.test.ts` | Exhaustive Live System E2E (Port 3001) | **43 / 43 PASS** | `BASE_URL=http://127.0.0.1:3001 npx tsx tests/full_system_e2e.test.ts` |
| `e2e_live_server.test.ts` | Controlled Live Server E2E (Port 3001) | **18 / 18 PASS** | `BASE_URL=http://127.0.0.1:3001 npx tsx tests/e2e_live_server.test.ts` |
| `e2e_safety_guard.test.ts` | Safety & URI Isolation Guard | **36 / 36 PASS** | `npx tsx tests/e2e_safety_guard.test.ts` |
| `admin_permissions.test.ts` | Mocked / RBAC Matrix | **14 / 14 PASS** | `npx tsx tests/admin_permissions.test.ts` |
| `transactional_email.test.ts` | Mocked / Email Engine | **24 / 24 PASS** | `npx tsx tests/transactional_email.test.ts` |
| `razorpay_payment.test.ts` | Razorpay Gateway & Cryptographic Security | **24 / 24 PASS** | `npx tsx tests/razorpay_payment.test.ts` |
| `shiprocket_shipping.test.ts` | Shiprocket Logistics, Package Safety & Webhooks | **32 / 32 PASS** | `npx tsx tests/shiprocket_shipping.test.ts` |
| `regression.test.ts` | Unit Regression | **21 / 21 PASS** | `npx tsx tests/regression.test.ts` |
| `ph001_regex_escape.test.ts` | Unit Security | **7 / 7 PASS** | `npx tsx tests/ph001_regex_escape.test.ts` |
| `ph002_coupon_rate_limit.test.ts` | Unit Security | **4 / 4 PASS** | `npx tsx tests/ph002_coupon_rate_limit.test.ts` |
| `ph003_order_rate_limit.test.ts` | Unit Security | **4 / 4 PASS** | `npx tsx tests/ph003_order_rate_limit.test.ts` |
| `ph004_cart_revalidate_rate_limit.test.ts` | Unit Security | **4 / 4 PASS** | `npx tsx tests/ph004_cart_revalidate_rate_limit.test.ts` |
| `ph005_email_validation.test.ts` | Unit Validation | **6 / 6 PASS** | `npx tsx tests/ph005_email_validation.test.ts` |
| `ph006_idempotency_eviction.test.ts` | Unit Memory Cache | **4 / 4 PASS** | `npx tsx tests/ph006_idempotency_eviction.test.ts` |
| `ph007_admin_query_timeout.test.ts` | Unit DB Safety | **3 / 3 PASS** | `npx tsx tests/ph007_admin_query_timeout.test.ts` |
| `ph008_csp_hardening.test.ts` | Unit HTTP Headers | **4 / 4 PASS** | `npx tsx tests/ph008_csp_hardening.test.ts` |
| `ph009_user_compound_index.test.ts` | Schema Verification | **3 / 3 PASS** | `npx tsx tests/ph009_user_compound_index.test.ts` |
| `ph010_inquiry_compound_index.test.ts` | Schema Verification | **3 / 3 PASS** | `npx tsx tests/ph010_inquiry_compound_index.test.ts` |
| **Grand Total** | **All Live & Offline Suites (22 Suites)** | **348 / 348 PASS** | **100% Green (239 offline + 109 live test-server)** |

### 2.2 Compilation & Static Checks

| Check | Tool / Engine | Status | Duration |
| :--- | :--- | :---: | :--- |
| TypeScript Type Check | `tsc --noEmit` (`npm run lint`) | **PASS (0 errors)** | ~4s |
| Vite Frontend Build | Vite 6.4.3 (`npm run build`) | **PASS** | 2.19s |
| Node Server Bundle | esbuild CJS (`dist/server.cjs`) | **PASS (338.1 kB)** | 414ms |
| Serverless API Entry | esbuild ESM (`api/index.js`) | **PASS (329.5 kB)** | 54ms |

### 2.3 Database Connectivity & Strict Test-DB URI Isolation Status

| Check / Suite | Category | Status | Diagnosis & Safety Assessment |
| :--- | :--- | :---: | :--- |
| Atlas Test DB Handshake | Diagnostic | **PASS** | Connected to `malwa_namkeen_test` using restricted test account. |
| Strict Test-DB URI Guard | Security Isolation | **ACTIVE & VERIFIED** | In test mode (`NODE_ENV=test` or `IS_E2E_TEST=true`), strictly requires separate `MONGODB_TEST_URI`. Zero fallback to `MONGODB_URI`. Validates embedded URI database matches `MONGODB_TEST_DB_NAME=malwa_namkeen_test`. Rejects production database names (`malwa_namkeen`), system DBs, and mismatches. Never logs URI. 36 offline assertions pass. |
| Server Health Isolation Check | Runtime Guard | **ACTIVE & VERIFIED** | Intercepts dev server running on port 3000 in <2ms with `LIVE SERVER SAFETY VIOLATION`. Controlled test server running on port 3001 verified on `malwa_namkeen_test`. |
| Post-Connect Disconnect Guard | Runtime Guard | **ACTIVE** | In test mode, post-connection hook verifies `mongoose.connection.name === expectedDbName`. If mismatched, immediately disconnects and throws before accepting requests. |
| Scoped Lifecycle Teardown | Test Lifecycle | **ACTIVE & VERIFIED** | `TestRecordTracker` tracks test users, orders, inquiries, and products under unique `runId`. Confirmed 3 records cleaned in `e2e_live_server` and 4 records cleaned in `full_system_e2e`. |
| `e2e_live_server.test.ts` | Live Server E2E | **PASS (18/18)** | 100% passed on port 3001 against `malwa_namkeen_test`. Cleaned up 3 scoped records. |
| `full_system_e2e.test.ts` | Live Server E2E | **PASS (43/43)** | 100% passed on port 3001 against `malwa_namkeen_test`. Cleaned up 4 scoped records. |
| Production DB Verification | Production Safety | **UNTOUCHED** | Verified `malwa_namkeen` via read-only inspection: exactly 6 baseline orders, 0 inquiries, 14 products. Zero test mutations occurred in production. |

> [!IMPORTANT]
> **Absolute Safety Guarantee:** Live E2E tests can NEVER run against or touch the production database `malwa_namkeen`. Execution strictly requires configuring a separate `MONGODB_TEST_URI` embedding `malwa_namkeen_test`, matching `MONGODB_TEST_DB_NAME=malwa_namkeen_test`. Without this separate test URI, test runners safely skip or immediately abort before opening any database connection, making any HTTP request, or executing any database write.

---

## 3. Production Deployment Configuration (Vercel)

Before deploying `release/malwa-production-ready` to production Vercel (`malwa-namkeen`), ensure the following environment variables are set in the Vercel Dashboard (**Settings → Environment Variables**):

| Variable Name | Environment | Required | Description |
| :--- | :---: | :---: | :--- |
| `MONGODB_URI` | Production / Preview | **YES** | MongoDB Atlas connection string. |
| `MONGODB_DB_NAME` | Production / Preview | **YES** | Target database name (`malwa_namkeen`). |
| `JWT_SECRET` | Production / Preview | **YES** | Secure random key (minimum 32 characters) for signing JWTs. |
| `ADMIN_EMAIL` | Production / Preview | **YES** | Designated store owner email(s), comma-separated. Automatically receives `super_admin`. |
| `EMAIL_PROVIDER` | Production / Preview | Optional | Transactional email provider: set to `resend` (default in prod) or `simulated` for staging. |
| `RESEND_API_KEY` | Production / Preview | **YES** | Resend API key for transactional emails (`re_...`). |
| `RESEND_FROM_EMAIL` | Production / Preview | **YES** | Verified sender, e.g., `Malwa Namkeen House <orders@malwanamkeen.com>`. |
| `ADMIN_NOTIFICATION_EMAIL`| Production / Preview | **YES** | Store owner recipient for new orders and inquiries (`malwanamkeenhouse@gmail.com`). |
| `APP_URL` | Production / Preview | **YES** | Canonical production URL (`https://malwanamkeen.com`). |
| `CLOUDINARY_CLOUD_NAME` | Production / Preview | **YES** | Cloudinary product environment cloud name. |
| `CLOUDINARY_API_KEY` | Production / Preview | **YES** | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Production / Preview | **YES** | Cloudinary API secret. |
| `RAZORPAY_KEY_ID` | Production / Preview | **YES** | Razorpay public key ID (`rzp_live_...` or `rzp_test_...`). |
| `RAZORPAY_KEY_SECRET` | Production / Preview | **YES** | Razorpay secret key (SERVER-ONLY). |
| `RAZORPAY_WEBHOOK_SECRET`| Production / Preview | **YES** | Razorpay webhook verification secret (SERVER-ONLY). |
| `RAZORPAY_SANDBOX` | Production / Preview | Optional | Set to `true` for sandbox / test charges, `false` for live production. |
| `SHIPROCKET_EMAIL` | Production / Preview | **YES** | Shiprocket account login email for logistics API (SERVER-ONLY). |
| `SHIPROCKET_PASSWORD` | Production / Preview | **YES** | Shiprocket account password for Bearer token generation (SERVER-ONLY). |
| `SHIPROCKET_WEBHOOK_TOKEN`| Production / Preview | **YES** | Secret webhook verification token configured in Shiprocket dashboard (SERVER-ONLY). |
| `SHIPROCKET_PICKUP_LOCATION`| Production / Preview | Optional | Configured Shiprocket pickup warehouse name (defaults to 'Primary'). |
| `SHIPROCKET_SANDBOX` | Production / Preview | Optional | Set to `true` for sandbox test mode, `false` for live dispatch. |
| `GEMINI_API_KEY` | Production / Preview | Optional | Google Gemini API key for culinary AI concierge. |

---

## 4. Current Release State & Remaining Release Actions

Candidate branch `candidate/storefront-integration` (SHA `7fca7c3b1e23b38ac443a9856a117b6d29f55781`) has been consolidated into canonical `main` with a standard `--no-ff` merge commit (`bf2ef58d6a9e8b1c644f4d8072640f787a16bab9`) and pushed strictly to canonical remote `daksh_repo/main` (`https://github.com/j08daksh-byte/malwa-namkeen-house.git`).

Feature branch `release/malwa-production-ready` remains strictly unchanged at `73f3fd12ca254a295d8f8c630aae8bd83c7a988b`. Secondary remote `origin` (fork) was not used for pushing.

### 4.1 Deployment Status (No Deployment Triggered)
- **Deployment Action:** ZERO deployment was triggered to Vercel production.
- **Active Canonical Deployment:** [`dpl_DayLHyctUicwMKCshgVRtsVLXFET`](https://malwa-namkeen-77c9d7yf7-dakshs-projects-45d693b3.vercel.app) remains unchanged on baseline `9fd812d` / `8dca758`.
- **Production Database:** `malwa_namkeen` remains protected and untouched (0 mutations).

### 4.2 Empirical Vercel Configuration Audit (16 Oct 2026)
- **Verified Present:** `MONGODB_URI`, `MONGODB_DB_NAME=malwa_namkeen`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_NOTIFICATION_EMAIL`, `APP_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `ALLOWED_ORIGINS`, `BUSINESS_WHATSAPP_NUMBER`, `GOOGLE_CLIENT_ID`.
- **CRITICAL MISSING (Blocker):** `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are **not configured** in Vercel. Real transactional emails cannot be delivered until these are added.
- **Verified Absent (Safe):** `MONGODB_TEST_URI`, `MONGODB_TEST_DB_NAME`, `IS_E2E_TEST`, `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD` are strictly absent from Vercel settings.

### 4.3 Operational Scope, Known Risks & Limitations
1. **Interactive Browser QA (UNVERIFIED):** While automated unit, integration, and live E2E suites pass 100% (206/206 passing assertions across 18 suites on `main`; 348/348 across 22 suites on `feat/comprehensive-integration-pass`: 239 offline + 109 live test-server), manual exploratory browser QA across multiple browsers, touch devices, and viewport sizes is **UNVERIFIED**. Manual staging checks required before customer launch:
   - Variant/weight switching (250g, 500g, 1kg) and dynamic price updates on `/shop`.
   - Out-of-stock badge display and disabled CTA enforcement for depleted products.
   - Cart limit boundaries (max 10 / stock cap) and coupon validation (`QA10PERCENT`).
   - Cash on Delivery (COD) checkout placement and confirmation screen.
   - Razorpay Test Mode checkout popup invocation, dismissed modal handling, and declined card alert (`payment.failed`).
   - Customer self-service order cancellation from `/dashboard` and stock restoration verification.
   - Admin order fulfillment drawer and manual tracking fallback (`courierName`, `trackingNumber`, `trackingUrl`) on `/admin/orders`.
2. **Cancellation Inventory & Coupon Restoration (EMPIRICALLY VERIFIED):** Full lifecycle verification of stock decrement during checkout followed by stock restoration and coupon rollback upon cancellation against a genuine checkout-created order in the test database was completed in `tests/comprehensive_integration.test.ts` Section 6. Pre-seeded order `MN-QA-20261017-001` remains completely untouched in the test database.
3. **Transactional Email — Resend Live Delivery (UNVERIFIED IN PRODUCTION):** The email templating, dispatch, plain text fallback, duplicate event prevention, and non-blocking failure isolation system is verified in unit and mocked tests (24/24 tests). Real live network delivery via Resend is **UNVERIFIED** because `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are unpopulated in Vercel production. Domain DNS records (SPF/DKIM/DMARC) for `orders@malwanamkeen.com` are unverified in Resend.
4. **Payment Processing — Razorpay Live Transactions (UNVERIFIED IN PRODUCTION):** Server-side Razorpay order creation, constant-time HMAC-SHA256 signature verification, and replay attack protection are verified via automated tests (24/24 tests). Real live payment collection is **UNVERIFIED** pending merchant credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) in Vercel. Cash on Delivery (COD) remains fully operational.
5. **Logistics & Shipping — Shiprocket Live Dispatch (UNVERIFIED IN PRODUCTION):** Server-side Shiprocket integration, webhook verification, deterministic event identity, cancelled-order guard, and COD reconciliation are verified via automated test suites (32/32 tests in `shiprocket_shipping.test.ts` + 16/16 tests in `webhook_shiprocket.test.ts`). Real live courier dispatch and live webhook callbacks are **UNVERIFIED** pending live credentials (`SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SHIPROCKET_WEBHOOK_TOKEN`) in Vercel. Manual administrative tracking entry remains 100% operational.
6. **Serverless Concurrency & Rate Limiting:** In-memory rate limiting and idempotency caching (`MemoryStore`) protect within a single warm lambda instance and do not share state across concurrent cold lambdas. Distributed rate limiting across cold lambdas requires an external Redis cache (e.g. Upstash) in a future milestone.
7. **Atlas Network Rule:** Keep `0.0.0.0/0` active in MongoDB Atlas Network Access until Vercel Dedicated Static IPs or AWS VPC Peering is provisioned. Removing it will break production serverless connectivity.

---

## 5. Strict Test-Database Connection Isolation Architecture & Setup Guide

### 5.1 Architecture of the Isolation Safety Gate

The test database isolation gate guarantees that E2E test runs never touch production data across four defensive perimeters:

```
┌─────────────────────────────────────────────────────────────────┐
│ Perimeter 1: Configuration Validation (server/lib/dbGuard)      │
│ - NODE_ENV=test or IS_E2E_TEST=true requires MONGODB_TEST_URI  │
│ - STRICTLY PROHIBITS fallback to MONGODB_URI                    │
│ - Rejects identical MONGODB_TEST_URI === MONGODB_URI            │
│ - Requires MONGODB_TEST_DB_NAME=malwa_namkeen_test              │
│ - Extracts database name from MONGODB_TEST_URI path             │
│ - Validates extracted DB === MONGODB_TEST_DB_NAME               │
│ - Rejects production DBs ('malwa_namkeen') and system DBs       │
│ - NEVER leaks or logs connection URIs or credentials in errors   │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│ Perimeter 2: Server Runtime Enforcement (server/lib/mongodb)    │
│ - getEffectiveMongoConfig() supplies MONGODB_TEST_URI in test   │
│ - Post-connection hook verifies mongoose.connection.name matches│
│ - Immediate disconnect and throw if connected database differs  │
│ - /api/health exposes 'database: mongoose.connection.name'      │
│ - In test mode, server process exits with code 1 on DB failure  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│ Perimeter 3: Pre-Flight Suite Guard & Teardown (test_db_guard)  │
│ - assertSafeTestDatabaseEnvironment() validates config in suite │
│ - verifyLiveServerDatabaseIsolation(BASE_URL) checks /api/health│
│ - Aborts in <2ms before any HTTP request or DB write            │
│ - TestRecordTracker tracks userIds, orders, and inquiries       │
│ - Scoped teardown connects via MONGODB_TEST_URI (no fallback)   │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│ Perimeter 4: Orchestrator Gate (tests/run_all.mjs)              │
│ - Verifies both MONGODB_TEST_URI and MONGODB_TEST_DB_NAME       │
│ - Skips live E2E suites under hard lock if unconfigured         │
│ - All 14 offline unit/mocked suites run deterministically       │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Test Commands

```bash
# 1. Run all offline unit and mocked suites (safe default without live credentials)
node tests/run_all.mjs

# 2. Run the focused automated safety gate suite (36 defensive isolation tests)
npx tsx tests/e2e_safety_guard.test.ts

# 3. Run individual isolated unit suites
npx tsx tests/admin_permissions.test.ts
npx tsx tests/transactional_email.test.ts
npx tsx tests/regression.test.ts
npx tsx tests/razorpay_payment.test.ts
npx tsx tests/shiprocket_shipping.test.ts
npx tsx tests/webhook_shiprocket.test.ts
npx tsx tests/comprehensive_integration.test.ts

# 4. Run TypeScript type check
npm run lint

# 5. Build production bundle (Vite + Node Server + Vercel Serverless)
npm run build

# 6. Run Live E2E tests against a dedicated isolated test server (REQUIRES DEDICATED MONGODB_TEST_URI)
# Start isolated server in Terminal 1:
# IS_E2E_TEST=true MONGODB_TEST_URI="mongodb+srv://user:pass@cluster.mongodb.net/malwa_namkeen_test?retryWrites=true&w=majority" MONGODB_TEST_DB_NAME=malwa_namkeen_test npx tsx server.ts
# Run E2E suites in Terminal 2:
# MONGODB_TEST_URI="mongodb+srv://user:pass@cluster.mongodb.net/malwa_namkeen_test?retryWrites=true&w=majority" MONGODB_TEST_DB_NAME=malwa_namkeen_test npx tsx tests/e2e_live_server.test.ts
# MONGODB_TEST_URI="mongodb+srv://user:pass@cluster.mongodb.net/malwa_namkeen_test?retryWrites=true&w=majority" MONGODB_TEST_DB_NAME=malwa_namkeen_test npx tsx tests/full_system_e2e.test.ts
```

### 5.3 Live E2E Pre-Flight Audit & Operational Status

1. **MongoDB Atlas Test DB Connectivity:** **VERIFIED (PASS)**. Handshake and read-only diagnostic (`listCollections`) on `malwa_namkeen_test` succeeded using restricted test credentials.
2. **Server Health Pre-Flight Gate:** **ACTIVE & VERIFIED**. Both `tests/e2e_live_server.test.ts` and `tests/full_system_e2e.test.ts` query `/api/health` and strictly enforce that `connectedDatabase === 'malwa_namkeen_test'` before issuing any request that could mutate data.
3. **Collision Protection (Active Dev Server):** If a local dev server (`npm run dev`) is running on port 3000 connected to `malwa_namkeen`, the safety gate immediately aborts in <2ms with `LIVE SERVER SAFETY VIOLATION`, preventing any test interaction with production or development data.
4. **Zero External Side-Effects:**
   - **Emails:** In test mode (`IS_E2E_TEST=true` / `NODE_ENV=test`), `server/lib/emailService.ts` forces `provider: 'simulated'` with `resendApiKey: ''`. Zero real emails are sent to customers or store owners.
   - **Payments:** Test suites execute Cash on Delivery (`cod`) workflows with zero external payment gateway calls.
   - **Shipping:** Uses internal tariff rules; zero third-party logistics API calls.
5. **Scoped Teardown Lifecycle:** Every test record (users, orders, inquiries, products) is tagged with a unique `runId` and cleaned up via precision `$in` queries. Broad collection drops or deletes are strictly prohibited.

### 5.4 Controlled Live E2E Execution Runbook

To execute the controlled live E2E run without port conflict with an existing dev server:

#### Option A: Dedicated Isolated Test Port (Port 3001 — Recommended)
```bash
# Terminal 1: Launch isolated test server on Port 3001
PORT=3001 IS_E2E_TEST=true npx tsx server.ts

# Terminal 2: Run live E2E suites targeting Port 3001
BASE_URL=http://127.0.0.1:3001 npx tsx tests/e2e_live_server.test.ts
BASE_URL=http://127.0.0.1:3001 npx tsx tests/full_system_e2e.test.ts
```

#### Option B: Standard Port 3000 (Stop Dev Server First)
```bash
# 1. Stop the running dev server (Ctrl+C in dev terminal)
# 2. Launch test server in Terminal 1:
IS_E2E_TEST=true npx tsx server.ts

# 3. Launch live E2E suites in Terminal 2:
npx tsx tests/e2e_live_server.test.ts
npx tsx tests/full_system_e2e.test.ts
```

---

## 6. Audit Defects Resolution Status

| Defect ID | Description | Severity | Resolution Status | Verified Evidence |
| :--- | :--- | :---: | :---: | :--- |
| **DEF-01** | Order cancellation did not restore variant inventory or rollback coupon usage. Cancelled orders leaked reserved stock permanently. | **P0 (Critical)** | **RESOLVED** | Implemented `server/lib/orderRestoration.ts`. Restores exact variant quantities via atomic `$inc`. Rolls back coupon usage count. Concurrency-safe via atomic conditional lock (`inventoryRestored: { $ne: true }`). Verified by `tests/order_cancellation_restock.test.ts` (23/23 PASS). |
| **DEF-06** | Customers had no mechanism to cancel eligible pending orders from the storefront. | **P1 (High)** | **RESOLVED** | Implemented authenticated `POST /api/customer/orders/:orderId/cancel`. Enforces customer account ownership and eligibility (`orderStatus: 'pending'`, `shipmentStatus: 'unfulfilled'`). Added Cancel action & confirmation modal to `Dashboard.tsx`. Verified by unit & routing test cases. |
| **DEF-DELETE** | Admin order deletion previously bypassed cancellation accounting, permanently dropping reserved stock. | **P1 (High)** | **RESOLVED** | Guard added to `DELETE /api/admin/orders/:id` in `server/routes/adminOrders.ts`: active uncancelled orders automatically trigger restock prior to deletion. |
| **DEF-AVAIL** | Storefront cards lacked clear availability badges, disabled purchase CTA for out-of-stock items, and proper variant state synchronization. | **P1 (High)** | **RESOLVED** | Implemented component-level availability indicators in `ProductCard.tsx` (`SOLD OUT` badges, disabled CTA, variant prop sync, `:focus-visible`). Verified by `tests/product_card_availability.test.ts` (23/23 PASS). |
| **DEF-QTY** | Order checkout previously clamped negative/invalid item quantities (`Math.max(1, -2)`) instead of rejecting them. | **P1 (High)** | **RESOLVED** | Updated `server/routes/customerOrders.ts` line 233 to strictly reject negative or non-integer quantities with HTTP 400 (`Invalid quantity for "${product.name}". Quantity must be a positive whole number.`). Verified in `tests/comprehensive_integration.test.ts`. |
| **DEF-WEIGHT-REGEX** | Package weight parsing regex only matched standalone units (`500g`, `1kg`), returning `null` for real packaging labels like `250g Pack`, `500g Pouch`, `1kg Box`. | **P2 (Medium)** | **RESOLVED** | Enhanced regex in `server/lib/shiprocketService.ts` to recognize optional container descriptors (`pack|pouch|box|jar|tin|bag|container`) without inventing weights. Verified in `tests/comprehensive_integration.test.ts`. |
| **DEF-ORDER-CANCEL** | Customer cancellation route `/api/orders/:orderId/cancel` was missing on the orders router, only present under `/api/customer/orders/:orderId/cancel`. | **P2 (Medium)** | **RESOLVED** | Added `/api/orders/:orderId/cancel` to `server/routes/customerOrders.ts` mirroring `customerAccount.ts` with strict customer ownership and guest email fallback. Verified in `tests/comprehensive_integration.test.ts`. |

---

## 7. Architectural Constraints & Release State

1. **MongoDB Concurrency Strategy:**
   Because production and local environments do not currently enforce replica set topologies required for multi-document MongoDB transactions (`session.startTransaction()`), atomic concurrency is guaranteed via conditional single-document updates:
   `Order.findOneAndUpdate({ _id, inventoryRestored: { $ne: true }, ... })`.
   This guarantees that competing concurrent cancellation requests can never double-restock inventory or double-decrement coupons.
2. **Current Canonical Release State:**
   - **Active Working Branch:** `feat/comprehensive-integration-pass` (HEAD: `78feac2` + uncommitted working changes)
   - **Active Canonical Branch:** `main`
   - **Canonical main HEAD SHA:** `8e9d031c26b52a138bb36279f19630c79ca2e4c9` (Consolidated via merge `bf2ef58d6a9e8b1c644f4d8072640f787a16bab9`)
   - **Canonical Remote:** `daksh_repo/main` (`https://github.com/j08daksh-byte/malwa-namkeen-house.git` — Verified pushed)
   - **Upstream Remote:** `origin/main` (`https://github.com/Baljeet2611/Project0x00.git` — In sync at `8e9d031`)
   - **Consolidated Candidate:** `candidate/storefront-integration` (`7fca7c3b1e23b38ac443a9856a117b6d29f55781`)
   - **Preserved Release Branch:** `release/malwa-production-ready` remains strictly preserved at `73f3fd12ca254a295d8f8c630aae8bd83c7a988b`.
   - **Vercel Production Deployment:** Untouched; remains on baseline `9fd812d` / `8dca758` (`dpl_DayLHyctUicwMKCshgVRtsVLXFET`).
3. **Operational Scope & Release Readiness Boundaries:**
   - **Genuine Checkout Order Cancellation & Stock/Coupon Rollback:** **VERIFIED EMPIRICALLY (PASS)**. Fully executed in `tests/comprehensive_integration.test.ts` Section 6: placed genuine checkout order with coupon `QA10PERCENT`, decremented variant stock by 1 in MongoDB, incremented coupon used count by 1 in MongoDB. Cancelled via `POST /api/customer/orders/:id/cancel`: variant stock restored back to starting baseline, coupon used count rolled back to starting baseline. Idempotent re-cancellation prevented double-restoration. Pre-seeded order `MN-QA-20261017-001` verified completely untouched in MongoDB with zero mutations.
   - **Interactive Cross-Browser QA (UNVERIFIED):** Mobile viewport meta tags, robots.txt, sitemap.xml, and responsive layout verified via automated integration tests; manual multi-device / Safari / iOS QA remains **UNVERIFIED**.
   - **Transactional Email — Resend Live Delivery (UNVERIFIED IN PRODUCTION):** Verified with mocked client and non-blocking fault tolerance (24/24 tests). Real live delivery is **UNVERIFIED** until `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and domain DNS verification (SPF/DKIM/DMARC) are configured in Vercel.
   - **Payment Processing — Razorpay Live Charges (UNVERIFIED IN PRODUCTION):** Fully verified with mocks (server-calculated amounts in paise, constant-time HMAC-SHA256 signature verification, webhook replay deduplication, 24/24 tests). Real live charges are **UNVERIFIED** until merchant credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) are provisioned in Vercel. COD checkout remains 100% operational.
   - **Logistics & Shipping — Shiprocket Live Courier (UNVERIFIED IN PRODUCTION):** Fully verified with mocks (packaging weight parsing from server metadata, duplicate prevention HTTP 409, AWB tracking, COD auto-reconciliation, 32/32 tests in `shiprocket_shipping.test.ts` + 16/16 tests in `webhook_shiprocket.test.ts`). Manual administrative tracking entry remains fully supported. Live dispatches are **UNVERIFIED** until `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, and `SHIPROCKET_WEBHOOK_TOKEN` are configured in Vercel.

---

## 8. Release Roadmap & Exact Next Action

1. **Exact Single Safest Next Action:**
   - Commit the uncommitted working-tree changes (8 modified files, 2 untracked test suites) on branch `feat/comprehensive-integration-pass` with message:
     `feat(integration): consolidate comprehensive integration pass and Shiprocket webhook safety suite`.
2. **Next Release Gate (Gate 13 — Candidate Merge Preparation):**
   - Create a clean release candidate branch `candidate/comprehensive-integration` from `feat/comprehensive-integration-pass`.
   - Submit for lead engineer review and execute test pass against `malwa_namkeen_test`.
3. **Production Deployment Prerequisites (Pending Manual Ops):**
   - Provision `RESEND_API_KEY` and verify domain DNS in Resend.
   - Provision `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` in Vercel.
   - Provision `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SHIPROCKET_WEBHOOK_TOKEN` in Vercel.
   - Execute manual exploratory browser QA on staging preview.

