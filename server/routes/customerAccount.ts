import { Router } from 'express';
import type { Response } from 'express';
import mongoose from 'mongoose';
import { User, type IUserAddress } from '../models/User.ts';
import { Order } from '../models/Order.ts';
import { requireAuth, hashPassword, comparePassword, type AuthenticatedRequest } from '../lib/auth.ts';

const router = Router();

// Protect all customer account routes
router.use(requireAuth);

// ─── Profile Management ───────────────────────────────────────────────────────

/**
 * GET /api/customer/profile
 * Returns the current customer's profile and address count.
 */
router.get('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user || !user.active) {
      res.status(404).json({ success: false, message: 'Account not found or inactive.' });
      return;
    }

    const orderCount = await Order.countDocuments({
      $or: [{ customer: user._id }, { 'customerInfo.email': user.email }],
    });

    res.json({
      success: true,
      profile: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        addressCount: (user.addresses || []).length,
        orderCount,
        createdAt: user.createdAt,
      },
    });
  } catch (err: unknown) {
    console.error('[Customer Profile Error]', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
});

/**
 * PUT /api/customer/profile
 * Updates customer full name and phone number.
 */
router.put('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, phone } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ success: false, message: 'Please provide a valid full name.' });
      return;
    }

    const user = await User.findById(req.user?.userId);
    if (!user || !user.active) {
      res.status(404).json({ success: false, message: 'Account not found or inactive.' });
      return;
    }

    user.name = name.trim();
    if (typeof phone === 'string') {
      user.phone = phone.trim();
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      profile: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err: unknown) {
    console.error('[Customer Profile Update Error]', err);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

/**
 * PUT /api/customer/password
 * Changes customer account password.
 */
router.put('/password', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
      return;
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
      return;
    }

    const user = await User.findById(req.user?.userId).select('+password');
    if (!user || !user.active) {
      res.status(404).json({ success: false, message: 'Account not found or inactive.' });
      return;
    }

    if (!user.password) {
      res.status(400).json({ success: false, message: 'Account has no password set.' });
      return;
    }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Incorrect current password.' });
      return;
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err: unknown) {
    console.error('[Customer Password Change Error]', err);
    res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
});

// ─── Saved Address Book CRUD ─────────────────────────────────────────────────

/**
 * GET /api/customer/addresses
 * Retrieves all saved addresses for the customer.
 */
router.get('/addresses', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user || !user.active) {
      res.status(404).json({ success: false, message: 'Account not found or inactive.' });
      return;
    }

    res.json({
      success: true,
      addresses: user.addresses || [],
    });
  } catch (err: unknown) {
    console.error('[Get Addresses Error]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch addresses.' });
  }
});

/**
 * POST /api/customer/addresses
 * Adds a new address to the customer's address book.
 */
router.post('/addresses', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, phone, addressLine1, addressLine2, city, state, pincode, landmark, isDefault } =
      req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ success: false, message: 'Recipient name is required.' });
      return;
    }
    if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
      res.status(400).json({ success: false, message: 'Valid phone number is required.' });
      return;
    }
    if (!addressLine1 || typeof addressLine1 !== 'string' || addressLine1.trim().length < 3) {
      res.status(400).json({ success: false, message: 'Address Line 1 is required.' });
      return;
    }
    if (!city || typeof city !== 'string' || city.trim().length < 2) {
      res.status(400).json({ success: false, message: 'City is required.' });
      return;
    }
    if (!state || typeof state !== 'string' || state.trim().length < 2) {
      res.status(400).json({ success: false, message: 'State is required.' });
      return;
    }
    if (!pincode || typeof pincode !== 'string' || !/^\d{6}$/.test(pincode.trim())) {
      res.status(400).json({ success: false, message: 'Valid 6-digit Indian PIN code is required.' });
      return;
    }

    const user = await User.findById(req.user?.userId);
    if (!user || !user.active) {
      res.status(404).json({ success: false, message: 'Account not found or inactive.' });
      return;
    }

    const currentAddresses = user.addresses || [];
    const shouldBeDefault = Boolean(isDefault) || currentAddresses.length === 0;

    if (shouldBeDefault) {
      currentAddresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    const newAddress = {
      name: name.trim(),
      phone: phone.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2 && typeof addressLine2 === 'string' ? addressLine2.trim() : '',
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      landmark: landmark && typeof landmark === 'string' ? landmark.trim() : '',
      isDefault: shouldBeDefault,
    };

    user.addresses?.push(newAddress as IUserAddress);
    await user.save();

    const saved = user.addresses?.[user.addresses.length - 1];

    res.status(201).json({
      success: true,
      message: 'Address saved successfully.',
      address: saved,
      addresses: user.addresses,
    });
  } catch (err: unknown) {
    console.error('[Add Address Error]', err);
    res.status(500).json({ success: false, message: 'Failed to save address.' });
  }
});

/**
 * PUT /api/customer/addresses/:addressId
 * Updates an existing address in the customer's address book.
 */
