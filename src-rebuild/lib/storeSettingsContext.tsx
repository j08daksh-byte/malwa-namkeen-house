import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BUSINESS } from './business';

export interface StoreSettingsData {
  storeName: string;
  tagline: string;
  description: string;
  logo: string;
  gstNumber: string;
  fssaiNumber: string;
  contact: {
    phone: string;
    email: string;
    whatsappNumber: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      full: string;
    };
  };
  deliverySettings: {
    freeShippingThreshold: number;
    standardShippingFee: number;
    estimatedDeliveryDays: string;
    codEnabled: boolean;
    minOrderValue: number;
  };
  socialLinks: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    twitter?: string;
    googleMapsUrl?: string;
  };
  policies: {
    privacyPolicy?: string;
    termsConditions?: string;
    cancellationPolicy?: string;
    refundPolicy?: string;
    shippingPolicy?: string;
  };
}

export const DEFAULT_STORE_SETTINGS: StoreSettingsData = {
  storeName: BUSINESS.name,
  tagline: BUSINESS.tagline,
  description: 'Heritage artisanal namkeens, sweets and chivdas extruded by hand and fried in pure cold-pressed groundnut oil.',
  logo: '/logo.png',
  gstNumber: BUSINESS.gstNumber,
  fssaiNumber: BUSINESS.fssaiNumber,
  contact: {
    phone: BUSINESS.phone,
    email: BUSINESS.email,
    whatsappNumber: BUSINESS.whatsappNumber,
    address: {
      line1: BUSINESS.address.line1,
      line2: BUSINESS.address.line2,
      city: BUSINESS.address.city,
      state: BUSINESS.address.state,
      postalCode: BUSINESS.address.postalCode,
      country: BUSINESS.address.country,
      full: BUSINESS.address.full,
    },
  },
  deliverySettings: {
    freeShippingThreshold: 499,
    standardShippingFee: 49,
    estimatedDeliveryDays: '2–4 Business Days',
    codEnabled: true,
    minOrderValue: 99,
  },
  socialLinks: {
    instagram: '',
    facebook: '',
    youtube: '',
    twitter: '',
    googleMapsUrl: '',
  },
  policies: {
    shippingPolicy: 'Standard delivery takes 2–4 business days across India. Orders above ₹499 qualify for Free Standard Delivery.',
    refundPolicy: 'Due to the perishable and artisanal nature of our fresh food items, returns are only accepted for damaged packaging or incorrect dispatches.',
    privacyPolicy: 'We respect your privacy and never sell or rent your personal information to third parties.',
    termsConditions: 'By placing an order on MALWA NAMKEEN HOUSE, you agree to our standard store terms of service.',
  },
};

interface StoreSettingsContextValue {
  settings: StoreSettingsData;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const StoreSettingsContext = createContext<StoreSettingsContextValue>({
  settings: DEFAULT_STORE_SETTINGS,
  loading: false,
  refreshSettings: async () => {},
});

export function StoreSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StoreSettingsData>(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.settings) {
        const s = data.settings;
        setSettings({
          storeName: s.storeName || DEFAULT_STORE_SETTINGS.storeName,
          tagline: s.tagline || DEFAULT_STORE_SETTINGS.tagline,
          description: s.description || DEFAULT_STORE_SETTINGS.description,
          logo: s.logo || DEFAULT_STORE_SETTINGS.logo,
          gstNumber: s.gstNumber || DEFAULT_STORE_SETTINGS.gstNumber,
          fssaiNumber: s.fssaiNumber || DEFAULT_STORE_SETTINGS.fssaiNumber,
          contact: {
            phone: s.contact?.phone || DEFAULT_STORE_SETTINGS.contact.phone,
            email: s.contact?.email || DEFAULT_STORE_SETTINGS.contact.email,
            whatsappNumber: s.contact?.whatsappNumber || DEFAULT_STORE_SETTINGS.contact.whatsappNumber,
            address: {
              line1: s.contact?.address?.line1 || DEFAULT_STORE_SETTINGS.contact.address.line1,
              line2: s.contact?.address?.line2 || DEFAULT_STORE_SETTINGS.contact.address.line2,
              city: s.contact?.address?.city || DEFAULT_STORE_SETTINGS.contact.address.city,
              state: s.contact?.address?.state || DEFAULT_STORE_SETTINGS.contact.address.state,
              postalCode: s.contact?.address?.postalCode || DEFAULT_STORE_SETTINGS.contact.address.postalCode,
              country: s.contact?.address?.country || DEFAULT_STORE_SETTINGS.contact.address.country,
              full: s.contact?.address?.full || DEFAULT_STORE_SETTINGS.contact.address.full,
            },
          },
          deliverySettings: {
            freeShippingThreshold: typeof s.deliverySettings?.freeShippingThreshold === 'number'
              ? s.deliverySettings.freeShippingThreshold
              : DEFAULT_STORE_SETTINGS.deliverySettings.freeShippingThreshold,
            standardShippingFee: typeof s.deliverySettings?.standardShippingFee === 'number'
              ? s.deliverySettings.standardShippingFee
              : DEFAULT_STORE_SETTINGS.deliverySettings.standardShippingFee,
            estimatedDeliveryDays: s.deliverySettings?.estimatedDeliveryDays || DEFAULT_STORE_SETTINGS.deliverySettings.estimatedDeliveryDays,
            codEnabled: typeof s.deliverySettings?.codEnabled === 'boolean'
              ? s.deliverySettings.codEnabled
              : DEFAULT_STORE_SETTINGS.deliverySettings.codEnabled,
            minOrderValue: typeof s.deliverySettings?.minOrderValue === 'number'
              ? s.deliverySettings.minOrderValue
              : DEFAULT_STORE_SETTINGS.deliverySettings.minOrderValue,
          },
          socialLinks: {
            instagram: s.socialLinks?.instagram || '',
            facebook: s.socialLinks?.facebook || '',
            youtube: s.socialLinks?.youtube || '',
            twitter: s.socialLinks?.twitter || '',
            googleMapsUrl: s.socialLinks?.googleMapsUrl || '',
          },
          policies: {
            privacyPolicy: s.policies?.privacyPolicy || DEFAULT_STORE_SETTINGS.policies.privacyPolicy,
            termsConditions: s.policies?.termsConditions || DEFAULT_STORE_SETTINGS.policies.termsConditions,
            cancellationPolicy: s.policies?.cancellationPolicy || DEFAULT_STORE_SETTINGS.policies.cancellationPolicy,
            refundPolicy: s.policies?.refundPolicy || DEFAULT_STORE_SETTINGS.policies.refundPolicy,
            shippingPolicy: s.policies?.shippingPolicy || DEFAULT_STORE_SETTINGS.policies.shippingPolicy,
          },
        });
      }
    } catch (err) {
      console.warn('[StoreSettings] Failed to fetch settings from API, using default:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <StoreSettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  return useContext(StoreSettingsContext);
}
