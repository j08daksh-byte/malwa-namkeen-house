import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IProductVariant {
  _id?: Types.ObjectId;
  label: string;             // e.g. "200g", "600g", "1.25kg", "Small Box", "Pack of 4"
  value?: number;            // e.g. 200, 600, 1.25, 4
  unit?: string;             // e.g. "g", "kg", "box", "pack", "pc"
  price: number;             // Standard price in INR (e.g. 150)
  salePrice?: number;        // Optional discounted sale price
  stock: number;             // Available inventory units
  sku: string;               // Unique stock keeping unit (e.g. "MLW-RT-200G")
  active: boolean;           // Variant availability toggle
  sortOrder: number;         // Ordering of variants on storefront
}

export interface ICustomSpecification {
  label: string;
  value: string;
}

export interface IProduct extends Document {
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
  customSpecifications?: ICustomSpecification[];
  isVegetarian: boolean;
  category: Types.ObjectId;
  images: string[];
  variants: IProductVariant[];
  featured: boolean;
  isBestSeller?: boolean;
  bestSellerAt?: Date;
  active: boolean;
  rating: number;
  reviewCount: number;
  badge?: string;
  createdAt: Date;
  updatedAt: Date;
}

const productVariantSchema = new Schema<IProductVariant>(
  {
    label: {
      type: String,
      required: [true, 'Variant label is required (e.g. 200g, 1.25kg, Box of 4)'],
      trim: true,
    },
    value: {
      type: Number,
      default: null,
    },
    unit: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Variant price is required'],
      min: [0, 'Price must be positive'],
    },
    salePrice: {
      type: Number,
      default: null,
      min: [0, 'Sale price must be positive'],
    },
    stock: {
      type: Number,
      required: [true, 'Stock count is required'],
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      trim: true,
      uppercase: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: true,
  }
);

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Product slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    hindiName: {
      type: String,
      trim: true,
      default: '',
    },
    tagline: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
    },
    story: {
      type: String,
      trim: true,
      default: '',
    },
    ingredients: {
      type: [String],
      default: [],
    },
    spiceLevel: {
      type: String,
      enum: ['Mild', 'Medium', 'Zesty', 'Clove Hot', 'Sweet & Tangy'],
      default: 'Medium',
    },
    shelfLife: {
      type: String,
      default: '90 Days',
    },
    oilUsed: {
      type: String,
      default: 'Pure Groundnut Oil',
    },
    dietaryStandard: {
      type: String,
      default: '100% Pure Vegetarian (Satvik)',
    },
    packagingType: {
      type: String,
      default: 'Food-Grade Multi-Layer Aroma Seal',
    },
    customSpecifications: [
      {
        label: { type: String, trim: true },
        value: { type: String, trim: true },
      },
    ],
    isVegetarian: {
      type: Boolean,
      default: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category reference is required'],
      index: true,
    },
    images: {
      type: [String],
      default: [],
    },
    variants: {
      type: [productVariantSchema],
      validate: {
        validator: function (v: IProductVariant[]) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'A product must have at least one variant with pricing and stock.',
      },
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
      index: true,
    },
    bestSellerAt: {
      type: Date,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 1,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
      badge: {
        type: String,
        trim: true,
        default: '',
      },
    },
    {
      timestamps: true,
    }
  );

  // Compound Indexes for fast storefront & shop filtering
  productSchema.index({ active: 1, category: 1, createdAt: -1 });
  productSchema.index({ active: 1, isBestSeller: 1, bestSellerAt: -1 });
  productSchema.index({ active: 1, featured: 1, createdAt: -1 });
  productSchema.index({ 'variants.sku': 1 });

  export const Product: Model<IProduct> =
    mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);
