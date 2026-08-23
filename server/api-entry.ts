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

const app = express();

// CORS middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
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
  res.status(500).json({ success: false, message: err.message || 'Internal server error.' });
});

export default app;
