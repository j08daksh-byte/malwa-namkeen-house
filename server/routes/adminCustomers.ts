import { Router } from 'express';
import type { Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.ts';
import { Order } from '../models/Order.ts';
import { requireAdmin, type AuthenticatedRequest } from '../lib/auth.ts';

const router = Router();

// Protect all admin customer endpoints
router.use(requireAdmin);

/**
 * GET /api/admin/customers
 * Query: search, status (all|active|inactive), sortBy (newest|name|totalSpent|orderCount), page, limit
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      search = '',
      status = 'all',
      sortBy = 'newest',
      page = '1',
      limit = '50',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    // Filter strictly for customers (never expose admins)
    const filter: Record<string, unknown> = { role: 'customer' };

    if (search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }

    if (status === 'active') {
      filter.active = true;
    } else if (status === 'inactive') {
      filter.active = false;
    }

    let sortObj: Record<string, 1 | -1> = { createdAt: -1 };
    if (sortBy === 'name') {
      sortObj = { name: 1 };
    }

    const [total, customersList] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('-password')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    // Aggregate orders summary per customer
    const customerIds = customersList.map(c => c._id);
    const customerEmails = customersList.map(c => c.email.toLowerCase());

    const orderAggregations = await Order.aggregate([
      {
        $match: {
          $or: [
            { customer: { $in: customerIds } },
            { 'customerInfo.email': { $in: customerEmails } },
          ],
        },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $ifNull: ['$customer', false] },
              '$customer',
              '$customerInfo.email',
            ],
          },
          orderCount: { $sum: 1 },
          totalSpent: {
            $sum: {
              $cond: [{ $in: ['$paymentStatus', ['paid']] }, '$total', 0],
            },
          },
          lastOrderDate: { $max: '$createdAt' },
        },
      },
    ]);

    const orderMap = new Map();
    orderAggregations.forEach(item => {
      orderMap.set(String(item._id), item);
    });

    const customers = customersList.map(c => {
      const { password, passwordHash, ...safeCust } = c as unknown as Record<string, unknown>;
      const byId = orderMap.get(String(safeCust._id));
      const byEmail = orderMap.get(String(safeCust.email || '').toLowerCase());
      const stats = byId || byEmail || { orderCount: 0, totalSpent: 0, lastOrderDate: null };

      return {
        ...safeCust,
        orderCount: stats.orderCount || 0,
        totalSpent: stats.totalSpent || 0,
        lastOrderDate: stats.lastOrderDate || null,
      };
    });

    // Optional sort by orderCount or totalSpent
    if (sortBy === 'totalSpent') {
      customers.sort((a, b) => b.totalSpent - a.totalSpent);
    } else if (sortBy === 'orderCount') {
      customers.sort((a, b) => b.orderCount - a.orderCount);
    }

    const [totalActive, totalCustomerCount] = await Promise.all([
      User.countDocuments({ role: 'customer', active: true }),
      User.countDocuments({ role: 'customer' }),
    ]);

    const totalLifetimeSpent = customers.reduce((acc, c) => acc + c.totalSpent, 0);

    res.json({
      success: true,
      customers,
      stats: {
        totalCustomers: totalCustomerCount,
        activeCustomers: totalActive,
        totalLifetimeSpent,
      },
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err: unknown) {
    console.error('[Admin Customers List Error]', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve customers.' });
  }
});

/**
 * GET /api/admin/customers/:id
 * Returns customer detail, saved addresses, and full order history.
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid customer ID.' });
      return;
    }

    const customer = await User.findOne({ _id: id, role: 'customer' }).select('-password').lean();
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found.' });
      return;
    }

    // Fetch customer orders
    const orders = await Order.find({
      $or: [{ customer: id }, { 'customerInfo.email': customer.email.toLowerCase() }],
    })
      .sort({ createdAt: -1 })
      .lean();

    const totalSpent = orders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.total, 0);

    const { password, passwordHash, ...safeCustomer } = customer as unknown as Record<string, unknown>;

    res.json({
      success: true,
      customer: {
        ...safeCustomer,
        orderCount: orders.length,
        totalSpent,
        orders,
      },
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: 'Failed to retrieve customer details.' });
  }
});

/**
 * PATCH /api/admin/customers/:id/toggle
 * Activate / Deactivate customer account.
 */
router.patch('/:id/toggle', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid customer ID.' });
      return;
    }

    const customer = await User.findOne({ _id: id, role: 'customer' });
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found.' });
      return;
    }

    customer.active = !customer.active;
    await customer.save();

    res.json({
      success: true,
      message: `Customer account is now ${customer.active ? 'Active' : 'Inactive'}.`,
      active: customer.active,
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: 'Failed to toggle customer status.' });
  }
});

/**
 * PUT /api/admin/customers/:id
 * Update customer profile details. Strictly prevents modifying role or password.
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid customer ID.' });
      return;
    }

    const { name, phone, active, addresses } = req.body;

    const customer = await User.findOne({ _id: id, role: 'customer' });
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found.' });
      return;
    }

    if (name) customer.name = String(name).trim();
    if (phone !== undefined) customer.phone = String(phone).trim();
    if (active !== undefined) customer.active = Boolean(active);
    if (Array.isArray(addresses)) customer.addresses = addresses;

    // Security guard: role is NEVER altered from customer
    customer.role = 'customer';

    await customer.save();

    res.json({
      success: true,
      message: 'Customer profile updated successfully.',
      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        active: customer.active,
        addresses: customer.addresses,
        createdAt: customer.createdAt,
      },
    });
  } catch (err: unknown) {
    console.error('[Update Customer Error]', err);
    res.status(400).json({ success: false, message: 'Failed to update customer profile.' });
  }
});

export default router;
