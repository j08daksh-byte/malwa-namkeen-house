/* ─── Enquiry payload types ───────────────────────────────────────────────── */

export interface ContactPayload {
  name:      string;
  phone:     string;
  email:     string;
  occasion:  string;
  message:   string;
}

export interface ReservationPayload {
  name:   string;
  phone:  string;
  date:   string;
  time:   string;
  guests: string;
  notes:  string;
}

export interface KateringPayload {
  name:      string;
  phone:     string;
  eventType: string;
  guests:    string;
  date:      string;
  message:   string;
}

export interface GiftingPayload {
  name:     string;
  phone:    string;
  giftType: string;
  quantity: string;
  message:  string;
}

/* ─── API response shapes ─────────────────────────────────────────────────── */

export interface ApiOk {
  success: true;
  message: string;
}

export interface ApiError {
  success: false;
  error:   string;
  fields?: FieldError[];
}

export interface FieldError {
  field:   string;
  message: string;
}
