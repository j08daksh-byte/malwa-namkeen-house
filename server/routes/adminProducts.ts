import { Router } from 'express';
import type { Response } from 'express';
import mongoose from 'mongoose';
import { Product, type IProductVariant } from '../models/Product.ts';
import { Category } from '../models/Category.ts';
import { requireAdmin, type AuthenticatedRequest } from '../lib/auth.ts';
import { PRODUCTS, SHOP_CATEGORIES } from '../../src-rebuild/data/products.ts';

const router = Router();

// Protect all product management endpoints with requireAdmin
router.use(requireAdmin);

/**
 * Helper to ensure at most 4 products are marked as Best Seller.
 * When a new product is added/marked as Best Seller, the oldest one is automatically demoted.
 */
async function enforceMaxBestSellers(currentProductId?: any) {
  try {
    const filter: Record<string, unknown> = { isBestSeller: true };
    if (currentProductId) {
      filter._id = { $ne: currentProductId };
    }
    const existingBestSellers = await Product.find(filter)
      .sort({ bestSellerAt: -1, updatedAt: -1, createdAt: -1 });

    if (existingBestSellers.length >= 4) {
      const toDemote = existingBestSellers.slice(3); // Keep only top 3 so adding 1 makes exactly 4
      if (toDemote.length > 0) {
        const demoteIds = toDemote.map(p => p._id);
        await Product.updateMany(
          { _id: { $in: demoteIds } },
          { $set: { isBestSeller: false } }
        );
      }
    }
  } catch (err) {
    console.warn('[BestSellers] Warning while enforcing max 4:', err);
  }
}

/**
 * Helper to ensure starter categories and products are seeded if the database is fresh.
 */
async function ensureInitialSeed() {
  const catCount = await Category.countDocuments();
  if (catCount === 0) {
    const categoriesToSeed = SHOP_CATEGORIES.filter(c => c.id !== 'all').map((c, i) => ({
      name: c.label,
      slug: c.id,
      description: c.description,
      active: true,
      sortOrder: i,
    }));
    await Category.insertMany(categoriesToSeed);
  }

  const prodCount = await Product.countDocuments();
  if (prodCount === 0) {
    const allCats = await Category.find();
    const catMap = new Map(allCats.map(c => [c.slug, c._id]));

    const productsToSeed = PRODUCTS.map((p, idx) => {
      const catId = catMap.get(p.category) || allCats[0]._id;
      return {
        name: p.name,
        slug: `${p.id}-${Date.now().toString(36).slice(-4)}`,
        hindiName: p.hindiName || '',
        tagline: p.tagline || '',
        description: p.description,
        story: p.story || '',
        ingredients: p.ingredients || [],
        spiceLevel: p.spiceLevel || 'Medium',
        shelfLife: p.shelfLife || '90 Days',
        oilUsed: p.oilUsed || 'Pure Groundnut Oil',
        isVegetarian: p.isVegetarian ?? true,
        category: catId,
        images: [p.image],
        badge: p.badge || (idx < 4 ? 'Best Seller' : ''),
        featured: idx < 4,
        isBestSeller: idx < 4,
        bestSellerAt: idx < 4 ? new Date(Date.now() - idx * 1000) : null,
        active: p.isAvailable ?? true,
        rating: p.rating || 4.9,
        reviewCount: p.reviewCount || 42,
        variants: p.options.map((opt, vIdx) => ({
          label: opt.weight,
          value: parseFloat(opt.weight) || 250,
          unit: opt.weight.replace(/^[0-9.]+/, '').trim() || 'g',
          price: opt.price,
          salePrice: opt.originalPrice && opt.originalPrice > opt.price ? opt.price : undefined,
          stock: 50,
          sku: `MLW-${p.id.slice(0, 4).toUpperCase()}-${opt.weight.replace(/\s+/g, '').toUpperCase()}`,
          active: true,
          sortOrder: vIdx,
        })),
      };
    });

    if (productsToSeed.length > 0) {
      await Product.insertMany(productsToSeed);
    }
  }
}

/**
 * GET /api/admin/products/categories/list
 * Returns category list for dropdowns.
 */
