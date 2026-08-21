import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  UploadCloud,
  X,
  Check,
  AlertCircle,
  Star,
  Eye,
  EyeOff,
  Layers,
  ArrowUpDown,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { Card, PageHeader, Spinner } from '../../components/admin/ui.tsx';

interface VariantForm {
  _id?: string;
  label: string;
  value?: number | '';
  unit?: string;
  price: number | '';
  salePrice?: number | '';
  stock: number | '';
  sku: string;
  active: boolean;
  sortOrder: number;
}

interface CategoryOption {
  _id: string;
  name: string;
  slug: string;
}

interface ProductItem {
  _id: string;
  name: string;
  slug: string;
  hindiName?: string;
  tagline?: string;
  description: string;
  story?: string;
  ingredients: string[];
  spiceLevel?: 'Mild' | 'Medium' | 'Zesty' | 'Clove Hot' | 'Sweet & Tangy';
  shelfLife?: string;
  oilUsed?: string;
  isVegetarian: boolean;
  category: { _id: string; name: string; slug: string } | string;
  images: string[];
  variants: VariantForm[];
  featured: boolean;
  active: boolean;
  badge?: string;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
}

const DEFAULT_VARIANT: VariantForm = {
  label: '400g',
  value: 400,
  unit: 'g',
  price: 180,
  salePrice: '',
  stock: 100,
  sku: '',
  active: true,
  sortOrder: 0,
};

