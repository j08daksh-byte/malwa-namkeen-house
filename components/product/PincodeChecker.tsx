'use client';

import { useState } from 'react';
import { MapPin, Truck, CheckCircle2 } from 'lucide-react';

export function PincodeChecker() {
  const [pincode, setPincode] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [resultMsg, setResultMsg] = useState('');

  function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    const cleanPin = pincode.trim();
    if (!cleanPin || cleanPin.length !== 6 || !/^\d+$/.test(cleanPin)) {
      setStatus('error');
      setResultMsg('Please enter a valid 6-digit PIN code.');
      return;
    }

    setStatus('checking');
    setTimeout(() => {
      setStatus('success');
      setResultMsg(`Delivery available to ${cleanPin} within 2–4 business days. Free shipping on orders over ₹499!`);
    }, 600);
  }

  return (
    <div className="bg-cream-50/80 rounded-2xl border border-cream-200/80 p-4.5 space-y-3">
      <div className="flex items-center gap-2 font-body text-xs font-bold text-dark-900 uppercase tracking-wider">
        <Truck className="h-4 w-4 text-maroon-900" />
        Check Delivery & Express Shipping
      </div>

      <form onSubmit={handleCheck} className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="h-4 w-4 text-dark-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            maxLength={6}
            value={pincode}
            onChange={(e) => {
              setPincode(e.target.value);
              if (status !== 'idle') setStatus('idle');
            }}
            placeholder="Enter 6-digit PIN code"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-cream-300 bg-white font-body text-xs text-dark-900 placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-maroon-900"
          />
        </div>
        <button
          type="submit"
          disabled={status === 'checking'}
          className="px-5 py-2.5 rounded-xl bg-dark-900 text-cream-100 font-body text-xs font-bold uppercase tracking-wider hover:bg-maroon-900 transition-colors disabled:opacity-50 shrink-0"
        >
          {status === 'checking' ? 'Checking…' : 'Check'}
        </button>
      </form>

      {status === 'success' && (
        <div className="flex items-start gap-2 font-body text-xs text-green-700 bg-green-50 p-2.5 rounded-xl border border-green-200 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{resultMsg}</span>
        </div>
      )}

      {status === 'error' && (
        <p className="font-body text-xs text-red-600 pl-1">{resultMsg}</p>
      )}
    </div>
  );
}
