import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBusinessHours {
  days: string;
  open: string;
  close: string;
}

export interface IStoreSettings extends Document {
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
  businessHours: IBusinessHours[];
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
  createdAt: Date;
  updatedAt: Date;
}

const storeSettingsSchema = new Schema<IStoreSettings>(
  {
    storeName: {
      type: String,
      default: 'Malwa Namkeen House',
      trim: true,
    },
    tagline: {
      type: String,
      default: 'Authentic Malwa Namkeens, Sweets & Savouries',
      trim: true,
    },
    description: {
      type: String,
      default: 'Heritage artisanal namkeens, sweets and chivdas extruded by hand and fried in pure cold-pressed groundnut oil.',
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
    gstNumber: {
      type: String,
      default: '29AQWPP5638F2ZO',
      trim: true,
    },
    fssaiNumber: {
      type: String,
      default: '11225302002687',
      trim: true,
    },
    contact: {
      phone: { type: String, default: '+91 90350 56691', trim: true },
      email: { type: String, default: 'contact@mishtichaat.com', lowercase: true, trim: true },
      whatsappNumber: { type: String, default: '919035056691', trim: true },
      address: {
        line1: { type: String, default: 'No. 87/4-B, Sulikunte Village', trim: true },
        line2: { type: String, default: 'Sarjapur Main Road, Dommasandra Post', trim: true },
        city: { type: String, default: 'Bengaluru', trim: true },
        state: { type: String, default: 'Karnataka', trim: true },
        postalCode: { type: String, default: '562125', trim: true },
        country: { type: String, default: 'India', trim: true },
        full: { type: String, default: 'No. 87/4-B, Sulikunte Village, Sarjapur Main Road, Dommasandra Post, Bengaluru – 562125, Karnataka, India', trim: true },
      },
    },
    businessHours: {
      type: [
        {
          days: { type: String, required: true },
          open: { type: String, required: true },
          close: { type: String, required: true },
        },
      ],
      default: [
        { days: 'Monday – Thursday', open: '9:00 AM', close: '10:30 PM' },
        { days: 'Friday', open: '9:00 AM', close: '11:00 PM' },
        { days: 'Saturday – Sunday', open: '8:30 AM', close: '11:00 PM' },
      ],
    },
    deliverySettings: {
      freeShippingThreshold: { type: Number, default: 499, min: 0 },
      standardShippingFee: { type: Number, default: 49, min: 0 },
      estimatedDeliveryDays: { type: String, default: '2–4 Business Days' },
      codEnabled: { type: Boolean, default: true },
      minOrderValue: { type: Number, default: 99, min: 0 },
    },
    socialLinks: {
      instagram: { type: String, default: '' },
      facebook: { type: String, default: '' },
      youtube: { type: String, default: '' },
      twitter: { type: String, default: '' },
      googleMapsUrl: { type: String, default: '' },
    },
    policies: {
      privacyPolicy: { type: String, default: '' },
      termsConditions: { type: String, default: '' },
      cancellationPolicy: { type: String, default: '' },
      refundPolicy: { type: String, default: '' },
      shippingPolicy: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

export const StoreSettings: Model<IStoreSettings> =
  mongoose.models.StoreSettings ||
  mongoose.model<IStoreSettings>('StoreSettings', storeSettingsSchema);
