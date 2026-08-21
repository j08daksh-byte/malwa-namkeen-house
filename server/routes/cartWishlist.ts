import { Router } from 'express';
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product.ts';
import { User } from '../models/User.ts';
import { validateAndCalculateDiscount } from '../lib/discounts.ts';
import { requireAuth, type AuthenticatedRequest } from '../lib/auth.ts';

const router = Router();

export interface CartRevalidateItemInput {
  productId: string;
  variantId?: string;
  weight?: string;
  sku?: string;
  quantity: number;
  price: number;
}

/**
 * Public Cart Revalidation Engine
 * POST /api/cart/revalidate
 * Checks live existence, active status, variant pricing, and stock limits.
 */
router.post('/revalidate', async (req: Request, res: Response) => {
  try {
    const { items = [], couponCode = '' } = req.body as {
      items: CartRevalidateItemInput[];
      couponCode?: string;
    };

    if (!Array.isArray(items) || items.length === 0) {
      res.json({
        success: true,
        valid: true,
        items: [],
        adjustments: [],
        subtotal: 0,
        discountAmount: 0,
        total: 0,
      });
      return;
    }

    const productIds = [
      ...new Set(items.map(it => it.productId).filter(id => mongoose.Types.ObjectId.isValid(id))),
    ];

    const products = await Product.find({
      _id: { $in: productIds },
      active: true,
    })
      .populate('category', 'name slug')
      .lean();

    const productMap = new Map<string, any>(products.map(p => [String(p._id), p]));

    const validatedItems: any[] = [];
    const adjustments: string[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);

      if (!product) {
        adjustments.push(`A product in your cart is no longer available and has been removed.`);
        continue;
      }

      // Find matching variant by variantId, sku, or weight/label
      let variant: any = null;
      if (Array.isArray(product.variants)) {
        if (item.variantId) {
          variant = product.variants.find(
            (v: any) => String(v._id) === item.variantId && v.active !== false
          );
        }
        if (!variant && item.sku) {
          variant = product.variants.find(
            (v: any) => v.sku === item.sku && v.active !== false
          );
        }
        if (!variant && item.weight) {
          variant = product.variants.find(
            (v: any) => (v.label === item.weight || `${v.value || ''} ${v.unit || ''}`.trim() === item.weight) && v.active !== false
          );
        }
        if (!variant && product.variants.length > 0) {
          variant = product.variants.find((v: any) => v.active !== false) || product.variants[0];
        }
      }

      if (!variant) {
        adjustments.push(`Selected packaging for "${product.name}" is currently unavailable.`);
        continue;
      }

      const availableStock = typeof variant.stock === 'number' ? variant.stock : 100;
      if (availableStock <= 0) {
        adjustments.push(`"${product.name} (${variant.label})" is currently out of stock.`);
        continue;
      }

      let quantity = Math.max(1, parseInt(String(item.quantity), 10) || 1);
      if (quantity > availableStock) {
        adjustments.push(
          `Quantity for "${product.name} (${variant.label})" was reduced to available stock (${availableStock}).`
        );
        quantity = availableStock;
      }

      const livePrice =
        typeof variant.salePrice === 'number' && variant.salePrice > 0
          ? variant.salePrice
          : variant.price;

      if (livePrice !== item.price) {
        adjustments.push(
          `Price for "${product.name} (${variant.label})" was updated from ₹${item.price} to current price ₹${livePrice}.`
        );
      }

      const primaryImage =
        (Array.isArray(product.images) && product.images[0]) ||
        product.image ||
        '/mishtichaat/chaat-plate.jpg';

      validatedItems.push({
        productId: String(product._id),
        variantId: String(variant._id || variant.sku || variant.label),
        productName: product.name,
        hindiName: product.hindiName || '',
        variantLabel: variant.label || `${variant.value || ''} ${variant.unit || ''}`.trim() || 'Standard',
        sku: variant.sku || '',
        price: livePrice,
        originalPrice: typeof variant.salePrice === 'number' && variant.salePrice > 0 ? variant.price : undefined,
        quantity,
        itemTotal: Math.round(livePrice * quantity * 100) / 100,
        stock: availableStock,
        image: primaryImage,
      });
    }

    const subtotal = validatedItems.reduce((sum, it) => sum + it.itemTotal, 0);

    // Validate Coupon if provided
    let discountAmount = 0;
    let validatedCoupon: any = null;
    let couponError: string | null = null;

    if (couponCode && couponCode.trim()) {
      const discResult = await validateAndCalculateDiscount(couponCode.trim(), subtotal);
      if (discResult.valid) {
        discountAmount = discResult.discountAmount;
        validatedCoupon = discResult.discount;
      } else {
        couponError = discResult.message;
      }
    }

    const finalTotal = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

    res.json({
      success: true,
      valid: adjustments.length === 0,
      items: validatedItems,
      adjustments,
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount,
      coupon: validatedCoupon
        ? {
            code: validatedCoupon.code,
            type: validatedCoupon.type,
            value: validatedCoupon.value,
          }
        : null,
      couponError,
      total: finalTotal,
    });
  } catch (err: unknown) {
    console.error('[Cart Revalidation Error]', err);
    res.status(500).json({ success: false, message: 'Failed to revalidate cart.' });
  }
});

