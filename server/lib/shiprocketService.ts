import crypto from 'node:crypto';
import type { IOrder, IOrderItem } from '../models/Order.ts';

export interface ShiprocketConfig {
  email: string;
  password: string;
  webhookToken: string;
  pickupLocation: string;
  isConfigured: boolean;
  isSandbox: boolean;
}

export interface PackageValidationResult {
  valid: boolean;
  totalWeightKg: number;
  dimensions: {
    length: number;
    breadth: number;
    height: number;
  };
  missingMetadata: string[];
  orderItems: Array<{
    name: string;
    sku: string;
    units: number;
    selling_price: number;
    discount: number;
    tax: number;
  }>;
}

export interface ShiprocketCreateOrderResponse {
  order_id: number;
  shipment_id: number;
  status: string;
  status_code: number;
  onboarding_completed_now?: number;
  awb_code?: string;
  courier_company_id?: number;
  courier_name?: string;
}

export interface ShiprocketAWBResponse {
  awb_assign_status: number;
  response: {
    data: {
      awb_code: string;
      courier_company_id: number;
      courier_name: string;
      shipment_id: number;
      label_url?: string;
      manifest_url?: string;
    };
  };
}

export interface ShiprocketTrackingActivity {
  date: string;
  status: string;
  activity: string;
  location: string;
  'sr-status'?: string;
}

export interface ShiprocketTrackingResponse {
  tracking_data: {
    track_status: number;
    shipment_status: number;
    shipment_track: Array<{
      id: number;
      awb_code: string;
      current_status: string;
      origin: string;
      destination: string;
      courier_name: string;
      edd?: string;
    }>;
    shipment_track_activities: ShiprocketTrackingActivity[];
    track_url?: string;
  };
}

export interface ShiprocketServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

// In-memory token cache (Shiprocket auth token valid up to 10 days; we cache for 24 hours)
let cachedAuthToken: string | null = null;
let tokenExpiresAt = 0;

// Test mock client injector for isolated, offline automated test suites
let _testClient: {
  auth?: {
    login: (email: string, pass: string) => Promise<{ token: string }>;
  };
  orders?: {
    create: (payload: any) => Promise<ShiprocketCreateOrderResponse>;
    cancel?: (orderIds: number[]) => Promise<{ status: number; message: string }>;
  };
  courier?: {
    assignAWB: (shipmentId: number, courierId?: number) => Promise<ShiprocketAWBResponse>;
    track: (awb: string) => Promise<ShiprocketTrackingResponse>;
  };
} | null = null;

export function _setShiprocketClientForTesting(client: typeof _testClient) {
  _testClient = client;
}

export function _resetShiprocketTokenCache() {
  cachedAuthToken = null;
  tokenExpiresAt = 0;
}

export function getShiprocketConfig(): ShiprocketConfig {
  const isTest = process.env.NODE_ENV === 'test' || process.env.IS_E2E_TEST === 'true';
  const email = (process.env.SHIPROCKET_EMAIL || '').trim();
  const password = (process.env.SHIPROCKET_PASSWORD || '').trim();
  const webhookToken = (process.env.SHIPROCKET_WEBHOOK_TOKEN || '').trim();
  const pickupLocation = (process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary').trim();
  const isSandbox =
    process.env.SHIPROCKET_SANDBOX === 'true' ||
    email.includes('test') ||
    isTest;

  const isConfigured = Boolean(email && password);

  return {
    email,
    password,
    webhookToken,
    pickupLocation,
    isConfigured,
    isSandbox,
  };
}

/**
 * Obtains a valid Bearer token from Shiprocket with in-memory caching.
 * Protects credentials by never logging them.
 */
export async function getShiprocketAuthToken(): Promise<ShiprocketServiceResult<string>> {
  // If mock client is injected, route through it
  if (_testClient?.auth) {
    try {
      const res = await _testClient.auth.login('mock@malwanamkeen.com', 'mock_password');
      return { success: true, data: res.token };
    } catch (testErr: unknown) {
      const errMsg = testErr instanceof Error ? testErr.message : String(testErr);
      return { success: false, error: errMsg, statusCode: 401 };
    }
  }

  // Use cached token if valid and not expiring in next 60s
  if (cachedAuthToken && Date.now() < tokenExpiresAt - 60000) {
    return { success: true, data: cachedAuthToken };
  }

  const config = getShiprocketConfig();
  if (!config.isConfigured) {
    return {
      success: false,
      error: 'Shiprocket logistics integration is not configured on this server.',
      statusCode: 503,
    };
  }

  try {
    const res = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: config.email,
        password: config.password,
      }),
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    const data = await res.json();

    if (!res.ok || !data.token) {
      const msg = data.message || 'Authentication with Shiprocket failed.';
      console.error('[Shiprocket Auth Error]:', msg);
      return {
        success: false,
        error: msg,
        statusCode: res.status || 401,
      };
    }

    cachedAuthToken = data.token;
    // Cache for 24 hours
    tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;

    return {
      success: true,
      data: data.token,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[Shiprocket Auth Exception]:', errMsg);
    return {
      success: false,
      error: 'Shiprocket authentication service timed out or was unreachable.',
      statusCode: 502,
    };
  }
}

