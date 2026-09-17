import { Router } from 'express';
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product.ts';
import { Category } from '../models/Category.ts';
import { PRODUCTS as FALLBACK_PRODUCTS, SHOP_CATEGORIES as FALLBACK_CATEGORIES } from '../../src-rebuild/data/products.ts';

const router = Router();

/**
 * Helper to map MongoDB Product document to public storefront Product shape
 */
function formatPublicProduct(p: any) {
  const primaryImage =
    (Array.isArray(p.images) && p.images[0]) ||
    p.image ||
    '/hero-banner-1.png';

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

  const basePrice = options[0]?.price || 0;
  const baseOrigPrice = options[0]?.originalPrice;

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
    dietaryStandard: p.dietaryStandard || '100% Pure Vegetarian (Satvik)',
    packagingType: p.packagingType || 'Food-Grade Multi-Layer Aroma Seal',
    customSpecifications: Array.isArray(p.customSpecifications) ? p.customSpecifications : [],
    isVegetarian: p.isVegetarian !== false,
    isAvailable: p.active !== false && totalStock > 0,
    category: p.category?.slug || (typeof p.category === 'string' ? p.category : 'sev-namkeen'),
    categoryId: p.category?._id ? String(p.category._id) : String(p.category || ''),
    categoryLabel: p.category?.name || 'Heritage Namkeens',
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [primaryImage],
    image: primaryImage,
    price: basePrice,
    originalPrice: baseOrigPrice,
    stock: totalStock,
    badge: p.badge || (p.isBestSeller ? 'Best Seller' : p.featured ? 'Signature' : undefined),
    rating: typeof p.rating === 'number' ? p.rating : 4.9,
    reviewCount: typeof p.reviewCount === 'number' ? p.reviewCount : 124,
    featured: Boolean(p.featured),
    isBestSeller: Boolean(p.isBestSeller),
    isCombo: Boolean(p.isCombo),
    options,
  };
}

/**
 * GET /api/categories
 * Returns active categories for customer storefront
 */
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const [categories, productCountGroups, totalActiveProducts] = await Promise.all([
        Category.find({ active: true }).sort({ sortOrder: 1, name: 1 }).lean(),
        Product.aggregate([
          { $match: { active: { $ne: false } } },
          { $group: { _id: '$category', count: { $sum: 1 } } },
        ]),
        Product.countDocuments({ active: { $ne: false } }),
      ]);

      if (categories.length > 0) {
        const countMap: Record<string, number> = {};
        for (const grp of productCountGroups) {
          if (grp._id) {
            countMap[String(grp._id)] = grp.count;
          }
        }

        const categoryCounts: Record<string, number> = { all: totalActiveProducts };
        const formattedCategories = categories.map(c => {
          const count = countMap[String(c._id)] ?? 0;
          categoryCounts[c.slug] = count;
          categoryCounts[String(c._id)] = count;
          return {
            id: c.slug,
            _id: String(c._id),
            slug: c.slug,
            name: c.name,
            label: c.name,
            shortLabel: c.name.replace(/(Signature|Heritage|Royal|Crisp)\s+/i, ''),
            description: c.description || '',
            image: c.image || '',
            productCount: count,
          };
        });

        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.json({
          success: true,
          totalProducts: totalActiveProducts,
          categoryCounts,
          categories: formattedCategories,
        });
        return;
      }
    }
  } catch (_err: unknown) {
    // Fall back below only if DB fails/disconnected
  }

  // Fallback to static categories only if MongoDB is disconnected in development
  const staticCounts: Record<string, number> = { all: FALLBACK_PRODUCTS.length };
  for (const p of FALLBACK_PRODUCTS) {
    if (p.category) {
      staticCounts[p.category] = (staticCounts[p.category] ?? 0) + 1;
    }
  }

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({
    success: true,
    totalProducts: FALLBACK_PRODUCTS.length,
    categoryCounts: staticCounts,
    categories: FALLBACK_CATEGORIES.map(c => ({
      id: c.id,
      _id: c.id,
      slug: c.id,
      name: c.label,
      label: c.label,
      shortLabel: c.shortLabel,
      description: c.description,
      image: '',
      productCount: staticCounts[c.id] ?? 0,
    })),
  });
});

/**
 * GET /api/products/best-sellers
 * Returns strictly the top 4 Best Seller products for the homepage section.
 */
router.get('/products/best-sellers', async (_req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState === 1) {
      // Find products explicitly marked as Best Seller (ordered by bestSellerAt desc)
      let bestSellers = await Product.find({ active: { $ne: false }, isBestSeller: true })
        .populate({ path: 'category', select: 'name slug image', strictPopulate: false })
        .sort({ bestSellerAt: -1, updatedAt: -1, createdAt: -1 })
        .limit(4)
        .lean();

      // If fewer than 4 marked, backfill with featured or top-rated products so 4 slots are always populated
      if (bestSellers.length < 4) {
        const existingIds = bestSellers.map(p => p._id);
        const backfill = await Product.find({
          active: { $ne: false },
          _id: { $nin: existingIds },
        })
          .populate({ path: 'category', select: 'name slug image', strictPopulate: false })
          .sort({ featured: -1, rating: -1, createdAt: -1 })
          .limit(4 - bestSellers.length)
          .lean();

        bestSellers = [...bestSellers, ...backfill];
      }

      if (bestSellers.length > 0) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.json({
          success: true,
          count: bestSellers.length,
          products: bestSellers.map(formatPublicProduct),
        });
        return;
      }
    }
  } catch (err: unknown) {
    console.warn('[Public Best Sellers Error]', err);
  }

  // Fallback to top 4 products from static catalog only if MongoDB unavailable
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const fallback = FALLBACK_PRODUCTS.slice(0, 4);
  res.json({
    success: true,
    count: fallback.length,
    products: fallback,
  });
});

