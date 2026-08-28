import { Router } from 'express';
import type { Request, Response } from 'express';
import { Banner } from '../models/Banner.ts';
import { ensureInitialBanners, DEFAULT_BANNERS } from './adminBanners.ts';

const router = Router();

/**
 * GET /api/banners
 * Returns all active banners sorted by sortOrder for the storefront carousel.
 * Falls back to DEFAULT_BANNERS gracefully if database is offline or empty.
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    await ensureInitialBanners();

    const banners = await Banner.find({ active: true }).sort({ sortOrder: 1, createdAt: -1 });

    if (banners && banners.length > 0) {
      res.json({
        success: true,
        count: banners.length,
        banners: banners.map(b => ({
          id: b._id.toString(),
          title: b.title,
          alt: b.alt || b.title,
          image: b.image,
          mobileImage: b.mobileImage,
          link: b.link || '/shop',
          badge: b.badge,
          sortOrder: b.sortOrder,
        })),
      });
      return;
    }

    // Fallback if none found
    res.json({
      success: true,
      count: DEFAULT_BANNERS.length,
      banners: DEFAULT_BANNERS.map((b, i) => ({
        id: `default-${i + 1}`,
        title: b.title,
        alt: b.alt,
        image: b.image,
        link: b.link,
        sortOrder: b.sortOrder,
      })),
    });
  } catch (err: unknown) {
    console.warn('[Public Banners] DB retrieval failed, returning default fallback:', err);
    res.json({
      success: true,
      count: DEFAULT_BANNERS.length,
      banners: DEFAULT_BANNERS.map((b, i) => ({
        id: `default-${i + 1}`,
        title: b.title,
        alt: b.alt,
        image: b.image,
        link: b.link,
        sortOrder: b.sortOrder,
      })),
    });
  }
});

export default router;
