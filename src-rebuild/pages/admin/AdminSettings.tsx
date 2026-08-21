import { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Store,
  MapPin,
  Truck,
  Clock,
  Share2,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UploadCloud,
  Plus,
  Trash2,
} from 'lucide-react';
import { Card, PageHeader, Spinner } from '../../components/admin/ui.tsx';

interface BusinessHours {
  days: string;
  open: string;
  close: string;
}

interface StoreSettingsData {
  _id?: string;
  storeName: string;
  tagline?: string;
  description?: string;
  logo?: string;
  gstNumber?: string;
  fssaiNumber?: string;
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
  businessHours: BusinessHours[];
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
  policies?: {
    privacyPolicy?: string;
    termsConditions?: string;
    cancellationPolicy?: string;
    refundPolicy?: string;
    shippingPolicy?: string;
  };
}

const DEFAULT_SETTINGS: StoreSettingsData = {
  storeName: 'Malwa Namkeen House',
  tagline: 'Authentic Malwa Namkeens, Sweets & Savouries',
  description: 'Heritage artisanal namkeens, sweets and chivdas extruded by hand and fried in pure cold-pressed groundnut oil.',
  logo: '',
  gstNumber: '29AQWPP5638F2ZO',
  fssaiNumber: '11225302002687',
  contact: {
    phone: '+91 90350 56691',
    email: 'contact@malwanamkeen.com',
    whatsappNumber: '919035056691',
    address: {
      line1: 'No. 87/4-B, Sulikunte Village',
      line2: 'Sarjapur Main Road, Dommasandra Post',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '562125',
      country: 'India',
      full: 'No. 87/4-B, Sulikunte Village, Sarjapur Main Road, Dommasandra Post, Bengaluru – 562125, Karnataka, India',
    },
  },
  businessHours: [
    { days: 'Monday – Thursday', open: '9:00 AM', close: '10:30 PM' },
    { days: 'Friday', open: '9:00 AM', close: '11:00 PM' },
    { days: 'Saturday – Sunday', open: '8:30 AM', close: '11:00 PM' },
  ],
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
    termsConditions: 'By placing an order on Malwa Namkeen House, you agree to our standard store terms of service.',
  },
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<StoreSettingsData>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'contact' | 'delivery' | 'hours' | 'social' | 'policies'>('general');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Fetch Token Helper
  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('malwa_admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // Fetch Settings
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        headers: getAuthHeader(),
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings({
            ...DEFAULT_SETTINGS,
            ...data.settings,
            contact: {
              ...DEFAULT_SETTINGS.contact,
              ...(data.settings.contact || {}),
              address: {
                ...DEFAULT_SETTINGS.contact.address,
                ...(data.settings.contact?.address || {}),
              },
            },
            deliverySettings: {
              ...DEFAULT_SETTINGS.deliverySettings,
              ...(data.settings.deliverySettings || {}),
            },
            socialLinks: {
              ...DEFAULT_SETTINGS.socialLinks,
              ...(data.settings.socialLinks || {}),
            },
            policies: {
              ...DEFAULT_SETTINGS.policies,
              ...(data.settings.policies || {}),
            },
          });
          setHasUnsavedChanges(false);
        }
      }
    } catch {
      // Fallback to default settings
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Update Field Helper
  const updateSetting = (updater: (prev: StoreSettingsData) => StoreSettingsData) => {
    setSettings(prev => {
      const next = updater(prev);
      setHasUnsavedChanges(true);
      return next;
    });
  };

  // Upload Logo to Cloudinary (malwa-namkeen-house/logo)
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('target', 'logo');

      const res = await fetch('/api/admin/uploads', {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData,
        credentials: 'include',
      });

      const data = await res.json();
      if (res.ok && data.success && data.secureUrl) {
        updateSetting(s => ({ ...s, logo: data.secureUrl }));
        setStatusMsg({ type: 'success', text: 'Brand logo uploaded to Cloudinary.' });
      } else {
        throw new Error(data.message || 'Logo upload failed.');
      }
    } catch (err: unknown) {
      setStatusMsg({ type: 'error', text: err instanceof Error ? err.message : 'Logo upload failed.' });
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  // Business Hours Handlers
  const addHoursRow = () => {
    updateSetting(s => ({
      ...s,
      businessHours: [...s.businessHours, { days: 'New Schedule', open: '9:00 AM', close: '10:00 PM' }],
    }));
  };

  const removeHoursRow = (index: number) => {
    updateSetting(s => ({
      ...s,
      businessHours: s.businessHours.filter((_, idx) => idx !== index),
    }));
  };

  const updateHoursRow = (index: number, field: keyof BusinessHours, value: string) => {
    updateSetting(s => {
      const copy = [...s.businessHours];
      copy[index] = { ...copy[index], [field]: value };
      return { ...s, businessHours: copy };
    });
  };

  // Save Settings Form
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(settings),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save settings.');
      }

      setStatusMsg({ type: 'success', text: 'Store settings saved successfully.' });
      setHasUnsavedChanges(false);
    } catch (err: unknown) {
      setStatusMsg({ type: 'error', text: err instanceof Error ? err.message : 'Error saving settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 0', display: 'grid', placeItems: 'center' }}>
        <Spinner />
        <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '12px' }}>Loading store settings from MongoDB...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'Brand & General', icon: Store },
    { id: 'contact', label: 'Contact & Address', icon: MapPin },
    { id: 'delivery', label: 'Delivery & Shipping', icon: Truck },
    { id: 'hours', label: 'Operating Hours', icon: Clock },
    { id: 'social', label: 'Social & Web', icon: Share2 },
    { id: 'policies', label: 'Store Policies', icon: FileText },
  ] as const;

  return (
    <div style={{ display: 'grid', gap: '22px' }}>
      {/* Top Header */}
      <PageHeader
        title="Store & Business Settings"
        subtitle="Manage public storefront metadata, GST/FSSAI licensing, delivery thresholds and store policies"
        action={
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {hasUnsavedChanges && (
              <span style={{ fontSize: '12px', color: '#D97706', fontWeight: 700, background: '#FEF3C7', padding: '4px 10px', borderRadius: '6px' }}>
                ● Unsaved Changes
              </span>
            )}
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#3C0815',
                color: '#FFF9EF',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: saving ? 'wait' : 'pointer',
                boxShadow: '0 2px 6px rgba(60,8,21,0.25)',
              }}
            >
              <Save size={16} />
              <span>{saving ? 'Saving Settings…' : 'Save Changes'}</span>
            </button>
          </div>
        }
      />

      {statusMsg && (
        <div
          style={{
            background: statusMsg.type === 'success' ? '#D1FAE5' : '#FEE2E2',
            color: statusMsg.type === 'success' ? '#065F46' : '#991B1B',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Main Settings Card with Tabs */}
      <Card>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1.5px solid #EAE5D9', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: isSelected ? '#3C0815' : 'transparent',
                  color: isSelected ? '#FFF9EF' : '#4B5563',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={15} color={isSelected ? '#F0C74E' : '#9CA3AF'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: General & Brand */}
        {activeTab === 'general' && (
          <div style={{ display: 'grid', gap: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Store Name *</label>
                <input
                  required
                  value={settings.storeName}
                  onChange={e => updateSetting(s => ({ ...s, storeName: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Tagline / Subtitle</label>
                <input
                  value={settings.tagline || ''}
                  onChange={e => updateSetting(s => ({ ...s, tagline: e.target.value }))}
                  placeholder="Authentic Malwa Namkeens & Sweets"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Brand Story & Description</label>
              <textarea
                rows={3}
                value={settings.description || ''}
                onChange={e => updateSetting(s => ({ ...s, description: e.target.value }))}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <label style={labelStyle}>GSTIN Number</label>
                <input
                  value={settings.gstNumber || ''}
                  onChange={e => updateSetting(s => ({ ...s, gstNumber: e.target.value }))}
                  placeholder="29AQWPP5638F2ZO"
                  style={{ ...inputStyle, fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={labelStyle}>FSSAI License Number</label>
                <input
                  value={settings.fssaiNumber || ''}
                  onChange={e => updateSetting(s => ({ ...s, fssaiNumber: e.target.value }))}
                  placeholder="11225302002687"
                  style={{ ...inputStyle, fontFamily: 'monospace' }}
                />
              </div>
            </div>

            {/* Brand Logo Upload */}
            <div>
              <label style={labelStyle}>Brand Logo (Cloudinary: malwa-namkeen-house/logo)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#F8F6F2',
                    border: '1.5px dashed #D4AA45',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#3C0815',
                    cursor: uploadingLogo ? 'wait' : 'pointer',
                  }}
                >
                  <UploadCloud size={16} color="#D4AA45" />
                  <span>{uploadingLogo ? 'Uploading...' : 'Upload Logo'}</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                </label>

                <input
                  placeholder="Or enter logo URL..."
                  value={settings.logo || ''}
                  onChange={e => updateSetting(s => ({ ...s, logo: e.target.value }))}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>

              {settings.logo && (
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src={settings.logo} alt="Logo" style={{ height: '48px', objectFit: 'contain', background: '#3C0815', padding: '4px 8px', borderRadius: '6px' }} />
                  <button
                    type="button"
                    onClick={() => updateSetting(s => ({ ...s, logo: '' }))}
                    style={{ color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Remove Logo
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Contact & Address */}
        {activeTab === 'contact' && (
          <div style={{ display: 'grid', gap: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Support Phone Number</label>
                <input
                  value={settings.contact.phone}
                  onChange={e => updateSetting(s => ({ ...s, contact: { ...s.contact, phone: e.target.value } }))}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Support Email Address</label>
                <input
                  type="email"
                  value={settings.contact.email}
                  onChange={e => updateSetting(s => ({ ...s, contact: { ...s.contact, email: e.target.value } }))}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>WhatsApp Business Number</label>
                <input
                  value={settings.contact.whatsappNumber}
                  onChange={e => updateSetting(s => ({ ...s, contact: { ...s.contact, whatsappNumber: e.target.value } }))}
                  placeholder="919035056691"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Address Line 1</label>
                <input
                  value={settings.contact.address.line1}
                  onChange={e => updateSetting(s => ({ ...s, contact: { ...s.contact, address: { ...s.contact.address, line1: e.target.value } } }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Address Line 2</label>
                <input
                  value={settings.contact.address.line2 || ''}
                  onChange={e => updateSetting(s => ({ ...s, contact: { ...s.contact, address: { ...s.contact.address, line2: e.target.value } } }))}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <div>
                <label style={labelStyle}>City</label>
                <input
                  value={settings.contact.address.city}
                  onChange={e => updateSetting(s => ({ ...s, contact: { ...s.contact, address: { ...s.contact.address, city: e.target.value } } }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>State</label>
                <input
                  value={settings.contact.address.state}
                  onChange={e => updateSetting(s => ({ ...s, contact: { ...s.contact, address: { ...s.contact.address, state: e.target.value } } }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Postal / PIN Code</label>
                <input
                  value={settings.contact.address.postalCode}
                  onChange={e => updateSetting(s => ({ ...s, contact: { ...s.contact, address: { ...s.contact.address, postalCode: e.target.value } } }))}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Delivery & Fulfillment */}
        {activeTab === 'delivery' && (
          <div style={{ display: 'grid', gap: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Free Shipping Threshold (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={settings.deliverySettings.freeShippingThreshold}
                  onChange={e => updateSetting(s => ({ ...s, deliverySettings: { ...s.deliverySettings, freeShippingThreshold: Number(e.target.value) } }))}
                  style={inputStyle}
                />
                <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '3px', display: 'block' }}>
                  Orders with cart subtotal ≥ this amount receive Free Shipping.
                </span>
              </div>

              <div>
                <label style={labelStyle}>Standard Shipping Fee (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={settings.deliverySettings.standardShippingFee}
                  onChange={e => updateSetting(s => ({ ...s, deliverySettings: { ...s.deliverySettings, standardShippingFee: Number(e.target.value) } }))}
                  style={inputStyle}
                />
                <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '3px', display: 'block' }}>
                  Charged on orders below the free shipping threshold.
                </span>
              </div>

              <div>
                <label style={labelStyle}>Minimum Order Value (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={settings.deliverySettings.minOrderValue}
                  onChange={e => updateSetting(s => ({ ...s, deliverySettings: { ...s.deliverySettings, minOrderValue: Number(e.target.value) } }))}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Estimated Delivery Days Display</label>
                <input
                  value={settings.deliverySettings.estimatedDeliveryDays}
                  onChange={e => updateSetting(s => ({ ...s, deliverySettings: { ...s.deliverySettings, estimatedDeliveryDays: e.target.value } }))}
                  placeholder="2–4 Business Days"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', paddingTop: '18px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.deliverySettings.codEnabled}
                    onChange={e => updateSetting(s => ({ ...s, deliverySettings: { ...s.deliverySettings, codEnabled: e.target.checked } }))}
                    style={{ accentColor: '#3C0815', width: '16px', height: '16px' }}
                  />
                  <span style={{ fontWeight: 700, color: '#374151' }}>Enable Cash on Delivery (COD) Checkout</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Operating Hours */}
        {activeTab === 'hours' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#881337' }}>
                Store & Order Dispatch Schedules
              </h4>
              <button
                type="button"
                onClick={addHoursRow}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FAF6EF', border: '1px solid #EAE3D2', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, color: '#881337', cursor: 'pointer' }}
              >
                <Plus size={14} /> Add Schedule
              </button>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              {settings.businessHours.map((row, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', alignItems: 'center', background: '#F8F6F2', padding: '12px', borderRadius: '8px', border: '1px solid #EAE3D2' }}>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '11px' }}>Days</label>
                    <input
                      value={row.days}
                      onChange={e => updateHoursRow(idx, 'days', e.target.value)}
                      placeholder="e.g. Monday – Friday"
                      style={{ ...inputStyle, padding: '7px 10px' }}
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '11px' }}>Opens</label>
                    <input
                      value={row.open}
                      onChange={e => updateHoursRow(idx, 'open', e.target.value)}
                      placeholder="9:00 AM"
                      style={{ ...inputStyle, padding: '7px 10px' }}
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '11px' }}>Closes</label>
                    <input
                      value={row.close}
                      onChange={e => updateHoursRow(idx, 'close', e.target.value)}
                      placeholder="10:30 PM"
                      style={{ ...inputStyle, padding: '7px 10px' }}
                    />
                  </div>
                  <div style={{ paddingTop: '16px' }}>
                    <button
                      type="button"
                      onClick={() => removeHoursRow(idx)}
                      style={{ background: '#FEE2E2', border: 'none', borderRadius: '6px', width: '32px', height: '32px', color: '#991B1B', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Social & Web Links */}
        {activeTab === 'social' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Instagram Profile URL</label>
              <input
                value={settings.socialLinks.instagram || ''}
                onChange={e => updateSetting(s => ({ ...s, socialLinks: { ...s.socialLinks, instagram: e.target.value } }))}
                placeholder="https://instagram.com/malwanamkeen"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Facebook Page URL</label>
              <input
                value={settings.socialLinks.facebook || ''}
                onChange={e => updateSetting(s => ({ ...s, socialLinks: { ...s.socialLinks, facebook: e.target.value } }))}
                placeholder="https://facebook.com/malwanamkeen"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>YouTube Channel URL</label>
              <input
                value={settings.socialLinks.youtube || ''}
                onChange={e => updateSetting(s => ({ ...s, socialLinks: { ...s.socialLinks, youtube: e.target.value } }))}
                placeholder="https://youtube.com/@malwanamkeen"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Google Maps Store Location URL</label>
              <input
                value={settings.socialLinks.googleMapsUrl || ''}
                onChange={e => updateSetting(s => ({ ...s, socialLinks: { ...s.socialLinks, googleMapsUrl: e.target.value } }))}
                placeholder="https://maps.google.com/..."
                style={inputStyle}
              />
            </div>
          </div>
        )}

        {/* Tab 6: Store Policies */}
        {activeTab === 'policies' && (
          <div style={{ display: 'grid', gap: '18px' }}>
            <div>
              <label style={labelStyle}>Shipping & Delivery Policy</label>
              <textarea
                rows={3}
                value={settings.policies?.shippingPolicy || ''}
                onChange={e => updateSetting(s => ({ ...s, policies: { ...s.policies, shippingPolicy: e.target.value } }))}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Cancellation & Refund Policy</label>
              <textarea
                rows={3}
                value={settings.policies?.refundPolicy || ''}
                onChange={e => updateSetting(s => ({ ...s, policies: { ...s.policies, refundPolicy: e.target.value } }))}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Privacy Policy</label>
              <textarea
                rows={3}
                value={settings.policies?.privacyPolicy || ''}
                onChange={e => updateSetting(s => ({ ...s, policies: { ...s.policies, privacyPolicy: e.target.value } }))}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 700,
  color: '#374151',
  marginBottom: '5px',
  letterSpacing: '0.02em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '9px 12px',
  borderRadius: '8px',
  border: '1.5px solid #E5E7EB',
  fontSize: '13.5px',
  color: '#111827',
  outline: 'none',
  background: '#FFFFFF',
  fontFamily: 'inherit',
};
