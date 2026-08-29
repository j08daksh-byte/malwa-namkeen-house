import mongoose, { Document, Model, Schema } from 'mongoose';

export type EmailEventType =
  | 'admin_invitation'
  | 'admin_password_reset'
  | 'customer_password_reset'
  | 'order_confirmation'
  | 'order_status_update'
  | 'inquiry_acknowledgement'
  | 'admin_new_order_alert'
  | 'admin_new_inquiry_alert';

export type EmailDeliveryStatus = 'sent' | 'simulated' | 'failed' | 'unconfigured';

export interface IEmailLog extends Document {
  eventType: EmailEventType;
  recipient: string;
  subject: string;
  relatedId?: string; // Order Number, Inquiry ID, or User ID
  provider: string;
  providerMessageId?: string;
  status: EmailDeliveryStatus;
  error?: string;
  metadata?: Record<string, unknown>;
  attemptedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const emailLogSchema = new Schema<IEmailLog>(
  {
    eventType: {
      type: String,
      required: true,
      enum: [
        'admin_invitation',
        'admin_password_reset',
        'customer_password_reset',
        'order_confirmation',
        'order_status_update',
        'inquiry_acknowledgement',
        'admin_new_order_alert',
        'admin_new_inquiry_alert',
      ],
      index: true,
    },
    recipient: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    relatedId: {
      type: String,
      trim: true,
      index: true,
      default: null,
    },
    provider: {
      type: String,
      default: 'resend',
      trim: true,
    },
    providerMessageId: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: ['sent', 'simulated', 'failed', 'unconfigured'],
      required: true,
      index: true,
    },
    error: {
      type: String,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    attemptedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast idempotency & duplicate send verification
emailLogSchema.index({ eventType: 1, relatedId: 1, recipient: 1 });

export const EmailLog: Model<IEmailLog> =
  mongoose.models.EmailLog || mongoose.model<IEmailLog>('EmailLog', emailLogSchema);
