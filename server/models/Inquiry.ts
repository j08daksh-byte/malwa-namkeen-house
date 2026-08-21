import mongoose, { Document, Model, Schema } from 'mongoose';

export type InquiryStatus = 'new' | 'in_progress' | 'resolved' | 'closed' | 'spam';

export interface IInquiry extends Document {
  name: string;
  email: string;
  phone?: string;
  category?: string;
  message: string;
  status: InquiryStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const inquirySchema = new Schema<IInquiry>(
  {
    name: {
      type: String,
      required: [true, 'Inquirer name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Inquirer email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'general',
    },
    message: {
      type: String,
      required: [true, 'Inquiry message is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['new', 'in_progress', 'resolved', 'closed', 'spam'],
      default: 'new',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Inquiry: Model<IInquiry> =
  mongoose.models.Inquiry || mongoose.model<IInquiry>('Inquiry', inquirySchema);
