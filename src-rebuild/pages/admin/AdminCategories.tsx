import { useState, useEffect, useCallback } from 'react';
import {
  FolderTree,
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
  Package,
  ArrowUpDown,
} from 'lucide-react';
import { Card, PageHeader, Spinner } from '../../components/admin/ui.tsx';

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  active: boolean;
  sortOrder: number;
  productCount?: number;
  createdAt?: string;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'sortOrder' | 'name' | 'newest'>('sortOrder');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [deleteConfirmCategory, setDeleteConfirmCategory] = useState<CategoryItem | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formSortOrder, setFormSortOrder] = useState<number | ''>(0);
  const [formActive, setFormActive] = useState(true);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Fetch Token Helper
  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('malwa_admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        sortBy,
      });

      const res = await fetch(`/api/admin/categories?${params.toString()}`, {
        headers: getAuthHeader(),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Failed to fetch categories (${res.status})`);
      }

      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading categories.');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, search, statusFilter, sortBy]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Open Create Modal
  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setFormImage('');
    setFormSortOrder(categories.length);
    setFormActive(true);
    setFormError(null);
    setImageUrlInput('');
    setModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDescription(cat.description || '');
    setFormImage(cat.image || '');
    setFormSortOrder(cat.sortOrder ?? 0);
    setFormActive(Boolean(cat.active));
    setFormError(null);
    setImageUrlInput('');
    setModalOpen(true);
  };

  // Name change auto-slug generator (for create mode)
  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingCategory) {
      const autoSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormSlug(autoSlug);
    }
  };

  // Upload image to Cloudinary (malwa-namkeen-house/categories)
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setFormError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('target', 'categories');

      const res = await fetch('/api/admin/uploads', {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData,
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Image upload to Cloudinary failed.');
      }

      if (data.secureUrl) {
        setFormImage(data.secureUrl);
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Upload failed. Check Cloudinary connection.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Add Manual Image URL
  const addImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setFormImage(imageUrlInput.trim());
    setImageUrlInput('');
  };

  // Toggle Active Status
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/categories/${id}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        credentials: 'include',
      });
      if (res.ok) {
        setCategories(prev =>
          prev.map(c => (c._id === id ? { ...c, active: !currentStatus } : c))
        );
      }
    } catch {
      // Ignore
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || 'Cannot delete this category.');
        return;
      }

      setCategories(prev => prev.filter(c => c._id !== id));
      setDeleteConfirmCategory(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete category.');
    }
  };

  // Form Submit (Create / Edit)
  const handleSubmitCategoryForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Category Name is required.');
      return;
    }

    setFormSubmitting(true);

    const payload = {
      name: formName.trim(),
      slug: formSlug.trim() || undefined,
      description: formDescription.trim(),
      image: formImage.trim(),
      sortOrder: formSortOrder !== '' ? Number(formSortOrder) : 0,
      active: formActive,
    };

    try {
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory._id}`
        : '/api/admin/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save category.');
      }

      setModalOpen(false);
      fetchCategories();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error saving category.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const totalProductsAcrossCats = categories.reduce((sum, c) => sum + (c.productCount || 0), 0);

  return (
    <div style={{ display: 'grid', gap: '22px' }}>
      {/* Top Header */}
      <PageHeader
        title="Categories Management"
        subtitle="Manage shop departments, slug taxonomies, category hero banners & sort order"
        action={
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={fetchCategories}
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
              title="Refresh Categories"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              onClick={openCreateModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#3C0815',
                color: '#FFF9EF',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(60,8,21,0.25)',
              }}
            >
              <Plus size={16} /> Add Category
            </button>
          </div>
        }
      />

      {/* Metrics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <Card>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.08em' }}>Total Categories</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#3C0815', marginTop: '6px' }}>{categories.length}</div>
          <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
            {categories.filter(c => c.active).length} Active on Storefront
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.08em' }}>Assigned Products</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#D4AA45', marginTop: '6px' }}>
            {totalProductsAcrossCats}
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Live products in catalogue</div>
        </Card>
        <Card>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.08em' }}>Cloudinary Folder</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#3C0815', marginTop: '10px', wordBreak: 'break-all' }}>
            <code>malwa-namkeen-house/categories</code>
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Direct media namespace</div>
        </Card>
      </div>

      {/* Filters & Content Area */}
      <Card>
        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F8F6F2', border: '1px solid #EAE3D2', padding: '8px 14px', borderRadius: '8px', flex: '1', minWidth: '240px', maxWidth: '380px' }}>
            <Search size={16} color="#9CA3AF" />
            <input
              placeholder="Search category name, slug or description..."
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
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '13px', color: '#374151', outline: 'none' }}
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '13px', color: '#374151', outline: 'none' }}
            >
              <option value="sortOrder">Sort Order (Lowest First)</option>
              <option value="name">Name (A–Z)</option>
              <option value="newest">Newest First</option>
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

        {/* Categories Grid List */}
        {loading ? (
          <div style={{ padding: '60px 0', display: 'grid', placeItems: 'center' }}>
            <Spinner />
            <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '12px' }}>Loading categories from MongoDB...</div>
          </div>
        ) : categories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed #E5E7EB', borderRadius: '12px', background: '#FAF9F6' }}>
            <FolderTree size={40} color="#D4AA45" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#3C0815' }}>No Categories Found</h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6B7280' }}>
              Create your first department category to organize your Malwa Namkeen products.
            </p>
            <button
              onClick={openCreateModal}
              style={{ background: '#3C0815', color: '#FFF9EF', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Add New Category
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {categories.map(cat => (
              <div
                key={cat._id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #EAE5D9',
                  borderRadius: '12px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'box-shadow 0.15s, border-color 0.15s',
                }}
              >
                <div>
                  {/* Category Card Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: '#FAF6EF', border: '1px solid #EAE3D2', overflow: 'hidden', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <FolderTree size={20} color="#D4AA45" />
                        )}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#2D0813' }}>
                          {cat.name}
                        </h3>
                        <code style={{ fontSize: '11px', color: '#881337', background: '#FFF1F2', padding: '1px 5px', borderRadius: '4px', marginTop: '2px', display: 'inline-block' }}>
                          {cat.slug}
                        </code>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleActive(cat._id, cat.active)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        background: cat.active ? '#D1FAE5' : '#F3F4F6',
                        color: cat.active ? '#065F46' : '#6B7280',
                        border: 'none',
                        padding: '3px 8px',
                        borderRadius: '999px',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                      title="Click to toggle status"
                    >
                      {cat.active ? <Eye size={11} /> : <EyeOff size={11} />}
                      <span>{cat.active ? 'Active' : 'Inactive'}</span>
                    </button>
                  </div>

                  {/* Description */}
                  <p style={{ margin: '0 0 14px', fontSize: '12.5px', color: '#4B5563', lineHeight: 1.55 }}>
                    {cat.description || 'No description provided.'}
                  </p>
                </div>

                {/* Footer Bar */}
                <div style={{ paddingTop: '12px', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FAF6EF', color: '#881337', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '11.5px' }}>
                      <Package size={12} /> {cat.productCount ?? 0} Products
                    </span>
                    <span style={{ color: '#9CA3AF', fontSize: '11px' }}>
                      Order: #{cat.sortOrder ?? 0}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => openEditModal(cat)}
                      style={{
                        background: '#F8F6F2',
                        border: '1px solid #EAE3D2',
                        borderRadius: '6px',
                        padding: '5px 8px',
                        color: '#3C0815',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                      }}
                      title="Edit Category"
                    >
                      <Edit2 size={12} />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => setDeleteConfirmCategory(cat)}
                      style={{
                        background: '#FFF1F2',
                        border: '1px solid #FEE2E2',
                        borderRadius: '6px',
                        padding: '5px 7px',
                        color: '#DC2626',
                        cursor: 'pointer',
                      }}
                      title="Delete Category"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal with Reference Safety Alert */}
      {deleteConfirmCategory && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'grid', placeItems: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', maxWidth: '440px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 10px', color: '#991B1B', fontSize: '18px', fontWeight: 700 }}>
              Delete Category &ldquo;{deleteConfirmCategory.name}&rdquo;?
            </h3>

            {deleteConfirmCategory.productCount && deleteConfirmCategory.productCount > 0 ? (
              <div style={{ background: '#FFF1F2', border: '1px solid #FEE2E2', borderRadius: '8px', padding: '12px', color: '#991B1B', fontSize: '13px', lineHeight: 1.5, marginBottom: '18px' }}>
                <strong>Protection Alert:</strong> There are currently <strong>{deleteConfirmCategory.productCount} product(s)</strong> assigned to this category. You must reassign or remove those products before deleting this category.
              </div>
            ) : (
              <p style={{ margin: '0 0 20px', color: '#6B7280', fontSize: '13.5px', lineHeight: 1.5 }}>
                Are you sure you want to delete this category? Products will no longer be able to use this category slug.
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setDeleteConfirmCategory(null)}
                style={{ background: '#F3F4F6', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', color: '#374151', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCategory(deleteConfirmCategory._id)}
                disabled={Boolean(deleteConfirmCategory.productCount && deleteConfirmCategory.productCount > 0)}
                style={{
                  background: deleteConfirmCategory.productCount && deleteConfirmCategory.productCount > 0 ? '#9CA3AF' : '#DC2626',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  color: '#fff',
                  cursor: deleteConfirmCategory.productCount && deleteConfirmCategory.productCount > 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                }}
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Category Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '580px', width: '100%', margin: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{ padding: '18px 24px', background: '#3C0815', color: '#FFF9EF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: 'rgba(255,248,236,0.7)' }}>
                  Organize namkeen items and sweets into storefront sections
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitCategoryForm} style={{ padding: '22px', display: 'grid', gap: '16px', maxHeight: '75vh', overflowY: 'auto' }}>
              {formError && (
                <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label style={labelStyle}>Category Name *</label>
                <input
                  required
                  value={formName}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="e.g. Sev & Namkeens, Khasta Mathri, Mithai & Sweets"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>URL Slug</label>
                <input
                  value={formSlug}
                  onChange={e => setFormSlug(e.target.value)}
                  placeholder="e.g. sev-namkeens"
                  style={inputStyle}
                />
                <span style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '3px', display: 'block' }}>
                  Used in storefront URL routes (e.g. /shop?cat=sev-namkeens)
                </span>
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Brief description for category hero sections..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {/* Cloudinary Category Image */}
              <div>
                <label style={labelStyle}>Category Hero Image (Cloudinary: malwa-namkeen-house/categories)</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#F8F6F2',
                      border: '1.5px dashed #D4AA45',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: '#3C0815',
                      cursor: uploadingImage ? 'wait' : 'pointer',
                    }}
                  >
                    <UploadCloud size={16} color="#D4AA45" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      disabled={uploadingImage}
                      style={{ display: 'none' }}
                    />
                  </label>

                  <input
                    placeholder="Or paste image URL..."
                    value={imageUrlInput}
                    onChange={e => setImageUrlInput(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={addImageUrl}
                    style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0 12px', fontSize: '12px', fontWeight: 600, height: '38px', cursor: 'pointer' }}
                  >
                    Add
                  </button>
                </div>

                {formImage && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FAF6EF', padding: '8px 12px', borderRadius: '8px', border: '1px solid #EAE3D2' }}>
                    <img src={formImage} alt="Preview" style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover' }} />
                    <div style={{ flex: 1, minWidth: 0, fontSize: '11.5px', color: '#4B5563', wordBreak: 'break-all' }}>
                      {formImage}
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormImage('')}
                      style={{ background: '#FEE2E2', border: 'none', borderRadius: '4px', width: '24px', height: '24px', color: '#991B1B', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                      title="Remove image"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Sort Order Index</label>
                  <input
                    type="number"
                    min="0"
                    value={formSortOrder}
                    onChange={e => setFormSortOrder(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    style={inputStyle}
                  />
                  <span style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px', display: 'block' }}>
                    Lower number shows first
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', paddingTop: '18px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={e => setFormActive(e.target.checked)}
                      style={{ accentColor: '#3C0815', width: '16px', height: '16px' }}
                    />
                    <span style={{ fontWeight: 600, color: '#374151' }}>Active on Store</span>
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '14px', borderTop: '1px solid #E5E7EB' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={formSubmitting}
                  style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', color: '#374151', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  style={{
                    background: '#3C0815',
                    color: '#FFF9EF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '9px 20px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: formSubmitting ? 'wait' : 'pointer',
                    boxShadow: '0 2px 6px rgba(60,8,21,0.25)',
                  }}
                >
                  {formSubmitting ? 'Saving…' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
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
