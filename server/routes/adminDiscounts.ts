import { Router } from 'express';
import type { Response } from 'express';
import mongoose from 'mongoose';
import { Discount, type DiscountType } from '../models/Discount.ts';
import { requireAdmin, type AuthenticatedRequest } from '../lib/auth.ts';
import { validateAndCalculateDiscount } from '../lib/discounts.ts';

const router = Router();

/**
 * Public/Customer coupon validation route
 * POST /api/discounts/validate (or /api/admin/discounts/validate)
 */
router.post('/validate', async (req, res: Response) => {
  try {
    const { code, subtotal } = req.body;
    const result = await validateAndCalculateDiscount(code, Number(subtotal) || 0);

    if (!result.valid) {
      res.status(400).json({
        success: false,
        valid: false,
        message: result.message,
        discountAmount: 0,
      });
      return;
    }

    res.json({
      success: true,
      valid: true,
      code: result.code,
      discountAmount: result.discountAmount,
      type: result.discount?.type,
      value: result.discount?.value,
      message: `Coupon "${result.code}" applied successfully! You save ₹${result.discountAmount}.`,
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: 'Failed to validate coupon.' });
  }
});

// Enforce requireAdmin on all administrative CRUD endpoints
router.use(requireAdmin);

/**
 * GET /api/admin/discounts
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search = '', status = 'all', type = 'all' } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = {};

    if (search.trim()) {
      filter.code = { $regex: search.trim().toUpperCase(), $options: 'i' };
    }

    const now = new Date();

    if (status === 'active') {
      filter.active = true;
      filter.$or = [{ endDate: null }, { endDate: { $gte: now } }];
    } else if (status === 'inactive') {
      filter.active = false;
    } else if (status === 'expired') {
      filter.endDate = { $lt: now };
    }

    if (type === 'percentage' || type === 'fixed') {
      filter.type = type;
    }

    const discounts = await Discount.find(filter).sort({ createdAt: -1 }).lean();

    // Summary statistics
    const totalCoupons = await Discount.countDocuments();
    const activeCoupons = await Discount.countDocuments({
      active: true,
      $or: [{ endDate: null }, { endDate: { $gte: now } }],
    });
    const totalRedemptions = discounts.reduce((sum, d) => sum + (d.usedCount || 0), 0);

    res.json({
      success: true,
      discounts,
      stats: {
        totalCoupons,
        activeCoupons,
        totalRedemptions,
      },
    });
  } catch (err: unknown) {
    console.error('[Admin Discounts List Error]', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve discounts.' });
  }
});

/**
 * GET /api/admin/discounts/:id
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid discount ID.' });
      return;
    }

    const discount = await Discount.findById(id).lean();
    if (!discount) {
      res.status(404).json({ success: false, message: 'Discount coupon not found.' });
      return;
    }

    res.json({ success: true, discount });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: 'Failed to retrieve discount.' });
  }
});

/**
 * POST /api/admin/discounts
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      code,
      type = 'percentage',
      value,
      minimumOrder = 0,
      maximumDiscount,
      active = true,
      startDate,
      endDate,
      usageLimit,
      usageLimitPerUser = 1,
    } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      res.status(400).json({ success: false, message: 'Coupon code is required.' });
      return;
    }

    const normalizedCode = code.trim().toUpperCase().replace(/\s+/g, '');

    // Check code uniqueness
    const existing = await Discount.findOne({ code: normalizedCode });
    if (existing) {
      res.status(409).json({
        success: false,
        message: `Coupon code "${normalizedCode}" already exists. Please choose a unique code.`,
      });
      return;
    }

    const numericValue = Number(value);
    if (isNaN(numericValue) || numericValue <= 0) {
      res.status(400).json({ success: false, message: 'Discount value must be greater than 0.' });
      return;
    }

    if (type === 'percentage' && numericValue > 100) {
      res.status(400).json({ success: false, message: 'Percentage discount cannot exceed 100%.' });
      return;
    }

    const newDiscount = await Discount.create({
      code: normalizedCode,
      type: type === 'fixed' ? 'fixed' : 'percentage',
      value: numericValue,
      minimumOrder: Math.max(0, Number(minimumOrder) || 0),
      maximumDiscount:
        type === 'percentage' && maximumDiscount && Number(maximumDiscount) > 0
          ? Number(maximumDiscount)
          : null,
      active: Boolean(active),
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      usageLimit: usageLimit && Number(usageLimit) > 0 ? Number(usageLimit) : null,
      usageLimitPerUser: Number(usageLimitPerUser) || 1,
      usedCount: 0,
    });

    res.status(201).json({
      success: true,
      message: `Coupon "${normalizedCode}" created successfully.`,
      discount: newDiscount,
    });
  } catch (err: unknown) {
    console.error('[Create Discount Error]', err);
    const msg = err instanceof Error ? err.message : 'Failed to create discount coupon.';
    res.status(400).json({ success: false, message: msg });
  }
});

/**
 * PUT /api/admin/discounts/:id
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid discount ID.' });
      return;
    }

    const {
      code,
      type,
      value,
      minimumOrder,
      maximumDiscount,
      active,
      startDate,
      endDate,
      usageLimit,
      usageLimitPerUser,
    } = req.body;

    const discount = await Discount.findById(id);
    if (!discount) {
      res.status(404).json({ success: false, message: 'Discount coupon not found.' });
      return;
    }

    if (code) {
      const normalizedCode = String(code).trim().toUpperCase().replace(/\s+/g, '');
      if (normalizedCode !== discount.code) {
        const duplicate = await Discount.findOne({ code: normalizedCode, _id: { $ne: id } });
        if (duplicate) {
          res.status(409).json({ success: false, message: `Coupon code "${normalizedCode}" is already in use.` });
          return;
        }
        discount.code = normalizedCode;
      }
    }

    if (type === 'percentage' || type === 'fixed') {
      discount.type = type;
    }

    if (value !== undefined) {
      const numVal = Number(value);
      if (isNaN(numVal) || numVal <= 0) {
        res.status(400).json({ success: false, message: 'Discount value must be positive.' });
        return;
      }
      if (discount.type === 'percentage' && numVal > 100) {
        res.status(400).json({ success: false, message: 'Percentage discount cannot exceed 100%.' });
        return;
      }
      discount.value = numVal;
    }

    if (minimumOrder !== undefined) discount.minimumOrder = Math.max(0, Number(minimumOrder) || 0);
    if (maximumDiscount !== undefined) {
      discount.maximumDiscount = Number(maximumDiscount) > 0 ? Number(maximumDiscount) : undefined;
    }
    if (active !== undefined) discount.active = Boolean(active);
    if (startDate !== undefined) discount.startDate = startDate ? new Date(startDate) : undefined;
    if (endDate !== undefined) discount.endDate = endDate ? new Date(endDate) : undefined;
    if (usageLimit !== undefined) {
      discount.usageLimit = Number(usageLimit) > 0 ? Number(usageLimit) : undefined;
    }
    if (usageLimitPerUser !== undefined) {
      discount.usageLimitPerUser = Number(usageLimitPerUser) || 1;
    }

    await discount.save();

    res.json({
      success: true,
      message: `Coupon "${discount.code}" updated successfully.`,
      discount,
    });
  } catch (err: unknown) {
    console.error('[Update Discount Error]', err);
    res.status(400).json({ success: false, message: 'Failed to update discount coupon.' });
  }
});

/**
 * PATCH /api/admin/discounts/:id/toggle
 */
router.patch('/:id/toggle', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid discount ID.' });
      return;
    }

    const discount = await Discount.findById(id);
    if (!discount) {
      res.status(404).json({ success: false, message: 'Discount not found.' });
      return;
    }

    discount.active = !discount.active;
    await discount.save();

    res.json({
      success: true,
      message: `Coupon "${discount.code}" is now ${discount.active ? 'Active' : 'Inactive'}.`,
      active: discount.active,
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: 'Failed to toggle discount status.' });
  }
});

/**
 * DELETE /api/admin/discounts/:id
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid discount ID.' });
      return;
    }

    const discount = await Discount.findByIdAndDelete(id);
    if (!discount) {
      res.status(404).json({ success: false, message: 'Discount not found.' });
      return;
    }

    res.json({
      success: true,
      message: `Coupon "${discount.code}" deleted successfully.`,
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: 'Failed to delete discount.' });
  }
});

export default router;
