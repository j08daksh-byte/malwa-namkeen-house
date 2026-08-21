import { Router } from 'express';
import type { Request, Response } from 'express';
import { Product } from '../models/Product.ts';
import { Category } from '../models/Category.ts';

const router = Router();

/**
 * Dynamic Sitemap Generator
 * GET /sitemap.xml
 */
router.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    interface SitemapRoute {
      loc: string;
      changefreq: string;
      priority: string;
      lastmod?: string;
    }

    const staticRoutes: SitemapRoute[] = [
      { loc: '/', changefreq: 'daily', priority: '1.0' },
      { loc: '/shop', changefreq: 'daily', priority: '0.9' },
      { loc: '/about-us', changefreq: 'weekly', priority: '0.8' },
      { loc: '/faq', changefreq: 'weekly', priority: '0.8' },
      { loc: '/contact', changefreq: 'monthly', priority: '0.7' },
      { loc: '/privacy-policy', changefreq: 'monthly', priority: '0.5' },
      { loc: '/terms-and-conditions', changefreq: 'monthly', priority: '0.5' },
      { loc: '/cancellation-policy', changefreq: 'monthly', priority: '0.5' },
      { loc: '/refund-policy', changefreq: 'monthly', priority: '0.5' },
    ];

    // Fetch active products from MongoDB
    const activeProducts = await Product.find({ isAvailable: { $ne: false } })
      .select('slug updatedAt')
      .lean()
      .catch(() => []);

    const productRoutes = activeProducts.map(p => ({
      loc: `/product/${p.slug}`,
      lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
      changefreq: 'weekly',
      priority: '0.85',
    }));

    const allUrls = [...staticRoutes, ...productRoutes];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    item => `  <url>
    <loc>${baseUrl}${item.loc}</loc>
    ${item.lastmod ? `<lastmod>${item.lastmod}</lastmod>` : `<lastmod>${new Date().toISOString()}</lastmod>`}
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=7200');
    res.status(200).send(xml);
  } catch (err) {
    console.error('[Sitemap Error]', err);
    res.status(500).send('Error generating sitemap');
  }
});

/**
 * Dynamic Robots.txt Generator
 * GET /robots.txt
 */
router.get('/robots.txt', (req: Request, res: Response) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;

  const content = `# Robots.txt for Malwa Namkeen House
User-agent: *
Allow: /
Allow: /shop
Allow: /product/
Allow: /about-us
Allow: /faq
Allow: /contact
Allow: /privacy-policy
Allow: /terms-and-conditions
Allow: /cancellation-policy
Allow: /refund-policy

# Protect internal/authenticated/admin routes
Disallow: /admin/
Disallow: /admin/*
Disallow: /dashboard
Disallow: /dashboard/*
Disallow: /account
Disallow: /account/*
Disallow: /login
Disallow: /api/
Disallow: /api/*

# Sitemap Reference
Sitemap: ${baseUrl}/sitemap.xml
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.status(200).send(content);
});

export default router;
