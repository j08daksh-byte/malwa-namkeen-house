import { Router } from 'express';
import type { Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { User, type UserRole } from '../models/User.ts';
import { AuditLog } from '../models/AuditLog.ts';
import { requireSuperAdmin, type AuthenticatedRequest } from '../lib/auth.ts';
import { sendAdminInvitationEmail, sendRoleChangedNotification } from '../lib/emailService.ts';

const router = Router();

// Strictly enforce super_admin authorization across all staff management routes
router.use(requireSuperAdmin);

// Email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * GET /api/admin/staff
 * Lists all administrative accounts (super_admin and admin).
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const staffList = await User.find({ role: { $in: ['admin', 'super_admin'] } })
      .select('-password -passwordResetTokenHash')
      .sort({ role: 1, createdAt: -1 })
      .lean();

    const formatted = staffList.map(u => ({
      _id: String(u._id),
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      role: u.role,
      active: Boolean(u.active),
      lastLoginAt: u.lastLoginAt || null,
      createdAt: u.createdAt,
      invitedAt: u.invitedAt || null,
      invitationAcceptedAt: u.invitationAcceptedAt || null,
      isPendingInvitation: !u.invitationAcceptedAt && Boolean(u.invitationExpiresAt && u.invitationExpiresAt > new Date()),
    }));

    const superAdminCount = staffList.filter(u => u.role === 'super_admin' && u.active).length;

    res.json({
      success: true,
      staff: formatted,
      superAdminCount,
      currentAdminId: req.user?.userId,
    });
  } catch (err: unknown) {
    console.error('[Admin Staff List Error]', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve administrative staff.' });
  }
});

/**
 * POST /api/admin/staff/invite
 * Invites a new staff member with 'admin' or 'super_admin' role.
 */
router.post('/invite', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, name, role = 'admin' } = req.body;

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
      res.status(400).json({ success: false, message: 'A valid email address is required.' });
      return;
    }

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ success: false, message: 'A valid full name is required.' });
      return;
    }

    const assignedRole: UserRole = role === 'super_admin' ? 'super_admin' : 'admin';
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // Check if user already exists
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      if (existing.role === 'customer') {
        res.status(409).json({
          success: false,
          message: 'An account with this email is currently registered as a customer. Please use a unique staff email address.',
        });
        return;
      }
      res.status(409).json({
        success: false,
        message: 'An administrator with this email address already exists.',
      });
      return;
    }

    // Generate cryptographically secure invitation token (32 bytes = 64 hex chars)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const newStaff = await User.create({
      name: cleanName,
      email: cleanEmail,
      role: assignedRole,
      active: true,
      invitationTokenHash: tokenHash,
      invitationExpiresAt: expiresAt,
      invitedBy: req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : undefined,
      invitedAt: new Date(),
    });

    // Send invitation email
    const emailResult = await sendAdminInvitationEmail({
      email: cleanEmail,
      name: cleanName,
      token: rawToken,
      inviterName: req.user?.email || 'Super Administrator',
    });

    res.status(201).json({
      success: true,
      message: `Invitation generated successfully for ${cleanEmail}.`,
      staff: {
        _id: String(newStaff._id),
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
        active: newStaff.active,
        isPendingInvitation: true,
        createdAt: newStaff.createdAt,
      },
      emailDispatched: emailResult.success,
      simulated: emailResult.simulated,
    });
  } catch (err: unknown) {
    console.error('[Admin Staff Invite Error]', err);
    res.status(500).json({ success: false, message: 'Failed to generate administrator invitation.' });
  }
});

/**
 * PATCH /api/admin/staff/:id
 * Updates admin details, role, or active status.
 */
router.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role, active } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid staff ID.' });
      return;
    }

    const staffMember = await User.findOne({ _id: id, role: { $in: ['admin', 'super_admin'] } });
    if (!staffMember) {
      res.status(404).json({ success: false, message: 'Administrator record not found.' });
      return;
    }

    const oldRole = staffMember.role;
    const isRoleChanging =
      Boolean(role) && (role === 'admin' || role === 'super_admin') && role !== oldRole;

    // ── LAST SUPER ADMIN SAFETY GUARD ──
    const isTargetSuperAdmin = staffMember.role === 'super_admin';
    const isDemotingOrDeactivating =
      (isRoleChanging && role !== 'super_admin' && isTargetSuperAdmin) ||
      (active === false && isTargetSuperAdmin && staffMember.active);

    if (isDemotingOrDeactivating) {
      const activeSuperAdmins = await User.countDocuments({
        role: 'super_admin',
        active: true,
      });

      if (activeSuperAdmins <= 1) {
        res.status(400).json({
          success: false,
          message:
            'Operation prohibited: Cannot demote or deactivate the last remaining active Super Administrator.',
        });
        return;
      }
    }

    if (name && typeof name === 'string') staffMember.name = name.trim();
    if (isRoleChanging) staffMember.role = role;
    if (typeof active === 'boolean') staffMember.active = active;

    // Persist changes to database first
    await staffMember.save();

    let emailDispatched = false;
    let simulatedEmail = false;

    if (isRoleChanging) {
      // 1. Audit Log: ROLE_CHANGED
      try {
        await AuditLog.create({
          action: 'ROLE_CHANGED',
          actorId: req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : undefined,
          targetUserId: staffMember._id,
          metadata: {
            oldRole,
            newRole: staffMember.role,
            email: staffMember.email,
            timestamp: new Date(),
          },
        });
      } catch (logErr) {
        console.warn('[AuditLog Warning] Failed to log role change:', logErr);
      }

      // 2. Dispatch role update notification email (after DB update succeeds)
      try {
        const emailRes = await sendRoleChangedNotification({
          email: staffMember.email,
          name: staffMember.name,
          oldRole,
          newRole: staffMember.role,
        });
        emailDispatched = Boolean(emailRes.success);
        simulatedEmail = Boolean(emailRes.simulated);
      } catch (emailErr) {
        console.error('[Role Change Email Error]', emailErr);
      }
    }

    res.json({
      success: true,
      message: 'Administrator account updated successfully.',
      roleChanged: isRoleChanging,
      emailDispatched,
      simulated: simulatedEmail,
      staff: {
        _id: String(staffMember._id),
        name: staffMember.name,
        email: staffMember.email,
        role: staffMember.role,
        active: staffMember.active,
        updatedAt: staffMember.updatedAt,
      },
    });
  } catch (err: unknown) {
    console.error('[Admin Staff Update Error]', err);
    res.status(500).json({ success: false, message: 'Failed to update administrator record.' });
  }
});

