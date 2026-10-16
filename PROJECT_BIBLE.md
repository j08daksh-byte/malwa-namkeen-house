# Malwa Namkeen House — Technical Project Bible

**System Name:** Malwa Namkeen House D2C E-Commerce & Administrative Platform
**Established:** 1954 (Ujjain / Bengaluru Heritage Savouries & Sweets)
**Version:** 1.0.0 Production Architecture
**Canonical Repository:** `j08daksh-byte/malwa-namkeen-house`
**Production Host:** Vercel (`malwa-namkeen`)
**Database Host:** MongoDB Atlas

---

## 1. System Architecture Overview

Malwa Namkeen House uses a hybrid single-page application (SPA) and serverless backend architecture designed for zero cold-start friction, high SEO visibility, and strict least-privilege security.

```
┌────────────────────────────────────────────────────────┐
│             Storefront SPA (React 19 / Vite)           │
│         Tailwind CSS v4 · DM Sans · Playfair Display   │
└──────────────────────────┬─────────────────────────────┘
                           │
             HTTPS / REST JSON APIs
                           │
┌──────────────────────────▼─────────────────────────────┐
│                 Express API Layer                      │
│   Local: server.ts (3000)  │  Vercel: api/index.js     │
└──────────┬───────────────┬────────────────┬────────────┘
           │               │                │
┌──────────▼─────┐  ┌──────▼──────┐  ┌──────▼────────────┐
│ MongoDB Atlas  │  │ Cloudinary  │  │   Resend SDK      │
│  Mongoose v9   │  │ Media CDN   │  │ Transactional Mail│
└────────────────┘  └─────────────┘  └───────────────────┘
```

### Technology Stack
- **Frontend:** React 19, Vite 6, React Router 7, Tailwind CSS 4, Lucide React icons.
- **Backend (Express):** Express 4.21, Helmet, Express Rate Limit, Cookie Parser, Multer (memory buffer).
- **Serverless Parity:** `server/api-entry.ts` compiled via `esbuild` to self-contained ESM bundle `api/index.js` for Vercel Serverless Functions.
- **Database:** MongoDB Atlas via Mongoose 9 with connection caching and disconnected fallback handling.
- **Media CDN:** Cloudinary (v2), strictly scoped under the `malwa-namkeen-house/` asset hierarchy (`products`, `categories`, `banners`, `logo`).
- **Transactional Email:** Resend Node.js SDK, server-side only with mobile-responsive branded HTML templates and audit logging.

---

## 2. Authentication & Security Architecture

### 2.1 Token Lifecycle & Cookie-Shadowing Elimination
The application supports both secure HTTP-only cookies (`malwa_auth_token`) for browser customer sessions and explicit `Authorization: Bearer <token>` headers for administrative tooling and decoupled clients.

To prevent **cookie-shadowing** (where an admin browsing the storefront as a customer has their admin token overridden by their customer cookie), the token extractor enforces strict priority:

```ts
export function extractToken(req: Request): string | null {
  // 1. Explicit Bearer header ALWAYS takes precedence
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  // 2. Ambient HTTP-only cookie fallback for storefront customers
  if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
    return req.cookies[AUTH_COOKIE_NAME];
  }
  return null;
}
```

### 2.2 Role-Based Access Control (RBAC) Matrix

| User Role | Storefront & Orders | Product/Banner CRUD | Order Management | Staff Invitation | Store Settings Mutation |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **customer** | Full access to shop, cart, checkout, profile, addresses, order history | Denied (403) | Denied (403) | Denied (403) | Denied (403) |
| **admin** | Full customer access | **Allowed** | **Allowed** | Denied (403) | **Denied (403)** (View-Only) |
| **super_admin** | Full customer access | **Allowed** | **Allowed** | **Allowed** | **Allowed** |

### 2.3 Live Database RBAC Validation
When MongoDB is connected, `requireAdmin` and `requireSuperAdmin` verify the user's active status (`user.active === true`) and role in real time. If an account is deactivated or demoted in the database, subsequent requests fail immediately with `403 Forbidden`, regardless of token expiry.

### 2.4 Cryptographic Single-Use Tokens
- **Password Reset:** 32-byte cryptographically secure random tokens (`crypto.randomBytes(32).toString('hex')`). Only the SHA-256 hash is persisted in `user.passwordResetTokenHash` with a 1-hour expiration. Consuming the token resets the password and nullifies the hash immediately.
- **Admin Invitation:** 32-byte cryptographically secure tokens stored as SHA-256 hashes with 48-hour expiration. Enforces 8+ character password setup and email verification.

---

## 3. Transactional Email System (Resend)

All transactional emails use responsive, branded HTML layouts reflecting the 1954 heritage of Malwa Namkeen House.