router.get('/categories/list', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureInitialSeed();
    const categories = await Category.find({ active: true }).sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, categories });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /api/admin/products
 * Query: search, category, status (all|active|inactive), page, limit, sortBy
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureInitialSeed();

    const {
      search = '',
      category = '',
      status = 'all',
      sortBy = 'newest',
      page = '1',
      limit = '50',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    // Filter query
    const filter: Record<string, unknown> = {};

    if (search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { hindiName: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { 'variants.sku': { $regex: q, $options: 'i' } },
        { 'variants.label': { $regex: q, $options: 'i' } },
      ];
    }

    if (category && category !== 'all') {
      if (mongoose.Types.ObjectId.isValid(category)) {
        filter.category = new mongoose.Types.ObjectId(category);
      } else {
        const cat = await Category.findOne({ slug: category });
        if (cat) filter.category = cat._id;
      }
    }

    if (status === 'active') {
      filter.active = true;
    } else if (status === 'inactive') {
      filter.active = false;
    }

    // Sort order
    let sortObj: Record<string, 1 | -1> = { createdAt: -1 };
    if (sortBy === 'name') {
      sortObj = { name: 1 };
    } else if (sortBy === 'priceAsc') {
      sortObj = { 'variants.0.price': 1 };
    } else if (sortBy === 'priceDesc') {
      sortObj = { 'variants.0.price': -1 };
    } else if (sortBy === 'rating') {
      sortObj = { rating: -1 };
    }

    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .populate('category', 'name slug')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err: unknown) {
    console.error('[Admin Products List Error]', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve products.' });
  }
});

/**
 * GET /api/admin/products/:id
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid product ID format.' });
      return;
    }

    const product = await Product.findById(id).populate('category');
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    res.json({ success: true, product });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: 'Failed to retrieve product details.' });
  }
});

/**
 * Helper to generate slug from name
 */
function createSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base}-${Date.now().toString(36).slice(-4)}`;
}

/**
 * POST /api/admin/products
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      slug,
      hindiName,
      tagline,
      description,
      story,
      ingredients,
      spiceLevel,
      shelfLife,
      oilUsed,
      dietaryStandard,
      packagingType,
      customSpecifications = [],
      isVegetarian = true,
      category,
      images = [],
      variants = [],
      featured = false,
      isBestSeller = false,
      active = true,
      badge = '',
      rating = 5.0,
      reviewCount = 0,
    } = req.body;

    if (isBestSeller) {
      await enforceMaxBestSellers();
    }

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ success: false, message: 'Product name is required (min 2 characters).' });
      return;
    }

    if (!description || typeof description !== 'string' || description.trim().length < 5) {
      res.status(400).json({ success: false, message: 'Product description is required.' });
      return;
    }

    if (!category) {
      res.status(400).json({ success: false, message: 'Please select a product category.' });
      return;
    }

    // Validate or find Category
    let categoryId = category;
    if (!mongoose.Types.ObjectId.isValid(category)) {
      const cat = await Category.findOne({ slug: category });
      if (!cat) {
        res.status(400).json({ success: false, message: 'Invalid category specified.' });
        return;
      }
      categoryId = cat._id;
    }

    // Validate Variants
    if (!Array.isArray(variants) || variants.length === 0) {
      res.status(400).json({ success: false, message: 'At least one product variant (pricing and packaging) is required.' });
      return;
    }

    const cleanedVariants: IProductVariant[] = variants.map((v: Record<string, unknown>, idx: number) => {
      const label = String(v.label || '').trim();
      const price = Number(v.price);
      const stock = parseInt(String(v.stock ?? 0), 10) || 0;
      const sku = String(v.sku || '').trim().toUpperCase() || `MLW-${Date.now().toString(36).toUpperCase()}-${idx + 1}`;

      if (!label) {
        throw new Error(`Variant #${idx + 1} is missing a packaging/weight label.`);
      }
      if (isNaN(price) || price < 0) {
        throw new Error(`Variant "${label}" has an invalid price.`);
      }

      return {
        label,
        value: v.value ? Number(v.value) : undefined,
        unit: v.unit ? String(v.unit).trim() : undefined,
        price,
        salePrice: v.salePrice && Number(v.salePrice) > 0 ? Number(v.salePrice) : undefined,
        stock: Math.max(0, stock),
        sku,
        active: v.active !== false,
        sortOrder: typeof v.sortOrder === 'number' ? v.sortOrder : idx,
      };
    });

    const finalSlug = slug && typeof slug === 'string' && slug.trim()
      ? slug.trim().toLowerCase().replace(/[\s_]+/g, '-')
      : createSlug(name);

    // Check unique slug
    const existing = await Product.findOne({ slug: finalSlug });
    const productSlug = existing ? `${finalSlug}-${Date.now().toString(36).slice(-4)}` : finalSlug;

    const cleanedSpecs = Array.isArray(customSpecifications)
      ? customSpecifications
          .filter((s: any) => s && typeof s.label === 'string' && s.label.trim() && typeof s.value === 'string' && s.value.trim())
          .map((s: any) => ({ label: s.label.trim(), value: s.value.trim() }))
      : [];

    const newProduct = await Product.create({
      name: name.trim(),
      slug: productSlug,
      hindiName: hindiName ? String(hindiName).trim() : '',
      tagline: tagline ? String(tagline).trim() : '',
      description: description.trim(),
      story: story ? String(story).trim() : '',
      ingredients: Array.isArray(ingredients)
        ? ingredients.map((i: string) => String(i).trim()).filter(Boolean)
        : typeof ingredients === 'string'
        ? ingredients.split(',').map((i: string) => i.trim()).filter(Boolean)
        : [],
      spiceLevel: spiceLevel || 'Medium',
      shelfLife: shelfLife ? String(shelfLife).trim() : '90 Days',
      oilUsed: oilUsed ? String(oilUsed).trim() : 'Pure Groundnut Oil',
      dietaryStandard: dietaryStandard ? String(dietaryStandard).trim() : '100% Pure Vegetarian (Satvik)',
      packagingType: packagingType ? String(packagingType).trim() : 'Food-Grade Multi-Layer Aroma Seal',
      customSpecifications: cleanedSpecs,
      isVegetarian: Boolean(isVegetarian),
      category: categoryId,
      images: Array.isArray(images) ? images.filter(Boolean) : [],
      variants: cleanedVariants,
      featured: Boolean(featured),
      isBestSeller: Boolean(isBestSeller),
      bestSellerAt: isBestSeller ? new Date() : null,
      active: Boolean(active),
      badge: badge ? String(badge).trim() : (isBestSeller ? 'Best Seller' : ''),
      rating: typeof rating === 'number' ? rating : 5.0,
      reviewCount: typeof reviewCount === 'number' ? reviewCount : 0,
    });

    const populated = await Product.findById(newProduct._id).populate('category', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      product: populated,
    });
  } catch (err: unknown) {
    console.error('[Create Product Error]', err);
    const msg = err instanceof Error ? err.message : 'Failed to create product.';
    res.status(400).json({ success: false, message: msg });
  }
});

