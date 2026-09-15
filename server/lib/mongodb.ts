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
 * Ensures MongoDB Atlas is cleanly seeded on first run without overwriting or deleting custom admin products/categories.
 */
export async function syncDatabaseCatalog(): Promise<void> {
  try {
    const validCategories = SHOP_CATEGORIES.filter(c => c.id !== 'all');
    const categoryDocMap = new Map<string, mongoose.Types.ObjectId>();

    // 1. Ensure the default categories exist
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
      }
      categoryDocMap.set(catData.id, cat._id as mongoose.Types.ObjectId);
    }

    // 2. Seed initial Products if missing (never overwrite admin changes or delete admin products)
    let seededCount = 0;
    for (let idx = 0; idx < PRODUCTS.length; idx++) {
      const p = PRODUCTS[idx];
      const catId = categoryDocMap.get(p.category) || Array.from(categoryDocMap.values())[0];
      const pSlug = p.slug || p.id;

      const existing = await Product.findOne({ slug: pSlug });
      if (!existing) {
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

        await Product.create(productPayload);
        seededCount++;
      }
    }

    const totalProducts = await Product.countDocuments();
    if (seededCount > 0) {
      console.log(`[MongoDB] Database catalog initialized with ${seededCount} missing seed products. Total products: ${totalProducts}.`);
    } else {
      console.log(`[MongoDB] Database catalog synchronized: ${totalProducts} products verified (admin items preserved).`);
    }
  } catch (err: unknown) {
    console.warn('[MongoDB] Database catalog sync warning:', err instanceof Error ? err.message : err);
  }
}

/**
 * Connect to MongoDB.
 * In production: strictly uses explicit MONGODB_URI and fails safely if connection fails.
 * In development: can use local MongoDB placeholder if MONGODB_URI is not set or mock.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export async function connectMongoDB(): Promise<void> {
  if (isConnected) return;

  const isProd = process.env.NODE_ENV === 'production';
  let uri = process.env.MONGODB_URI;

  if (!uri) {
    if (!isProd) {
      console.warn('[MongoDB] MONGODB_URI not set. In development, attempting local MongoDB at mongodb://127.0.0.1:27017/malwa_namkeen');
      uri = 'mongodb://127.0.0.1:27017/malwa_namkeen';
    } else {
      console.error('[MongoDB Error] MONGODB_URI is not set in production. Database connection aborted.');
      return;
    }
  } else if (!isProd && uri.includes('mock:mock')) {
    console.warn('[MongoDB] Mock Atlas URI detected in development. Using local MongoDB at mongodb://127.0.0.1:27017/malwa_namkeen');
    uri = 'mongodb://127.0.0.1:27017/malwa_namkeen';
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
    if (isProd) {
      console.error('[MongoDB Error] Production database connection failed:', message);
    } else {
      console.warn('[MongoDB Warning] Database connection failed:', message);
    }
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
