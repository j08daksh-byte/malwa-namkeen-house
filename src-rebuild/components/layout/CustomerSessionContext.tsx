import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface CustomerProfile { name: string; email: string; phone?: string; }
interface CustomerSession { customer: CustomerProfile | null; signIn: (profile: CustomerProfile) => void; signOut: () => void; updateProfile: (profile: CustomerProfile) => void; }
const CustomerSessionContext = createContext<CustomerSession | null>(null);
const KEY = 'malwa-customer-session';

export function CustomerSessionProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerProfile | null>(() => { try { const value = localStorage.getItem(KEY); return value ? JSON.parse(value) as CustomerProfile : null; } catch { return null; } });
  useEffect(() => { if (customer) localStorage.setItem(KEY, JSON.stringify(customer)); else localStorage.removeItem(KEY); }, [customer]);
  return <CustomerSessionContext.Provider value={{ customer, signIn: setCustomer, signOut: () => setCustomer(null), updateProfile: setCustomer }}>{children}</CustomerSessionContext.Provider>;
}
export function useCustomerSession() { const context = useContext(CustomerSessionContext); if (!context) throw new Error('useCustomerSession must be used within CustomerSessionProvider'); return context; }
