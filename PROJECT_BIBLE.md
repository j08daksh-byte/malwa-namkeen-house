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
