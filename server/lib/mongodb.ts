/**
 * MongoDB connection via Mongoose.
 * Reads MONGODB_URI from the environment.
 * Call connectMongoDB() once during server startup.
 */

import mongoose from 'mongoose';

let isConnected = false;

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
    await mongoose.connect(uri);
    isConnected = true;
    console.log('[MongoDB] Connected successfully.');
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
