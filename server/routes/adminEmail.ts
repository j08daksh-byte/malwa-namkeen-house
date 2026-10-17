import { Router } from 'express';
import type { Response } from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { requireAdmin, type AuthenticatedRequest } from '../lib/auth.ts';
import {
  runEmailSmokeTest,
  getEmailConfig,
  maskEmail,
  sanitizeErrorMessage,
  type EmailResult,
} from '../lib/emailService.ts';
import { EmailLog } from '../models/EmailLog.ts';

const router = Router();

// Enforce requireAdmin on all administrative email endpoints (HTTP 401 unauthenticated, HTTP 403 non-admin)
router.use(requireAdmin);

// Standard RFC 5322 simplified email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Abuse and quota protection: limit live smoke tests to 10 per 10 minutes per IP/session
const smokeTestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many smoke test requests. Please wait a few minutes before trying again.',
  },
});

/**
 * Helper to execute smoke test logic safely and return structured JSON
 */
export async function handleSmokeTest(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { targetEmail } = req.body || {};
    let recipient = '';

    if (targetEmail) {
      if (typeof targetEmail !== 'string' || !EMAIL_REGEX.test(targetEmail.trim().toLowerCase())) {
        res.status(400).json({
          success: false,
          message: 'Invalid target email address format.',
        });
        return;
      }
      recipient = targetEmail.trim().toLowerCase();
    } else {
      recipient =
        req.user?.email ||
        process.env.ADMIN_NOTIFICATION_EMAIL ||
        'malwanamkeenhouse@gmail.com';
    }

    const result: EmailResult = await runEmailSmokeTest({ targetEmail: recipient });
    const maskedRecipient = maskEmail(recipient);

    if (!result.success) {
      const statusCode =
        result.provider === 'none' || result.provider === 'unconfigured' ? 503 : 502;
      const cleanError = sanitizeErrorMessage(result.error) || 'Email smoke test failed.';
      res.status(statusCode).json({
        success: false,
        message: cleanError,
        recipient: maskedRecipient,
        result: {
          provider: result.provider,
          delivered: Boolean(result.delivered),
          simulated: Boolean(result.simulated),
          error: cleanError,
        },
      });
      return;
    }

    res.json({
      success: true,
      message: result.simulated
        ? `Smoke test simulated successfully for <${maskedRecipient}>.`
        : `Smoke test email successfully delivered to <${maskedRecipient}>.`,
      recipient: maskedRecipient,
      result: {
        provider: result.provider,
        delivered: Boolean(result.delivered),
        simulated: Boolean(result.simulated),
        messageId: result.messageId || null,
      },
    });
  } catch (err: unknown) {
    console.error('[Admin Email Smoke Test Error]:', err);
    const msg = err instanceof Error ? err.message : 'Internal error during email smoke test.';
    res.status(500).json({ success: false, message: msg });
  }
}

/**
 * POST /api/admin/email/smoke-test
 * Authenticated admin endpoint to run the transactional email smoke test.
 */
router.post('/smoke-test', smokeTestLimiter, handleSmokeTest);

/**
 * GET /api/admin/email/status
 * Returns current email provider configuration status and masked delivery statistics.
 * Never leaks API keys or secrets.
 */
router.get('/status', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const config = getEmailConfig();
    const isKeyConfigured = Boolean(
      process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim()
    );

    let totalLogs = 0;
    let recentLogs: any[] = [];

    if (mongoose.connection.readyState === 1) {
      totalLogs = await EmailLog.countDocuments();
      const rawLogs = await EmailLog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('eventType recipient subject provider status error attemptedAt createdAt')
        .lean();

      recentLogs = rawLogs.map((log) => ({
        ...log,
        recipient: maskEmail(log.recipient),
      }));
    }

    res.json({
      success: true,
      provider: config.provider,
      isConfigured: isKeyConfigured,
      fromEmail: config.emailFrom,
      appBaseUrl: config.appBaseUrl,
      stats: {
        totalLogs,
      },
      recentLogs,
    });
  } catch (err: unknown) {
    console.error('[Admin Email Status Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve email status.' });
  }
});

export default router;
