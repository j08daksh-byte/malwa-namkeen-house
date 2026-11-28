/**
 * Malwa Namkeen House — Express server
 * Handles all API routes, sitemaps, robots.txt, and serves the Vite SPA.
 */

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import enquiryRoutes from './server/routes/enquiries.ts';
import authRoutes from './server/routes/auth.ts';
import uploadRoutes from './server/routes/uploads.ts';
import adminProductRoutes from './server/routes/adminProducts.ts';
import adminCategoryRoutes from './server/routes/adminCategories.ts';
import adminOrderRoutes from './server/routes/adminOrders.ts';
import adminCustomerRoutes from './server/routes/adminCustomers.ts';
import adminDiscountRoutes from './server/routes/adminDiscounts.ts';
import adminInquiryRoutes from './server/routes/adminInquiries.ts';
import adminStaffRoutes from './server/routes/adminStaff.ts';
import authRecoveryRoutes from './server/routes/authRecovery.ts';
import adminSettingsRoutes, { publicSettingsRouter } from './server/routes/adminSettings.ts';
import adminEmailRoutes from './server/routes/adminEmail.ts';
import adminDashboardRoutes from './server/routes/adminDashboard.ts';
import adminBannerRoutes from './server/routes/adminBanners.ts';
import publicBannerRoutes from './server/routes/banners.ts';
import publicCatalogRoutes from './server/routes/products.ts';
import cartWishlistRoutes from './server/routes/cartWishlist.ts';
import customerAccountRoutes from './server/routes/customerAccount.ts';
import customerOrdersRoutes from './server/routes/customerOrders.ts';
import shippingWebhooksRoutes from './server/routes/shippingWebhooks.ts';
import sitemapRoutes from './server/routes/sitemap.ts';
import conciergeRoutes from './server/routes/concierge.ts';
import { apiNotFoundHandler, apiErrorHandler } from './server/lib/errorHandler.ts';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

import { BUSINESS } from './server/config.ts';
import { connectMongoDB, getMongoStatus } from './server/lib/mongodb.ts';
import cookieParser from 'cookie-parser';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

// ── Environment validation ───────────────────────────────────────────────────

const REQUIRED_ENV: string[] = ['MONGODB_URI', 'JWT_SECRET'];
const PRODUCTION_RECOMMENDED: string[] = ['APP_URL', 'ADMIN_EMAIL'];
const OPTIONAL_WARNED: string[] = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'RESEND_API_KEY', 'GEMINI_API_KEY'];

