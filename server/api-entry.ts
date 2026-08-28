import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import { connectMongoDB, getMongoStatus } from './lib/mongodb.ts';
import { BUSINESS } from './config.ts';

// Routes
import authRoutes from './routes/auth.ts';
import authRecoveryRoutes from './routes/authRecovery.ts';
import publicCatalogRoutes from './routes/products.ts';
import cartWishlistRoutes from './routes/cartWishlist.ts';
import customerAccountRoutes from './routes/customerAccount.ts';
import customerOrdersRoutes from './routes/customerOrders.ts';
import adminProductRoutes from './routes/adminProducts.ts';
import adminCategoryRoutes from './routes/adminCategories.ts';
import adminOrderRoutes from './routes/adminOrders.ts';
import adminCustomerRoutes from './routes/adminCustomers.ts';
import adminDiscountRoutes from './routes/adminDiscounts.ts';
import adminInquiryRoutes from './routes/adminInquiries.ts';
import adminStaffRoutes from './routes/adminStaff.ts';
import adminSettingsRoutes, { publicSettingsRouter } from './routes/adminSettings.ts';
import adminDashboardRoutes from './routes/adminDashboard.ts';
import uploadRoutes from './routes/uploads.ts';
import enquiryRoutes from './routes/enquiries.ts';
import adminBannerRoutes from './routes/adminBanners.ts';
import publicBannerRoutes from './routes/banners.ts';
import sitemapRoutes from './routes/sitemap.ts';

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Strict CORS configuration
const allowedOrigins = (() => {
  const configured = process.env.ALLOWED_ORIGINS ?? '';
  const base = configured
    ? configured.split(',').map(s => s.trim().replace(/\/+$/, '')).filter(Boolean)
    : [];
  if (!isProd) {
    base.push('http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://localhost:3000');
  }
  const appUrl = process.env.APP_URL;
  if (appUrl) base.push(appUrl.trim().replace(/\/+$/, ''));
  return base;
})();

// CORS middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const normalizedOrigin = origin ? origin.replace(/\/+$/, '') : null;
  if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin)) {
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// Ensure MongoDB is connected on each incoming serverless request
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await connectMongoDB();
  } catch (err) {
    console.warn('[Vercel API] MongoDB connection attempt:', err instanceof Error ? err.message : err);
  }
  next();
});

// Sitemaps & robots.txt
app.use('/', sitemapRoutes);

// Health check
app.get(['/health', '/api/health'], (_req: Request, res: Response) => {
  const mongo = getMongoStatus();
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    service: BUSINESS.name,
    mongodb: mongo.state,
  });
});

// Mount all API routes with and without '/api' prefix for robust Vercel serverless routing
const routeConfigs = [
  { path: '/auth', router: authRoutes },
  { path: '/auth', router: authRecoveryRoutes },
  { path: '/cart', router: cartWishlistRoutes },
  { path: '/customer', router: cartWishlistRoutes },
  { path: '/customer', router: customerAccountRoutes },
  { path: '/orders', router: customerOrdersRoutes },
  { path: '/settings', router: publicSettingsRouter },
  { path: '/inquiries', router: adminInquiryRoutes },
  { path: '/contact', router: adminInquiryRoutes },
  { path: '/discounts', router: adminDiscountRoutes },
  { path: '/admin/dashboard', router: adminDashboardRoutes },
  { path: '/admin/staff', router: adminStaffRoutes },
  { path: '/admin/settings', router: adminSettingsRoutes },
  { path: '/admin/inquiries', router: adminInquiryRoutes },
  { path: '/admin/discounts', router: adminDiscountRoutes },
  { path: '/admin/customers', router: adminCustomerRoutes },
  { path: '/admin/orders', router: adminOrderRoutes },
  { path: '/admin/categories', router: adminCategoryRoutes },
  { path: '/admin/products', router: adminProductRoutes },
  { path: '/admin/banners', router: adminBannerRoutes },
  { path: '/banners', router: publicBannerRoutes },
  { path: '/admin/uploads', router: uploadRoutes },
  { path: '/', router: publicCatalogRoutes },
  { path: '/', router: enquiryRoutes },
];

for (const config of routeConfigs) {
  if (config.path === '/') {
    app.use('/', config.router);
    app.use('/api', config.router);
  } else {
    app.use(config.path, config.router);
    app.use(`/api${config.path}`, config.router);
  }
}

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Error]:', err.message);
  const message = isProd ? 'Internal server error.' : err.message || 'Internal server error.';
  res.status(500).json({ success: false, message });
});

export default app;
