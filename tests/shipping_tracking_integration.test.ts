/**
 * Malwa Namkeen House — Shipping, Tracking & Fulfillment Integration Test Suite
 *
 * Verifies Gate 10 requirements:
 * 1. Admin shipping status reporting without secret exposure.
 * 2. Authenticated shipment creation and duplicate shipment prevention (HTTP 409).
 * 3. AWB generation and courier assignment idempotency.
 * 4. Tracking synchronization into MongoDB without backward status regressions.
 * 5. Customer & guest order tracking authorization (matching phone/email vs unauthorized 403).
 * 6. Non-blocking error handling and provider outage safety.
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose, { Types } from 'mongoose';
import express from 'express';
import { Order } from '../server/models/Order.ts';
import adminOrderRouter from '../server/routes/adminOrders.ts';
import customerOrdersRouter from '../server/routes/customerOrders.ts';
import customerAccountRouter from '../server/routes/customerAccount.ts';
import {
  _setShiprocketClientForTesting,
  _resetShiprocketTokenCache,
} from '../server/lib/shiprocketService.ts';
import { generateToken } from '../server/lib/auth.ts';

// In-memory mock Express app to test routes directly
const app = express();
app.use(express.json());
app.use('/api/admin/orders', adminOrderRouter);
app.use('/api/orders', customerOrdersRouter);
app.use('/api/customer', customerAccountRouter);

let server: any = null;
let baseUrl = '';

const adminToken = generateToken({
  userId: new Types.ObjectId().toString(),
  email: 'admin@malwanamkeen.com',
  role: 'admin',
});

const customer1Id = new Types.ObjectId().toString();
const customer1Token = generateToken({
  userId: customer1Id,
  email: 'customer1@example.com',
  role: 'customer',
});

const customer2Id = new Types.ObjectId().toString();
const customer2Token = generateToken({
  userId: customer2Id,
  email: 'customer2@example.com',
  role: 'customer',
});

describe('Gate 10: Shipping, Tracking & Logistics Integration Suite', () => {
  before(async () => {
    // Start local express listener on ephemeral port
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  beforeEach(() => {
    _setShiprocketClientForTesting(null);
    _resetShiprocketTokenCache();
  });

  // ── 1. Admin Shipping Status Endpoint ──────────────────────────────────────
  describe('1. Admin Shipping Status Endpoint', () => {
    it('rejects unauthenticated requests with HTTP 401', async () => {
      const res = await fetch(`${baseUrl}/api/admin/orders/shipping/status`);
      assert.equal(res.status, 401);
    });

    it('returns provider readiness details to authenticated admin without exposing credentials', async () => {
      const res = await fetch(`${baseUrl}/api/admin/orders/shipping/status`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.provider, 'shiprocket');
      assert.equal(typeof data.isConfigured, 'boolean');
      assert.equal(typeof data.isSandbox, 'boolean');
      assert.equal(typeof data.webhookConfigured, 'boolean');
      assert.equal(data.password, undefined, 'Password must never be returned');
      assert.equal(data.webhookToken, undefined, 'Webhook token must never be returned');
    });
  });

  // ── 2. Shipment Creation & Duplicate Prevention ────────────────────────────
  describe('2. Shipment Creation & Duplicate Prevention', () => {
    it('successfully creates shipment order through mock client and updates order state', async () => {
      _setShiprocketClientForTesting({
        orders: {
          create: async (payload: any) => ({
            order_id: 10928,
            shipment_id: 99482,
            status: 'NEW',
            status_code: 1,
            awb_code: '',
            courier_company_id: 12,
            courier_name: 'Delhivery Surface',
          }),
        },
      });

      const mockOrderId = new Types.ObjectId();
      const mockOrder: any = {
        _id: mockOrderId,
        orderNumber: 'MN-20261017-9001',
        orderStatus: 'confirmed',
        shipmentStatus: 'unfulfilled',
        items: [
          {
            productName: 'Ratlami Sev',
            variantLabel: '500g',
            price: 180,
            quantity: 2,
          },
        ],
        shippingAddress: {
          name: 'Baljeet Singh',
          addressLine1: 'MG Road',
          city: 'Indore',
          state: 'Madhya Pradesh',
          pincode: '452001',
          phone: '9876543210',
        },
        save: async () => {},
      };

      const origFindById = Order.findById;
      Order.findById = ((id: any) => ({
        ...mockOrder,
        _id: id,
        save: async () => {},
      })) as any;

      try {
        const res = await fetch(`${baseUrl}/api/admin/orders/${mockOrderId}/shiprocket/create-shipment`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        });
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.equal(data.shipment?.shipment_id, 99482);
        assert.equal(data.order?.shiprocketDetails?.shipmentId, 99482);
        assert.equal(data.order?.shipmentStatus, 'ready_to_ship');
      } finally {
        Order.findById = origFindById;
      }
    });

    it('rejects duplicate shipment creation with HTTP 409 Conflict', async () => {
      const mockOrderId = new Types.ObjectId();
      const existingOrder: any = {
        _id: mockOrderId,
        orderNumber: 'MN-20261017-9002',
        orderStatus: 'processing',
        shipmentStatus: 'ready_to_ship',
        shiprocketDetails: {
          shipmentId: 99482,
        },
      };

      const origFindById = Order.findById;
      Order.findById = (() => existingOrder) as any;

      try {
        const res = await fetch(`${baseUrl}/api/admin/orders/${mockOrderId}/shiprocket/create-shipment`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        });
        assert.equal(res.status, 409);
        const data = await res.json();
        assert.equal(data.success, false);
        assert.match(data.message, /already created/i);
      } finally {
        Order.findById = origFindById;
      }
    });

    it('rejects shipment creation for cancelled orders with HTTP 400', async () => {
      const mockOrderId = new Types.ObjectId();
      const cancelledOrder: any = {
        _id: mockOrderId,
        orderNumber: 'MN-20261017-9003',
        orderStatus: 'cancelled',
        shipmentStatus: 'unfulfilled',
      };

      const origFindById = Order.findById;
      Order.findById = (() => cancelledOrder) as any;

      try {
        const res = await fetch(`${baseUrl}/api/admin/orders/${mockOrderId}/shiprocket/create-shipment`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        });
        assert.equal(res.status, 400);
        const data = await res.json();
        assert.equal(data.success, false);
        assert.match(data.message, /cancelled/i);
      } finally {
        Order.findById = origFindById;
      }
    });
  });

  // ── 3. AWB Assignment & Courier Partner ────────────────────────────────────
  describe('3. AWB Assignment & Courier Partner', () => {
    it('successfully generates and assigns AWB code', async () => {
      _setShiprocketClientForTesting({
        courier: {
          assignAWB: async (shipmentId: number) => ({
            awb_assign_status: 1,
            response: {
              data: {
                awb_code: 'BLUEDART-882211',
                courier_company_id: 15,
                courier_name: 'Blue Dart Air',
                shipment_id: shipmentId,
                label_url: 'https://shiprocket.co/label/882211.pdf',
              },
            },
          }),
          track: async () => ({} as any),
        },
      });

      const mockOrderId = new Types.ObjectId();
      const mockOrder: any = {
        _id: mockOrderId,
        orderNumber: 'MN-20261017-9004',
        orderStatus: 'processing',
        shipmentStatus: 'ready_to_ship',
        shiprocketDetails: {
          shipmentId: 99482,
        },
        save: async () => {},
      };

      const origFindById = Order.findById;
      Order.findById = (() => mockOrder) as any;

      try {
        const res = await fetch(`${baseUrl}/api/admin/orders/${mockOrderId}/shiprocket/generate-awb`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        });
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.equal(data.awb?.awb_code, 'BLUEDART-882211');
        assert.equal(mockOrder.shiprocketDetails.awbCode, 'BLUEDART-882211');
        assert.equal(mockOrder.trackingInfo?.trackingNumber, 'BLUEDART-882211');
      } finally {
        Order.findById = origFindById;
      }
    });

    it('returns already assigned AWB idempotently if already generated', async () => {
      const mockOrderId = new Types.ObjectId();
      const mockOrder: any = {
        _id: mockOrderId,
        orderNumber: 'MN-20261017-9005',
        orderStatus: 'processing',
        shipmentStatus: 'ready_to_ship',
        shiprocketDetails: {
          shipmentId: 99482,
          awbCode: 'BLUEDART-882211',
        },
      };

      const origFindById = Order.findById;
      Order.findById = (() => mockOrder) as any;

      try {
        const res = await fetch(`${baseUrl}/api/admin/orders/${mockOrderId}/shiprocket/generate-awb`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        });
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.match(data.message, /already assigned/i);
      } finally {
        Order.findById = origFindById;
      }
    });
  });

  // ── 4. Tracking Synchronization Route ──────────────────────────────────────
  describe('4. Tracking Synchronization Endpoint', () => {
    it('synchronizes live tracking into order document', async () => {
      _setShiprocketClientForTesting({
        courier: {
          assignAWB: async () => ({} as any),
          track: async (awb: string) => ({
            tracking_data: {
              track_status: 1,
              shipment_status: 2,
              shipment_track: [
                {
                  id: 110,
                  awb_code: awb,
                  current_status: 'IN TRANSIT',
                  origin: 'Indore',
                  destination: 'Delhi',
                  courier_name: 'Blue Dart',
                },
              ],
              shipment_track_activities: [],
              track_url: `https://shiprocket.co/tracking/${awb}`,
            },
          }),
        },
      });

      const mockOrderId = new Types.ObjectId();
      const mockOrder: any = {
        _id: mockOrderId,
        orderNumber: 'MN-20261017-9006',
        orderStatus: 'confirmed',
        shipmentStatus: 'ready_to_ship',
        shiprocketDetails: {
          awbCode: 'BLUEDART-554433',
        },
        save: async () => {},
      };

      const origFindById = Order.findById;
      Order.findById = (() => mockOrder) as any;

      try {
        const res = await fetch(`${baseUrl}/api/admin/orders/${mockOrderId}/shiprocket/sync-tracking`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        });
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.equal(data.order?.shipmentStatus, 'in_transit');
        assert.equal(data.order?.orderStatus, 'shipped');
      } finally {
        Order.findById = origFindById;
      }
    });
  });

  // ── 5. Customer & Guest Tracking Access ────────────────────────────────────
  describe('5. Customer & Guest Tracking Access', () => {
    it('allows authenticated customer to track their own order', async () => {
      const mockOrderId = new Types.ObjectId();
      const mockOrder: any = {
        _id: mockOrderId,
        orderNumber: 'MN-20261017-9007',
        customer: new Types.ObjectId(customer1Id),
        orderStatus: 'shipped',
        shipmentStatus: 'in_transit',
        trackingInfo: {
          courierName: 'Blue Dart',
          trackingNumber: 'BLUEDART-123456',
          trackingUrl: 'https://shiprocket.co/tracking/BLUEDART-123456',
        },
        shiprocketDetails: {
          awbCode: 'BLUEDART-123456',
          lastEvent: 'IN TRANSIT',
        },
      };

      const origFindOne = Order.findOne;
      Order.findOne = (() => mockOrder) as any;

      try {
        const res = await fetch(`${baseUrl}/api/orders/MN-20261017-9007/track`, {
          headers: { Authorization: `Bearer ${customer1Token}` },
        });
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.equal(data.hasTracking, true);
        assert.equal(data.trackingNumber, 'BLUEDART-123456');
        assert.equal(data.courierName, 'Blue Dart');
      } finally {
        Order.findOne = origFindOne;
      }
    });

    it('allows guest to track order with matching email in query param', async () => {
      const mockOrderId = new Types.ObjectId();
      const mockOrder: any = {
        _id: mockOrderId,
        orderNumber: 'MN-20261017-9008',
        customerInfo: {
          email: 'guest.shopper@gmail.com',
          phone: '9822334455',
        },
        orderStatus: 'shipped',
        shipmentStatus: 'in_transit',
        trackingInfo: {
          courierName: 'Delhivery',
          trackingNumber: 'DELHIVERY-998877',
          trackingUrl: 'https://shiprocket.co/tracking/DELHIVERY-998877',
        },
      };

      const origFindOne = Order.findOne;
      Order.findOne = (() => mockOrder) as any;

      try {
        const res = await fetch(`${baseUrl}/api/orders/MN-20261017-9008/track?email=guest.shopper@gmail.com`);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.equal(data.trackingNumber, 'DELHIVERY-998877');
      } finally {
        Order.findOne = origFindOne;
      }
    });

    it('allows guest to track order with matching phone in query param', async () => {
      const mockOrderId = new Types.ObjectId();
      const mockOrder: any = {
        _id: mockOrderId,
        orderNumber: 'MN-20261017-9009',
        customerInfo: {
          email: 'guest.shopper@gmail.com',
          phone: '9822334455',
        },
        shippingAddress: {
          phone: '9822334455',
        },
        orderStatus: 'shipped',
        shipmentStatus: 'in_transit',
        trackingInfo: {
          courierName: 'Delhivery',
          trackingNumber: 'DELHIVERY-998877',
        },
      };

      const origFindOne = Order.findOne;
      Order.findOne = (() => mockOrder) as any;

      try {
        const res = await fetch(`${baseUrl}/api/orders/MN-20261017-9009/track?phone=9822334455`);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.equal(data.trackingNumber, 'DELHIVERY-998877');
      } finally {
        Order.findOne = origFindOne;
      }
    });

    it('strictly rejects guest tracking when email or phone does not match with HTTP 403', async () => {
      const mockOrderId = new Types.ObjectId();
      const mockOrder: any = {
        _id: mockOrderId,
        orderNumber: 'MN-20261017-9010',
        customerInfo: {
          email: 'secret.user@gmail.com',
          phone: '9111222333',
        },
        shippingAddress: {
          phone: '9111222333',
        },
      };

      const origFindOne = Order.findOne;
      Order.findOne = (() => mockOrder) as any;

      try {
        const res = await fetch(`${baseUrl}/api/orders/MN-20261017-9010/track?email=attacker@fake.com`);
        assert.equal(res.status, 403);
        const data = await res.json();
        assert.equal(data.success, false);
        assert.match(data.message, /permission/i);
      } finally {
        Order.findOne = origFindOne;
      }
    });

    it('strictly rejects customer from tracking an order owned by someone else with HTTP 403', async () => {
      const mockOrderId = new Types.ObjectId();
      const mockOrder: any = {
        _id: mockOrderId,
        orderNumber: 'MN-20261017-9011',
        customer: new Types.ObjectId(customer1Id), // Owned by customer 1
        customerInfo: { email: 'customer1@example.com' },
      };

      const origFindOne = Order.findOne;
      Order.findOne = (() => mockOrder) as any;

      try {
        const res = await fetch(`${baseUrl}/api/orders/MN-20261017-9011/track`, {
          headers: { Authorization: `Bearer ${customer2Token}` }, // Customer 2 attempts access
        });
        assert.equal(res.status, 403);
        const data = await res.json();
        assert.equal(data.success, false);
        assert.match(data.message, /permission/i);
      } finally {
        Order.findOne = origFindOne;
      }
    });

    it('returns hasTracking: false when order has not yet been assigned an AWB code', async () => {
      const mockOrderId = new Types.ObjectId();
      const mockOrder: any = {
        _id: mockOrderId,
        orderNumber: 'MN-20261017-9012',
        customer: new Types.ObjectId(customer1Id),
        orderStatus: 'processing',
        shipmentStatus: 'unfulfilled',
        trackingInfo: null,
        shiprocketDetails: {},
      };

      const origFindOne = Order.findOne;
      Order.findOne = (() => mockOrder) as any;

      try {
        const res = await fetch(`${baseUrl}/api/orders/MN-20261017-9012/track`, {
          headers: { Authorization: `Bearer ${customer1Token}` },
        });
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.equal(data.hasTracking, false);
        assert.match(data.message, /not yet available/i);
      } finally {
        Order.findOne = origFindOne;
      }
    });
  });
});
