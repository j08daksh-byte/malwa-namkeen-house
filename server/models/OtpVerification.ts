import mongoose, { Document, Model, Schema } from 'mongoose';

export type OtpPurpose = 'password-change';

export interface IOtpVerification extends Document {
  userId: mongoose.Types.ObjectId;
  purpose: OtpPurpose;
  otpHash: string;
  pendingPasswordHash: string;
  expiresAt: Date;
  attempts: number;
  resendAvailableAt: Date;
  createdAt: Date;
}

const otpVerificationSchema = new Schema<IOtpVerification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ['password-change'],
      required: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
      trim: true,
    },
    pendingPasswordHash: {
      type: String,
      required: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL index to automatically purge expired records
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    resendAvailableAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 60 * 1000), // Default 60s cooldown
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index to quickly look up active OTP per user and purpose
otpVerificationSchema.index({ userId: 1, purpose: 1 });

export const OtpVerification: Model<IOtpVerification> =
  mongoose.models.OtpVerification ||
  mongoose.model<IOtpVerification>('OtpVerification', otpVerificationSchema);
