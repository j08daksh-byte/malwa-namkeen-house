import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  IndianRupee,
  Users,
  Package,
  AlertTriangle,
  MessageSquare,
  RefreshCw,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  Truck,
  Tag,
  Settings,
  Eye,
} from 'lucide-react';
import { Card, PageHeader, Spinner } from '../../components/admin/ui.tsx';

interface DashboardMetrics {
  totalRevenue: number;
  averageOrderValue: number;
  totalOrders: number;
  pendingOrders: number;
  totalCustomers: number;
  totalProducts: number;
  activeProducts: number;
  totalCategories: number;
  activeDiscounts: number;
  newInquiries: number;
}

interface RecentOrder {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  itemsCount: number;
  createdAt: string;
}

interface RecentCustomer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  active: boolean;
  createdAt: string;
}

interface RecentInquiry {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  category?: string;
  message: string;
  status: string;
  createdAt: string;
}

interface LowStockItem {
  productId: string;
  productName: string;
  variantLabel: string;
  sku: string;
  stock: number;
}

interface DashboardData {
  metrics: DashboardMetrics;
  statusBreakdown: Record<string, number>;
  lowStockItems: LowStockItem[];
  recentOrders: RecentOrder[];
  recentCustomers: RecentCustomer[];
  recentInquiries: RecentInquiry[];
  trends: Array<{ date: string; orders: number; revenue: number }>;
}

