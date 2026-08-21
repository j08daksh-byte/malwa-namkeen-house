import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  RefreshCw,
  X,
  CheckCircle2,
  Clock,
  Truck,
  CreditCard,
  User,
  MapPin,
  FileText,
  AlertCircle,
  ExternalLink,
  Phone,
  Mail,
  ChevronRight,
  Package,
} from 'lucide-react';
import { Card, PageHeader, Spinner } from '../../components/admin/ui.tsx';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type ShipmentStatus = 'unfulfilled' | 'ready_to_ship' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'returned';

interface OrderItemSnapshot {
  productId?: string;
  productName: string;
  variantLabel: string;
  sku: string;
  price: number;
  quantity: number;
  itemTotal: number;
  image?: string;
}

interface ShippingAddress {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

interface OrderRecord {
  _id: string;
  orderNumber: string;
  customer?: { _id: string; name: string; email: string; phone?: string };
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  items: OrderItemSnapshot[];
  subtotal: number;
  discount: number;
  discountCode?: string;
  shipping: number;
  total: number;
  shippingAddress: ShippingAddress;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: 'cod' | 'online' | 'upi' | 'card';
  paymentDetails?: {
    transactionId?: string;
    gateway?: string;
    paidAt?: string;
  };
  shipmentStatus: ShipmentStatus;
  trackingInfo?: {
    courierName?: string;
    trackingNumber?: string;
    trackingUrl?: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
}

export default function AdminOrders() {
  const [orders, setProductsOrders] = useState<OrderRecord[]>([]);
  const [stats, setStats] = useState<OrderStats>({ totalRevenue: 0, totalOrders: 0, pendingOrders: 0, deliveredOrders: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [shipmentStatusFilter, setShipmentStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Detail Modal / Drawer
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusSaveMsg, setStatusSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Editable fields in modal
  const [editOrderStatus, setEditOrderStatus] = useState<OrderStatus>('pending');
  const [editPaymentStatus, setEditPaymentStatus] = useState<PaymentStatus>('pending');
  const [editShipmentStatus, setEditShipmentStatus] = useState<ShipmentStatus>('unfulfilled');
  const [editCourierName, setEditCourierName] = useState('');
  const [editTrackingNumber, setEditTrackingNumber] = useState('');
  const [editTrackingUrl, setEditTrackingUrl] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Fetch Token Helper
  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('malwa_admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // Fetch Orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        search,
        orderStatus: orderStatusFilter,
        paymentStatus: paymentStatusFilter,
        shipmentStatus: shipmentStatusFilter,
        sortBy,
      });

      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        headers: getAuthHeader(),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Failed to fetch orders (${res.status})`);
      }

      const data = await res.json();
      if (data.success) {
        setProductsOrders(data.orders || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading orders.');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, search, orderStatusFilter, paymentStatusFilter, shipmentStatusFilter, sortBy]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Dialog scroll lock and Escape key
  useEffect(() => {
    if (selectedOrder) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !savingStatus) {
          setSelectedOrder(null);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [selectedOrder, savingStatus]);

  // Open Details Modal
  const openOrderDetails = (order: OrderRecord) => {
    setSelectedOrder(order);
    setEditOrderStatus(order.orderStatus);
    setEditPaymentStatus(order.paymentStatus);
    setEditShipmentStatus(order.shipmentStatus);
    setEditCourierName(order.trackingInfo?.courierName || '');
    setEditTrackingNumber(order.trackingInfo?.trackingNumber || '');
    setEditTrackingUrl(order.trackingInfo?.trackingUrl || '');
    setEditNotes(order.notes || '');
    setStatusSaveMsg(null);
  };

  // Save Order Status Update
  const handleSaveOrderUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setSavingStatus(true);
    setStatusSaveMsg(null);

    const payload = {
      orderStatus: editOrderStatus,
      paymentStatus: editPaymentStatus,
      shipmentStatus: editShipmentStatus,
      trackingInfo: {
        courierName: editCourierName.trim(),
        trackingNumber: editTrackingNumber.trim(),
        trackingUrl: editTrackingUrl.trim(),
      },
      notes: editNotes.trim(),
    };

    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update order.');
      }

      setStatusSaveMsg({ type: 'success', text: 'Order status & fulfillment details updated successfully.' });
      setSelectedOrder(data.order);
      fetchOrders();
    } catch (err: unknown) {
      setStatusSaveMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update order.' });
    } finally {
      setSavingStatus(false);
    }
  };

  // Badge Color Styles
  const getOrderStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case 'confirmed':
        return { bg: '#EBF4FF', text: '#1D4ED8', border: '#BFDBFE' };
      case 'processing':
        return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
      case 'shipped':
        return { bg: '#EDE9FE', text: '#6D28D9', border: '#DDD6FE' };
      case 'delivered':
        return { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' };
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' };
      default:
        return { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB' };
    }
  };

  const getPaymentStatusStyle = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return { bg: '#D1FAE5', text: '#065F46' };
      case 'failed':
        return { bg: '#FEE2E2', text: '#991B1B' };
      case 'refunded':
        return { bg: '#EDE9FE', text: '#5B21B6' };
      default:
        return { bg: '#FEF3C7', text: '#92400E' };
    }
  };

  return (
    <div style={{ display: 'grid', gap: '22px' }}>
      {/* Page Header */}
      <PageHeader
        title="Orders & Shipments"
        subtitle="Manage customer orders, historical items snapshots, fulfillment statuses & payments"
        action={
          <button
            onClick={fetchOrders}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '9px 14px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#374151',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Metrics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <Card>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.08em' }}>Total Orders</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#3C0815', marginTop: '6px' }}>{stats.totalOrders}</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>All-time customer checkouts</div>
        </Card>
        <Card>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.08em' }}>Total Revenue</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669', marginTop: '6px' }}>₹{stats.totalRevenue.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>From confirmed paid orders</div>
        </Card>
        <Card>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.08em' }}>Pending Fulfillment</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#D4AA45', marginTop: '6px' }}>{stats.pendingOrders}</div>
          <div style={{ fontSize: '12px', color: '#D4AA45', marginTop: '4px' }}>Awaiting packing / dispatch</div>
        </Card>
        <Card>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.08em' }}>Delivered</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#3C0815', marginTop: '6px' }}>{stats.deliveredOrders}</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Successfully fulfilled</div>
        </Card>
      </div>

      {/* Main Filter & Table Card */}
      <Card>
        {/* Filters Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F8F6F2', border: '1px solid #EAE3D2', padding: '8px 14px', borderRadius: '8px', flex: '1', minWidth: '240px', maxWidth: '380px' }}>
            <Search size={16} color="#9CA3AF" />
            <input
              placeholder="Search by Order #, Customer, Phone, City..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px', color: '#1A0A0F' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}>
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Order Status */}
            <select
              value={orderStatusFilter}
              onChange={e => setOrderStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '13px', color: '#374151', outline: 'none' }}
            >
              <option value="all">All Order Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Payment Status */}
            <select
              value={paymentStatusFilter}
              onChange={e => setPaymentStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '13px', color: '#374151', outline: 'none' }}
            >
              <option value="all">All Payments</option>
              <option value="pending">Payment Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '13px', color: '#374151', outline: 'none' }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="totalHigh">Total: High to Low</option>
              <option value="totalLow">Total: Low to High</option>
            </select>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Orders Table */}
        {loading ? (
          <div style={{ padding: '60px 0', display: 'grid', placeItems: 'center' }}>
            <Spinner />
            <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '12px' }}>Loading orders from MongoDB...</div>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed #E5E7EB', borderRadius: '12px', background: '#FAF9F6' }}>
            <ShoppingBag size={40} color="#D4AA45" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#3C0815' }}>No Orders Found</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>
              {search || orderStatusFilter !== 'all' || paymentStatusFilter !== 'all'
                ? 'Try adjusting your search filters.'
                : 'Customer ecommerce checkouts will automatically appear here.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #EAE5D9', color: '#6B7280', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <th style={{ padding: '12px 14px' }}>Order</th>
                  <th style={{ padding: '12px 14px' }}>Customer</th>
                  <th style={{ padding: '12px 14px' }}>Items Snapshot</th>
                  <th style={{ padding: '12px 14px' }}>Total Amount</th>
                  <th style={{ padding: '12px 14px' }}>Order Status</th>
                  <th style={{ padding: '12px 14px' }}>Payment</th>
                  <th style={{ padding: '12px 14px' }}>Shipment</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const oStatus = getOrderStatusStyle(order.orderStatus);
                  const pStatus = getPaymentStatusStyle(order.paymentStatus);
                  const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={order._id} style={{ borderBottom: '1px solid #F3F4F6', transition: 'background 0.15s' }}>
                      {/* Order Number & Date */}
                      <td style={{ padding: '14px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 800, color: '#3C0815', fontSize: '13.5px' }}>
                          #{order.orderNumber}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#9CA3AF', marginTop: '3px' }}>
                          {dateStr}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td style={{ padding: '14px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 700, color: '#1A0A0F' }}>{order.customerInfo.name}</div>
                        <div style={{ fontSize: '11.5px', color: '#6B7280' }}>{order.customerInfo.phone}</div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{order.shippingAddress.city}, {order.shippingAddress.state}</div>
                      </td>

                      {/* Items Snapshot Preview */}
                      <td style={{ padding: '14px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {order.items.slice(0, 2).map((item, i) => (
                            <div key={i} style={{ fontSize: '12px', color: '#374151' }}>
                              <span style={{ fontWeight: 600 }}>{item.quantity}x</span> {item.productName}{' '}
                              <span style={{ color: '#9CA3AF', fontSize: '11px' }}>({item.variantLabel})</span>
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <span style={{ fontSize: '11px', color: '#D4AA45', fontWeight: 600 }}>
                              +{order.items.length - 2} more item(s)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td style={{ padding: '14px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 800, color: '#3C0815', fontSize: '14px' }}>
                          ₹{order.total.toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase' }}>
                          {order.paymentMethod}
                        </div>
                      </td>

                      {/* Order Status */}
                      <td style={{ padding: '14px', verticalAlign: 'top' }}>
                        <span
                          style={{
                            background: oStatus.bg,
                            color: oStatus.text,
                            border: `1px solid ${oStatus.border}`,
                            padding: '3px 9px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            display: 'inline-block',
                          }}
                        >
                          {order.orderStatus}
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td style={{ padding: '14px', verticalAlign: 'top' }}>
                        <span
                          style={{
                            background: pStatus.bg,
                            color: pStatus.text,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            display: 'inline-block',
                          }}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>

                      {/* Shipment Status */}
                      <td style={{ padding: '14px', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563', textTransform: 'capitalize' }}>
                          {order.shipmentStatus.replace(/_/g, ' ')}
                        </div>
                        {order.trackingInfo?.trackingNumber && (
                          <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                            {order.trackingInfo.courierName}: {order.trackingInfo.trackingNumber}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px', verticalAlign: 'top', textAlign: 'right' }}>
                        <button
                          onClick={() => openOrderDetails(order)}
                          style={{
                            background: '#FAF6EF',
                            border: '1px solid #EAE3D2',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            color: '#3C0815',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Eye size={13} />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Order Details & Workflow Management Modal */}
      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 200, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '860px', width: '100%', margin: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', background: '#3C0815', color: '#FFF9EF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                    Order #{selectedOrder.orderNumber}
                  </h2>
                  <span style={{ background: '#F0C74E', color: '#3C0815', fontSize: '10.5px', fontWeight: 800, padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase' }}>
                    {selectedOrder.orderStatus}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,248,236,0.7)', marginTop: '4px' }}>
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                </div>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px', maxHeight: 'calc(85vh - 100px)', overflowY: 'auto', display: 'grid', gap: '22px' }}>
              {statusSaveMsg && (
                <div
                  style={{
                    background: statusSaveMsg.type === 'success' ? '#D1FAE5' : '#FEE2E2',
                    color: statusSaveMsg.type === 'success' ? '#065F46' : '#991B1B',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {statusSaveMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{statusSaveMsg.text}</span>
                </div>
              )}

              {/* 1. Customer & Shipping Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {/* Customer Card */}
                <div style={{ background: '#F8F6F2', border: '1px solid #EAE3D2', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#881337', marginBottom: '10px' }}>
                    <User size={14} /> Customer Information
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1A0A0F' }}>{selectedOrder.customerInfo.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#4B5563', marginTop: '4px' }}>
                    <Phone size={13} color="#9CA3AF" />
                    <span>{selectedOrder.customerInfo.phone}</span>
                    <a
                      href={`https://wa.me/${selectedOrder.customerInfo.phone.replace(/[^\d]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#059669', fontSize: '11.5px', fontWeight: 700, textDecoration: 'none', marginLeft: '6px' }}
                    >
                      WhatsApp ↗
                    </a>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#4B5563', marginTop: '3px' }}>
                    <Mail size={13} color="#9CA3AF" />
                    <span>{selectedOrder.customerInfo.email}</span>
                  </div>
                </div>

                {/* Shipping Address Card */}
                <div style={{ background: '#F8F6F2', border: '1px solid #EAE3D2', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#881337', marginBottom: '10px' }}>
                    <MapPin size={14} /> Delivery Address
                  </div>
                  <div style={{ fontSize: '13.5px', color: '#1A0A0F', lineHeight: 1.5 }}>
                    <div><strong>{selectedOrder.shippingAddress.name}</strong> ({selectedOrder.shippingAddress.phone})</div>
                    <div>{selectedOrder.shippingAddress.addressLine1}</div>
                    {selectedOrder.shippingAddress.addressLine2 && <div>{selectedOrder.shippingAddress.addressLine2}</div>}
                    <div>
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} – {selectedOrder.shippingAddress.pincode}
                    </div>
                    {selectedOrder.shippingAddress.landmark && (
                      <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                        Landmark: {selectedOrder.shippingAddress.landmark}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Ordered Items Snapshot (Historical price preserved) */}
              <div>
                <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#881337', letterSpacing: '0.06em' }}>
                  Purchased Items Snapshot ({selectedOrder.items.length})
                </h4>

                <div style={{ border: '1px solid #EAE5D9', borderRadius: '10px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#FAF6EF', borderBottom: '1px solid #EAE3D2', color: '#6B7280', fontSize: '11px', textTransform: 'uppercase' }}>
                        <th style={{ padding: '10px 14px' }}>Item</th>
                        <th style={{ padding: '10px 14px' }}>Packaging Variant</th>
                        <th style={{ padding: '10px 14px' }}>SKU</th>
                        <th style={{ padding: '10px 14px' }}>Price at Purchase</th>
                        <th style={{ padding: '10px 14px' }}>Qty</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1A0A0F' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Package size={16} color="#881337" />
                              <span>{item.productName}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#3C0815', fontWeight: 600 }}>
                            {item.variantLabel}
                          </td>
                          <td style={{ padding: '12px 14px', color: '#6B7280', fontFamily: 'monospace', fontSize: '11.5px' }}>
                            {item.sku || '—'}
                          </td>
                          <td style={{ padding: '12px 14px', color: '#4B5563' }}>
                            ₹{item.price.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '12px 14px', color: '#1A0A0F', fontWeight: 600 }}>
                            {item.quantity}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#3C0815' }}>
                            ₹{item.itemTotal.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Summary Totals */}
                  <div style={{ background: '#FAF6EF', padding: '14px 20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', borderTop: '1px solid #EAE3D2' }}>
                    <div style={{ fontSize: '13px', color: '#4B5563', display: 'flex', justifyContent: 'space-between', width: '220px' }}>
                      <span>Subtotal:</span>
                      <span>₹{selectedOrder.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div style={{ fontSize: '13px', color: '#059669', display: 'flex', justifyContent: 'space-between', width: '220px' }}>
                        <span>Discount ({selectedOrder.discountCode || 'Promo'}):</span>
                        <span>-₹{selectedOrder.discount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div style={{ fontSize: '13px', color: '#4B5563', display: 'flex', justifyContent: 'space-between', width: '220px' }}>
                      <span>Shipping:</span>
                      <span>{selectedOrder.shipping === 0 ? 'FREE' : `₹${selectedOrder.shipping}`}</span>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#3C0815', display: 'flex', justifyContent: 'space-between', width: '220px', paddingTop: '6px', borderTop: '1px solid #EAE3D2' }}>
                      <span>Grand Total:</span>
                      <span>₹{selectedOrder.total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Order Workflow Status Updater Form */}
              <form onSubmit={handleSaveOrderUpdate} style={{ background: '#F8F6F2', border: '1px solid #EAE3D2', borderRadius: '12px', padding: '20px', display: 'grid', gap: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#881337', borderBottom: '1px solid #EAE3D2', paddingBottom: '6px' }}>
                  Update Fulfillment & Payment Status
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  {/* Order Status */}
                  <div>
                    <label style={labelStyle}>Order Lifecycle Status</label>
                    <select
                      value={editOrderStatus}
                      onChange={e => setEditOrderStatus(e.target.value as OrderStatus)}
                      style={inputStyle}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing (Packing)</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Payment Status */}
                  <div>
                    <label style={labelStyle}>Payment Status</label>
                    <select
                      value={editPaymentStatus}
                      onChange={e => setEditPaymentStatus(e.target.value as PaymentStatus)}
                      style={inputStyle}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>

                  {/* Shipment Status */}
                  <div>
                    <label style={labelStyle}>Shipment Status</label>
                    <select
                      value={editShipmentStatus}
                      onChange={e => setEditShipmentStatus(e.target.value as ShipmentStatus)}
                      style={inputStyle}
                    >
                      <option value="unfulfilled">Unfulfilled</option>
                      <option value="ready_to_ship">Ready to Ship</option>
                      <option value="in_transit">In Transit</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="returned">Returned</option>
                    </select>
                  </div>
                </div>

                {/* Tracking Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Courier Partner</label>
                    <input
                      value={editCourierName}
                      onChange={e => setEditCourierName(e.target.value)}
                      placeholder="e.g. BlueDart, DTDC, Delhivery"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Tracking Number / AWB</label>
                    <input
                      value={editTrackingNumber}
                      onChange={e => setEditTrackingNumber(e.target.value)}
                      placeholder="e.g. 748392019"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Tracking Link / URL</label>
                    <input
                      value={editTrackingUrl}
                      onChange={e => setEditTrackingUrl(e.target.value)}
                      placeholder="https://track.courier.com/..."
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Internal Admin Notes</label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    placeholder="Notes on customer instructions, special packaging, etc."
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
                  <button
                    type="submit"
                    disabled={savingStatus}
                    style={{
                      background: '#3C0815',
                      color: '#FFF9EF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 22px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: savingStatus ? 'wait' : 'pointer',
                      boxShadow: '0 2px 6px rgba(60,8,21,0.25)',
                    }}
                  >
                    {savingStatus ? 'Saving Status…' : 'Update Order Status'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 700,
  color: '#374151',
  marginBottom: '5px',
  letterSpacing: '0.02em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '9px 12px',
  borderRadius: '8px',
  border: '1.5px solid #E5E7EB',
  fontSize: '13.5px',
  color: '#111827',
  outline: 'none',
  background: '#FFFFFF',
  fontFamily: 'inherit',
};
