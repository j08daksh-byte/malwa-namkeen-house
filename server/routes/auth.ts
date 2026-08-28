import { Router } from 'express';
import type { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { User } from '../models/User.ts';
import {
  hashPassword,
  comparePassword,
  generateToken,
  setAuthCookie,
  clearAuthCookie,
  requireAuth,
  requireAdmin,
  type AuthenticatedRequest,
} from '../lib/auth.ts';

const router = Router();

// Rate limiters for brute-force protection
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many sign in attempts. Please try again after 15 minutes.',
  },
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many admin sign in attempts. Please try again after 15 minutes.',
  },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many registration requests from this network. Please try again later.',
  },
});

// Email format regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/register
 * Customer registration only.
 * Role is strictly enforced as "customer".
 */
router.post('/register', registerLimiter, async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ success: false, message: 'Please provide your full name (minimum 2 characters).' });
      return;
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = phone && typeof phone === 'string' ? phone.trim() : '';

    // Check if user already exists
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in.',
      });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // SECURITY: strictly assign role: 'customer' (never accept from body)
    const newUser = await User.create({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password: hashedPassword,
      role: 'customer',
      active: true,
    });

    const token = generateToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
    });

    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
      token,
    });
  } catch (err: unknown) {
    console.error('[Auth Register Error]', err instanceof Error ? err.message : err);
    res.status(500).json({
      success: false,
      message: 'Unable to complete registration. Please verify your connection or try again shortly.',
    });
  }
});

/**
 * POST /api/auth/login
 * Customer & general login.
 */
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Fetch user with password field explicitly included
    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user || !user.password) {
      res.status(401).json({
        success: false,
        message: 'Email or password is incorrect.',
      });
      return;
    }

    if (!user.active) {
      res.status(403).json({
        success: false,
        message: 'Your account is currently inactive. Please contact support.',
      });
      return;
    }

    const isValid = await comparePassword(String(password), user.password);
    if (!isValid) {
      res.status(401).json({
        success: false,
        message: 'Email or password is incorrect.',
      });
      return;
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    setAuthCookie(res, token);

    res.json({
      success: true,
      message: 'Signed in successfully.',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token,
    });
  } catch (err: unknown) {
    console.error('[Auth Login Error]', err instanceof Error ? err.message : err);
    res.status(500).json({
      success: false,
      message: 'Unable to connect to the authentication service. Please try again shortly.',
    });
  }
});

/**
 * GET /api/auth/google/config
 * Returns configured Google OAuth Client ID for frontend GSI button
 */
router.get('/google/config', (_req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
  res.json({
    success: true,
    clientId,
    isConfigured: Boolean(clientId),
  });
});

/**
 * Helper to securely verify Google Credential JWT with Google's OAuth2 tokeninfo endpoint
 */
async function verifyGoogleToken(credential: string): Promise<{
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
} | null> {
  if (!credential || typeof credential !== 'string' || credential.trim().length < 10) {
    return null;
  }

  try {
    const configuredClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential.trim())}`
    );

    if (!response.ok) {
      console.warn('[Google Auth Error] Token verification failed with status:', response.status);
      return null;
    }

    const payload = (await response.json()) as Record<string, any>;
    if (!payload || !payload.email || !payload.sub) {
      return null;
    }

    // Verify issuer
    const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
    if (payload.iss && !validIssuers.includes(payload.iss)) {
      console.warn('[Google Auth Error] Invalid token issuer:', payload.iss);
      return null;
    }

    // Verify audience if GOOGLE_CLIENT_ID is configured
    if (configuredClientId && payload.aud && payload.aud !== configuredClientId) {
      console.warn('[Google Auth Error] Audience mismatch. Expected:', configuredClientId, 'Got:', payload.aud);
      return null;
    }

    // Verify email verification flag
    const isEmailVerified = payload.email_verified === 'true' || payload.email_verified === true;
    if (!isEmailVerified) {
      console.warn('[Google Auth Error] Google email is not verified.');
      return null;
    }

    return {
      sub: payload.sub,
      email: String(payload.email).toLowerCase().trim(),
      name: payload.name || payload.given_name || String(payload.email).split('@')[0],
      picture: payload.picture || '',
      email_verified: true,
    };
  } catch (err) {
    console.error('[Google Auth Verification Exception]:', err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * POST /api/auth/google
 * Sign in or Register customer seamlessly with cryptographically verified Google OAuth
 */
router.post('/google', loginLimiter, async (req: Request, res: Response) => {
  try {
    const { credential, idToken } = req.body;
    const tokenToVerify = credential || idToken;

    if (!tokenToVerify || typeof tokenToVerify !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Google credential token is required.',
      });
      return;
    }

    const googleUser = await verifyGoogleToken(tokenToVerify);

    if (!googleUser || !googleUser.email) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired Google authentication token. Please try again.',
      });
      return;
    }

    const cleanEmail = googleUser.email.trim().toLowerCase();

    // Check if user already exists in MongoDB
    let user = await User.findOne({
      $or: [{ email: cleanEmail }, { googleId: googleUser.sub }],
    });

    if (user) {
      if (!user.active) {
        res.status(403).json({
          success: false,
          message: 'Your account is currently inactive. Please contact support.',
        });
        return;
      }

      // Update googleId, avatar, and lastLogin
      if (!user.googleId) user.googleId = googleUser.sub;
      if (googleUser.picture && !user.avatar) user.avatar = googleUser.picture;
      user.lastLoginAt = new Date();
      if (!user.emailVerifiedAt) user.emailVerifiedAt = new Date();
      await user.save();
    } else {
      // Create new customer user
      user = await User.create({
        name: googleUser.name.trim(),
        email: cleanEmail,
        googleId: googleUser.sub,
        avatar: googleUser.picture || '',
        role: 'customer',
        active: true,
        lastLoginAt: new Date(),
        emailVerifiedAt: new Date(),
      });
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });
    setAuthCookie(res, token);

    res.json({
      success: true,
      message: 'Google Sign-In successful.',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        avatar: user.avatar || '',
        role: user.role,
      },
    });
  } catch (err: unknown) {
    console.error('[Google Auth Error]', err);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed. Please try again or use email sign in.',
    });
  }
});

/**
 * POST /api/auth/admin/login
 * Admin login endpoint verifying server-side role === 'admin'.
 */
router.post('/admin/login', adminLoginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (!user || !user.password) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
      return;
    }

    const isValid = await comparePassword(String(password), user.password);
    if (!isValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
      return;
    }

    // Strict role check
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. You do not have administrator permissions.',
      });
      return;
    }

    if (!user.active) {
      res.status(403).json({
        success: false,
        message: 'Your administrator account has been deactivated. Please contact your super administrator.',
      });
      return;
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    setAuthCookie(res, token);

    res.json({
      success: true,
      message: 'Admin authentication successful.',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token,
    });
  } catch (err: unknown) {
    console.error('[Admin Auth Login Error]', err instanceof Error ? err.message : err);
    res.status(500).json({
      success: false,
      message: 'Admin sign in failed. Please try again later.',
    });
  }
});

/**
 * POST /api/auth/logout
 * Clears authentication session.
 */
router.post('/logout', (_req: Request, res: Response) => {
  clearAuthCookie(res);
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});

/**
 * GET /api/auth/me
 * Returns currently authenticated customer or admin profile.
 */
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      clearAuthCookie(res);
      res.status(404).json({ success: false, message: 'User profile not found.' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile.',
    });
  }
});

/**
 * GET /api/auth/admin/verify
 * Protected route to verify admin privileges.
 */
router.get('/admin/verify', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Admin access verified.',
    admin: req.user,
  });
});

export default router;
