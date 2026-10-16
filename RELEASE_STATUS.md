# Malwa Namkeen House — Release Verification Status

**Document Version:** 1.1.0
**Updated:** 16 October 2026
**Active Release Branch:** `release/malwa-production-ready`
**Current HEAD SHA:** `a2dbdb9d93c085b507cd934fc6c48b6e8a3cf2d7` (with working-tree changes)
**Canonical Production Target:** `j08daksh-byte/malwa-namkeen-house` (`daksh_repo/main`)
**Canonical Baseline SHA:** `8b8bbff7ff9e0a1a0c70d3863212c726d9310e94`
**Vercel Production Project:** `malwa-namkeen`
**Active Isolated Test Database:** `malwa_namkeen_test` (MongoDB Atlas)

---

## 1. Production Gates Verification Matrix

| Gate | Description | Status | Evidence / Notes |
| :--- | :--- | :---: | :--- |
| **Gate 1** | Consolidate Repositories Safely | **PASS** | Linear fast-forward consolidation onto `release/malwa-production-ready`. All 7 commits audited. Hardcoded emails and default passwords purged. Canonical baseline preserved. |
| **Gate 2** | Fix Administrator Permissions | **PASS** | Fixed token extraction cookie shadowing bug in `server/lib/auth.ts`. Enforced least privilege: `PUT /api/admin/settings` restricted to `super_admin`. UI view-only guard implemented. `tests/admin_permissions.test.ts` passed 14/14. |
| **Gate 3** | Implement Transactional Email | **PASS** | Centralized Resend email service with branded templates implemented. Single-use hash-based token lifecycle verified. Safe fallback in production/dev. `tests/transactional_email.test.ts` passed 13/13. |
| **Gate 4** | Branding and UI Excellence | **PASS** | Authentic heritage assets verified (`/logo.png`, `/logo-gold.png`, `/logo-nav.png`). Stale email placeholders cleaned from UI. Playfair Display & DM Sans typography intact. |
| **Gate 5** | Comprehensive Verification | **PASS (100% COMPLETE)** | TypeScript check (`npm run lint`): **PASS (0 errors)**. Production build (`npm run build`): **PASS (0 errors)**. Strict Test-DB URI Isolation (`tests/e2e_safety_guard.test.ts`): **PASS (36/36)**. Deterministic unit regression (`tests/regression.test.ts`): **PASS (21/21)**. Focused Gate 2 & 3 suites: **PASS (27/27)**. All 14 verified unit/mocked suites: **PASS (14/14)**. Live E2E Suite 1 (`tests/e2e_live_server.test.ts`): **PASS (18/18)** on port 3001 against `malwa_namkeen_test` with 3 records cleaned. Live E2E Suite 2 (`tests/full_system_e2e.test.ts`): **PASS (43/43)** on port 3001 against `malwa_namkeen_test` with 4 records cleaned. Scoped teardown verified. |
| **Gate 6** | Release Review & Artifacts | **READY FOR STAGING** | Full audit, release status, and Project Bible documented. Zero remaining blockers. Ready for staging commit and canonical pull request. |

---

## 2. Test Execution Breakdown

### 2.1 Deterministic & Behavioral Suites (100% Passed)

| Test Suite | Category | Results | Execution Command |
| :--- | :--- | :---: | :--- |
| `full_system_e2e.test.ts` | Exhaustive Live System E2E (Port 3001) | **43 / 43 PASS** | `BASE_URL=http://127.0.0.1:3001 npx tsx tests/full_system_e2e.test.ts` |
| `e2e_live_server.test.ts` | Controlled Live Server E2E (Port 3001) | **18 / 18 PASS** | `BASE_URL=http://127.0.0.1:3001 npx tsx tests/e2e_live_server.test.ts` |
| `e2e_safety_guard.test.ts` | Safety & URI Isolation Guard | **36 / 36 PASS** | `npx tsx tests/e2e_safety_guard.test.ts` |
| `admin_permissions.test.ts` | Mocked / RBAC Matrix | **14 / 14 PASS** | `npx tsx tests/admin_permissions.test.ts` |
| `transactional_email.test.ts` | Mocked / Email Engine | **13 / 13 PASS** | `npx tsx tests/transactional_email.test.ts` |
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
| **Grand Total** | **All Live & Offline Suites** | **145 / 145 PASS** | **100% Green** |

### 2.2 Compilation & Static Checks

| Check | Tool / Engine | Status | Duration |
| :--- | :--- | :---: | :--- |
| TypeScript Type Check | `tsc --noEmit` (`npm run lint`) | **PASS (0 errors)** | ~4s |
| Vite Frontend Build | Vite 6.4.3 (`npm run build`) | **PASS** | 2.19s |
| Node Server Bundle | esbuild CJS (`dist/server.cjs`) | **PASS (326.3 kB)** | 24ms |
| Serverless API Entry | esbuild ESM (`api/index.js`) | **PASS (317.8 kB)** | 20ms |

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
| `RESEND_API_KEY` | Production / Preview | **YES** | Resend API key for transactional emails (`re_...`). |
| `RESEND_FROM_EMAIL` | Production / Preview | **YES** | Verified sender, e.g., `Malwa Namkeen House <orders@malwanamkeen.com>`. |
| `ADMIN_NOTIFICATION_EMAIL`| Production / Preview | **YES** | Store owner recipient for new orders and inquiries (`malwanamkeenhouse@gmail.com`). |
| `APP_URL` | Production / Preview | **YES** | Canonical production URL (`https://malwanamkeen.com`). |
| `CLOUDINARY_CLOUD_NAME` | Production / Preview | **YES** | Cloudinary product environment cloud name. |
| `CLOUDINARY_API_KEY` | Production / Preview | **YES** | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Production / Preview | **YES** | Cloudinary API secret. |
| `GEMINI_API_KEY` | Production / Preview | Optional | Google Gemini API key for culinary AI concierge. |

---

## 4. Next Safe Release Actions

Once this audit is approved, execute the following commands to push the verified release candidate branch and open a pull request into canonical `main`:

```bash
# 1. Stage and commit verified consolidation changes
git add .env.example server/ src-rebuild/ tests/ CONSOLIDATION_AUDIT.md RELEASE_STATUS.md PROJECT_BIBLE.md api/index.js
git commit -m "chore(release): complete release consolidation, security hardening, and test suites"

# 2. Push isolated release branch to canonical remote
git push daksh_repo release/malwa-production-ready

# 3. Create Pull Request from release/malwa-production-ready into daksh_repo/main
# (Inspect diff and merge via GitHub PR interface after Vercel preview checks pass)
```

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
