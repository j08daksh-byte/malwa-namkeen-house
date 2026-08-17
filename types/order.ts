// ─── Order Types ──────────────────────────────────────────────────────────────

import type { WeightOption } from './product';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out-for-delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type PaymentMethod = 'cod' | 'upi' | 'card' | 'netbanking' | 'wallet';

export interface OrderItem {
  productId: string;
  name: string;
  slug: string;
  image: string;
  selectedWeight: WeightOption;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  guestEmail?: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  shippingCharge: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  estimatedDelivery: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