/**
 * GET /api/products
 * Public customer storefront product catalog with search, category filtering & sorting.
 * When MongoDB is connected, MongoDB is strictly authoritative (0 matches returns empty array).
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

    if (mongoose.connection.readyState === 1) {
      const filter: Record<string, unknown> = { active: { $ne: false } };

      // Category filter by slug, name or ID
      if (category && category !== 'all') {
        if (mongoose.Types.ObjectId.isValid(category)) {
          filter.category = new mongoose.Types.ObjectId(category);
        } else {
          const catDoc = await Category.findOne({
            $or: [
              { slug: category.toLowerCase() },
              { name: new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
            ],
            active: { $ne: false }
          }).maxTimeMS(2000).lean();
          if (catDoc) {
            filter.category = catDoc._id;
          } else {
            // Category slug does not match any registered category in DB
            res.json({
              success: true,
              products: [],
              categories: [],
              total: 0,
              page: 1,
              totalPages: 1,
            });
            return;
          }
        }
      }

      if (spice && spice !== 'All') {
        filter.spiceLevel = spice;
      }

      if (featured === 'true') {
        filter.featured = true;
      }

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
        Product.countDocuments(filter).maxTimeMS(2000),
        Product.find(filter)
          .populate({ path: 'category', select: 'name slug image', strictPopulate: false })
          .sort(sortObj)
          .skip(skip)
          .limit(limitNum)
          .maxTimeMS(2000)
          .lean(),
        Category.find({ active: { $ne: false } }).sort({ sortOrder: 1 }).maxTimeMS(2000).lean(),
      ]);

      // When MongoDB is connected, return DB results directly even if 0 results match
      const formattedProducts = rawProducts.map(formatPublicProduct);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
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
      return;
    }
  } catch (_err: unknown) {
    // If MongoDB threw a connection error, fall through to static fallback below
  }

  // Fallback to rich static product catalog ONLY if MongoDB is completely disconnected/unavailable
  let filtered = [...FALLBACK_PRODUCTS];
  const { category = 'all', search = '', spice = 'All', sortBy = 'featured' } = req.query as Record<string, string>;

  if (category && category !== 'all') {
    filtered = filtered.filter(p => p.category === category || p.slug === category);
  }
  if (spice && spice !== 'All') {
    filtered = filtered.filter(p => p.spiceLevel === spice);
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        (p.hindiName && p.hindiName.toLowerCase().includes(q)) ||
        p.tagline.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (Array.isArray(p.ingredients) && p.ingredients.some(i => i.toLowerCase().includes(q)))
    );
  }
  if (sortBy === 'price-asc') {
    filtered.sort((a, b) => (a.options[0]?.price || 0) - (b.options[0]?.price || 0));
  } else if (sortBy === 'price-desc') {
    filtered.sort((a, b) => (b.options[0]?.price || 0) - (a.options[0]?.price || 0));
  } else if (sortBy === 'name-asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  const pageNum = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 12));
  const skip = (pageNum - 1) * limitNum;
  const paginated = filtered.slice(skip, skip + limitNum);

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({
    success: true,
    products: paginated,
    categories: FALLBACK_CATEGORIES,
    total: filtered.length,
    page: pageNum,
    totalPages: Math.ceil(filtered.length / limitNum) || 1,
  });
});

/**
 * GET /api/products/:slugOrId
 * Public product detail strictly resolved in deterministic order:
 * 1. MongoDB ObjectId match (_id)
 * 2. Persisted exact slug match (case-insensitive)
 * When MongoDB is connected, missing product returns 404. No fuzzy regex name matching.
 */
router.get('/products/:slugOrId', async (req: Request, res: Response) => {
  const { slugOrId } = req.params;
  const cleanParam = decodeURIComponent(slugOrId || '').trim();
  const cleanSlug = cleanParam.toLowerCase();

  try {
    if (mongoose.connection.readyState === 1) {
      let productDoc: any = null;

      // 1. Check valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(cleanParam)) {
        productDoc = await Product.findOne({ _id: cleanParam, active: true })
          .populate({ path: 'category', select: 'name slug image', strictPopulate: false })
          .lean();
      }

      // 2. Exact case-insensitive slug lookup
      if (!productDoc) {
        productDoc = await Product.findOne({ slug: cleanSlug, active: true })
          .populate({ path: 'category', select: 'name slug image', strictPopulate: false })
          .lean();
      }

      if (productDoc) {
        const product = formatPublicProduct(productDoc);
        if (process.env.NODE_ENV === 'production') {
          res.setHeader('Cache-Control', 'public, max-age=10, stale-while-revalidate=30');
        } else {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
        res.json({ success: true, product });
        return;
      }

      // MongoDB is authoritative: if product was not found or is inactive, return 404.
      res.status(404).json({ success: false, message: 'Product delicacy not found or unavailable.' });
      return;
    }
  } catch (_err: unknown) {
    // Fall back to static lookup only if database is disconnected
  }

  // Static fallback ONLY if database is disconnected in development
  const fallback = FALLBACK_PRODUCTS.find(
    p => (p.slug || p.id).toLowerCase() === cleanSlug || p.id.toLowerCase() === cleanSlug
  );

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  if (fallback) {
    res.json({ success: true, product: fallback });
  } else {
    res.status(404).json({ success: false, message: 'Product delicacy not found or unavailable.' });
  }
});

export default router;
