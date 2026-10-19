import { Router } from 'express';
import type { Request, Response } from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { MongoRateLimitStore } from '../lib/mongoRateLimitStore.ts';
import { User } from '../models/User.ts';
import { hashPassword, generateToken, setAuthCookie } from '../lib/auth.ts';
import {
  sendPasswordResetEmail,
  sendCustomerPasswordReset,
  sendPasswordChangedConfirmation,
} from '../lib/emailService.ts';

const router = Router();

// Rate limiter for forgot-password requests (Brute-force & email flood protection)
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { default: false },
  store: new MongoRateLimitStore('auth:forgot-pwd', 15 * 60 * 1000),
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again after 15 minutes.',
  },
});

// Rate limiter for token submissions
const tokenSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { default: false },
  store: new MongoRateLimitStore('auth:token-submit', 15 * 60 * 1000),
  message: {
    success: false,
    message: 'Too many requests. Please try again after 15 minutes.',
  },
});

/**
 * POST /api/auth/forgot-password
 * General & Customer password reset trigger.
 * Verifies if user exists; informs customer if account does not exist or sends reset email.
 */
router.post('/forgot-password', forgotPasswordLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      res.status(400).json({
        success: false,
        message: 'A valid email address is required.',
      });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Look up active user account (customer or admin)
    const user = await User.findOne({
      email: cleanEmail,
      active: true,
    });

    if (!user) {
      res.status(404).json({
        success: false,
        exists: false,
        message: 'No account found with this email address. Please create an account to get started.',
      });
      return;
    }

    // Generate cryptographically random token (32 bytes = 64 hex chars)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = expiresAt;
    await user.save();

    // Dispatch reset email based on role
    if (user.role === 'admin' || user.role === 'super_admin') {
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        token: rawToken,
      });
    } else {
      await sendCustomerPasswordReset({
        email: user.email,
        name: user.name,
        token: rawToken,
      });
    }

    res.json({
      success: true,
      exists: true,
      message: 'Password reset instructions have been sent to your email. Please check your inbox.',
    });
  } catch (err: unknown) {
    console.error('[Customer Forgot Password Error]', err);
    res.status(500).json({
      success: false,
      message: 'Unable to process password reset request at this time. Please try again.',
    });
  }
});

/**
 * POST /api/auth/admin/forgot-password
 * Triggers password reset email for super_admin or admin accounts.
 * Verifies administrator account exists before dispatching.
 */
router.post('/admin/forgot-password', forgotPasswordLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      res.status(400).json({
        success: false,
        message: 'A valid email address is required.',
      });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Look up administrator account only
    const user = await User.findOne({
      email: cleanEmail,
      role: { $in: ['admin', 'super_admin'] },
      active: true,
    });

    if (!user) {
      res.status(404).json({
        success: false,
        exists: false,
        message: 'No administrative account found with this email address.',
      });
      return;
    }

    // Generate cryptographically random token (32 bytes = 64 hex chars)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = expiresAt;
    await user.save();

    // Dispatch email
    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      token: rawToken,
    });

    res.json({
      success: true,
      exists: true,
      message: 'Password reset instructions have been sent to your email. Please check your inbox.',
    });
  } catch (err: unknown) {
    console.error('[Admin Forgot Password Error]', err);
    res.status(500).json({
      success: false,
      message: 'Unable to process password reset request at this time. Please try again.',
    });
  }
});

/**
 * GET /api/auth/verify-reset-token
 * Validates whether a reset token is valid and unexpired.
 */
router.get('/verify-reset-token', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ valid: false, message: 'Invalid or missing recovery token.' });
      return;
    }

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    }).select('+passwordResetTokenHash');

    if (!user) {
      res.status(400).json({
        valid: false,
        message: 'This password reset link is invalid or has expired. Please request a new one.',
      });
      return;
    }

    res.json({
      valid: true,
      email: user.email,
      name: user.name,
    });
  } catch (err: unknown) {
    console.error('[Verify Reset Token Error]', err);
    res.status(400).json({ valid: false, message: 'Invalid or expired recovery token.' });
  }
});

/**
 * POST /api/auth/reset-password
 * Consumes the reset token and sets a new password.
 */
router.post('/reset-password', tokenSubmissionLimiter, async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ success: false, message: 'Recovery token is required.' });
      return;
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Your new password must be at least 6 characters long.',
      });
      return;
    }

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    }).select('+password +passwordResetTokenHash');

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'This password reset link is invalid, expired, or has already been used.',
      });
      return;
    }

    // Set new password
    user.password = await hashPassword(newPassword);
    // Invalidate the reset token immediately (single use)
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;

    await user.save();

    // Dispatch confirmation email (non-blocking)
    sendPasswordChangedConfirmation({
      email: user.email,
      name: user.name || 'Valued Customer',
    }).catch((err) => {
      console.warn('[Email Warning] Failed to dispatch password reset confirmation:', err);
    });

    res.json({
      success: true,
      message: 'Password reset successfully. You may now sign in with your new credentials.',
    });
  } catch (err: unknown) {
    console.error('[Reset Password Error]', err);
    res.status(500).json({ success: false, message: 'Failed to reset password. Please try again.' });
  }
});

/**
 * GET /api/auth/verify-invite-token
 * Validates an administrator invitation token.
 */
router.get('/verify-invite-token', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ valid: false, message: 'Invalid or missing invitation token.' });
      return;
    }

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const user = await User.findOne({
      invitationTokenHash: tokenHash,
      invitationExpiresAt: { $gt: new Date() },
    }).select('+invitationTokenHash');

    if (!user) {
      res.status(400).json({
        valid: false,
        message: 'This invitation link is invalid, expired, or has already been accepted.',
      });
      return;
    }

    res.json({
      valid: true,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (err: unknown) {
    console.error('[Verify Invite Token Error]', err);
    res.status(400).json({ valid: false, message: 'Invalid or expired invitation token.' });
  }
});

/**
 * POST /api/auth/accept-invite
 * Consumes the invitation token, sets account password, and activates account.
 */
router.post('/accept-invite', tokenSubmissionLimiter, async (req: Request, res: Response) => {
  try {
    const { token, name, password } = req.body;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ success: false, message: 'Invitation token is required.' });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
      return;
    }

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const user = await User.findOne({
      invitationTokenHash: tokenHash,
      invitationExpiresAt: { $gt: new Date() },
    }).select('+invitationTokenHash');

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'This invitation link is invalid, expired, or has already been used.',
      });
      return;
    }

    if (name && typeof name === 'string' && name.trim().length > 1) {
      user.name = name.trim();
    }

    user.password = await hashPassword(password);
    user.active = true;
    user.invitationAcceptedAt = new Date();
    user.invitationTokenHash = undefined;
    user.invitationExpiresAt = undefined;

    await user.save();

    // Auto-login upon successful invite acceptance
    const authToken = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    setAuthCookie(res, authToken);

    res.json({
      success: true,
      message: 'Account activated successfully. Welcome to Malwa Namkeen House administration team!',
      token: authToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: unknown) {
    console.error('[Accept Invite Error]', err);
    res.status(500).json({ success: false, message: 'Failed to activate administrator account.' });
  }
});

export default router;
