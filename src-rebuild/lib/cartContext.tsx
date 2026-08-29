import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { type Product, type ProductWeightOption } from '../data/products';

export interface CartItem {
  product: Product;
  selectedOption: ProductWeightOption;
  quantity: number;
}

export interface AppliedCoupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  discountAmount: number;
}

export interface CartRevalidationResult {
  valid: boolean;
  adjustments: string[];
  subtotal: number;
  discountAmount: number;
  total: number;
}

export interface CartContextType {
  cart: CartItem[];
  items: Array<{ product: any; quantity: number; selectedOption?: ProductWeightOption }>;
  itemCount: number;
  addToCart: (product: Product, option: ProductWeightOption, quantity?: number) => { success: boolean; message?: string };
  addItem: (product: any) => void;
  removeFromCart: (productId: string, weightOrVariantId?: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (
    productId: string,
    weightOrQuantity: string | number,
    quantity?: number
  ) => { success: boolean; message?: string };
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  discountAmount: number;
  coupon: AppliedCoupon | null;
  couponError: string | null;
  isApplyingCoupon: boolean;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  revalidateCart: () => Promise<CartRevalidationResult>;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toastMessage: string | null;
  dismissToast: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = 'malwa_cart_items_v2';
const COUPON_STORAGE_KEY = 'malwa_cart_coupon_v2';

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [coupon, setCoupon] = useState<AppliedCoupon | null>(() => {
    try {
      const stored = localStorage.getItem(COUPON_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('Failed to persist cart to localStorage', e);
    }
  }, [cart]);

  // Persist coupon to localStorage
  useEffect(() => {
    try {
      if (coupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon));
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }, [coupon]);

  const dismissToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  // Compute Raw Subtotal
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = item.selectedOption?.price || (item.product as any)?.price || 0;
      return sum + price * item.quantity;
    }, 0);
  }, [cart]);

  // Total Quantity of Units
  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Navbar compatibility items list
  const items = useMemo(() => {
    return cart.map(c => ({
      product: c.product,
      quantity: c.quantity,
      selectedOption: c.selectedOption,
    }));
  }, [cart]);

  // Compute Verified Discount Amount
  const discountAmount = useMemo(() => {
    if (!coupon || subtotal <= 0) return 0;
    if (coupon.type === 'percentage') {
      const computed = (subtotal * coupon.value) / 100;
      return Math.round(computed * 100) / 100;
    }
    return Math.min(subtotal, coupon.value);
  }, [coupon, subtotal]);

  // Apply Coupon via Server Engine
  const applyCoupon = useCallback(
    async (code: string): Promise<{ success: boolean; message: string }> => {
      const cleanCode = code.trim().toUpperCase();
      if (!cleanCode) {
        setCouponError('Please enter a coupon code.');
        return { success: false, message: 'Please enter a coupon code.' };
      }

      setIsApplyingCoupon(true);
      setCouponError(null);

      try {
        const payload = {
          code: cleanCode,
          subtotal,
          items: cart.map(it => ({
            productId: it.product.id || (it.product as any)._id,
            isCombo: Boolean(it.product.isCombo),
            quantity: it.quantity,
            price: it.selectedOption?.price || 0,
          })),
        };

        const res = await fetch('/api/discounts/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (res.ok && data.valid && (data.discount || data.discountAmount !== undefined)) {
          const applied: AppliedCoupon = {
            code: data.code || cleanCode,
            type: data.type || data.discount?.type || 'percentage',
            value: data.value || data.discount?.value || 0,
            discountAmount: data.discountAmount || 0,
          };
          setCoupon(applied);
          setToastMessage(`Coupon ${cleanCode} applied! Saved ₹${data.discountAmount}`);
          return { success: true, message: `Coupon applied! Saved ₹${data.discountAmount}` };
        } else {
          const errMsg = data.message || 'Invalid or expired coupon code.';
          setCouponError(errMsg);
          return { success: false, message: errMsg };
        }
      } catch {
        const msg = 'Could not validate coupon. Please check connection.';
        setCouponError(msg);
        return { success: false, message: msg };
      } finally {
        setIsApplyingCoupon(false);
      }
    },
    [cart, subtotal]
  );

  const removeCoupon = useCallback(() => {
    setCoupon(null);
    setCouponError(null);
    setToastMessage('Coupon removed.');
  }, []);

  // Add To Cart with Stock Enforcement
  const addToCart = useCallback((product: Product, option: ProductWeightOption, quantity = 1) => {
    const availableStock = typeof (option as any).stock === 'number' ? (option as any).stock : 100;

    if (availableStock <= 0) {
      setToastMessage(`Sorry, ${product.name} (${option.weight}) is out of stock.`);
      return { success: false, message: 'Item is out of stock' };
    }

    let addedSuccess = true;
    let warningMsg = '';

    setCart(prev => {
      const existingIdx = prev.findIndex(
        item =>
          item.product.id === product.id &&
          (item.selectedOption.weight === option.weight ||
            (item.selectedOption as any).id === (option as any).id)
      );

      if (existingIdx > -1) {
        const currentQty = prev[existingIdx].quantity;
        const newQty = currentQty + quantity;

        if (newQty > availableStock) {
          addedSuccess = false;
          warningMsg = `Only ${availableStock} units available in stock.`;
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: availableStock,
          };
          return updated;
        }

        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
        };
        return updated;
      }

      const initialQty = Math.min(quantity, availableStock);
      return [...prev, { product, selectedOption: option, quantity: initialQty }];
    });

    if (!addedSuccess && warningMsg) {
      setToastMessage(warningMsg);
      return { success: false, message: warningMsg };
    }

    setToastMessage(`Added ${product.name} (${option.weight}) to cart`);
    setTimeout(() => {
      setToastMessage(current => (current?.includes(product.name) ? null : current));
    }, 3200);

    return { success: true };
  }, []);

  // Compatibility addItem
  const addItem = useCallback(
    (product: any) => {
      const defaultOption = product.options?.[0] || {
        weight: 'Standard',
        price: typeof product.price === 'number' ? product.price : 150,
      };
      addToCart(product, defaultOption, 1);
    },
    [addToCart]
  );

  // Remove from Cart
  const removeFromCart = useCallback((productId: string, weightOrVariantId?: string) => {
    setCart(prev =>
      prev.filter(item => {
        if (!weightOrVariantId) {
          return item.product.id !== productId;
        }
        return !(
          item.product.id === productId &&
          (item.selectedOption.weight === weightOrVariantId ||
            (item.selectedOption as any).id === weightOrVariantId)
        );
      })
    );
  }, []);

  const removeItem = useCallback(
    (productId: string) => {
      removeFromCart(productId);
    },
    [removeFromCart]
  );

  // Update Quantity with Overloaded signatures
  const updateQuantity = useCallback(
    (
      productId: string,
      weightOrQuantity: string | number,
      maybeQuantity?: number
    ): { success: boolean; message?: string } => {
      let weight: string | undefined = undefined;
      let targetQty: number;

      if (typeof weightOrQuantity === 'number') {
        targetQty = weightOrQuantity;
      } else {
        weight = weightOrQuantity;
        targetQty = maybeQuantity ?? 1;
      }

      if (targetQty <= 0) {
        removeFromCart(productId, weight);
        return { success: true };
      }

      let capped = false;
      let limit = 100;

      setCart(prev =>
        prev.map(item => {
          const matchProduct = item.product.id === productId || (item.product as any)._id === productId;
          const matchWeight = !weight || item.selectedOption.weight === weight || (item.selectedOption as any).id === weight;

          if (matchProduct && matchWeight) {
            const stock = typeof (item.selectedOption as any).stock === 'number'
              ? (item.selectedOption as any).stock
              : 100;

            if (targetQty > stock) {
              capped = true;
              limit = stock;
              return { ...item, quantity: stock };
            }
            return { ...item, quantity: targetQty };
          }
          return item;
        })
      );

      if (capped) {
        setToastMessage(`Only ${limit} units available in stock.`);
        return { success: false, message: `Only ${limit} units available.` };
      }

      return { success: true };
    },
    [removeFromCart]
  );

  const clearCart = useCallback(() => {
    setCart([]);
    setCoupon(null);
    setCouponError(null);
  }, []);

  // Revalidate Cart against MongoDB Backend
  const revalidateCart = useCallback(async (): Promise<CartRevalidationResult> => {
    if (cart.length === 0) {
      return { valid: true, adjustments: [], subtotal: 0, discountAmount: 0, total: 0 };
    }

    try {
      const payload = {
        items: cart.map(it => ({
          productId: it.product.id || (it.product as any)._id,
          variantId: (it.selectedOption as any).id || (it.selectedOption as any)._id,
          weight: it.selectedOption?.weight,
          sku: (it.selectedOption as any)?.sku,
          price: it.selectedOption?.price || 0,
          quantity: it.quantity,
        })),
        couponCode: coupon?.code || '',
      };

      const res = await fetch('/api/cart/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.items) && data.adjustments.length > 0) {
            // Apply server adjustments back to local cart
            setCart(prev => {
              return data.items.map((valItem: any) => {
                const existing = prev.find(
                  p =>
                    (p.product.id === valItem.productId || (p.product as any)._id === valItem.productId) &&
                    p.selectedOption?.weight === valItem.variantLabel
                );
                if (existing) {
                  return {
                    ...existing,
                    quantity: valItem.quantity,
                    selectedOption: {
                      ...existing.selectedOption,
                      price: valItem.price,
                      stock: valItem.stock,
                    },
                  };
                }
                const fallbackProd = {
                  id: valItem.productId,
                  name: valItem.productName,
                  image: valItem.image,
                  hindiName: valItem.hindiName,
                  tagline: '',
                  category: 'sev-namkeen',
                  categoryLabel: 'Namkeen',
                  description: '',
                  story: '',
                  ingredients: [],
                  spiceLevel: 'Medium',
                  shelfLife: '90 Days',
                  oilUsed: 'Groundnut Oil',
                  rating: 4.9,
                  reviewCount: 100,
                  isAvailable: true,
                  isVegetarian: true,
                  options: [
                    {
                      weight: valItem.variantLabel,
                      price: valItem.price,
                    },
                  ],
                } as unknown as Product;

                return {
                  product: fallbackProd,
                  selectedOption: {
                    weight: valItem.variantLabel,
                    price: valItem.price,
                  },
                  quantity: valItem.quantity,
                };
              });
            });
          }

          if (data.couponError) {
            setCoupon(null);
            setCouponError(data.couponError);
          }

          return {
            valid: data.valid,
            adjustments: data.adjustments || [],
            subtotal: data.subtotal,
            discountAmount: data.discountAmount || 0,
            total: data.total,
          };
        }
      }
    } catch (e) {
      console.warn('[Cart Revalidation] Network error during revalidation:', e);
    }

    return {
      valid: true,
      adjustments: [],
      subtotal,
      discountAmount,
      total: Math.max(0, subtotal - discountAmount),
    };
  }, [cart, coupon, subtotal, discountAmount]);

  const value = useMemo<CartContextType>(
    () => ({
      cart,
      items,
      itemCount: totalItems,
      addToCart,
      addItem,
      removeFromCart,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      subtotal,
      discountAmount,
      coupon,
      couponError,
      isApplyingCoupon,
      applyCoupon,
      removeCoupon,
      revalidateCart,
      isCartOpen,
      openCart,
      closeCart,
      toastMessage,
      dismissToast,
    }),
    [
      cart,
      items,
      totalItems,
      addToCart,
      addItem,
      removeFromCart,
      removeItem,
      updateQuantity,
      clearCart,
      subtotal,
      discountAmount,
      coupon,
      couponError,
      isApplyingCoupon,
      applyCoupon,
      removeCoupon,
      revalidateCart,
      isCartOpen,
      openCart,
      closeCart,
      toastMessage,
      dismissToast,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
