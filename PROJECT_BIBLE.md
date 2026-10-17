# Malwa Namkeen House — Technical Project Bible

**System Name:** Malwa Namkeen House D2C E-Commerce & Administrative Platform
**Established:** 1954 (Ujjain / Bengaluru Heritage Savouries & Sweets)
**Version:** 1.1.0 Canonical Consolidated Main (`bf2ef58d6a9e8b1c644f4d8072640f787a16bab9`)
**Canonical Repository:** `j08daksh-byte/malwa-namkeen-house` (`daksh_repo/main`)
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
npx tsx tests/transactional_email.test.ts        # 13 / 13 PASS
npx tsx tests/regression.test.ts                 # 21 / 21 PASS

# 4. Run Live E2E tests against an authorized test database (malwa_namkeen_test)
# Terminal 1: Launch test server on port 3001
# PORT=3001 IS_E2E_TEST=true npx tsx server.ts
# Terminal 2: Run live suites
# BASE_URL=http://127.0.0.1:3001 npx tsx tests/e2e_live_server.test.ts    # 18 / 18 PASS (3 records cleaned)
# BASE_URL=http://127.0.0.1:3001 npx tsx tests/full_system_e2e.test.ts   # 43 / 43 PASS (4 records cleaned)
# Grand Total: 206 / 206 Tests Passing Across All 18 Suites (145/145 offline)
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
1. **Interactive Browser QA Incomplete:** While automated suites pass 100% (206/206 assertions across 18 suites), manual browser QA across multiple viewport sizes and browsers has not been executed. Do NOT claim manual QA passed.
2. **Cancellation Inventory Restoration Pending Verification with Genuine Checkout Order:** The Gate 2A fixture pending order (`MN-QA-20261017-001`) was seeded directly via `Order.create` without decremented starting inventory. While unit tests (`order_cancellation_restock.test.ts`) verify mathematical and database restoration logic, full lifecycle verification of stock decrement during checkout followed by stock restoration upon cancellation against a genuine checkout-created order in the test database remains to be executed.
3. **Transactional Email (Resend Delivery Unverified):** Verified in code and simulated tests, but unverified live. Vercel environment audit confirmed `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are not yet populated. Domain DNS (SPF/DKIM/DMARC) must be verified in Resend before enabling real delivery.
4. **Payment Processing (Razorpay Online & Cash on Delivery):** Fully architected and tested with 22/22 tests passing in `tests/razorpay_payment.test.ts`. Supports server-validated amounts in paise, constant-time HMAC-SHA256 signature verification, idempotent webhook processing, and retry/restoration protection. Real live charges require merchant account configuration (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) in Vercel. Cash on Delivery (COD) remains fully operational.
5. **Logistics & Shipping (Shiprocket Integrated & Tested):** Server-side Shiprocket integration is fully architected and verified with 32/32 tests passing in `tests/shiprocket_shipping.test.ts`. Supports packaging weight calculation strictly from server metadata, duplicate shipment protection (HTTP 409), AWB assignment, tracking lookup, webhook token authentication, replay attack deduplication, and COD auto-reconciliation upon verified delivery. Manual administrative tracking entry (`courierName`, `trackingNumber`, `trackingUrl`) remains 100% functional. Live courier operations require configuring `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, and `SHIPROCKET_WEBHOOK_TOKEN` in Vercel.
6. **Serverless Concurrency:** In-memory rate limiting and idempotency caching (`MemoryStore`) protect within a single warm lambda instance; distributed rate limiting across concurrent cold lambdas requires an external Redis cache (e.g. Upstash) in future milestones.
7. **Canonical Release & Production Deployment Status:** Canonical `main` is consolidated at `bf2ef58d6a9e8b1c644f4d8072640f787a16bab9` and pushed to `daksh_repo/main`. Release branch `release/malwa-production-ready` remains strictly preserved at `73f3fd12ca254a295d8f8c630aae8bd83c7a988b`. Zero deployment was performed during this consolidation. Active Vercel production deployment remains on baseline `9fd812d` / `8dca758` ([`dpl_DayLHyctUicwMKCshgVRtsVLXFET`](https://malwa-namkeen.vercel.app)).