/**
 * Parses numeric weight in kilograms from variant labels or explicit values.
 * E.g. "200g" -> 0.2 kg, "500g" -> 0.5 kg, "1kg" -> 1.0 kg, "1.25kg" -> 1.25 kg.
 * Returns null if weight cannot be safely deduced.
 */
export function parseVariantWeightKg(variantLabel: string): number | null {
  if (!variantLabel || typeof variantLabel !== 'string') return null;
  const clean = variantLabel.trim().toLowerCase();

  // Match pattern: "1.25kg" or "1 kg" or "1kg Box"
  const kgMatch = clean.match(/^(\d+(?:\.\d+)?)\s*kg(?:\s+(?:pack|pouch|box|jar|tin|bag|container))?$/);
  if (kgMatch) {
    const val = parseFloat(kgMatch[1]);
    return val > 0 ? val : null;
  }

  // Match pattern: "500g" or "500 gm" or "500 grams" or "250g Pack"
  const gMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:g|gm|gms|grams)(?:\s+(?:pack|pouch|box|jar|tin|bag|container))?$/);
  if (gMatch) {
    const grams = parseFloat(gMatch[1]);
    return grams > 0 ? grams / 1000 : null;
  }

  return null;
}

/**
 * Validates and maps order items, computing overall shipment weight and dimensions
 * strictly from server-side validated product metadata.
 * Does not invent dimensions or weights; missing metadata is cleanly flagged.
 */
export function validateAndCalculateShipmentPackage(
  order: IOrder,
  customDimensions?: { length: number; breadth: number; height: number }
): PackageValidationResult {
  const missingMetadata: string[] = [];
  let totalWeightKg = 0;

  const orderItems: Array<{
    name: string;
    sku: string;
    units: number;
    selling_price: number;
    discount: number;
    tax: number;
  }> = [];

  const items = Array.isArray(order.items) ? order.items : [];

  for (const item of items) {
    const itemWeightKg = parseVariantWeightKg(item.variantLabel);

    if (itemWeightKg === null || itemWeightKg <= 0) {
      missingMetadata.push(
        `Item "${item.productName}" (Packaging: "${item.variantLabel || 'Unspecified'}") lacks standard weight metadata.`
      );
    } else {
      totalWeightKg += itemWeightKg * (item.quantity || 1);
    }

    orderItems.push({
      name: item.productName,
      sku: item.sku || `SKU-${item.productId || 'GENERIC'}`,
      units: item.quantity,
      selling_price: item.price,
      discount: 0,
      tax: 0,
    });
  }

  // Shiprocket requires a minimum weight of 0.05 kg (50 grams)
  totalWeightKg = Math.max(0.05, Math.round(totalWeightKg * 1000) / 1000);

  // Package dimensions: use provided custom dimensions or safe default standard namkeen corrugated box
  // Standard artisanal namkeen shipping carton: 20cm x 15cm x 10cm
  const dimensions = customDimensions && customDimensions.length > 0 && customDimensions.breadth > 0 && customDimensions.height > 0
    ? customDimensions
    : { length: 20, breadth: 15, height: 10 };

  const valid = missingMetadata.length === 0;

  return {
    valid,
    totalWeightKg,
    dimensions,
    missingMetadata,
    orderItems,
  };
}

/**
 * Creates an ad-hoc shipment order in Shiprocket.
 * Prevents duplicate shipment creation if shipmentId or orderId is already present on the order.
 */
