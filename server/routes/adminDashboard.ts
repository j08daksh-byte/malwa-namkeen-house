import { Router } from 'express';
import type { Response } from 'express';
import { requireAdmin, type AuthenticatedRequest } from '../lib/auth.ts';
import { Order } from '../models/Order.ts';
import { Product } from '../models/Product.ts';
import { User } from '../models/User.ts';
import { Category } from '../models/Category.ts';
import { Discount } from '../models/Discount.ts';
import { Inquiry } from '../models/Inquiry.ts';

const router = Router();

// Protect dashboard route with requireAdmin
router.use(requireAdmin);

/**
 * GET /api/admin/dashboard/stats
 * Aggregates live business analytics from MongoDB.
 */
router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { range = '30d' } = req.query as { range?: string };

    const now = new Date();
    let startDate = new Date();
    if (range === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === '7d') {
      startDate.setDate(now.getDate() - 7);
    } else if (range === '90d') {
      startDate.setDate(now.getDate() - 90);
    } else {
      // 30d default
      startDate.setDate(now.getDate() - 30);
    }

    const [
      totalOrders,
      pendingOrders,
      paidRevenueAgg,
      totalCustomers,
      totalProducts,
      activeProducts,
      totalCategories,
      activeDiscounts,
      newInquiries,
      statusBreakdownAgg,
      recentOrdersRaw,
      recentCustomers,
      recentInquiries,
      allProductsForStock,
      trendsAgg,
    ] = await Promise.all([
      // Total orders count
      Order.countDocuments(),

      // Orders needing fulfillment attention
      Order.countDocuments({ orderStatus: { $in: ['pending', 'confirmed', 'processing'] } }),

      // Revenue aggregation for paid/confirmed orders
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            paidCount: { $sum: 1 },
          },
        },
      ]),

      // Total registered customers
      User.countDocuments({ role: 'customer' }),

      // Products
      Product.countDocuments(),
      Product.countDocuments({ active: true }),

      // Categories
      Category.countDocuments({ active: true }),

      // Discounts
      Discount.countDocuments({ active: true }),

      // New unread inquiries
      Inquiry.countDocuments({ status: 'new' }),

      // Order status breakdown
      Order.aggregate([
        {
          $group: {
            _id: '$orderStatus',
            count: { $sum: 1 },
          },
        },
      ]),

      // Recent 6 orders
      Order.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .select('orderNumber customerInfo total orderStatus paymentStatus items createdAt')
        .lean(),

      // Recent 5 customers
      User.find({ role: 'customer' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email phone active createdAt')
        .lean(),

      // Recent 5 inquiries
      Inquiry.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email phone category message status createdAt')
        .lean(),

      // Products for low-stock scanning
      Product.find({ active: true }).select('name slug variants').lean(),

      // Daily trends for the selected range
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            orders: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$total', 0],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const totalRevenue = paidRevenueAgg[0]?.totalRevenue || 0;
    const paidCount = paidRevenueAgg[0]?.paidCount || 0;
    const averageOrderValue = paidCount > 0 ? Math.round((totalRevenue / paidCount) * 100) / 100 : 0;

    // Build status breakdown map with defaults
    const statusMap: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const item of statusBreakdownAgg) {
      if (item._id) statusMap[item._id] = item.count;
    }

    // Extract low-stock variants (stock <= 15)
    interface LowStockItem {
      productId: string;
      productName: string;
      variantLabel: string;
      sku: string;
      stock: number;
    }
    const lowStockItems: LowStockItem[] = [];
    for (const p of allProductsForStock) {
      if (Array.isArray(p.variants)) {
        for (const v of p.variants) {
          if (v.active !== false && typeof v.stock === 'number' && v.stock <= 15) {
            lowStockItems.push({
              productId: String(p._id),
              productName: p.name,
              variantLabel: v.label || `${v.value || ''} ${v.unit || ''}`.trim() || 'Standard',
              sku: v.sku || 'N/A',
              stock: v.stock,
            });
          }
        }
      }
    }

    // Format recent orders
    const recentOrders = recentOrdersRaw.map(o => ({
      _id: o._id,
      orderNumber: o.orderNumber,
      customerName: o.customerInfo?.name || 'Guest Patron',
      customerPhone: o.customerInfo?.phone || '',
      total: o.total,
      orderStatus: o.orderStatus,
      paymentStatus: o.paymentStatus,
      itemsCount: Array.isArray(o.items) ? o.items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) : 0,
      createdAt: o.createdAt,
    }));

    res.json({
      success: true,
      metrics: {
        totalRevenue,
        averageOrderValue,
        totalOrders,
        pendingOrders,
        totalCustomers,
        totalProducts,
        activeProducts,
        totalCategories,
        activeDiscounts,
        newInquiries,
      },
      statusBreakdown: statusMap,
      lowStockItems: lowStockItems.slice(0, 8),
      recentOrders,
      recentCustomers,
      recentInquiries,
      trends: trendsAgg.map(t => ({
        date: t._id,
        orders: t.orders,
        revenue: t.revenue,
      })),
    });
  } catch (err: unknown) {
    console.error('[Admin Dashboard Stats Error]', err);
    res.status(500).json({ success: false, message: 'Failed to aggregate dashboard analytics.' });
  }
});

export default router;
