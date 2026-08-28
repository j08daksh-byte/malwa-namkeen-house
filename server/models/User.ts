import mongoose, { Document, Model, Schema } from 'mongoose';

export type UserRole = 'customer' | 'admin' | 'super_admin';

export interface IUserAddress {
  _id?: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault?: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  googleId?: string;
  avatar?: string;
  role: UserRole;
  active: boolean;
  addresses?: IUserAddress[];
  wishlist?: mongoose.Types.ObjectId[];
  lastLoginAt?: Date;
  emailVerifiedAt?: Date;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  invitationTokenHash?: string;
  invitationExpiresAt?: Date;
  invitationAcceptedAt?: Date;
  invitedBy?: mongoose.Types.ObjectId;
  invitedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userAddressSchema = new Schema<IUserAddress>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true, default: '' },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true, default: '' },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    password: {
      type: String,
      required: function (this: any) {
        // Password is required unless user logged in with Google or has pending invitation
        return !this.invitationTokenHash && !this.googleId;
      },
      select: false, // Never return password hash in queries by default
    },
    role: {
      type: String,
      enum: ['customer', 'admin', 'super_admin'],
      default: 'customer',
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    addresses: {
      type: [userAddressSchema],
      default: [],
    },
    wishlist: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
      default: [],
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
      index: true,
      default: null,
    },
    passwordResetExpiresAt: {
      type: Date,
      default: null,
    },
    invitationTokenHash: {
      type: String,
      select: false,
      index: true,
      default: null,
    },
    invitationExpiresAt: {
      type: Date,
      default: null,
    },
    invitationAcceptedAt: {
      type: Date,
      default: null,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    invitedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);

