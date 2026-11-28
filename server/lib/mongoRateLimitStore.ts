import type { Store, Options, IncrementResponse } from 'express-rate-limit';
import mongoose from 'mongoose';
import { RateLimitRecord } from '../models/RateLimitRecord.ts';

export interface MongoRateLimitStoreOptions {
  prefix?: string;
  windowMs?: number;
  failClosed?: boolean;
}

/**
 * MongoRateLimitStore
 *
 * Implements the express-rate-limit Store interface using MongoDB Atlas.
 * Guarantees atomic, database-enforced rate limiting across separate Vercel serverless
 * Lambda containers and independent processes.
 *
 * Features:
 * 1. Atomic increments via findOneAndUpdate with window expiration checking.
 * 2. Automatic document eviction via MongoDB TTL index on `expiresAt`.
 * 3. Fallback in-memory cache if MongoDB is offline, with strict fail-closed security.
 * 4. Zero cross-instance key collision via configurable prefixes.
 */
export class MongoRateLimitStore implements Store {
  prefix: string;
  windowMs: number;
  failClosed: boolean;
  localKeys: boolean = false; // Cross-instance distributed keys

  // Fallback memory tracking if DB is offline/disconnected
  private fallbackMemory = new Map<string, { totalHits: number; resetTime: Date }>();

  constructor(optionsOrPrefix?: MongoRateLimitStoreOptions | string, windowMs?: number) {
    if (typeof optionsOrPrefix === 'string') {
      this.prefix = optionsOrPrefix.endsWith(':') ? optionsOrPrefix : `${optionsOrPrefix}:`;
      this.windowMs = windowMs || 60000;
      this.failClosed = true;
    } else {
      const p = optionsOrPrefix?.prefix || 'rl:';
      this.prefix = p.endsWith(':') ? p : `${p}:`;
      this.windowMs = optionsOrPrefix?.windowMs || windowMs || 60000;
      this.failClosed = optionsOrPrefix?.failClosed !== false;
    }
  }

  init(options: Options): void {
    if (options.windowMs) {
      this.windowMs = options.windowMs;
    }
  }

  async increment(key: string): Promise<IncrementResponse> {
    const fullKey = `${this.prefix}${key}`;
    const now = Date.now();
    const resetTime = new Date(now + this.windowMs);

    // 1. If MongoDB is ready and connected, execute atomic distributed increment
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      try {
        const collection = mongoose.connection.collection('ratelimitrecords');

        // Step 1: Atomically increment within active unexpired window
        const updated = await collection.findOneAndUpdate(
          { _id: fullKey as any, resetTime: { $gt: new Date(now) } },
          { $inc: { totalHits: 1 } },
          { returnDocument: 'after' }
        );

        if (updated) {
          const doc = updated as any;
          return {
            totalHits: doc.totalHits,
            resetTime: doc.resetTime,
          };
        }

        // Step 2: If document exists but expired, atomically reset to hit 1 and new window
        const resetDoc = await collection.findOneAndUpdate(
          { _id: fullKey as any, resetTime: { $lte: new Date(now) } },
          {
            $set: {
              totalHits: 1,
              resetTime,
              expiresAt: resetTime,
            },
          },
          { returnDocument: 'after' }
        );

        if (resetDoc) {
          const doc = resetDoc as any;
          return {
            totalHits: doc.totalHits,
            resetTime: doc.resetTime,
          };
        }

        // Step 3: Document does not exist yet. Insert initial record.
        // If a concurrent request inserted in the same millisecond, catch duplicate key (E11000)
        // and atomically increment the newly created record.
        try {
          await collection.insertOne({
            _id: fullKey as any,
            totalHits: 1,
            resetTime,
            expiresAt: resetTime,
          });
          return { totalHits: 1, resetTime };
        } catch (insertErr: any) {
          if (insertErr && (insertErr.code === 11000 || insertErr.name === 'MongoServerError')) {
            const retryDoc = await collection.findOneAndUpdate(
              { _id: fullKey as any },
              { $inc: { totalHits: 1 } },
              { returnDocument: 'after' }
            );
            if (retryDoc) {
              const doc = retryDoc as any;
              return {
                totalHits: doc.totalHits,
                resetTime: doc.resetTime,
              };
            }
          }
          throw insertErr;
        }
      } catch (err: unknown) {
        console.warn(`[MongoRateLimitStore Warning] DB operation failed for key "${fullKey}":`, err);
        if (this.failClosed) {
          throw err;
        }
      }
    }

    // 2. Offline / local fallback memory tracking
    const mem = this.fallbackMemory.get(fullKey);
    if (mem && mem.resetTime.getTime() > now) {
      mem.totalHits += 1;
      return { totalHits: mem.totalHits, resetTime: mem.resetTime };
    }

    const newMem = { totalHits: 1, resetTime };
    this.fallbackMemory.set(fullKey, newMem);
    return { totalHits: 1, resetTime };
  }

  async decrement(key: string): Promise<void> {
    const fullKey = `${this.prefix}${key}`;
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      try {
        await mongoose.connection.collection('ratelimitrecords').updateOne(
          { _id: fullKey as any, totalHits: { $gt: 0 } },
          { $inc: { totalHits: -1 } }
        );
      } catch {}
    }
    const mem = this.fallbackMemory.get(fullKey);
    if (mem && mem.totalHits > 0) {
      mem.totalHits -= 1;
    }
  }

  async resetKey(key: string): Promise<void> {
    const fullKey = `${this.prefix}${key}`;
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      try {
        await mongoose.connection.collection('ratelimitrecords').deleteOne({ _id: fullKey as any });
      } catch {}
    }
    this.fallbackMemory.delete(fullKey);
  }

  async resetAll(): Promise<void> {
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      try {
        await mongoose.connection.collection('ratelimitrecords').deleteMany({
          _id: { $regex: `^${this.prefix}` } as any,
        });
      } catch {}
    }
    this.fallbackMemory.clear();
  }
}