export default function AdminDashboard() {
  const [range, setRange] = useState('30d');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Token Helper
  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('malwa_admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // Fetch Dashboard Stats
  const fetchDashboardStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/dashboard/stats?range=${range}`, {
        headers: getAuthHeader(),
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to fetch analytics (${res.status})`);
      }

      const resData = await res.json();
      if (resData.success) {
        setData(resData);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading dashboard analytics.');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, range]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Order status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
      case 'confirmed':
        return { bg: '#E0E7FF', text: '#3730A3', border: '#C7D2FE' };
      case 'processing':
        return { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' };
      case 'shipped':
        return { bg: '#EDE9FE', text: '#6D28D9', border: '#DDD6FE' };
      case 'delivered':
        return { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' };
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' };
      default:
        return { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' };
    }
  };

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Top Header */}
      <PageHeader
        title="Admin Overview & Analytics"
        subtitle="Real-time order fulfillment, revenue analytics, customer registrations and stock alerts"
        action={
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={range}
              onChange={e => setRange(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                background: '#FFFFFF',
                fontSize: '13px',
                color: '#374151',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>

            <button
              onClick={fetchDashboardStats}
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
          </div>
        }
      />

      {/* Error Banner */}
      {error && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px 16px', borderRadius: '8px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {loading && !data ? (
        <div style={{ padding: '60px 0', display: 'grid', placeItems: 'center' }}>
          <Spinner />
          <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '12px' }}>Aggregating live store metrics...</div>
        </div>
      ) : data ? (
        <>
          {/* Top Key Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
            {/* Revenue */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.08em' }}>Paid Revenue</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                    ₹{data.metrics.totalRevenue.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                    Avg: <strong>₹{data.metrics.averageOrderValue}</strong> / order
                  </div>
                </div>
                <div style={{ background: '#D1FAE5', padding: '10px', borderRadius: '10px', color: '#059669' }}>
                  <IndianRupee size={22} />
                </div>
              </div>
            </Card>

            {/* Orders */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.08em' }}>Total Orders</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#3C0815', marginTop: '4px' }}>
                    {data.metrics.totalOrders}
                  </div>
                  <div style={{ fontSize: '12px', color: data.metrics.pendingOrders > 0 ? '#D97706' : '#059669', marginTop: '2px', fontWeight: 600 }}>
                    {data.metrics.pendingOrders} awaiting fulfillment
                  </div>
                </div>
                <div style={{ background: '#FAF6EF', padding: '10px', borderRadius: '10px', color: '#881337', border: '1px solid #EAE3D2' }}>
                  <ShoppingBag size={22} />
                </div>
              </div>
            </Card>

            {/* Products */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.08em' }}>Active Products</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#3C0815', marginTop: '4px' }}>
                    {data.metrics.activeProducts}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                    across <strong>{data.metrics.totalCategories}</strong> categories
                  </div>
                </div>
                <div style={{ background: '#F3F4F6', padding: '10px', borderRadius: '10px', color: '#4B5563' }}>
                  <Package size={22} />
                </div>
              </div>
            </Card>

            {/* Customers */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.08em' }}>Patrons / Users</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#3C0815', marginTop: '4px' }}>
                    {data.metrics.totalCustomers}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                    {data.metrics.newInquiries} new unread inquiries
                  </div>
                </div>
                <div style={{ background: '#EDE9FE', padding: '10px', borderRadius: '10px', color: '#6D28D9' }}>
                  <Users size={22} />
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Action Shortcuts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <Link
              to="/admin/products"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FFFFFF', border: '1px solid #EAE3D2', borderRadius: '10px', padding: '12px 16px', textDecoration: 'none', color: '#3C0815', fontWeight: 700, fontSize: '13px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
              <Plus size={16} color="#881337" />
              <span>Add Product</span>
            </Link>

            <Link
              to="/admin/orders"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FFFFFF', border: '1px solid #EAE3D2', borderRadius: '10px', padding: '12px 16px', textDecoration: 'none', color: '#3C0815', fontWeight: 700, fontSize: '13px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
              <Truck size={16} color="#881337" />
              <span>Fulfill Orders</span>
            </Link>

            <Link
              to="/admin/discounts"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FFFFFF', border: '1px solid #EAE3D2', borderRadius: '10px', padding: '12px 16px', textDecoration: 'none', color: '#3C0815', fontWeight: 700, fontSize: '13px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
              <Tag size={16} color="#881337" />
              <span>Create Coupon</span>
            </Link>

            <Link
              to="/admin/inquiries"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FFFFFF', border: '1px solid #EAE3D2', borderRadius: '10px', padding: '12px 16px', textDecoration: 'none', color: '#3C0815', fontWeight: 700, fontSize: '13px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
              <MessageSquare size={16} color="#881337" />
              <span>View Inquiries ({data.metrics.newInquiries})</span>
            </Link>

            <Link
              to="/admin/settings"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FFFFFF', border: '1px solid #EAE3D2', borderRadius: '10px', padding: '12px 16px', textDecoration: 'none', color: '#3C0815', fontWeight: 700, fontSize: '13px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
              <Settings size={16} color="#881337" />
              <span>Store Settings</span>
            </Link>
          </div>

          {/* Order Status Breakdown Bar */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#881337', letterSpacing: '0.06em' }}>
                Order Lifecycle Distribution
              </div>
              <Link to="/admin/orders" style={{ fontSize: '12px', color: '#881337', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Manage All Orders <ArrowRight size={13} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              {Object.entries(data.statusBreakdown).map(([st, count]) => {
                const badge = getStatusBadge(st);
                return (
                  <div key={st} style={{ background: badge.bg, border: `1px solid ${badge.border}`, padding: '12px 14px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: badge.text, letterSpacing: '0.05em' }}>
                      {st}
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: badge.text, marginTop: '2px' }}>
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Two Columns: Recent Orders & Low Stock Alerts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
            {/* Column 1: Recent Orders */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#881337', letterSpacing: '0.06em' }}>
                  Recent Orders
                </div>
                <Link to="/admin/orders" style={{ fontSize: '12px', color: '#881337', fontWeight: 700, textDecoration: 'none' }}>
                  View All →
                </Link>
              </div>

              {data.recentOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 12px', color: '#9CA3AF', fontSize: '13px' }}>
                  No orders recorded yet.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {data.recentOrders.map(o => {
                    const badge = getStatusBadge(o.orderStatus);
                    return (
                      <div key={o._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#FAF9F6', borderRadius: '8px', border: '1px solid #F3F4F6' }}>
                        <div>
                          <div style={{ fontWeight: 800, color: '#3C0815', fontSize: '13px' }}>
                            {o.orderNumber}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '1px' }}>
                            {o.customerName} · {o.itemsCount} item(s)
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, color: '#1A0A0F', fontSize: '13.5px' }}>
                            ₹{o.total}
                          </div>
                          <span style={{ display: 'inline-block', background: badge.bg, color: badge.text, fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase', marginTop: '2px' }}>
                            {o.orderStatus}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Column 2: Low-Stock Inventory Alerts */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#991B1B', letterSpacing: '0.06em' }}>
                  <AlertTriangle size={15} color="#DC2626" />
                  <span>Low Stock Inventory Alerts</span>
                </div>
                <Link to="/admin/products" style={{ fontSize: '12px', color: '#881337', fontWeight: 700, textDecoration: 'none' }}>
                  Inventory →
                </Link>
              </div>

              {data.lowStockItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 12px', color: '#059669', fontSize: '13px', fontWeight: 600 }}>
                  <CheckCircle2 size={24} style={{ margin: '0 auto 6px' }} />
                  All inventory variant stock levels are healthy!
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {data.lowStockItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#FEF2F2', borderRadius: '8px', border: '1px solid #FEE2E2' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#3C0815', fontSize: '13px' }}>
                          {item.productName}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#6B7280', marginTop: '1px' }}>
                          Variant: <strong>{item.variantLabel}</strong> · SKU: {item.sku}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ background: item.stock <= 5 ? '#EF4444' : '#F59E0B', color: '#FFFFFF', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '999px' }}>
                          {item.stock} left
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Bottom Row: Recent Customers & Recent Inquiries */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
            {/* Recent Customers */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#881337', letterSpacing: '0.06em' }}>
                  Recent Registered Patrons
                </div>
                <Link to="/admin/customers" style={{ fontSize: '12px', color: '#881337', fontWeight: 700, textDecoration: 'none' }}>
                  Directory →
                </Link>
              </div>

              {data.recentCustomers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 12px', color: '#9CA3AF', fontSize: '13px' }}>
                  No customer accounts registered yet.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {data.recentCustomers.map(c => (
                    <div key={c._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#FAF9F6', borderRadius: '6px', border: '1px solid #F3F4F6', fontSize: '12.5px' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#1A0A0F' }}>{c.name}</div>
                        <div style={{ fontSize: '11.5px', color: '#6B7280' }}>{c.email}</div>
                      </div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                        {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Recent Inquiries */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#881337', letterSpacing: '0.06em' }}>
                  Recent Inquiries & Bulk Leads
                </div>
                <Link to="/admin/inquiries" style={{ fontSize: '12px', color: '#881337', fontWeight: 700, textDecoration: 'none' }}>
                  Inquiries →
                </Link>
              </div>

              {data.recentInquiries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 12px', color: '#9CA3AF', fontSize: '13px' }}>
                  No customer inquiries received yet.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {data.recentInquiries.map(inq => (
                    <div key={inq._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#FAF9F6', borderRadius: '6px', border: '1px solid #F3F4F6', fontSize: '12.5px' }}>
                      <div style={{ maxWidth: '70%' }}>
                        <div style={{ fontWeight: 700, color: '#1A0A0F' }}>{inq.name} ({inq.category || 'General'})</div>
                        <div style={{ fontSize: '11.5px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {inq.message}
                        </div>
                      </div>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: inq.status === 'new' ? '#FEF3C7' : '#E0F2FE', color: inq.status === 'new' ? '#92400E' : '#0369A1', textTransform: 'uppercase' }}>
                        {inq.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
