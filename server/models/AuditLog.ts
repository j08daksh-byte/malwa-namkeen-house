import mongoose, { Document, Model, Schema } from 'mongoose';

export type AuditAction =
  | 'PASSWORD_CHANGE_REQUESTED'
  | 'PASSWORD_CHANGED'
  | 'ROLE_CHANGED';

export interface IAuditLog extends Document {
  action: AuditAction;
  actorId?: mongoose.Types.ObjectId;
  targetUserId: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: true,
      enum: ['PASSWORD_CHANGE_REQUESTED', 'PASSWORD_CHANGED', 'ROLE_CHANGED'],
      index: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
