import { Router } from 'express';
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Inquiry, type InquiryStatus } from '../models/Inquiry.ts';
import { requireAdmin, type AuthenticatedRequest } from '../lib/auth.ts';

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

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      return;
    }

    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      res.status(400).json({ success: false, message: 'Please provide a descriptive inquiry message.' });
      return;
    }

    const inquiry = await Inquiry.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? String(phone).trim() : '',
      category: String(category).trim().toLowerCase(),
      message: message.trim(),
      status: 'new',
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your inquiry has been received. The Malwa Namkeen team will reach out shortly.',
      referenceId: inquiry._id.toString().slice(-6).toUpperCase(),
      inquiryId: inquiry._id,
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
      Inquiry.countDocuments(filter),
      Inquiry.find(filter).sort(sortObj).skip(skip).limit(limitNum).lean(),
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
      ]),
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
 * PUT /api/admin/inquiries/:id
 * Update status and admin notes
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
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
});

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
