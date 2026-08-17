'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { WISHLIST_STORAGE_KEY } from '@/lib/constants';
import { getFromStorage, setToStorage } from '@/lib/utils';

// ─── Context ───────────────────────────────────────────────────────────────────

interface WishlistContextValue {
  wishlistIds: string[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
  count: number;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────────

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  // Hydrate from localStorage
  useEffect(() => {
    const stored = getFromStorage<string[]>(WISHLIST_STORAGE_KEY, []);
    setWishlistIds(stored);
  }, []);

  // Persist on change
  useEffect(() => {
    setToStorage(WISHLIST_STORAGE_KEY, wishlistIds);
  }, [wishlistIds]);

  function isWishlisted(productId: string): boolean {
    return wishlistIds.includes(productId);
  }

  function addToWishlist(productId: string) {
    setWishlistIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
  }

  function removeFromWishlist(productId: string) {
    setWishlistIds((prev) => prev.filter((id) => id !== productId));
  }

  function toggleWishlist(productId: string) {
    if (isWishlisted(productId)) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(productId);
    }
  }

  function clearWishlist() {
    setWishlistIds([]);
  }

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        isWishlisted,
        toggleWishlist,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        count: wishlistIds.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
}
