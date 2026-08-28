import React, { useState, useEffect, useCallback } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Search,
  Edit2,
  Trash2,
  UploadCloud,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Crop,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Card, PageHeader, Spinner } from '../../components/admin/ui.tsx';
import ImageCropperModal from '../../components/admin/ImageCropperModal.tsx';

export interface BannerItem {
  _id: string;
  title: string;
  alt?: string;
  image: string;
  mobileImage?: string;
  link: string;
  badge?: string;
  active: boolean;
  sortOrder: number;
  createdAt?: string;
}

export default function AdminBanners() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'sortOrder' | 'newest' | 'title'>('sortOrder');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [deleteConfirmBanner, setDeleteConfirmBanner] = useState<BannerItem | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Cropper Modal state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperInitialSrc, setCropperInitialSrc] = useState<string>('');

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formAlt, setFormAlt] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formLink, setFormLink] = useState('/shop');
  const [formBadge, setFormBadge] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formSortOrder, setFormSortOrder] = useState<number | ''>(0);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Auth Header Helper
  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('malwa_admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // Fetch Banners
  const fetchBanners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        sortBy,
      });

      const res = await fetch(`/api/admin/banners?${params.toString()}`, {
        headers: getAuthHeader(),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Failed to fetch banners (${res.status})`);
      }

      const data = await res.json();
      if (data.success) {
        setBanners(data.banners || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading banners.');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, search, statusFilter, sortBy]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Open Create Modal
  const openCreateModal = () => {
    setEditingBanner(null);
    setFormTitle('');
    setFormAlt('');
    setFormImage('');
    setFormLink('/shop');
    setFormBadge('');
    setFormActive(true);
    setFormSortOrder(banners.length);
    setImageUrlInput('');
    setFormError(null);
    setModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (banner: BannerItem) => {
    setEditingBanner(banner);
    setFormTitle(banner.title);
    setFormAlt(banner.alt || '');
    setFormImage(banner.image);
    setFormLink(banner.link || '/shop');
    setFormBadge(banner.badge || '');
    setFormActive(banner.active);
    setFormSortOrder(banner.sortOrder);
    setImageUrlInput(banner.image);
    setFormError(null);
    setModalOpen(true);
  };

  // Handle Form Submit (Create or Update)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Banner title is required.');
      return;
    }
    if (!formImage.trim()) {
      setFormError('Please select or upload a banner image.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        title: formTitle.trim(),
        alt: formAlt.trim() || formTitle.trim(),
        image: formImage.trim(),
        link: formLink.trim() || '/shop',
        badge: formBadge.trim(),
        active: formActive,
        sortOrder: typeof formSortOrder === 'number' ? formSortOrder : 0,
      };

      const url = editingBanner ? `/api/admin/banners/${editingBanner._id}` : '/api/admin/banners';
      const method = editingBanner ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save banner.');
      }

      showToast(editingBanner ? 'Banner updated successfully!' : 'Banner created successfully!');
      setModalOpen(false);
      fetchBanners();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error saving banner.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle Banner Active Status
  const handleToggleActive = async (banner: BannerItem) => {
    try {
      const res = await fetch(`/api/admin/banners/${banner._id}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to toggle status.');
      }

      setBanners(prev =>
        prev.map(b => (b._id === banner._id ? { ...b, active: data.active } : b))
      );
      showToast(`Banner is now ${data.active ? 'Visible on Store' : 'Hidden from Store'}.`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to toggle status.');
    }
  };

  // Reorder Banners (Move Up / Move Down)
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const newBanners = [...banners];
    const temp = newBanners[index];
    newBanners[index] = newBanners[targetIndex];
    newBanners[targetIndex] = temp;

    setBanners(newBanners);

    try {
      const orderedIds = newBanners.map(b => b._id);
      const res = await fetch('/api/admin/banners/reorder', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        credentials: 'include',
        body: JSON.stringify({ orderedIds }),
      });

      if (!res.ok) {
        throw new Error('Reorder failed.');
      }
      showToast('Banner display order updated.');
    } catch {
      fetchBanners();
    }
  };

  // Delete Banner
  const handleDeleteBanner = async () => {
    if (!deleteConfirmBanner) return;

    try {
      const res = await fetch(`/api/admin/banners/${deleteConfirmBanner._id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete banner.');
      }

      showToast('Banner deleted successfully.');
      setDeleteConfirmBanner(null);
      fetchBanners();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete banner.');
    }
  };

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#2D0813',
            color: '#F0C74E',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 10000,
            fontSize: '13.5px',
            fontWeight: 600,
            border: '1px solid rgba(240,199,78,0.3)',
          }}
        >
          <CheckCircle2 size={18} color="#F0C74E" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Hero Banners"
        subtitle="Manage homepage carousel banners, upload and adjust banner images with locked 1024×385 aspect ratio, and configure click links."
        action={
          <button
            onClick={openCreateModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #55000A 0%, #7A0A17 100%)',
              color: '#FFF8EC',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(85,0,10,0.25)',
            }}
          >
            <Plus size={16} />
            <span>Add New Banner</span>
          </button>
        }
      />

      {/* Filters Bar */}
      <Card style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1', minWidth: '220px', maxWidth: '400px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#8A7A70',
              }}
            />
            <input
              type="text"
              placeholder="Search by title, alt text or link…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid #DCD5C5',
                fontSize: '13.5px',
                background: '#FAF8F4',
                color: '#331B1E',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Status & Sorting */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: '#66554D', fontWeight: 600 }}>Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                style={{
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: '1px solid #DCD5C5',
                  fontSize: '13px',
                  background: '#FFFFFF',
                  color: '#331B1E',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All Banners</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: '#66554D', fontWeight: 600 }}>Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                style={{
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: '1px solid #DCD5C5',
                  fontSize: '13px',
                  background: '#FFFFFF',
                  color: '#331B1E',
                  cursor: 'pointer',
                }}
              >
                <option value="sortOrder">Display Order</option>
                <option value="newest">Recently Added</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>

            <button
              onClick={fetchBanners}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 12px',
                borderRadius: '6px',
                border: '1px solid #DCD5C5',
                background: '#FFFFFF',
                color: '#55000A',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Refresh banners"
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Banners List / Grid */}
      {loading ? (
        <Card style={{ padding: '60px', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '12px', color: '#7A6E65', fontSize: '14px' }}>Loading hero banners…</p>
        </Card>
      ) : error ? (
        <Card style={{ padding: '32px', textAlign: 'center', background: '#FFF5F5', border: '1px solid #FED7D7' }}>
          <AlertCircle size={28} color="#C53030" style={{ margin: '0 auto 8px' }} />
          <p style={{ color: '#C53030', fontWeight: 700, margin: 0 }}>{error}</p>
          <button
            onClick={fetchBanners}
            style={{
              marginTop: '12px',
              padding: '6px 14px',
              borderRadius: '6px',
              background: '#C53030',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </Card>
      ) : banners.length === 0 ? (
        <Card style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#F8F3EA',
              color: '#55000A',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px',
            }}
          >
            <ImageIcon size={28} />
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 800, color: '#331B1E' }}>
            No Hero Banners Found
          </h3>
          <p style={{ margin: '0 0 20px', color: '#7A6E65', fontSize: '13.5px' }}>
            Upload your first hero banner to showcase announcements, heritage products, or special offers.
          </p>
          <button
            onClick={openCreateModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#55000A',
              color: '#FFF8EC',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Plus size={16} />
            <span>Add Banner</span>
          </button>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {banners.map((banner, index) => (
            <Card
              key={banner._id}
              style={{
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                flexWrap: 'wrap',
                borderLeft: banner.active ? '4px solid #16A34A' : '4px solid #9CA3AF',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              {/* Order index and move controls */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  onClick={() => handleMoveOrder(index, 'up')}
                  disabled={index === 0}
                  style={{
                    background: '#FAF6EE',
                    border: '1px solid #E2D9C8',
                    borderRadius: '4px',
                    padding: '3px 6px',
                    color: index === 0 ? '#C4BAA9' : '#55000A',
                    cursor: index === 0 ? 'not-allowed' : 'pointer',
                  }}
                  title="Move Up"
                >
                  <ArrowUp size={14} />
                </button>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#8A7A70' }}>
                  #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleMoveOrder(index, 'down')}
                  disabled={index === banners.length - 1}
                  style={{
                    background: '#FAF6EE',
                    border: '1px solid #E2D9C8',
                    borderRadius: '4px',
                    padding: '3px 6px',
                    color: index === banners.length - 1 ? '#C4BAA9' : '#55000A',
                    cursor: index === banners.length - 1 ? 'not-allowed' : 'pointer',
                  }}
                  title="Move Down"
                >
                  <ArrowDown size={14} />
                </button>
              </div>

              {/* Banner Visual Thumbnail (Locked to 1024:385 ratio) */}
              <div
                style={{
                  width: '240px',
                  aspectRatio: '1024 / 385',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#FAF6F0',
                  border: '1px solid #E2DACB',
                  flexShrink: 0,
                  position: 'relative',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                <img
                  src={banner.image}
                  alt={banner.alt || banner.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                  }}
                />
              </div>

              {/* Banner Info */}
              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: '15px',
                      fontWeight: 800,
                      color: '#2D0813',
                    }}
                  >
                    {banner.title}
                  </h4>

                  {banner.active ? (
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '999px',
                        background: '#DCFCE7',
                        color: '#166534',
                      }}
                    >
                      Active
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '999px',
                        background: '#F3F4F6',
                        color: '#6B7280',
                      }}
                    >
                      Hidden
                    </span>
                  )}
                </div>

                {banner.alt && (
                  <p
                    style={{
                      margin: '0 0 6px',
                      fontSize: '12px',
                      color: '#7A6E65',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '500px',
                    }}
                  >
                    Alt: {banner.alt}
                  </p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      color: '#55000A',
                      fontWeight: 600,
                      background: '#FAF2DE',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    <span>Link:</span>
                    <code>{banner.link || '/shop'}</code>
                  </span>

                  <span style={{ fontSize: '11.5px', color: '#998B82' }}>
                    Aspect: 1024 × 385 (Hero Carousel)
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {/* Adjust Crop Shortcut */}
                <button
                  type="button"
                  onClick={() => {
                    setCropperInitialSrc(banner.image);
                    setCropperOpen(true);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: '#FAF6EE',
                    border: '1px solid #D4C9B8',
                    borderRadius: '6px',
                    padding: '7px 11px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#55000A',
                    cursor: 'pointer',
                  }}
                  title="Reframe Image"
                >
                  <Crop size={14} />
                  <span>Reframe</span>
                </button>

                {/* Toggle Active */}
                <button
                  type="button"
                  onClick={() => handleToggleActive(banner)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: banner.active ? '#F0FDF4' : '#F9FAFB',
                    border: banner.active ? '1px solid #BBF7D0' : '1px solid #E5E7EB',
                    borderRadius: '6px',
                    padding: '7px 11px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: banner.active ? '#166534' : '#6B7280',
                    cursor: 'pointer',
                  }}
                  title={banner.active ? 'Hide from storefront' : 'Make live on storefront'}
                >
                  {banner.active ? <Eye size={14} /> : <EyeOff size={14} />}
                  <span>{banner.active ? 'Live' : 'Hidden'}</span>
                </button>

                {/* Edit */}
                <button
                  type="button"
                  onClick={() => openEditModal(banner)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: '#FAF6EE',
                    border: '1px solid #D4C9B8',
                    borderRadius: '6px',
                    padding: '7px 11px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#3C0815',
                    cursor: 'pointer',
                  }}
                >
                  <Edit2 size={14} />
                  <span>Edit</span>
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => setDeleteConfirmBanner(banner)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: '#FFF1F2',
                    border: '1px solid #FECDD3',
                    borderRadius: '6px',
                    padding: '7px 11px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#BE123C',
                    cursor: 'pointer',
                  }}
                  title="Remove banner"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Banner Modal */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(20, 6, 10, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 9990,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
              overflow: 'hidden',
              border: '1px solid #E6DEC8',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #EAE5D9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#FAF8F4',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#55000A',
                    color: '#F0C74E',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <ImageIcon size={19} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#2D0813' }}>
                    {editingBanner ? 'Edit Hero Banner' : 'Create New Hero Banner'}
                  </h2>
                  <p style={{ margin: 0, fontSize: '12px', color: '#7A6E65' }}>
                    Configure the hero carousel visual slide, title, and target link.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={formSubmitting}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#8A7A70',
                  cursor: 'pointer',
                  padding: '6px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
                {formError && (
                  <div
                    style={{
                      marginBottom: '16px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: '#FEE2E2',
                      border: '1px solid #FCA5A5',
                      color: '#991B1B',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Banner Title */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#3C0815', marginBottom: '6px' }}>
                    Banner Title <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pure Malwa Heritage in Every Crunchy Bite"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #DCD5C5',
                      fontSize: '13.5px',
                      background: '#FFFFFF',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Alt Text */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#3C0815', marginBottom: '6px' }}>
                    Alt Text (Accessibility & SEO)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Artisanal Ratlami Sev and Sweets Banner"
                    value={formAlt}
                    onChange={e => setFormAlt(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #DCD5C5',
                      fontSize: '13.5px',
                      background: '#FFFFFF',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Click Link Destination */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#3C0815', marginBottom: '6px' }}>
                    Click Destination URL <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="/shop or /product/ratlami-sev"
                    value={formLink}
                    onChange={e => setFormLink(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #DCD5C5',
                      fontSize: '13.5px',
                      background: '#FFFFFF',
                      boxSizing: 'border-box',
                    }}
                  />
                  {/* Quick destination suggestion buttons */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {['/shop', '/about-us', '/contact', '/faq'].map(suggested => (
                      <button
                        key={suggested}
                        type="button"
                        onClick={() => setFormLink(suggested)}
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid #E2DACB',
                          background: formLink === suggested ? '#FAF0D7' : '#FAF8F4',
                          color: '#55000A',
                          cursor: 'pointer',
                        }}
                      >
                        {suggested}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Banner Image Framing & Upload Section */}
                <div
                  style={{
                    marginBottom: '20px',
                    padding: '16px',
                    borderRadius: '10px',
                    background: '#FAF7F0',
                    border: '1px solid #EAE3D4',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#3C0815' }}>
                        Banner Visual Image (Locked 1024 × 385) <span style={{ color: '#DC2626' }}>*</span>
                      </span>
                      <p style={{ margin: 0, fontSize: '11.5px', color: '#7A6E65' }}>
                        Crop and frame any portion of your image to fit the hero carousel perfectly.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCropperInitialSrc(formImage || imageUrlInput || '');
                        setCropperOpen(true);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        background: '#55000A',
                        color: '#FFF8EC',
                        border: 'none',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(85,0,10,0.2)',
                      }}
                    >
                      <Crop size={14} color="#F0C74E" />
                      <span>{formImage ? 'Re-Adjust Crop' : 'Upload & Frame Image'}</span>
                    </button>
                  </div>

                  {/* Image Preview Box */}
                  {formImage ? (
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '1024 / 385',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        position: 'relative',
                        background: '#1F1714',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                        border: '1px solid #DCD5C5',
                      }}
                    >
                      <img
                        src={formImage}
                        alt="Banner Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          right: '8px',
                          background: 'rgba(0,0,0,0.65)',
                          color: '#FFF8EC',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        1024 × 385 Framing Ready
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        setCropperInitialSrc('');
                        setCropperOpen(true);
                      }}
                      style={{
                        width: '100%',
                        aspectRatio: '1024 / 385',
                        borderRadius: '8px',
                        border: '2px dashed #D4AA45',
                        background: '#FFFDF9',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <UploadCloud size={28} color="#55000A" style={{ marginBottom: '6px' }} />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#55000A' }}>
                        Click to Choose & Adjust Image
                      </span>
                      <span style={{ fontSize: '11.5px', color: '#7A6E65' }}>
                        Locked to 1024 × 385 aspect ratio
                      </span>
                    </div>
                  )}

                  {/* Direct Image URL input fallback */}
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Or enter direct image URL (e.g. /hero-banner-1.png)"
                      value={imageUrlInput}
                      onChange={e => {
                        setImageUrlInput(e.target.value);
                        setFormImage(e.target.value);
                      }}
                      style={{
                        flex: 1,
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: '1px solid #DCD5C5',
                        fontSize: '12px',
                        background: '#FFFFFF',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (imageUrlInput) {
                          setCropperInitialSrc(imageUrlInput);
                          setCropperOpen(true);
                        }
                      }}
                      disabled={!imageUrlInput}
                      style={{
                        padding: '7px 12px',
                        borderRadius: '6px',
                        border: '1px solid #DCD5C5',
                        background: '#FFFFFF',
                        color: '#55000A',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: !imageUrlInput ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Crop URL Image
                    </button>
                  </div>
                </div>

                {/* Status and Order options */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#3C0815', marginBottom: '6px' }}>
                      Display Order Priority
                    </label>
                    <input
                      type="number"
                      value={formSortOrder}
                      onChange={e => setFormSortOrder(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #DCD5C5',
                        fontSize: '13.5px',
                        background: '#FFFFFF',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#3C0815', marginBottom: '6px' }}>
                      Storefront Status
                    </label>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        height: '40px',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formActive}
                        onChange={e => setFormActive(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#55000A', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: formActive ? '#166534' : '#6B7280' }}>
                        {formActive ? 'Active (Live on Hero)' : 'Draft / Hidden'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid #EAE5D9',
                  background: '#FAF8F4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '10px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={formSubmitting}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: '1px solid #D4C9B8',
                    background: '#FFFFFF',
                    color: '#55000A',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={formSubmitting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #55000A 0%, #7A0A17 100%)',
                    color: '#FFF8EC',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: formSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(85,0,10,0.25)',
                  }}
                >
                  {formSubmitting ? (
                    <>
                      <Spinner size="sm" />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <span>{editingBanner ? 'Update Banner' : 'Create Banner'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmBanner && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(20, 6, 10, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 9995,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '460px',
              padding: '24px',
              boxShadow: '0 20px 48px rgba(0,0,0,0.3)',
              border: '1px solid #EAE5D9',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#FEE2E2',
                color: '#DC2626',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 14px',
              }}
            >
              <Trash2 size={24} />
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 800, textAlign: 'center', color: '#2D0813' }}>
              Delete Hero Banner?
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#7A6E65', textAlign: 'center', lineHeight: 1.5 }}>
              Are you sure you want to remove <strong>&ldquo;{deleteConfirmBanner.title}&rdquo;</strong>? It will no longer appear on the live storefront carousel.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmBanner(null)}
                style={{
                  flex: 1,
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid #D4C9B8',
                  background: '#FFFFFF',
                  color: '#55000A',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteBanner}
                style={{
                  flex: 1,
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Delete Banner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      <ImageCropperModal
        isOpen={cropperOpen}
        onClose={() => setCropperOpen(false)}
        initialImageSrc={cropperInitialSrc}
        onCropComplete={uploadedUrl => {
          setFormImage(uploadedUrl);
          setImageUrlInput(uploadedUrl);
          showToast('Image cropped and saved at 1024×385 hero aspect ratio!');
        }}
      />
    </div>
  );
}