/**
 * PUT /api/admin/products/:id
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid product ID format.' });
      return;
    }

    const {
      name,
      slug,
      hindiName,
      tagline,
      description,
      story,
      ingredients,
      spiceLevel,
      shelfLife,
      oilUsed,
      dietaryStandard,
      packagingType,
      customSpecifications,
      isVegetarian,
      category,
      images,
      variants,
      featured,
      isBestSeller,
      active,
      badge,
      rating,
      reviewCount,
    } = req.body;

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    if (name) existingProduct.name = String(name).trim();
    if (slug) existingProduct.slug = String(slug).trim().toLowerCase().replace(/[\s_]+/g, '-');
    if (hindiName !== undefined) existingProduct.hindiName = String(hindiName).trim();
    if (tagline !== undefined) existingProduct.tagline = String(tagline).trim();
    if (description) existingProduct.description = String(description).trim();
    if (story !== undefined) existingProduct.story = String(story).trim();
    if (spiceLevel) existingProduct.spiceLevel = spiceLevel;
    if (shelfLife !== undefined) existingProduct.shelfLife = String(shelfLife).trim();
    if (oilUsed !== undefined) existingProduct.oilUsed = String(oilUsed).trim();
    if (dietaryStandard !== undefined) existingProduct.dietaryStandard = String(dietaryStandard).trim();
    if (packagingType !== undefined) existingProduct.packagingType = String(packagingType).trim();
    if (isVegetarian !== undefined) existingProduct.isVegetarian = Boolean(isVegetarian);
    if (featured !== undefined) existingProduct.featured = Boolean(featured);
    if (active !== undefined) existingProduct.active = Boolean(active);
    if (badge !== undefined) existingProduct.badge = String(badge).trim();
    if (rating !== undefined && !isNaN(Number(rating))) existingProduct.rating = Number(rating);
    if (reviewCount !== undefined && !isNaN(Number(reviewCount))) existingProduct.reviewCount = Number(reviewCount);

    if (Array.isArray(customSpecifications)) {
      existingProduct.customSpecifications = customSpecifications
        .filter((s: any) => s && typeof s.label === 'string' && s.label.trim() && typeof s.value === 'string' && s.value.trim())
        .map((s: any) => ({ label: s.label.trim(), value: s.value.trim() }));
    }

    if (isBestSeller !== undefined) {
      const willBeBestSeller = Boolean(isBestSeller);
      if (willBeBestSeller && !existingProduct.isBestSeller) {
        await enforceMaxBestSellers(existingProduct._id);
        existingProduct.isBestSeller = true;
        existingProduct.bestSellerAt = new Date();
      } else if (!willBeBestSeller) {
        existingProduct.isBestSeller = false;
        existingProduct.bestSellerAt = undefined;
      }
    }

    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        existingProduct.category = new mongoose.Types.ObjectId(category);
      } else {
        const cat = await Category.findOne({ slug: category });
        if (cat) existingProduct.category = cat._id;
      }
    }

    if (Array.isArray(ingredients)) {
      existingProduct.ingredients = ingredients.map((i: string) => String(i).trim()).filter(Boolean);
    } else if (typeof ingredients === 'string') {
      existingProduct.ingredients = ingredients.split(',').map((i: string) => i.trim()).filter(Boolean);
    }

    if (Array.isArray(images)) {
      existingProduct.images = images.filter(Boolean);
    }

    if (Array.isArray(variants) && variants.length > 0) {
      existingProduct.variants = variants.map((v: Record<string, unknown>, idx: number) => {
        const label = String(v.label || '').trim();
        const price = Number(v.price);
        const stock = parseInt(String(v.stock ?? 0), 10) || 0;
        const sku = String(v.sku || '').trim().toUpperCase() || `MLW-VAR-${idx + 1}`;

        if (!label) throw new Error(`Variant #${idx + 1} is missing a label.`);
        if (isNaN(price) || price < 0) throw new Error(`Variant "${label}" has an invalid price.`);

        return {
          label,
          value: v.value ? Number(v.value) : undefined,
          unit: v.unit ? String(v.unit).trim() : undefined,
          price,
          salePrice: v.salePrice && Number(v.salePrice) > 0 ? Number(v.salePrice) : undefined,
          stock: Math.max(0, stock),
          sku,
          active: v.active !== false,
          sortOrder: typeof v.sortOrder === 'number' ? v.sortOrder : idx,
        };
      });
    }

    await existingProduct.save();
    const updated = await Product.findById(id).populate('category', 'name slug');

    res.json({
      success: true,
      message: 'Product updated successfully.',
      product: updated,
    });
  } catch (err: unknown) {
    console.error('[Update Product Error]', err);
    const msg = err instanceof Error ? err.message : 'Failed to update product.';
    res.status(400).json({ success: false, message: msg });
  }
});

/**
 * PATCH /api/admin/products/:id/toggle
 */
