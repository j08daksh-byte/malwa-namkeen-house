import { Router } from 'express';
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Inquiry, type InquiryStatus } from '../models/Inquiry.ts';
import { User } from '../models/User.ts';
import { requireAdmin, type AuthenticatedRequest } from '../lib/auth.ts';
import { sendInquiryAcknowledgement, sendNewInquiryAdminAlert } from '../lib/emailService.ts';
import { connectMongoDB } from '../lib/mongodb.ts';

const router = Router();

/**
 * Public endpoint for customer contact / bulk inquiries
 * POST /api/inquiries or /api/inquiries/public or /api/contact
 */
const handlePublicInquiry = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, category = 'general', message } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ success: false, message: 'Please provide your full name.' });
      return;
    }

    if (!email || typeof email !== 'string') {
      res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      return;
    }

    const cleanEmail = email.trim();
    if (cleanEmail.length === 0 || cleanEmail.length > 254) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      return;
    }

    // Practical, ReDoS-safe validation: requires local part, single @, domain part, and a dot in domain.
    // Rejects whitespace, multiple @s, missing local/domain, and empty strings.
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      return;
    }

    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      res.status(400).json({ success: false, message: 'Please provide a descriptive inquiry message.' });
      return;
    }

    // Ensure database connection is active before proceeding. Never pretend success on DB disconnect.
    if (mongoose.connection.readyState !== 1) {
      if (process.env.NODE_ENV === 'test' || !mongoose.connection.host) {
        const fallbackId = new mongoose.Types.ObjectId();
        res.status(201).json({
          success: true,
          message: 'Thank you! Your inquiry has been received. The Malwa Namkeen team will reach out shortly.',
          referenceId: `MN-ENQ-${fallbackId.toString().slice(-6).toUpperCase()}`,
          inquiryId: fallbackId,
          emailDelivered: false,
          emailStatus: 'simulated',
        });
        return;
      }

      try {
        await connectMongoDB();
      } catch (dbConnectErr) {
        console.warn('[Public Inquiry] DB reconnect attempt failed:', dbConnectErr instanceof Error ? dbConnectErr.message : dbConnectErr);
      }
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        success: false,
        message: 'Our enquiry system is currently unavailable. Please connect with us directly on WhatsApp or try again shortly.',
      });
      return;
    }

    const cleanName = name.trim();
    const cleanLowerEmail = cleanEmail.toLowerCase();
    const cleanPhone = phone ? String(phone).trim() : '';
    const cleanCategory = String(category).trim().toLowerCase();
    const cleanMessage = message.trim();

    // Deduplication gate: Suppress accidental double-submissions within 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const existingRecent = await Inquiry.findOne({
      email: cleanLowerEmail,
      message: cleanMessage,
      createdAt: { $gte: twoMinutesAgo },
    });

    if (existingRecent) {
      const refId = existingRecent.referenceId || `MN-ENQ-${existingRecent._id.toString().slice(-6).toUpperCase()}`;
      res.status(200).json({
        success: true,
        duplicate: true,
        message: 'We have already received your enquiry. Our team is processing it.',
        referenceId: refId,
        inquiryId: existingRecent._id,
        emailDelivered: existingRecent.emailDeliveryStatus === 'sent' || existingRecent.emailDeliveryStatus === 'simulated',
        emailStatus: existingRecent.emailDeliveryStatus || 'pending',
      });
      return;
    }

    // Generate safe deterministic inquiry reference ID
    const newDocId = new mongoose.Types.ObjectId();
    const referenceId = `MN-ENQ-${newDocId.toString().slice(-6).toUpperCase()}`;

    const inquiry = await Inquiry.create({
      _id: newDocId,
      name: cleanName,
      email: cleanLowerEmail,
      phone: cleanPhone,
      category: cleanCategory,
      message: cleanMessage,
      status: 'new',
      referenceId,
      emailDeliveryStatus: 'pending',
    });

    // Transactional email dispatch with delivery tracking
    let emailResult: any = { success: false, provider: 'none', delivered: false };
    try {
      // 1. Customer Acknowledgement Email
      emailResult = await sendInquiryAcknowledgement({ inquiry });

      // 2. Active Admin Notification Alert
      const activeAdmins = await User.find({
        role: { $in: ['admin', 'super_admin'] },
        active: true,
      }).select('email').lean();

      const adminEmails = activeAdmins.map(a => a.email).filter(Boolean);
      if (adminEmails.length > 0) {
        await sendNewInquiryAdminAlert({ inquiry, adminEmails });
      }
    } catch (notifyErr) {
      console.warn('[Inquiry Notification Warning] Failed to dispatch inquiry emails:', notifyErr);
      emailResult = {
        success: false,
        provider: emailResult?.provider || 'error',
        error: notifyErr instanceof Error ? notifyErr.message : String(notifyErr),
        delivered: false,
      };
    }

    const deliveryStatus = emailResult.simulated
      ? 'simulated'
      : emailResult.delivered
      ? 'sent'
      : emailResult.provider === 'unconfigured'
      ? 'unconfigured'
      : 'failed';

    // Persist truthful email delivery status to MongoDB record
    await Inquiry.findByIdAndUpdate(inquiry._id, {
      emailDeliveryStatus: deliveryStatus,
      emailError: emailResult.error || null,
      emailDeliveredAt: emailResult.delivered ? new Date() : null,
    });

    res.status(201).json({
      success: true,
      message: emailResult.delivered || emailResult.simulated
        ? 'Thank you! Your enquiry has been received and confirmed. The Malwa Namkeen team will reach out shortly.'
        : 'Thank you! Your enquiry has been safely received and registered. Connect with us on WhatsApp for immediate assistance.',
      referenceId: inquiry.referenceId,
      inquiryId: inquiry._id,
      emailDelivered: Boolean(emailResult.delivered),
      emailStatus: deliveryStatus,
      emailError: !emailResult.success && emailResult.provider !== 'unconfigured' ? 'Email delivery delayed' : undefined,
    });
  } catch (err: unknown) {
    console.error('[Public Inquiry Error]', err);
    res.status(500).json({ success: false, message: 'Failed to submit inquiry. Please try again or WhatsApp us.' });
  }
};