### Supported Events
1. **Admin Invitation:** `sendAdminInvitation` — dispatches invite link with secure single-use token (zero plaintext passwords).
2. **Customer Password Reset:** `sendCustomerPasswordReset` — dispatches reset link with 1-hour token.
3. **Password Changed Alert:** `sendPasswordChangedConfirmation` — security notification upon credentials update.
4. **Role Updated Notice:** `sendRoleChangedNotification` — notifies user of promotions or role alterations.
5. **Customer Order Confirmation:** `sendCustomerOrderConfirmation` — sends itemized bill, delivery address, and tracking link.
6. **Order Status Update:** `sendOrderStatusUpdate` — updates customer upon order transitions (confirmed, baking, dispatched, delivered, cancelled).
7. **Store Owner New-Order Alert:** `sendNewOrderAdminAlert` — alerts configured `ADMIN_NOTIFICATION_EMAIL` of incoming sales.
8. **Customer Inquiry Acknowledgement:** `sendInquiryAcknowledgement` — confirms receipt with reference ID.
9. **Admin Inquiry Alert:** `sendNewInquiryAdminAlert` — notifies store staff of bulk/gifting enquiries.
10. **Email Smoke Test:** `runEmailSmokeTest` — safe diagnostic tool for explicit verification of Resend credentials.

### Fault Tolerance & Non-Blocking Design
- Email dispatch is completely non-blocking (`.catch(...)` handling). An email provider timeout or delivery failure will **never** roll back or abort a committed customer order.
- In production without an API key, messages are dropped safely with a log warning. In development, messages are intercepted and rendered to the console with zero live external requests.

---

## 4. Database Schema Reference (MongoDB / Mongoose)

- **`User`:** `name`, `email` (unique, lowercase), `password` (bcrypt), `role` (`customer` | `admin` | `super_admin`), `active`, `phone`, `addresses[]`, `wishlist[]`, `passwordResetTokenHash`, `passwordResetExpiresAt`, `invitationTokenHash`, `invitationExpiresAt`.
- **`Product`:** `name`, `slug` (unique), `hindiName`, `description`, `category` (ref: Category), `variants[]` (`label`, `weight`, `price`, `salePrice`, `stock`, `sku`), `images[]`, `ingredients[]`, `oilUsed`, `shelfLife`, `isBestSeller`, `active`.
- **`Category`:** `name`, `slug` (unique), `description`, `image`, `sortOrder`, `active`.
- **`Order`:** `orderNumber` (unique), `customer` (ref: User), `customerInfo`, `shippingAddress`, `items[]`, `subtotal`, `discount`, `shipping`, `total`, `paymentMethod`, `paymentStatus`, `orderStatus`, `idempotencyKey`, `trackingInfo`.
- **`StoreSettings`:** Singleton document storing public metadata, support contacts, GSTIN, FSSAI license numbers, free delivery threshold, and hero banner configurations.
- **`EmailLog`:** Structured audit log recording every email delivery attempt (`eventType`, `recipient`, `subject`, `provider`, `status`, `attemptedAt`).

---

## 5. Operations & Runbook

### 5.1 Bootstrapping the Initial Super Admin
To initialize a newly deployed instance without existing admin accounts:
1. Set `ADMIN_EMAIL=your_email@example.com` in environment variables.
2. Sign up on the storefront with `your_email@example.com`. The system automatically promotes matching accounts to `super_admin`.
3. Alternatively, when bootstrapping headless on a blank database, set `ADMIN_PASSWORD=your_initial_password` in environment variables to auto-seed the initial owner on server startup.

### 5.2 Secret Rotation Runbook
If `JWT_SECRET` must be rotated:
1. Generate a new cryptographically random 32+ character string.
2. Update `JWT_SECRET` in Vercel Environment Variables.
3. Trigger a production redeployment. All active JWT sessions will be invalidated, requiring users to log in again.

### 5.3 Strict Test-Database Connection Isolation Architecture

#### 1. Multi-Perimeter Architecture
To eliminate all risk of mutating or polluting production data during test execution, the platform implements a four-tier defensive gate:
1. **Perimeter 1 (`server/lib/dbGuard.ts`):** In test mode (`NODE_ENV=test` or `IS_E2E_TEST=true`), strictly requires a separate `MONGODB_TEST_URI`. Strictly prohibits all fallback to `MONGODB_URI` and rejects identical URIs (`MONGODB_TEST_URI === MONGODB_URI`). Requires `MONGODB_TEST_DB_NAME=malwa_namkeen_test`. Extracts the embedded database name from `MONGODB_TEST_URI` and validates that it matches `MONGODB_TEST_DB_NAME`. Rejects production database names (`malwa_namkeen`), system databases (`admin`, `local`, `config`, `prod`), and mismatches. Never logs or leaks the connection URI or credentials in errors. In non-test mode, preserves production connection behavior without changing production credentials or settings.
2. **Perimeter 2 (`server/lib/mongodb.ts` & `server.ts`):** In test mode, `connectMongoDB()` resolves connection parameters via `getEffectiveMongoConfig()`. Upon establishing a connection, validates the actual connected database (`mongoose.connection.name === expectedDbName`). If mismatched, safely disconnects immediately and throws before any route handling. Exposes `database: mongoose.connection.name` via `/api/health`. In test mode, server process exits fast with code 1 upon DB connection failure.
3. **Perimeter 3 (`tests/test_db_guard.ts`):** Test suites invoke `assertSafeTestDatabaseEnvironment()` and `verifyLiveServerDatabaseIsolation(BASE_URL)` in a top-level `before()` hook. If the live server is unconfigured or connected to `malwa_namkeen`, the suite aborts in <2ms before any network request or database write occurs.
4. **Perimeter 4 (`tests/run_all.mjs`):** The test orchestrator verifies both `MONGODB_TEST_URI` and `MONGODB_TEST_DB_NAME`. If either is missing, live E2E tests are safely skipped under a hard lock, allowing all 14 deterministic offline unit/mocked suites to pass cleanly.

