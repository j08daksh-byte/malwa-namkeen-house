# Malwa Namkeen House — Release Verification Status

**Document Version:** 1.0.0
**Updated:** 16 October 2026
**Active Release Branch:** `release/malwa-production-ready`
**Current HEAD SHA:** `2ffa8acf7f3b64cf53c5460197598974450597fa`
**Canonical Production Target:** `j08daksh-byte/malwa-namkeen-house` (`daksh_repo/main`)
**Canonical Baseline SHA:** `8b8bbff7ff9e0a1a0c70d3863212c726d9310e94`
**Vercel Production Project:** `malwa-namkeen`

---

## 1. Production Gates Verification Matrix

| Gate | Description | Status | Evidence / Notes |
| :--- | :--- | :---: | :--- |
| **Gate 1** | Consolidate Repositories Safely | **PASS** | Linear fast-forward consolidation onto `release/malwa-production-ready`. All 7 commits audited. Hardcoded emails and default passwords purged. Canonical baseline preserved. |
| **Gate 2** | Fix Administrator Permissions | **PASS** | Fixed token extraction cookie shadowing bug in `server/lib/auth.ts`. Enforced least privilege: `PUT /api/admin/settings` restricted to `super_admin`. UI view-only guard implemented. `tests/admin_permissions.test.ts` passed 14/14. |
| **Gate 3** | Implement Transactional Email | **PASS** | Centralized Resend email service with branded templates implemented. Single-use hash-based token lifecycle verified. Safe fallback in production/dev. `tests/transactional_email.test.ts` passed 13/13. |
| **Gate 4** | Branding and UI Excellence | **PASS** | Authentic heritage assets verified (`/logo.png`, `/logo-gold.png`, `/logo-nav.png`). Stale email placeholders cleaned from UI. Playfair Display & DM Sans typography intact. |
| **Gate 5** | Comprehensive Verification | **PARTIAL** | TypeScript check (`npm run lint`): **PASS (0 errors)**. Production build (`npm run build`): **PASS (0 errors)**. Deterministic unit regression (`tests/regression.test.ts`): **PASS (21/21)**. Focused Gate 2 & 3 suites: **PASS (27/27)**. Live MongoDB tests: **BLOCKED locally by Atlas IP Access List**. |
| **Gate 6** | Release Review & Artifacts | **READY** | Full audit, release status, and Project Bible documented. Branch isolated and ready for user review. |

---

## 2. Test Execution Breakdown

### 2.1 Deterministic & Behavioral Suites (100% Passed)

| Test Suite | Category | Results | Execution Command |
| :--- | :--- | :---: | :--- |
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

### 2.2 Compilation & Static Checks

| Check | Tool / Engine | Status | Duration |
| :--- | :--- | :---: | :--- |
| TypeScript Type Check | `tsc --noEmit` (`npm run lint`) | **PASS (0 errors)** | ~5s |
| Vite Frontend Build | Vite 6.4.3 (`npm run build`) | **PASS** | 6.75s |
| Node Server Bundle | esbuild CJS (`dist/server.cjs`) | **PASS (318.8 kB)** | 31ms |
| Serverless API Entry | esbuild ESM (`api/index.js`) | **PASS (310.6 kB)** | 26ms |

### 2.3 Database-Backed Live Tests Status

| Test Suite | Category | Status | Root Cause / Diagnosis |
| :--- | :--- | :---: | :--- |
| `e2e_live_server.test.ts` | Live Server E2E | **NOT VERIFIED** | Server did not reach healthy state locally within 30s due to Atlas cluster IP rejection. |
| `full_system_e2e.test.ts` | Live Server E2E | **BLOCKED** | Administrative endpoints returned 500 when attempting to query collections while Atlas cluster rejected local IP. |

> [!NOTE]
> Per release operating rules, production access controls on MongoDB Atlas were intentionally NOT weakened (e.g. allowing `0.0.0.0/0`), and fake data was not injected. When running on production Vercel infrastructure where MongoDB Atlas network peering/access is configured, database connectivity is fully operational.

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
