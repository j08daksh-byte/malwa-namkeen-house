import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { type Product, type ProductWeightOption } from '../data/products';

export interface CartItem {
  product: Product;
  selectedOption: ProductWeightOption;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, option: ProductWeightOption, quantity?: number) => void;
  removeFromCart: (productId: string, weight: string) => void;
  updateQuantity: (productId: string, weight: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toastMessage: string | null;
  dismissToast: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = 'malwa_cart_items_v1';

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('Failed to save cart to localStorage', e);
    }
  }, [cart]);

  const dismissToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  const addToCart = useCallback((product: Product, option: ProductWeightOption, quantity = 1) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(
        item => item.product.id === product.id && item.selectedOption.weight === option.weight
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + quantity,
        };
        return updated;
      }
      return [...prev, { product, selectedOption: option, quantity }];
    });

    setToastMessage(`Added ${product.name} (${option.weight}) to your cart`);
    setTimeout(() => {
      setToastMessage(current => (current?.includes(product.name) ? null : current));
    }, 3500);
  }, []);

  const removeFromCart = useCallback((productId: string, weight: string) => {
    setCart(prev => prev.filter(
      item => !(item.product.id === productId && item.selectedOption.weight === weight)
    ));
  }, []);

  const updateQuantity = useCallback((productId: string, weight: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, weight);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.product.id === productId && item.selectedOption.weight === weight) {
        return { ...item, quantity };
      }
      return item;
    }));
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.selectedOption.price * item.quantity, 0);
  }, [cart]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        isCartOpen,
        openCart,
        closeCart,
        toastMessage,
        dismissToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
