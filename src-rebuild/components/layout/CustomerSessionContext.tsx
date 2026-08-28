import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

export interface CustomerProfile {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role?: string;
}

interface CustomerSession {
  customer: CustomerProfile | null;
  loading: boolean;
  signIn: (profile: CustomerProfile, token?: string) => void;
  signOut: () => Promise<void>;
  updateProfile: (profile: CustomerProfile) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: { name: string; email: string; phone?: string; password: string }) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: (credential: string) => Promise<{ success: boolean; message?: string }>;
}

const CustomerSessionContext = createContext<CustomerSession | null>(null);
const KEY = 'malwa-customer-session';
const TOKEN_KEY = 'malwa_auth_token';

export function CustomerSessionProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerProfile | null>(() => {
    try {
      const value = localStorage.getItem(KEY);
      return value ? (JSON.parse(value) as CustomerProfile) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Sync profile from backend /api/auth/me on mount
  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem(TOKEN_KEY);

    fetch('/api/auth/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (isMounted) {
          if (data?.success && data.user) {
            setCustomer(data.user);
            localStorage.setItem(KEY, JSON.stringify(data.user));
          } else if (!token) {
            // No valid session on server and no token in localStorage
            setCustomer(null);
            localStorage.removeItem(KEY);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = useCallback((profile: CustomerProfile, token?: string) => {
    setCustomer(profile);
    localStorage.setItem(KEY, JSON.stringify(profile));
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // Ignore network errors during logout
    }
    setCustomer(null);
    localStorage.removeItem(KEY);
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  const updateProfile = useCallback((profile: CustomerProfile) => {
    setCustomer(profile);
    localStorage.setItem(KEY, JSON.stringify(profile));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.message || 'Invalid email or password.' };
      }

      signIn(data.user, data.token);
      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        message: 'Network error. Could not connect to authentication server.',
      };
    }
  }, [signIn]);

  const register = useCallback(async (data: { name: string; email: string; phone?: string; password: string }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, message: json.message || 'Failed to create account.' };
      }

      signIn(json.user, json.token);
      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        message: 'Network error. Could not connect to registration server.',
      };
    }
  }, [signIn]);

  const loginWithGoogle = useCallback(async (credential: string) => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.message || 'Google Sign-In failed.' };
      }

      signIn(data.user, data.token);
      return { success: true, user: data.user };
    } catch (err: unknown) {
      return {
        success: false,
        message: 'Network error during Google Sign-In. Please check your connection.',
      };
    }
  }, [signIn]);

  return (
    <CustomerSessionContext.Provider
      value={{
        customer,
        loading,
        signIn,
        signOut,
        updateProfile,
        login,
        register,
        loginWithGoogle,
      }}
    >
      {children}
    </CustomerSessionContext.Provider>
  );
}

export function useCustomerSession() {
  const context = useContext(CustomerSessionContext);
  if (!context) {
    throw new Error('useCustomerSession must be used within CustomerSessionProvider');
  }
  return context;
}
