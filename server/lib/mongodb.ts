/**
 * MongoDB connection via Mongoose.
 * Reads MONGODB_URI from the environment.
 * Call connectMongoDB() once during server startup.
 */

import mongoose from 'mongoose';
import { User } from '../models/User.ts';
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
