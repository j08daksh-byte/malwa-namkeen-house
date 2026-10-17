# Malwa Namkeen House — Technical Project Bible

**System Name:** Malwa Namkeen House D2C E-Commerce & Administrative Platform
**Established:** 1954 (Ujjain / Bengaluru Heritage Savouries & Sweets)
**Version:** 1.8.0 (Canonical Main: `f7ead1e7d5b7a72759f36bc67e3fad6ef0b1eabb`, tracking `daksh_repo/main`)
**Active Hardening Branch (RC):** `feat/transactional-email-hardening` (HEAD: `675501aa88f0f52d74c57811ccb5ae82067b20e9`)
**Canonical Repository:** `j08daksh-byte/malwa-namkeen-house` (`daksh_repo/main`)
**Production Host:** Vercel (`malwa-namkeen`)
**Production Deployment:** `dpl_4DGFYbBhPvvJHhHaAWxChXz9A95b` (`https://malwa-namkeen.vercel.app`)
**Usable Staging Preview:** `dpl_CSqLiWRSvoCQnYHU7QM11a586pFg` (`https://malwa-namkeen-kl3nonlb3-dakshs-projects-45d693b3.vercel.app`, aliased to `https://malwa-namkeen-git-feat-transact-b29aea-dakshs-projects-45d693b3.vercel.app`)
**Database Host:** MongoDB Atlas (Production: `malwa_namkeen`, Preview: `malwa_namkeen_preview`, Test: `malwa_namkeen_test`)

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

## 4. Order Lifecycle, Cancellation & Inventory Restoration

### 4.1 Order Cancellation & Inventory Restock Architecture
When an order transitions to `cancelled` (via administrator update or customer self-service):
1. **Concurrency Control & Idempotency without Replica Sets:**
   Because MongoDB multi-document transactions require replica set topologies and are not universally available across serverless and standalone MongoDB instances, atomic document locking is enforced at the document level:
   ```ts
   const order = await Order.findOneAndUpdate(
     {
       _id: orderId,
       inventoryRestored: { $ne: true },
       ...(allowedCurrentStatuses.length > 0 ? { orderStatus: { $in: allowedCurrentStatuses } } : {}),
     },
     {
       $set: {
         orderStatus: 'cancelled',
         inventoryRestored: true,
         cancelledAt: new Date(),
         cancelledBy,
         cancellationReason: reason,
       },
     },
     { new: false }
   );
   ```
   MongoDB's atomic single-document update guarantees that under concurrent cancellation requests, exactly **one** caller succeeds in claiming the restoration lock. All concurrent or repeated requests find `inventoryRestored === true` (or an excluded status) and receive `null`, immediately returning `{ alreadyCancelled: true }` without executing duplicate stock increments or coupon decrements.

2. **Accurate Variant Stock Restoration:**
   Inventory is restored per item variant using a 3-tier fallback matching strategy to support both new orders (which capture `variantId`) and legacy orders:
   - Tier 1: Matches variant by explicit `variantId`
   - Tier 2: Matches variant by exact `sku`
   - Tier 3: Matches variant by `label` (case-insensitive)
   Restoration executes atomic increment:
   ```ts
   await Product.updateOne(
     { _id: item.productId, 'variants._id': matchedVariant._id },
     { $inc: { 'variants.$.stock': item.quantity } }
   );
   ```

3. **Single-Use Coupon Rollback:**
   If the cancelled order consumed a valid discount coupon (`order.discountCode` and `order.discount > 0`), the coupon's `usedCount` is rolled back exactly once:
   ```ts
   await Discount.updateOne(
     { code: order.discountCode, usedCount: { $gt: 0 } },
     { $inc: { usedCount: -1 } }
   );
   ```

4. **Graceful Partial Failure Handling:**
   If a product or variant has been deleted or cannot be resolved, restoration does not throw an unhandled exception. It records a structured failure entry in `order.restorationDetails` (`restored: false, error: '...'`) and returns explicit warning messages, allowing administrators to audit discrepancies.

5. **Delete Order Safety Guard:**
   `DELETE /api/admin/orders/:id` intercepts active, uncancelled orders before deletion. If `order.inventoryRestored !== true` and `order.orderStatus !== 'cancelled'`, reserved inventory is automatically restored prior to document removal, preventing permanent stock leaks.

