/**
 * Malwa Namkeen House — Express server
 * Handles all API routes, sitemaps, robots.txt, and serves the Vite SPA.
 */

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
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
import adminDashboardRoutes from './server/routes/adminDashboard.ts';
import adminBannerRoutes from './server/routes/adminBanners.ts';
import publicBannerRoutes from './server/routes/banners.ts';
import publicCatalogRoutes from './server/routes/products.ts';
import cartWishlistRoutes from './server/routes/cartWishlist.ts';
import customerAccountRoutes from './server/routes/customerAccount.ts';
import customerOrdersRoutes from './server/routes/customerOrders.ts';
import sitemapRoutes from './server/routes/sitemap.ts';
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
    if (!process.env[k]) {
      console.warn(`[Startup] Optional env var ${k} not set — related features will be degraded.`);
    }
  }
}

// ── Gemini client ────────────────────────────────────────────────────────────

const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI {
  if (!aiClient) {
    if (!apiKey) throw new Error('GEMINI_API_KEY is missing');
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

const INITIAL_CONCIERGE_PROMPT = `
You are Malwa Concierge, the warm, polite, and knowledgeable culinary guide at MALWA NAMKEEN HOUSE (EST. 1954).
Your tone is welcoming, respectful, and warm (refer to customers respectfully, greet with 'Namaste' or 'Pranam', and embody authentic Indian hospitality).

Key Business Knowledge & Guidelines:
1. Brand Truth: MALWA NAMKEEN HOUSE was established in 1954, bringing over seven decades of authentic Malwa culinary heritage.
2. Authentic Product Catalog: Artisanal small-batch namkeens including authentic Ratlami Sev (infused with clove and black pepper warmth), Ujjaini Sev, Laung Sev, Hing Peda Sev, Khatta Meetha Mixture, Khasta Mathri, and festive gift hampers.
3. Pure Ingredients: Prepared strictly in 100% Pure Cold-Pressed Groundnut Oil — zero palm oil, zero trans fats, and zero artificial preservatives.
4. Advisory Pricing & Cart: Product prices and weights are dynamically managed on the storefront and checkout. Always advise customers to check the active product cards for current pricing; never invent prices or override checkout data.
5. Shipping & Delivery: Nationwide delivery across India with free shipping on orders above ₹499 (standard delivery is ₹49).
6. Bulk & Corporate Gifting: Custom corporate hampers, wedding boxes, festival gifting, and wholesale namkeen orders. Advise customers to submit an online Bulk & Gifting enquiry or reach out on WhatsApp at +91 7987732765.
7. Constraints: Never invent unverified ingredients, nutrition claims, medical claims, or stock promises. Never refer to table reservations or restaurant dine-in.
`;

// ── Server bootstrap ─────────────────────────────────────────────────────────

async function startServer() {
  validateEnv();

  // ── MongoDB connection (non-blocking — server starts even if Mongo is unavailable)
  try {
    await connectMongoDB();
  } catch {
    console.warn('[Startup] MongoDB unavailable — server will start without it.');
  }

  const app  = express();
  const PORT = Number(process.env.PORT ?? 3000);
  const isProd = process.env.NODE_ENV === 'production';

  // ── Security middleware ───────────────────────────────────────────────────

  app.use(helmet({
    contentSecurityPolicy: isProd ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://accounts.google.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://*.googleusercontent.com", "https://accounts.google.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https://accounts.google.com"],
        frameSrc: ["'self'", "https://accounts.google.com"],
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
    }
    const appUrl = process.env.APP_URL;
    if (appUrl) base.push(appUrl.trim().replace(/\/+$/, ''));
    return base;
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

  // JSON & URL-encoded body — 10MB limit for image uploads and base64 payloads
  app.use(express.json({ limit: '10mb' }));
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

  const conciergeLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders:   false,
    message: {
      success: false,
      message: 'Too many requests to the concierge. Please wait a moment.',
    },
  });

  // ── SEO & Discoverability routes (sitemap.xml, robots.txt) ────────────────
  app.use('/', sitemapRoutes);

  // ── API routes ────────────────────────────────────────────────────────────

  app.get('/api/health', (_req, res) => {
    const mongo = getMongoStatus();
    res.json({ status: 'ok', time: new Date().toISOString(), service: BUSINESS.name, mongodb: mongo.state });
  });

  // Public customer storefront catalog (Products & Categories from MongoDB)
  app.use('/api', publicCatalogRoutes);

  // Customer Cart Revalidation & Wishlist
  app.use('/api/cart', cartWishlistRoutes);
  app.use('/api/customer', cartWishlistRoutes);
  app.use('/api/customer', customerAccountRoutes);

  // Customer Orders / Checkout
  app.use('/api/orders', customerOrdersRoutes);

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

  app.post('/api/concierge', conciergeLimiter, async (req: Request, res: Response) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: 'Messages array is required.' });
        return;
      }

      const lastUserMessage = String(messages[messages.length - 1]?.text ?? '').slice(0, 500);
      if (!lastUserMessage) {
        res.status(400).json({ error: 'Latest user message text is required.' });
        return;
      }

      const conversationHistoryString = messages
        .slice(Math.max(0, messages.length - 7), messages.length - 1)
        .map((m: { sender: string; text: string }) => `${m.sender === 'user' ? 'Customer' : 'Malwa Concierge'}: ${m.text}`)
        .join('\n');

      const fullPrompt = `Conversation history:\n${conversationHistoryString}\n\nThe guest asks: "${lastUserMessage}"\nResponse:`;

      try {
        const ai = getGemini();
        const response = await ai.models.generateContent({
          model:    'gemini-2.0-flash',
          contents: fullPrompt,
          config: {
            systemInstruction: INITIAL_CONCIERGE_PROMPT,
            temperature: 0.8,
            topP: 0.9,
          },
        });
        res.json({ text: response.text ?? 'Namaste Ji. How can I help you today?' });
      } catch {
        // Keyword fallback — keeps chatbot alive without API key
        const lower = lastUserMessage.toLowerCase();
        let fallback = 'Namaste Ji! I would be delighted to guide you through our authentic Malwa namkeens & snacks. What would Aap like to know?';
        if (/menu|eat|food|namkeen/.test(lower))
          fallback = 'Namaste Ji! Our authentic collection spans Ratlami Sev, Hing Sev, Ujjaini Mixture, Dalmoth, Sweets and Festive Gift Boxes. Our Ratlami Sev and Hing Sev are absolute must-tries!';
        else if (/reserve|book|table|seat|order/.test(lower))
          fallback = 'Pranam Ji! You can explore and order all our authentic namkeens directly in our shop, or contact our team for bulk orders.';
        else if (/sweet|jalebi|dessert|mithai/.test(lower))
          fallback = 'Ah, authentic Malwa confections and savouries! Handcrafted with pure ingredients and time-honoured recipes.';
        else if (/hello|hi|namaste/.test(lower))
          fallback = 'Namaste Ji! Pranam! I am Malwa Concierge, your culinary guide at MALWA NAMKEEN HOUSE. How may I serve Aap today?';
        res.json({ text: fallback });
      }
    } catch (err: unknown) {
      console.error('[Concierge] Error:', err instanceof Error ? err.message : err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  // ── Static / Vite ─────────────────────────────────────────────────────────

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // ── Global error handler ──────────────────────────────────────────────────

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Server Error]', err.message);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[${BUSINESS.name}] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