function validateEnv() {
  const isProd = process.env.NODE_ENV === 'production';
  const required = [...REQUIRED_ENV];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) {
    console.error(`[Startup] Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (isProd) {
    const jwtSecret = process.env.JWT_SECRET || '';
    if (jwtSecret.length < 32) {
      console.error('[Startup Security Error] Production JWT_SECRET must be at least 32 characters long.');
      process.exit(1);
    }
    for (const k of PRODUCTION_RECOMMENDED) {
      if (!process.env[k]) {
        console.warn(`[Startup Warning] Recommended production env var ${k} not set.`);
      }
    }
  }

  for (const k of OPTIONAL_WARNED) {
    if (!process.env[k] || (k === 'GEMINI_API_KEY' && process.env[k] === 'your-gemini-api-key')) {
      console.warn(`[Startup] Optional env var ${k} not set — related features will use safe fallback.`);
    }
  }
}

// ── Server bootstrap ─────────────────────────────────────────────────────────

async function startServer() {
  validateEnv();

  // ── MongoDB connection (non-blocking in dev — server starts even if Mongo is unavailable)
  try {
    await connectMongoDB();
  } catch (err: unknown) {
    if (process.env.NODE_ENV === 'test' || process.env.IS_E2E_TEST === 'true') {
      console.error('[Startup Safety Error] Test database connection failed:', err instanceof Error ? err.message : err);
      process.exit(1);
    }
    console.warn('[Startup] MongoDB unavailable — server will start without it.');
  }

  const app  = express();
  app.set('trust proxy', 1);
  const PORT = Number(process.env.PORT ?? 3000);
  const isProd = process.env.NODE_ENV === 'production';

  // ── Security middleware ───────────────────────────────────────────────────

  app.use(helmet({
    contentSecurityPolicy: isProd ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://accounts.google.com", "https://checkout.razorpay.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://*.googleusercontent.com", "https://accounts.google.com", "https://*.razorpay.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https://accounts.google.com", "https://api.razorpay.com", "https://lumberjack.razorpay.com"],
        frameSrc: ["'self'", "https://accounts.google.com", "https://api.razorpay.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      }
    } : false, // Vite injects inline scripts/eval in dev
    crossOriginEmbedderPolicy: false,
  }));

  // CORS — locked to configured origins, never *
  const allowedOrigins = (() => {
    const configured = process.env.ALLOWED_ORIGINS ?? '';
    const base = configured
      ? configured.split(',').map(s => s.trim().replace(/\/+$/, '')).filter(Boolean)
      : [];
    // Always allow localhost in dev
    if (!isProd) {
      base.push('http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://localhost:3000');
    } else {
      base.push(
        'https://malwanamkeenhouse.com',
        'https://www.malwanamkeenhouse.com',
        'https://malwa-namkeen.vercel.app'
      );
      if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
        base.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim().replace(/\/+$/, '')}`);
      }
      if (process.env.VERCEL_URL) {
        base.push(`https://${process.env.VERCEL_URL.trim().replace(/\/+$/, '')}`);
      }
    }
    const appUrl = process.env.APP_URL;
    if (appUrl) base.push(appUrl.trim().replace(/\/+$/, ''));
    return Array.from(new Set(base));
  })();

  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    const normalizedOrigin = origin ? origin.replace(/\/+$/, '') : null;
    if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin)) {
      if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Vary', 'Origin');
    if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
    next();
  });

  // Cookie parser
  app.use(cookieParser());

  // JSON & URL-encoded body — 10MB limit; verify hook preserves rawBody for webhook HMAC verification
  app.use(express.json({
    limit: '10mb',
    verify: (req: any, _res: Response, buf: Buffer) => {
      req.rawBody = buf;
    },
  }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ── Rate limits ───────────────────────────────────────────────────────────

  const formLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5,
    standardHeaders: true,
    legacyHeaders:   false,
    message: {
      success: false,
      message: 'Too many submissions. Please wait a few minutes before trying again.',
    },
  });

  // ── SEO & Discoverability routes (sitemap.xml, robots.txt) ────────────────
  app.use('/', sitemapRoutes);

  // ── API routes ────────────────────────────────────────────────────────────

  app.get('/api/health', async (_req, res) => {
    const mongo = getMongoStatus();
    let dbHealthy = false;

    if (mongo.connected && mongoose.connection.db) {
      try {
        await Promise.race([
          mongoose.connection.db.command({ ping: 1 }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
        ]);
        dbHealthy = true;
      } catch {
        dbHealthy = false;
      }
    }

    res.status(dbHealthy ? 200 : 503).json({
      status: dbHealthy ? 'ok' : 'error',
      time: new Date().toISOString(),
      service: BUSINESS.name,
      mongodb: dbHealthy ? 'connected' : mongo.state,
      database: mongoose.connection.name || null,
    });
  });

  // Public customer storefront catalog (Products & Categories from MongoDB)
  app.use('/api', publicCatalogRoutes);

  // Customer Cart Revalidation & Wishlist
  app.use('/api/cart', cartWishlistRoutes);
  app.use('/api/customer', cartWishlistRoutes);
  app.use('/api/customer', customerAccountRoutes);

  // Customer Orders / Checkout
  app.use('/api/orders', customerOrdersRoutes);

  // Shipping Webhooks (Shiprocket)
  app.use('/api/shipping', shippingWebhooksRoutes);

  // Public customer store settings (MongoDB)
  app.use('/api/settings', publicSettingsRouter);

  // Admin dashboard live analytics
  app.use('/api/admin/dashboard', adminDashboardRoutes);

  // Authentication routes (register, login, logout, me, admin verify)
  app.use('/api/auth', authRoutes);
  app.use('/api/auth', authRecoveryRoutes);

  // Super Admin Staff Management routes (protected by requireSuperAdmin)
  app.use('/api/admin/staff', adminStaffRoutes);

  // Admin store settings routes (protected by requireAdmin)
  app.use('/api/admin/settings', adminSettingsRoutes);

  // Admin email testing and status routes (protected by requireAdmin)
  app.use('/api/admin/email', adminEmailRoutes);

  // Public customer store settings (store details, address, contact, GST, policies)
  app.use('/api/settings', publicSettingsRouter);

  // Public customer inquiry submission
  app.use('/api/inquiries', adminInquiryRoutes);
  app.use('/api/contact', adminInquiryRoutes);

  // Admin inquiry routes (protected by requireAdmin)
  app.use('/api/admin/inquiries', adminInquiryRoutes);

  // Customer discount validation
  app.use('/api/discounts', adminDiscountRoutes);

  // Admin discount routes (protected by requireAdmin)
  app.use('/api/admin/discounts', adminDiscountRoutes);

  // Admin customer routes (protected by requireAdmin)
  app.use('/api/admin/customers', adminCustomerRoutes);

  // Admin order routes (protected by requireAdmin)
  app.use('/api/admin/orders', adminOrderRoutes);

  // Admin category routes (protected by requireAdmin)
  app.use('/api/admin/categories', adminCategoryRoutes);

  // Admin banner routes (protected by requireAdmin)
  app.use('/api/admin/banners', adminBannerRoutes);

  // Public customer hero banners
  app.use('/api/banners', publicBannerRoutes);

  // Admin product routes (protected by requireAdmin)
  app.use('/api/admin/products', adminProductRoutes);
  app.use('/api/admin/uploads', uploadRoutes);

  // Form submission routes — rate-limited
  app.use('/api', formLimiter, enquiryRoutes);

  // ── Concierge chatbot ─────────────────────────────────────────────────────

  app.use('/api/concierge', conciergeRoutes);

  // JSON 404 catch-all for unmatched API paths before SPA HTML fallback
  app.use('/api', apiNotFoundHandler);

  // ── Static / Vite ─────────────────────────────────────────────────────────

  const distPath = path.join(process.cwd(), 'dist');
  const hasBuiltDist = fs.existsSync(path.join(distPath, 'index.html'));

  if (!isProd && !hasBuiltDist) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // ── Global error handler ──────────────────────────────────────────────────

  app.use(apiErrorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[${BUSINESS.name}] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
