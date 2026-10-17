import mongoose, { Document, Model, Schema } from 'mongoose';

export type IdempotencyStatus = 'started' | 'completed' | 'failed';

export interface IIdempotencyRecord extends Document {
  scopeKey: string;
  key: string;
  user: mongoose.Types.ObjectId;
  requestHash: string;
  status: IdempotencyStatus;
  order?: mongoose.Types.ObjectId;
  orderNumber?: string;
  statusCode?: number;
  responsePayload?: Record<string, any>;
  errorMessage?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const idempotencyRecordSchema = new Schema<IIdempotencyRecord>(
  {
    scopeKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requestHash: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['started', 'completed', 'failed'],
      default: 'started',
      index: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    orderNumber: {
      type: String,
      trim: true,
    },
    statusCode: {
      type: Number,
      default: 201,
    },
    responsePayload: {
      type: Schema.Types.Mixed,
    },
    errorMessage: {
      type: String,
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index: automatically deletes expired idempotency records after expiresAt
idempotencyRecordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for querying user's idempotency history
idempotencyRecordSchema.index({ user: 1, key: 1 }, { unique: true });

export const IdempotencyRecord: Model<IIdempotencyRecord> =
  mongoose.models.IdempotencyRecord ||
  mongoose.model<IIdempotencyRecord>('IdempotencyRecord', idempotencyRecordSchema);