### 4.2 Customer Self-Service Order Cancellation
- **Endpoint:** `POST /api/customer/orders/:orderId/cancel`
- **Authentication & Ownership:** Enforces `requireAuth`. Validates `order.customer === user._id` or `order.customerInfo.email === user.email`. Unauthorized attempts receive `403 Forbidden`.
- **Eligibility Window:** Customers can cancel orders only while `orderStatus === 'pending'` and `shipmentStatus === 'unfulfilled'`. Orders already confirmed, processing, shipped, or delivered cannot be cancelled online (`400 Bad Request`).
- **Shared Engine:** Customer cancellation invokes the identical `cancelAndRestockOrder` engine with `cancelledBy: 'customer'`.
- **Dashboard UI:** `src-rebuild/pages/Dashboard.tsx` provides a **Cancel Order** action with modal confirmation, reason entry, duplicate-click prevention, loading spinner, and immediate order status refresh.

### 4.3 Storefront Availability, Sold-Out Badges & Variant Synchronization
To prevent customer friction from attempting to order depleted stock, `ProductCard.tsx` implements strict component-level availability invariants:
1. **Stock Availability Computation:**
   - Evaluates availability per variant: `isVariantAvailable(v) = v.stock > 0 && v.active !== false`.
   - Evaluates product-level availability: `isProductAvailable = variants.some(v => isVariantAvailable(v))`.
   - Missing, negative, NaN, non-numeric, or `active: false` stock states are treated conservatively as unavailable (`0` stock).
2. **Visual Sold-Out Badges & CTA Safeguard:**
   - When all variants are out of stock, card displays a prominent `SOLD OUT` badge overlaid on product media.
   - The primary CTA button transitions to disabled state (`cursor-not-allowed`, opacity reduction, `aria-disabled="true"`) displaying text `SOLD OUT`.
   - When individual variants are selected, CTA dynamically updates between active purchase and disabled sold-out states.
3. **Variant Prop Synchronization:**
   - When parent components re-render or product props refresh with updated inventory, the component synchronizes `selectedVariant` against the fresh product data.
   - If the currently selected variant becomes unavailable after refresh, the component automatically defaults to the first available in-stock variant.
   - If all variants become unavailable, the component safely transitions to the fully sold-out state.
4. **Keyboard Accessibility:**
   - Variant selector buttons include explicit `:focus-visible` ring styling with heritage gold tokens (`#D4A359`) for full keyboard navigation and screen reader support.
   - Verified by `tests/product_card_availability.test.ts` (23/23 tests pass).

---

## 5. Database Schema Reference (MongoDB / Mongoose)

- **`User`:** `name`, `email` (unique, lowercase), `password` (bcrypt), `role` (`customer` | `admin` | `super_admin`), `active`, `phone`, `addresses[]`, `wishlist[]`, `passwordResetTokenHash`, `passwordResetExpiresAt`, `invitationTokenHash`, `invitationExpiresAt`.
- **`Product`:** `name`, `slug` (unique), `hindiName`, `description`, `category` (ref: Category), `variants[]` (`label`, `weight`, `price`, `salePrice`, `stock`, `sku`), `images[]`, `ingredients[]`, `oilUsed`, `shelfLife`, `isBestSeller`, `active`.
- **`Category`:** `name`, `slug` (unique), `description`, `image`, `sortOrder`, `active`.
- **`Order`:** `orderNumber` (unique), `customer` (ref: User), `customerInfo`, `shippingAddress`, `items[]` (`productId`, `variantId`, `productName`, `variantLabel`, `sku`, `price`, `quantity`, `itemTotal`, `image`), `subtotal`, `discount`, `discountCode`, `shipping`, `total`, `paymentMethod`, `paymentStatus`, `orderStatus`, `shipmentStatus`, `idempotencyKey`, `trackingInfo`, `notes`, `inventoryRestored`, `couponRestored`, `cancelledAt`, `cancelledBy`, `cancellationReason`, `restorationDetails[]`.
- **`StoreSettings`:** Singleton document storing public metadata, support contacts, GSTIN, FSSAI license numbers, free delivery threshold, and hero banner configurations.
- **`EmailLog`:** Structured audit log recording every email delivery attempt (`eventType`, `recipient`, `subject`, `provider`, `status`, `attemptedAt`).

### 5.2 Transactional Email Architecture & Event Catalog