#### 2. Scoped Lifecycle Teardown (`TestRecordTracker`)
- Each E2E run generates a unique run identifier (`runId`).
- Test records (customers, inquiries, orders, products, and admin fixtures) use run-unique tagged identifiers (e.g. `__test_user_<runId>@malwa-isolated.test`, `__test_admin_<runId>@malwa-isolated.test`).
- In the suite `after()` hook, `tracker.performScopedCleanup()` connects strictly via `MONGODB_TEST_URI` (never falling back to `MONGODB_URI`) and deletes only documents matching the tracked IDs and run-tagged emails for that run.
- Pre-existing accounts and production records are completely protected and never deleted.
- If teardown fails or is interrupted, `reportUncleanedIdentifiers()` prints the affected identifiers with masked emails, completely sanitized of passwords or private credentials.

#### 3. Test Execution Runbook & Verified Results
```bash
# 1. Run all offline unit/mocked suites (safe default; live E2E suites safely skipped under hard lock)
node tests/run_all.mjs

# 2. Run focused automated safety gate suite (36 defensive isolation tests — 100% PASS)
npx tsx tests/e2e_safety_guard.test.ts

# 3. Run individual isolated unit suites (100% PASS)
npx tsx tests/admin_permissions.test.ts       # 14 / 14 PASS
npx tsx tests/transactional_email.test.ts     # 13 / 13 PASS
npx tsx tests/regression.test.ts              # 21 / 21 PASS

# 4. Run Live E2E tests against an authorized test database (malwa_namkeen_test)
# Terminal 1: Launch test server on port 3001
# PORT=3001 IS_E2E_TEST=true npx tsx server.ts
# Terminal 2: Run live suites
# BASE_URL=http://127.0.0.1:3001 npx tsx tests/e2e_live_server.test.ts    # 18 / 18 PASS (3 records cleaned)
# BASE_URL=http://127.0.0.1:3001 npx tsx tests/full_system_e2e.test.ts   # 43 / 43 PASS (4 records cleaned)
# Grand Total: 145 / 145 Tests Passing Across All Suites
```

#### 4. Dedicated Test Database Setup in MongoDB Atlas
1. Log in to [cloud.mongodb.com](https://cloud.mongodb.com).
2. Go to **Security** → **Database Access** → **Add New Database User**.
3. Create user `malwa_e2e_test_runner` with a strong password.
4. Under **Database User Privileges**, select **Built-in Role** → **Specific Privileges**:
   - Assign `readWrite` on database: `malwa_namkeen_test`.
   - Explicitly do NOT grant access to `malwa_namkeen`.
5. Under **Network Access**, verify current test runner/CI IP is active.
6. Configure `MONGODB_TEST_URI` and `MONGODB_TEST_DB_NAME=malwa_namkeen_test` in local `.env.local`.

### 5.4 Atlas Network Access Policy (0.0.0.0/0 Precaution)
- An entry for `0.0.0.0/0` in MongoDB Atlas Network Access is commonly present to accommodate dynamic IP allocation in Vercel serverless functions.
- **Pre-removal Requirements:** Before deleting `0.0.0.0/0` from Atlas Network Access, verify whether Vercel is configured with Dedicated Static Outbound IPs or VPC Peering. Removing `0.0.0.0/0` without static peering will immediately sever Vercel production serverless API connections to MongoDB Atlas.

### 5.5 Operational Scope & Release Readiness Boundaries
1. **Transactional Email (Resend):** Verified in code and simulated tests, but unverified live. Vercel environment audit confirmed `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are not yet populated. Domain DNS (SPF/DKIM/DMARC) must be verified in Resend before enabling real delivery.
2. **Payment Processing:** Operates strictly on Cash on Delivery (COD) / Direct Order placement (`orderStatus: 'pending'`, `paymentStatus: 'pending'`). No third-party online payment gateways (Razorpay, Stripe, PhonePe) are integrated.
3. **Logistics & Shipping:** Administrative tracking entry is manual (`courierName`, `trackingNumber`, `trackingUrl`). No third-party carrier API (Shiprocket, Delhivery) is integrated.
4. **Serverless Concurrency:** In-memory rate limiting and idempotency caching (`MemoryStore`) protect within a single warm lambda instance; distributed rate limiting across concurrent cold lambdas requires an external Redis cache (e.g. Upstash) in future milestones.
5. **Production Deployment:** Commit `9fd812d` deployed to Vercel production [`dpl_DayLHyctUicwMKCshgVRtsVLXFET`](https://malwa-namkeen.vercel.app). Verified live with public health check (`/api/health`) returning HTTP 200 OK (`mongodb: connected`, `database: malwa_namkeen`).