router.patch('/:id/toggle', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid product ID.' });
      return;
    }

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    product.active = !product.active;
    await product.save();

    res.json({
      success: true,
      message: `Product is now ${product.active ? 'Active' : 'Inactive'}.`,
      active: product.active,
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: 'Failed to toggle product status.' });
  }
});

/**
 * PATCH /api/admin/products/:id/toggle-bestseller
 */
router.patch('/:id/toggle-bestseller', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid product ID.' });
      return;
    }

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    const nextState = !product.isBestSeller;
    if (nextState) {
      await enforceMaxBestSellers(product._id);
      product.isBestSeller = true;
      product.bestSellerAt = new Date();
      if (!product.badge) product.badge = 'Best Seller';
    } else {
      product.isBestSeller = false;
      product.bestSellerAt = undefined;
      if (product.badge === 'Best Seller') product.badge = '';
    }

    await product.save();

    res.json({
      success: true,
      message: `Product is ${product.isBestSeller ? 'now marked as Best Seller' : 'removed from Best Sellers'}.`,
      isBestSeller: product.isBestSeller,
      product,
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: 'Failed to toggle best seller status.' });
  }
});

/**
 * DELETE /api/admin/products/:id
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid product ID.' });
      return;
    }

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    res.json({
      success: true,
      message: 'Product removed successfully.',
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
});

export default router;