The transactional email engine (`server/lib/emailService.ts`) provides centralized, fault-isolated dispatching using Resend Node.js SDK with automated development/test simulation and MongoDB audit logging (`EmailLog`).

#### 1. Supported Notification Events
- **`customer_welcome`:** Heritage greeting dispatched upon customer registration via email or Google OAuth (`/api/auth/register`, `/api/auth/google`).
- **`customer_password_reset`:** Secure 1-hour single-use token link for customer password recovery (`/api/auth/forgot-password`). Never transmits raw passwords.
- **`admin_password_reset`:** Secure 1-hour single-use token link for staff/admin password recovery (`/api/auth/admin-forgot-password`).
- **`admin_invitation`:** Cryptographically signed invitation link (48-hour expiration) for staff onboarding (`/api/admin/staff/invite`).
- **`password_change_otp`:** 6-digit in-app verification code with 60-second cooldown and 10-minute validity (`/api/auth/password-change/request`).
- **`password_changed_notification`:** Immediate security confirmation alert with Asia/Kolkata timestamp and emergency support contacts (`/api/auth/reset-password`, `/api/auth/password-change/verify`).
- **`role_changed_notification`:** Staff promotion/demotion notification informing user of updated access rights (`/api/admin/staff/role`, `/api/admin/staff/promote`).
- **`order_confirmation`:** Detailed order receipt dispatched upon successful storefront order placement with itemized lines, discounts, grand total, and delivery address (`/api/orders`).
- **`order_status_update`:** Customer updates when order transitions through fulfillment (`confirmed`, `processing`, `shipped`, `delivered`, `cancelled`) or when courier tracking details (carrier, AWB, track URL) are attached (`/api/admin/orders/:id`, `/api/customer/orders/:id/cancel`).
- **`admin_new_order_alert`:** Multi-admin notification dispatched to all active admins and `ADMIN_NOTIFICATION_EMAIL` upon order placement (`/api/orders`).
- **`admin_order_cancellation_alert`:** Administrative notification dispatched when a customer cancels an order online, instructing kitchen/dispatch to halt fulfillment (`orderRestoration.ts`).
- **`inquiry_acknowledgement`:** Customer acknowledgement for contact and bulk order enquiries with reference ID and 1 business day SLA (`/api/inquiries`, `/api/contact`).
- **`admin_new_inquiry_alert`:** Store owner alert for customer and bulk gifting enquiries (`/api/inquiries`, `/api/contact`).
- **`admin_security_alert`:** Automated smoke test verification and system security alerts.

#### 2. Architecture & Defensive Guardrails
1. **Fault Isolation & Non-Blocking Execution:** Email dispatching is wrapped in non-blocking promises with catch blocks across all route handlers. Provider downtime, network failure, or API rate limiting never corrupts, rolls back, or blocks checkout orders, user registrations, or administrative status changes.
2. **Explicit Delivery Accounting (`delivered: boolean`):** The `EmailResult` contract explicitly separates `delivered: true` (confirmed API response from live Resend servers) from `simulated: true` / `delivered: false` (local simulator). This guarantees test environments or simulated modes are never mistakenly reported as genuine delivery.
3. **Strict Simulation Enforcement:** In test mode (`NODE_ENV=test` or `IS_E2E_TEST=true`) or when `EMAIL_PROVIDER=simulated`, `getEmailConfig()` strictly zeroes out API keys and forces `provider: 'simulated'`. Even if a valid-looking `RESEND_API_KEY` is present in local `.env`, zero external network calls are made.
4. **Clean Plain-Text Generation:** `generatePlainTextFallback()` strips `<style>` and `<script>` blocks before tag removal and entity decoding, preventing raw CSS class definitions from leaking into plain-text email previews.
5. **PII Masking in Diagnostic Logs:** `maskEmail()` shields recipient email addresses (e.g. `c***r@example.com`) across simulator and console logs to prevent PII exposure in logs and CI traces.
6. **Production Unconfigured Safety:** If `RESEND_API_KEY` is omitted in production, messages safely drop (`provider: 'unconfigured'`, `delivered: false`) without throwing unhandled exceptions.

#### 3. Admin Email Smoke-Test & Provider Status Mechanism
- **Mounted Endpoints:**
  - `POST /api/admin/email/smoke-test` (aliased at `POST /api/admin/settings/email/smoke-test`)
  - `GET /api/admin/email/status`
