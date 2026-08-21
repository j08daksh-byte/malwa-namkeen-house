/**
 * Typed fetch wrappers for admin API endpoints.
 * Attaches the JWT admin token as a Bearer header.
 */
async function getToken(): Promise<string | null> {
  return localStorage.getItem('malwa_admin_token');
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await getToken();
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({ success: false, message: 'Invalid server response.' }));
  if (!res.ok) throw new Error(data.message ?? `HTTP ${res.status}`);
  return data as T;
}

const get  = <T>(path: string)                    => request<T>('GET', path);
const patch = <T>(path: string, body: unknown)    => request<T>('PATCH', path, body);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string; email: string; full_name: string; role: string;
}

export interface Pagination {
  page: number; limit: number; total: number; pages: number;
}

export interface ReservationRow {
  id: string;
  name: string;
  customer_name: string;
  email: string;
  phone: string;
  reservation_date: string;
  preferred_time: string;
  guest_count: number;
  special_request: string;
  status: string;
  location_id: string;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

export interface EnquiryRow {
  id: string;
  name: string;
  customer_name: string;
  email: string;
  phone: string;
  category: string;
  message: string;
  status: string;
  location_id: string;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

export interface SettingRow {
  id: string;
  key: string;
  value: string;
  label: string;
  description: string;
  is_public: boolean;
}

export interface DashboardData {
  range: string;
  contacts: { total: number; new: number; in_progress: number; resolved: number; byCategory: Record<string, number> };
  reservations: { total: number; new: number; confirmed: number; declined: number };
  recent: { contacts: EnquiryRow[]; reservations: ReservationRow[] };
}

// ── API calls ─────────────────────────────────────────────────────────────────

export const adminApi = {
  me: ()                          => get<{ success: true; admin: AdminUser }>('/api/admin/me'),
  dashboard: (range = '30d')      => get<{ success: true } & DashboardData>(`/api/admin/dashboard?range=${range}`),

  reservations: (params: Record<string, string>) =>
    get<{ success: true; data: ReservationRow[]; pagination: Pagination }>(
      `/api/admin/reservations?${new URLSearchParams(params)}`
    ),
  reservation: (id: string)       => get<{ success: true; data: ReservationRow }>(`/api/admin/reservations/${id}`),
  updateReservation: (id: string, body: { status?: string; admin_notes?: string }) =>
    patch<{ success: true; data: ReservationRow; emailSent: boolean }>(`/api/admin/reservations/${id}`, body),

  enquiries: (params: Record<string, string>) =>
    get<{ success: true; data: EnquiryRow[]; pagination: Pagination }>(
      `/api/admin/enquiries?${new URLSearchParams(params)}`
    ),
  enquiry: (id: string)           => get<{ success: true; data: EnquiryRow }>(`/api/admin/enquiries/${id}`),
  updateEnquiry: (id: string, body: { status?: string; admin_notes?: string }) =>
    patch<{ success: true; data: EnquiryRow }>(`/api/admin/enquiries/${id}`, body),

  settings: ()                    => get<{ success: true; data: SettingRow[] }>('/api/admin/settings'),
  updateSetting: (key: string, value: string) =>
    patch<{ success: true; data: SettingRow }>(`/api/admin/settings/${key}`, { value }),

  publicSettings: ()              => fetch('/api/settings/public').then(r => r.json()),
};
