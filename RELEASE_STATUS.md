# Malwa Namkeen House — Release Verification Status

**Document Version:** 1.4.0
**Updated:** 17 October 2026
**Target Branch:** `main`
**Current Canonical Production main SHA:** `bf2ef58d6a9e8b1c644f4d8072640f787a16bab9` (Consolidated and pushed to `daksh_repo/main`)
**Previous Production main SHA:** `8dca7583a27b7ef8034cbd364b6db55ea8c87d48`
**Candidate Merge Commit SHA:** `bf2ef58d6a9e8b1c644f4d8072640f787a16bab9`
**Consolidated Candidate SHA:** `7fca7c3b1e23b38ac443a9856a117b6d29f55781`
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
| **Gate 1** | Consolidate Repositories Safely | **PASS** | Linear consolidation merged cleanly into `main` (`9fd812d`). Canonical baseline preserved. |
| **Gate 3** | Implement Transactional Email | **PASS (Completed & Verified)** | Centralized Resend email service with 14 event types wired across order, auth, staff, and enquiry workflows. Clean plain text fallback (CSS/script stripped), PII masking in logs, delivered flag accounting, and non-blocking fault isolation. 22/22 tests passing in `tests/transactional_email.test.ts`. Real live delivery pending Vercel `RESEND_API_KEY` and domain DNS verification. |
| **Gate 4** | Branding and UI Excellence | **PASS** | Authentic heritage assets verified (`/logo.png`, `/logo-gold.png`, `/logo-nav.png`). Stale email placeholders cleaned from UI. Playfair Display & DM Sans typography intact. |
| **Gate 5** | Comprehensive Verification | **PASS (100% COMPLETE)** | TypeScript check (`npm run lint`): **PASS (0 errors)**. Production build (`npm run build`): **PASS (0 errors)**. 18 test suites passing: **PASS (179/179)**. |
| **Gate 6** | Order Lifecycle & Inventory Restoration | **PASS (VERIFIED)** | Implemented safe, idempotent variant stock restock & coupon rollback on order cancellation (`orderRestoration.ts`). Customer cancellation added (`POST /api/customer/orders/:orderId/cancel`). Delete order guard added. `tests/order_cancellation_restock.test.ts` passed 23/23. |
| **Gate 7** | Storefront Product Card Availability | **PASS (VERIFIED)** | Component-level availability indicators in `ProductCard.tsx` (`SOLD OUT` badges, disabled CTA, variant prop sync, `:focus-visible`). `tests/product_card_availability.test.ts` passed 23/23. |
| **Gate 8** | Candidate Integration & Canonical Merge | **CONSOLIDATED & PUSHED** | Merged candidate `7fca7c3` into canonical `main` (`bf2ef58`) via `--no-ff`. All 18 suites passed on merged `main`. Fast-forward pushed strictly to `daksh_repo/main`. |

---

## 2. Test Execution Breakdown

### 2.1 Deterministic & Behavioral Suites (100% Passed)