- **Security & Authorization:** Strictly protected by `requireAdmin` middleware. Requests without a valid JWT receive HTTP 401; non-admin customer accounts receive HTTP 403. Public or unauthenticated triggers are completely prohibited.
- **Abuse & Quota Hardening:** Rate limited via `express-rate-limit` (max 10 smoke tests per 10 minutes per IP/session) to prevent accidental quota exhaustion or email flooding.
- **Input Validation:** Requires RFC 5322 compliant recipient syntax if `targetEmail` is supplied (HTTP 400 on malformed syntax); defaults safely to requesting admin's email or store notification email.
- **PII Masking & Token Safety:** Responses and server logs mask recipient addresses (e.g. `q***r@malwanamkeen.com`). Credentials, API secrets, and password reset tokens are never written into `EmailLog` or returned in API payloads.
- **Diagnostic Audit Logging:** Test dispatches are recorded in MongoDB `EmailLog` under `eventType: 'admin_security_alert'` with structured delivery verification (`delivered: boolean`, `providerMessageId`).

### 5.3 Razorpay Payment Gateway & Cryptographic Security Architecture
The platform integrates Razorpay for secure digital payments while preserving 100% backward compatibility with Cash on Delivery (COD).

#### 1. Core Principles & Fraud Prevention
1. **Server-Calculated Amounts Only:** Order totals, packaging prices, dynamic delivery charges, and coupon discounts are strictly calculated on the server from authoritative MongoDB documents. Amounts from the browser are completely discarded. Amounts transmitted to Razorpay Orders API are in integer paise (`Math.round(total * 100)`).
2. **Cryptographic HMAC-SHA256 Verification:** Signatures (`razorpay_signature`) submitted by the client are verified using HMAC-SHA256 with `RAZORPAY_KEY_SECRET`. Signatures are evaluated in constant time using `crypto.timingSafeEqual` to eliminate timing attack vectors.
3. **Idempotent Webhook Processing:** Webhooks at `POST /api/orders/webhook/razorpay` verify HMAC signatures using `RAZORPAY_WEBHOOK_SECRET` over raw body buffers. Processed event IDs are indexed and tracked in `processedWebhookEvents`. Replayed events return HTTP 200 with `alreadyProcessed: true` without double-mutating state or dispatching duplicate confirmation emails.
4. **State Machine Invariants:**
   - Unverified, unpaid, or forged orders are never marked `paymentStatus: 'paid'`.
   - Cancelled orders (`orderStatus: 'cancelled'`) can never be marked paid or verified; payment verification strictly checks `orderStatus !== 'cancelled'`.
   - Paid orders (`paymentStatus: 'paid'`) can never be cancelled or restocked by late payment failure events.
   - Revenue analytics in the Admin Dashboard filter strictly for `paymentStatus === 'paid'`, ensuring financial integrity.
5. **Abandoned Checkout & Restoration:** If a customer abandons payment or cancels their checkout, `POST /api/orders/:orderId/cancel-unpaid` leverages `cancelAndRestockOrder()` to atomically restock variant inventory and roll back coupon usage.
6. **Retry Without Duplicate Stock Reservation:** Customers can retry payment on unpaid pending orders via `POST /api/orders/:orderId/retry-payment` without duplicating order documents or double-reserving inventory.
7. **Sandbox & Test Isolation:** Automated test suites use `_setRazorpayClientForTesting` for mock injection. Unit and integration tests run 100% offline with zero live charges or real credit card calls. Unconfigured production mode safely returns HTTP 503 and never silently marks payments as successful.

### 5.4 Shiprocket Logistics Integration & Shipping Safety Architecture
The platform integrates Shiprocket automated logistics and courier management while preserving 100% backward compatibility with manual tracking entry and Cash on Delivery (COD) workflows.