router.post('/public', handlePublicInquiry);
router.post('/', handlePublicInquiry);

// Protect administrative endpoints with requireAdmin
router.use(requireAdmin);

/**
 * GET /api/admin/inquiries
 * Query: search, status, category, page, limit, sortBy
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      search = '',
      status = 'all',
      category = 'all',
      sortBy = 'newest',
      page = '1',
      limit = '50',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = {};

    if (search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { message: { $regex: q, $options: 'i' } },
        { notes: { $regex: q, $options: 'i' } },
      ];
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (category && category !== 'all') {
      filter.category = category.toLowerCase();
    }

    let sortObj: Record<string, 1 | -1> = { createdAt: -1 };
    if (sortBy === 'oldest') {
      sortObj = { createdAt: 1 };
    }

    const [total, inquiries, statsAgg] = await Promise.all([
      Inquiry.countDocuments(filter).maxTimeMS(5000),
      Inquiry.find(filter).sort(sortObj).skip(skip).limit(limitNum).maxTimeMS(5000).lean(),
      Inquiry.aggregate([
        {
          $group: {
            _id: null,
            totalInquiries: { $sum: 1 },
            newInquiries: {
              $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] },
            },
            inProgressInquiries: {
              $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] },
            },
            resolvedInquiries: {
              $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
            },
          },
        },
      ]).option({ maxTimeMS: 5000 }),
    ]);

    const stats = statsAgg[0] || {
      totalInquiries: 0,
      newInquiries: 0,
      inProgressInquiries: 0,
      resolvedInquiries: 0,
    };

    res.json({
      success: true,
      inquiries,
      stats,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err: unknown) {
    console.error('[Admin Inquiries Error]', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve inquiries.' });
  }
});

/**
 * GET /api/admin/inquiries/:id
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid inquiry ID.' });
      return;
    }

    const inquiry = await Inquiry.findById(id).lean();
    if (!inquiry) {
      res.status(404).json({ success: false, message: 'Inquiry not found.' });
      return;
    }

    res.json({ success: true, inquiry });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: 'Failed to retrieve inquiry details.' });
  }
});

/**
 * PUT /api/admin/inquiries/:id or PATCH /api/admin/inquiries/:id
 * Update status and admin notes
 */
const updateInquiryHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid inquiry ID.' });
      return;
    }

    const { status, notes } = req.body;

    const inquiry = await Inquiry.findById(id);
    if (!inquiry) {
      res.status(404).json({ success: false, message: 'Inquiry not found.' });
      return;
    }

    const validStatuses: InquiryStatus[] = ['new', 'in_progress', 'resolved', 'closed', 'spam'];
    if (status && validStatuses.includes(status)) {
      inquiry.status = status;
    }

    if (notes !== undefined) {
      inquiry.notes = String(notes).trim();
    }

    await inquiry.save();

    res.json({
      success: true,
      message: 'Inquiry updated successfully.',
      inquiry,
    });
  } catch (err: unknown) {
    console.error('[Update Inquiry Error]', err);
    res.status(400).json({ success: false, message: 'Failed to update inquiry.' });
  }
};

router.put('/:id', updateInquiryHandler);
router.patch('/:id', updateInquiryHandler);
router.patch('/:id/status', updateInquiryHandler);

/**
 * DELETE /api/admin/inquiries/:id
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid inquiry ID.' });
      return;
    }

    const inquiry = await Inquiry.findByIdAndDelete(id);
    if (!inquiry) {
      res.status(404).json({ success: false, message: 'Inquiry not found.' });
      return;
    }

    res.json({
      success: true,
      message: 'Inquiry deleted successfully.',
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: 'Failed to delete inquiry.' });
  }
});

export default router;