/**
 * POST /api/admin/staff/promote
 * Promotes an existing customer or administrator to admin or super_admin.
 * Strictly protected by requireSuperAdmin.
 */
router.post('/promote', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, email, role } = req.body;

    if (!role || (role !== 'admin' && role !== 'super_admin')) {
      res.status(400).json({
        success: false,
        message: 'Invalid target role. Must be either "admin" or "super_admin".',
      });
      return;
    }

    // Lookup user by ID or Email
    let query: Record<string, unknown> = {};
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query = { _id: userId };
    } else if (email && typeof email === 'string' && EMAIL_REGEX.test(email.trim().toLowerCase())) {
      query = { email: email.trim().toLowerCase() };
    } else {
      res.status(400).json({
        success: false,
        message: 'A valid user ID or registered email address is required for promotion.',
      });
      return;
    }

    const targetUser = await User.findOne(query);
    if (!targetUser) {
      res.status(404).json({
        success: false,
        message: 'User account not found. Please verify the user ID or email address.',
      });
      return;
    }

    if (!targetUser.active) {
      res.status(400).json({
        success: false,
        message: 'Cannot promote an inactive or deactivated user account.',
      });
      return;
    }

    const oldRole = targetUser.role;
    if (oldRole === role) {
      res.status(400).json({
        success: false,
        message: `This user already possesses the "${role === 'super_admin' ? 'Super Administrator' : 'Administrator'}" role.`,
      });
      return;
    }

    // Apply role promotion
    targetUser.role = role;
    await targetUser.save();

    // 1. Audit Log: ROLE_CHANGED
    try {
      await AuditLog.create({
        action: 'ROLE_CHANGED',
        actorId: req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : undefined,
        targetUserId: targetUser._id,
        metadata: {
          oldRole,
          newRole: targetUser.role,
          email: targetUser.email,
          timestamp: new Date(),
        },
      });
    } catch (logErr) {
      console.warn('[AuditLog Warning] Failed to log role promotion:', logErr);
    }

    // 2. Dispatch role update email notification
    let emailDispatched = false;
    let simulatedEmail = false;
    try {
      const emailRes = await sendRoleChangedNotification({
        email: targetUser.email,
        name: targetUser.name,
        oldRole,
        newRole: targetUser.role,
      });
      emailDispatched = Boolean(emailRes.success);
      simulatedEmail = Boolean(emailRes.simulated);
    } catch (emailErr) {
      console.error('[Role Promotion Email Error]', emailErr);
    }

    res.json({
      success: true,
      message: `User ${targetUser.email} has been promoted to ${role === 'super_admin' ? 'Super Administrator' : 'Administrator'}.`,
      roleChanged: true,
      emailDispatched,
      simulated: simulatedEmail,
      staff: {
        _id: String(targetUser._id),
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        active: targetUser.active,
        updatedAt: targetUser.updatedAt,
      },
    });
  } catch (err: unknown) {
    console.error('[Admin Staff Promote Error]', err);
    res.status(500).json({ success: false, message: 'Failed to promote user account.' });
  }
});

/**
 * DELETE /api/admin/staff/:id
 * Removes an administrator account.
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid staff ID.' });
      return;
    }

    // Prevent self-deletion
    if (req.user?.userId === id) {
      res.status(400).json({ success: false, message: 'You cannot delete your own administrative account.' });
      return;
    }

    const staffMember = await User.findOne({ _id: id, role: { $in: ['admin', 'super_admin'] } });
    if (!staffMember) {
      res.status(404).json({ success: false, message: 'Administrator record not found.' });
      return;
    }

    // ── LAST SUPER ADMIN SAFETY GUARD ──
    if (staffMember.role === 'super_admin') {
      const activeSuperAdmins = await User.countDocuments({
        role: 'super_admin',
        active: true,
      });

      if (activeSuperAdmins <= 1) {
        res.status(400).json({
          success: false,
          message: 'Operation prohibited: Cannot delete the last remaining Super Administrator.',
        });
        return;
      }
    }

    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: `Administrator account for ${staffMember.email} has been permanently deleted.`,
    });
  } catch (err: unknown) {
    console.error('[Admin Staff Delete Error]', err);
    res.status(500).json({ success: false, message: 'Failed to remove administrator account.' });
  }
});

export default router;