#### 1. Core Principles & Safety Architecture
1. **Packaging Metadata & Weight Calculation (No Invented Values):** Package weights are calculated strictly from server-side validated product variant metadata (e.g. "200g" -> 0.2 kg, "500g" -> 0.5 kg, "1kg" -> 1.0 kg, "1.25kg" -> 1.25 kg). If an item lacks standard weight metadata or has unrecognized custom packaging, `validateAndCalculateShipmentPackage()` returns `valid: false` and lists the specific items in `missingMetadata`. The system never invents or hallucinates package dimensions or weights. Parcels enforce a minimum weight threshold of 0.05 kg (50g) in compliance with courier standards.
2. **Duplicate Shipment Creation Prevention (HTTP 409):** `createShiprocketOrder()` strictly verifies whether `shiprocketDetails.shipmentId` or `shiprocketDetails.orderId` is already populated on the order document. Any retry attempt returns HTTP 409 Conflict with the existing shipment ID, preventing duplicate courier bookings and excess shipping charges.
3. **Authentication Token Caching & Secret Redaction:** `getShiprocketAuthToken()` caches the Bearer token in memory for up to 24 hours (Shiprocket tokens remain valid up to 10 days) to prevent rate limits and unnecessary round-trips. All network calls enforce strict 10-12s timeouts via `AbortSignal.timeout()`. Password and token strings are never logged to console or traces.
4. **Cryptographic Webhook Verification & Replay Protection:** Webhooks arriving at `POST /api/shipping/webhook/shiprocket` verify request authenticity using the configured secret token header (`x-api-key`, `Authorization: Bearer <token>`, or `x-shiprocket-token`). Processed event IDs are indexed and deduplicated via `order.processedShippingEvents`, protecting against replay attacks and network retransmissions.
5. **State Machine Invariants & Courier Status Transitions:**
   - **AWB Assigned / Ready to Ship:** `shipmentStatus` transitions to `ready_to_ship`, `orderStatus` transitions to `processing`.
   - **In Transit / Picked Up:** `shipmentStatus` transitions to `in_transit`, `orderStatus` transitions to `shipped`.
   - **Out for Delivery:** `shipmentStatus` transitions to `out_for_delivery`.
   - **Delivered:** `shipmentStatus` transitions to `delivered`, `orderStatus` transitions to `delivered`.
   - **Cash on Delivery (COD) Auto-Reconciliation:** When a COD order reaches `DELIVERED`, the courier's verified cash collection reconciles `paymentStatus = 'paid'` and sets `paidAt = new Date()`. Non-COD (prepaid) orders retain existing payment timestamps and details untouched.
   - **RTO / Returned:** `shipmentStatus` transitions to `returned` without falsely marking the order as paid or delivered.
   - **Cancellation Guard:** Cancelled orders (`orderStatus === 'cancelled'`) can never be shipped or have AWB codes generated.
6. **Automated Customer Email Notifications:** Upon status transitions or AWB attachment, `sendOrderStatusUpdate()` is triggered asynchronously with tracking URLs (`https://shiprocket.co/tracking/<awb>`) and courier details.
7. **Preservation of Manual Tracking Functionality:** The administrative endpoints `PUT /api/admin/orders/:id`, `PATCH /api/admin/orders/:id`, and `PATCH /api/admin/orders/:id/status` remain fully operational, allowing store managers to manually enter courier details (`courierName`, `trackingNumber`, `trackingUrl`) without requiring Shiprocket API credentials.
8. **Sandbox & Test Isolation:** Automated test suites use `_setShiprocketClientForTesting` for mock client injection. Unit and integration tests run 100% offline with zero live shipments created or real shipping labels purchased. Unconfigured production mode safely returns HTTP 503 and never marks shipments as created.

---

## 6. Operations & Runbook

### 6.1 Bootstrapping the Initial Super Admin
To initialize a newly deployed instance without existing admin accounts:
1. Set `ADMIN_EMAIL=your_email@example.com` in environment variables.
2. Sign up on the storefront with `your_email@example.com`. The system automatically promotes matching accounts to `super_admin`.
3. Alternatively, when bootstrapping headless on a blank database, set `ADMIN_PASSWORD=your_initial_password` in environment variables to auto-seed the initial owner on server startup.

### 6.2 Secret Rotation Runbook
If `JWT_SECRET` must be rotated:
1. Generate a new cryptographically random 32+ character string.
2. Update `JWT_SECRET` in Vercel Environment Variables.
3. Trigger a production redeployment. All active JWT sessions will be invalidated, requiring users to log in again.

### 6.3 Strict Test-Database Connection Isolation Architecture

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

