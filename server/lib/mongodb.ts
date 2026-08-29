/**
 * MongoDB connection via Mongoose.
 * Reads MONGODB_URI from the environment.
 * Call connectMongoDB() once during server startup.
 */

import mongoose from 'mongoose';
import { User } from '../models/User.ts';
import { Category } from '../models/Category.ts';
import { Product } from '../models/Product.ts';
import { SHOP_CATEGORIES, PRODUCTS } from '../../src-rebuild/data/products.ts';
import { hashPassword } from './auth.ts';

let isConnected = false;

async function seedInitialAdmin(): Promise<void> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.toLowerCase().trim() : '';
    const adminPassword = process.env.ADMIN_PASSWORD || '';

    if (!adminEmail) return;

    // 1. If an account with ADMIN_EMAIL already exists in MongoDB, ensure it is super_admin
    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      if (existing.role !== 'super_admin' || !existing.active) {
        existing.role = 'super_admin';
        existing.active = true;
        await existing.save();
        console.log(`[MongoDB] Designated owner <${adminEmail}> successfully designated as super_admin.`);
      }
      return;
    }

    console.log(`[MongoDB] ADMIN_EMAIL <${adminEmail}> is configured. Registered account will automatically receive super_admin privileges.`);
  } catch (err: unknown) {
    console.warn('[MongoDB] Initial admin check skipped:', err instanceof Error ? err.message : err);
  }
}

/**
 * Ensures MongoDB Atlas is cleanly seeded and kept in sync with the 6 categories & 14 products catalog.
 */
export async function syncDatabaseCatalog(): Promise<void> {
  try {
    // 1. Ensure the 6 categories exist and are mapped
    const validCategories = SHOP_CATEGORIES.filter(c => c.id !== 'all');
    const categoryDocMap = new Map<string, mongoose.Types.ObjectId>();

    for (let i = 0; i < validCategories.length; i++) {
      const catData = validCategories[i];
      let cat = await Category.findOne({ slug: catData.id });
      if (!cat) {
        cat = await Category.create({
          name: catData.label,
          slug: catData.id,
          description: catData.description,
          active: true,
          sortOrder: i,
        });
      } else {
        cat.name = catData.label;
        cat.description = catData.description;
        cat.active = true;
        cat.sortOrder = i;
        await cat.save();
      }
      categoryDocMap.set(catData.id, cat._id as mongoose.Types.ObjectId);
    }

    // Clean up temporary test categories if any
    await Category.deleteMany({ slug: { $regex: /^test-category/i } });

    // 2. Sync all 14 Products (with 4 marked as Best Sellers)
    for (let idx = 0; idx < PRODUCTS.length; idx++) {
      const p = PRODUCTS[idx];
      const catId = categoryDocMap.get(p.category) || Array.from(categoryDocMap.values())[0];
      const pSlug = p.slug || p.id;

      const variants = p.options.map((opt, vIdx) => ({
        label: opt.weight,
        value: parseFloat(opt.weight) || 250,
        unit: opt.weight.replace(/^[0-9.]+/, '').trim() || 'g',
        price: opt.price,
        salePrice: opt.originalPrice && opt.originalPrice > opt.price ? opt.price : undefined,
        stock: 100,
        sku: `MLW-${p.id.slice(0, 4).toUpperCase()}-${opt.weight.replace(/\s+/g, '').toUpperCase()}`,
        active: true,
        sortOrder: vIdx,
      }));

      const productPayload = {
        name: p.name,
        slug: pSlug,
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
        images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image],
        badge: p.badge || (p.isBestSeller ? 'Bestseller' : ''),
        featured: Boolean(p.featured),
        isBestSeller: Boolean(p.isBestSeller),
        bestSellerAt: p.isBestSeller ? new Date(Date.now() - idx * 60000) : null,
        active: p.isAvailable ?? true,
        rating: p.rating || 4.9,
        reviewCount: p.reviewCount || 42,
        variants,
      };

      await Product.findOneAndUpdate(
        { slug: pSlug },
        { $set: productPayload },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    // Clean up any obsolete test products
    await Product.deleteMany({ slug: { $nin: PRODUCTS.map(p => p.slug || p.id) } });

    console.log(`[MongoDB] Database catalog synchronized: ${validCategories.length} categories, ${PRODUCTS.length} products (4 bestsellers).`);
  } catch (err: unknown) {
    console.warn('[MongoDB] Database catalog sync warning:', err instanceof Error ? err.message : err);
  }
}

/**
 * Connect to MongoDB Atlas.
 * Logs success/failure without exposing credentials.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export async function connectMongoDB(): Promise<void> {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('[MongoDB] MONGODB_URI not set — skipping MongoDB connection.');
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      dbName: process.env.MONGODB_DB_NAME || 'malwa_namkeen',
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to database: "${mongoose.connection.name}".`);
    await seedInitialAdmin();
    await syncDatabaseCatalog();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    // Never log the full URI — it contains credentials
    console.error('[MongoDB] Connection failed:', message);
    throw err;
  }
}

/**
 * Returns the current Mongoose connection readyState as a human-readable string.
 * 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
 */
export function getMongoStatus(): { connected: boolean; state: string } {
  const stateMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const state = mongoose.connection.readyState;
  return {
    connected: state === 1,
    state: stateMap[state] ?? 'unknown',
  };
}
