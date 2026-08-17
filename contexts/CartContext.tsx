'use client';

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from 'react';
import type { CartProduct } from '@/types/product';
import type { WeightOption } from '@/types/product';
import {
  CART_STORAGE_KEY,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_CHARGE,
} from '@/lib/constants';
import { getFromStorage, setToStorage } from '@/lib/utils';

// ─── State & Types ─────────────────────────────────────────────────────────────

interface CartState {
  items: CartProduct[];
}

type CartAction =
  | { type: 'ADD_ITEM';    payload: CartProduct }
  | { type: 'REMOVE_ITEM'; payload: { productId: string; weightValue: number } }
  | { type: 'UPDATE_QTY';  payload: { productId: string; weightValue: number; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'HYDRATE';     payload: CartProduct[] };

// ─── Reducer ───────────────────────────────────────────────────────────────────

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'HYDRATE':
      return { items: action.payload };

    case 'ADD_ITEM': {
      const { productId, selectedWeight, quantity } = action.payload;
      const existing = state.items.find(
        (i) => i.productId === productId && i.selectedWeight.value === selectedWeight.value
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === productId && i.selectedWeight.value === selectedWeight.value
              ? { ...i, quantity: Math.min(i.quantity + quantity, 10) }
              : i
          ),
        };
      }
      return { items: [...state.items, action.payload] };
    }

    case 'REMOVE_ITEM':
      return {
        items: state.items.filter(
          (i) =>
            !(
              i.productId === action.payload.productId &&
              i.selectedWeight.value === action.payload.weightValue
            )
        ),
      };

    case 'UPDATE_QTY': {
      const { productId, weightValue, quantity } = action.payload;
      if (quantity <= 0) {
        return {
          items: state.items.filter(
            (i) => !(i.productId === productId && i.selectedWeight.value === weightValue)
          ),
        };
      }
      return {
        items: state.items.map((i) =>
          i.productId === productId && i.selectedWeight.value === weightValue
            ? { ...i, quantity: Math.min(quantity, 10) }
            : i
        ),
      };
    }

    case 'CLEAR_CART':
      return { items: [] };

    default:
      return state;
  }
}

// ─── Context ───────────────────────────────────────────────────────────────────

interface CartContextValue {
  items: CartProduct[];
  itemCount: number;
  subtotal: number;
  shippingCharge: number;
  total: number;
  freeShippingRemaining: number;
  addItem: (product: CartProduct) => void;
  removeItem: (productId: string, weightValue: number) => void;
  updateQuantity: (productId: string, weightValue: number, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string, weightValue?: number) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = getFromStorage<CartProduct[]>(CART_STORAGE_KEY, []);
    if (stored.length > 0) {
      dispatch({ type: 'HYDRATE', payload: stored });
    }
  }, []);

  // Persist to localStorage on every change
  useEffect(() => {
    setToStorage(CART_STORAGE_KEY, state.items);
  }, [state.items]);

  // Derived values
  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce(
    (sum, i) => sum + i.selectedWeight.price * i.quantity,
    0
  );
  const shippingCharge = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
  const total = subtotal + shippingCharge;
  const freeShippingRemaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);

  function addItem(product: CartProduct) {
    dispatch({ type: 'ADD_ITEM', payload: product });
  }

  function removeItem(productId: string, weightValue: number) {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId, weightValue } });
  }

  function updateQuantity(productId: string, weightValue: number, quantity: number) {
    dispatch({ type: 'UPDATE_QTY', payload: { productId, weightValue, quantity } });
  }

  function clearCart() {
    dispatch({ type: 'CLEAR_CART' });
  }

  function isInCart(productId: string, weightValue?: number): boolean {
    return state.items.some(
      (i) =>
        i.productId === productId &&
        (weightValue === undefined || i.selectedWeight.value === weightValue)
    );
  }

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        itemCount,
        subtotal,
        shippingCharge,
        total,
        freeShippingRemaining,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
