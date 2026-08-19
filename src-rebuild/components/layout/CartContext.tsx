import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { MenuItem } from '../../data/menu';

export interface CartLine { product: MenuItem; quantity: number; }
interface CartContextValue {
  items: CartLine[]; itemCount: number; subtotal: number;
  addItem: (product: MenuItem) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
}
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const value = useMemo<CartContextValue>(() => ({
    items,
    itemCount: items.reduce((total, line) => total + line.quantity, 0),
    subtotal: items.reduce((total, line) => total + (typeof line.product.price === 'number' ? line.product.price * line.quantity : 0), 0),
    addItem: product => setItems(current => {
      const existing = current.find(line => line.product.id === product.id);
      return existing ? current.map(line => line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line) : [...current, { product, quantity: 1 }];
    }),
    updateQuantity: (productId, quantity) => setItems(current => quantity <= 0 ? current.filter(line => line.product.id !== productId) : current.map(line => line.product.id === productId ? { ...line, quantity } : line)),
    removeItem: productId => setItems(current => current.filter(line => line.product.id !== productId)),
  }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