# 3. Run individual isolated unit & integration suites (100% PASS)
npx tsx tests/product_card_availability.test.ts  # 23 / 23 PASS
npx tsx tests/order_cancellation_restock.test.ts # 23 / 23 PASS
npx tsx tests/admin_permissions.test.ts          # 14 / 14 PASS
npx tsx tests/transactional_email.test.ts        # 43 / 43 PASS
npx tsx tests/regression.test.ts                 # 21 / 21 PASS
npx tsx tests/razorpay_payment.test.ts            # 50 / 50 PASS
npx tsx tests/shiprocket_shipping.test.ts         # 40 / 40 PASS
npx tsx tests/shipping_tracking_integration.test.ts # 14 / 14 PASS
npx tsx tests/webhook_shiprocket.test.ts          # 18 / 18 PASS
npx tsx tests/comprehensive_integration.test.ts   # 32 / 32 PASS

# 4. Run Live E2E tests against an authorized test database (malwa_namkeen_test)
# Terminal 1: Launch test server on port 3001
# PORT=3001 IS_E2E_TEST=true npx tsx server.ts
# Terminal 2: Run live suites
# BASE_URL=http://127.0.0.1:3001 npx tsx tests/e2e_live_server.test.ts    # 18 / 18 PASS (3 records cleaned)
# BASE_URL=http://127.0.0.1:3001 npx tsx tests/full_system_e2e.test.ts   # 43 / 43 PASS (4 records cleaned)
# Grand Total:
#  - Baseline on main: 206 / 206 Tests Passing Across 18 Suites (145/145 offline)
#  - Active integration branch (feat/transactional-email-hardening): 419 / 419 Tests Passing Across 23 Suites (310 offline + 109 live test-server)
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

### 6.4 Atlas Network Access Policy (0.0.0.0/0 Precaution)
- An entry for `0.0.0.0/0` in MongoDB Atlas Network Access is commonly present to accommodate dynamic IP allocation in Vercel serverless functions.
- **Pre-removal Requirements:** Before deleting `0.0.0.0/0` from Atlas Network Access, verify whether Vercel is configured with Dedicated Static Outbound IPs or VPC Peering. Removing `0.0.0.0/0` without static peering will immediately sever Vercel production serverless API connections to MongoDB Atlas.

### 6.5 Operational Scope & Release Readiness Boundaries
1. **Interactive Browser QA (UNVERIFIED):** While automated suites pass 100% (419/419 assertions across 23 suites in `run_all.mjs`: 310 offline + 109 live test-server), and mobile viewport tags/responsive layouts are verified via integration tests, manual cross-device / cross-browser QA is **UNVERIFIED**. Manual staging checks required before customer launch:
   - Variant/weight switching (250g, 500g, 1kg) and dynamic price updates on `/shop`.
   - Out-of-stock badge display and disabled CTA enforcement for depleted products.
   - Cart limit boundaries (max 10 / stock cap) and coupon validation (`QA10PERCENT`).
   - Cash on Delivery (COD) checkout placement and confirmation screen.
   - Razorpay Test Mode checkout popup invocation, dismissed modal handling, and declined card alert (`payment.failed`).
   - Customer self-service order cancellation from `/dashboard` and stock restoration verification.
   - Admin order fulfillment drawer and manual tracking fallback (`courierName`, `trackingNumber`, `trackingUrl`) on `/admin/orders`.
