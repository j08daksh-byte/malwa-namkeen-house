import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { User, type IUser, type UserRole } from '../models/User.ts';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    if (!secret || secret.trim().length < 32) {
      throw new Error('[Security Error] Production JWT_SECRET is required and must be at least 32 characters long.');
    }
    return secret.trim();
  }
  return secret?.trim() || 'malwa-namkeen-dev-only-secret-key-2026';
}

const TOKEN_EXPIRY = '7d';
export const AUTH_COOKIE_NAME = 'malwa_auth_token';

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

/**
 * Hash a plain text password with bcrypt.
 */
export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

/**
 * Compare plain text password against bcrypt hash.
 */
export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

/**
 * Generate a signed JWT token.
 */
export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: TOKEN_EXPIRY });
}

/**
 * Verify a JWT token.
 */
export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as AuthPayload;
  } catch {
    return null;
  }
}

import mongoose from 'mongoose';

/**
 * Extract token from Authorization header or cookie.
 * Prioritizes explicit Bearer header to prevent cookie shadowing.
 */
export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
    return req.cookies[AUTH_COOKIE_NAME];
  }
  return null;
}

/**
 * Set auth cookie on response.
 */
export function setAuthCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

/**
 * Clear auth cookie on response across all potential browser, proxy, and sameSite variations.
 */
export function clearAuthCookie(res: Response): void {
  const isProd = process.env.NODE_ENV === 'production';

  // Standard Express clearCookie calls
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
  });
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
  });
  res.clearCookie(AUTH_COOKIE_NAME, {
    path: '/',
  });

  // Explicitly write expired Set-Cookie headers to guarantee mobile engines & proxies purge it
  res.setHeader('Set-Cookie', [
    `${AUTH_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Lax${isProd ? '; Secure' : ''}`,
    `${AUTH_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Lax`,
    `${AUTH_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly`,
  ]);
}

/**
 * Middleware: Requires a valid authenticated user (customer or admin).
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in.',
    });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please sign in again.',
    });
    return;
  }

  // Live database validation when connected: ensures account exists and is active
  if (mongoose.connection.readyState === 1 && payload.userId && mongoose.Types.ObjectId.isValid(payload.userId)) {
    try {
      const user = await User.findById(payload.userId).select('role active');
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Account not found. Please sign in again.',
        });
        return;
      }
      if (user.active === false) {
        res.status(403).json({
          success: false,
          message: 'Account is deactivated. Please contact support.',
        });
        return;
      }
      payload.role = user.role;
    } catch {
      // Transient error fallback
    }
  }

  req.user = payload;
  res.locals.user = payload;
  next();
}

/**
 * Middleware: Requires an authenticated user with role === 'admin' or 'super_admin'.
 */
export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in.',
    });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please sign in again.',
    });
    return;
  }

  // Live database validation when connected: verifies account exists, is active, and retains admin privileges
  if (mongoose.connection.readyState === 1 && payload.userId && mongoose.Types.ObjectId.isValid(payload.userId)) {
    try {
      const user = await User.findById(payload.userId).select('role active');
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Account not found. Please sign in again.',
        });
        return;
      }
      if (user.active === false) {
        res.status(403).json({
          success: false,
          message: 'Account is deactivated. Please contact an administrator.',
        });
        return;
      }
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Administrator privilege required.',
        });
        return;
      }
      payload.role = user.role;
    } catch {
      if (payload.role !== 'admin' && payload.role !== 'super_admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Administrator privilege required.',
        });
        return;
      }
    }
  } else {
    if (payload.role !== 'admin' && payload.role !== 'super_admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Administrator privilege required.',
      });
      return;
    }
  }

  req.user = payload;
  res.locals.user = payload;
  next();
}

/**
 * Middleware: Requires an authenticated user with role === 'super_admin'.
 */
export async function requireSuperAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in.',
    });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please sign in again.',
    });
    return;
  }

  // Live database validation when connected: ensures super_admin privileges remain valid
  if (mongoose.connection.readyState === 1 && payload.userId && mongoose.Types.ObjectId.isValid(payload.userId)) {
    try {
      const user = await User.findById(payload.userId).select('role active');
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Account not found. Please sign in again.',
        });
        return;
      }
      if (user.active === false) {
        res.status(403).json({
          success: false,
          message: 'Account is deactivated. Please contact an administrator.',
        });
        return;
      }
      if (user.role !== 'super_admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Super Administrator privilege required.',
        });
        return;
      }
      payload.role = user.role;
    } catch {
      if (payload.role !== 'super_admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied. Super Administrator privilege required.',
        });
        return;
      }
    }
  } else {
    if (payload.role !== 'super_admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Super Administrator privilege required.',
      });
      return;
    }
  }

  req.user = payload;
  res.locals.user = payload;
  next();
}
