// ─── User Types ───────────────────────────────────────────────────────────────

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault: boolean;
  label?: 'home' | 'work' | 'other';
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  addresses: Address[];
  wishlistIds: string[];  // product IDs
  createdAt: string;
}