2. **Cancellation Inventory & Coupon Restoration Empirically Verified:** Full lifecycle verification of variant stock decrement during checkout followed by stock restoration and coupon rollback upon cancellation against a genuine checkout-created order in the test database was completed and verified in `tests/comprehensive_integration.test.ts` Section 6. Pre-seeded order `MN-QA-20261017-001` remains completely untouched in the test database.
3. **Transactional Email — Final Acceptance Review (EMAIL CODE GATE CLOSED — LIVE DELIVERY STILL UNVERIFIED):** Verified in code, mocked integration tests, and simulated tests with non-blocking error handling, secret sanitization, and bounded in-flight retries (43/43 tests across 11 suites in `tests/transactional_email.test.ts`, including the End-to-End Email Workflow Integration Suite; 23/23 regression suites with 419/419 assertions). Authenticated, admin-protected smoke test mounted at `POST /api/admin/email/smoke-test` (aliased at `/api/admin/settings/email/smoke-test`) and provider status check at `GET /api/admin/email/status`. Live delivery is BLOCKED on owner credentials: `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are absent from Vercel Preview; `malwanamkeen.com` is non-existent in public DNS (NXDOMAIN on 8.8.8.8) and unconnected in Vercel (`0 Domains found`). Custom sender verification in Resend requires prior domain registration and DNS records, while immediate Preview smoke testing can leverage Resend sandbox sender `onboarding@resend.dev` to the owner's account email once `RESEND_API_KEY` is added to Vercel Preview. Real live delivery remains explicitly marked **UNVERIFIED** until a real email is received in a test inbox. Because email failures fail closed and non-blockingly without rolling back orders or mutating state, the next workstream may safely proceed.
4. **Payment Processing — Razorpay Security & Hardening (CODE & MOCK VERIFIED — LIVE PAYMENT UNVERIFIED):** Fully architected and tested with 50/50 tests across 9 suites in `tests/razorpay_payment.test.ts`. Hardened features:
   - Server-side Razorpay order creation (`createRazorpayOrder`) with amounts strictly calculated from the database product catalog in paise (1 INR = 100 paise). Zero browser trust for prices or payment success flags.
   - Constant-time HMAC-SHA256 signature verification (`crypto.timingSafeEqual`) preventing timing attacks.
   - Route verification guard (`handleVerifyPayment`): validates online payment method, strictly checks Razorpay Order ID association, enforces customer ownership, and detects/blocks cross-order payment replay attacks via sparse compound index on `paymentDetails.razorpayPaymentId`.
   - Webhook processing (`handleRazorpayWebhook` mounted at `/api/orders/webhook/razorpay` and `/api/orders/webhook`): verifies HMAC-SHA256 over raw payload buffers, idempotently absorbs replayed events via `processedWebhookEvents`, enforces currency/amount match against server order totals, safely ignores captured payments on cancelled orders with merchant review alert, and captures `payment.failed` reasons without inventory rollback or state corruption.
   - Unpaid checkout abandonment (`POST /api/orders/:orderId/cancel-unpaid`): allows customers to cancel unpaid checkouts, automatically releasing reserved variant inventory and restoring coupon usage counts via `cancelAndRestockOrder`.
   - Payment retry flow (`POST /api/orders/:orderId/retry-payment`): enables customer to generate a fresh Razorpay order for unpaid pending orders without double-decrementing inventory.
   - Storefront Dashboard UX: `Dashboard.tsx` dynamic Razorpay script loader (`loadRazorpayScript`) and retry/pay button with `CreditCard` icon.
   - Cash on Delivery (COD) regression guard: offline COD checkout completely preserved.
   - Real live charges are **UNVERIFIED** pending owner credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) in Vercel Preview.
5. **Logistics & Shipping — Shiprocket Fulfillment & Tracking Hardening (CODE & MOCK VERIFIED — LIVE DISPATCH UNVERIFIED):** Server-side Shiprocket integration is fully architected and hardened across 72 automated assertions (40/40 tests in `tests/shiprocket_shipping.test.ts`, 14/14 tests in `tests/shipping_tracking_integration.test.ts`, and 18/18 tests in `tests/webhook_shiprocket.test.ts`). Hardened features:
   - Server-side Shiprocket authenticated client (`shiprocketService.ts`) with cached Bearer token and non-blocking retry/timeout safety.
   - Packaging weight calculation strictly parsed from database product variant metadata (e.g. 250g, 500g, 1kg) with zero invented dimensions or placeholder weights; enforces minimum parcel threshold of 0.05kg.
   - Shipment creation (`POST /api/admin/orders/:id/shiprocket/create-shipment`) with duplicate shipment protection (HTTP 409 Conflict) and cancelled order guards.
   - AWB code generation and courier partner assignment (`POST /api/admin/orders/:id/shiprocket/generate-awb`), idempotently returning existing AWB if already assigned.
   - Live tracking synchronization (`GET /api/admin/orders/:id/shiprocket/track`, `POST /api/admin/orders/:id/shiprocket/sync-tracking`, and auto-sync on admin lookup) syncing provider scans (`syncedAt`, `rawStatus`, `lastEvent`) into MongoDB.
   - Status regression protection via `SHIPMENT_STATUS_RANK`: enforces forward-only order status progression (`unfulfilled: 0` -> `ready_to_ship: 1` -> `in_transit: 2` -> `out_for_delivery: 3` -> `delivered: 4`), strictly preventing delayed or out-of-order scans from regressing orders already in terminal or delivered states.
   - Customer and guest order tracking authorization: `GET /api/orders/:orderId/track` allows order tracking for authenticated owner, admin/super_admin, or guests providing matching order email/phone; strictly rejects unauthorized access with HTTP 403 without credential or recipient leakage.
   - Authenticated customer account tracking: `GET /api/customer/orders/:orderId/track` returns live courier, AWB, and tracking URL.
   - Admin shipping provider readiness endpoint: `GET /api/admin/orders/shipping/status` reporting configuration and sandbox mode without credential exposure.
   - Safe Shiprocket order cancellation (`cancelShiprocketOrder` calling `/orders/cancel` safely on order cancellation in `updateOrderHandler` and `orderRestoration.ts`).
   - Webhook security: Constant-time timing-safe token verification (`crypto.timingSafeEqual`) accepting `x-api-key`, `Authorization: Bearer`, or `x-shiprocket-token`; payload validation; replay protection via `processedShippingEvents`; automatic Cash on Delivery (COD) reconciliation on verified delivery; and backward status regression prevention.
   - Storefront & Admin UX: Customer `Dashboard.tsx` displaying live shipment badge, courier details, AWB code, and direct tracking link; `AdminOrders.tsx` with dedicated Shiprocket automated logistics control card for 1-click shipment creation, AWB assignment, live tracking sync, label & manifest printing, and manual tracking fallback.
   - Real physical courier dispatches remain **UNVERIFIED** pending configuration of `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, and `SHIPROCKET_WEBHOOK_TOKEN` in Vercel.
