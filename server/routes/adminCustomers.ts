import { Router } from 'express';
import type { Response } from 'express';
import mongoose from 'mongoose';
import { User, type UserRole } from '../models/User.ts';
import { Order } from '../models/Order.ts';
import { requireAdmin, requireSuperAdmin, type AuthenticatedRequest } from '../lib/auth.ts';
import { AuditLog } from '../models/AuditLog.ts';
import { sendRoleChangedNotification } from '../lib/emailService.ts';
import { getDesignatedAdminEmails } from '../lib/mongodb.ts';

const router = Router();

// Protect all admin customer endpoints with requireAdmin
router.use(requireAdmin);

/**
 * GET /api/admin/customers
 * Query: search, status (all|active|inactive), role (customer|admin|all), sortBy (newest|name|totalSpent|orderCount), page, limit
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      search = '',
      status = 'all',
      role = 'customer',
      sortBy = 'newest',
      page = '1',
      limit = '50',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    // Filter by role (default to registered customers; can inspect all or promoted admins)
    const filter: Record<string, unknown> = {};
    if (role === 'all') {
      // all users
    } else if (role === 'admin') {
      filter.role = { $in: ['admin', 'super_admin'] };
    } else {
      filter.role = 'customer';
    }

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
      User.countDocuments(filter).maxTimeMS(5000),
      User.find(filter)
        .select('-password')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .maxTimeMS(5000)
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
    ]).option({ maxTimeMS: 5000 });

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

    const customer = await User.findById(id).select('-password -passwordResetTokenHash').lean();
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

    const customer = await User.findById(id);
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
 * PATCH /api/admin/customers/:id/role
 * Promotes a customer to admin or super_admin, or demotes back to customer.
 * Strictly protected by requireSuperAdmin on the backend.
 */
router.patch('/:id/role', requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid customer ID.' });
      return;
    }

    if (!role || (role !== 'admin' && role !== 'customer' && role !== 'super_admin')) {
      res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "admin", "customer", or "super_admin".',
      });
      return;
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      res.status(404).json({ success: false, message: 'Customer account not found.' });
      return;
    }

    const oldRole = targetUser.role;

    if (oldRole === role) {
      res.status(400).json({
        success: false,
        message: `User already possesses the "${role}" role.`,
      });
      return;
    }

    // Safety checks when demoting from super_admin
    if (oldRole === 'super_admin' && role !== 'super_admin') {
      const designatedEmails = getDesignatedAdminEmails();
      if (designatedEmails.includes(targetUser.email.toLowerCase())) {
        res.status(400).json({
          success: false,
          message: 'Operation prohibited: Cannot demote designated store owner.',
        });
        return;
      }

      const activeSuperAdmins = await User.countDocuments({
        role: 'super_admin',
        active: true,
      });

      if (activeSuperAdmins <= 1) {
        res.status(400).json({
          success: false,
          message: 'Operation prohibited: Cannot demote the last remaining active Super Administrator.',
        });
        return;
      }
    }

    // Prevent self-demotion
    if (req.user?.userId === String(targetUser._id) && role === 'customer') {
      res.status(400).json({
        success: false,
        message: 'Operation prohibited: You cannot revoke your own administrator privileges.',
      });
      return;
    }

    targetUser.role = role as UserRole;
    if (role !== 'customer') {
      targetUser.active = true;
    }
    await targetUser.save();

    // 1. Audit Log: ROLE_CHANGED
    try {
      await AuditLog.create({
        action: 'ROLE_CHANGED',
        actorId: req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : undefined,
        targetUserId: targetUser._id,
        metadata: {
          oldRole,
          newRole: targetUser.role,
          email: targetUser.email,
          promotedFromCustomer: oldRole === 'customer',
          timestamp: new Date(),
        },
      });
    } catch (logErr) {
      console.warn('[AuditLog Warning] Failed to log customer role change:', logErr);
    }

    // 2. Dispatch role update notification email
    let emailDispatched = false;
    let simulatedEmail = false;
    try {
      const emailRes = await sendRoleChangedNotification({
        email: targetUser.email,
        name: targetUser.name,
        oldRole,
        newRole: targetUser.role,
      });
      emailDispatched = Boolean(emailRes.success);
      simulatedEmail = Boolean(emailRes.simulated);
    } catch (emailErr) {
      console.error('[Role Change Notification Error]', emailErr);
    }

    res.json({
      success: true,
      message: `User ${targetUser.email} role updated to ${role} successfully.`,
      roleChanged: true,
      emailDispatched,
      simulated: simulatedEmail,
      customer: {
        _id: String(targetUser._id),
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        active: targetUser.active,
        updatedAt: targetUser.updatedAt,
      },
    });
  } catch (err: unknown) {
    console.error('[Admin Customer Role Update Error]', err);
    res.status(500).json({ success: false, message: 'Failed to update customer role.' });
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
