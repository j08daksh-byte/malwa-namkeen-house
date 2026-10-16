import crypto from 'crypto';

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  isConfigured: boolean;
  isSandbox: boolean;
}

export interface CreateRazorpayOrderParams {
  amount: number; // In paise (₹1 = 100 paise)
  currency?: string; // Default 'INR'
  receipt: string; // Order receipt number (e.g. orderNumber)
  notes?: Record<string, string>;
}

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export interface RazorpayPaymentEntity {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  order_id: string;
  invoice_id?: string | null;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status?: string | null;
  captured: boolean;
  description?: string;
  card_id?: string | null;
  bank?: string | null;
  wallet?: string | null;
  vpa?: string | null;
  email?: string;
  contact?: string;
  error_code?: string | null;
  error_description?: string | null;
  created_at: number;
}

export interface RazorpayServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

// In-memory test mock client injector for isolated automated test runs
let _testClient: {
  orders: {
    create: (params: CreateRazorpayOrderParams) => Promise<RazorpayOrderResponse>;
  };
  payments?: {
    fetch: (paymentId: string) => Promise<RazorpayPaymentEntity>;
  };
} | null = null;

export function _setRazorpayClientForTesting(client: typeof _testClient) {
  _testClient = client;
}

export function getRazorpayConfig(): RazorpayConfig {
  const isTest = process.env.NODE_ENV === 'test' || process.env.IS_E2E_TEST === 'true';
  const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  const webhookSecret = (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();
  const isSandbox =
    process.env.RAZORPAY_SANDBOX === 'true' ||
    keyId.startsWith('rzp_test_') ||
    isTest;

  const isConfigured = Boolean(keyId && keySecret);

  return {
    keyId,
    keySecret,
    webhookSecret,
    isConfigured,
    isSandbox,
  };
}

/**
 * Returns public Key ID safe to expose to browser client for Checkout modal.
 * Never exposes the key secret or webhook secret.
 */
export function getPublicRazorpayKeyId(): string {
  const config = getRazorpayConfig();
  return config.keyId;
}

/**
 * Creates a server-side order with Razorpay.
 * Strictly uses server-validated amount in paise (1 INR = 100 paise).
 */
export async function createRazorpayOrder(
  params: CreateRazorpayOrderParams
): Promise<RazorpayServiceResult<RazorpayOrderResponse>> {
  const config = getRazorpayConfig();

  // Validate amount (must be positive integer in paise)
  if (!Number.isInteger(params.amount) || params.amount <= 0) {
    return {
      success: false,
      error: 'Invalid order amount. Amount must be a positive integer in paise.',
      statusCode: 400,
    };
  }

  const currency = (params.currency || 'INR').toUpperCase();
  if (currency !== 'INR') {
    return {
      success: false,
      error: `Unsupported currency: ${currency}. Only INR is currently supported.`,
      statusCode: 400,
    };
  }

  if (!params.receipt || typeof params.receipt !== 'string' || !params.receipt.trim()) {
    return {
      success: false,
      error: 'Order receipt identifier is required.',
      statusCode: 400,
    };
  }

  // If a mock test client is injected, route through it
  if (_testClient) {
    try {
      const mockOrder = await _testClient.orders.create({
        amount: params.amount,
        currency,
        receipt: params.receipt.trim(),
        notes: params.notes || {},
      });
      return { success: true, data: mockOrder };
    } catch (testErr: unknown) {
      const errMsg = testErr instanceof Error ? testErr.message : String(testErr);
      return { success: false, error: errMsg, statusCode: 500 };
    }
  }

  // In production or live mode, verify credentials are present
  if (!config.isConfigured) {
    return {
      success: false,
      error: 'Razorpay payment gateway is not configured on this server.',
      statusCode: 503,
    };
  }

  const authHeader = `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64')}`;
  const payload = {
    amount: params.amount,
    currency,
    receipt: params.receipt.trim().slice(0, 40), // Razorpay receipt max 40 chars
    notes: params.notes || {},
    payment_capture: 1, // Automatically capture authorized payments
  };

  try {
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      const errorDescription =
        data?.error?.description || data?.error?.message || 'Razorpay order creation failed.';
      console.error('[Razorpay Order Creation Error]:', errorDescription, data);
      return {
        success: false,
        error: errorDescription,
        statusCode: res.status,
      };
    }

    return {
      success: true,
      data: data as RazorpayOrderResponse,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[Razorpay Network Exception]:', errMsg);
    return {
      success: false,
      error: 'Payment gateway connection error. Please try again.',
      statusCode: 502,
    };
  }
}

/**
 * Cryptographically verifies Razorpay payment signature using HMAC-SHA256.
 * Compares in constant time to prevent timing attacks.
 */
export function verifyPaymentSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  secret?: string;
}): boolean {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;

  if (
    !razorpayOrderId ||
    typeof razorpayOrderId !== 'string' ||
    !razorpayPaymentId ||
    typeof razorpayPaymentId !== 'string' ||
    !razorpaySignature ||
    typeof razorpaySignature !== 'string'
  ) {
    return false;
  }

  const config = getRazorpayConfig();
  const secret = (params.secret || config.keySecret || '').trim();

  if (!secret) {
    return false;
  }

  try {
    const payload = `${razorpayOrderId.trim()}|${razorpayPaymentId.trim()}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const actualBuf = Buffer.from(razorpaySignature.trim(), 'utf-8');

    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch (err) {
    console.error('[Signature Verification Error]:', err);
    return false;
  }
}

/**
 * Cryptographically verifies Razorpay webhook signature using HMAC-SHA256 over raw payload.
 * Compares in constant time to prevent timing attacks.
 */
export function verifyWebhookSignature(params: {
  rawBody: string | Buffer;
  signature: string;
  webhookSecret?: string;
}): boolean {
  const { rawBody, signature } = params;

  if (!rawBody || !signature || typeof signature !== 'string') {
    return false;
  }

  const config = getRazorpayConfig();
  const secret = (params.webhookSecret || config.webhookSecret || '').trim();

  if (!secret) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const actualBuf = Buffer.from(signature.trim(), 'utf-8');

    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch (err) {
    console.error('[Webhook Signature Verification Error]:', err);
    return false;
  }
}

/**
 * Fetches verified payment details from Razorpay for extra security auditing.
 */
export async function fetchRazorpayPayment(
  paymentId: string
): Promise<RazorpayServiceResult<RazorpayPaymentEntity>> {
  if (!paymentId || typeof paymentId !== 'string') {
    return {
      success: false,
      error: 'Invalid payment ID.',
      statusCode: 400,
    };
  }

  // If a mock test client is injected, route through it
  if (_testClient && _testClient.payments?.fetch) {
    try {
      const mockPayment = await _testClient.payments.fetch(paymentId);
      return { success: true, data: mockPayment };
    } catch (testErr: unknown) {
      const errMsg = testErr instanceof Error ? testErr.message : String(testErr);
      return { success: false, error: errMsg, statusCode: 500 };
    }
  }

  const config = getRazorpayConfig();
  if (!config.isConfigured) {
    return {
      success: false,
      error: 'Razorpay payment gateway is not configured.',
      statusCode: 503,
    };
  }

  const authHeader = `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64')}`;

  try {
    const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId.trim())}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      const errorDescription =
        data?.error?.description || data?.error?.message || 'Failed to fetch payment details.';
      return {
        success: false,
        error: errorDescription,
        statusCode: res.status,
      };
    }

    return {
      success: true,
      data: data as RazorpayPaymentEntity,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: errMsg,
      statusCode: 502,
    };
  }
}
