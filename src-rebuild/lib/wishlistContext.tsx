import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { type Product } from '../data/products';
import { useCustomerSession } from '../components/layout/CustomerSessionContext';

interface WishlistContextType {
  wishlist: Product[];
  wishlistIds: string[];
  wishlistCount: number;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => Promise<void>;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

const STORAGE_KEY = 'malwa_wishlist_v1';
const TOKEN_KEY = 'malwa_auth_token';

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { customer } = useCustomerSession();
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  // Sync wishlist to localStorage for guest persistence
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
    } catch {
      // Ignore
    }
  }, [wishlist]);

  // When customer logs in, fetch MongoDB wishlist & sync local items
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (customer && token) {
      const syncWithBackend = async () => {
        setLoading(true);
        try {
          // 1. Sync guest local items up to account
          const localIds = wishlist.map(p => p.id || (p as any)._id).filter(Boolean);
          if (localIds.length > 0) {
            await fetch('/api/customer/wishlist/sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ productIds: localIds }),
            });
          }

          // 2. Fetch full updated wishlist from MongoDB
          const res = await fetch('/api/customer/wishlist', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.wishlist)) {
              setWishlist(data.wishlist);
            }
          }
        } catch (e) {
          console.warn('[Wishlist] Sync error:', e);
        } finally {
          setLoading(false);
        }
      };

      syncWithBackend();
    }
  }, [customer]);

  const wishlistIds = useMemo(() => {
    return wishlist.map(p => String(p.id || (p as any)._id));
  }, [wishlist]);

  const isInWishlist = useCallback(
    (productId: string) => {
      const cleanId = String(productId);
      return wishlistIds.includes(cleanId);
    },
    [wishlistIds]
  );

  const toggleWishlist = useCallback(
    async (product: Product) => {
      const prodId = String(product.id || (product as any)._id);
      const exists = wishlistIds.includes(prodId);

      // Optimistic update
      setWishlist(prev => {
        if (exists) {
          return prev.filter(p => String(p.id || (p as any)._id) !== prodId);
        } else {
          return [...prev, product];
        }
      });

      // If logged in, persist to MongoDB
      const token = localStorage.getItem(TOKEN_KEY);
      if (customer && token) {
        try {
          await fetch('/api/customer/wishlist/toggle', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ productId: prodId }),
          });
        } catch (e) {
          console.warn('[Wishlist] Toggle backend error:', e);
        }
      }
    },
    [customer, wishlistIds]
  );

  const value = useMemo<WishlistContextType>(
    () => ({
      wishlist,
      wishlistIds,
      wishlistCount: wishlist.length,
      isInWishlist,
      toggleWishlist,
      loading,
    }),
    [wishlist, wishlistIds, isInWishlist, toggleWishlist, loading]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
