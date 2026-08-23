import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import { connectMongoDB, getMongoStatus } from '../server/lib/mongodb.ts';
import { BUSINESS } from '../server/config.ts';

// Routes
import authRoutes from '../server/routes/auth.ts';
import authRecoveryRoutes from '../server/routes/authRecovery.ts';
import publicCatalogRoutes from '../server/routes/products.ts';
import cartWishlistRoutes from '../server/routes/cartWishlist.ts';
import customerAccountRoutes from '../server/routes/customerAccount.ts';
import customerOrdersRoutes from '../server/routes/customerOrders.ts';
import adminProductRoutes from '../server/routes/adminProducts.ts';
import adminCategoryRoutes from '../server/routes/adminCategories.ts';
import adminOrderRoutes from '../server/routes/adminOrders.ts';
import adminCustomerRoutes from '../server/routes/adminCustomers.ts';
import adminDiscountRoutes from '../server/routes/adminDiscounts.ts';
import adminInquiryRoutes from '../server/routes/adminInquiries.ts';
import adminStaffRoutes from '../server/routes/adminStaff.ts';
import adminSettingsRoutes, { publicSettingsRouter } from '../server/routes/adminSettings.ts';
import adminDashboardRoutes from '../server/routes/adminDashboard.ts';
import uploadRoutes from '../server/routes/uploads.ts';
import enquiryRoutes from '../server/routes/enquiries.ts';

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
app.get('/api/health', (_req: Request, res: Response) => {
  const mongo = getMongoStatus();
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    service: BUSINESS.name,
    mongodb: mongo.state,
  });
});

// Mount all API routes
app.use('/api', publicCatalogRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth', authRecoveryRoutes);
app.use('/api/cart', cartWishlistRoutes);
app.use('/api/customer', cartWishlistRoutes);
app.use('/api/customer', customerAccountRoutes);
app.use('/api/orders', customerOrdersRoutes);
app.use('/api/settings', publicSettingsRouter);
app.use('/api/inquiries', adminInquiryRoutes);
app.use('/api/contact', adminInquiryRoutes);
app.use('/api/discounts', adminDiscountRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/staff', adminStaffRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);
app.use('/api/admin/inquiries', adminInquiryRoutes);
app.use('/api/admin/discounts', adminDiscountRoutes);
app.use('/api/admin/customers', adminCustomerRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/uploads', uploadRoutes);
app.use('/api', enquiryRoutes);

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Error]:', err.message);
  res.status(500).json({ success: false, message: err.message || 'Internal server error.' });
});

export default app;
