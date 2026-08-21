/**
 * Typed fetch wrappers for public Malwa Namkeen House API endpoints.
 * All calls go to the Express backend via the Vite proxy (/api → port 3000).
 */

export interface ApiSuccess {
  success: true;
  message: string;
  referenceId?: string;
  whatsappUrl?: string;
  fieldErrors?: never;
}

export interface ApiError {
  success: false;
  message: string;
  fieldErrors?: Record<string, string>;
  whatsappUrl?: string;
}

export type ApiResult = ApiSuccess | ApiError;

async function post(path: string, body: unknown): Promise<ApiResult> {
  try {
    const res = await fetch(path, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({
      success: false,
      message: 'Unexpected server response. Please try again.',
    }));

    return data as ApiResult;
  } catch {
    return {
      success: false,
      message: 'Could not reach the server. Please check your connection and try again.',
    };
  }
}

// ── Contact enquiry ──────────────────────────────────────────────────────────

export interface ContactPayload {
  name:             string;
  email:            string;
  phone?:           string;
  category:         string;
  message:          string;
  consent_accepted: boolean;
  location_id?:     string;
  _hp?:             string; // honeypot — always send as empty string
}

export function submitContact(payload: ContactPayload): Promise<ApiResult> {
  return post('/api/contact', { ...payload, _hp: '' });
}

// ── Reservation enquiry ──────────────────────────────────────────────────────

export interface ReservationPayload {
  customer_name:    string;
  email:            string;
  phone:            string;
  reservation_date: string;
  preferred_time:   string;
  guest_count:      number;
  special_request?: string;
  consent_accepted: boolean;
  location_id?:     string;
  _hp?:             string;
}

export function submitReservation(payload: ReservationPayload): Promise<ApiResult> {
  return post('/api/reservation', { ...payload, _hp: '' });
}
