# Malwa Namkeen House — Dual-Repository Consolidation & Security Audit

**Document Version:** 1.0.0
**Audit Date:** 16 October 2026
**Canonical Repository:** `j08daksh-byte/malwa-namkeen-house`
**Secondary Collaborative Repository:** `Baljeet2611/Project0x00`
**Canonical Baseline SHA:** `8b8bbff7ff9e0a1a0c70d3863212c726d9310e94`
**Secondary Main SHA:** `2ffa8acf7f3b64cf53c5460197598974450597fa`
**Release Candidate Branch:** `release/malwa-production-ready`

---

## 1. Executive Summary

This audit establishes the definitive baseline and consolidation strategy for uniting the two Git repositories of **Malwa Namkeen House (EST. 1954)**.
- **Canonical Repository:** Connected to production Vercel (`malwa-namkeen`), maintaining production stability.
- **Secondary Repository:** Maintained collaboratively by the development team, containing 7 feature commits (+2,057 lines / -241 lines) ahead of canonical baseline.
- **Topology Analysis:** The secondary remote (`origin/main`) represents a direct linear descendant (fast-forward) of canonical `daksh_repo/main` with zero diverging or conflicting ancestor commits.

All valuable work from both repositories has been integrated on the dedicated, isolated release branch `release/malwa-production-ready` without force-pushing, rewriting history, or modifying canonical `main`.

---

## 2. Commit Audit (7 Commits: `8b8bbff` → `2ffa8ac`)

| Commit SHA | Author | Summary | Security & Architectural Audit |
| :--- | :--- | :--- | :--- |
| `3c59a0e` | Baljeet Singh | Rate-limiting & cart revalidation optimization | **Beneficial.** Added rate limits on coupon verification and order submission; reduced client overhead. |
| `ab42ef4` | Baljeet Singh | Inquiry compound index & honeypot hardening | **Beneficial.** Mitigated automated spam submissions on public enquiry form with zero UX friction. |
| `fe26815` | Baljeet Singh | Admin staff management & invitation routes | **Security Concern Resolved.** Added staff invitation tokens; initial implementation relied on hardcoded fallback passwords and personal email string matching. Resolved in release branch. |
| `9dc31ec` | Baljeet Singh | Resend email templates & order confirmation | **Beneficial.** Implemented branded mobile-responsive templates for orders, password resets, and invitations. |
| `280145a` | Baljeet Singh | Hero banners & storefront branding updates | **Beneficial.** Integrated authentic heritage visual assets, gold logos, and DM Sans typography. |
| `75e13dc` | Baljeet Singh | Outdated inquiry test index correction | **Beneficial.** Removed redundant index expectation in `tests/ph010_inquiry_compound_index.test.ts` aligned with schema. |
| `2ffa8ac` | Baljeet Singh | Customer session sync & logout cleanup | **Beneficial.** Added cross-tab synchronization and clean cookie revocation on customer sign-out. |

---

## 3. Vulnerability Remediation & Hardening in Release Branch

During the consolidation audit, three major security and permission defects were identified and resolved on `release/malwa-production-ready`:

### 3.1 Hardcoded Personal Admin Credentials Purged
- **Original Vulnerability:** Secondary commits hardcoded `baljeetrajawat210@gmail.com` and fallback password `MalwaAdmin@2026` into `server/lib/mongodb.ts`, `server/routes/auth.ts`, and `src-rebuild/pages/admin/AdminLogin.tsx`.
- **Remediation:** Removed all hardcoded personal emails and static passwords. Implemented `getDesignatedAdminEmails()` dynamically loading from `ADMIN_EMAIL` / `ADMIN_EMAILS` environment variables. Documented `ADMIN_PASSWORD` in `.env.example` strictly for headless initial bootstrapping.

### 3.2 Authorization Token Cookie Shadowing Bug
- **Original Vulnerability:** `extractToken(req)` in `server/lib/auth.ts` inspected `req.cookies[AUTH_COOKIE_NAME]` before `req.headers.authorization`. If an administrator had previously browsed the storefront as a customer, their ambient customer cookie overrode and silenced the admin Bearer token, causing administrative operations (such as product creation and media uploads) to fail with `403 Forbidden`.
- **Remediation:** Prioritized `Authorization: Bearer <token>` over cookies. Ambient storefront customer cookies can no longer shadow explicit administrative tokens.

### 3.3 Least-Privilege Role Boundary Enforcement
- **Original Vulnerability:** `PUT /api/admin/settings` allowed any standard `admin` to mutate store-wide settings, GSTIN, FSSAI licenses, and delivery fees.
- **Remediation:** Restricted `PUT /api/admin/settings` strictly to `requireSuperAdmin`. Updated frontend `AdminSettings.tsx` to detect role via `/api/auth/admin/verify`, rendering view-only mode for non-super-admins.

---

## 4. Modified Files Audit on `release/malwa-production-ready`

| File | Change Category | Description |
| :--- | :--- | :--- |
| `.env.example` | Configuration | Documented `ADMIN_EMAIL`, `ADMIN_EMAILS`, and `ADMIN_PASSWORD`. |
| `server/lib/mongodb.ts` | Security / Database | Added `getDesignatedAdminEmails()`; removed hardcoded credentials. |
| `server/routes/auth.ts` | Security / RBAC | Designated owner assignment via environment config during registration & OAuth. |
| `server/lib/auth.ts` | Security / Middleware | Prioritized Bearer token in `extractToken`; added live DB active & role checks. |
| `server/routes/adminSettings.ts` | Security / Least Privilege | Protected `PUT /api/admin/settings` with `requireSuperAdmin`. |
| `src-rebuild/pages/admin/AdminSettings.tsx` | UI / Permissions | Added read-only state for standard admins; disables mutation controls. |
| `src-rebuild/pages/admin/AdminLogin.tsx` | UI / Branding | Cleaned placeholder email to generic `admin@malwanamkeen.com`. |
| `server/routes/authRecovery.ts` | Security / Notifications | Dispatches `sendPasswordChangedConfirmation` non-blockingly upon password reset. |
| `server/lib/emailService.ts` | Notifications | Added safe live-email smoke test helper `runEmailSmokeTest`. |
| `server/models/EmailLog.ts` | Logging / Types | Added `'admin_security_alert'` event type and schema enum. |
| `tests/admin_permissions.test.ts` | Quality Assurance | 14 test cases covering token precedence, 401s, 403s, and role boundaries. |
| `tests/transactional_email.test.ts` | Quality Assurance | 13 test cases covering template rendering, error safety, and fallback. |
| `tests/full_system_e2e.test.ts` | Quality Assurance | Synchronized `.env.local` secret key loading for test runner. |
| `tests/run_all.mjs` | Quality Assurance | Synchronized `.env.local` environment inheritance for test execution. |
| `api/index.js` | Serverless Artifact | Re-compiled Vercel serverless function; verified zero hardcoded credentials. |

---

## 5. Consolidation Sign-off Status
- **Canonical baseline SHA preserved:** `8b8bbff7ff9e0a1a0c70d3863212c726d9310e94`
- **Linear history preserved:** Fast-forward consolidation on `release/malwa-production-ready`.
- **Zero secrets tracked in Git:** Verified (`.env.local` ignored by Git; diff free of credentials).
- **Production Build:** `npm run build` succeeded (`dist/` + `api/index.js`).
