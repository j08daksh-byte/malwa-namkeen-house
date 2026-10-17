# Malwa Namkeen House — Release Verification Status

**Document Version:** 1.8.0 (Release Candidate)
**Updated:** 17 October 2026
**Target Branch:** `feat/transactional-email-hardening` (Release Candidate HEAD: `cd852651ae870ed7d131285b9cbb748883fc8c2f`, branched from canonical `main` at `f7ead1e`)
**Current Canonical Production main SHA:** `f7ead1e7d5b7a72759f36bc67e3fad6ef0b1eabb` (Consolidated with `feat/comprehensive-integration-pass`, verified in sync with `daksh_repo/main`)
**Previous Production main SHA:** `8e9d031c26b52a138bb36279f19630c79ca2e4c9`
**Candidate Merge Commit SHA (on main):** `bf2ef58d6a9e8b1c644f4d8072640f787a16bab9`
**Consolidated Candidate SHA:** `7fca7c3b1e23b38ac443a9856a117b6d29f55781`
**Active Hardening Branch (RC):** `feat/transactional-email-hardening` (HEAD: `cd852651ae870ed7d131285b9cbb748883fc8c2f`, clean working tree)
**Canonical Remote:** `daksh_repo` (`https://github.com/j08daksh-byte/malwa-namkeen-house.git`)
**Vercel Production Project:** `malwa-namkeen` (`dakshs-projects-45d693b3`)
**Active Production Deployment (Known-Good):** [`dpl_4DGFYbBhPvvJHhHaAWxChXz9A95b`](https://malwa-namkeen-8imdhu89x-dakshs-projects-45d693b3.vercel.app) (Status: **● Ready**, aliased to `https://malwa-namkeen.vercel.app`)
**Usable Staging Preview Deployment:** [`dpl_9rykb8hDa9YAi4Jnasz8jXUU9x2e`](https://malwa-namkeen-btoliab4k-dakshs-projects-45d693b3.vercel.app) (Status: **● Ready**, aliased to `https://malwa-namkeen-git-feat-transact-b29aea-dakshs-projects-45d693b3.vercel.app`)
**Domain Status:** `malwanamkeen.com` is **NOT connected** in Vercel (`0 Domains found under dakshs-projects-45d693b3`). Default URL: [https://malwa-namkeen.vercel.app](https://malwa-namkeen.vercel.app)
**Production Database:** `malwa_namkeen` (MongoDB Atlas — Protected / Untouched, 6 baseline orders)
**Active Isolated Test Database:** `malwa_namkeen_test` (MongoDB Atlas)

---

## 1. Production Gates Verification Matrix

| Gate | Description | Status | Evidence / Notes |
| :--- | :--- | :---: | :--- |
| **Gate 1** | Consolidate Repositories Safely | **PASS (On main)** | Linear consolidation merged cleanly into `main` (`9fd812d` -> `bf2ef58` -> `8e9d031`). Canonical baseline preserved. |
| **Gate 3** | Implement Transactional Email | **EMAIL CODE GATE CLOSED — LIVE DELIVERY UNVERIFIED (OWNER ACTION REQUIRED)** | Centralized Resend email service with 14 event types wired across order, auth, staff, and enquiry workflows. Clean plain text fallback (CSS/script stripped), PII masking in logs, delivered flag accounting, duplicate event prevention on retried events, error string sanitization scrubbing API keys/bearer tokens, bounded in-flight retries on transient network errors, and non-blocking fault isolation. Authenticated admin smoke test mounted at `POST /api/admin/email/smoke-test` (and `/api/admin/settings/email/smoke-test`) and provider status check at `GET /api/admin/email/status` with rate limiting, input validation, and zero credential leakage. 43/43 tests passing in `tests/transactional_email.test.ts` (11 suites). Live delivery is UNVERIFIED: `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are absent from Vercel Preview; `malwanamkeen.com` is non-existent in DNS (`NXDOMAIN` on 8.8.8.8) and unconnected in Vercel (`0 Domains found`). Real live network delivery remains unverified until credentials are configured in Preview and a test email is received in a real inbox. |
| **Gate 4** | Branding and UI Excellence | **PASS (On main & branch)** | Authentic heritage assets verified (`/logo.png`, `/logo-gold.png`, `/logo-nav.png`). Stale email placeholders cleaned from UI. Playfair Display & DM Sans typography intact. |
| **Gate 5** | Comprehensive Verification | **PASS (419 / 419 across 23 suites)** | TypeScript check (`npm run lint`): **PASS (0 errors)**. Production build (`npm run build`): **PASS (0 errors)**. 23 suites (419 tests passing in `tests/run_all.mjs`: 310 offline + 109 live test-server). |
| **Gate 6** | Order Lifecycle & Inventory Restoration | **PASS (VERIFIED)** | Implemented safe, idempotent variant stock restock & coupon rollback on order cancellation (`orderRestoration.ts`). Customer cancellation added (`POST /api/customer/orders/:orderId/cancel`). Delete order guard added. `tests/order_cancellation_restock.test.ts` passed 23/23. Verified on genuine checkout order in `tests/comprehensive_integration.test.ts`. |
| **Gate 7** | Storefront Product Card Availability | **PASS (On main & branch)** | Component-level availability indicators in `ProductCard.tsx` (`SOLD OUT` badges, disabled CTA, variant prop sync, `:focus-visible`). `tests/product_card_availability.test.ts` passed 23/23. |
| **Gate 8** | Candidate Integration & Canonical Merge | **CONSOLIDATED & PUSHED (main)** | Merged candidate `7fca7c3` into canonical `main` (`bf2ef58` -> `8e9d031`) via `--no-ff`. Fast-forward pushed to `daksh_repo/main` and `origin/main`. |
| **Gate 9** | Implement Razorpay Payment Integration | **CODE & MOCK VERIFIED — LIVE PAYMENT UNVERIFIED (PENDING OWNER CREDENTIALS)** | Server-side Razorpay order creation using strictly server-validated amounts in paise (1 INR = 100 paise). Zero browser trust for pricing or payment status. Timing-safe cryptographic HMAC-SHA256 signature verification (`crypto.timingSafeEqual`). Strict order ID match, ownership enforcement, cancelled order prevention, online payment method checks. Replay attack protection with duplicate `razorpayPaymentId` cross-order database lookup and sparse compound index. Idempotent webhook processing (`processedWebhookEvents`), amount/currency match enforcement against server order total, safe ignoring of captured payments for cancelled orders, failure reason capture without inventory corruption. Unpaid order cancellation (`POST /api/orders/:orderId/cancel-unpaid`) with stock/coupon restoration. Payment retry support (`POST /api/orders/:orderId/retry-payment`) generating a fresh Razorpay order and switching paymentMethod to online. Dashboard retry/pay integration (`handleRetryPayment`, `loadRazorpayScript`). COD flow regression preserved. 50/50 tests passing in `tests/razorpay_payment.test.ts` (9 suites). **Live payment charges are UNVERIFIED**: pending merchant credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) in Vercel. |
| **Gate 10** | Implement Shiprocket Logistics Integration | **CODE & MOCK VERIFIED — LIVE COURIER DISPATCH UNVERIFIED (PENDING OWNER CREDENTIALS)** | Server-side Shiprocket client with Bearer token caching, package weight parsing strictly from server metadata (no invented dimensions/weights), duplicate shipment prevention (HTTP 409), AWB assignment, live tracking synchronization into MongoDB (`syncOrderTrackingFromShiprocket`), status regression protection (`SHIPMENT_STATUS_RANK` preventing delivered/out_for_delivery from regressing back to in_transit/ready_to_ship), customer/guest tracking authorization (`GET /api/orders/:orderId/track`), customer account tracking (`GET /api/customer/orders/:orderId/track`), admin status reporting (`GET /api/admin/orders/shipping/status`), safe order cancellation handling (`cancelShiprocketOrder`), webhook timing-safe authentication (`crypto.timingSafeEqual`), replay deduplication (`processedShippingEvents`), COD auto-reconciliation, and UI integration in Dashboard and AdminOrders. 40/40 tests passing in `tests/shiprocket_shipping.test.ts`, 14/14 tests in `tests/shipping_tracking_integration.test.ts`, and 18/18 tests in `tests/webhook_shiprocket.test.ts`. Live courier dispatch is UNVERIFIED: pending credentials in Vercel. |
| **Gate 11** | Comprehensive Automated Integration & Regression Pass | **PASS (Branch feat/comprehensive-integration-pass)** | End-to-end integration pass across real application code covering all 9 operational & security domains: product catalog & cart totals, COD checkout, Razorpay, Resend email mocks, Shiprocket logistics mocks, genuine checkout stock decrement & cancellation restock, RBAC & auth recovery, input validation & concurrency boundaries, and storefront/admin regressions. 32/32 tests passing in `tests/comprehensive_integration.test.ts`. Uncommitted on branch. |
| **Gate 12** | Shiprocket Webhook Safety Hardening | **PASS (Branch feat/comprehensive-integration-pass)** | Route-level safety hardening for `/api/shipping/webhook/shiprocket`: (1) Cancelled order guard (late events never transition, mark paid, or alter inventory of cancelled orders), (2) Stable event identity (removed `Date.now()` fallback; deterministic IDs from provider header or stable shipment attributes), (3) Concurrent replay protection (atomic `$addToSet` + `findOneAndUpdate` guard), (4) Cryptographic timing-safe webhook token verification (`crypto.timingSafeEqual`), (5) Guarded COD delivery reconciliation, (6) Endpoint aliases (`/api/shipping/webhook`, `/api/shipping`). 18/18 tests passing in `tests/webhook_shiprocket.test.ts`. Uncommitted on branch. |

---

## 2. Test Execution Breakdown

### 2.1 Deterministic & Behavioral Suites (100% Passed)

| Test Suite | Category | Results | Execution Command |
| :--- | :--- | :---: | :--- |
| `webhook_shiprocket.test.ts` | Route-Level Webhook Safety, Auth & Concurrency | **18 / 18 PASS** | `npx tsx tests/webhook_shiprocket.test.ts` |
| `shipping_tracking_integration.test.ts` | Gate 10 Shipping & Tracking Integration | **14 / 14 PASS** | `npx tsx tests/shipping_tracking_integration.test.ts` |
| `shiprocket_shipping.test.ts` | Shiprocket Logistics, Package Safety & Webhooks | **40 / 40 PASS** | `npx tsx tests/shiprocket_shipping.test.ts` |
| `comprehensive_integration.test.ts` | 9-Domain Real App Integration & Regression Pass | **32 / 32 PASS** | `npx tsx tests/comprehensive_integration.test.ts` |
| `product_card_availability.test.ts` | Storefront UX Availability, Stock & Badges | **23 / 23 PASS** | `npx tsx tests/product_card_availability.test.ts` |
| `order_cancellation_restock.test.ts` | Order Restock, Concurrency & Ownership | **23 / 23 PASS** | `npx tsx tests/order_cancellation_restock.test.ts` |
| `full_system_e2e.test.ts` | Exhaustive Live System E2E (Port 3001) | **43 / 43 PASS** | `BASE_URL=http://127.0.0.1:3001 npx tsx tests/full_system_e2e.test.ts` |
| `e2e_live_server.test.ts` | Controlled Live Server E2E (Port 3001) | **18 / 18 PASS** | `BASE_URL=http://127.0.0.1:3001 npx tsx tests/e2e_live_server.test.ts` |
| `e2e_safety_guard.test.ts` | Safety & URI Isolation Guard | **36 / 36 PASS** | `npx tsx tests/e2e_safety_guard.test.ts` |
| `admin_permissions.test.ts` | Mocked / RBAC Matrix | **14 / 14 PASS** | `npx tsx tests/admin_permissions.test.ts` |
| `transactional_email.test.ts` | Mocked / Email Engine, Retries & Admin Smoke Router | **43 / 43 PASS** | `npx tsx tests/transactional_email.test.ts` |
| `razorpay_payment.test.ts` | Razorpay Gateway, Webhooks, Router & Edge Cases | **50 / 50 PASS** | `npx tsx tests/razorpay_payment.test.ts` |
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
| **Grand Total** | **All Live & Offline Suites (23 Suites)** | **419 / 419 PASS** | **100% Green (310 offline + 109 live test-server)** |

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

### 4.1 Deployment Status & Domain Configuration
- **Active Canonical Production Deployment:** [`dpl_4DGFYbBhPvvJHhHaAWxChXz9A95b`](https://malwa-namkeen-8imdhu89x-dakshs-projects-45d693b3.vercel.app) (Status: **● Ready**, aliased to `https://malwa-namkeen.vercel.app`). Live `/api/health` reports `status: "ok"`, `mongodb: "connected"`, `database: "malwa_namkeen"`.
- **Usable Preview / Staging Deployment:** [`dpl_9rykb8hDa9YAi4Jnasz8jXUU9x2e`](https://malwa-namkeen-btoliab4k-dakshs-projects-45d693b3.vercel.app) (Status: **● Ready**, aliased to `https://malwa-namkeen-git-feat-transact-b29aea-dakshs-projects-45d693b3.vercel.app`). Active on branch `feat/transactional-email-hardening` (`215a5d7`) with Preview-scoped `MONGODB_DB_NAME=malwa_namkeen_preview`.
- **Domain Status:** `malwanamkeen.com` is **NOT connected** to the Vercel project (`0 Domains found under dakshs-projects-45d693b3`).
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

### 4.4 Preview Database Isolation Verification (Gate GATED BY VERCEL SSO)

> [!NOTE]
> **PREVIEW DATABASE ISOLATION ESTABLISHED ON ATLAS — ACCESS GATED BY VERCEL SSO.**
> The store owner configured scoped Vercel environment variables:
> - Production `MONGODB_DB_NAME` = `malwa_namkeen` (scoped strictly to Production).
> - Preview `MONGODB_DB_NAME` = `malwa_namkeen_preview` (scoped strictly to Preview).
> - Preview `MONGODB_URI` = Configured with dedicated Atlas user `malwa_preview_runner` (scoped strictly to Preview).
> 
> In MongoDB Atlas, database `malwa_namkeen_preview` was physically created with all 11 collections. Production database `malwa_namkeen` remained completely unmutated (exactly 6 baseline orders). Production health check confirmed live on `database: malwa_namkeen`.
> 
> **Deployment Protection Notice:** Active Preview deployment `dpl_9rykb8hDa9YAi4Jnasz8jXUU9x2e` ([`https://malwa-namkeen-btoliab4k-dakshs-projects-45d693b3.vercel.app`](https://malwa-namkeen-btoliab4k-dakshs-projects-45d693b3.vercel.app)) is protected by Vercel Authentication (SSO), returning HTTP 302 redirects to `https://vercel.com/login` for all unauthenticated requests.
> 
> **QA Safety Stop Enforced:** Because runtime verification of `database: "malwa_namkeen_preview"` cannot be confirmed over the public wire without owner Vercel authentication or a Vercel Protection Bypass Token (`x-vercel-protection-bypass`), state-changing staging tests on the remote Preview URL are strictly **HALTED** per QA safety protocol to prevent unintended database mutations. Local test database `malwa_namkeen_test` remains 100% verified across 419/419 assertions in 23 test suites.

#### 1. Test Execution Status (Preview Deployment `dpl_9rykb8hDa9YAi4Jnasz8jXUU9x2e`)
- **BLOCKED (Automated Remote Staging QA):** Unauthenticated automated requests to Preview are redirected by Vercel SSO (HTTP 302). Requires owner to disable Vercel Authentication for Preview or provide a bypass token before remote state-changing tests can execute.
- **AUTHORIZED (Local Test Server):** Full customer and admin journeys are 100% verified against isolated database `malwa_namkeen_test`.
- **PROHIBITED:** Real payment gateway charges (live cards) and real physical courier dispatches remain prohibited. Only Test Mode (Razorpay `rzp_test_...` and Shiprocket staging/manual tracking) may be used.
- **RESTRICTED:** Production mutations remain 100% blocked.

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
   - **Active Working Branch:** `main` (clean working tree, tracking `daksh_repo/main`)
   - **Canonical main HEAD SHA:** `f7ead1e7d5b7a72759f36bc67e3fad6ef0b1eabb`
   - **Canonical Remote:** `daksh_repo/main` (`https://github.com/j08daksh-byte/malwa-namkeen-house.git` — Verified in sync)
   - **Upstream Remote:** `origin/main` (`https://github.com/Baljeet2611/Project0x00.git` — At `8e9d031`)
   - **Integrated Feature Branch:** `feat/comprehensive-integration-pass` (in sync at `f7ead1e7d5b7a72759f36bc67e3fad6ef0b1eabb`)
   - **Preserved Release Branch:** `release/malwa-production-ready` remains strictly preserved at `73f3fd12ca254a295d8f8c630aae8bd83c7a988b`.
   - **Vercel Production Deployment:** `dpl_4DGFYbBhPvvJHhHaAWxChXz9A95b` (`https://malwa-namkeen.vercel.app`, Status: **● Ready**).
   - **Vercel Preview Deployment:** `dpl_9rykb8hDa9YAi4Jnasz8jXUU9x2e` (`https://malwa-namkeen-btoliab4k-dakshs-projects-45d693b3.vercel.app`, Status: **● Ready**).
   - **Custom Domain:** `malwanamkeen.com` is unconnected in Vercel (`0 Domains found`).
3. **Operational Scope & Release Readiness Boundaries:**
   - **Genuine Checkout Order Cancellation & Stock/Coupon Rollback:** **VERIFIED EMPIRICALLY (PASS)**. Fully executed in `tests/comprehensive_integration.test.ts` Section 6: placed genuine checkout order with coupon `QA10PERCENT`, decremented variant stock by 1 in MongoDB, incremented coupon used count by 1 in MongoDB. Cancelled via `POST /api/customer/orders/:id/cancel`: variant stock restored back to starting baseline, coupon used count rolled back to starting baseline. Idempotent re-cancellation prevented double-restoration. Pre-seeded order `MN-QA-20261017-001` verified completely untouched in MongoDB with zero mutations.
   - **Interactive Cross-Browser QA (UNVERIFIED):** Mobile viewport meta tags, robots.txt, sitemap.xml, and responsive layout verified via automated integration tests; manual multi-device / Safari / iOS QA remains **UNVERIFIED**.
   - **Transactional Email — Final Acceptance Review (EMAIL CODE GATE CLOSED — LIVE DELIVERY STILL UNVERIFIED):** Verified with mocked client, non-blocking fault tolerance, authenticated admin smoke test route (`POST /api/admin/email/smoke-test` & `/api/admin/settings/email/smoke-test`), and status check (`GET /api/admin/email/status`) (43/43 tests across 11 suites in `tests/transactional_email.test.ts`, including error sanitization, bounded in-flight retries, and the End-to-End Email Workflow Integration Suite; 22/22 regression suites with 367/367 assertions). Real live delivery is **UNVERIFIED** until `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are configured in Vercel (Preview scope) and verified domain DNS records (SPF/DKIM/DMARC) are active in Resend. Delivery must remain marked UNVERIFIED until a real email is received in a test inbox. Because email failures fail closed and non-blockingly without rolling back orders or mutating state, the next workstream may safely proceed.
   - **Payment Processing — Razorpay Live Charges (UNVERIFIED IN PRODUCTION):** Fully verified with mocks (server-calculated amounts in paise, constant-time HMAC-SHA256 signature verification, webhook replay deduplication, 24/24 tests). Real live charges are **UNVERIFIED** until merchant credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) are provisioned in Vercel. COD checkout remains 100% operational.
   - **Logistics & Shipping — Shiprocket Live Courier (UNVERIFIED IN PRODUCTION):** Fully verified with mocks (packaging weight parsing from server metadata, duplicate prevention HTTP 409, AWB tracking, COD auto-reconciliation, 32/32 tests in `shiprocket_shipping.test.ts` + 16/16 tests in `webhook_shiprocket.test.ts`). Manual administrative tracking entry remains fully supported. Live dispatches are **UNVERIFIED** until `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, and `SHIPROCKET_WEBHOOK_TOKEN` are configured in Vercel.

---

## 8. Release Roadmap & Ordered Owner Next Actions

1. **Step 1: Domain Registration & DNS Connection:**
   - Register or configure DNS for `malwanamkeen.com`. Add custom domain to Vercel project `malwa-namkeen`. Configure root `A` record (`76.76.21.21`) and `CNAME` for `www` (`cname.vercel-dns.com`).
2. **Step 2: Resend Transactional Email Onboarding & Preview Smoke Test:**
   - **Step 2a (Account & API Key):** Sign in to [Resend Dashboard](https://resend.com) and create an API Key (`re_...`).
   - **Step 2b (Domain Verification):**
     - Add domain `malwanamkeen.com` under **Domains** in Resend.
     - Publish required DNS records at DNS registrar:
       - **DKIM:** TXT `resend._domainkey.malwanamkeen.com` (Value provided by Resend dashboard)
       - **SPF:** TXT `malwanamkeen.com` (`v=spf1 include:resend.com ~all`)
       - **DMARC:** TXT `_dmarc.malwanamkeen.com` (`v=DMARC1; p=none;`)
     - Click **Verify Domain** in Resend until status displays **Verified**.
     - *(Alternative immediate test sender without custom domain verification: `onboarding@resend.dev` to owner's registered Resend email address).*
   - **Step 2c (Vercel Environment Variables — PREVIEW ONLY):**
     - Navigate to Vercel Project Settings → Environment Variables.
     - Add `RESEND_API_KEY`: set to `re_...` — **Scope: Preview only** (Leave Production untouched).
     - Add `RESEND_FROM_EMAIL`: set to `Malwa Namkeen House <orders@malwanamkeen.com>` (or `onboarding@resend.dev` for test) — **Scope: Preview only**.
   - **Step 2d (Trigger Authenticated Delivery Smoke Test):**
     - Redeploy Preview deployment so environment variables take effect.
     - Authenticate as admin on Preview (`POST /api/auth/login`).
     - Send authenticated POST request to `/api/admin/email/smoke-test` (or `/api/admin/settings/email/smoke-test`) with body `{"targetEmail": "your-test-inbox@gmail.com"}` and header `Authorization: Bearer <admin_token>`.
     - Confirm receipt of live email `[Malwa Namkeen House] Live Resend Smoke Test` in the real inbox.
     - Only after real delivery is physically confirmed, mark Gate 3 live delivery VERIFIED.
3. **Step 3: Razorpay Test Mode Setup:**
   - Generate test key pair (`rzp_test_...`) in Razorpay Dashboard (**Settings → API Keys**).
   - Configure `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_SANDBOX=true` in Vercel Environment Variables.
   - Set up Webhook in Razorpay dashboard pointing to `https://malwa-namkeen.vercel.app/api/orders/webhook/razorpay` with secret `RAZORPAY_WEBHOOK_SECRET` for events `order.paid`, `payment.captured`, `payment.failed`.
4. **Step 4: Shiprocket Setup:**
   - Create API user in Shiprocket Dashboard (**Settings → API → Configure**).
   - Configure `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SHIPROCKET_WEBHOOK_TOKEN`, and `SHIPROCKET_PICKUP_LOCATION` in Vercel.
   - Register webhook URL `https://malwa-namkeen.vercel.app/api/shipping/webhook/shiprocket`.
5. **Step 5: Staging Manual Browser QA (DATABASE ISOLATION VERIFIED — GATE CLOSED):**
   - **Isolation Status:** Database isolation verified (`MONGODB_DB_NAME=malwa_namkeen_preview` active on Preview, `malwa_namkeen_preview` initialized on Atlas, production untouched). Staging order, cancellation, coupon, and inventory tests are **AUTHORIZED ON PREVIEW**.
   - Execute the 8-step staging acceptance runbook on active preview deployment [`dpl_9rykb8hDa9YAi4Jnasz8jXUU9x2e`](https://malwa-namkeen-btoliab4k-dakshs-projects-45d693b3.vercel.app) across desktop and mobile devices.
6. **Step 6: Final Release Approval & Live Mode Switch:**
   - Once staging QA is signed off, promote Razorpay keys to Live (`rzp_live_...`), conduct live smoke test, and point primary traffic to `https://malwanamkeen.com`.

---

## 9. Production Rollback Procedure & Known-Good Reference

In the event of an operational anomaly post-deployment, execute the following non-destructive rollback:

1. **Known-Good Production Reference:**
   - **Deployment ID:** `dpl_4DGFYbBhPvvJHhHaAWxChXz9A95b`
   - **Production URL:** `https://malwa-namkeen.vercel.app`
   - **Git Commit:** `f7ead1e7d5b7a72759f36bc67e3fad6ef0b1eabb` (tracking `daksh_repo/main`)
   - **Database State:** MongoDB Atlas `malwa_namkeen` (6 baseline orders preserved)

2. **Instant Vercel Instant-Rollback (Zero Downtime, <30 seconds):**
   - Navigate to [Vercel Dashboard](https://vercel.com) $\rightarrow$ Project **malwa-namkeen** $\rightarrow$ **Deployments**.
   - Locate known-good deployment `dpl_4DGFYbBhPvvJHhHaAWxChXz9A95b`.
   - Click the **•••** menu $\rightarrow$ **Promote to Production** (or **Instant Rollback**).
   - Traffic is instantly redirected back to the known-good serverless artifact without rebuilding or touching code.

3. **Git Branch Rollback:**
   ```bash
   git checkout daksh_repo/main
   # Or reset local tracking if needed:
   git checkout -B release/malwa-production-ready f7ead1e7d5b7a72759f36bc67e3fad6ef0b1eabb
   ```

4. **Database Rollback:**
   - Zero destructive migrations or irreversible schema changes were executed.
   - All Mongoose schema additions (`paymentDetails`, `shiprocketDetails`, `processedShippingEvents`) are non-breaking and backward-compatible with 1.3.0.
   - Production database `malwa_namkeen` requires zero data rollback.


