import { Router } from 'express';
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product.ts';
import { Category } from '../models/Category.ts';

const router = Router();

/**
 * Helper to map MongoDB Product document to public storefront Product shape
 */
function formatPublicProduct(p: any) {
  const primaryImage =
    (Array.isArray(p.images) && p.images[0]) ||
    p.image ||
    '/mishtichaat/chaat-plate.jpg';

  // Dynamic packaging options from MongoDB variants
  const activeVariants = Array.isArray(p.variants)
    ? p.variants.filter((v: any) => v.active !== false)
    : [];

  const options =
    activeVariants.length > 0
      ? activeVariants
          .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((v: any) => ({
            id: String(v._id || v.sku || v.label),
            weight: v.label || `${v.value || ''} ${v.unit || ''}`.trim() || 'Standard',
            price: typeof v.salePrice === 'number' && v.salePrice > 0 ? v.salePrice : v.price,
            originalPrice: typeof v.salePrice === 'number' && v.salePrice > 0 ? v.price : undefined,
            stock: typeof v.stock === 'number' ? v.stock : 100,
            sku: v.sku || '',
            active: v.active !== false,
          }))
      : [
          {
            id: 'std',
            weight: 'Standard (500g)',
            price: 150,
            originalPrice: undefined,
            stock: 50,
            sku: 'STD-500G',
            active: true,
          },
        ];

  const totalStock = options.reduce((sum: number, o: any) => sum + (o.stock || 0), 0);

  return {
    id: String(p._id),
    _id: String(p._id),
    slug: p.slug,
    name: p.name,
    hindiName: p.hindiName || '',
    tagline: p.tagline || '',
    description: p.description || '',
    story: p.story || '',
    ingredients: Array.isArray(p.ingredients) ? p.ingredients : [],
    spiceLevel: p.spiceLevel || 'Medium',
    shelfLife: p.shelfLife || '90 Days from manufacturing',
    oilUsed: p.oilUsed || '100% Pure Cold-Pressed Groundnut Oil',
    isVegetarian: p.isVegetarian !== false,
    isAvailable: p.active !== false && totalStock > 0,
    category: p.category?.slug || (typeof p.category === 'string' ? p.category : 'sev-namkeen'),
    categoryId: p.category?._id ? String(p.category._id) : String(p.category || ''),
    categoryLabel: p.category?.name || 'Heritage Namkeens',
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [primaryImage],
    image: primaryImage,
    badge: p.badge || (p.featured ? 'Signature' : undefined),
    rating: typeof p.rating === 'number' ? p.rating : 4.9,
    reviewCount: typeof p.reviewCount === 'number' ? p.reviewCount : 124,
    featured: Boolean(p.featured),
    options,
  };
}

/**
 * GET /api/categories
 * Returns active categories for customer storefront
 */
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await Category.find({ active: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
    res.json({
      success: true,
      categories: categories.map(c => ({
        id: c.slug,
        _id: String(c._id),
        slug: c.slug,
        name: c.name,
        label: c.name,
        shortLabel: c.name.replace(/(Signature|Heritage|Royal|Crisp)\s+/i, ''),
        description: c.description || '',
        image: c.image || '',
      })),
    });
  } catch (err: unknown) {
    console.error('[Public Categories Error]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
});

/**
 * GET /api/products
 * Public customer storefront product catalog with search, category filtering & sorting
 */
router.get('/products', async (req: Request, res: Response) => {
  try {
    const {
      category = 'all',
      search = '',
      spice = 'All',
      sortBy = 'featured',
      featured,
      page = '1',
      limit = '100',
    } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = { active: true };

    // Category filter by slug or ID
    if (category && category !== 'all') {
      if (mongoose.Types.ObjectId.isValid(category)) {
        filter.category = new mongoose.Types.ObjectId(category);
      } else {
        const catDoc = await Category.findOne({ slug: category.toLowerCase(), active: true }).lean();
        if (catDoc) {
          filter.category = catDoc._id;
        } else {
          // No matching category -> return empty list
          res.json({ success: true, products: [], total: 0 });
          return;
        }
      }
    }

    // Spice level filter
    if (spice && spice !== 'All') {
      filter.spiceLevel = spice;
    }

    // Featured filter
    if (featured === 'true') {
      filter.featured = true;
    }

    // Search query
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { hindiName: { $regex: q, $options: 'i' } },
        { tagline: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { ingredients: { $regex: q, $options: 'i' } },
      ];
    }

    // Sort order
    let sortObj: Record<string, 1 | -1> = { featured: -1, createdAt: -1 };
    if (sortBy === 'price-asc') {
      sortObj = { 'variants.0.price': 1 };
    } else if (sortBy === 'price-desc') {
      sortObj = { 'variants.0.price': -1 };
    } else if (sortBy === 'rating') {
      sortObj = { rating: -1 };
    } else if (sortBy === 'name-asc') {
      sortObj = { name: 1 };
    } else if (sortBy === 'newest') {
      sortObj = { createdAt: -1 };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 100));
    const skip = (pageNum - 1) * limitNum;

    const [total, rawProducts, allCategories] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .populate('category', 'name slug image')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Category.find({ active: true }).sort({ sortOrder: 1 }).lean(),
    ]);

    const formattedProducts = rawProducts.map(formatPublicProduct);

    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    res.json({
      success: true,
      products: formattedProducts,
      categories: allCategories.map(c => ({
        id: c.slug,
        _id: String(c._id),
        slug: c.slug,
        name: c.name,
        label: c.name,
      })),
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (err: unknown) {
    console.error('[Public Products Error]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch products catalog.' });
  }
});

/**
 * GET /api/products/:slugOrId
 * Public product detail by slug or ID
 */
router.get('/products/:slugOrId', async (req: Request, res: Response) => {
  try {
    const { slugOrId } = req.params;

    let productDoc: any = null;

    if (mongoose.Types.ObjectId.isValid(slugOrId)) {
      productDoc = await Product.findOne({ _id: slugOrId, active: true })
        .populate('category', 'name slug image')
        .lean();
    }

    if (!productDoc) {
      productDoc = await Product.findOne({ slug: slugOrId.toLowerCase(), active: true })
        .populate('category', 'name slug image')
        .lean();
    }

    if (!productDoc) {
      res.status(404).json({ success: false, message: 'Product delicacy not found or unavailable.' });
      return;
    }

    const product = formatPublicProduct(productDoc);
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    res.json({ success: true, product });
  } catch (err: unknown) {
    console.error('[Product Detail Error]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch product details.' });
  }
});

export default router;
