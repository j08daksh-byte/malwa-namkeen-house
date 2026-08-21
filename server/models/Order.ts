import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type ShipmentStatus = 'unfulfilled' | 'ready_to_ship' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'returned';

export interface IOrderItem {
  productId?: Types.ObjectId;
  productName: string;        // Snapshot of product name at purchase time
  variantLabel: string;       // Snapshot of variant label (e.g., "500g", "Small Gift Box")
  sku: string;                // Snapshot of SKU at purchase time
  price: number;              // Snapshot of price per unit at purchase time
  quantity: number;           // Quantity ordered
  itemTotal: number;          // price * quantity
  image?: string;             // Primary product image snapshot
}

export interface IShippingAddress {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  customer?: Types.ObjectId;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  items: IOrderItem[];
  subtotal: number;
  discount: number;
  discountCode?: string;
  shipping: number;
  total: number;
  shippingAddress: IShippingAddress;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: 'cod' | 'online' | 'upi' | 'card';
  paymentDetails?: {
    transactionId?: string;
    gateway?: string;
    paidAt?: Date;
  };
  shipmentStatus: ShipmentStatus;
  trackingInfo?: {
    courierName?: string;
    trackingNumber?: string;
    trackingUrl?: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
    },
    productName: {
      type: String,
      required: [true, 'Product name snapshot is required'],
      trim: true,
    },
    variantLabel: {
      type: String,
      required: [true, 'Variant label snapshot is required (e.g. 500g)'],
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Item unit price is required'],
      min: [0, 'Price must be non-negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Item quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    itemTotal: {
      type: Number,
      required: [true, 'Item total is required'],
    },
    image: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true, default: '' },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: [true, 'Order number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    customerInfo: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, required: true, trim: true },
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: function (v: IOrderItem[]) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Order must contain at least one purchased item.',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    shipping: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'online', 'upi', 'card'],
      default: 'cod',
    },
    paymentDetails: {
      transactionId: { type: String, trim: true },
      gateway: { type: String, trim: true },
      paidAt: { type: Date },
    },
    shipmentStatus: {
      type: String,
      enum: ['unfulfilled', 'ready_to_ship', 'in_transit', 'out_for_delivery', 'delivered', 'returned'],
      default: 'unfulfilled',
      index: true,
    },
    trackingInfo: {
      courierName: { type: String, trim: true },
      trackingNumber: { type: String, trim: true },
      trackingUrl: { type: String, trim: true },
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

// Compound index for fast retrieval of customer order history
orderSchema.index({ customer: 1, createdAt: -1 });

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);
