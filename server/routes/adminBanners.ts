import { Router } from 'express';
import type { Response } from 'express';
import { Banner } from '../models/Banner.ts';
import { requireAdmin, type AuthenticatedRequest } from '../lib/auth.ts';

const router = Router();

const DEFAULT_BANNERS = [
  {
    title: 'Pure Malwa Heritage in Every Crunchy Bite',
    alt: 'Pure Malwa Heritage in Every Crunchy Bite - Special Ratlami Sev & Artisanal Namkeens',
    image: '/hero-banner-1.png',
    link: '/shop',
    active: true,
    sortOrder: 0,
  },
  {
    title: 'Add the Malwa Crunch: Complete Your Snack Time',
    alt: 'Add the Malwa Crunch: Complete Your Snack Time - Roasted Not Fried, No Palm Oil',
    image: '/hero-banner-2.png',
    link: '/shop',
    active: true,
    sortOrder: 1,
  },
];

/**
 * Ensures initial default banners exist if collection is empty
 */
async function ensureInitialBanners() {
  try {
    const count = await Banner.countDocuments();
    if (count === 0) {
      await Banner.insertMany(DEFAULT_BANNERS);
    }
  } catch (err) {
    console.warn('[Banners] Seed check warning:', err instanceof Error ? err.message : err);
  }
}

// Require admin authentication for all endpoints
router.use(requireAdmin);

/**
 * GET /api/admin/banners
 * Returns all banners with optional search, status filter, and sorting
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureInitialBanners();

    const { search, status, sortBy } = req.query;

    const filter: Record<string, unknown> = {};

    if (search && typeof search === 'string' && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { alt: { $regex: search.trim(), $options: 'i' } },
        { link: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (status === 'active') {
      filter.active = true;
    } else if (status === 'inactive') {
      filter.active = false;
    }

    let sort: Record<string, 1 | -1> = { sortOrder: 1, createdAt: -1 };
    if (sortBy === 'newest') {
      sort = { createdAt: -1 };
    } else if (sortBy === 'title') {
      sort = { title: 1 };
    }

    const banners = await Banner.find(filter).sort(sort);

    res.json({
      success: true,
      count: banners.length,
      banners,
    });
  } catch (err: unknown) {
    console.error('[Admin Banners GET Error]:', err);
    res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : 'Failed to retrieve banners.',
    });
  }
});

/**
 * POST /api/admin/banners
 * Create a new hero banner
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, alt, image, mobileImage, link, badge, active, sortOrder } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ success: false, message: 'Banner title is required.' });
      return;
    }

    if (!image || typeof image !== 'string' || !image.trim()) {
      res.status(400).json({ success: false, message: 'Banner image is required.' });
      return;
    }

    // Determine default sort order if not provided
    let calculatedOrder = typeof sortOrder === 'number' ? sortOrder : 0;
    if (typeof sortOrder !== 'number') {
      const highest = await Banner.findOne().sort({ sortOrder: -1 }).select('sortOrder');
      calculatedOrder = highest && typeof highest.sortOrder === 'number' ? highest.sortOrder + 1 : 0;
    }

    const newBanner = await Banner.create({
      title: title.trim(),
      alt: (alt && typeof alt === 'string' ? alt.trim() : title.trim()),
      image: image.trim(),
      mobileImage: mobileImage && typeof mobileImage === 'string' ? mobileImage.trim() : '',
      link: link && typeof link === 'string' && link.trim() ? link.trim() : '/shop',
      badge: badge && typeof badge === 'string' ? badge.trim() : '',
      active: typeof active === 'boolean' ? active : true,
      sortOrder: calculatedOrder,
    });

    res.status(201).json({
      success: true,
      message: 'Banner created successfully.',
      banner: newBanner,
    });
  } catch (err: unknown) {
    console.error('[Admin Banners POST Error]:', err);
    res.status(400).json({
      success: false,
      message: err instanceof Error ? err.message : 'Failed to create banner.',
    });
  }
});

/**
 * PUT /api/admin/banners/:id
 * Update an existing banner
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, alt, image, mobileImage, link, badge, active, sortOrder } = req.body;

    const banner = await Banner.findById(id);
    if (!banner) {
      res.status(404).json({ success: false, message: 'Banner not found.' });
      return;
    }

    if (title !== undefined) banner.title = title.trim();
    if (alt !== undefined) banner.alt = alt.trim();
    if (image !== undefined) banner.image = image.trim();
    if (mobileImage !== undefined) banner.mobileImage = mobileImage.trim();
    if (link !== undefined) banner.link = link.trim() || '/shop';
    if (badge !== undefined) banner.badge = badge.trim();
    if (active !== undefined) banner.active = Boolean(active);
    if (typeof sortOrder === 'number') banner.sortOrder = sortOrder;

    await banner.save();

    res.json({
      success: true,
      message: 'Banner updated successfully.',
      banner,
    });
  } catch (err: unknown) {
    console.error('[Admin Banners PUT Error]:', err);
    res.status(400).json({
      success: false,
      message: err instanceof Error ? err.message : 'Failed to update banner.',
    });
  }
});

/**
 * PATCH /api/admin/banners/:id/toggle
 * Toggle active/inactive state
 */
router.patch('/:id/toggle', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);
    if (!banner) {
      res.status(404).json({ success: false, message: 'Banner not found.' });
      return;
    }

    banner.active = !banner.active;
    await banner.save();

    res.json({
      success: true,
      message: `Banner is now ${banner.active ? 'active' : 'inactive'}.`,
      active: banner.active,
      banner,
    });
  } catch (err: unknown) {
    res.status(400).json({
      success: false,
      message: err instanceof Error ? err.message : 'Failed to toggle banner status.',
    });
  }
});

/**
 * PATCH /api/admin/banners/reorder
 * Bulk reorder banners by array of IDs
 */
router.patch('/reorder', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ success: false, message: 'orderedIds must be an array of Banner IDs.' });
      return;
    }

    const updates = orderedIds.map((id, index) =>
      Banner.findByIdAndUpdate(id, { sortOrder: index })
    );

    await Promise.all(updates);

    const banners = await Banner.find().sort({ sortOrder: 1 });

    res.json({
      success: true,
      message: 'Banner ordering updated successfully.',
      banners,
    });
  } catch (err: unknown) {
    res.status(400).json({
      success: false,
      message: err instanceof Error ? err.message : 'Failed to reorder banners.',
    });
  }
});

/**
 * DELETE /api/admin/banners/:id
 * Delete a banner
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) {
      res.status(404).json({ success: false, message: 'Banner not found.' });
      return;
    }

    res.json({
      success: true,
      message: 'Banner deleted successfully.',
    });
  } catch (err: unknown) {
    res.status(400).json({
      success: false,
      message: err instanceof Error ? err.message : 'Failed to delete banner.',
    });
  }
});

export default router;
export { ensureInitialBanners, DEFAULT_BANNERS };
