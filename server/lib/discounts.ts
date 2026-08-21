import { Discount, type IDiscount } from '../models/Discount.ts';

export interface DiscountValidationResult {
  valid: boolean;
  message?: string;
  discountAmount: number;
  code?: string;
  discount?: IDiscount;
}

/**
 * Server-side coupon validation & discount calculation.
 * Never trust a discount amount provided by the client.
 */
export async function validateAndCalculateDiscount(
  rawCode: string,
  subtotal: number
): Promise<DiscountValidationResult> {
  if (!rawCode || typeof rawCode !== 'string' || !rawCode.trim()) {
    return { valid: false, message: 'Please enter a coupon code.', discountAmount: 0 };
  }

  if (isNaN(subtotal) || subtotal <= 0) {
    return { valid: false, message: 'Invalid cart subtotal.', discountAmount: 0 };
  }

  const code = rawCode.trim().toUpperCase();
  const discount = await Discount.findOne({ code });

  if (!discount) {
    return { valid: false, message: `Coupon code "${code}" is invalid.`, discountAmount: 0 };
  }

  if (!discount.active) {
    return { valid: false, message: `Coupon code "${code}" is no longer active.`, discountAmount: 0 };
  }

  const now = new Date();

  // Validate start date
  if (discount.startDate && new Date(discount.startDate) > now) {
    return {
      valid: false,
      message: `Coupon code "${code}" is not valid yet.`,
      discountAmount: 0,
    };
  }

  // Validate expiry date
  if (discount.endDate && new Date(discount.endDate) < now) {
    return {
      valid: false,
      message: `Coupon code "${code}" has expired.`,
      discountAmount: 0,
    };
  }

  // Validate total usage limit
  if (typeof discount.usageLimit === 'number' && discount.usageLimit > 0) {
    if (discount.usedCount >= discount.usageLimit) {
      return {
        valid: false,
        message: `Coupon code "${code}" has reached its maximum redemption limit.`,
        discountAmount: 0,
      };
    }
  }

  // Validate minimum order value
  if (discount.minimumOrder > 0 && subtotal < discount.minimumOrder) {
    return {
      valid: false,
      message: `Cart subtotal must be at least ₹${discount.minimumOrder} to use coupon "${code}".`,
      discountAmount: 0,
    };
  }

  // Calculate discount amount server-side
  let discountAmount = 0;

  if (discount.type === 'percentage') {
    const rawDiscount = (subtotal * discount.value) / 100;
    if (discount.maximumDiscount && discount.maximumDiscount > 0) {
      discountAmount = Math.min(rawDiscount, discount.maximumDiscount);
    } else {
      discountAmount = rawDiscount;
    }
  } else if (discount.type === 'fixed') {
    discountAmount = Math.min(subtotal, discount.value);
  }

  // Round to 2 decimal places or nearest integer
  discountAmount = Math.round(discountAmount * 100) / 100;

  return {
    valid: true,
    code: discount.code,
    discountAmount,
    discount,
  };
}