// ─── Customer Wishlist Endpoints (Authenticated) ─────────────────────────────

/**
 * GET /api/customer/wishlist
 * Returns the customer's saved wishlist products.
 */
router.get('/wishlist', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.userId)
      .populate({
        path: 'wishlist',
        match: { active: true },
        select: 'name slug hindiName tagline description images variants rating reviewCount price',
      })
      .lean();

    if (!user) {
      res.status(404).json({ success: false, message: 'Customer account not found.' });
      return;
    }

    const wishlistProducts = (user.wishlist || []).filter(Boolean);

    res.json({
      success: true,
      wishlist: wishlistProducts,
      productIds: wishlistProducts.map((p: any) => String(p._id)),
    });
  } catch (err: unknown) {
    console.error('[Get Wishlist Error]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch wishlist.' });
  }
});

/**
 * POST /api/customer/wishlist/toggle
 * Adds or removes a product from the customer's wishlist.
 */
router.post('/wishlist/toggle', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.body;
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ success: false, message: 'Valid productId is required.' });
      return;
    }

    const user = await User.findById(req.user?.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'Customer account not found.' });
      return;
    }

    const currentList = (user.wishlist || []).map(id => String(id));
    const exists = currentList.includes(productId);

    if (exists) {
      user.wishlist = (user.wishlist || []).filter(id => String(id) !== productId);
    } else {
      user.wishlist = [...(user.wishlist || []), new mongoose.Types.ObjectId(productId)];
    }

    await user.save();

    res.json({
      success: true,
      inWishlist: !exists,
      productIds: (user.wishlist || []).map(id => String(id)),
      message: !exists ? 'Added to your Wishlist.' : 'Removed from your Wishlist.',
    });
  } catch (err: unknown) {
    console.error('[Toggle Wishlist Error]', err);
    res.status(500).json({ success: false, message: 'Failed to update wishlist.' });
  }
});

/**
 * POST /api/customer/wishlist/sync
 * Merges guest local wishlist into customer's authenticated account.
 */
router.post('/wishlist/sync', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productIds = [] } = req.body as { productIds: string[] };

    const validIds = productIds.filter(id => mongoose.Types.ObjectId.isValid(id));

    const user = await User.findById(req.user?.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'Customer account not found.' });
      return;
    }

    const existingStrings = new Set((user.wishlist || []).map(id => String(id)));
    for (const id of validIds) {
      if (!existingStrings.has(id)) {
        user.wishlist?.push(new mongoose.Types.ObjectId(id));
        existingStrings.add(id);
      }
    }

    await user.save();

    res.json({
      success: true,
      productIds: Array.from(existingStrings),
      message: 'Wishlist synchronized.',
    });
  } catch (err: unknown) {
    console.error('[Sync Wishlist Error]', err);
    res.status(500).json({ success: false, message: 'Failed to sync wishlist.' });
  }
});

export default router;