router.put('/addresses/:addressId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { addressId } = req.params;
    const { name, phone, addressLine1, addressLine2, city, state, pincode, landmark, isDefault } =
      req.body;

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      res.status(400).json({ success: false, message: 'Invalid address ID format.' });
      return;
    }

    const user = await User.findById(req.user?.userId);
    if (!user || !user.active) {
      res.status(404).json({ success: false, message: 'Account not found or inactive.' });
      return;
    }

    const address = user.addresses?.find(a => a._id?.toString() === addressId);
    if (!address) {
      res.status(404).json({ success: false, message: 'Address not found.' });
      return;
    }

    if (name && typeof name === 'string') address.name = name.trim();
    if (phone && typeof phone === 'string') address.phone = phone.trim();
    if (addressLine1 && typeof addressLine1 === 'string') address.addressLine1 = addressLine1.trim();
    if (typeof addressLine2 === 'string') address.addressLine2 = addressLine2.trim();
    if (city && typeof city === 'string') address.city = city.trim();
    if (state && typeof state === 'string') address.state = state.trim();
    if (pincode && typeof pincode === 'string') {
      if (!/^\d{6}$/.test(pincode.trim())) {
        res.status(400).json({ success: false, message: 'Valid 6-digit PIN code required.' });
        return;
      }
      address.pincode = pincode.trim();
    }
    if (typeof landmark === 'string') address.landmark = landmark.trim();

    if (typeof isDefault === 'boolean') {
      if (isDefault) {
        user.addresses?.forEach(a => {
          a.isDefault = a._id?.toString() === addressId;
        });
      } else {
        address.isDefault = false;
      }
    }

    await user.save();

    res.json({
      success: true,
      message: 'Address updated successfully.',
      address,
      addresses: user.addresses,
    });
  } catch (err: unknown) {
    console.error('[Update Address Error]', err);
    res.status(500).json({ success: false, message: 'Failed to update address.' });
  }
});

/**
 * DELETE /api/customer/addresses/:addressId
 * Deletes an address from the customer's address book.
 */
router.delete('/addresses/:addressId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { addressId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      res.status(400).json({ success: false, message: 'Invalid address ID format.' });
      return;
    }

    const user = await User.findById(req.user?.userId);
    if (!user || !user.active) {
      res.status(404).json({ success: false, message: 'Account not found or inactive.' });
      return;
    }

    const initialLength = (user.addresses || []).length;
    const wasDefault = user.addresses?.find(a => a._id?.toString() === addressId)?.isDefault;

    user.addresses = (user.addresses || []).filter(a => a._id?.toString() !== addressId);

    if (user.addresses.length === initialLength) {
      res.status(404).json({ success: false, message: 'Address not found.' });
      return;
    }

    // If we deleted the default address, make the first remaining address default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Address deleted successfully.',
      addresses: user.addresses,
    });
  } catch (err: unknown) {
    console.error('[Delete Address Error]', err);
    res.status(500).json({ success: false, message: 'Failed to delete address.' });
  }
});

/**
 * PUT /api/customer/addresses/:addressId/default
 * Sets the specified address as the default shipping address.
 */
router.put('/addresses/:addressId/default', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { addressId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      res.status(400).json({ success: false, message: 'Invalid address ID format.' });
      return;
    }

    const user = await User.findById(req.user?.userId);
    if (!user || !user.active) {
      res.status(404).json({ success: false, message: 'Account not found or inactive.' });
      return;
    }

    const exists = user.addresses?.some(a => a._id?.toString() === addressId);
    if (!exists) {
      res.status(404).json({ success: false, message: 'Address not found.' });
      return;
    }

    user.addresses?.forEach(a => {
      a.isDefault = a._id?.toString() === addressId;
    });

    await user.save();

    res.json({
      success: true,
      message: 'Default address updated.',
      addresses: user.addresses,
    });
  } catch (err: unknown) {
    console.error('[Set Default Address Error]', err);
    res.status(500).json({ success: false, message: 'Failed to set default address.' });
  }
});

// ─── Customer Orders ─────────────────────────────────────────────────────────

/**
 * GET /api/customer/orders
 * Returns all orders placed by the authenticated customer.
 */
router.get('/orders', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user || !user.active) {
      res.status(404).json({ success: false, message: 'Account not found or inactive.' });
      return;
    }

    const orders = await Order.find({
      $or: [{ customer: user._id }, { 'customerInfo.email': user.email }],
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      orders,
    });
  } catch (err: unknown) {
    console.error('[Customer Orders Error]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch customer orders.' });
  }
});

/**
 * GET /api/customer/orders/:orderId
 * Returns order details strictly if owned by the authenticated customer.
 */
router.get('/orders/:orderId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;

    const user = await User.findById(req.user?.userId);
    if (!user || !user.active) {
      res.status(404).json({ success: false, message: 'Account not found or inactive.' });
      return;
    }

    const query: any = mongoose.Types.ObjectId.isValid(orderId)
      ? { _id: orderId }
      : { orderNumber: orderId };

    const order = await Order.findOne(query).lean();
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    // Ownership check
    const isOwner =
      (order.customer && order.customer.toString() === user._id.toString()) ||
      (order.customerInfo && order.customerInfo.email.toLowerCase() === user.email.toLowerCase());

    if (!isOwner) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to view this order.',
      });
      return;
    }

    res.json({
      success: true,
      order,
    });
  } catch (err: unknown) {
    console.error('[Customer Order Detail Error]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch order detail.' });
  }
});

export default router;
