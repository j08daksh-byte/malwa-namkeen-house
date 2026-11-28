import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IRateLimitRecord {
  _id: string;
  totalHits: number;
  resetTime: Date;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const rateLimitRecordSchema = new Schema<IRateLimitRecord>(
  {
    _id: {
      type: String,
      required: true,
    },
    totalHits: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
    },
    resetTime: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

// TTL index: automatically deletes expired rate limit windows after expiresAt
rateLimitRecordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimitRecord: Model<IRateLimitRecord> =
  mongoose.models.RateLimitRecord ||
  mongoose.model<IRateLimitRecord>('RateLimitRecord', rateLimitRecordSchema);