6. **Serverless Concurrency:** In-memory rate limiting and idempotency caching (`MemoryStore`) protect within a single warm lambda instance; distributed rate limiting across concurrent cold lambdas requires an external Redis cache (e.g. Upstash) in future milestones.
7. **Canonical Release & Production Deployment Status:** Canonical `main` is at `f7ead1e7d5b7a72759f36bc67e3fad6ef0b1eabb` (in sync with `daksh_repo/main` and `feat/comprehensive-integration-pass`). Release branch `release/malwa-production-ready` remains strictly preserved at `73f3fd12ca254a295d8f8c630aae8bd83c7a988b`. Vercel production deployment is `dpl_4DGFYbBhPvvJHhHaAWxChXz9A95b` ([`https://malwa-namkeen.vercel.app`](https://malwa-namkeen.vercel.app), Status: **● Ready**). Usable staging preview deployment is `dpl_9rykb8hDa9YAi4Jnasz8jXUU9x2e` ([`https://malwa-namkeen-btoliab4k-dakshs-projects-45d693b3.vercel.app`](https://malwa-namkeen-btoliab4k-dakshs-projects-45d693b3.vercel.app)). Custom domain `malwanamkeen.com` is NOT connected in Vercel.
8. **Preview Database Isolation Verification (Gate GATED BY VERCEL SSO):**
   - **Isolation Established:** Vercel environment variables are successfully partitioned: Production `MONGODB_DB_NAME=malwa_namkeen`, Preview `MONGODB_DB_NAME=malwa_namkeen_preview`, and Preview `MONGODB_URI` using `malwa_preview_runner`. Database `malwa_namkeen_preview` was physically initialized on Atlas with all 11 collections while production `malwa_namkeen` remained unmutated (6 orders).
   - **Deployment Protection Gate:** Active Preview deployment `dpl_9rykb8hDa9YAi4Jnasz8jXUU9x2e` ([`https://malwa-namkeen-btoliab4k-dakshs-projects-45d693b3.vercel.app`](https://malwa-namkeen-btoliab4k-dakshs-projects-45d693b3.vercel.app)) is protected by Vercel Authentication (SSO), returning HTTP 302 redirects to `https://vercel.com/login` for all unauthenticated HTTP/browser requests.
   - **Safety Stop Enforced:** Because runtime verification of `database: "malwa_namkeen_preview"` cannot be confirmed over the public wire without owner Vercel authentication or a Vercel Protection Bypass Token (`x-vercel-protection-bypass`), state-changing staging tests on the remote Preview URL are strictly **HALTED** per QA safety protocol to prevent unintended database mutations. Local test database `malwa_namkeen_test` remains 100% verified across 419/419 assertions in 23 test suites.
9. **Exact Single Safest Next Action:** Disable Vercel Authentication for Preview Deployments in Vercel Project Settings (or supply `x-vercel-protection-bypass` secret header) so automated browser QA can verify `database: "malwa_namkeen_preview"` over HTTP and execute live customer checkout journeys on Preview.

