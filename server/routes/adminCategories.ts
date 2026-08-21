import { Router } from 'express';
import type { Response } from 'express';
import mongoose from 'mongoose';
import { Category } from '../models/Category.ts';
import { Product } from '../models/Product.ts';
import { requireAdmin, type AuthenticatedRequest } from '../lib/auth.ts';
import { SHOP_CATEGORIES } from '../../src-rebuild/data/products.ts';

const router = Router();

// Enforce requireAdmin on all category endpoints
router.use(requireAdmin);

/**
 * Ensures starter categories are seeded if collection is empty.
 */
async function ensureCategoriesSeeded() {
  const count = await Category.countDocuments();
  if (count === 0) {
    const toSeed = SHOP_CATEGORIES.filter(c => c.id !== 'all').map((c, i) => ({
      name: c.label,
      slug: c.id,
      description: c.description,
      image: '',
      active: true,
      sortOrder: i,
    }));
    await Category.insertMany(toSeed);
  }
}

/**
 * Helper to generate a clean URL slug from category name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * GET /api/admin/categories
 * Query: search, status (all|active|inactive), sortBy (sortOrder|name|newest)
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureCategoriesSeeded();

    const { search = '', status = 'all', sortBy = 'sortOrder' } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = {};

    if (search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { slug: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    if (status === 'active') {
      filter.active = true;
    } else if (status === 'inactive') {
      filter.active = false;
    }

    let sortObj: Record<string, 1 | -1> = { sortOrder: 1, name: 1 };
    if (sortBy === 'name') {
      sortObj = { name: 1 };
    } else if (sortBy === 'newest') {
      sortObj = { createdAt: -1 };
    }

    const categories = await Category.find(filter).sort(sortObj).lean();

    // Aggregate product counts per category
    const productCounts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(productCounts.map(item => [String(item._id), item.count]));

    const categoriesWithCount = categories.map(cat => ({
      ...cat,
      productCount: countMap.get(String(cat._id)) || 0,
    }));

    res.json({
      success: true,
      categories: categoriesWithCount,
      total: categories.length,
    });
  } catch (err: unknown) {
    console.error('[Admin Categories List Error]', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve categories.' });
  }
});

/**
 * GET /api/admin/categories/:id
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid category ID format.' });
      return;
    }

    const category = await Category.findById(id).lean();
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found.' });
      return;
    }

    const productCount = await Product.countDocuments({ category: id });

    res.json({
      success: true,
      category: {
        ...category,
        productCount,
      },
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: 'Failed to retrieve category.' });
  }
});

/**
 * POST /api/admin/categories
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, slug, description, image, active = true, sortOrder = 0 } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ success: false, message: 'Category name is required (minimum 2 characters).' });
      return;
    }

    const cleanName = name.trim();
    let finalSlug = slug && typeof slug === 'string' && slug.trim()
      ? generateSlug(slug)
      : generateSlug(cleanName);

    if (!finalSlug) {
      finalSlug = `cat-${Date.now().toString(36)}`;
    }

    // Check slug uniqueness
    const existing = await Category.findOne({ slug: finalSlug });
    if (existing) {
      res.status(409).json({
        success: false,
        message: `Category with slug "${finalSlug}" already exists. Please choose a different slug or name.`,
      });
      return;
    }

    const newCategory = await Category.create({
      name: cleanName,
      slug: finalSlug,
      description: description ? String(description).trim() : '',
      image: image ? String(image).trim() : '',
      active: Boolean(active),
      sortOrder: Number(sortOrder) || 0,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      category: newCategory,
    });
  } catch (err: unknown) {
    console.error('[Create Category Error]', err);
    const msg = err instanceof Error ? err.message : 'Failed to create category.';
    res.status(400).json({ success: false, message: msg });
  }
});

/**
 * PUT /api/admin/categories/:id
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid category ID format.' });
      return;
    }

    const { name, slug, description, image, active, sortOrder } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found.' });
      return;
    }

    if (name) {
      category.name = String(name).trim();
    }

    if (slug) {
      const cleanSlug = generateSlug(String(slug));
      if (cleanSlug && cleanSlug !== category.slug) {
        const existing = await Category.findOne({ slug: cleanSlug, _id: { $ne: id } });
        if (existing) {
          res.status(409).json({ success: false, message: `Slug "${cleanSlug}" is already in use by another category.` });
          return;
        }
        category.slug = cleanSlug;
      }
    }

    if (description !== undefined) category.description = String(description).trim();
    if (image !== undefined) category.image = String(image).trim();
    if (active !== undefined) category.active = Boolean(active);
    if (sortOrder !== undefined) category.sortOrder = Number(sortOrder) || 0;

    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully.',
      category,
    });
  } catch (err: unknown) {
    console.error('[Update Category Error]', err);
    const msg = err instanceof Error ? err.message : 'Failed to update category.';
    res.status(400).json({ success: false, message: msg });
  }
});

/**
 * PATCH /api/admin/categories/:id/toggle
 */
router.patch('/:id/toggle', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid category ID.' });
      return;
    }

    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found.' });
      return;
    }

    category.active = !category.active;
    await category.save();

    res.json({
      success: true,
      message: `Category is now ${category.active ? 'Active' : 'Inactive'}.`,
      active: category.active,
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: 'Failed to toggle category status.' });
  }
});

/**
 * DELETE /api/admin/categories/:id
 * Server-side reference check: blocks deletion if any products reference this category.
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid category ID format.' });
      return;
    }

    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found.' });
      return;
    }

    // Reference integrity protection: check if products belong to this category
    const referencingProductsCount = await Product.countDocuments({
      $or: [
        { category: id },
        { category: category._id },
      ],
    });

    if (referencingProductsCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete category "${category.name}" because ${referencingProductsCount} product(s) are currently assigned to it. Please reassign or delete those products first.`,
        productCount: referencingProductsCount,
      });
      return;
    }

    await Category.findByIdAndDelete(id);

    res.json({
      success: true,
      message: `Category "${category.name}" deleted successfully.`,
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: 'Failed to delete category.' });
  }
});

export default router;