export async function createShiprocketOrder(
  order: IOrder,
  options?: {
    customDimensions?: { length: number; breadth: number; height: number };
  }
): Promise<ShiprocketServiceResult<ShiprocketCreateOrderResponse>> {
  // Prevent duplicate shipment creation
  if (order.shiprocketDetails?.shipmentId || order.shiprocketDetails?.orderId) {
    return {
      success: false,
      error: `Shipment already exists for Order #${order.orderNumber} (Shiprocket Shipment ID: ${order.shiprocketDetails.shipmentId || order.shiprocketDetails.orderId}).`,
      statusCode: 409,
    };
  }

  if (order.orderStatus === 'cancelled') {
    return {
      success: false,
      error: `Cannot create shipment for cancelled Order #${order.orderNumber}.`,
      statusCode: 400,
    };
  }

  // Validate package dimensions & weight from server data
  const packageInfo = validateAndCalculateShipmentPackage(order, options?.customDimensions);
  if (!packageInfo.valid) {
    return {
      success: false,
      error: `Cannot create shipment due to missing product packaging metadata: ${packageInfo.missingMetadata.join('; ')}`,
      statusCode: 422,
    };
  }

  const shippingAddr = order.shippingAddress;
  if (
    !shippingAddr ||
    !shippingAddr.name ||
    !shippingAddr.addressLine1 ||
    !shippingAddr.city ||
    !shippingAddr.state ||
    !shippingAddr.pincode ||
    !shippingAddr.phone
  ) {
    return {
      success: false,
      error: 'Order has incomplete shipping address information.',
      statusCode: 400,
    };
  }

  const config = getShiprocketConfig();

  // If mock client is injected, route through it
  if (_testClient?.orders) {
    try {
      const mockRes = await _testClient.orders.create({
        order_id: order.orderNumber,
        weight: packageInfo.totalWeightKg,
      });
      return { success: true, data: mockRes };
    } catch (testErr: unknown) {
      const errMsg = testErr instanceof Error ? testErr.message : String(testErr);
      return { success: false, error: errMsg, statusCode: 500 };
    }
  }

  // Obtain auth token
  const authRes = await getShiprocketAuthToken();
  if (!authRes.success || !authRes.data) {
    return {
      success: false,
      error: authRes.error || 'Failed to authenticate with Shiprocket.',
      statusCode: authRes.statusCode || 503,
    };
  }

  const token = authRes.data;

  // Format order date YYYY-MM-DD HH:MM
  const dateObj = order.createdAt ? new Date(order.createdAt) : new Date();
  const formattedDate = dateObj.toISOString().slice(0, 16).replace('T', ' ');

  const isCOD = order.paymentMethod === 'cod';

  const payload = {
    order_id: order.orderNumber,
    order_date: formattedDate,
    pickup_location: config.pickupLocation,
    channel_id: '',
    comment: order.notes || 'Handle with care — Authentic Indian Savouries',
    billing_customer_name: shippingAddr.name,
    billing_last_name: '',
    billing_address: shippingAddr.addressLine1,
    billing_address_2: shippingAddr.addressLine2 || shippingAddr.landmark || '',
    billing_city: shippingAddr.city,
    billing_pincode: shippingAddr.pincode,
    billing_state: shippingAddr.state,
    billing_country: 'India',
    billing_email: order.customerInfo?.email || 'orders@malwanamkeen.com',
    billing_phone: shippingAddr.phone,
    shipping_is_billing: true,
    order_items: packageInfo.orderItems,
    payment_method: isCOD ? 'COD' : 'Prepaid',
    shipping_charges: order.shipping || 0,
    total_discount: order.discount || 0,
    sub_total: order.subtotal,
    length: packageInfo.dimensions.length,
    breadth: packageInfo.dimensions.breadth,
    height: packageInfo.dimensions.height,
    weight: packageInfo.totalWeightKg,
  };

  try {
    const res = await fetch(`${SHIPROCKET_BASE_URL}/orders/create/adhoc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12000),
    });

    const data = await res.json();

    if (!res.ok || (data.status_code && data.status_code !== 1 && !data.shipment_id)) {
      const errorMsg = data.message || data.error || 'Shiprocket order creation failed.';
      console.error('[Shiprocket Order Creation Failed]:', errorMsg, data);
      return {
        success: false,
        error: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg),
        statusCode: res.status || 400,
      };
    }

    return {
      success: true,
      data: {
        order_id: data.order_id,
        shipment_id: data.shipment_id,
        status: data.status || 'NEW',
        status_code: data.status_code || 1,
        onboarding_completed_now: data.onboarding_completed_now,
        awb_code: data.awb_code,
        courier_company_id: data.courier_company_id,
        courier_name: data.courier_name,
      },
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[Shiprocket Network Error]:', errMsg);
    return {
      success: false,
      error: 'Shiprocket API request timed out or was interrupted.',
      statusCode: 502,
    };
  }
}

/**
 * Assigns an AWB and courier partner to a Shiprocket shipment.
 */
export async function assignShiprocketAWB(
  shipmentId: number,
  courierId?: number
): Promise<ShiprocketServiceResult<ShiprocketAWBResponse>> {
  if (!shipmentId || shipmentId <= 0) {
    return {
      success: false,
      error: 'Valid shipment ID is required.',
      statusCode: 400,
    };
  }

  // If mock client is injected, route through it
  if (_testClient?.courier) {
    try {
      const mockRes = await _testClient.courier.assignAWB(shipmentId, courierId);
      return { success: true, data: mockRes };
    } catch (testErr: unknown) {
      const errMsg = testErr instanceof Error ? testErr.message : String(testErr);
      return { success: false, error: errMsg, statusCode: 500 };
    }
  }

  const authRes = await getShiprocketAuthToken();
  if (!authRes.success || !authRes.data) {
    return {
      success: false,
      error: authRes.error || 'Failed to authenticate with Shiprocket.',
      statusCode: authRes.statusCode || 503,
    };
  }

  const payload: any = { shipment_id: shipmentId };
  if (courierId) {
    payload.courier_id = courierId;
  }

  try {
    const res = await fetch(`${SHIPROCKET_BASE_URL}/courier/assign/awb`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authRes.data}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12000),
    });

    const data = await res.json();

    if (!res.ok || data.awb_assign_status !== 1) {
      const msg = data.message || data.response?.data?.error || 'Failed to generate AWB code with courier partner.';
      return {
        success: false,
        error: msg,
        statusCode: res.status || 400,
      };
    }

    return {
      success: true,
      data: data as ShiprocketAWBResponse,
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

/**
 * Fetches live courier tracking activities from Shiprocket by AWB.
 */
export async function trackShipmentByAWB(
  awbCode: string
): Promise<ShiprocketServiceResult<ShiprocketTrackingResponse>> {
  if (!awbCode || typeof awbCode !== 'string' || !awbCode.trim()) {
    return {
      success: false,
      error: 'Valid AWB tracking code is required.',
      statusCode: 400,
    };
  }

  // If mock client is injected, route through it
  if (_testClient?.courier) {
    try {
      const mockRes = await _testClient.courier.track(awbCode.trim());
      return { success: true, data: mockRes };
    } catch (testErr: unknown) {
      const errMsg = testErr instanceof Error ? testErr.message : String(testErr);
      return { success: false, error: errMsg, statusCode: 500 };
    }
  }

  const authRes = await getShiprocketAuthToken();
  if (!authRes.success || !authRes.data) {
    return {
      success: false,
      error: authRes.error || 'Failed to authenticate with Shiprocket.',
      statusCode: authRes.statusCode || 503,
    };
  }

  try {
    const res = await fetch(`${SHIPROCKET_BASE_URL}/courier/track/awb/${encodeURIComponent(awbCode.trim())}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authRes.data}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.message || 'Tracking query failed.',
        statusCode: res.status,
      };
    }

    return {
      success: true,
      data: data as ShiprocketTrackingResponse,
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

/**
 * Cryptographically verifies Shiprocket webhook authenticity using timing-safe comparison.
 * Shiprocket passes a custom header ('x-api-key', 'Authorization', or 'x-shiprocket-token')
 * configured in Webhook settings.
 *
 * Uses crypto.timingSafeEqual to prevent timing side-channel attacks on the secret comparison.
 */
export function verifyShiprocketWebhook(
  headers: Record<string, any>,
  expectedToken?: string
): boolean {
  const config = getShiprocketConfig();
  const token = (expectedToken || config.webhookToken || '').trim();

  // Reject if the server-side expected token is not configured
  if (!token) {
    return false;
  }

  const rawReceived =
    headers['x-api-key'] ||
    headers['http_x_api_key'] ||
    headers['authorization'] ||
    headers['x-shiprocket-token'];

  // Input validation: must be a non-empty string
  if (!rawReceived || typeof rawReceived !== 'string') {
    return false;
  }

  const cleanReceived = rawReceived.replace(/^Bearer\s+/i, '').trim();

  // Reject obviously-empty tokens before allocation
  if (!cleanReceived) {
    return false;
  }

  // Timing-safe comparison — allocate equal-length buffers to avoid length-leak
  const expectedBuf = Buffer.from(token, 'utf8');
  const receivedBuf = Buffer.from(cleanReceived, 'utf8');

  if (expectedBuf.length !== receivedBuf.length) {
    // Lengths differ — tokens cannot match, but still perform a dummy comparison
    // against itself to keep timing uniform relative to token presence checks.
    crypto.timingSafeEqual(expectedBuf, expectedBuf);
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}
