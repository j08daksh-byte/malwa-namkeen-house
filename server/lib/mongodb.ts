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
import { getEffectiveMongoConfig, validateTestDatabaseName } from './dbGuard.ts';

let connectionPromise: Promise<void> | null = null;

export function getDesignatedAdminEmails(): string[] {
  const raw = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '').toLowerCase();
  const list = raw
    .split(/[,;]+/)
    .map(e => e.trim())
    .filter(e => e && e.includes('@'));

  // Always include standard store owner/super-admin email
  const defaultOwners = [
    'malwanamkeenhouse@gmail.com',
  ];
  for (const owner of defaultOwners) {
    list.push(owner);
  }

  // In test / E2E mode, explicitly configure dedicated TEST_ADMIN_EMAIL as designated admin in the test server
  if (process.env.NODE_ENV === 'test' || process.env.IS_E2E_TEST === 'true') {
    const testAdmin = (process.env.TEST_ADMIN_EMAIL || '').trim().toLowerCase();
    if (testAdmin && testAdmin.includes('@')) {
      list.push(testAdmin);
    }
  }

  // Default to business notification address if not explicitly set in environment
  if (list.length === 0) {
    list.push('malwanamkeenhouse@gmail.com');
  }
  return Array.from(new Set(list));
}

async function seedInitialAdmin(): Promise<void> {
  try {
    const designatedEmails = getDesignatedAdminEmails();
    const isTestMode = process.env.NODE_ENV === 'test' || process.env.IS_E2E_TEST === 'true';
    const adminPassword = isTestMode
      ? (process.env.TEST_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD)
      : process.env.ADMIN_PASSWORD;

    // Demote legacy developer accounts to customer so only official business email holds admin
    const legacyDevEmails = [
      'j08daksh@gmail.com',
      'baljeetrajawat210@gmail.com',
      'jainnancy2503@gmail.com',
      'admin@malwanamkeen.com',
    ];
    for (const devEmail of legacyDevEmails) {
      if (!designatedEmails.includes(devEmail)) {
        await User.updateMany(
          { email: devEmail, role: { $in: ['admin', 'super_admin'] } },
          { $set: { role: 'customer' } }
        );
      }
    }

    for (const email of designatedEmails) {
      const existing = await User.findOne({ email });
      if (existing) {
        let changed = false;
        if (existing.role !== 'super_admin') {
          existing.role = 'super_admin';
          changed = true;
        }
        if (existing.active === false || existing.active === undefined) {
          existing.active = true;
          changed = true;
        }
        if (changed) {
          await existing.save();
          console.log(`[MongoDB] Designated owner <${email}> confirmed as active super_admin.`);
        }
      } else if (adminPassword && adminPassword.trim().length >= 8) {
        const hashedPassword = await hashPassword(adminPassword.trim());
        await User.create({
          name: 'Super Admin',
          email,
          password: hashedPassword,
          role: 'super_admin',
          active: true,
        });
        console.log(`[MongoDB] Initial super_admin account provisioned for <${email}>.`);
      } else {
        console.log(`[MongoDB] Designated owner <${email}> is configured. Set ADMIN_PASSWORD in environment to auto-provision with credentials, or complete registration via Google OAuth/Portal.`);
      }
    }
  } catch (err: unknown) {
    console.warn('[MongoDB] Initial admin check skipped:', err instanceof Error ? err.message : err);
  }
}

/**
 * Ensures MongoDB Atlas is cleanly seeded on first run without overwriting or re-creating products/categories deleted by admin.
 */
export async function syncDatabaseCatalog(): Promise<void> {
  try {
    const validCategories = SHOP_CATEGORIES.filter(c => c.id !== 'all');
    const categoryDocMap = new Map<string, mongoose.Types.ObjectId>();

    // 1. Ensure initial categories exist if database is fresh
    const totalCategories = await Category.countDocuments();
    if (totalCategories === 0) {
      for (let i = 0; i < validCategories.length; i++) {
        const catData = validCategories[i];
        const cat = await Category.create({
          name: catData.label,
          slug: catData.id,
          description: catData.description,
          image: catData.image || '',
          active: true,
          sortOrder: i,
        });
        categoryDocMap.set(catData.id, cat._id as mongoose.Types.ObjectId);
      }
    } else {
      const allExistingCats = await Category.find().lean();
      for (const cat of allExistingCats) {
        categoryDocMap.set(cat.slug, cat._id as mongoose.Types.ObjectId);
      }
    }

    // 2. Seed initial Products ONLY IF the catalog is completely empty.
    // If products already exist, DO NOT re-insert missing default products so admin deletions are strictly preserved!
    const totalProducts = await Product.countDocuments();
    let seededCount = 0;

    if (totalProducts === 0) {
      const fallbackCatId = Array.from(categoryDocMap.values())[0];
      for (let idx = 0; idx < PRODUCTS.length; idx++) {
        const p = PRODUCTS[idx];
        const catId = categoryDocMap.get(p.category) || fallbackCatId;
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

        await Product.create(productPayload);
        seededCount++;
      }
      console.log(`[MongoDB] Initial catalog seeded with ${seededCount} products.`);
    } else {
      console.log(`[MongoDB] Database catalog synchronized: ${totalProducts} products verified (admin items & deletions preserved).`);
    }
  } catch (err: unknown) {
    console.warn('[MongoDB] Database catalog sync warning:', err instanceof Error ? err.message : err);
  }
}

/**
 * Connect to MongoDB with connection pooling & automatic reconnection.
 * Safe to call concurrently or repeatedly across serverless requests and long-running servers.
 */
export async function connectMongoDB(): Promise<void> {
  // If already fully connected, return immediately
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // If currently in the process of connecting, await the active promise
  if (mongoose.connection.readyState === 2 && connectionPromise) {
    return connectionPromise;
  }

  const isProd = process.env.NODE_ENV === 'production';
  const config = getEffectiveMongoConfig();

  connectionPromise = (async () => {
    try {
      await mongoose.connect(config.uri, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
        minPoolSize: 1,
        socketTimeoutMS: 45000,
        dbName: config.dbName,
      });

      // Validate post-connection database isolation
      const actualConnectedDb = mongoose.connection.name;
      if (config.isTestMode) {
        if (actualConnectedDb !== config.dbName) {
          await mongoose.disconnect();
          throw new Error(
            `CRITICAL SAFETY ABORT: Mongoose connected to database "${actualConnectedDb}", but expected test database "${config.dbName}". Disconnected immediately.`
          );
        }
        const validation = validateTestDatabaseName({ testDbName: actualConnectedDb });
        if (!validation.safe) {
          await mongoose.disconnect();
          throw new Error(`CRITICAL POST-CONNECT SAFETY ABORT: ${validation.error}`);
        }
      }

      console.log(`[MongoDB] Connected successfully to database: "${mongoose.connection.name}".`);
      await seedInitialAdmin();
      await syncDatabaseCatalog();
    } catch (err: unknown) {
      connectionPromise = null;
      const message = err instanceof Error ? err.message : String(err);
      if (isProd) {
        console.error('[MongoDB Error] Production database connection failed:', message);
      } else {
        console.warn('[MongoDB Warning] Database connection failed:', message);
      }
      throw err;
    }
  })();

  return connectionPromise;
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