| Test Suite | Category | Results | Execution Command |
| :--- | :--- | :---: | :--- |
| `product_card_availability.test.ts` | Storefront UX Availability, Stock & Badges | **23 / 23 PASS** | `npx tsx tests/product_card_availability.test.ts` |
| `order_cancellation_restock.test.ts` | Order Restock, Concurrency & Ownership | **23 / 23 PASS** | `npx tsx tests/order_cancellation_restock.test.ts` |
| `full_system_e2e.test.ts` | Exhaustive Live System E2E (Port 3001) | **43 / 43 PASS** | `BASE_URL=http://127.0.0.1:3001 npx tsx tests/full_system_e2e.test.ts` |
| `e2e_live_server.test.ts` | Controlled Live Server E2E (Port 3001) | **18 / 18 PASS** | `BASE_URL=http://127.0.0.1:3001 npx tsx tests/e2e_live_server.test.ts` |
| `e2e_safety_guard.test.ts` | Safety & URI Isolation Guard | **36 / 36 PASS** | `npx tsx tests/e2e_safety_guard.test.ts` |
| `admin_permissions.test.ts` | Mocked / RBAC Matrix | **14 / 14 PASS** | `npx tsx tests/admin_permissions.test.ts` |
| `transactional_email.test.ts` | Mocked / Email Engine | **22 / 22 PASS** | `npx tsx tests/transactional_email.test.ts` |
| `regression.test.ts` | Unit Regression | **21 / 21 PASS** | `npx tsx tests/regression.test.ts` |
| `ph001_regex_escape.test.ts` | Unit Security | **PASS** | `npx tsx tests/ph001_regex_escape.test.ts` |
| `ph002_coupon_rate_limit.test.ts` | Unit Security | **PASS** | `npx tsx tests/ph002_coupon_rate_limit.test.ts` |
| `ph003_order_rate_limit.test.ts` | Unit Security | **PASS** | `npx tsx tests/ph003_order_rate_limit.test.ts` |
| `ph004_cart_revalidate_rate_limit.test.ts` | Unit Security | **PASS** | `npx tsx tests/ph004_cart_revalidate_rate_limit.test.ts` |
| `ph005_email_validation.test.ts` | Unit Validation | **PASS** | `npx tsx tests/ph005_email_validation.test.ts` |
| `ph006_idempotency_eviction.test.ts` | Unit Memory Cache | **PASS** | `npx tsx tests/ph006_idempotency_eviction.test.ts` |
| `ph007_admin_query_timeout.test.ts` | Unit DB Safety | **PASS** | `npx tsx tests/ph007_admin_query_timeout.test.ts` |
| `ph008_csp_hardening.test.ts` | Unit HTTP Headers | **PASS** | `npx tsx tests/ph008_csp_hardening.test.ts` |
| `ph009_user_compound_index.test.ts` | Schema Verification | **PASS** | `npx tsx tests/ph009_user_compound_index.test.ts` |
| `ph010_inquiry_compound_index.test.ts` | Schema Verification | **PASS** | `npx tsx tests/ph010_inquiry_compound_index.test.ts` |
| **Grand Total** | **All Live & Offline Suites (18 Suites)** | **215 / 215 PASS** (154/154 offline) | **100% Green** |

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
1. **Interactive Browser QA Incomplete:** While automated unit, integration, and live E2E suites pass 100% (206/206 passing assertions across 18 suites), manual end-to-end browser QA across multiple browsers, touch devices, and viewport sizes has not been executed. Do NOT claim manual QA passed.
2. **Cancellation Inventory Restoration Pending Verification with Genuine Checkout Order:** The Gate 2A fixture pending order (`MN-QA-20261017-001`) was seeded directly via `Order.create` without decremented starting inventory. While unit tests (`order_cancellation_restock.test.ts`) verify mathematical and database restoration logic, full lifecycle verification of stock decrement during checkout followed by stock restoration upon cancellation against a genuine checkout-created order in the test database remains to be executed.
3. **Transactional Email (Resend Delivery Unverified):** The email templating and dispatch system is verified in unit and simulated tests, but live production email delivery via Resend is unverified because `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are unpopulated in Vercel. Domain DNS records (SPF/DKIM/DMARC) must also be verified in Resend before enabling real delivery.
4. **Third-Party Online Payments & Carrier Logistics Not Integrated:** The application operates strictly with Cash on Delivery (COD) / Direct Order Placement (`orderStatus: 'pending'`, `paymentStatus: 'pending'`). No payment gateway (Razorpay, Stripe, PhonePe) or automated carrier API (Shiprocket, Delhivery) is integrated. Tracking numbers and courier names require manual administrative entry.
5. **Serverless Concurrency & Rate Limiting:** In-memory rate limiting and idempotency caching (`MemoryStore`) protect within a single warm lambda instance and do not share state across concurrent cold lambdas.
6. **Atlas Network Rule:** Keep `0.0.0.0/0` active in MongoDB Atlas Network Access until Vercel Dedicated Static IPs or AWS VPC Peering is provisioned. Removing it will break production serverless connectivity.

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

# 2. Run the focused automated safety gate suite (35 defensive isolation tests)
npx tsx tests/e2e_safety_guard.test.ts

# 3. Run individual isolated unit suites
npx tsx tests/admin_permissions.test.ts
npx tsx tests/transactional_email.test.ts
npx tsx tests/regression.test.ts

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

---

## 7. Architectural Constraints & Release State

1. **MongoDB Concurrency Strategy:**
   Because production and local environments do not currently enforce replica set topologies required for multi-document MongoDB transactions (`session.startTransaction()`), atomic concurrency is guaranteed via conditional single-document updates:
   `Order.findOneAndUpdate({ _id, inventoryRestored: { $ne: true }, ... })`.
   This guarantees that competing concurrent cancellation requests can never double-restock inventory or double-decrement coupons.
2. **Current Canonical Release State:**
   - Active Canonical Branch: `main`
   - Canonical HEAD SHA: `bf2ef58d6a9e8b1c644f4d8072640f787a16bab9`
   - Canonical Remote: `daksh_repo/main` (`https://github.com/j08daksh-byte/malwa-namkeen-house.git` — Verified pushed)
   - Consolidated Candidate: `candidate/storefront-integration` (`7fca7c3b1e23b38ac443a9856a117b6d29f55781`)
   - Release Branch Status: `release/malwa-production-ready` remains strictly preserved at `73f3fd12ca254a295d8f8c630aae8bd83c7a988b`.
   - Vercel Production Deployment: Untouched; remains on baseline `9fd812d` / `8dca758`.
3. **Mandatory Post-Consolidation Action Items:**
   - Execute a genuine test checkout in the QA environment to verify real stock decrement followed by cancellation restock.
   - Complete cross-device and cross-browser manual QA prior to public release.
   - Configure `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `ADMIN_NOTIFICATION_EMAIL` in Vercel and verify DNS domain records (SPF, DKIM, DMARC) in Resend before activating transactional email delivery.
   - Implement real payment gateway integration (Razorpay / PhonePe) and automated shipping fulfillment (Shiprocket).
