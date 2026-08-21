import { Router } from 'express';
import type { Request, Response } from 'express';
import { StoreSettings, type IStoreSettings } from '../models/StoreSettings.ts';
import { requireAdmin, type AuthenticatedRequest } from '../lib/auth.ts';

const router = Router();

/**
 * Helper to retrieve or initialize the singleton StoreSettings document.
 */
async function getOrCreateSingletonSettings(): Promise<IStoreSettings> {
  let settings = await StoreSettings.findOne();
  if (!settings) {
    settings = await StoreSettings.create({});
  }
  return settings;
}

/**
 * Public storefront settings endpoint (accessible without authentication)
 * GET /api/settings or /api/settings/public
 */
const handlePublicSettings = async (_req: Request, res: Response) => {
  try {
    const settings = await getOrCreateSingletonSettings();
    res.json({
      success: true,
      settings: {
        storeName: settings.storeName,
        tagline: settings.tagline,
        description: settings.description,
        logo: settings.logo,
        gstNumber: settings.gstNumber,
        fssaiNumber: settings.fssaiNumber,
        contact: settings.contact,
        businessHours: settings.businessHours,
        deliverySettings: settings.deliverySettings,
        socialLinks: settings.socialLinks,
        policies: settings.policies,
      },
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: 'Failed to retrieve public store settings.' });
  }
};

router.get('/public', handlePublicSettings);
router.get('/', handlePublicSettings);

// Enforce requireAdmin on all administrative settings endpoints
router.use(requireAdmin);

/**
 * GET /api/admin/settings
 * Admin endpoint to retrieve full store settings.
 */
router.get('/', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = await getOrCreateSingletonSettings();
    res.json({
      success: true,
      settings,
    });
  } catch (err: unknown) {
    console.error('[Admin Settings Error]', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve store settings.' });
  }
});

/**
 * PUT /api/admin/settings
 * Admin endpoint to update the singleton StoreSettings.
 */
router.put('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payload = req.body;
    let settings = await StoreSettings.findOne();

    if (!settings) {
      settings = new StoreSettings(payload);
    } else {
      if (payload.storeName) settings.storeName = String(payload.storeName).trim();
      if (payload.tagline !== undefined) settings.tagline = String(payload.tagline).trim();
      if (payload.description !== undefined) settings.description = String(payload.description).trim();
      if (payload.logo !== undefined) settings.logo = String(payload.logo).trim();
      if (payload.gstNumber !== undefined) settings.gstNumber = String(payload.gstNumber).trim();
      if (payload.fssaiNumber !== undefined) settings.fssaiNumber = String(payload.fssaiNumber).trim();

      if (payload.contact && typeof payload.contact === 'object') {
        settings.contact = {
          phone: payload.contact.phone ? String(payload.contact.phone).trim() : settings.contact.phone,
          email: payload.contact.email ? String(payload.contact.email).trim().toLowerCase() : settings.contact.email,
          whatsappNumber: payload.contact.whatsappNumber
            ? String(payload.contact.whatsappNumber).trim()
            : settings.contact.whatsappNumber,
          address: {
            line1: payload.contact.address?.line1 ?? settings.contact.address.line1,
            line2: payload.contact.address?.line2 ?? settings.contact.address.line2,
            city: payload.contact.address?.city ?? settings.contact.address.city,
            state: payload.contact.address?.state ?? settings.contact.address.state,
            postalCode: payload.contact.address?.postalCode ?? settings.contact.address.postalCode,
            country: payload.contact.address?.country ?? settings.contact.address.country,
            full: payload.contact.address?.full ?? settings.contact.address.full,
          },
        };
      }

      if (Array.isArray(payload.businessHours)) {
        settings.businessHours = payload.businessHours;
      }

      if (payload.deliverySettings && typeof payload.deliverySettings === 'object') {
        settings.deliverySettings = {
          freeShippingThreshold:
            payload.deliverySettings.freeShippingThreshold !== undefined
              ? Number(payload.deliverySettings.freeShippingThreshold)
              : settings.deliverySettings.freeShippingThreshold,
          standardShippingFee:
            payload.deliverySettings.standardShippingFee !== undefined
              ? Number(payload.deliverySettings.standardShippingFee)
              : settings.deliverySettings.standardShippingFee,
          estimatedDeliveryDays:
            payload.deliverySettings.estimatedDeliveryDays !== undefined
              ? String(payload.deliverySettings.estimatedDeliveryDays).trim()
              : settings.deliverySettings.estimatedDeliveryDays,
          codEnabled:
            payload.deliverySettings.codEnabled !== undefined
              ? Boolean(payload.deliverySettings.codEnabled)
              : settings.deliverySettings.codEnabled,
          minOrderValue:
            payload.deliverySettings.minOrderValue !== undefined
              ? Number(payload.deliverySettings.minOrderValue)
              : settings.deliverySettings.minOrderValue,
        };
      }

      if (payload.socialLinks && typeof payload.socialLinks === 'object') {
        settings.socialLinks = {
          instagram: payload.socialLinks.instagram ?? settings.socialLinks.instagram,
          facebook: payload.socialLinks.facebook ?? settings.socialLinks.facebook,
          youtube: payload.socialLinks.youtube ?? settings.socialLinks.youtube,
          twitter: payload.socialLinks.twitter ?? settings.socialLinks.twitter,
          googleMapsUrl: payload.socialLinks.googleMapsUrl ?? settings.socialLinks.googleMapsUrl,
        };
      }

      if (payload.policies && typeof payload.policies === 'object') {
        settings.policies = {
          privacyPolicy: payload.policies.privacyPolicy ?? settings.policies?.privacyPolicy,
          termsConditions: payload.policies.termsConditions ?? settings.policies?.termsConditions,
          cancellationPolicy: payload.policies.cancellationPolicy ?? settings.policies?.cancellationPolicy,
          refundPolicy: payload.policies.refundPolicy ?? settings.policies?.refundPolicy,
          shippingPolicy: payload.policies.shippingPolicy ?? settings.policies?.shippingPolicy,
        };
      }
    }

    await settings.save();

    res.json({
      success: true,
      message: 'Store settings updated successfully.',
      settings,
    });
  } catch (err: unknown) {
    console.error('[Update Settings Error]', err);
    const msg = err instanceof Error ? err.message : 'Failed to update store settings.';
    res.status(400).json({ success: false, message: msg });
  }
});

export default router;