export default function AdminProducts() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState('newest');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formHindiName, setFormHindiName] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStory, setFormStory] = useState('');
  const [formIngredients, setFormIngredients] = useState('');
  const [formSpiceLevel, setFormSpiceLevel] = useState<'Mild' | 'Medium' | 'Zesty' | 'Clove Hot' | 'Sweet & Tangy'>('Medium');
  const [formShelfLife, setFormShelfLife] = useState('90 Days');
  const [formOilUsed, setFormOilUsed] = useState('Pure Groundnut Oil');
  const [formBadge, setFormBadge] = useState('');
  const [formIsVeg, setFormIsVeg] = useState(true);
  const [formFeatured, setFormFeatured] = useState(false);
  const [formActive, setFormActive] = useState(true);
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formVariants, setFormVariants] = useState<VariantForm[]>([DEFAULT_VARIANT]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Fetch Token Helper
  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('malwa_admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // Fetch Categories from real MongoDB categories endpoint
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/categories', {
        headers: getAuthHeader(),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.categories) {
          setCategories(data.categories);
        }
      }
    } catch {
      // Ignore
    }
  }, [getAuthHeader]);

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        search,
        category: selectedCategory,
        status: statusFilter,
        sortBy,
      });

      const res = await fetch(`/api/admin/products?${params.toString()}`, {
        headers: getAuthHeader(),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Failed to fetch products (${res.status})`);
      }

      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading products.');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, search, selectedCategory, statusFilter, sortBy]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Open Create Modal
  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormHindiName('');
    setFormTagline('');
    setFormCategory(categories[0]?._id || '');
    setFormDescription('');
    setFormStory('');
    setFormIngredients('Gram Flour (Besan), Cold-Pressed Groundnut Oil, Clove, Black Pepper, Hing, Rock Salt');
    setFormSpiceLevel('Medium');
    setFormShelfLife('90 Days');
    setFormOilUsed('Pure Groundnut Oil');
    setFormBadge('');
    setFormIsVeg(true);
    setFormFeatured(false);
    setFormActive(true);
    setFormImages([]);
    setFormVariants([
      { label: '250g', value: 250, unit: 'g', price: 120, salePrice: '', stock: 50, sku: '', active: true, sortOrder: 0 },
      { label: '500g', value: 500, unit: 'g', price: 230, salePrice: '', stock: 40, sku: '', active: true, sortOrder: 1 },
      { label: '1kg', value: 1, unit: 'kg', price: 440, salePrice: '', stock: 25, sku: '', active: true, sortOrder: 2 },
    ]);
    setFormError(null);
    setImageUrlInput('');
    setModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (p: ProductItem) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormHindiName(p.hindiName || '');
    setFormTagline(p.tagline || '');
    setFormCategory(typeof p.category === 'object' ? p.category._id : p.category);
    setFormDescription(p.description || '');
    setFormStory(p.story || '');
    setFormIngredients(Array.isArray(p.ingredients) ? p.ingredients.join(', ') : '');
    setFormSpiceLevel(p.spiceLevel || 'Medium');
    setFormShelfLife(p.shelfLife || '90 Days');
    setFormOilUsed(p.oilUsed || 'Pure Groundnut Oil');
    setFormBadge(p.badge || '');
    setFormIsVeg(p.isVegetarian ?? true);
    setFormFeatured(Boolean(p.featured));
    setFormActive(Boolean(p.active));
    setFormImages(p.images || []);
    setFormVariants(
      p.variants && p.variants.length > 0
        ? p.variants.map((v, i) => ({
            ...v,
            sortOrder: v.sortOrder ?? i,
            price: v.price,
            salePrice: v.salePrice ?? '',
            stock: v.stock ?? 0,
            sku: v.sku || '',
            active: v.active !== false,
          }))
        : [DEFAULT_VARIANT]
    );
    setFormError(null);
    setImageUrlInput('');
    setModalOpen(true);
  };

  // Handle Cloudinary Image Upload
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setFormError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('image', file);
        formData.append('target', 'products');

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
          setFormImages(prev => [...prev, data.secureUrl]);
        }
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Upload failed. Check Cloudinary settings.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Add Manual Image URL
  const addImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setFormImages(prev => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  // Remove Image
  const removeImage = (index: number) => {
    setFormImages(prev => prev.filter((_, idx) => idx !== index));
  };

  // Move image to primary (index 0)
  const makePrimaryImage = (index: number) => {
    if (index === 0) return;
    setFormImages(prev => {
      const copy = [...prev];
      const [selected] = copy.splice(index, 1);
      return [selected, ...copy];
    });
  };

  // Dynamic Variant Handlers
  const addVariantRow = () => {
    const newIdx = formVariants.length;
    setFormVariants(prev => [
      ...prev,
      {
        label: `${(newIdx + 1) * 250}g`,
        value: (newIdx + 1) * 250,
        unit: 'g',
        price: '',
        salePrice: '',
        stock: 50,
        sku: `MLW-VAR-${Date.now().toString(36).toUpperCase()}-${newIdx + 1}`,
        active: true,
        sortOrder: newIdx,
      },
    ]);
  };

  const updateVariantRow = (index: number, field: keyof VariantForm, value: unknown) => {
    setFormVariants(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeVariantRow = (index: number) => {
    if (formVariants.length <= 1) {
      setFormError('A product must have at least one variant.');
      return;
    }
    setFormVariants(prev => prev.filter((_, idx) => idx !== index));
  };

  // Toggle Active Status
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/products/${id}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        credentials: 'include',
      });
      if (res.ok) {
        setProducts(prev =>
          prev.map(p => (p._id === id ? { ...p, active: !currentStatus } : p))
        );
      }
    } catch {
      // Ignore
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
        credentials: 'include',
      });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p._id !== id));
        setDeleteConfirmId(null);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete product.');
    }
  };

  // Submit Create or Edit Form
  const handleSubmitProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Product Name is required.');
      return;
    }
    if (!formCategory) {
      setFormError('Please select a Category.');
      return;
    }
    if (!formDescription.trim()) {
      setFormError('Product Description is required.');
      return;
    }
    if (formVariants.length === 0) {
      setFormError('At least one variant with pricing is required.');
      return;
    }

    // Validate Variants
    for (let i = 0; i < formVariants.length; i++) {
      const v = formVariants[i];
      if (!v.label.trim()) {
        setFormError(`Variant #${i + 1} requires a packaging/weight label (e.g. 250g, 1kg, Gift Box).`);
        return;
      }
      if (v.price === '' || isNaN(Number(v.price)) || Number(v.price) < 0) {
        setFormError(`Variant "${v.label}" requires a valid price.`);
        return;
      }
    }

    setFormSubmitting(true);

    const payload = {
      name: formName.trim(),
      hindiName: formHindiName.trim(),
      tagline: formTagline.trim(),
      category: formCategory,
      description: formDescription.trim(),
      story: formStory.trim(),
      ingredients: formIngredients.split(',').map(s => s.trim()).filter(Boolean),
      spiceLevel: formSpiceLevel,
      shelfLife: formShelfLife.trim(),
      oilUsed: formOilUsed.trim(),
      badge: formBadge.trim(),
      isVegetarian: formIsVeg,
      featured: formFeatured,
      active: formActive,
      images: formImages.filter(Boolean),
      variants: formVariants.map((v, i) => ({
        label: v.label.trim(),
        value: v.value !== '' ? Number(v.value) : undefined,
        unit: v.unit?.trim() || undefined,
        price: Number(v.price),
        salePrice: v.salePrice !== '' && Number(v.salePrice) > 0 ? Number(v.salePrice) : undefined,
        stock: v.stock !== '' ? Number(v.stock) : 0,
        sku: v.sku.trim() || `MLW-${formName.slice(0, 3).toUpperCase()}-${v.label.replace(/\s+/g, '').toUpperCase()}`,
        active: v.active !== false,
        sortOrder: i,
      })),
    };

    try {
      const url = editingProduct
        ? `/api/admin/products/${editingProduct._id}`
        : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

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
        throw new Error(data.message || 'Failed to save product.');
      }

      setModalOpen(false);
      fetchProducts();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error saving product.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const getCategoryName = (cat: ProductItem['category']) => {
    if (typeof cat === 'object' && cat !== null) return cat.name;
    const found = categories.find(c => c._id === cat || c.slug === cat);
    return found ? found.name : 'Namkeens';
  };

  return (
    <div style={{ display: 'grid', gap: '22px' }}>
      {/* Top Header */}
      <PageHeader
        title="Products Management"
        subtitle={`Manage catalogue items, dynamic packaging variants, pricing & Cloudinary media`}
        action={
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={fetchProducts}
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
              title="Refresh Products"
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
              <Plus size={16} /> Add Product
            </button>
          </div>
        }
      />

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <Card>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.08em' }}>Total Products</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#3C0815', marginTop: '6px' }}>{products.length}</div>
          <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
            {products.filter(p => p.active).length} Live on Store
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.08em' }}>Featured Items</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#D4AA45', marginTop: '6px' }}>
            {products.filter(p => p.featured).length}
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Highlighted on Homepage</div>
        </Card>
        <Card>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.08em' }}>Active Categories</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#3C0815', marginTop: '6px' }}>{categories.length || 5}</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Shop Departments</div>
        </Card>
      </div>

      {/* Main Filter & Table Card */}
      <Card>
        {/* Filter Controls Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F8F6F2', border: '1px solid #EAE3D2', padding: '8px 14px', borderRadius: '8px', flex: '1', minWidth: '240px', maxWidth: '380px' }}>
            <Search size={16} color="#9CA3AF" />
            <input
              placeholder="Search product name, hindi, SKU..."
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
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '13px', color: '#374151', outline: 'none' }}
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

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
              onChange={e => setSortBy(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '13px', color: '#374151', outline: 'none' }}
            >
              <option value="newest">Newest First</option>
              <option value="name">Name (A–Z)</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
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

        {/* Product Table */}
        {loading ? (
          <div style={{ padding: '60px 0', display: 'grid', placeItems: 'center' }}>
            <Spinner />
            <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '12px' }}>Loading products from MongoDB...</div>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed #E5E7EB', borderRadius: '12px', background: '#FAF9F6' }}>
            <Package size={40} color="#D4AA45" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#3C0815' }}>No Products Found</h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6B7280' }}>
              {search || selectedCategory !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or clear filters.'
                : 'Get started by adding your first Malwa artisanal delicacy.'}
            </p>
            <button
              onClick={openCreateModal}
              style={{ background: '#3C0815', color: '#FFF9EF', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Add New Product
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #EAE5D9', color: '#6B7280', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <th style={{ padding: '12px 14px' }}>Product</th>
                  <th style={{ padding: '12px 14px' }}>Category</th>
                  <th style={{ padding: '12px 14px' }}>Spice</th>
                  <th style={{ padding: '12px 14px' }}>Packaging & Variants</th>
                  <th style={{ padding: '12px 14px' }}>Price Range</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const minPrice = p.variants && p.variants.length > 0 ? Math.min(...p.variants.map(v => Number(v.price) || 0)) : 0;
                  const maxPrice = p.variants && p.variants.length > 0 ? Math.max(...p.variants.map(v => Number(v.price) || 0)) : 0;
                  const primaryImg = p.images?.[0];

                  return (
                    <tr key={p._id} style={{ borderBottom: '1px solid #F3F4F6', transition: 'background 0.15s' }}>
                      {/* Product Thumbnail & Details */}
                      <td style={{ padding: '14px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#F8F6F2', border: '1px solid #EAE3D2', overflow: 'hidden', flexShrink: 0, display: 'grid', placeItems: 'center' }}>
                            {primaryImg ? (
                              <img src={primaryImg} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Package size={20} color="#881337" />
                            )}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 700, color: '#2D0813', fontSize: '14px' }}>{p.name}</span>
                              {p.featured && (
                                <span title="Featured on Homepage">
                                  <Star size={13} fill="#F0C74E" color="#F0C74E" />
                                </span>
                              )}
                            </div>
                            {p.hindiName && <div style={{ fontSize: '11.5px', color: '#9CA3AF', marginTop: '1px' }}>{p.hindiName}</div>}
                            {p.badge && (
                              <span style={{ display: 'inline-block', marginTop: '4px', background: '#FEF3C7', color: '#92400E', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                                {p.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '14px', verticalAlign: 'top', color: '#4B5563', fontWeight: 500 }}>
                        {getCategoryName(p.category)}
                      </td>

                      {/* Spice Level */}
                      <td style={{ padding: '14px', verticalAlign: 'top' }}>
                        <span style={{ display: 'inline-block', background: '#FFF1F2', color: '#9F1239', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                          {p.spiceLevel || 'Medium'}
                        </span>
                      </td>

                      {/* Dynamic Variants list */}
                      <td style={{ padding: '14px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {p.variants?.map((v, i) => (
                            <div key={i} style={{ fontSize: '12px', color: '#4B5563', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 600, color: '#3C0815' }}>{v.label}</span>
                              <span style={{ color: '#9CA3AF' }}>•</span>
                              <span>₹{v.price}</span>
                              <span style={{ color: '#9CA3AF', fontSize: '11px' }}>({v.stock} in stock)</span>
                              {v.sku && <code style={{ fontSize: '10px', color: '#6B7280', background: '#F3F4F6', padding: '1px 4px', borderRadius: '3px' }}>{v.sku}</code>}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Price Range */}
                      <td style={{ padding: '14px', verticalAlign: 'top', fontWeight: 700, color: '#3C0815' }}>
                        {minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice} – ₹${maxPrice}`}
                      </td>

                      {/* Active Status Toggle */}
                      <td style={{ padding: '14px', verticalAlign: 'top', textAlign: 'center' }}>
                        <button
                          onClick={() => handleToggleActive(p._id, p.active)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: p.active ? '#D1FAE5' : '#F3F4F6',
                            color: p.active ? '#065F46' : '#6B7280',
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                          title="Click to toggle status"
                        >
                          {p.active ? <Eye size={12} /> : <EyeOff size={12} />}
                          <span>{p.active ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td style={{ padding: '14px', verticalAlign: 'top', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => openEditModal(p)}
                            style={{
                              background: '#F8F6F2',
                              border: '1px solid #EAE3D2',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              color: '#3C0815',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                            }}
                            title="Edit product"
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => setDeleteConfirmId(p._id)}
                            style={{
                              background: '#FFF1F2',
                              border: '1px solid #FEE2E2',
                              borderRadius: '6px',
                              padding: '6px 8px',
                              color: '#DC2626',
                              cursor: 'pointer',
                            }}
                            title="Delete product"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'grid', placeItems: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 10px', color: '#991B1B', fontSize: '18px', fontWeight: 700 }}>Delete Product?</h3>
            <p style={{ margin: '0 0 20px', color: '#6B7280', fontSize: '13.5px', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete this product? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{ background: '#F3F4F6', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', color: '#374151', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirmId)}
                style={{ background: '#DC2626', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Product Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '840px', width: '100%', margin: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', background: '#3C0815', color: '#FFF9EF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {editingProduct ? 'Edit Malwa Delicacy' : 'Create New Malwa Delicacy'}
                </h2>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'rgba(255,248,236,0.7)' }}>
                  Configure product details, dynamic packaging variants, pricing and Cloudinary media
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitProductForm} style={{ padding: '24px', display: 'grid', gap: '20px', maxHeight: 'calc(85vh - 120px)', overflowY: 'auto' }}>
              {formError && (
                <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Section 1: Basic Information */}
              <div style={{ display: 'grid', gap: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#881337', letterSpacing: '0.06em', borderBottom: '1px solid #F3F4F6', paddingBottom: '6px' }}>
                  1. Essential Information
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Product Name *</label>
                    <input
                      required
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder="e.g. Ujjaini Sev, Ratlami Laung Sev"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Hindi / Regional Name</label>
                    <input
                      value={formHindiName}
                      onChange={e => setFormHindiName(e.target.value)}
                      placeholder="e.g. उज्जैनी सेंव, लौंग सेंव"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Category *</label>
                    <select
                      required
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Spice Level</label>
                    <select
                      value={formSpiceLevel}
                      onChange={e => setFormSpiceLevel(e.target.value as any)}
                      style={inputStyle}
                    >
                      <option value="Mild">Mild</option>
                      <option value="Medium">Medium</option>
                      <option value="Zesty">Zesty</option>
                      <option value="Clove Hot">Clove Hot</option>
                      <option value="Sweet & Tangy">Sweet & Tangy</option>
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Promotional Badge</label>
                    <input
                      value={formBadge}
                      onChange={e => setFormBadge(e.target.value)}
                      placeholder="e.g. Best Seller, New, Festive Pick"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Catchy Tagline</label>
                  <input
                    value={formTagline}
                    onChange={e => setFormTagline(e.target.value)}
                    placeholder="e.g. Extra fine crunchy gram flour sev infused with royal Malwa spices"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Description *</label>
                  <textarea
                    required
                    rows={3}
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    placeholder="Detailed description of the snack, taste profile and crispness..."
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Ingredients (comma separated)</label>
                    <input
                      value={formIngredients}
                      onChange={e => setFormIngredients(e.target.value)}
                      placeholder="Gram Flour, Clove, Hing, Groundnut Oil"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Shelf Life</label>
                    <input
                      value={formShelfLife}
                      onChange={e => setFormShelfLife(e.target.value)}
                      placeholder="e.g. 90 Days"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Cooking Oil Used</label>
                    <input
                      value={formOilUsed}
                      onChange={e => setFormOilUsed(e.target.value)}
                      placeholder="e.g. Pure Groundnut Oil"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', paddingTop: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formIsVeg}
                      onChange={e => setFormIsVeg(e.target.checked)}
                      style={{ accentColor: '#3C0815' }}
                    />
                    <span>100% Pure Vegetarian</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formFeatured}
                      onChange={e => setFormFeatured(e.target.checked)}
                      style={{ accentColor: '#3C0815' }}
                    />
                    <span>Featured Product (Showcase on Homepage)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={e => setFormActive(e.target.checked)}
                      style={{ accentColor: '#3C0815' }}
                    />
                    <span>Active (Available for purchase)</span>
                  </label>
                </div>
              </div>

              {/* Section 2: Cloudinary Media Uploads */}
              <div style={{ display: 'grid', gap: '14px', paddingTop: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#881337', letterSpacing: '0.06em', borderBottom: '1px solid #F3F4F6', paddingBottom: '6px' }}>
                  2. Product Images (Cloudinary: malwa-namkeen-house/products)
                </h4>

                {/* Upload Button and URL Input */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#F8F6F2',
                      border: '1.5px dashed #D4AA45',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#3C0815',
                      cursor: uploadingImage ? 'wait' : 'pointer',
                    }}
                  >
                    <UploadCloud size={18} color="#D4AA45" />
                    <span>{uploadingImage ? 'Uploading to Cloudinary...' : 'Upload Image (PNG/JPEG/WebP)'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageFileUpload}
                      disabled={uploadingImage}
                      style={{ display: 'none' }}
                    />
                  </label>

                  <div style={{ display: 'flex', gap: '6px', flex: 1, minWidth: '220px' }}>
                    <input
                      placeholder="Or paste external image URL..."
                      value={imageUrlInput}
                      onChange={e => setImageUrlInput(e.target.value)}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={addImageUrl}
                      style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0 14px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Add URL
                    </button>
                  </div>
                </div>

                {/* Image Thumbnails Gallery */}
                {formImages.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', marginTop: '6px' }}>
                    {formImages.map((img, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: 'relative',
                          borderRadius: '8px',
                          border: idx === 0 ? '2px solid #D4AA45' : '1px solid #E5E7EB',
                          overflow: 'hidden',
                          background: '#F9FAFB',
                          aspectRatio: '1',
                        }}
                      >
                        <img src={img} alt={`Preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {idx === 0 && (
                          <span style={{ position: 'absolute', top: '4px', left: '4px', background: '#3C0815', color: '#F0C74E', fontSize: '9px', fontWeight: 800, padding: '2px 5px', borderRadius: '4px' }}>
                            Primary
                          </span>
                        )}
                        <div style={{ position: 'absolute', bottom: '4px', right: '4px', display: 'flex', gap: '4px' }}>
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => makePrimaryImage(idx)}
                              style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '9px', padding: '2px 5px', cursor: 'pointer' }}
                              title="Make Primary"
                            >
                              ★
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            style={{ background: '#DC2626', color: '#fff', border: 'none', borderRadius: '4px', width: '20px', height: '20px', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
                            title="Remove"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 3: Fully Dynamic Variants */}
              <div style={{ display: 'grid', gap: '14px', paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F3F4F6', paddingBottom: '6px' }}>
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#881337', letterSpacing: '0.06em' }}>
                    3. Dynamic Packaging & Weight Variants *
                  </h4>
                  <button
                    type="button"
                    onClick={addVariantRow}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FAF6EF', border: '1px solid #EAE3D2', color: '#881337', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    <Plus size={14} /> Add Variant
                  </button>
                </div>

                <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>
                  Add unlimited packaging or weight options (e.g. 200g, 500g, 1.25kg, Small Box, Pack of 4). Each variant maintains individual pricing and stock.
                </p>

                <div style={{ display: 'grid', gap: '10px' }}>
                  {formVariants.map((variant, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr)) auto',
                        gap: '8px',
                        alignItems: 'center',
                        background: '#F8F6F2',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #EAE3D2',
                      }}
                    >
                      <div>
                        <label style={{ ...labelStyle, fontSize: '11px', marginBottom: '3px' }}>Label *</label>
                        <input
                          required
                          value={variant.label}
                          onChange={e => updateVariantRow(idx, 'label', e.target.value)}
                          placeholder="e.g. 200g, 1.25kg, Box"
                          style={{ ...inputStyle, padding: '7px 10px', fontSize: '13px' }}
                        />
                      </div>

                      <div>
                        <label style={{ ...labelStyle, fontSize: '11px', marginBottom: '3px' }}>Price (₹) *</label>
                        <input
                          required
                          type="number"
                          min="0"
                          value={variant.price}
                          onChange={e => updateVariantRow(idx, 'price', e.target.value)}
                          placeholder="₹ 150"
                          style={{ ...inputStyle, padding: '7px 10px', fontSize: '13px' }}
                        />
                      </div>

                      <div>
                        <label style={{ ...labelStyle, fontSize: '11px', marginBottom: '3px' }}>Sale Price (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={variant.salePrice ?? ''}
                          onChange={e => updateVariantRow(idx, 'salePrice', e.target.value)}
                          placeholder="Optional"
                          style={{ ...inputStyle, padding: '7px 10px', fontSize: '13px' }}
                        />
                      </div>

                      <div>
                        <label style={{ ...labelStyle, fontSize: '11px', marginBottom: '3px' }}>Stock Units</label>
                        <input
                          type="number"
                          min="0"
                          value={variant.stock}
                          onChange={e => updateVariantRow(idx, 'stock', e.target.value)}
                          placeholder="50"
                          style={{ ...inputStyle, padding: '7px 10px', fontSize: '13px' }}
                        />
                      </div>

                      <div>
                        <label style={{ ...labelStyle, fontSize: '11px', marginBottom: '3px' }}>SKU Code</label>
                        <input
                          value={variant.sku}
                          onChange={e => updateVariantRow(idx, 'sku', e.target.value)}
                          placeholder="MLW-RT-200G"
                          style={{ ...inputStyle, padding: '7px 10px', fontSize: '12px' }}
                        />
                      </div>

                      <div style={{ alignSelf: 'center', paddingTop: '16px' }}>
                        <button
                          type="button"
                          onClick={() => removeVariantRow(idx)}
                          disabled={formVariants.length <= 1}
                          style={{
                            background: '#FEE2E2',
                            color: '#991B1B',
                            border: 'none',
                            borderRadius: '6px',
                            width: '32px',
                            height: '32px',
                            display: 'grid',
                            placeItems: 'center',
                            cursor: formVariants.length <= 1 ? 'not-allowed' : 'pointer',
                            opacity: formVariants.length <= 1 ? 0.5 : 1,
                          }}
                          title="Remove variant"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={formSubmitting}
                  style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 18px', fontSize: '13px', color: '#374151', cursor: 'pointer', fontWeight: 600 }}
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
                    padding: '10px 24px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: formSubmitting ? 'wait' : 'pointer',
                    boxShadow: '0 2px 6px rgba(60,8,21,0.3)',
                  }}
                >
                  {formSubmitting ? 'Saving Product…' : editingProduct ? 'Update Product' : 'Create Product'}
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
