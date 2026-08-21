import mongoose, { Document, Model, Schema } from 'mongoose';

export type DiscountType = 'percentage' | 'fixed';

export interface IDiscount extends Document {
  code: string;
  type: DiscountType;
  value: number;
  minimumOrder: number;
  maximumDiscount?: number;
  active: boolean;
  startDate?: Date;
  endDate?: Date;
  usageLimit?: number;
  usageLimitPerUser?: number;
  usedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const discountSchema = new Schema<IDiscount>(
  {
    code: {
      type: String,
      required: [true, 'Discount code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
      required: true,
    },
    value: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value must be non-negative'],
    },
    minimumOrder: {
      type: Number,
      default: 0,
      min: [0, 'Minimum order must be non-negative'],
    },
    maximumDiscount: {
      type: Number,
      default: null,
      min: [0, 'Maximum discount must be non-negative'],
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    usageLimit: {
      type: Number,
      default: null,
    },
    usageLimitPerUser: {
      type: Number,
      default: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Discount: Model<IDiscount> =
  mongoose.models.Discount || mongoose.model<IDiscount>('Discount', discountSchema);
