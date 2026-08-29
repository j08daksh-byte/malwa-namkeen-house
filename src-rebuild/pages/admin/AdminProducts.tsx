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
  Flame,
  FileText,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Sliders,
  Tag,
  ShieldCheck,
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

interface CustomSpecForm {
  label: string;
  value: string;
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
  dietaryStandard?: string;
  packagingType?: string;
  customSpecifications?: CustomSpecForm[];
  isVegetarian: boolean;
  category: { _id: string; name: string; slug: string } | string;
  images: string[];
  variants: VariantForm[];
  featured: boolean;
  isBestSeller?: boolean;
  isCombo?: boolean;
  active: boolean;
  badge?: string;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
}

const DEFAULT_VARIANT: VariantForm = {
  label: '250g',
  value: 250,
  unit: 'g',
  price: 120,
  salePrice: 140,
  stock: 100,
  sku: '',
  active: true,
  sortOrder: 0,
};

type ModalTab = 'general' | 'media' | 'variants' | 'ingredients' | 'specs';

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
  const [activeTab, setActiveTab] = useState<ModalTab>('general');
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form Fields - Tab 1: General & Story
  const [formName, setFormName] = useState('');
  const [formHindiName, setFormHindiName] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formBadge, setFormBadge] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStory, setFormStory] = useState('');
  const [formIsVeg, setFormIsVeg] = useState(true);
  const [formFeatured, setFormFeatured] = useState(false);
  const [formIsBestSeller, setFormIsBestSeller] = useState(false);
  const [formIsCombo, setFormIsCombo] = useState(false);
  const [formActive, setFormActive] = useState(true);

  // Form Fields - Tab 2: Media
  const [formImages, setFormImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Form Fields - Tab 3: Variants
  const [formVariants, setFormVariants] = useState<VariantForm[]>([DEFAULT_VARIANT]);

  // Form Fields - Tab 4: Ingredients & Flavor
  const [formIngredientsList, setFormIngredientsList] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [formSpiceLevel, setFormSpiceLevel] = useState<'Mild' | 'Medium' | 'Zesty' | 'Clove Hot' | 'Sweet & Tangy'>('Medium');
  const [formRating, setFormRating] = useState<number>(4.9);
  const [formReviewCount, setFormReviewCount] = useState<number>(120);

  // Form Fields - Tab 5: Specifications & Custom Fields
  const [formShelfLife, setFormShelfLife] = useState('90 Days');
  const [formOilUsed, setFormOilUsed] = useState('100% Pure Cold-Pressed Groundnut Oil');
  const [formDietaryStandard, setFormDietaryStandard] = useState('100% Pure Vegetarian (Satvik)');
  const [formPackagingType, setFormPackagingType] = useState('Food-Grade Multi-Layer Aroma Seal');
  const [formCustomSpecs, setFormCustomSpecs] = useState<CustomSpecForm[]>([]);

  // Fetch Token Helper
  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('malwa_admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // Fetch Categories
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

  // Dialog scroll lock and Escape key
  useEffect(() => {
    const isAnyModalOpen = modalOpen || Boolean(deleteConfirmId);
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (modalOpen && !formSubmitting) setModalOpen(false);
          if (deleteConfirmId) setDeleteConfirmId(null);
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
  }, [modalOpen, deleteConfirmId, formSubmitting]);

  // Open Create Modal
  const openCreateModal = () => {
    setEditingProduct(null);
    setActiveTab('general');
    setFormName('');
    setFormHindiName('');
    setFormTagline('');
    setFormCategory(categories[0]?._id || '');
    setFormBadge('');
    setFormDescription('');
    setFormStory('');
    setFormIsVeg(true);
    setFormFeatured(false);
    setFormIsBestSeller(false);
    setFormIsCombo(false);
    setFormActive(true);

    setFormImages([]);
    setImageUrlInput('');

    setFormVariants([
      { label: '250g', value: 250, unit: 'g', price: 120, salePrice: 140, stock: 50, sku: '', active: true, sortOrder: 0 },
      { label: '500g', value: 500, unit: 'g', price: 230, salePrice: 270, stock: 40, sku: '', active: true, sortOrder: 1 },
      { label: '1kg', value: 1, unit: 'kg', price: 440, salePrice: 520, stock: 25, sku: '', active: true, sortOrder: 2 },
    ]);

    setFormIngredientsList(['Gram Flour (Besan)', 'Whole Cloves', 'Black Pepper', 'Hing', 'Groundnut Oil', 'Rock Salt']);
    setIngredientInput('');
    setFormSpiceLevel('Medium');
    setFormRating(4.9);
    setFormReviewCount(120);

    setFormShelfLife('90 Days from manufacturing');
    setFormOilUsed('100% Pure Cold-Pressed Groundnut Oil');
    setFormDietaryStandard('100% Pure Vegetarian (Satvik)');
    setFormPackagingType('Food-Grade Multi-Layer Aroma Seal');
    setFormCustomSpecs([]);

    setFormError(null);
    setModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (p: ProductItem) => {
    setEditingProduct(p);
    setActiveTab('general');
    setFormName(p.name);
    setFormHindiName(p.hindiName || '');
    setFormTagline(p.tagline || '');
    setFormCategory(typeof p.category === 'object' ? p.category._id : p.category);
    setFormBadge(p.badge || '');
    setFormDescription(p.description || '');
    setFormStory(p.story || '');
    setFormIsVeg(p.isVegetarian ?? true);
    setFormFeatured(Boolean(p.featured));
    setFormIsBestSeller(Boolean(p.isBestSeller));
    setFormIsCombo(Boolean(p.isCombo));
    setFormActive(Boolean(p.active));

    setFormImages(Array.isArray(p.images) ? p.images : []);
    setImageUrlInput('');

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

    setFormIngredientsList(Array.isArray(p.ingredients) ? p.ingredients : []);
    setIngredientInput('');
    setFormSpiceLevel(p.spiceLevel || 'Medium');
    setFormRating(typeof p.rating === 'number' ? p.rating : 4.9);
    setFormReviewCount(typeof p.reviewCount === 'number' ? p.reviewCount : 120);

    setFormShelfLife(p.shelfLife || '90 Days from manufacturing');
    setFormOilUsed(p.oilUsed || '100% Pure Cold-Pressed Groundnut Oil');
    setFormDietaryStandard(p.dietaryStandard || '100% Pure Vegetarian (Satvik)');
    setFormPackagingType(p.packagingType || 'Food-Grade Multi-Layer Aroma Seal');
    setFormCustomSpecs(Array.isArray(p.customSpecifications) ? p.customSpecifications : []);

    setFormError(null);
    setModalOpen(true);
  };

  // Cloudinary Image Upload
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
      setFormError(err instanceof Error ? err.message : 'Upload failed. Please check network/Cloudinary.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Add Image URL
  const addImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setFormImages(prev => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  // Remove Image
  const removeImage = (index: number) => {
    setFormImages(prev => prev.filter((_, idx) => idx !== index));
  };

  // Set Primary Image
  const makePrimaryImage = (index: number) => {
    if (index === 0) return;
    setFormImages(prev => {
      const copy = [...prev];
      const [selected] = copy.splice(index, 1);
      return [selected, ...copy];
    });
  };

  // Variant Helpers
  const addVariantRow = (preset?: { label: string; price?: number; salePrice?: number }) => {
    const newIdx = formVariants.length;
    setFormVariants(prev => [
      ...prev,
      {
        label: preset?.label || `${(newIdx + 1) * 250}g`,
        value: parseFloat(preset?.label || '') || (newIdx + 1) * 250,
        unit: 'g',
        price: preset?.price ?? '',
        salePrice: preset?.salePrice ?? '',
        stock: 50,
        sku: `MLW-${(formName || 'PRD').slice(0, 3).toUpperCase()}-${(preset?.label || 'VAR').replace(/\s+/g, '').toUpperCase()}`,
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
      setFormError('A delicacy must have at least one weight/packaging option.');
      return;
    }
    setFormVariants(prev => prev.filter((_, idx) => idx !== index));
  };

  // Ingredients Tag Helpers
  const handleAddIngredient = () => {
    const val = ingredientInput.trim();
    if (!val) return;
    if (val.includes(',')) {
      const parts = val.split(',').map(s => s.trim()).filter(Boolean);
      setFormIngredientsList(prev => Array.from(new Set([...prev, ...parts])));
    } else {
      if (!formIngredientsList.includes(val)) {
        setFormIngredientsList(prev => [...prev, val]);
      }
    }
    setIngredientInput('');
  };

  const handleRemoveIngredient = (ing: string) => {
    setFormIngredientsList(prev => prev.filter(i => i !== ing));
  };

  // Custom Specs Helpers
  const handleAddCustomSpec = () => {
    setFormCustomSpecs(prev => [...prev, { label: '', value: '' }]);
  };

  const handleUpdateCustomSpec = (index: number, field: 'label' | 'value', val: string) => {
    setFormCustomSpecs(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleRemoveCustomSpec = (index: number) => {
    setFormCustomSpecs(prev => prev.filter((_, idx) => idx !== index));
  };

  // Status Toggles
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

  const handleToggleBestSeller = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}/toggle-bestseller`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        credentials: 'include',
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch {
      // Ignore
    }
  };

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

  // Submit Form
  const handleSubmitProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setActiveTab('general');
      setFormError('Product Name is required.');
      return;
    }
    if (!formCategory) {
      setActiveTab('general');
      setFormError('Please select a Category.');
      return;
    }
    if (!formDescription.trim()) {
      setActiveTab('general');
      setFormError('Product Description is required.');
      return;
    }
    if (formVariants.length === 0) {
      setActiveTab('variants');
      setFormError('At least one weight/variant option is required.');
      return;
    }

    // Validate Variants
    for (let i = 0; i < formVariants.length; i++) {
      const v = formVariants[i];
      if (!v.label.trim()) {
        setActiveTab('variants');
        setFormError(`Variant #${i + 1} requires a packaging label (e.g. 250g, 500g, Gift Box).`);
        return;
      }
      if (v.price === '' || isNaN(Number(v.price)) || Number(v.price) < 0) {
        setActiveTab('variants');
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
      badge: formBadge.trim(),
      description: formDescription.trim(),
      story: formStory.trim(),
      ingredients: formIngredientsList,
      spiceLevel: formSpiceLevel,
      shelfLife: formShelfLife.trim(),
      oilUsed: formOilUsed.trim(),
      dietaryStandard: formDietaryStandard.trim(),
      packagingType: formPackagingType.trim(),
      customSpecifications: formCustomSpecs.filter(s => s.label.trim() && s.value.trim()),
      isVegetarian: formIsVeg,
      featured: formFeatured,
      isBestSeller: formIsBestSeller,
      isCombo: formIsCombo,
      active: formActive,
      images: formImages.filter(Boolean),
      rating: formRating,
      reviewCount: formReviewCount,
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
        title="Products & Delicacies Management"
        subtitle="Full control over product catalogue, packaging variants, authentic ingredients, story, and custom specifications"
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
              <Plus size={16} /> Add New Delicacy
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
            {products.filter(p => p.active).length} Active on Customer Storefront
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.08em' }}>Best Sellers (Top 4)</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#D4AA45', marginTop: '6px' }}>
            {products.filter(p => p.isBestSeller).length} / 4
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Featured on Homepage Top 4</div>
        </Card>
        <Card>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.08em' }}>Store Categories</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#3C0815', marginTop: '6px' }}>{categories.length || 6}</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Organized Departments</div>
        </Card>
      </div>

      {/* Filter & Table Card */}
      <Card>
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
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#3C0815' }}>No Delicacies Found</h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6B7280' }}>
              {search || selectedCategory !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or clear filters.'
                : 'Get started by adding your first Malwa artisanal delicacy.'}
            </p>
            <button
              onClick={openCreateModal}
              style={{ background: '#3C0815', color: '#FFF9EF', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Add New Delicacy
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #EAE5D9', color: '#6B7280', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <th style={{ padding: '12px 14px' }}>Delicacy</th>
                  <th style={{ padding: '12px 14px' }}>Category</th>
                  <th style={{ padding: '12px 14px' }}>Spice & Specs</th>
                  <th style={{ padding: '12px 14px' }}>Packaging Variants</th>
                  <th style={{ padding: '12px 14px' }}>Price</th>
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
                      <td style={{ padding: '14px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: '#F8F6F2', border: '1px solid #EAE3D2', overflow: 'hidden', flexShrink: 0, display: 'grid', placeItems: 'center' }}>
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
                                <span title="Featured Product">
                                  <Star size={13} fill="#F0C74E" color="#F0C74E" />
                                </span>
                              )}
                            </div>
                            {p.hindiName && <div style={{ fontSize: '11.5px', color: '#8C756B', marginTop: '1px' }}>{p.hindiName}</div>}
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                              {p.isBestSeller && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleBestSeller(p._id)}
                                  style={{
                                    border: 'none',
                                    background: '#FEF3C7',
                                    color: '#92400E',
                                    padding: '2px 7px',
                                    borderRadius: '4px',
                                    fontSize: '10.5px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                  }}
                                  title="Top 4 Best Seller. Click to toggle."
                                >
                                  <span>★ Top 4 Best Seller</span>
                                </button>
                              )}
                              {p.badge && p.badge !== 'Best Seller' && (
                                <span style={{ background: '#F3F4F6', color: '#374151', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                                  {p.badge}
                                </span>
                              )}
                              {p.isCombo && (
                                <span
                                  style={{
                                    background: '#FCE7F3',
                                    color: '#9D174D',
                                    border: '1px solid #FBCFE8',
                                    padding: '2px 7px',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                  }}
                                  title="Combo Product"
                                >
                                  <span>🎁 Combo</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px', verticalAlign: 'top', color: '#4B5563', fontWeight: 600 }}>
                        {getCategoryName(p.category)}
                      </td>

                      <td style={{ padding: '14px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ display: 'inline-block', background: '#FFF1F2', color: '#9F1239', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, width: 'max-content' }}>
                            {p.spiceLevel || 'Medium'}
                          </span>
                          <span style={{ fontSize: '11px', color: '#6B7280' }}>
                            {p.shelfLife || '90 Days'}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '14px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {p.variants?.map((v, i) => (
                            <div key={i} style={{ fontSize: '12px', color: '#4B5563', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 700, color: '#3C0815' }}>{v.label}</span>
                              <span style={{ color: '#9CA3AF' }}>•</span>
                              <span>₹{v.price}</span>
                              {v.salePrice && Number(v.salePrice) > 0 && <span style={{ textDecoration: 'line-through', color: '#9CA3AF', fontSize: '11px' }}>₹{v.salePrice}</span>}
                              <span style={{ color: '#9CA3AF', fontSize: '11px' }}>({v.stock} pcs)</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td style={{ padding: '14px', verticalAlign: 'top', fontWeight: 700, color: '#3C0815' }}>
                        {minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice} – ₹${maxPrice}`}
                      </td>

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
                          title="Click to toggle active status"
                        >
                          {p.active ? <Eye size={12} /> : <EyeOff size={12} />}
                          <span>{p.active ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

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
                            title="Edit delicacy"
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
                            title="Delete delicacy"
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
            <h3 style={{ margin: '0 0 10px', color: '#991B1B', fontSize: '18px', fontWeight: 700 }}>Delete Delicacy?</h3>
            <p style={{ margin: '0 0 20px', color: '#6B7280', fontSize: '13.5px', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete this product from the database and storefront?
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

      {/* Create / Edit Product Modal with Clean Tabs */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '880px', width: '100%', margin: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Modal Header */}
            <div style={{ padding: '18px 24px', background: '#3C0815', color: '#FFF9EF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {editingProduct ? `Edit Delicacy: ${formName || 'Untitled'}` : 'Create New Malwa Delicacy'}
                </h2>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'rgba(255,248,236,0.75)' }}>
                  Easily configure product details, packaging weights, authentic ingredients &amp; custom specifications
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div style={{ display: 'flex', background: '#F8F6F2', borderBottom: '1px solid #EAE3D2', overflowX: 'auto', padding: '0 16px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                style={{
                  ...tabBtnStyle,
                  borderBottom: activeTab === 'general' ? '3px solid #3C0815' : '3px solid transparent',
                  color: activeTab === 'general' ? '#3C0815' : '#6B7280',
                  fontWeight: activeTab === 'general' ? 800 : 600,
                }}
              >
                <Package size={15} />
                <span>1. Basic Info &amp; Story</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('media')}
                style={{
                  ...tabBtnStyle,
                  borderBottom: activeTab === 'media' ? '3px solid #3C0815' : '3px solid transparent',
                  color: activeTab === 'media' ? '#3C0815' : '#6B7280',
                  fontWeight: activeTab === 'media' ? 800 : 600,
                }}
              >
                <ImageIcon size={15} />
                <span>2. Images ({formImages.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('variants')}
                style={{
                  ...tabBtnStyle,
                  borderBottom: activeTab === 'variants' ? '3px solid #3C0815' : '3px solid transparent',
                  color: activeTab === 'variants' ? '#3C0815' : '#6B7280',
                  fontWeight: activeTab === 'variants' ? 800 : 600,
                }}
              >
                <Layers size={15} />
                <span>3. Weights &amp; Pricing ({formVariants.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ingredients')}
                style={{
                  ...tabBtnStyle,
                  borderBottom: activeTab === 'ingredients' ? '3px solid #3C0815' : '3px solid transparent',
                  color: activeTab === 'ingredients' ? '#3C0815' : '#6B7280',
                  fontWeight: activeTab === 'ingredients' ? 800 : 600,
                }}
              >
                <Flame size={15} />
                <span>4. Ingredients &amp; Taste</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                style={{
                  ...tabBtnStyle,
                  borderBottom: activeTab === 'specs' ? '3px solid #3C0815' : '3px solid transparent',
                  color: activeTab === 'specs' ? '#3C0815' : '#6B7280',
                  fontWeight: activeTab === 'specs' ? 800 : 600,
                }}
              >
                <Sliders size={15} />
                <span>5. Specifications &amp; Custom Fields</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitProductForm} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '24px', maxHeight: 'calc(80vh - 160px)', overflowY: 'auto', display: 'grid', gap: '20px' }}>
                {formError && (
                  <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* ── TAB 1: Basic Info & Story ── */}
                {activeTab === 'general' && (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                      <div>
                        <label style={labelStyle}>Product Name *</label>
                        <input
                          required
                          value={formName}
                          onChange={e => setFormName(e.target.value)}
                          placeholder="e.g. Special Ratlami Sev, Khasta Methi Mathri"
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Hindi / Regional Name</label>
                        <input
                          value={formHindiName}
                          onChange={e => setFormHindiName(e.target.value)}
                          placeholder="e.g. रतलामी सेंव, खस्ता मेथी मठरी"
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
                        <label style={labelStyle}>Promotional Badge</label>
                        <input
                          value={formBadge}
                          onChange={e => setFormBadge(e.target.value)}
                          placeholder="e.g. Bestseller, Chai Companion, Most Popular"
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>Catchy Short Tagline</label>
                      <input
                        value={formTagline}
                        onChange={e => setFormTagline(e.target.value)}
                        placeholder="e.g. Clove-warm, peppery & bold authentic recipe"
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Short Storefront Description *</label>
                      <textarea
                        required
                        rows={3}
                        value={formDescription}
                        onChange={e => setFormDescription(e.target.value)}
                        placeholder="Describe the crispness, taste profile, and culinary heritage..."
                        style={{ ...inputStyle, resize: 'vertical' }}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Heritage &amp; Craft Story</label>
                      <textarea
                        rows={3}
                        value={formStory}
                        onChange={e => setFormStory(e.target.value)}
                        placeholder="Share the authentic grandmother recipe story, tradition, or regional heritage..."
                        style={{ ...inputStyle, resize: 'vertical' }}
                      />
                    </div>

                    {/* Visibility & Highlight Toggles */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', background: '#F8F6F2', padding: '14px', borderRadius: '10px', border: '1px solid #EAE3D2' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={formActive}
                          onChange={e => setFormActive(e.target.checked)}
                          style={{ accentColor: '#3C0815', width: '16px', height: '16px' }}
                        />
                        <span>Active (Visible in Store)</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={formIsVeg}
                          onChange={e => setFormIsVeg(e.target.checked)}
                          style={{ accentColor: '#059669', width: '16px', height: '16px' }}
                        />
                        <span style={{ color: '#065F46' }}>100% Pure Vegetarian</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={formFeatured}
                          onChange={e => setFormFeatured(e.target.checked)}
                          style={{ accentColor: '#D97706', width: '16px', height: '16px' }}
                        />
                        <span>Featured Star</span>
                      </label>
                    </div>

                    {/* Best Seller Special Option */}
                    <div
                      style={{
                        padding: '14px 16px',
                        borderRadius: '10px',
                        background: formIsBestSeller ? '#FEF3C7' : '#FAF8F4',
                        border: formIsBestSeller ? '1.5px solid #F59E0B' : '1px solid #EAE3D2',
                      }}
                    >
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formIsBestSeller}
                          onChange={e => setFormIsBestSeller(e.target.checked)}
                          style={{ accentColor: '#D97706', width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 800, fontSize: '13.5px', color: formIsBestSeller ? '#92400E' : '#3C0815' }}>
                              ★ Showcase in Homepage Top 4 Best Sellers
                            </span>
                            {formIsBestSeller && (
                              <span style={{ fontSize: '10px', fontWeight: 800, background: '#D97706', color: '#FFF', padding: '1px 6px', borderRadius: '999px' }}>
                                TOP 4 SLOT ACTIVE
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#78350F', lineHeight: 1.4 }}>
                            Directly links to the homepage 4 Best Sellers section.
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Combo Product Option */}
                    <div
                      style={{
                        padding: '14px 16px',
                        borderRadius: '10px',
                        background: formIsCombo ? '#FDF2F8' : '#FAF8F4',
                        border: formIsCombo ? '1.5px solid #DB2777' : '1px solid #EAE3D2',
                      }}
                    >
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formIsCombo}
                          onChange={e => setFormIsCombo(e.target.checked)}
                          style={{ accentColor: '#DB2777', width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 800, fontSize: '13.5px', color: formIsCombo ? '#9D174D' : '#3C0815' }}>
                              🎁 Combo Pack / Combo Delicacy
                            </span>
                            {formIsCombo && (
                              <span style={{ fontSize: '10px', fontWeight: 800, background: '#DB2777', color: '#FFF', padding: '1px 6px', borderRadius: '999px' }}>
                                COMBO ACTIVE
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#831843', lineHeight: 1.4 }}>
                            Check this box to mark this product as a Combo item. Combo-only discount coupons will be functional on orders containing combo products.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* ── TAB 2: Images & Gallery ── */}
                {activeTab === 'media' && (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: '#F8F6F2',
                          border: '1.5px dashed #D4AA45',
                          borderRadius: '8px',
                          padding: '12px 18px',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#3C0815',
                          cursor: uploadingImage ? 'wait' : 'pointer',
                        }}
                      >
                        <UploadCloud size={18} color="#D4AA45" />
                        <span>{uploadingImage ? 'Uploading to Cloudinary...' : 'Upload Image from Computer'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageFileUpload}
                          disabled={uploadingImage}
                          style={{ display: 'none' }}
                        />
                      </label>

                      <div style={{ display: 'flex', gap: '6px', flex: 1, minWidth: '240px' }}>
                        <input
                          placeholder="Or paste external image URL (e.g. /mishtichaat/chaat-plate.jpg)..."
                          value={imageUrlInput}
                          onChange={e => setImageUrlInput(e.target.value)}
                          style={{ ...inputStyle, flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={addImageUrl}
                          style={{ background: '#3C0815', color: '#FFF', border: 'none', borderRadius: '8px', padding: '0 16px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Add URL
                        </button>
                      </div>
                    </div>

                    {formImages.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '36px 16px', background: '#F9FAFB', border: '1px dashed #E5E7EB', borderRadius: '12px' }}>
                        <ImageIcon size={36} color="#9CA3AF" style={{ margin: '0 auto 8px' }} />
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#4B5563' }}>No product images added yet</div>
                        <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Upload photos or paste URLs. The first image will be set as primary storefront cover.</div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                        {formImages.map((img, idx) => (
                          <div
                            key={idx}
                            style={{
                              position: 'relative',
                              borderRadius: '10px',
                              border: idx === 0 ? '2px solid #D4AA45' : '1px solid #E5E7EB',
                              overflow: 'hidden',
                              background: '#F9FAFB',
                              aspectRatio: '1',
                              boxShadow: idx === 0 ? '0 4px 12px rgba(212,170,69,0.25)' : 'none',
                            }}
                          >
                            <img src={img} alt={`Preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            {idx === 0 ? (
                              <span style={{ position: 'absolute', top: '5px', left: '5px', background: '#3C0815', color: '#F0C74E', fontSize: '9.5px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                                ★ Primary Cover
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => makePrimaryImage(idx)}
                                style={{ position: 'absolute', top: '5px', left: '5px', background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '9.5px', fontWeight: 700, padding: '2px 6px', cursor: 'pointer' }}
                              >
                                Set Primary
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              style={{ position: 'absolute', top: '5px', right: '5px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
                              title="Delete photo"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB 3: Packaging & Pricing Variants ── */}
                {activeTab === 'variants' && (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#3C0815' }}>Packaging &amp; Weight Options</h4>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>Add multiple weight variants (e.g. 250g, 500g, 1kg, 800g Box of 16).</div>
                      </div>

                      {/* Quick Add Presets */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => addVariantRow({ label: '250g', price: 120, salePrice: 140 })}
                          style={presetBtnStyle}
                        >
                          + 250g
                        </button>
                        <button
                          type="button"
                          onClick={() => addVariantRow({ label: '500g', price: 230, salePrice: 270 })}
                          style={presetBtnStyle}
                        >
                          + 500g
                        </button>
                        <button
                          type="button"
                          onClick={() => addVariantRow({ label: '1kg', price: 440, salePrice: 520 })}
                          style={presetBtnStyle}
                        >
                          + 1kg
                        </button>
                        <button
                          type="button"
                          onClick={() => addVariantRow({ label: 'Box of 8 (400g)', price: 340, salePrice: 390 })}
                          style={presetBtnStyle}
                        >
                          + Sweet Box
                        </button>
                        <button
                          type="button"
                          onClick={() => addVariantRow()}
                          style={{ ...presetBtnStyle, background: '#3C0815', color: '#FFF', borderColor: '#3C0815' }}
                        >
                          <Plus size={13} /> Custom Variant
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: '10px' }}>
                      {formVariants.map((variant, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr)) auto',
                            gap: '10px',
                            alignItems: 'center',
                            background: '#F8F6F2',
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: '1px solid #EAE3D2',
                          }}
                        >
                          <div>
                            <label style={{ ...labelStyle, fontSize: '11px', marginBottom: '3px' }}>Weight / Pack Label *</label>
                            <input
                              required
                              value={variant.label}
                              onChange={e => updateVariantRow(idx, 'label', e.target.value)}
                              placeholder="e.g. 250g, 1kg, Box"
                              style={{ ...inputStyle, padding: '7px 10px', fontSize: '13px' }}
                            />
                          </div>

                          <div>
                            <label style={{ ...labelStyle, fontSize: '11px', marginBottom: '3px' }}>Selling Price (₹) *</label>
                            <input
                              required
                              type="number"
                              min="0"
                              value={variant.price}
                              onChange={e => updateVariantRow(idx, 'price', e.target.value)}
                              placeholder="₹ 140"
                              style={{ ...inputStyle, padding: '7px 10px', fontSize: '13px' }}
                            />
                          </div>

                          <div>
                            <label style={{ ...labelStyle, fontSize: '11px', marginBottom: '3px' }}>Original Strikethrough (₹)</label>
                            <input
                              type="number"
                              min="0"
                              value={variant.salePrice ?? ''}
                              onChange={e => updateVariantRow(idx, 'salePrice', e.target.value)}
                              placeholder="e.g. 165 (Shows % Off)"
                              style={{ ...inputStyle, padding: '7px 10px', fontSize: '13px' }}
                            />
                          </div>

                          <div>
                            <label style={{ ...labelStyle, fontSize: '11px', marginBottom: '3px' }}>Inventory Stock</label>
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
                              placeholder="MLW-RT-250G"
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
                                opacity: formVariants.length <= 1 ? 0.4 : 1,
                              }}
                              title="Delete variant"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── TAB 4: Ingredients & Flavor ── */}
                {activeTab === 'ingredients' && (
                  <div style={{ display: 'grid', gap: '18px' }}>
                    <div>
                      <label style={labelStyle}>Authentic Ingredients List</label>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                        <input
                          placeholder="Type an ingredient (e.g. Kasuri Methi, Pure Desi Ghee, Hing) and press Add or Enter..."
                          value={ingredientInput}
                          onChange={e => setIngredientInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddIngredient();
                            }
                          }}
                          style={{ ...inputStyle, flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={handleAddIngredient}
                          style={{ background: '#3C0815', color: '#FFF', border: 'none', borderRadius: '8px', padding: '0 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          + Add
                        </button>
                      </div>

                      {/* Ingredient Chips */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '40px', padding: '10px', background: '#F8F6F2', borderRadius: '8px', border: '1px solid #EAE3D2' }}>
                        {formIngredientsList.length === 0 ? (
                          <span style={{ fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic' }}>No ingredients added yet. Type above to add ingredient chips.</span>
                        ) : (
                          formIngredientsList.map((ing, idx) => (
                            <span
                              key={idx}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#FFF',
                                border: '1px solid #D4AA45',
                                color: '#3C0815',
                                padding: '4px 10px',
                                borderRadius: '999px',
                                fontSize: '12px',
                                fontWeight: 700,
                              }}
                            >
                              <span>{ing}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveIngredient(ing)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#991B1B', padding: 0, display: 'flex' }}
                              >
                                <X size={13} />
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                      <div>
                        <label style={labelStyle}>Spice Level</label>
                        <select
                          value={formSpiceLevel}
                          onChange={e => setFormSpiceLevel(e.target.value as any)}
                          style={inputStyle}
                        >
                          <option value="Mild">Mild (Gentle &amp; delicate)</option>
                          <option value="Medium">Medium (Balanced aromatic spices)</option>
                          <option value="Zesty">Zesty (Tangy Chaat Spices)</option>
                          <option value="Clove Hot">Clove Hot (Bold Laung warmth)</option>
                          <option value="Sweet & Tangy">Sweet &amp; Tangy (Khatta Meetha)</option>
                        </select>
                      </div>

                      <div>
                        <label style={labelStyle}>Customer Star Rating</label>
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          max="5"
                          value={formRating}
                          onChange={e => setFormRating(parseFloat(e.target.value) || 5.0)}
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Review Count</label>
                        <input
                          type="number"
                          min="0"
                          value={formReviewCount}
                          onChange={e => setFormReviewCount(parseInt(e.target.value, 10) || 0)}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 5: Specifications & Custom Fields ── */}
                {activeTab === 'specs' && (
                  <div style={{ display: 'grid', gap: '18px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                      <div>
                        <label style={labelStyle}>Shelf Life</label>
                        <input
                          value={formShelfLife}
                          onChange={e => setFormShelfLife(e.target.value)}
                          placeholder="e.g. 3 Months, 90 Days from manufacturing"
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Cooking Oil / Ghee Used</label>
                        <input
                          value={formOilUsed}
                          onChange={e => setFormOilUsed(e.target.value)}
                          placeholder="e.g. 100% Pure Cold-Pressed Groundnut Oil, Pure Cow Ghee"
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Dietary Standard</label>
                        <input
                          value={formDietaryStandard}
                          onChange={e => setFormDietaryStandard(e.target.value)}
                          placeholder="e.g. 100% Pure Vegetarian (Satvik)"
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Packaging Format</label>
                        <input
                          value={formPackagingType}
                          onChange={e => setFormPackagingType(e.target.value)}
                          placeholder="e.g. Food-Grade Multi-Layer Aroma Seal"
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    {/* Additional Custom Specifications Builder */}
                    <div style={{ borderTop: '1px solid #EAE3D2', paddingTop: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#3C0815' }}>
                            Additional Custom Specifications &amp; Fields
                          </h4>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>
                            Add any extra custom details (e.g. Allergen Info, Storage Conditions, FSSAI Lic No., Serving Suggestions).
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddCustomSpec}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#3C0815', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          <Plus size={14} /> Add Custom Field
                        </button>
                      </div>

                      {formCustomSpecs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', background: '#F8F6F2', borderRadius: '8px', border: '1px dashed #D4AA45', color: '#75645C', fontSize: '12.5px' }}>
                          No custom specifications added. Click <strong>"+ Add Custom Field"</strong> if you need to display additional rows in the Delicacy Specifications table.
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gap: '8px' }}>
                          {formCustomSpecs.map((spec, idx) => (
                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr auto', gap: '8px', alignItems: 'center', background: '#F8F6F2', padding: '8px 12px', borderRadius: '8px', border: '1px solid #EAE3D2' }}>
                              <input
                                placeholder="Field Label (e.g. Storage Advice)"
                                value={spec.label}
                                onChange={e => handleUpdateCustomSpec(idx, 'label', e.target.value)}
                                style={{ ...inputStyle, padding: '7px 10px', fontSize: '12.5px' }}
                              />
                              <input
                                placeholder="Value (e.g. Store in cool, dry container)"
                                value={spec.value}
                                onChange={e => handleUpdateCustomSpec(idx, 'value', e.target.value)}
                                style={{ ...inputStyle, padding: '7px 10px', fontSize: '12.5px' }}
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomSpec(idx)}
                                style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: '6px', width: '32px', height: '32px', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
                                title="Remove field"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div style={{ padding: '16px 24px', background: '#F8F6F2', borderTop: '1px solid #EAE3D2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {activeTab !== 'general' && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs: ModalTab[] = ['general', 'media', 'variants', 'ingredients', 'specs'];
                        const curIdx = tabs.indexOf(activeTab);
                        if (curIdx > 0) setActiveTab(tabs[curIdx - 1]);
                      }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '8px 14px', fontSize: '12.5px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}
                    >
                      <ChevronLeft size={14} /> Back
                    </button>
                  )}

                  {activeTab !== 'specs' && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs: ModalTab[] = ['general', 'media', 'variants', 'ingredients', 'specs'];
                        const curIdx = tabs.indexOf(activeTab);
                        if (curIdx < tabs.length - 1) setActiveTab(tabs[curIdx + 1]);
                      }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '8px 14px', fontSize: '12.5px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}
                    >
                      Next Step <ChevronRight size={14} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    disabled={formSubmitting}
                    style={{ background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', color: '#374151', cursor: 'pointer', fontWeight: 600 }}
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
                      padding: '9px 24px',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: formSubmitting ? 'wait' : 'pointer',
                      boxShadow: '0 2px 6px rgba(60,8,21,0.3)',
                    }}
                  >
                    {formSubmitting ? 'Saving Delicacy…' : editingProduct ? 'Save Changes' : 'Create Delicacy'}
                  </button>
                </div>
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

const tabBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '12px 14px',
  background: 'transparent',
  border: 'none',
  fontSize: '12.5px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all 0.15s ease',
};

const presetBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  background: '#FFF',
  border: '1px solid #D4AA45',
  color: '#3C0815',
  padding: '4px 10px',
  borderRadius: '6px',
  fontSize: '11.5px',
  fontWeight: 700,
  cursor: 'pointer',
};
