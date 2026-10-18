// server/api-entry.ts
import express from "express";
import cookieParser from "cookie-parser";
import mongoose33 from "mongoose";

// server/lib/mongodb.ts
import mongoose5 from "mongoose";

// server/models/User.ts
import mongoose, { Schema } from "mongoose";
var userAddressSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true, default: "" },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true, default: "" },
    isDefault: { type: Boolean, default: false }
  },
  { _id: true }
);
var userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true,
      default: ""
    },
    googleId: {
      type: String,
      sparse: true,
      index: true
    },
    avatar: {
      type: String,
      default: ""
    },
    password: {
      type: String,
      required: function() {
        return !this.invitationTokenHash && !this.googleId;
      },
      select: false
      // Never return password hash in queries by default
    },
    role: {
      type: String,
      enum: ["customer", "admin", "super_admin"],
      default: "customer",
      required: true
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    },
    addresses: {
      type: [userAddressSchema],
      default: []
    },
    wishlist: {
      type: [{ type: Schema.Types.ObjectId, ref: "Product" }],
      default: []
    },
    lastLoginAt: {
      type: Date,
      default: null
    },
    emailVerifiedAt: {
      type: Date,
      default: null
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
      index: true,
      default: null
    },
    passwordResetExpiresAt: {
      type: Date,
      default: null
    },
    invitationTokenHash: {
      type: String,
      select: false,
      index: true,
      default: null
    },
    invitationExpiresAt: {
      type: Date,
      default: null
    },
    invitationAcceptedAt: {
      type: Date,
      default: null
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    invitedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);
userSchema.index({ role: 1, createdAt: -1, active: 1 });
var User = mongoose.models.User || mongoose.model("User", userSchema);

// server/models/Category.ts
import mongoose2, { Schema as Schema2 } from "mongoose";
var categorySchema = new Schema2(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true
    },
    slug: {
      type: String,
      required: [true, "Category slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    image: {
      type: String,
      default: ""
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true
    }
  },
  {
    timestamps: true
  }
);
var Category = mongoose2.models.Category || mongoose2.model("Category", categorySchema);

// server/models/Product.ts
import mongoose3, { Schema as Schema3 } from "mongoose";
var productVariantSchema = new Schema3(
  {
    label: {
      type: String,
      required: [true, "Variant label is required (e.g. 200g, 1.25kg, Box of 4)"],
      trim: true
    },
    value: {
      type: Number,
      default: null
    },
    unit: {
      type: String,
      trim: true,
      default: ""
    },
    price: {
      type: Number,
      required: [true, "Variant price is required"],
      min: [0, "Price must be positive"]
    },
    salePrice: {
      type: Number,
      default: null,
      min: [0, "Sale price must be positive"]
    },
    stock: {
      type: Number,
      required: [true, "Stock count is required"],
      default: 0,
      min: [0, "Stock cannot be negative"]
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      trim: true,
      uppercase: true
    },
    active: {
      type: Boolean,
      default: true
    },
    sortOrder: {
      type: Number,
      default: 0
    },
    restoredOrderOps: {
      type: [String],
      default: []
    }
  },
  {
    _id: true
  }
);
var productSchema = new Schema3(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true
    },
    slug: {
      type: String,
      required: [true, "Product slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    hindiName: {
      type: String,
      trim: true,
      default: ""
    },
    tagline: {
      type: String,
      trim: true,
      default: ""
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true
    },
    story: {
      type: String,
      trim: true,
      default: ""
    },
    ingredients: {
      type: [String],
      default: []
    },
    spiceLevel: {
      type: String,
      enum: ["Mild", "Medium", "Zesty", "Clove Hot", "Sweet & Tangy"],
      default: "Medium"
    },
    shelfLife: {
      type: String,
      default: "90 Days"
    },
    oilUsed: {
      type: String,
      default: "Pure Groundnut Oil"
    },
    dietaryStandard: {
      type: String,
      default: "100% Pure Vegetarian (Satvik)"
    },
    packagingType: {
      type: String,
      default: "Food-Grade Multi-Layer Aroma Seal"
    },
    customSpecifications: [
      {
        label: { type: String, trim: true },
        value: { type: String, trim: true }
      }
    ],
    isVegetarian: {
      type: Boolean,
      default: true
    },
    category: {
      type: Schema3.Types.ObjectId,
      ref: "Category",
      required: [true, "Product category reference is required"],
      index: true
    },
    images: {
      type: [String],
      default: []
    },
    variants: {
      type: [productVariantSchema],
      validate: {
        validator: function(v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: "A product must have at least one variant with pricing and stock."
      }
    },
    featured: {
      type: Boolean,
      default: false,
      index: true
    },
    isBestSeller: {
      type: Boolean,
      default: false,
      index: true
    },
    bestSellerAt: {
      type: Date,
      default: null
    },
    isCombo: {
      type: Boolean,
      default: false,
      index: true
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    badge: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true
  }
);
productSchema.index({ active: 1, category: 1, createdAt: -1 });
productSchema.index({ active: 1, isBestSeller: 1, bestSellerAt: -1 });
productSchema.index({ active: 1, featured: 1, createdAt: -1 });
productSchema.index({ "variants.sku": 1 });
var Product = mongoose3.models.Product || mongoose3.model("Product", productSchema);

// src-rebuild/data/products.ts
var SHOP_CATEGORIES = [
  {
    id: "all",
    label: "All Delicacies",
    shortLabel: "All",
    description: "Explore our complete heritage collection of small-batch savouries, sweets, and curated gift boxes."
  },
  {
    id: "sev-namkeen",
    label: "Signature Sev & Namkeens",
    shortLabel: "Sev & Namkeen",
    description: "Clove-infused, crisp, thick & fine sevs extruded by hand and fried in pure cold-pressed groundnut oil."
  },
  {
    id: "mixtures-chivda",
    label: "Heritage Mixtures & Chivdas",
    shortLabel: "Mixtures",
    description: "Time-honoured Malwa blends balancing sweet, tangy, and fiery spices with nuts, boondi, and lentils."
  },
  {
    id: "khasta-mathri",
    label: "Crisp Khasta & Mathris",
    shortLabel: "Mathri & Snacks",
    description: "Slow-fried flaky crackers and carom-seed delicacies crafted for afternoon chai rituals."
  },
  {
    id: "mithai-sweets",
    label: "Royal Mithai & Sweets",
    shortLabel: "Sweets & Laddoos",
    description: "Artisanal sweets slow-cooked in 100% pure desi cow ghee with saffron, cardamom, and dry fruits."
  },
  {
    id: "gift-hampers",
    label: "Luxury Gifting & Hampers",
    shortLabel: "Gift Hampers",
    description: "Handcrafted heritage gift boxes designed for weddings, festive occasions, and corporate gifting."
  },
  {
    id: "falahari-fasting",
    label: "Falahari & Fasting Specials",
    shortLabel: "Falahari & Fasting",
    description: "Pure sendha namak fasting delicacies, crispy potato laccha, and roasted peanut blends."
  }
];
var PRODUCTS = [
  // ── 1. Sev & Namkeen (3 items, 1 Best Seller) ───────────────────────────
  {
    id: "ratlami-sev-special",
    slug: "ratlami-sev-special",
    name: "Special Ratlami Sev",
    hindiName: "\u0930\u0924\u0932\u093E\u092E\u0940 \u0938\u0947\u0902\u0935",
    tagline: "Clove-warm, peppery & bold",
    category: "sev-namkeen",
    categoryLabel: "Signature Sev",
    description: "The crown jewel of Malwa namkeens. Thick, textured gram flour sev infused with freshly ground cloves, black pepper, and hing.",
    story: "Prepared using our grandmother\u2019s 70-year-old proportion of Laung (cloves) and Kali Mirch, kneaded by hand and fried to a deep golden crunch.",
    ingredients: ["Gram Flour (Besan)", "Whole Cloves (Laung)", "Black Pepper", "Carom Seeds (Ajwain)", "Asafoetida (Hing)", "Cold-Pressed Groundnut Oil", "Rock Salt"],
    spiceLevel: "Clove Hot",
    shelfLife: "4 Months",
    image: "/hero-banner-1.png",
    images: ["/hero-banner-1.png"],
    badge: "Bestseller",
    featured: true,
    isBestSeller: true,
    rating: 4.9,
    reviewCount: 342,
    options: [
      { weight: "250g", price: 120, originalPrice: 140 },
      { weight: "500g", price: 230, originalPrice: 270 },
      { weight: "1kg", price: 440, originalPrice: 520 }
    ],
    isAvailable: true,
    isVegetarian: true,
    oilUsed: "Cold-Pressed Groundnut Oil"
  },
  {
    id: "ujjaini-sev-classic",
    slug: "ujjaini-sev-classic",
    name: "Royal Ujjaini Sev",
    hindiName: "\u0909\u091C\u094D\u091C\u0948\u0928\u0940 \u0938\u0947\u0902\u0935",
    tagline: "Light, delicate & golden",
    category: "sev-namkeen",
    categoryLabel: "Signature Sev",
    description: "Delicate, bright-golden fine sev with a subtle hint of ajwain and mild spices. Perfect for garnishing poha, chaats, or savoring by the handful.",
    story: "The unmistakable street-side flavour of Ujjain, made extra crispy and light on the palate so you can never stop at just one bowl.",
    ingredients: ["Besan", "Carom Seeds", "Turmeric", "Cumin", "Cold-Pressed Groundnut Oil", "Himalayan Pink Salt"],
    spiceLevel: "Mild",
    shelfLife: "4 Months",
    image: "/mishtichaat/hero-food.jpg",
    images: ["/mishtichaat/hero-food.jpg"],
    badge: "Heritage Classic",
    featured: false,
    isBestSeller: false,
    rating: 4.8,
    reviewCount: 218,
    options: [
      { weight: "250g", price: 110, originalPrice: 130 },
      { weight: "500g", price: 210, originalPrice: 250 },
      { weight: "1kg", price: 400, originalPrice: 480 }
    ],
    isAvailable: true,
    isVegetarian: true,
    oilUsed: "Cold-Pressed Groundnut Oil"
  },
  {
    id: "laung-sev-teekha",
    slug: "laung-sev-teekha",
    name: "Teekha Laung Sev",
    hindiName: "\u0932\u094C\u0902\u0917 \u0938\u0947\u0902\u0935",
    tagline: "Intense Malwa clove aroma",
    category: "sev-namkeen",
    categoryLabel: "Signature Sev",
    description: "Extra aromatic sev packed with coarsely crushed Zanzibari cloves and roasted spices. The authentic accompaniment to Indori Poha and Usal.",
    story: "In Malwa households, winter mornings are incomplete without the comforting, warm tingle of fresh clove sev.",
    ingredients: ["Gram Flour", "Premium Zanzibari Cloves", "Black Pepper", "Red Chilli", "Groundnut Oil", "Rock Salt"],
    spiceLevel: "Clove Hot",
    shelfLife: "4 Months",
    image: "/hero-banner-2.png",
    images: ["/hero-banner-2.png"],
    badge: "Spicy Favorite",
    featured: false,
    isBestSeller: false,
    rating: 4.8,
    reviewCount: 156,
    options: [
      { weight: "250g", price: 125, originalPrice: 145 },
      { weight: "500g", price: 235, originalPrice: 280 },
      { weight: "1kg", price: 450, originalPrice: 540 }
    ],
    isAvailable: true,
    isVegetarian: true,
    oilUsed: "Cold-Pressed Groundnut Oil"
  },
  // ── 2. Mixtures & Chivda (3 items, 1 Best Seller) ───────────────────────
  {
    id: "indori-khatta-meetha",
    slug: "indori-khatta-meetha",
    name: "Indori Khatta Meetha Mixture",
    hindiName: "\u0916\u091F\u094D\u091F\u093E \u092E\u0940\u0920\u093E \u092E\u093F\u0915\u094D\u0938\u091A\u0930",
    tagline: "Sweet, tangy & crunchy medley",
    category: "mixtures-chivda",
    categoryLabel: "Heritage Mixture",
    description: "An irresistible medley of golden sev, crispy sago wafers, fried groundnuts, boondi, and plump golden raisins tossed in our signature sweet & tangy spice dust.",
    story: "Captures the quintessential spirit of Indore\u2019s Sarafa Bazaar \u2014 every bite transitions from tangy amchur to warm sweet raisins and crunchy peanuts.",
    ingredients: ["Crisp Sev", "Sago Wafers (Sabudana)", "Roasted Peanuts", "Fried Boondi", "Golden Raisins", "Dry Mango Powder", "Raw Sugar", "Cold-Pressed Groundnut Oil"],
    spiceLevel: "Sweet & Tangy",
    shelfLife: "4 Months",
    image: "/mishtichaat/hero-food.jpg",
    images: ["/mishtichaat/hero-food.jpg"],
    badge: "Bestseller",
    featured: true,
    isBestSeller: true,
    rating: 4.9,
    reviewCount: 412,
    options: [
      { weight: "250g", price: 125, originalPrice: 150 },
      { weight: "500g", price: 240, originalPrice: 290 },
      { weight: "1kg", price: 460, originalPrice: 560 }
    ],
    isAvailable: true,
    isVegetarian: true,
    oilUsed: "Cold-Pressed Groundnut Oil"
  },
  {
    id: "royal-kaju-dalmoth",
    slug: "royal-kaju-dalmoth",
    name: "Shahi Kaju Dalmoth",
    hindiName: "\u0936\u093E\u0939\u0940 \u0915\u093E\u091C\u0942 \u0926\u093E\u0932\u092E\u094B\u0920",
    tagline: "Fried whole masoor with roasted cashews",
    category: "mixtures-chivda",
    categoryLabel: "Heritage Mixture",
    description: "Crispy whole brown lentils, roasted jumbo cashews, melon seeds, and fine sev seasoned with an aromatic royal garam masala blend.",
    story: "Originally reserved for royal durbars and festive evenings, this rich Dalmoth delivers unmatched crunch and rich nutty undertones.",
    ingredients: ["Whole Brown Lentils (Masoor)", "Jumbo Cashews", "Melon Seeds (Magaz)", "Fine Gram Flour Sev", "Black Pepper", "Cloves", "Groundnut Oil", "Rock Salt"],
    spiceLevel: "Medium",
    shelfLife: "3 Months",
    image: "/mishtichaat/hero-food.jpg",
    images: ["/mishtichaat/hero-food.jpg"],
    badge: "Chef\u2019s Selection",
    featured: false,
    isBestSeller: false,
    rating: 4.9,
    reviewCount: 184,
    options: [
      { weight: "250g", price: 190, originalPrice: 220 },
      { weight: "500g", price: 360, originalPrice: 420 },
      { weight: "1kg", price: 700, originalPrice: 820 }
    ],
    isAvailable: true,
    isVegetarian: true,
    oilUsed: "Cold-Pressed Groundnut Oil"
  },
  {
    id: "heeng-jeera-sev",
    slug: "heeng-jeera-sev",
    name: "Aromatic Heeng Sev",
    hindiName: "\u0939\u0940\u0902\u0917 \u0938\u0947\u0902\u0935",
    tagline: "Pure Bandhani Hing & roasted cumin",
    category: "mixtures-chivda",
    categoryLabel: "Heritage Savouries",
    description: "Infused with potent compounded Hathras hing and freshly roasted jeera. Wonderfully fragrant and deeply digestive.",
    story: "Kneaded with high-potency hing steeped overnight in warm water, ensuring every single strand delivers intoxicating aroma.",
    ingredients: ["Gram Flour", "Pure Compounded Hing", "Roasted Cumin", "Ginger Powder", "Groundnut Oil", "Pink Salt"],
    spiceLevel: "Medium",
    shelfLife: "4 Months",
    image: "/hero-banner-2.png",
    images: ["/hero-banner-2.png"],
    badge: "Digestive Blend",
    featured: false,
    isBestSeller: false,
    rating: 4.7,
    reviewCount: 98,
    options: [
      { weight: "250g", price: 120, originalPrice: 140 },
      { weight: "500g", price: 230, originalPrice: 270 },
      { weight: "1kg", price: 440, originalPrice: 520 }
    ],
    isAvailable: true,
    isVegetarian: true,
    oilUsed: "Cold-Pressed Groundnut Oil"
  },
  // ── 3. Khasta & Mathri (2 items, 1 Best Seller) ─────────────────────────
  {
    id: "flaky-methi-mathri",
    slug: "flaky-methi-mathri",
    name: "Khasta Methi Mathri",
    hindiName: "\u0916\u0938\u094D\u0924\u093E \u092E\u0947\u0925\u0940 \u092E\u0920\u0930\u0940",
    tagline: "Flaky layers with kasuri methi & ajwain",
    category: "khasta-mathri",
    categoryLabel: "Khasta & Mathri",
    description: "Layered, melt-in-mouth wheat crackers scented with sun-dried Rajasthani fenugreek leaves, crushed peppercorns, and ajwain.",
    story: "Hand-pricked and slow-fried over gentle heat for more than 40 minutes to create delicate flaky blisters that shatter satisfyingly.",
    ingredients: ["Stone Ground Wheat Flour", "Kasuri Methi", "Carom Seeds", "Coarse Black Pepper", "Pure Ghee Moin", "Groundnut Oil", "Rock Salt"],
    spiceLevel: "Mild",
    shelfLife: "3 Months",
    image: "/mishtichaat/kachori.jpg",
    images: ["/mishtichaat/kachori.jpg"],
    badge: "Bestseller",
    featured: true,
    isBestSeller: true,
    rating: 4.9,
    reviewCount: 265,
    options: [
      { weight: "300g", price: 140, originalPrice: 165 },
      { weight: "600g", price: 270, originalPrice: 320 },
      { weight: "1kg", price: 430, originalPrice: 510 }
    ],
    isAvailable: true,
    isVegetarian: true,
    oilUsed: "Cold-Pressed Groundnut Oil & Ghee"
  },
  {
    id: "chana-zor-garam-spiced",
    slug: "chana-zor-garam-spiced",
    name: "Malwa Chana Zor Garam",
    hindiName: "\u091A\u0928\u093E \u091C\u093C\u094B\u0930 \u0917\u0930\u092E",
    tagline: "Pressed black chickpeas with tangy masala",
    category: "khasta-mathri",
    categoryLabel: "Khasta & Mathri",
    description: "Flattened roasted black gram tossed in dry mango powder, roasted cumin, black salt, and tangy chaat spices. High protein & guilt-free crunch.",
    story: "An ode to traditional street hawkers, flattened by heavy brass presses and dusted with our house amchur-pudina seasoning.",
    ingredients: ["Flattened Black Chickpeas", "Roasted Cumin", "Dry Mango Powder", "Mint Leaf Powder", "Black Salt", "Cold-Pressed Groundnut Oil"],
    spiceLevel: "Zesty",
    shelfLife: "4 Months",
    image: "/mishtichaat/kachori.jpg",
    images: ["/mishtichaat/kachori.jpg"],
    badge: "Tangy Crunch",
    featured: false,
    isBestSeller: false,
    rating: 4.8,
    reviewCount: 142,
    options: [
      { weight: "250g", price: 110, originalPrice: 130 },
      { weight: "500g", price: 210, originalPrice: 250 },
      { weight: "1kg", price: 400, originalPrice: 480 }
    ],
    isAvailable: true,
    isVegetarian: true,
    oilUsed: "Cold-Pressed Groundnut Oil"
  },
  // ── 4. Royal Mithai & Sweets (2 items, 1 Best Seller) ───────────────────
  {
    id: "shahi-besan-ladoo",
    slug: "shahi-besan-ladoo",
    name: "Desi Ghee Besan Ladoo",
    hindiName: "\u0936\u0941\u0926\u094D\u0927 \u0918\u0940 \u092C\u0947\u0938\u0928 \u0932\u0921\u094D\u0921\u0942",
    tagline: "Coarse gram flour slow-roasted in cow ghee",
    category: "mithai-sweets",
    categoryLabel: "Royal Mithai",
    description: "Melt-in-mouth artisanal ladoos crafted from coarsely milled chana dal, slow-roasted for 3 hours in pure cow ghee and finished with green cardamom and slivered pistachios.",
    story: "The hallmark of festive hospitality, made strictly with hand-bilona cow ghee and unrefined boora sugar for a heavenly grainy texture.",
    ingredients: ["Coarse Gram Flour (Danedar Besan)", "100% Pure Desi Cow Ghee", "Unrefined Boora Sugar", "Green Cardamom", "Pistachio Slivers", "Saffron"],
    spiceLevel: "Mild",
    shelfLife: "45 Days",
    image: "/mishtichaat/hero-sweets.jpg",
    images: ["/mishtichaat/hero-sweets.jpg"],
    badge: "Bestseller",
    featured: true,
    isBestSeller: true,
    rating: 5,
    reviewCount: 289,
    options: [
      { weight: "400g (Box of 8)", price: 340, originalPrice: 390 },
      { weight: "800g (Box of 16)", price: 650, originalPrice: 750 }
    ],
    isAvailable: true,
    isVegetarian: true,
    oilUsed: "100% Pure Desi Cow Ghee"
  },
  {
    id: "saffron-rabdi-jalebi-pack",
    slug: "saffron-rabdi-jalebi-pack",
    name: "Kashi Saffron Jalebi Sweet Pack",
    hindiName: "\u0936\u093E\u0939\u0940 \u091C\u0932\u0947\u092C\u0940 \u092A\u0948\u0915",
    tagline: "Crisp spirals soaked in saffron rose syrup",
    category: "mithai-sweets",
    categoryLabel: "Royal Mithai",
    description: "Golden fermented batter crisped in cow ghee and drenched in saffron-cardamom nectar. Vacuum packed to retain fresh crispness.",
    story: "The legendary taste of morning delicacies, crafted by our third-generation halwais with pure Kashmiri saffron.",
    ingredients: ["Refined Flour", "Pure Desi Ghee", "Kashmiri Kesar (Saffron)", "Cardamom", "Rose Water", "Sugar Syrup"],
    spiceLevel: "Mild",
    shelfLife: "15 Days",
    image: "/mishtichaat/jalebi.jpg",
    images: ["/mishtichaat/jalebi.jpg"],
    badge: "Pure Desi Ghee",
    featured: false,
    isBestSeller: false,
    rating: 4.8,
    reviewCount: 178,
    options: [
      { weight: "500g", price: 320, originalPrice: 370 },
      { weight: "1kg", price: 620, originalPrice: 720 }
    ],
    isAvailable: true,
    isVegetarian: true,
    oilUsed: "100% Pure Desi Cow Ghee"
  },
  // ── 5. Luxury Gifting & Hampers (2 items) ────────────────────────────────
  {
    id: "royal-malwa-hamper",
    slug: "royal-malwa-hamper",
    name: "The Royal Malwa Heritage Hamper",
    hindiName: "\u0936\u093E\u0939\u0940 \u092E\u093E\u0932\u0935\u093E \u0909\u092A\u0939\u093E\u0930 \u092A\u0947\u091F\u0940",
    tagline: "Luxury velvet box with 6 signature items",
    category: "gift-hampers",
    categoryLabel: "Luxury Gifting",
    description: "A lavish velvet-lined heirloom box containing Special Ratlami Sev (250g), Indori Khatta Meetha (250g), Shahi Kaju Dalmoth (250g), Khasta Methi Mathri (300g), Desi Ghee Besan Ladoos (400g), and Brass Serving Spoon with customized greeting card.",
    story: "Created for joyous family reunions, festive Diwali & wedding gifting, presenting the absolute best of Malwa\u2019s culinary treasures in royal regalia.",
    ingredients: ["Assorted Namkeens", "Pure Ghee Besan Ladoos", "Artisanal Brass Spoon", "Luxury Velvet Packaging"],
    spiceLevel: "Medium",
    shelfLife: "60 Days",
    image: "/hero-banner-1.png",
    images: ["/hero-banner-1.png"],
    badge: "Luxury Gift Edition",
    featured: false,
    isBestSeller: false,
    isCombo: true,
    rating: 5,
    reviewCount: 94,
    options: [
      { weight: "Standard Luxury Box (1.7kg)", price: 1450, originalPrice: 1750 },
      { weight: "Grand Royal Hamper (2.6kg)", price: 2200, originalPrice: 2600 }
    ],
    isAvailable: true,
    isVegetarian: true,
    oilUsed: "Pure Cold-Pressed Oils & Cow Ghee"
  },
  {
    id: "chaat-lover-box",
    slug: "chaat-lover-box",
    name: "Sarafa Street Chaat Craver Kit",
    hindiName: "\u0938\u0930\u093E\u092B\u093E \u091A\u093E\u091F \u0915\u093F\u091F",
    tagline: "Everything for an authentic street-chaat feast",
    category: "gift-hampers",
    categoryLabel: "Gift Box",
    description: "Includes Ujjaini Fine Sev (500g), Crispy Papdi (300g), Khasta Kachori crisps (250g), and our proprietary Sarafa Chaat Masala jar (100g).",
    story: "Bring the sensory excitement of Sarafa Night Market directly to your living room. Just add curd and boiled potatoes for instant festive chaat.",
    ingredients: ["Fine Sev", "Crispy Papdi", "Khasta Cracker", "Sarafa Special Chaat Masala Jar"],
    spiceLevel: "Zesty",
    shelfLife: "3 Months",
    image: "/mishtichaat/kachori.jpg",
    images: ["/mishtichaat/kachori.jpg"],
    badge: "Party Hit",
    featured: false,
    isBestSeller: false,
    isCombo: true,
    rating: 4.9,
    reviewCount: 167,
    options: [
      { weight: "Full Kit (1.15kg)", price: 580, originalPrice: 680 }
    ],
    isAvailable: true,
    isVegetarian: true,
    oilUsed: "Cold-Pressed Groundnut Oil"
  },
  // ── 6. Falahari & Fasting Specials (2 items) ────────────────────────────
  {
    id: "falahari-potato-mixture",
    slug: "falahari-potato-mixture",
    name: "Teekha Falahari Chivda",
    hindiName: "\u092B\u0932\u093E\u0939\u093E\u0930\u0940 \u091A\u093F\u0935\u0921\u093C\u093E",
    tagline: "Fasting-friendly potato shreds & peanuts",
    category: "falahari-fasting",
    categoryLabel: "Falahari Specials",
    description: "Crispy hand-cut potato shreds, crunchy peanuts, and curry leaves seasoned strictly with sendha namak (rock salt) and green chillies.",
    story: "Prepared in dedicated vessels for pious fasting days, yet loved every single day for its addictive lightness.",
    ingredients: ["Crisp Potato Laccha", "Roasted Peanuts", "Sendha Namak (Rock Salt)", "Green Chillies", "Curry Leaves", "Cold-Pressed Peanut Oil"],
    spiceLevel: "Medium",
    shelfLife: "3 Months",
    image: "/mishtichaat/Image-1.png",
    images: ["/mishtichaat/Image-1.png"],
    badge: "Fast Friendly",
    featured: false,
    isBestSeller: false,
    rating: 4.7,
    reviewCount: 115,
    options: [
      { weight: "250g", price: 135, originalPrice: 160 },
      { weight: "500g", price: 260, originalPrice: 310 },
      { weight: "1kg", price: 490, originalPrice: 590 }
    ],
    isAvailable: true,
    isVegetarian: true,
    oilUsed: "Cold-Pressed Groundnut Oil"
  },
  {
    id: "festive-mithai-box-trio",
    slug: "festive-mithai-box-trio",
    name: "Banaras Ki Muskan Mithai Box",
    hindiName: "\u092C\u0928\u093E\u0930\u0938 \u0915\u0940 \u092E\u0941\u0938\u094D\u0915\u093E\u0928",
    tagline: "Trio of handcrafted pure ghee confections",
    category: "falahari-fasting",
    categoryLabel: "Festive Specials",
    description: "A curated festive trio box of Desi Ghee Besan Ladoo, Saffron Peda, and Dry Fruit Halwa confections adorned with silver vark and whole pistachios.",
    story: "Prepared in limited morning batches in copper cauldrons with pure A2 cow milk derivatives and slow-simmered sugar reductions.",
    ingredients: ["A2 Milk Khoya", "Besan", "Pure Cow Ghee", "Pistachios", "Almonds", "Cardamom", "Kashmiri Kesar"],
    spiceLevel: "Mild",
    shelfLife: "25 Days",
    image: "/mishtichaat/hero-sweets.jpg",
    images: ["/mishtichaat/hero-sweets.jpg"],
    badge: "Festive Limited",
    featured: false,
    isBestSeller: false,
    rating: 5,
    reviewCount: 203,
    options: [
      { weight: "Box of 12 (500g)", price: 480, originalPrice: 550 },
      { weight: "Box of 24 (1kg)", price: 920, originalPrice: 1050 }
    ],
    isAvailable: true,
    isVegetarian: true,
    oilUsed: "100% Pure Desi Cow Ghee"
  }
];

// server/lib/auth.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import mongoose4 from "mongoose";
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  const isProd2 = process.env.NODE_ENV === "production";
  if (isProd2) {
    if (!secret || secret.trim().length < 32) {
      throw new Error("[Security Error] Production JWT_SECRET is required and must be at least 32 characters long.");
    }
    return secret.trim();
  }
  return secret?.trim() || "malwa-namkeen-dev-only-secret-key-2026";
}
var TOKEN_EXPIRY = "7d";
var AUTH_COOKIE_NAME = "malwa_auth_token";
async function hashPassword(plainText) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}
async function comparePassword(plainText, hash) {
  return bcrypt.compare(plainText, hash);
}
function generateToken(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: TOKEN_EXPIRY });
}
function verifyToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
}
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
    return req.cookies[AUTH_COOKIE_NAME];
  }
  return null;
}
function setAuthCookie(res, token) {
  const isProd2 = process.env.NODE_ENV === "production";
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd2,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1e3,
    // 7 days
    path: "/"
  });
}
function clearAuthCookie(res) {
  const isProd2 = process.env.NODE_ENV === "production";
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd2,
    sameSite: "lax",
    path: "/"
  });
}
async function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({
      success: false,
      message: "Authentication required. Please sign in."
    });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired session. Please sign in again."
    });
    return;
  }
  if (mongoose4.connection.readyState === 1 && payload.userId && mongoose4.Types.ObjectId.isValid(payload.userId)) {
    try {
      const user = await User.findById(payload.userId).select("role active");
      if (!user) {
        res.status(401).json({
          success: false,
          message: "Account not found. Please sign in again."
        });
        return;
      }
      if (!user.active) {
        res.status(403).json({
          success: false,
          message: "Account is deactivated. Please contact support."
        });
        return;
      }
      payload.role = user.role;
    } catch {
    }
  }
  req.user = payload;
  res.locals.user = payload;
  next();
}
async function requireAdmin(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({
      success: false,
      message: "Authentication required. Please sign in."
    });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired session. Please sign in again."
    });
    return;
  }
  if (mongoose4.connection.readyState === 1 && payload.userId && mongoose4.Types.ObjectId.isValid(payload.userId)) {
    try {
      const user = await User.findById(payload.userId).select("role active");
      if (!user) {
        res.status(401).json({
          success: false,
          message: "Account not found. Please sign in again."
        });
        return;
      }
      if (!user.active) {
        res.status(403).json({
          success: false,
          message: "Account is deactivated. Please contact an administrator."
        });
        return;
      }
      if (user.role !== "admin" && user.role !== "super_admin") {
        res.status(403).json({
          success: false,
          message: "Access denied. Administrator privilege required."
        });
        return;
      }
      payload.role = user.role;
    } catch {
      if (payload.role !== "admin" && payload.role !== "super_admin") {
        res.status(403).json({
          success: false,
          message: "Access denied. Administrator privilege required."
        });
        return;
      }
    }
  } else {
    if (payload.role !== "admin" && payload.role !== "super_admin") {
      res.status(403).json({
        success: false,
        message: "Access denied. Administrator privilege required."
      });
      return;
    }
  }
  req.user = payload;
  res.locals.user = payload;
  next();
}
async function requireSuperAdmin(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({
      success: false,
      message: "Authentication required. Please sign in."
    });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired session. Please sign in again."
    });
    return;
  }
  if (mongoose4.connection.readyState === 1 && payload.userId && mongoose4.Types.ObjectId.isValid(payload.userId)) {
    try {
      const user = await User.findById(payload.userId).select("role active");
      if (!user) {
        res.status(401).json({
          success: false,
          message: "Account not found. Please sign in again."
        });
        return;
      }
      if (!user.active) {
        res.status(403).json({
          success: false,
          message: "Account is deactivated. Please contact an administrator."
        });
        return;
      }
      if (user.role !== "super_admin") {
        res.status(403).json({
          success: false,
          message: "Access denied. Super Administrator privilege required."
        });
        return;
      }
      payload.role = user.role;
    } catch {
      if (payload.role !== "super_admin") {
        res.status(403).json({
          success: false,
          message: "Access denied. Super Administrator privilege required."
        });
        return;
      }
    }
  } else {
    if (payload.role !== "super_admin") {
      res.status(403).json({
        success: false,
        message: "Access denied. Super Administrator privilege required."
      });
      return;
    }
  }
  req.user = payload;
  res.locals.user = payload;
  next();
}

// server/lib/dbGuard.ts
var KNOWN_PRODUCTION_DB_NAMES = [
  "malwa_namkeen",
  "malwa-namkeen",
  "malwanamkeen",
  "production",
  "prod",
  "admin",
  "local",
  "config"
];
function extractDatabaseNameFromUri(uri) {
  if (!uri || typeof uri !== "string") return null;
  try {
    const withoutQuery = uri.split("?")[0].split("#")[0].trim();
    const match = withoutQuery.match(/^mongodb(?:\+srv)?:\/\/[^\/]+\/([^/\s]+)$/i);
    if (match && match[1]) {
      const decoded = decodeURIComponent(match[1]).trim();
      return decoded || null;
    }
  } catch {
  }
  return null;
}
function validateTestDatabaseName({
  testDbName,
  prodDbName = process.env.MONGODB_DB_NAME || "malwa_namkeen"
}) {
  const cleanTest = (testDbName || "").trim();
  const cleanProd = (prodDbName || "malwa_namkeen").trim();
  if (!cleanTest) {
    return {
      safe: false,
      effectiveDbName: "",
      error: "CRITICAL SAFETY ABORT: MONGODB_TEST_DB_NAME is not configured. Live E2E tests cannot run against unspecified databases."
    };
  }
  if (cleanTest.toLowerCase() === cleanProd.toLowerCase()) {
    return {
      safe: false,
      effectiveDbName: cleanTest,
      error: `CRITICAL SAFETY ABORT: MONGODB_TEST_DB_NAME ("${cleanTest}") matches production database MONGODB_DB_NAME ("${cleanProd}"). Tests would mutate production collections.`
    };
  }
  if (KNOWN_PRODUCTION_DB_NAMES.includes(cleanTest.toLowerCase())) {
    return {
      safe: false,
      effectiveDbName: cleanTest,
      error: `CRITICAL SAFETY ABORT: "${cleanTest}" is recognized as a production or MongoDB system database name. Refusing execution.`
    };
  }
  const hasTestIndicator = /(?:_|-|^)test(?:_|-|$)|sandbox|ci/i.test(cleanTest);
  if (!hasTestIndicator) {
    return {
      safe: false,
      effectiveDbName: cleanTest,
      error: `CRITICAL SAFETY ABORT: MONGODB_TEST_DB_NAME ("${cleanTest}") must contain an explicit test indicator (e.g. "malwa_namkeen_test") to guarantee it is separated from production.`
    };
  }
  return {
    safe: true,
    effectiveDbName: cleanTest
  };
}
function validateTestConnectionConfig(options = {}) {
  const testUri = "testUri" in options ? options.testUri : process.env.MONGODB_TEST_URI;
  const prodUri = "prodUri" in options ? options.prodUri : process.env.MONGODB_URI;
  const testDbName = "testDbName" in options ? options.testDbName : process.env.MONGODB_TEST_DB_NAME;
  const prodDbName = "prodDbName" in options ? options.prodDbName : process.env.MONGODB_DB_NAME || "malwa_namkeen";
  const cleanTestUri = (testUri || "").trim();
  const cleanProdUri = (prodUri || "").trim();
  const cleanTestDb = (testDbName || "").trim();
  const cleanProdDb = (prodDbName || "malwa_namkeen").trim();
  if (!cleanTestUri) {
    return {
      safe: false,
      effectiveUri: "",
      effectiveDbName: "",
      error: "CRITICAL SAFETY ABORT: MONGODB_TEST_URI is not configured in test mode. Falling back to MONGODB_URI is strictly prohibited to protect production data."
    };
  }
  if (cleanProdUri && cleanTestUri.toLowerCase() === cleanProdUri.toLowerCase()) {
    return {
      safe: false,
      effectiveUri: "",
      effectiveDbName: "",
      error: "CRITICAL SAFETY ABORT: MONGODB_TEST_URI matches production MONGODB_URI. Execution aborted to prevent mutating production database."
    };
  }
  const dbValidation = validateTestDatabaseName({ testDbName: cleanTestDb, prodDbName: cleanProdDb });
  if (!dbValidation.safe) {
    return {
      safe: false,
      effectiveUri: "",
      effectiveDbName: "",
      error: dbValidation.error
    };
  }
  const embeddedDb = extractDatabaseNameFromUri(cleanTestUri);
  if (!embeddedDb) {
    return {
      safe: false,
      effectiveUri: "",
      effectiveDbName: dbValidation.effectiveDbName,
      error: `CRITICAL SAFETY ABORT: MONGODB_TEST_URI does not have an embedded database name. It must explicitly include /${dbValidation.effectiveDbName} in the connection path to prevent falling back to default or production databases.`
    };
  }
  if (embeddedDb.toLowerCase() === cleanProdDb.toLowerCase()) {
    return {
      safe: false,
      effectiveUri: "",
      effectiveDbName: "",
      error: `CRITICAL SAFETY ABORT: Embedded database name ("${embeddedDb}") in MONGODB_TEST_URI matches production database name ("${cleanProdDb}"). Connection prohibited.`
    };
  }
  if (KNOWN_PRODUCTION_DB_NAMES.includes(embeddedDb.toLowerCase())) {
    return {
      safe: false,
      effectiveUri: "",
      effectiveDbName: "",
      error: `CRITICAL SAFETY ABORT: Embedded database name ("${embeddedDb}") in MONGODB_TEST_URI is a recognized production or system database. Connection prohibited.`
    };
  }
  if (embeddedDb.toLowerCase() !== dbValidation.effectiveDbName.toLowerCase()) {
    return {
      safe: false,
      effectiveUri: "",
      effectiveDbName: "",
      error: `CRITICAL SAFETY ABORT: Database name embedded in MONGODB_TEST_URI ("${embeddedDb}") does not match configured MONGODB_TEST_DB_NAME ("${dbValidation.effectiveDbName}").`
    };
  }
  return {
    safe: true,
    effectiveUri: cleanTestUri,
    effectiveDbName: dbValidation.effectiveDbName
  };
}
function getEffectiveMongoConfig() {
  const isTest = process.env.NODE_ENV === "test" || process.env.IS_E2E_TEST === "true";
  if (isTest) {
    const validation = validateTestConnectionConfig({
      testUri: process.env.MONGODB_TEST_URI,
      prodUri: process.env.MONGODB_URI,
      testDbName: process.env.MONGODB_TEST_DB_NAME,
      prodDbName: process.env.MONGODB_DB_NAME || "malwa_namkeen"
    });
    if (!validation.safe) {
      throw new Error(validation.error);
    }
    return {
      uri: validation.effectiveUri,
      dbName: validation.effectiveDbName,
      isTestMode: true
    };
  }
  if (process.env.NODE_ENV === "production" && (process.env.MONGODB_TEST_URI || process.env.MONGODB_TEST_DB_NAME)) {
    throw new Error(
      "CRITICAL CONFIGURATION ERROR: MONGODB_TEST_URI or MONGODB_TEST_DB_NAME cannot be configured in NODE_ENV=production. Production deployments must not run against test databases."
    );
  }
  const isProd2 = process.env.NODE_ENV === "production";
  let uri = process.env.MONGODB_URI;
  if (!uri) {
    if (!isProd2) {
      console.warn("[MongoDB] MONGODB_URI not set. In development, attempting local MongoDB at mongodb://127.0.0.1:27017/malwa_namkeen");
      uri = "mongodb://127.0.0.1:27017/malwa_namkeen";
    } else {
      throw new Error("[MongoDB Error] MONGODB_URI is not set in production. Database connection aborted.");
    }
  } else if (!isProd2 && uri.includes("mock:mock")) {
    console.warn("[MongoDB] Mock Atlas URI detected in development. Using local MongoDB at mongodb://127.0.0.1:27017/malwa_namkeen");
    uri = "mongodb://127.0.0.1:27017/malwa_namkeen";
  }
  const dbName = (process.env.MONGODB_DB_NAME || "malwa_namkeen").trim();
  return {
    uri,
    dbName,
    isTestMode: false
  };
}

// server/lib/mongodb.ts
var isConnected = false;
function getDesignatedAdminEmails() {
  const raw = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "").toLowerCase();
  const list = raw.split(/[,;]+/).map((e) => e.trim()).filter((e) => e && e.includes("@"));
  if (process.env.NODE_ENV === "test" || process.env.IS_E2E_TEST === "true") {
    const testAdmin = (process.env.TEST_ADMIN_EMAIL || "").trim().toLowerCase();
    if (testAdmin && testAdmin.includes("@")) {
      list.push(testAdmin);
    }
  }
  if (list.length === 0) {
    list.push("malwanamkeenhouse@gmail.com");
  }
  return Array.from(new Set(list));
}
async function seedInitialAdmin() {
  try {
    const designatedEmails = getDesignatedAdminEmails();
    const isTestMode = process.env.NODE_ENV === "test" || process.env.IS_E2E_TEST === "true";
    const adminPassword = isTestMode ? process.env.TEST_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD : process.env.ADMIN_PASSWORD;
    for (const email2 of designatedEmails) {
      const existing = await User.findOne({ email: email2 });
      if (existing) {
        if (existing.role !== "super_admin" || !existing.active) {
          existing.role = "super_admin";
          existing.active = true;
          await existing.save();
          console.log(`[MongoDB] Designated owner <${email2}> confirmed as active super_admin.`);
        }
      } else if (adminPassword && adminPassword.trim().length >= 8) {
        const hashedPassword = await hashPassword(adminPassword.trim());
        await User.create({
          name: "Super Admin",
          email: email2,
          password: hashedPassword,
          role: "super_admin",
          active: true
        });
        console.log(`[MongoDB] Initial super_admin account provisioned for <${email2}>.`);
      } else {
        console.log(`[MongoDB] Designated owner <${email2}> is configured. Set ADMIN_PASSWORD in environment to auto-provision with credentials, or complete registration via Google OAuth/Portal.`);
      }
    }
  } catch (err) {
    console.warn("[MongoDB] Initial admin check skipped:", err instanceof Error ? err.message : err);
  }
}
async function syncDatabaseCatalog() {
  try {
    const validCategories = SHOP_CATEGORIES.filter((c) => c.id !== "all");
    const categoryDocMap = /* @__PURE__ */ new Map();
    for (let i = 0; i < validCategories.length; i++) {
      const catData = validCategories[i];
      let cat = await Category.findOne({ slug: catData.id });
      if (!cat) {
        cat = await Category.create({
          name: catData.label,
          slug: catData.id,
          description: catData.description,
          active: true,
          sortOrder: i
        });
      }
      categoryDocMap.set(catData.id, cat._id);
    }
    let seededCount = 0;
    for (let idx = 0; idx < PRODUCTS.length; idx++) {
      const p = PRODUCTS[idx];
      const catId = categoryDocMap.get(p.category) || Array.from(categoryDocMap.values())[0];
      const pSlug = p.slug || p.id;
      const existing = await Product.findOne({ slug: pSlug });
      if (!existing) {
        const variants = p.options.map((opt, vIdx) => ({
          label: opt.weight,
          value: parseFloat(opt.weight) || 250,
          unit: opt.weight.replace(/^[0-9.]+/, "").trim() || "g",
          price: opt.price,
          salePrice: opt.originalPrice && opt.originalPrice > opt.price ? opt.price : void 0,
          stock: 100,
          sku: `MLW-${p.id.slice(0, 4).toUpperCase()}-${opt.weight.replace(/\s+/g, "").toUpperCase()}`,
          active: true,
          sortOrder: vIdx
        }));
        const productPayload = {
          name: p.name,
          slug: pSlug,
          hindiName: p.hindiName || "",
          tagline: p.tagline || "",
          description: p.description,
          story: p.story || "",
          ingredients: p.ingredients || [],
          spiceLevel: p.spiceLevel || "Medium",
          shelfLife: p.shelfLife || "90 Days",
          oilUsed: p.oilUsed || "Pure Groundnut Oil",
          isVegetarian: p.isVegetarian ?? true,
          category: catId,
          images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image],
          badge: p.badge || (p.isBestSeller ? "Bestseller" : ""),
          featured: Boolean(p.featured),
          isBestSeller: Boolean(p.isBestSeller),
          bestSellerAt: p.isBestSeller ? new Date(Date.now() - idx * 6e4) : null,
          active: p.isAvailable ?? true,
          rating: p.rating || 4.9,
          reviewCount: p.reviewCount || 42,
          variants
        };
        await Product.create(productPayload);
        seededCount++;
      }
    }
    const totalProducts = await Product.countDocuments();
    if (seededCount > 0) {
      console.log(`[MongoDB] Database catalog initialized with ${seededCount} missing seed products. Total products: ${totalProducts}.`);
    } else {
      console.log(`[MongoDB] Database catalog synchronized: ${totalProducts} products verified (admin items preserved).`);
    }
  } catch (err) {
    console.warn("[MongoDB] Database catalog sync warning:", err instanceof Error ? err.message : err);
  }
}
async function connectMongoDB() {
  if (isConnected) return;
  const isProd2 = process.env.NODE_ENV === "production";
  const config = getEffectiveMongoConfig();
  try {
    await mongoose5.connect(config.uri, {
      serverSelectionTimeoutMS: 5e3,
      dbName: config.dbName
    });
    const actualConnectedDb = mongoose5.connection.name;
    if (config.isTestMode) {
      if (actualConnectedDb !== config.dbName) {
        await mongoose5.disconnect();
        throw new Error(
          `CRITICAL SAFETY ABORT: Mongoose connected to database "${actualConnectedDb}", but expected test database "${config.dbName}". Disconnected immediately.`
        );
      }
      const validation = validateTestDatabaseName({ testDbName: actualConnectedDb });
      if (!validation.safe) {
        await mongoose5.disconnect();
        throw new Error(`CRITICAL POST-CONNECT SAFETY ABORT: ${validation.error}`);
      }
    }
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to database: "${mongoose5.connection.name}".`);
    await seedInitialAdmin();
    await syncDatabaseCatalog();
  } catch (err) {
    const message2 = err instanceof Error ? err.message : String(err);
    if (isProd2) {
      console.error("[MongoDB Error] Production database connection failed:", message2);
    } else {
      console.warn("[MongoDB Warning] Database connection failed:", message2);
    }
    throw err;
  }
}
function getMongoStatus() {
  const stateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };
  const state = mongoose5.connection.readyState;
  return {
    connected: state === 1,
    state: stateMap[state] ?? "unknown"
  };
}

// server/config.ts
var BUSINESS = {
  name: "MALWA NAMKEEN HOUSE",
  tagline: "THE NAMKEEN & SNACKS HUB",
  email: "malwanamkeenhouse@gmail.com",
  phone: "+91 7987732765",
  whatsappNumber: "917987732765",
  address: {
    line1: "No. 87/4-B, Sulikunte Village",
    line2: "Sarjapur Main Road, Dommasandra Post",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "562125",
    country: "India",
    full: "No. 87/4-B, Sulikunte Village, Sarjapur Main Road, Dommasandra Post, Bengaluru \u2013 562125"
  },
  gstNumber: "29AQWPP5638F2ZO",
  fssaiNumber: "11225302002687",
  businessHours: [
    { days: "Monday \u2013 Thursday", open: "9:00 AM", close: "10:30 PM" },
    { days: "Friday", open: "9:00 AM", close: "11:00 PM" },
    { days: "Saturday \u2013 Sunday", open: "8:30 AM", close: "11:00 PM" }
  ],
  defaultLocationId: "bengaluru-sarjapur"
};
var GOOGLE_MAPS_URL = process.env.GOOGLE_MAPS_URL ?? "#";
var ENQUIRY_CATEGORIES = [
  { value: "general_enquiry", label: "General Enquiries" },
  { value: "catering", label: "Catering" },
  { value: "bulk_orders", label: "Bulk Orders" },
  { value: "corporate_gifting", label: "Corporate Gifting" },
  { value: "birthday_parties_events", label: "Birthday Parties & Events" }
];
var VALID_CATEGORIES = ENQUIRY_CATEGORIES.map((c) => c.value);
var VALID_LOCATION_IDS = ["bengaluru-sarjapur"];

// server/routes/auth.ts
import crypto from "crypto";
import { Router } from "express";
import rateLimit from "express-rate-limit";

// server/lib/mongoRateLimitStore.ts
import mongoose6 from "mongoose";
var MongoRateLimitStore = class {
  constructor(optionsOrPrefix, windowMs) {
    this.localKeys = false;
    // Cross-instance distributed keys
    // Fallback memory tracking if DB is offline/disconnected
    this.fallbackMemory = /* @__PURE__ */ new Map();
    if (typeof optionsOrPrefix === "string") {
      this.prefix = optionsOrPrefix.endsWith(":") ? optionsOrPrefix : `${optionsOrPrefix}:`;
      this.windowMs = windowMs || 6e4;
      this.failClosed = true;
    } else {
      const p = optionsOrPrefix?.prefix || "rl:";
      this.prefix = p.endsWith(":") ? p : `${p}:`;
      this.windowMs = optionsOrPrefix?.windowMs || windowMs || 6e4;
      this.failClosed = optionsOrPrefix?.failClosed !== false;
    }
  }
  init(options) {
    if (options.windowMs) {
      this.windowMs = options.windowMs;
    }
  }
  async increment(key) {
    const fullKey = `${this.prefix}${key}`;
    const now = Date.now();
    const resetTime = new Date(now + this.windowMs);
    if (mongoose6.connection.readyState === 1 && mongoose6.connection.db) {
      try {
        const collection = mongoose6.connection.collection("ratelimitrecords");
        const updated = await collection.findOneAndUpdate(
          { _id: fullKey, resetTime: { $gt: new Date(now) } },
          { $inc: { totalHits: 1 } },
          { returnDocument: "after" }
        );
        if (updated) {
          const doc = updated;
          return {
            totalHits: doc.totalHits,
            resetTime: doc.resetTime
          };
        }
        const resetDoc = await collection.findOneAndUpdate(
          { _id: fullKey, resetTime: { $lte: new Date(now) } },
          {
            $set: {
              totalHits: 1,
              resetTime,
              expiresAt: resetTime
            }
          },
          { returnDocument: "after" }
        );
        if (resetDoc) {
          const doc = resetDoc;
          return {
            totalHits: doc.totalHits,
            resetTime: doc.resetTime
          };
        }
        try {
          await collection.insertOne({
            _id: fullKey,
            totalHits: 1,
            resetTime,
            expiresAt: resetTime
          });
          return { totalHits: 1, resetTime };
        } catch (insertErr) {
          if (insertErr && (insertErr.code === 11e3 || insertErr.name === "MongoServerError")) {
            const retryDoc = await collection.findOneAndUpdate(
              { _id: fullKey },
              { $inc: { totalHits: 1 } },
              { returnDocument: "after" }
            );
            if (retryDoc) {
              const doc = retryDoc;
              return {
                totalHits: doc.totalHits,
                resetTime: doc.resetTime
              };
            }
          }
          throw insertErr;
        }
      } catch (err) {
        console.warn(`[MongoRateLimitStore Warning] DB operation failed for key "${fullKey}":`, err);
        if (this.failClosed) {
          throw err;
        }
      }
    }
    const mem = this.fallbackMemory.get(fullKey);
    if (mem && mem.resetTime.getTime() > now) {
      mem.totalHits += 1;
      return { totalHits: mem.totalHits, resetTime: mem.resetTime };
    }
    const newMem = { totalHits: 1, resetTime };
    this.fallbackMemory.set(fullKey, newMem);
    return { totalHits: 1, resetTime };
  }
  async decrement(key) {
    const fullKey = `${this.prefix}${key}`;
    if (mongoose6.connection.readyState === 1 && mongoose6.connection.db) {
      try {
        await mongoose6.connection.collection("ratelimitrecords").updateOne(
          { _id: fullKey, totalHits: { $gt: 0 } },
          { $inc: { totalHits: -1 } }
        );
      } catch {
      }
    }
    const mem = this.fallbackMemory.get(fullKey);
    if (mem && mem.totalHits > 0) {
      mem.totalHits -= 1;
    }
  }
  async resetKey(key) {
    const fullKey = `${this.prefix}${key}`;
    if (mongoose6.connection.readyState === 1 && mongoose6.connection.db) {
      try {
        await mongoose6.connection.collection("ratelimitrecords").deleteOne({ _id: fullKey });
      } catch {
      }
    }
    this.fallbackMemory.delete(fullKey);
  }
  async resetAll() {
    if (mongoose6.connection.readyState === 1 && mongoose6.connection.db) {
      try {
        await mongoose6.connection.collection("ratelimitrecords").deleteMany({
          _id: { $regex: `^${this.prefix}` }
        });
      } catch {
      }
    }
    this.fallbackMemory.clear();
  }
};

// server/models/OtpVerification.ts
import mongoose7, { Schema as Schema4 } from "mongoose";
var otpVerificationSchema = new Schema4(
  {
    userId: {
      type: Schema4.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    purpose: {
      type: String,
      enum: ["password-change"],
      required: true,
      index: true
    },
    otpHash: {
      type: String,
      required: true,
      trim: true
    },
    pendingPasswordHash: {
      type: String,
      required: true,
      select: false
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
      // MongoDB TTL index to automatically purge expired records
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0
    },
    resendAvailableAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 60 * 1e3)
      // Default 60s cooldown
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);
otpVerificationSchema.index({ userId: 1, purpose: 1 });
var OtpVerification = mongoose7.models.OtpVerification || mongoose7.model("OtpVerification", otpVerificationSchema);

// server/models/AuditLog.ts
import mongoose8, { Schema as Schema5 } from "mongoose";
var auditLogSchema = new Schema5(
  {
    action: {
      type: String,
      required: true,
      enum: ["PASSWORD_CHANGE_REQUESTED", "PASSWORD_CHANGED", "ROLE_CHANGED"],
      index: true
    },
    actorId: {
      type: Schema5.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    targetUserId: {
      type: Schema5.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    metadata: {
      type: Schema5.Types.Mixed,
      default: {}
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false
  }
);
var AuditLog = mongoose8.models.AuditLog || mongoose8.model("AuditLog", auditLogSchema);

// server/lib/emailService.ts
import { Resend } from "resend";
import mongoose10 from "mongoose";

// server/models/EmailLog.ts
import mongoose9, { Schema as Schema6 } from "mongoose";
var emailLogSchema = new Schema6(
  {
    eventType: {
      type: String,
      required: true,
      enum: [
        "admin_invitation",
        "admin_password_reset",
        "customer_password_reset",
        "customer_welcome",
        "password_change_otp",
        "password_changed_notification",
        "role_changed_notification",
        "order_confirmation",
        "order_status_update",
        "inquiry_acknowledgement",
        "admin_new_order_alert",
        "admin_new_inquiry_alert",
        "admin_order_cancellation_alert",
        "admin_security_alert"
      ],
      index: true
    },
    recipient: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    relatedId: {
      type: String,
      trim: true,
      index: true,
      default: null
    },
    provider: {
      type: String,
      default: "resend",
      trim: true
    },
    providerMessageId: {
      type: String,
      trim: true,
      default: null
    },
    status: {
      type: String,
      enum: ["sent", "simulated", "failed", "unconfigured"],
      required: true,
      index: true
    },
    error: {
      type: String,
      default: null
    },
    metadata: {
      type: Schema6.Types.Mixed,
      default: {}
    },
    attemptedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);
emailLogSchema.index({ eventType: 1, relatedId: 1, recipient: 1 });
var EmailLog = mongoose9.models.EmailLog || mongoose9.model("EmailLog", emailLogSchema);

// server/lib/emailService.ts
function maskEmail(email2) {
  const trimmed = (email2 || "").trim().toLowerCase();
  const atIdx = trimmed.indexOf("@");
  if (atIdx <= 0) return "***";
  const local = trimmed.slice(0, atIdx);
  const domain = trimmed.slice(atIdx + 1);
  const maskedLocal = local.length <= 2 ? `${local[0]}***` : `${local[0]}***${local[local.length - 1]}`;
  return `${maskedLocal}@${domain}`;
}
function generatePlainTextFallback(html) {
  return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<\/p>/gi, "\n\n").replace(/<\/tr>/gi, "\n").replace(/<\/div>/gi, "\n").replace(/<\/h[1-6]>/gi, "\n\n").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/[ \t]+/g, " ").replace(/\n\s*\n\s*\n+/g, "\n\n").trim();
}
function getEmailConfig() {
  const isTest = process.env.NODE_ENV === "test" || process.env.IS_E2E_TEST === "true";
  const forceSimulated = isTest || process.env.EMAIL_PROVIDER === "simulated";
  const isProd2 = process.env.NODE_ENV === "production";
  const rawBaseUrl = process.env.APP_URL || process.env.APP_BASE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") || (isProd2 ? "https://malwanamkeenhouse.com" : "http://localhost:3000");
  let provider = "simulated";
  if (forceSimulated) {
    provider = "simulated";
  } else if (process.env.EMAIL_PROVIDER) {
    provider = process.env.EMAIL_PROVIDER;
  } else if (isProd2) {
    provider = process.env.RESEND_API_KEY ? "resend" : "unconfigured";
  } else {
    provider = process.env.RESEND_API_KEY ? "resend" : "simulated";
  }
  return {
    provider,
    resendApiKey: forceSimulated ? "" : process.env.RESEND_API_KEY || "",
    emailFrom: process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || "Malwa Namkeen House <orders@malwanamkeenhouse.com>",
    emailReplyTo: process.env.EMAIL_REPLY_TO || process.env.RESEND_REPLY_TO || "malwanamkeenhouse@gmail.com",
    appBaseUrl: rawBaseUrl.replace(/\/+$/, "")
  };
}
var resendClient = null;
function getResendClient() {
  if (resendClient) return resendClient;
  const { resendApiKey } = getEmailConfig();
  if (!resendApiKey) return null;
  resendClient = new Resend(resendApiKey);
  return resendClient;
}
function wrapEmailTemplate({
  title,
  preheader,
  contentHtml,
  storeContact
}) {
  const phone2 = storeContact?.phone || "+91 7987732765";
  const email2 = storeContact?.email || "malwanamkeenhouse@gmail.com";
  const address = storeContact?.address || "Near Mahakaleshwar Temple, Sarafa Bazaar, Ujjain, MP 456001";
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8F6F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1A0A0F; -webkit-font-smoothing: antialiased; }
    .container { max-width: 600px; margin: 24px auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #EAE5D9; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #3C0815 0%, #1A040A 100%); padding: 32px 24px; text-align: center; color: #FFF8EC; }
    .brand-name { color: #F0C74E; font-size: 20px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; margin: 0; }
    .brand-sub { color: rgba(255, 248, 236, 0.65); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 4px; }
    .content { padding: 32px 28px; }
    .footer { background: #FAF7F2; padding: 24px; text-align: center; font-size: 12px; color: #78716C; border-top: 1px solid #EAE5D9; }
    .btn { display: inline-block; background: #3C0815; color: #FFF8EC !important; font-weight: 700; font-size: 13.5px; padding: 12px 28px; border-radius: 8px; text-decoration: none; margin: 18px 0; }
    .table-wrap { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .table-wrap th { background: #F8F6F2; text-align: left; padding: 10px 12px; font-size: 12px; color: #57534E; font-weight: 600; text-transform: uppercase; }
    .table-wrap td { padding: 12px; border-bottom: 1px solid #F2EFEB; font-size: 13.5px; }
    @media only screen and (max-width: 600px) {
      .container { margin: 0; border-radius: 0; }
      .content { padding: 20px 16px; }
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>` : ""}
  <div class="container">
    <div class="header">
      <h1 class="brand-name">Malwa Namkeen House</h1>
      <div class="brand-sub">Artisanal Savouries & Heritage Sweets \xB7 Since 1954</div>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px; font-weight: 600; color: #44403C;">Malwa Namkeen House</p>
      <p style="margin: 0 0 8px;">${address}</p>
      <p style="margin: 0;">Phone: <strong>${phone2}</strong> \xB7 Email: <strong>${email2}</strong></p>
    </div>
  </div>
</body>
</html>
  `;
}
var DEDUPLICATED_EVENT_TYPES = /* @__PURE__ */ new Set([
  "order_confirmation",
  "order_status_update",
  "admin_new_order_alert",
  "admin_order_cancellation_alert",
  "customer_welcome",
  "inquiry_acknowledgement",
  "admin_new_inquiry_alert",
  "role_changed_notification"
]);
function sanitizeErrorMessage(err) {
  if (!err) return "";
  const str = err instanceof Error ? err.message : String(err);
  return str.replace(/re_[a-zA-Z0-9_]{8,}/g, "re_***").replace(/Bearer\s+[a-zA-Z0-9_.-]{8,}/gi, "Bearer ***").replace(/key=[a-zA-Z0-9_.-]{8,}/gi, "key=***");
}
function isTransientNetworkError(errorMsg) {
  const lower = (errorMsg || "").toLowerCase();
  return lower.includes("etimedout") || lower.includes("econnreset") || lower.includes("econnrefused") || lower.includes("eai_again") || lower.includes("socket hang up") || lower.includes("timeout") || lower.includes("rate_limit") || lower.includes("500") || lower.includes("502") || lower.includes("503") || lower.includes("504");
}
async function sendEmail({
  to,
  subject,
  html,
  text,
  eventType,
  relatedId
}) {
  const config = getEmailConfig();
  const isProd2 = process.env.NODE_ENV === "production";
  const cleanTo = (to || "").trim().toLowerCase();
  if (!cleanTo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanTo)) {
    return { success: false, provider: "none", error: "Invalid recipient email address.", delivered: false };
  }
  if (eventType && relatedId && DEDUPLICATED_EVENT_TYPES.has(eventType) && mongoose10.connection.readyState === 1) {
    try {
      const existingSent = await EmailLog.findOne({
        eventType,
        relatedId,
        recipient: cleanTo,
        status: { $in: ["sent", "simulated"] }
      }).lean();
      if (existingSent) {
        return {
          success: true,
          provider: existingSent.provider,
          messageId: existingSent.providerMessageId || void 0,
          simulated: existingSent.status === "simulated",
          delivered: existingSent.status === "sent",
          alreadySent: true
        };
      }
    } catch (dedupErr) {
      console.warn("[Email Deduplication Warning]:", dedupErr);
    }
  }
  const plainText = text && text.trim() ? text.trim() : generatePlainTextFallback(html);
  let result = { success: false, provider: config.provider, delivered: false };
  if (config.provider === "resend") {
    if (!config.resendApiKey && !resendClient) {
      console.warn(`[Email Service Diagnostic] Resend provider selected but RESEND_API_KEY is not configured. Transactional message (Event: ${eventType || "generic"}) to <${maskEmail(cleanTo)}> safely dropped.`);
      result = { success: false, provider: "unconfigured", error: "Email provider unconfigured.", delivered: false };
    } else {
      let attempts = 0;
      const maxAttempts = 2;
      let lastError = "";
      while (attempts < maxAttempts) {
        attempts++;
        try {
          const client = getResendClient();
          if (!client) throw new Error("Resend client initialization failed");
          const response = await client.emails.send({
            from: config.emailFrom,
            to: [cleanTo],
            subject,
            html,
            text: plainText,
            ...config.emailReplyTo ? { reply_to: config.emailReplyTo } : {}
          });
          if (response.error) {
            lastError = sanitizeErrorMessage(response.error.message);
            if (!isTransientNetworkError(lastError)) {
              break;
            }
          } else {
            result = { success: true, provider: "resend", messageId: response.data?.id, delivered: true };
            lastError = "";
            break;
          }
        } catch (err) {
          lastError = sanitizeErrorMessage(err);
          if (!isTransientNetworkError(lastError) || attempts >= maxAttempts) {
            break;
          }
        }
        if (attempts < maxAttempts) {
          await new Promise((r) => setTimeout(r, 150));
        }
      }
      if (lastError) {
        result = { success: false, provider: "resend", error: lastError, delivered: false };
      }
    }
  } else if (config.provider === "unconfigured" || isProd2 && config.provider !== "simulated") {
    console.warn(`[Email Service Diagnostic] Transactional email provider is unconfigured. Message (Event: ${eventType || "generic"}) to <${maskEmail(cleanTo)}> safely dropped. Configure RESEND_API_KEY and EMAIL_FROM in deployment settings to enable delivery.`);
    result = { success: false, provider: "unconfigured", error: "Email provider unconfigured.", delivered: false };
  } else {
    const isSensitive = Boolean(
      eventType && [
        "password_change_otp",
        "password_reset",
        "customer_password_reset",
        "admin_password_reset",
        "admin_invitation"
      ].includes(eventType)
    );
    const maskedTo = maskEmail(cleanTo);
    console.log("\n================== [DEV EMAIL SIMULATOR] ==================");
    console.log(`To: ${maskedTo}`);
    console.log(`From: ${config.emailFrom}`);
    if (config.emailReplyTo) {
      console.log(`Reply-To: ${config.emailReplyTo}`);
    }
    console.log(`Event: ${eventType || "generic"}`);
    console.log(`Subject: ${subject}`);
    if (isSensitive) {
      console.log("Preview: [REDACTED: Sensitive authentication content (OTP/Token/Credentials hidden)]");
    } else {
      const sanitizedPreview = plainText.slice(0, 300).replace(/\b\d{6}\b/g, "[REDACTED_CODE]").replace(/(token=)[a-zA-Z0-9_\-]+/gi, "$1[REDACTED_TOKEN]");
      console.log(`Preview:
${sanitizedPreview}...`);
    }
    console.log("===========================================================\n");
    result = { success: true, provider: "simulated", simulated: true, delivered: false };
  }
  if (eventType && mongoose10.connection.readyState === 1) {
    try {
      await EmailLog.create({
        eventType,
        recipient: cleanTo,
        subject,
        relatedId: relatedId || null,
        provider: result.provider,
        providerMessageId: result.messageId || null,
        status: result.simulated ? "simulated" : result.delivered ? "sent" : result.provider === "unconfigured" ? "unconfigured" : "failed",
        error: result.error || null,
        attemptedAt: /* @__PURE__ */ new Date()
      });
    } catch (logErr) {
      console.warn("[EmailLog Warning] Failed to log email record:", logErr);
    }
  }
  return result;
}
async function runEmailSmokeTest(options = {}) {
  const config = getEmailConfig();
  const recipient = options.targetEmail || process.env.ADMIN_NOTIFICATION_EMAIL || "malwanamkeenhouse@gmail.com";
  if (!config.resendApiKey && !resendClient) {
    return {
      success: false,
      provider: "none",
      error: "RESEND_API_KEY environment variable is not configured. Live smoke test cannot run without credentials.",
      delivered: false
    };
  }
  return sendEmail({
    to: recipient,
    subject: "[Malwa Namkeen House] Live Resend Smoke Test",
    html: wrapEmailTemplate({
      title: "Email Delivery Smoke Test",
      contentHtml: `
        <h2 style="color: #3C0815; margin-top: 0;">Resend Integration Verification</h2>
        <p>This is an automated smoke test confirming that the transactional email pipeline for <strong>Malwa Namkeen House</strong> is operational.</p>
        <p style="font-size: 13px; color: #78716C;">Timestamp: ${(/* @__PURE__ */ new Date()).toISOString()}</p>
      `
    }),
    text: `[Malwa Namkeen House] Live Resend Smoke Test. Timestamp: ${(/* @__PURE__ */ new Date()).toISOString()}`,
    eventType: "admin_security_alert",
    relatedId: `smoke_test_${Date.now()}`
  });
}
async function sendAdminInvitation({
  email: email2,
  name: name2,
  role,
  token,
  inviterName = "Super Administrator"
}) {
  const { appBaseUrl } = getEmailConfig();
  const inviteUrl = `${appBaseUrl}/admin/accept-invite?token=${encodeURIComponent(token)}`;
  const roleTitle = role === "super_admin" ? "Super Administrator" : "Administrator";
  const html = wrapEmailTemplate({
    title: "Administrator Invitation",
    preheader: `You have been invited to join Malwa Namkeen House as ${roleTitle}.`,
    contentHtml: `
      <h2 style="color: #3C0815; font-size: 18px; margin-top: 0;">Welcome to the Team, ${name2}!</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        <strong>${inviterName}</strong> has invited you to join the Malwa Namkeen House management team with the access role of <strong>${roleTitle}</strong>.
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        Please click the button below to accept your invitation, confirm your profile details, and choose your account password:
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${inviteUrl}" class="btn">Accept Invitation & Set Password</a>
      </div>
      <p style="font-size: 12.5px; color: #6B7280; line-height: 1.5;">
        <strong>Security Notice:</strong> This invitation link is cryptographically signed and will expire in 48 hours. If you were not expecting this invitation, you may disregard this email.
      </p>
    `
  });
  const text = `Welcome to the Team, ${name2}!

${inviterName} has invited you to join the Malwa Namkeen House management team with the access role of ${roleTitle}.

Please accept your invitation and set your password here:
${inviteUrl}

Security Notice: This invitation link is cryptographically signed and will expire in 48 hours. If you were not expecting this invitation, you may disregard this email.

Malwa Namkeen House`;
  return sendEmail({
    to: email2,
    subject: `Invitation to join Malwa Namkeen House Staff Portal (${roleTitle})`,
    html,
    text,
    eventType: "admin_invitation",
    relatedId: email2
  });
}
async function sendAdminPasswordReset({
  email: email2,
  name: name2,
  token
}) {
  const { appBaseUrl } = getEmailConfig();
  const resetUrl = `${appBaseUrl}/admin/reset-password?token=${encodeURIComponent(token)}`;
  const html = wrapEmailTemplate({
    title: "Password Reset Request",
    preheader: "Reset instructions for your administrator account.",
    contentHtml: `
      <h2 style="color: #3C0815; font-size: 18px; margin-top: 0;">Password Reset Instructions</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        Namaste ${name2},
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        We received a request to reset the password for your administrator account (<strong>${email2}</strong>).
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${resetUrl}" class="btn">Reset Your Password</a>
      </div>
      <p style="font-size: 12.5px; color: #6B7280; line-height: 1.5;">
        <strong>Security Notice:</strong> This link is valid for 1 hour and can only be used once. If you did not make this request, please inform your store administrator immediately.
      </p>
    `
  });
  const text = `Namaste ${name2},

We received a request to reset the password for your administrator account (${email2}).

Please click the link below to choose a new password:
${resetUrl}

Security Notice: This link is valid for 1 hour and can only be used once. If you did not make this request, please inform your store administrator immediately.

Malwa Namkeen House`;
  return sendEmail({
    to: email2,
    subject: "Password Reset Request \u2014 Malwa Namkeen House Staff Portal",
    html,
    text,
    eventType: "admin_password_reset",
    relatedId: email2
  });
}
async function sendCustomerPasswordReset({
  email: email2,
  name: name2,
  token
}) {
  const { appBaseUrl } = getEmailConfig();
  const resetUrl = `${appBaseUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const html = wrapEmailTemplate({
    title: "Password Reset Request",
    preheader: "Reset instructions for your Malwa Namkeen House account.",
    contentHtml: `
      <h2 style="color: #3C0815; font-size: 18px; margin-top: 0;">Password Reset Instructions</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        Namaste ${name2},
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        We received a request to reset the password for your Malwa Namkeen House account (<strong>${email2}</strong>).
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${resetUrl}" class="btn">Reset Your Password</a>
      </div>
      <p style="font-size: 12.5px; color: #6B7280; line-height: 1.5;">
        <strong>Security Notice:</strong> This link is valid for 1 hour and can only be used once. If you did not make this request, you can safely ignore this email.
      </p>
    `
  });
  const text = `Namaste ${name2},

We received a request to reset the password for your Malwa Namkeen House account (${email2}).

Please click the link below to reset your password:
${resetUrl}

Security Notice: This link is valid for 1 hour and can only be used once. If you did not make this request, you can safely ignore this email.

Malwa Namkeen House`;
  return sendEmail({
    to: email2,
    subject: "Password Reset Request \u2014 Malwa Namkeen House",
    html,
    text,
    eventType: "customer_password_reset",
    relatedId: email2
  });
}
async function sendCustomerWelcomeEmail({
  email: email2,
  name: name2
}) {
  const { appBaseUrl } = getEmailConfig();
  const customerName = name2 ? name2.trim() : "Delicacy Connoisseur";
  const cleanEmail = (email2 || "").trim().toLowerCase();
  const html = wrapEmailTemplate({
    title: "Welcome to Malwa Namkeen House",
    preheader: "Welcome to authentic handcrafted Ujjaini savouries and sweets.",
    contentHtml: `
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="background: #FEF3C7; color: #92400E; font-size: 12px; font-weight: 700; padding: 4px 14px; border-radius: 20px; text-transform: uppercase;">
          Heritage Flavours \xB7 Since 1954
        </span>
      </div>
      <h2 style="color: #3C0815; font-size: 20px; margin-top: 0; text-align: center;">
        Swagatam, ${customerName}!
      </h2>
      <p style="font-size: 14.5px; line-height: 1.65; color: #374151; text-align: center;">
        Welcome to the <strong>Malwa Namkeen House</strong> family. We are delighted to share the timeless culinary traditions of Ujjain and the Malwa region with you.
      </p>
      <div style="background: #FAF7F2; border: 1px solid #EAE5D9; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <h3 style="color: #3C0815; font-size: 15px; margin: 0 0 10px; font-weight: 700;">The Malwa Heritage Promise:</h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 13.5px; color: #57534E; line-height: 1.7;">
          <li><strong>Authentic Ujjaini Recipes:</strong> Handcrafted with secret family spice blends preserved across generations.</li>
          <li><strong>Purity First:</strong> Fried only in cold-pressed groundnut oil or pure desi ghee \u2014 never reused oil.</li>
          <li><strong>Fresh Batch Delivery:</strong> Made in small batches in Ujjain and nitrogen sealed for crisp freshness.</li>
        </ul>
      </div>
      <div style="text-align: center; margin: 28px 0 16px;">
        <a href="${appBaseUrl}/shop" class="btn">Explore Heritage Delicacies</a>
      </div>
      <p style="font-size: 13px; color: #78716C; text-align: center; line-height: 1.5;">
        You can track orders, manage addresses, and discover seasonal specialties in your <a href="${appBaseUrl}/dashboard" style="color: #3C0815; font-weight: 600;">Account Dashboard</a>.
      </p>
    `
  });
  const text = `Swagatam, ${customerName}!

Welcome to the Malwa Namkeen House family. We are delighted to share the timeless culinary traditions of Ujjain and the Malwa region with you.

Our Heritage Promise:
- Authentic Ujjaini Recipes handcrafted with secret family spice blends since 1954
- Purity First: Prepared only in cold-pressed groundnut oil or pure desi ghee
- Fresh Batch Delivery: Sealed for peak crispness

Explore our savouries and sweets:
${appBaseUrl}/shop

Access your account dashboard:
${appBaseUrl}/dashboard

Dhanyawaad,
Malwa Namkeen House \xB7 Ujjain`;
  return sendEmail({
    to: cleanEmail,
    subject: "Welcome to Malwa Namkeen House \u2014 Artisanal Heritage Delicacies",
    html,
    text,
    eventType: "customer_welcome",
    relatedId: cleanEmail
  });
}
async function sendCustomerOrderConfirmation({
  order,
  storeContact
}) {
  const { appBaseUrl } = getEmailConfig();
  const customerEmail = order.customerInfo?.email || order.shippingAddress?.email;
  const customerName = order.customerInfo?.name || order.shippingAddress?.name || "Customer";
  if (!customerEmail) {
    return { success: false, provider: "none", error: "No recipient email found on order.", delivered: false };
  }
  const itemsHtml = (order.items || []).map(
    (item) => `
      <tr>
        <td>
          <strong>${item.productName}</strong><br>
          <span style="font-size: 12px; color: #78716C;">${item.variantLabel || "Standard"}</span>
        </td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">\u20B9${item.price}</td>
        <td style="text-align: right; font-weight: 600;">\u20B9${item.itemTotal || item.price * item.quantity}</td>
      </tr>
    `
  ).join("");
  const html = wrapEmailTemplate({
    title: `Order Confirmation \u2014 ${order.orderNumber}`,
    preheader: `Thank you for your order #${order.orderNumber}. We are preparing your fresh Malwa delicacies.`,
    storeContact,
    contentHtml: `
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="background: #D1FAE5; color: #065F46; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; text-transform: uppercase;">
          Order Confirmed \xB7 #${order.orderNumber}
        </span>
      </div>
      <h2 style="color: #3C0815; font-size: 18px; margin-top: 0; text-align: center;">
        Dhanyawaad, ${customerName}!
      </h2>
      <p style="font-size: 14px; line-height: 1.6; color: #374151; text-align: center;">
        Your order has been received and our kitchen is preparing your authentic handcrafted savouries.
      </p>

      <table class="table-wrap">
        <thead>
          <tr>
            <th>Delicacy</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="background: #FAF7F2; padding: 16px; border-radius: 10px; margin: 20px 0; font-size: 13.5px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="color: #78716C;">Subtotal:</span>
          <span>\u20B9${order.subtotal}</span>
        </div>
        ${order.discount > 0 ? `<div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #047857;">
                 <span>Discount ${order.discountCode ? `(${order.discountCode})` : ""}:</span>
                 <span>-\u20B9${order.discount}</span>
               </div>` : ""}
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="color: #78716C;">Delivery:</span>
          <span>${order.shipping === 0 ? "FREE" : `\u20B9${order.shipping}`}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 15px; border-top: 1px solid #EAE5D9; padding-top: 8px; margin-top: 6px; color: #3C0815;">
          <span>Grand Total:</span>
          <span>\u20B9${order.total}</span>
        </div>
      </div>

      <div style="border: 1px solid #EAE5D9; border-radius: 10px; padding: 14px; margin-bottom: 20px;">
        <div style="font-size: 12px; font-weight: 700; color: #57534E; text-transform: uppercase; margin-bottom: 6px;">
          Delivery Address
        </div>
        <div style="font-size: 13px; color: #374151; line-height: 1.4;">
          ${order.shippingAddress?.name || customerName}<br>
          ${order.shippingAddress?.addressLine1 || ""} ${order.shippingAddress?.addressLine2 || ""}<br>
          ${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || ""} \u2014 ${order.shippingAddress?.pincode || ""}<br>
          Phone: ${order.shippingAddress?.phone || ""}
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${appBaseUrl}/dashboard" class="btn">View Order in Dashboard</a>
      </div>
    `
  });
  const itemsText = (order.items || []).map((item) => `- ${item.productName} (${item.variantLabel || "Standard"}) x ${item.quantity} = \u20B9${item.itemTotal || item.price * item.quantity}`).join("\n");
  const text = `Dhanyawaad, ${customerName}!

Your order #${order.orderNumber} has been received and our kitchen is preparing your authentic handcrafted savouries.

Order Summary:
${itemsText}

Subtotal: \u20B9${order.subtotal}
${order.discount > 0 ? `Discount: -\u20B9${order.discount}
` : ""}Delivery: ${order.shipping === 0 ? "FREE" : `\u20B9${order.shipping}`}
Total: \u20B9${order.total}
Payment Method: ${(order.paymentMethod || "cod").toUpperCase()}

Delivery Address:
${order.shippingAddress?.name || customerName}
${order.shippingAddress?.addressLine1 || ""} ${order.shippingAddress?.addressLine2 || ""}
${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || ""} \u2014 ${order.shippingAddress?.pincode || ""}
Phone: ${order.shippingAddress?.phone || ""}

View order details anytime at: ${appBaseUrl}/dashboard

Malwa Namkeen House \xB7 Ujjain`;
  return sendEmail({
    to: customerEmail,
    subject: `Order Confirmation \u2014 #${order.orderNumber} (Malwa Namkeen House)`,
    html,
    text,
    eventType: "order_confirmation",
    relatedId: order.orderNumber
  });
}
async function sendOrderStatusUpdate({
  order,
  previousStatus,
  newStatus,
  storeContact,
  isTrackingUpdate = false
}) {
  const { appBaseUrl } = getEmailConfig();
  const customerEmail = order.customerInfo?.email || order.shippingAddress?.email;
  const customerName = order.customerInfo?.name || order.shippingAddress?.name || "Customer";
  if (!customerEmail) {
    return { success: false, provider: "none", error: "No recipient email found on order.", delivered: false };
  }
  if (previousStatus === newStatus && !isTrackingUpdate) {
    return { success: true, provider: "none", simulated: true, delivered: false };
  }
  const statusDescriptions = {
    confirmed: {
      title: "Order Confirmed",
      desc: "Your order has been verified and scheduled for kitchen preparation.",
      color: "#065F46"
    },
    processing: {
      title: "Fresh Batch In Preparation",
      desc: "Our artisans are hand-frying and packaging your savouries with cold-pressed groundnut oil.",
      color: "#B45309"
    },
    shipped: {
      title: "Dispatched & On the Way",
      desc: "Your parcel has been handed over to our courier partner for fast delivery.",
      color: "#1E40AF"
    },
    delivered: {
      title: "Order Delivered",
      desc: "Your Malwa Namkeen parcel has been delivered. Enjoy the crisp heritage flavours of Ujjain!",
      color: "#065F46"
    },
    cancelled: {
      title: "Order Cancelled",
      desc: "Your order has been cancelled. If payment was made, your refund will be processed.",
      color: "#991B1B"
    }
  };
  const statusInfo = statusDescriptions[newStatus] || {
    title: `Order Status: ${newStatus.toUpperCase()}`,
    desc: `Your order status has been updated to ${newStatus}.`,
    color: "#3C0815"
  };
  const trackingHtml = order.trackingInfo?.trackingNumber ? `
    <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 10px; padding: 14px; margin: 18px 0; font-size: 13px;">
      <div style="font-weight: 700; color: #1E40AF; margin-bottom: 4px;">Courier Tracking Information</div>
      <div>Courier: <strong>${order.trackingInfo.courierName || "Standard Express"}</strong></div>
      <div>AWB / Tracking Number: <strong>${order.trackingInfo.trackingNumber}</strong></div>
      ${order.trackingInfo.trackingUrl ? `<div style="margin-top: 8px;"><a href="${order.trackingInfo.trackingUrl}" target="_blank" style="color: #1D4ED8; font-weight: 600;">Track Package Online \u2192</a></div>` : ""}
    </div>
  ` : "";
  const html = wrapEmailTemplate({
    title: `Order Update \u2014 #${order.orderNumber}`,
    preheader: `Your order status is now: ${statusInfo.title}.`,
    storeContact,
    contentHtml: `
      <div style="text-align: center; margin-bottom: 16px;">
        <span style="background: #F3F4F6; color: ${statusInfo.color}; font-size: 13px; font-weight: 800; padding: 5px 14px; border-radius: 20px; text-transform: uppercase;">
          ${statusInfo.title}
        </span>
      </div>
      <h2 style="color: #3C0815; font-size: 18px; margin-top: 0; text-align: center;">
        Order #${order.orderNumber}
      </h2>
      <p style="font-size: 14px; line-height: 1.6; color: #374151; text-align: center;">
        Namaste ${customerName}, ${statusInfo.desc}
      </p>

      ${trackingHtml}

      <div style="text-align: center; margin-top: 24px;">
        <a href="${appBaseUrl}/dashboard" class="btn">Track Order in Dashboard</a>
      </div>
    `
  });
  const trackingText = order.trackingInfo?.trackingNumber ? `
Courier Tracking Information:
Courier: ${order.trackingInfo.courierName || "Standard Express"}
AWB / Tracking Number: ${order.trackingInfo.trackingNumber}${order.trackingInfo.trackingUrl ? `
Tracking Link: ${order.trackingInfo.trackingUrl}` : ""}
` : "";
  const text = `Namaste ${customerName},

Order #${order.orderNumber} Update:
${statusInfo.title} \u2014 ${statusInfo.desc}
${trackingText}
Track your order anytime at: ${appBaseUrl}/dashboard

Malwa Namkeen House \xB7 Ujjain`;
  return sendEmail({
    to: customerEmail,
    subject: isTrackingUpdate ? `Tracking Attached (#${order.orderNumber}): ${order.trackingInfo?.courierName || "Courier"} Express` : `Order Update (#${order.orderNumber}): ${statusInfo.title}`,
    html,
    text,
    eventType: "order_status_update",
    relatedId: `${order.orderNumber}_${newStatus}${isTrackingUpdate ? "_track" : ""}`
  });
}
async function sendNewOrderAdminAlert({
  order,
  adminEmails,
  storeContact
}) {
  const { appBaseUrl } = getEmailConfig();
  const itemCount = (order.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0);
  const html = wrapEmailTemplate({
    title: `[NEW ORDER] #${order.orderNumber} \xB7 \u20B9${order.total}`,
    preheader: `New store order received for \u20B9${order.total} from ${order.customerInfo?.name || "Customer"}.`,
    storeContact,
    contentHtml: `
      <h2 style="color: #3C0815; font-size: 18px; margin-top: 0;">New Customer Order Placed</h2>
      <p style="font-size: 14px; color: #374151;">
        A new order has been submitted on the storefront and is awaiting fulfillment.
      </p>
      <div style="background: #FAF7F2; padding: 14px; border-radius: 10px; margin: 16px 0; font-size: 13.5px;">
        <div>Order Number: <strong>#${order.orderNumber}</strong></div>
        <div>Customer: <strong>${order.customerInfo?.name || "Customer"}</strong> (${order.customerInfo?.phone || "No phone"})</div>
        <div>Total Items: <strong>${itemCount}</strong></div>
        <div>Payment Method: <strong>${(order.paymentMethod || "cod").toUpperCase()}</strong></div>
        <div>Order Amount: <strong style="color: #3C0815; font-size: 15px;">\u20B9${order.total}</strong></div>
      </div>
      <div style="text-align: center; margin-top: 20px;">
        <a href="${appBaseUrl}/admin/orders" class="btn">Manage Order in Admin Portal</a>
      </div>
    `
  });
  const text = `[NEW ORDER] #${order.orderNumber} (\u20B9${order.total})

A new order has been placed on the storefront and is awaiting fulfillment.

Customer: ${order.customerInfo?.name || "Customer"} (${order.customerInfo?.phone || "No phone"})
Total Items: ${itemCount}
Payment Method: ${(order.paymentMethod || "cod").toUpperCase()}
Order Amount: \u20B9${order.total}

Manage this order in the Admin Portal:
${appBaseUrl}/admin/orders

Malwa Namkeen House`;
  const results = [];
  const uniqueEmails = [...new Set(adminEmails.map((e) => e.trim().toLowerCase()))];
  for (const adminEmail of uniqueEmails) {
    const res = await sendEmail({
      to: adminEmail,
      subject: `[Admin Alert] New Order #${order.orderNumber} (\u20B9${order.total})`,
      html,
      text,
      eventType: "admin_new_order_alert",
      relatedId: order.orderNumber
    });
    results.push(res);
  }
  return results;
}
async function sendCustomerOrderCancellationAdminAlert({
  order,
  adminEmails,
  cancelledBy = "customer",
  reason
}) {
  const { appBaseUrl } = getEmailConfig();
  const customerName = order.customerInfo?.name || order.shippingAddress?.name || "Customer";
  const html = wrapEmailTemplate({
    title: `[ORDER CANCELLED] #${order.orderNumber}`,
    preheader: `Order #${order.orderNumber} was cancelled by ${cancelledBy}. Inventory has been automatically restocked.`,
    contentHtml: `
      <div style="text-align: center; margin-bottom: 16px;">
        <span style="background: #FEE2E2; color: #991B1B; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; text-transform: uppercase;">
          Order Cancelled
        </span>
      </div>
      <h2 style="color: #3C0815; font-size: 18px; margin-top: 0;">Order #${order.orderNumber} Cancelled</h2>
      <p style="font-size: 14px; color: #374151;">
        An order has been cancelled by <strong>${cancelledBy}</strong>. Reserved inventory was restored to stock. Please ensure this order is not packed or dispatched.
      </p>
      <div style="background: #FAF7F2; padding: 14px; border-radius: 10px; margin: 16px 0; font-size: 13.5px;">
        <div>Order Number: <strong>#${order.orderNumber}</strong></div>
        <div>Customer: <strong>${customerName}</strong> (${order.customerInfo?.phone || order.shippingAddress?.phone || "No phone"})</div>
        <div>Order Value: <strong>\u20B9${order.total}</strong></div>
        ${reason ? `<div>Cancellation Reason: <em>${reason}</em></div>` : ""}
      </div>
      <div style="text-align: center; margin-top: 20px;">
        <a href="${appBaseUrl}/admin/orders" class="btn">View Order Details</a>
      </div>
    `
  });
  const text = `[ORDER CANCELLED] #${order.orderNumber}

Order #${order.orderNumber} has been cancelled by ${cancelledBy}.
Customer: ${customerName}
Order Value: \u20B9${order.total}
${reason ? `Reason: ${reason}
` : ""}Reserved inventory has been automatically restored. Do not dispatch this order.

Portal: ${appBaseUrl}/admin/orders

Malwa Namkeen House`;
  const results = [];
  const uniqueEmails = [...new Set(adminEmails.map((e) => e.trim().toLowerCase()))];
  for (const adminEmail of uniqueEmails) {
    const res = await sendEmail({
      to: adminEmail,
      subject: `[Admin Alert] Order #${order.orderNumber} Cancelled (${cancelledBy})`,
      html,
      text,
      eventType: "admin_order_cancellation_alert",
      relatedId: order.orderNumber
    });
    results.push(res);
  }
  return results;
}
async function sendInquiryAcknowledgement({
  inquiry,
  storeContact
}) {
  const customerEmail = inquiry.email;
  const customerName = inquiry.name || "Customer";
  if (!customerEmail) {
    return { success: false, provider: "none", error: "No recipient email provided.", delivered: false };
  }
  const referenceId = inquiry._id ? String(inquiry._id).slice(-6).toUpperCase() : "MN-INQ";
  const html = wrapEmailTemplate({
    title: "Inquiry Received",
    preheader: `Thank you for contacting Malwa Namkeen House (Ref: #${referenceId}).`,
    storeContact,
    contentHtml: `
      <h2 style="color: #3C0815; font-size: 18px; margin-top: 0;">Namaste ${customerName},</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        Thank you for reaching out to Malwa Namkeen House. We have received your inquiry regarding <strong>${inquiry.category || "Namkeen Orders"}</strong>.
      </p>
      <div style="background: #FAF7F2; padding: 14px; border-radius: 10px; margin: 16px 0; font-size: 13px;">
        <div>Reference ID: <strong>#${referenceId}</strong></div>
        <div>Category: <strong>${inquiry.category || "General"}</strong></div>
        <div style="margin-top: 8px; font-style: italic; color: #57534E;">"${inquiry.message}"</div>
      </div>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        Our team in Ujjain will review your request and get back to you via phone or email within 1 business day.
      </p>
    `
  });
  const text = `Namaste ${customerName},

Thank you for reaching out to Malwa Namkeen House (Reference: #${referenceId}).

Category: ${inquiry.category || "General"}
Your Message:
"${inquiry.message}"

Our team in Ujjain will review your request and get back to you within 1 business day.

Malwa Namkeen House`;
  return sendEmail({
    to: customerEmail,
    subject: `We have received your inquiry (Ref: #${referenceId}) \u2014 Malwa Namkeen House`,
    html,
    text,
    eventType: "inquiry_acknowledgement",
    relatedId: String(inquiry._id || referenceId)
  });
}
async function sendNewInquiryAdminAlert({
  inquiry,
  adminEmails,
  storeContact
}) {
  const { appBaseUrl } = getEmailConfig();
  const referenceId = inquiry._id ? String(inquiry._id).slice(-6).toUpperCase() : "MN-INQ";
  const html = wrapEmailTemplate({
    title: `[NEW INQUIRY] #${referenceId} \xB7 ${inquiry.category}`,
    preheader: `New customer inquiry from ${inquiry.name} (${inquiry.email}).`,
    storeContact,
    contentHtml: `
      <h2 style="color: #3C0815; font-size: 18px; margin-top: 0;">New Customer Inquiry Received</h2>
      <div style="background: #FAF7F2; padding: 14px; border-radius: 10px; margin: 16px 0; font-size: 13.5px;">
        <div>Reference ID: <strong>#${referenceId}</strong></div>
        <div>Customer Name: <strong>${inquiry.name}</strong></div>
        <div>Email: <strong>${inquiry.email}</strong></div>
        <div>Phone: <strong>${inquiry.phone || "Not provided"}</strong></div>
        <div>Category: <strong>${inquiry.category}</strong></div>
        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #EAE5D9;">
          <strong>Message:</strong><br>
          ${inquiry.message}
        </div>
      </div>
      <div style="text-align: center; margin-top: 20px;">
        <a href="${appBaseUrl}/admin/inquiries" class="btn">View & Respond in Admin Portal</a>
      </div>
    `
  });
  const text = `[NEW INQUIRY] #${referenceId} \xB7 ${inquiry.category}

Customer: ${inquiry.name}
Email: ${inquiry.email}
Phone: ${inquiry.phone || "Not provided"}
Category: ${inquiry.category}

Message:
${inquiry.message}

View & respond in the Admin Portal:
${appBaseUrl}/admin/inquiries

Malwa Namkeen House`;
  const results = [];
  const uniqueEmails = [...new Set(adminEmails.map((e) => e.trim().toLowerCase()))];
  for (const adminEmail of uniqueEmails) {
    const res = await sendEmail({
      to: adminEmail,
      subject: `[Admin Alert] New Inquiry #${referenceId} from ${inquiry.name}`,
      html,
      text,
      eventType: "admin_new_inquiry_alert",
      relatedId: String(inquiry._id || referenceId)
    });
    results.push(res);
  }
  return results;
}
async function sendPasswordChangeOtp({
  email: email2,
  name: name2,
  otp,
  minutesValid = 10
}) {
  const safeName = name2 ? name2.trim() : "Customer";
  const html = wrapEmailTemplate({
    title: "Verify Password Change",
    preheader: `Your verification code is: ${otp}`,
    contentHtml: `
      <h2 style="color: #3C0815; font-size: 18px; margin-top: 0;">Hello ${safeName},</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        We received a request to change the password for your Malwa Namkeen House account.
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        Your verification code is:
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <div style="display: inline-block; background: #FAF7F2; border: 2px dashed #C89A3D; border-radius: 12px; padding: 16px 36px;">
          <span style="font-family: monospace, Courier, sans-serif; font-size: 32px; font-weight: 800; letter-spacing: 0.25em; color: #3C0815;">
            ${otp}
          </span>
        </div>
      </div>
      <p style="font-size: 13.5px; line-height: 1.5; color: #57534E; text-align: center;">
        This code expires in <strong>${minutesValid} minutes</strong>.
      </p>
      <p style="font-size: 12.5px; color: #6B7280; line-height: 1.5; margin-top: 24px; border-top: 1px solid #EAE5D9; padding-top: 16px;">
        <strong>Security Notice:</strong> If you did not request this change, you can safely ignore this email. Malwa Namkeen House will never ask for your verification code.
      </p>
    `
  });
  const text = `Hello ${safeName},

We received a request to change the password for your Malwa Namkeen House account.

Your verification code is:

${otp}

This code expires in ${minutesValid} minutes.

If you did not request this change, you can ignore this email.

Malwa Namkeen House`;
  return sendEmail({
    to: email2,
    subject: "Malwa Namkeen House - Verify Password Change",
    html,
    text,
    eventType: "password_change_otp",
    relatedId: email2
  });
}
async function sendPasswordChangedConfirmation({
  email: email2,
  name: name2
}) {
  const safeName = name2 ? name2.trim() : "Customer";
  const timeFormatted = (/* @__PURE__ */ new Date()).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short"
  });
  const html = wrapEmailTemplate({
    title: "Password Successfully Changed",
    preheader: "Your Malwa Namkeen House account password was changed.",
    contentHtml: `
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="background: #D1FAE5; color: #065F46; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; text-transform: uppercase;">
          Security Alert \xB7 Password Changed
        </span>
      </div>
      <h2 style="color: #3C0815; font-size: 18px; margin-top: 0; text-align: center;">
        Hello ${safeName},
      </h2>
      <p style="font-size: 14px; line-height: 1.6; color: #374151; text-align: center;">
        Your Malwa Namkeen House account password was successfully changed on <strong>${timeFormatted} (IST)</strong>.
      </p>
      <div style="background: #FAF7F2; border: 1px solid #EAE5D9; border-radius: 10px; padding: 16px; margin: 20px 0; font-size: 13px; color: #4B5563; line-height: 1.6;">
        <strong style="color: #991B1B;">Did not perform this change?</strong><br>
        If you did not perform this change, please contact our support team immediately at <a href="mailto:malwanamkeenhouse@gmail.com" style="color: #3C0815; font-weight: 600;">malwanamkeenhouse@gmail.com</a> or call <strong>+91 7987732765</strong> to secure your account.
      </div>
    `
  });
  const text = `Hello ${safeName},

Your Malwa Namkeen House account password was successfully changed on ${timeFormatted} (IST).

If you did not perform this change, please contact our support team immediately at malwanamkeenhouse@gmail.com or +91 7987732765.

Malwa Namkeen House`;
  return sendEmail({
    to: email2,
    subject: "Your Malwa Namkeen House Password Was Changed",
    html,
    text,
    eventType: "password_changed_notification",
    relatedId: email2
  });
}
async function sendRoleChangedNotification({
  email: email2,
  name: name2,
  oldRole,
  newRole
}) {
  const { appBaseUrl } = getEmailConfig();
  const safeName = name2 ? name2.trim() : "User";
  let subject = "Access Role Updated - Malwa Namkeen House";
  let bodyHtml = "";
  let bodyText = "";
  if (newRole === "super_admin") {
    subject = "You Have Been Made a Super Admin - Malwa Namkeen House";
    bodyHtml = `
      <h2 style="color: #3C0815; font-size: 18px; margin-top: 0;">Hello ${safeName},</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        Your Malwa Namkeen House account has been granted <strong>Super Administrator</strong> access.
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        Your account now has elevated administrative permissions across the platform, including team access control, staff management, and system-level configuration.
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${appBaseUrl}/admin/staff" class="btn">Manage Staff Portal</a>
      </div>
      <p style="font-size: 12.5px; color: #6B7280; line-height: 1.5; margin-top: 24px; border-top: 1px solid #EAE5D9; padding-top: 16px;">
        If you believe this change was made by mistake, please contact the site administrator.
      </p>
    `;
    bodyText = `Hello ${safeName},

Your Malwa Namkeen House account now has elevated administrative permissions as Super Administrator.

Portal: ${appBaseUrl}/admin/staff

If you believe this change was made by mistake, please contact the site administrator.

Malwa Namkeen House`;
  } else if (newRole === "admin" && oldRole !== "super_admin") {
    subject = "You Have Been Made an Admin - Malwa Namkeen House";
    bodyHtml = `
      <h2 style="color: #3C0815; font-size: 18px; margin-top: 0;">Hello ${safeName},</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        Your Malwa Namkeen House account has been granted <strong>Admin</strong> access.
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        You can now access the Admin Dashboard and the permissions assigned to the Admin role.
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${appBaseUrl}/admin/dashboard" class="btn">Go to Admin Dashboard</a>
      </div>
      <p style="font-size: 12.5px; color: #6B7280; line-height: 1.5; margin-top: 24px; border-top: 1px solid #EAE5D9; padding-top: 16px;">
        If you believe this change was made by mistake, please contact the site administrator.
      </p>
    `;
    bodyText = `Hello ${safeName},

Your Malwa Namkeen House account has been granted Admin access.

You can now access the Admin Dashboard and the permissions assigned to the Admin role.

If you believe this change was made by mistake, please contact the site administrator.

Malwa Namkeen House`;
  } else {
    subject = "Access Role Updated - Malwa Namkeen House";
    const oldRoleTitle = oldRole === "super_admin" ? "Super Administrator" : oldRole === "admin" ? "Administrator" : oldRole;
    const newRoleTitle = newRole === "admin" ? "Administrator" : newRole === "customer" ? "Customer" : newRole;
    bodyHtml = `
      <h2 style="color: #3C0815; font-size: 18px; margin-top: 0;">Hello ${safeName},</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        Your Malwa Namkeen House access role has been updated from <strong>${oldRoleTitle}</strong> to <strong>${newRoleTitle}</strong>.
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #374151;">
        Your administrative privileges and permissions have been updated accordingly.
      </p>
      <p style="font-size: 12.5px; color: #6B7280; line-height: 1.5; margin-top: 24px; border-top: 1px solid #EAE5D9; padding-top: 16px;">
        If you have questions regarding this change, please contact the store administrator.
      </p>
    `;
    bodyText = `Hello ${safeName},

Your Malwa Namkeen House access role has been updated from ${oldRoleTitle} to ${newRoleTitle}.

If you believe this was in error, please contact the store administrator.

Malwa Namkeen House`;
  }
  const html = wrapEmailTemplate({
    title: subject,
    preheader: `Your account role has been updated to ${newRole}.`,
    contentHtml: bodyHtml
  });
  return sendEmail({
    to: email2,
    subject,
    html,
    text: bodyText,
    eventType: "role_changed_notification",
    relatedId: `${email2}_${newRole}`
  });
}
var sendAdminInvitationEmail = sendAdminInvitation;
var sendPasswordResetEmail = sendAdminPasswordReset;
function esc(s) {
  if (s == null) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function row(label, value) {
  return `<tr>
    <td style="padding:6px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#C89A3D;width:140px;vertical-align:top;">${esc(label)}</td>
    <td style="padding:6px 0;font-size:14px;color:#34211D;line-height:1.55;">${esc(value)}</td>
  </tr>`;
}
function dataTable(rows) {
  return `<table cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;border-collapse:collapse;">
    ${rows.map(([l, v]) => row(l, v)).join("")}
  </table>`;
}
var ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || BUSINESS.email;
async function sendContactCustomerEmail(d) {
  const body = `
    <h2 style="margin:0 0 6px;font-family:Georgia,serif;font-size:24px;color:#3C0815;">
      Thank you, ${esc(d.customerName)}!
    </h2>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#5E4940;">
      We have received your enquiry and our team will get back to you shortly.
    </p>
    ${dataTable([
    ["Reference", d.referenceId],
    ["Category", d.categoryLabel],
    ["Your Name", d.customerName],
    ["Your Email", d.customerEmail],
    ["Phone", d.phone || "\u2014"]
  ])}
    <p style="margin:20px 0 0;font-size:14px;line-height:1.7;color:#5E4940;">
      <strong>Your message:</strong><br/>
      <span style="color:#75645C;">${esc(d.message)}</span>
    </p>
    <p style="margin:24px 0 0;font-size:14px;line-height:1.65;color:#5E4940;">
      <strong>What happens next?</strong><br/>
      Our team typically responds within one business day. For urgent matters,
      reach us directly at
      <a href="mailto:${esc(BUSINESS.email)}" style="color:#C89A3D;">${esc(BUSINESS.email)}</a>
      or WhatsApp <a href="https://wa.me/${esc(BUSINESS.whatsappNumber)}" style="color:#C89A3D;">${esc(BUSINESS.phone)}</a>.
    </p>`;
  const text = `Thank you, ${d.customerName}!

We have received your enquiry (Ref: #${d.referenceId}) regarding ${d.categoryLabel}.

Your message:
"${d.message}"

Our team typically responds within one business day.

${BUSINESS.name}`;
  return sendEmail({
    eventType: "inquiry_acknowledgement",
    to: d.customerEmail,
    subject: `We received your enquiry \u2014 ${BUSINESS.name}`,
    html: wrapEmailTemplate({
      title: `Enquiry Received \u2014 ${BUSINESS.name}`,
      contentHtml: body
    }),
    text
  });
}
async function sendContactAdminEmail(d) {
  const body = `
    <h2 style="margin:0 0 6px;font-family:Georgia,serif;font-size:22px;color:#FFF8EC;">
      New ${esc(d.categoryLabel)} Enquiry
    </h2>
    <p style="margin:0 0 20px;font-size:13px;color:rgba(255,248,236,0.70);">
      Ref: <strong style="color:#F0C74E;">${esc(d.referenceId)}</strong> \xB7
      ${esc(d.submittedAt)}
    </p>
    ${dataTable([
    ["Reference", d.referenceId],
    ["Category", d.categoryLabel],
    ["Name", d.customerName],
    ["Email", d.customerEmail],
    ["Phone", d.phone || "\u2014"],
    ["Location", d.locationId]
  ])}
    <p style="margin:16px 0 0;font-size:14px;line-height:1.7;color:rgba(255,248,236,0.85);">
      <strong style="color:#F0C74E;">Message:</strong><br/>
      ${esc(d.message)}
    </p>
    <p style="margin:24px 0 0;">
      <a href="https://wa.me/${esc(BUSINESS.whatsappNumber)}?text=${encodeURIComponent(`Hello ${d.customerName}, thank you for reaching out to MALWA NAMKEEN HOUSE (Ref: ${d.referenceId}). We are happy to assist you!`)}"
         style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;
                padding:10px 22px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
        Reply via WhatsApp
      </a>
    </p>`;
  const text = `New ${d.categoryLabel} Enquiry (Ref: #${d.referenceId})

Submitted: ${d.submittedAt}
Name: ${d.customerName}
Email: ${d.customerEmail}
Phone: ${d.phone || "\u2014"}
Location: ${d.locationId}

Message:
${d.message}

${BUSINESS.name}`;
  return sendEmail({
    eventType: "admin_new_inquiry_alert",
    to: ADMIN_EMAIL,
    subject: `[${d.categoryLabel}] ${d.customerName} \u2014 ${BUSINESS.name}`,
    html: wrapEmailTemplate({
      title: `New Enquiry \u2014 ${BUSINESS.name}`,
      contentHtml: body
    }),
    text
  });
}
async function sendReservationCustomerEmail(d) {
  const body = `
    <h2 style="margin:0 0 6px;font-family:Georgia,serif;font-size:24px;color:#3C0815;">
      Reservation Enquiry Received
    </h2>
    <p style="margin:0 0 6px;font-size:15px;line-height:1.65;color:#5E4940;">
      Thank you, <strong>${esc(d.customerName)}</strong>. We have received your reservation enquiry.
    </p>
    <div style="background:#FFF3CD;border:1px solid #C89A3D;border-radius:10px;padding:14px 18px;margin:18px 0;">
      <p style="margin:0;font-size:13px;font-weight:600;color:#856404;line-height:1.6;">
        \u26A0 This is a reservation <em>enquiry</em> \u2014 not a confirmed booking.
        Our team will contact you to confirm availability.
      </p>
    </div>
    ${dataTable([
    ["Reference", d.referenceId],
    ["Name", d.customerName],
    ["Date Requested", d.reservationDate],
    ["Preferred Time", d.preferredTime],
    ["Guests", String(d.guestCount)],
    ["Special Request", d.specialRequest || "\u2014"]
  ])}
    <p style="margin:20px 0 0;font-size:14px;line-height:1.65;color:#5E4940;">
      <strong>What happens next?</strong><br/>
      Our team will call or message you to confirm your table.
      For same-day enquiries, please also WhatsApp us at
      <a href="https://wa.me/${esc(BUSINESS.whatsappNumber)}" style="color:#C89A3D;">${esc(BUSINESS.phone)}</a>.
    </p>`;
  const text = `Reservation Enquiry Received \u2014 ${BUSINESS.name}

Thank you, ${d.customerName}. We have received your reservation enquiry (Ref: #${d.referenceId}).

Please note: This is a reservation enquiry \u2014 not a confirmed booking. Our team will contact you to confirm availability.

Details:
Date Requested: ${d.reservationDate}
Preferred Time: ${d.preferredTime}
Guests: ${d.guestCount}
Special Request: ${d.specialRequest || "\u2014"}

${BUSINESS.name}`;
  return sendEmail({
    eventType: "inquiry_acknowledgement",
    to: d.customerEmail,
    subject: `Reservation enquiry received \u2014 ${BUSINESS.name}`,
    html: wrapEmailTemplate({
      title: `Reservation Enquiry \u2014 ${BUSINESS.name}`,
      contentHtml: body
    }),
    text
  });
}
async function sendReservationAdminEmail(d) {
  const body = `
    <h2 style="margin:0 0 6px;font-family:Georgia,serif;font-size:22px;color:#FFF8EC;">
      New Reservation Enquiry
    </h2>
    <p style="margin:0 0 20px;font-size:13px;color:rgba(255,248,236,0.70);">
      Ref: <strong style="color:#F0C74E;">${esc(d.referenceId)}</strong> \xB7
      ${esc(d.submittedAt)}
    </p>
    ${dataTable([
    ["Reference", d.referenceId],
    ["Name", d.customerName],
    ["Email", d.customerEmail],
    ["Phone", d.phone],
    ["Date", d.reservationDate],
    ["Time", d.preferredTime],
    ["Guests", String(d.guestCount)],
    ["Special Req.", d.specialRequest || "\u2014"],
    ["Location", d.locationId]
  ])}
    <p style="margin:24px 0 0;">
      <a href="https://wa.me/${esc(BUSINESS.whatsappNumber.replace(d.phone, ""))}${encodeURIComponent(d.phone.replace(/\D/g, ""))}?text=${encodeURIComponent(`Hello ${d.customerName}, this is MALWA NAMKEEN HOUSE confirming your enquiry (Ref: ${d.referenceId}) for ${d.reservationDate} at ${d.preferredTime}.`)}"
         style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;
                padding:10px 22px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
        Reply via WhatsApp
      </a>
    </p>`;
  const text = `New Reservation Enquiry (Ref: #${d.referenceId})

Submitted: ${d.submittedAt}
Name: ${d.customerName}
Email: ${d.customerEmail}
Phone: ${d.phone}
Date: ${d.reservationDate}
Time: ${d.preferredTime}
Guests: ${d.guestCount}
Special Request: ${d.specialRequest || "\u2014"}
Location: ${d.locationId}

${BUSINESS.name}`;
  return sendEmail({
    eventType: "admin_new_inquiry_alert",
    to: ADMIN_EMAIL,
    subject: `[Reservation] ${d.customerName} \xB7 ${d.reservationDate} \xB7 ${d.guestCount} guests`,
    html: wrapEmailTemplate({
      title: `New Reservation \u2014 ${BUSINESS.name}`,
      contentHtml: body
    }),
    text
  });
}

// server/routes/auth.ts
var router = Router();
function maskEmail2(email2) {
  if (!email2 || !email2.includes("@")) return "******";
  const [local, domain] = email2.split("@");
  if (!local || !domain) return "******";
  return `${local.charAt(0)}*****@${domain}`;
}
var passwordChangeRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { default: false },
  store: new MongoRateLimitStore("auth:pwd-req", 15 * 60 * 1e3),
  message: {
    success: false,
    message: "Too many password change requests. Please try again after 15 minutes."
  }
});
var passwordChangeVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { default: false },
  store: new MongoRateLimitStore("auth:pwd-verify", 15 * 60 * 1e3),
  message: {
    success: false,
    message: "Too many verification attempts. Please try again after 15 minutes."
  }
});
var loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: process.env.NODE_ENV === "production" && !process.env.CI ? 10 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { default: false },
  store: new MongoRateLimitStore("auth:login", 15 * 60 * 1e3),
  message: {
    success: false,
    message: "Too many sign in attempts. Please try again after 15 minutes."
  }
});
var adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: process.env.NODE_ENV === "production" && !process.env.CI ? 5 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { default: false },
  store: new MongoRateLimitStore("auth:admin-login", 15 * 60 * 1e3),
  message: {
    success: false,
    message: "Too many admin sign in attempts. Please try again after 15 minutes."
  }
});
var registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1e3,
  // 1 hour
  max: process.env.NODE_ENV === "production" && !process.env.CI ? 10 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { default: false },
  store: new MongoRateLimitStore("auth:register", 60 * 60 * 1e3),
  message: {
    success: false,
    message: "Too many registration requests from this network. Please try again later."
  }
});
var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
router.post("/register", registerLimiter, async (req, res) => {
  try {
    const { name: name2, email: email2, phone: phone2, password } = req.body;
    if (!name2 || typeof name2 !== "string" || name2.trim().length < 2) {
      res.status(400).json({ success: false, message: "Please provide your full name (minimum 2 characters)." });
      return;
    }
    if (!email2 || typeof email2 !== "string" || !EMAIL_REGEX.test(email2.trim().toLowerCase())) {
      res.status(400).json({ success: false, message: "Please provide a valid email address." });
      return;
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long."
      });
      return;
    }
    const cleanEmail = email2.trim().toLowerCase();
    const cleanName = name2.trim();
    const cleanPhone = phone2 && typeof phone2 === "string" ? phone2.trim() : "";
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      res.status(409).json({
        success: false,
        message: "An account with this email address already exists. Please sign in."
      });
      return;
    }
    const hashedPassword = await hashPassword(password);
    const isOwner = getDesignatedAdminEmails().includes(cleanEmail);
    const assignedRole = isOwner ? "super_admin" : "customer";
    const newUser = await User.create({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password: hashedPassword,
      role: assignedRole,
      active: true
    });
    const token = generateToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role
    });
    setAuthCookie(res, token);
    sendCustomerWelcomeEmail({
      email: newUser.email,
      name: newUser.name
    }).catch((emailErr) => {
      console.warn("[Welcome Email Warning] Failed to dispatch customer welcome email:", emailErr);
    });
    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role
      },
      token
    });
  } catch (err) {
    console.error("[Auth Register Error]", err instanceof Error ? err.message : err);
    res.status(500).json({
      success: false,
      message: "Unable to complete registration. Please verify your connection or try again shortly."
    });
  }
});
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email: email2, password } = req.body;
    if (!email2 || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
      return;
    }
    const cleanEmail = String(email2).trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select("+password");
    if (!user || !user.password) {
      res.status(401).json({
        success: false,
        message: "Email or password is incorrect."
      });
      return;
    }
    if (!user.active) {
      res.status(403).json({
        success: false,
        message: "Your account is currently inactive. Please contact support."
      });
      return;
    }
    const isValid = await comparePassword(String(password), user.password);
    if (!isValid) {
      res.status(401).json({
        success: false,
        message: "Email or password is incorrect."
      });
      return;
    }
    user.lastLoginAt = /* @__PURE__ */ new Date();
    await user.save();
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });
    setAuthCookie(res, token);
    res.json({
      success: true,
      message: "Signed in successfully.",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token
    });
  } catch (err) {
    console.error("[Auth Login Error]", err instanceof Error ? err.message : err);
    res.status(500).json({
      success: false,
      message: "Unable to connect to the authentication service. Please try again shortly."
    });
  }
});
router.get("/google/config", (_req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "";
  res.json({
    success: true,
    clientId,
    isConfigured: Boolean(clientId)
  });
});
var testTokenVerifier = null;
async function verifyGoogleToken(credential) {
  if (!credential || typeof credential !== "string" || credential.trim().length < 10) {
    return null;
  }
  if (testTokenVerifier && process.env.NODE_ENV !== "production") {
    return testTokenVerifier(credential);
  }
  try {
    const configuredClientId = (process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "").trim();
    if (!configuredClientId) {
      console.warn("[Google Auth Error] GOOGLE_CLIENT_ID is not configured on server.");
      return null;
    }
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential.trim())}`
    );
    if (!response.ok) {
      console.warn("[Google Auth Error] Token verification failed with status:", response.status);
      return null;
    }
    const payload = await response.json();
    if (!payload || !payload.email || !payload.sub) {
      return null;
    }
    const validIssuers = ["accounts.google.com", "https://accounts.google.com"];
    if (payload.iss && !validIssuers.includes(payload.iss)) {
      console.warn("[Google Auth Error] Invalid token issuer:", payload.iss);
      return null;
    }
    if (payload.aud !== configuredClientId) {
      console.warn("[Google Auth Error] Audience mismatch. Expected:", configuredClientId, "Got:", payload.aud);
      return null;
    }
    if (payload.exp && Number(payload.exp) * 1e3 < Date.now()) {
      console.warn("[Google Auth Error] Google token has expired.");
      return null;
    }
    const isEmailVerified = payload.email_verified === "true" || payload.email_verified === true;
    if (!isEmailVerified) {
      console.warn("[Google Auth Error] Google email is not verified.");
      return null;
    }
    return {
      sub: payload.sub,
      email: String(payload.email).toLowerCase().trim(),
      name: payload.name || payload.given_name || String(payload.email).split("@")[0],
      picture: payload.picture || "",
      email_verified: true
    };
  } catch (err) {
    console.error("[Google Auth Verification Exception]:", err instanceof Error ? err.message : err);
    return null;
  }
}
router.post("/google", loginLimiter, async (req, res) => {
  try {
    const { credential, idToken } = req.body;
    const rawToken = typeof credential === "string" && credential.trim() ? credential.trim() : typeof idToken === "string" && idToken.trim() ? idToken.trim() : null;
    if (!rawToken || rawToken.length < 10) {
      res.status(400).json({
        success: false,
        message: "Google credential token is required."
      });
      return;
    }
    const googleUser = await verifyGoogleToken(rawToken);
    if (!googleUser || !googleUser.email) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired Google authentication token. Please try again."
      });
      return;
    }
    const cleanEmail = googleUser.email.trim().toLowerCase();
    let user = await User.findOne({
      $or: [{ email: cleanEmail }, { googleId: googleUser.sub }]
    });
    if (user) {
      if (!user.active) {
        res.status(403).json({
          success: false,
          message: "Your account is currently inactive. Please contact support."
        });
        return;
      }
      const isOwner = getDesignatedAdminEmails().includes(cleanEmail);
      if (!user.googleId) user.googleId = googleUser.sub;
      if (googleUser.picture && !user.avatar) user.avatar = googleUser.picture;
      if (isOwner && user.role !== "super_admin") user.role = "super_admin";
      user.lastLoginAt = /* @__PURE__ */ new Date();
      if (!user.emailVerifiedAt) user.emailVerifiedAt = /* @__PURE__ */ new Date();
      await user.save();
    } else {
      const isOwner = getDesignatedAdminEmails().includes(cleanEmail);
      user = await User.create({
        name: googleUser.name.trim(),
        email: cleanEmail,
        googleId: googleUser.sub,
        avatar: googleUser.picture || "",
        role: isOwner ? "super_admin" : "customer",
        active: true,
        lastLoginAt: /* @__PURE__ */ new Date(),
        emailVerifiedAt: /* @__PURE__ */ new Date()
      });
      sendCustomerWelcomeEmail({
        email: user.email,
        name: user.name
      }).catch((emailErr) => {
        console.warn("[Welcome Email Warning] Failed to dispatch Google customer welcome email:", emailErr);
      });
    }
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });
    setAuthCookie(res, token);
    res.json({
      success: true,
      message: "Google Sign-In successful.",
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        avatar: user.avatar || "",
        role: user.role,
        googleId: user.googleId || null,
        hasPassword: Boolean(user.password)
      }
    });
  } catch (err) {
    console.error("[Google Auth Error]", err);
    res.status(500).json({
      success: false,
      message: "Google authentication failed. Please try again or use email sign in."
    });
  }
});
router.post("/admin/login", adminLoginLimiter, async (req, res) => {
  try {
    const { email: email2, password } = req.body;
    if (!email2 || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
      return;
    }
    const cleanEmail = String(email2).trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select("+password");
    if (!user || !user.password) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials."
      });
      return;
    }
    const isValid = await comparePassword(String(password), user.password);
    if (!isValid) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials."
      });
      return;
    }
    if (user.role !== "admin" && user.role !== "super_admin") {
      res.status(403).json({
        success: false,
        message: "Access denied. You do not have administrator permissions."
      });
      return;
    }
    if (!user.active) {
      res.status(403).json({
        success: false,
        message: "Your administrator account has been deactivated. Please contact your super administrator."
      });
      return;
    }
    user.lastLoginAt = /* @__PURE__ */ new Date();
    await user.save();
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });
    setAuthCookie(res, token);
    res.json({
      success: true,
      message: "Admin authentication successful.",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token
    });
  } catch (err) {
    console.error("[Admin Auth Login Error]", err instanceof Error ? err.message : err);
    res.status(500).json({
      success: false,
      message: "Admin sign in failed. Please try again later."
    });
  }
});
router.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({
    success: true,
    message: "Logged out successfully."
  });
});
router.get("/me", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authenticated." });
      return;
    }
    const user = await User.findById(req.user.userId).select("+password");
    if (!user) {
      clearAuthCookie(res);
      res.status(404).json({ success: false, message: "User profile not found." });
      return;
    }
    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        googleId: user.googleId || null,
        hasPassword: Boolean(user.password)
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve profile."
    });
  }
});
router.post("/refresh", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authenticated." });
      return;
    }
    const user = await User.findById(req.user.userId).select("+password");
    if (!user || !user.active) {
      clearAuthCookie(res);
      res.status(401).json({ success: false, message: "User account is inactive or not found." });
      return;
    }
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });
    setAuthCookie(res, token);
    res.json({
      success: true,
      message: "Session refreshed successfully.",
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        googleId: user.googleId || null,
        hasPassword: Boolean(user.password)
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to refresh session."
    });
  }
});
router.get("/admin/verify", requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: "Admin access verified.",
    admin: req.user
  });
});
router.post(
  "/password-change/request",
  requireAuth,
  passwordChangeRequestLimiter,
  async (req, res) => {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
      }
      const { currentPassword, newPassword, confirmPassword } = req.body;
      if (!currentPassword || typeof currentPassword !== "string") {
        res.status(400).json({ success: false, message: "Current password is required." });
        return;
      }
      if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters long."
        });
        return;
      }
      if (confirmPassword !== void 0 && newPassword !== confirmPassword) {
        res.status(400).json({ success: false, message: "New passwords do not match." });
        return;
      }
      if (currentPassword === newPassword) {
        res.status(400).json({
          success: false,
          message: "New password must be different from your current password."
        });
        return;
      }
      const user = await User.findById(req.user.userId).select("+password");
      if (!user || !user.active) {
        res.status(404).json({ success: false, message: "Account not found or deactivated." });
        return;
      }
      if (!user.password) {
        res.status(400).json({
          success: false,
          message: "This account signs in with Google and does not have an active password."
        });
        return;
      }
      const isMatch = await comparePassword(currentPassword, user.password);
      if (!isMatch) {
        res.status(400).json({ success: false, message: "Incorrect current password." });
        return;
      }
      const existingOtp = await OtpVerification.findOne({
        userId: user._id,
        purpose: "password-change",
        expiresAt: { $gt: /* @__PURE__ */ new Date() }
      });
      const now = /* @__PURE__ */ new Date();
      if (existingOtp && existingOtp.resendAvailableAt && existingOtp.resendAvailableAt > now) {
        const remaining = Math.ceil((existingOtp.resendAvailableAt.getTime() - now.getTime()) / 1e3);
        res.status(429).json({
          success: false,
          message: `Please wait ${remaining} second(s) before requesting another code.`,
          cooldownSeconds: remaining
        });
        return;
      }
      const otp = crypto.randomInt(1e5, 1e6).toString();
      const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
      const pendingPasswordHash = await hashPassword(newPassword);
      await OtpVerification.deleteMany({ userId: user._id, purpose: "password-change" });
      await OtpVerification.create({
        userId: user._id,
        purpose: "password-change",
        otpHash,
        pendingPasswordHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1e3),
        // 10 minutes
        attempts: 0,
        resendAvailableAt: new Date(Date.now() + 60 * 1e3)
        // 60s cooldown
      });
      const emailResult = await sendPasswordChangeOtp({
        email: user.email,
        name: user.name,
        otp,
        minutesValid: 10
      });
      if (!emailResult.success && !emailResult.simulated) {
        await OtpVerification.deleteMany({ userId: user._id, purpose: "password-change" });
        res.status(500).json({
          success: false,
          message: "Unable to dispatch verification email. Please try again later or contact support."
        });
        return;
      }
      try {
        await AuditLog.create({
          action: "PASSWORD_CHANGE_REQUESTED",
          targetUserId: user._id,
          metadata: { email: user.email }
        });
      } catch (logErr) {
        console.warn("[AuditLog] Failed to record password change request:", logErr);
      }
      res.json({
        success: true,
        message: "Verification code sent to your registered email address.",
        maskedEmail: maskEmail2(user.email),
        cooldownSeconds: 60
      });
    } catch (err) {
      console.error("[Password Change Request Error]", err);
      res.status(500).json({
        success: false,
        message: "Unable to initiate password change. Please try again shortly."
      });
    }
  }
);
router.post(
  "/password-change/verify",
  requireAuth,
  passwordChangeVerifyLimiter,
  async (req, res) => {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
      }
      const { otp } = req.body;
      if (!otp || typeof otp !== "string" || !/^\d{6}$/.test(otp.trim())) {
        res.status(400).json({
          success: false,
          message: "Please enter a valid 6-digit verification code."
        });
        return;
      }
      const cleanOtp = otp.trim();
      const otpDoc = await OtpVerification.findOne({
        userId: req.user.userId,
        purpose: "password-change",
        expiresAt: { $gt: /* @__PURE__ */ new Date() }
      }).select("+pendingPasswordHash");
      if (!otpDoc) {
        res.status(400).json({
          success: false,
          message: "Verification code has expired or was not requested. Please request a new code."
        });
        return;
      }
      if (otpDoc.attempts >= 5) {
        await OtpVerification.deleteOne({ _id: otpDoc._id });
        res.status(400).json({
          success: false,
          message: "Too many incorrect attempts. This code has been invalidated. Please request a new code."
        });
        return;
      }
      otpDoc.attempts += 1;
      await otpDoc.save();
      const submittedHash = crypto.createHash("sha256").update(cleanOtp).digest("hex");
      const submittedBuf = Buffer.from(submittedHash, "hex");
      const storedBuf = Buffer.from(otpDoc.otpHash, "hex");
      const isMatch = submittedBuf.length === storedBuf.length && crypto.timingSafeEqual(submittedBuf, storedBuf);
      if (!isMatch) {
        const remaining = Math.max(0, 5 - otpDoc.attempts);
        res.status(400).json({
          success: false,
          message: remaining > 0 ? `Incorrect verification code. ${remaining} attempt(s) remaining.` : "Too many incorrect attempts. This code has been invalidated. Please request a new code.",
          attemptsRemaining: remaining
        });
        return;
      }
      const user = await User.findById(req.user.userId);
      if (!user) {
        res.status(404).json({ success: false, message: "User profile not found." });
        return;
      }
      user.password = otpDoc.pendingPasswordHash;
      await user.save();
      await OtpVerification.deleteOne({ _id: otpDoc._id });
      await sendPasswordChangedConfirmation({
        email: user.email,
        name: user.name
      });
      try {
        await AuditLog.create({
          action: "PASSWORD_CHANGED",
          targetUserId: user._id,
          metadata: { email: user.email }
        });
      } catch (logErr) {
        console.warn("[AuditLog] Failed to record password changed:", logErr);
      }
      res.json({
        success: true,
        message: "Password changed successfully. Your account is now secured with your new password."
      });
    } catch (err) {
      console.error("[Password Change Verify Error]", err);
      res.status(500).json({
        success: false,
        message: "Failed to complete password verification. Please try again."
      });
    }
  }
);
router.post(
  "/password-change/resend",
  requireAuth,
  passwordChangeRequestLimiter,
  async (req, res) => {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
      }
      const otpDoc = await OtpVerification.findOne({
        userId: req.user.userId,
        purpose: "password-change",
        expiresAt: { $gt: /* @__PURE__ */ new Date() }
      }).select("+pendingPasswordHash");
      if (!otpDoc) {
        res.status(400).json({
          success: false,
          message: "No active password change session found. Please enter your passwords again."
        });
        return;
      }
      const now = /* @__PURE__ */ new Date();
      if (otpDoc.resendAvailableAt && otpDoc.resendAvailableAt > now) {
        const remainingSeconds = Math.ceil((otpDoc.resendAvailableAt.getTime() - now.getTime()) / 1e3);
        res.status(429).json({
          success: false,
          message: `Please wait ${remainingSeconds} second(s) before requesting another code.`,
          cooldownSeconds: remainingSeconds
        });
        return;
      }
      const newOtp = crypto.randomInt(1e5, 1e6).toString();
      const newOtpHash = crypto.createHash("sha256").update(newOtp).digest("hex");
      otpDoc.otpHash = newOtpHash;
      otpDoc.attempts = 0;
      otpDoc.expiresAt = new Date(Date.now() + 10 * 60 * 1e3);
      otpDoc.resendAvailableAt = new Date(Date.now() + 60 * 1e3);
      await otpDoc.save();
      const user = await User.findById(req.user.userId);
      if (!user) {
        res.status(404).json({ success: false, message: "User profile not found." });
        return;
      }
      const emailResult = await sendPasswordChangeOtp({
        email: user.email,
        name: user.name,
        otp: newOtp,
        minutesValid: 10
      });
      if (!emailResult.success && !emailResult.simulated) {
        await OtpVerification.deleteMany({ userId: user._id, purpose: "password-change" });
        res.status(500).json({
          success: false,
          message: "Unable to dispatch verification email. Please try again later or contact support."
        });
        return;
      }
      res.json({
        success: true,
        message: "A fresh verification code has been sent to your email.",
        maskedEmail: maskEmail2(user.email),
        cooldownSeconds: 60
      });
    } catch (err) {
      console.error("[Password Change Resend Error]", err);
      res.status(500).json({
        success: false,
        message: "Failed to resend verification code. Please try again."
      });
    }
  }
);
var auth_default = router;

// server/routes/authRecovery.ts
import { Router as Router2 } from "express";
import crypto2 from "crypto";
import rateLimit2 from "express-rate-limit";
var router2 = Router2();
var forgotPasswordLimiter = rateLimit2({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { default: false },
  store: new MongoRateLimitStore("auth:forgot-pwd", 15 * 60 * 1e3),
  message: {
    success: true,
    // Maintain generic response even if rate limited
    message: "If an account exists for this email, password reset instructions have been dispatched."
  }
});
var tokenSubmissionLimiter = rateLimit2({
  windowMs: 15 * 60 * 1e3,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { default: false },
  store: new MongoRateLimitStore("auth:token-submit", 15 * 60 * 1e3),
  message: {
    success: false,
    message: "Too many requests. Please try again after 15 minutes."
  }
});
router2.post("/forgot-password", forgotPasswordLimiter, async (req, res) => {
  try {
    const { email: email2 } = req.body;
    const genericSuccess = {
      success: true,
      message: "If an account exists for this email address, password reset instructions have been dispatched."
    };
    if (!email2 || typeof email2 !== "string") {
      res.json(genericSuccess);
      return;
    }
    const cleanEmail = email2.trim().toLowerCase();
    const user = await User.findOne({
      email: cleanEmail,
      active: true
    });
    if (!user) {
      res.json(genericSuccess);
      return;
    }
    const rawToken = crypto2.randomBytes(32).toString("hex");
    const tokenHash = crypto2.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1e3);
    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = expiresAt;
    await user.save();
    if (user.role === "admin" || user.role === "super_admin") {
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        token: rawToken
      });
    } else {
      await sendCustomerPasswordReset({
        email: user.email,
        name: user.name,
        token: rawToken
      });
    }
    res.json(genericSuccess);
  } catch (err) {
    console.error("[Customer Forgot Password Error]", err);
    res.json({
      success: true,
      message: "If an account exists for this email address, password reset instructions have been dispatched."
    });
  }
});
router2.post("/admin/forgot-password", forgotPasswordLimiter, async (req, res) => {
  try {
    const { email: email2 } = req.body;
    const genericSuccess = {
      success: true,
      message: "If an administrative account exists for this email, password reset instructions have been dispatched."
    };
    if (!email2 || typeof email2 !== "string") {
      res.json(genericSuccess);
      return;
    }
    const cleanEmail = email2.trim().toLowerCase();
    const user = await User.findOne({
      email: cleanEmail,
      role: { $in: ["admin", "super_admin"] },
      active: true
    });
    if (!user) {
      res.json(genericSuccess);
      return;
    }
    const rawToken = crypto2.randomBytes(32).toString("hex");
    const tokenHash = crypto2.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1e3);
    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = expiresAt;
    await user.save();
    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      token: rawToken
    });
    res.json(genericSuccess);
  } catch (err) {
    console.error("[Admin Forgot Password Error]", err);
    res.json({
      success: true,
      message: "If an administrative account exists for this email, password reset instructions have been dispatched."
    });
  }
});
router2.get("/verify-reset-token", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      res.status(400).json({ valid: false, message: "Invalid or missing recovery token." });
      return;
    }
    const tokenHash = crypto2.createHash("sha256").update(token.trim()).digest("hex");
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: /* @__PURE__ */ new Date() }
    }).select("+passwordResetTokenHash");
    if (!user) {
      res.status(400).json({
        valid: false,
        message: "This password reset link is invalid or has expired. Please request a new one."
      });
      return;
    }
    res.json({
      valid: true,
      email: user.email,
      name: user.name
    });
  } catch (err) {
    console.error("[Verify Reset Token Error]", err);
    res.status(400).json({ valid: false, message: "Invalid or expired recovery token." });
  }
});
router2.post("/reset-password", tokenSubmissionLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || typeof token !== "string") {
      res.status(400).json({ success: false, message: "Recovery token is required." });
      return;
    }
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: "Your new password must be at least 6 characters long."
      });
      return;
    }
    const tokenHash = crypto2.createHash("sha256").update(token.trim()).digest("hex");
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: /* @__PURE__ */ new Date() }
    }).select("+password +passwordResetTokenHash");
    if (!user) {
      res.status(400).json({
        success: false,
        message: "This password reset link is invalid, expired, or has already been used."
      });
      return;
    }
    user.password = await hashPassword(newPassword);
    user.passwordResetTokenHash = void 0;
    user.passwordResetExpiresAt = void 0;
    await user.save();
    sendPasswordChangedConfirmation({
      email: user.email,
      name: user.name || "Valued Customer"
    }).catch((err) => {
      console.warn("[Email Warning] Failed to dispatch password reset confirmation:", err);
    });
    res.json({
      success: true,
      message: "Password reset successfully. You may now sign in with your new credentials."
    });
  } catch (err) {
    console.error("[Reset Password Error]", err);
    res.status(500).json({ success: false, message: "Failed to reset password. Please try again." });
  }
});
router2.get("/verify-invite-token", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      res.status(400).json({ valid: false, message: "Invalid or missing invitation token." });
      return;
    }
    const tokenHash = crypto2.createHash("sha256").update(token.trim()).digest("hex");
    const user = await User.findOne({
      invitationTokenHash: tokenHash,
      invitationExpiresAt: { $gt: /* @__PURE__ */ new Date() }
    }).select("+invitationTokenHash");
    if (!user) {
      res.status(400).json({
        valid: false,
        message: "This invitation link is invalid, expired, or has already been accepted."
      });
      return;
    }
    res.json({
      valid: true,
      email: user.email,
      name: user.name,
      role: user.role
    });
  } catch (err) {
    console.error("[Verify Invite Token Error]", err);
    res.status(400).json({ valid: false, message: "Invalid or expired invitation token." });
  }
});
router2.post("/accept-invite", tokenSubmissionLimiter, async (req, res) => {
  try {
    const { token, name: name2, password } = req.body;
    if (!token || typeof token !== "string") {
      res.status(400).json({ success: false, message: "Invitation token is required." });
      return;
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long."
      });
      return;
    }
    const tokenHash = crypto2.createHash("sha256").update(token.trim()).digest("hex");
    const user = await User.findOne({
      invitationTokenHash: tokenHash,
      invitationExpiresAt: { $gt: /* @__PURE__ */ new Date() }
    }).select("+invitationTokenHash");
    if (!user) {
      res.status(400).json({
        success: false,
        message: "This invitation link is invalid, expired, or has already been used."
      });
      return;
    }
    if (name2 && typeof name2 === "string" && name2.trim().length > 1) {
      user.name = name2.trim();
    }
    user.password = await hashPassword(password);
    user.active = true;
    user.invitationAcceptedAt = /* @__PURE__ */ new Date();
    user.invitationTokenHash = void 0;
    user.invitationExpiresAt = void 0;
    await user.save();
    const authToken = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });
    setAuthCookie(res, authToken);
    res.json({
      success: true,
      message: "Account activated successfully. Welcome to Malwa Namkeen House administration team!",
      token: authToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("[Accept Invite Error]", err);
    res.status(500).json({ success: false, message: "Failed to activate administrator account." });
  }
});
var authRecovery_default = router2;

// server/routes/products.ts
import { Router as Router3 } from "express";
import mongoose11 from "mongoose";
var router3 = Router3();
function formatPublicProduct(p) {
  const primaryImage = Array.isArray(p.images) && p.images[0] || p.image || "/hero-banner-1.png";
  const activeVariants = Array.isArray(p.variants) ? p.variants.filter((v) => v.active !== false) : [];
  const options = activeVariants.length > 0 ? activeVariants.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)).map((v) => ({
    id: String(v._id || v.sku || v.label),
    weight: v.label || `${v.value || ""} ${v.unit || ""}`.trim() || "Standard",
    price: typeof v.salePrice === "number" && v.salePrice > 0 ? v.salePrice : v.price,
    originalPrice: typeof v.salePrice === "number" && v.salePrice > 0 ? v.price : void 0,
    stock: typeof v.stock === "number" ? v.stock : 100,
    sku: v.sku || "",
    active: v.active !== false
  })) : [
    {
      id: "std",
      weight: "Standard (500g)",
      price: 150,
      originalPrice: void 0,
      stock: 50,
      sku: "STD-500G",
      active: true
    }
  ];
  const totalStock = options.reduce((sum, o) => sum + (o.stock || 0), 0);
  const basePrice = options[0]?.price || 0;
  const baseOrigPrice = options[0]?.originalPrice;
  return {
    id: String(p._id),
    _id: String(p._id),
    slug: p.slug,
    name: p.name,
    hindiName: p.hindiName || "",
    tagline: p.tagline || "",
    description: p.description || "",
    story: p.story || "",
    ingredients: Array.isArray(p.ingredients) ? p.ingredients : [],
    spiceLevel: p.spiceLevel || "Medium",
    shelfLife: p.shelfLife || "90 Days from manufacturing",
    oilUsed: p.oilUsed || "100% Pure Cold-Pressed Groundnut Oil",
    dietaryStandard: p.dietaryStandard || "100% Pure Vegetarian (Satvik)",
    packagingType: p.packagingType || "Food-Grade Multi-Layer Aroma Seal",
    customSpecifications: Array.isArray(p.customSpecifications) ? p.customSpecifications : [],
    isVegetarian: p.isVegetarian !== false,
    isAvailable: p.active !== false && totalStock > 0,
    category: p.category?.slug || (typeof p.category === "string" ? p.category : "sev-namkeen"),
    categoryId: p.category?._id ? String(p.category._id) : String(p.category || ""),
    categoryLabel: p.category?.name || "Heritage Namkeens",
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [primaryImage],
    image: primaryImage,
    price: basePrice,
    originalPrice: baseOrigPrice,
    stock: totalStock,
    badge: p.badge || (p.isBestSeller ? "Best Seller" : p.featured ? "Signature" : void 0),
    rating: typeof p.rating === "number" ? p.rating : 4.9,
    reviewCount: typeof p.reviewCount === "number" ? p.reviewCount : 124,
    featured: Boolean(p.featured),
    isBestSeller: Boolean(p.isBestSeller),
    isCombo: Boolean(p.isCombo),
    options
  };
}
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
router3.get("/categories", async (_req, res) => {
  try {
    if (mongoose11.connection.readyState === 1) {
      const [categories, productCountGroups, totalActiveProducts] = await Promise.all([
        Category.find({ active: true }).sort({ sortOrder: 1, name: 1 }).lean(),
        Product.aggregate([
          { $match: { active: { $ne: false } } },
          { $group: { _id: "$category", count: { $sum: 1 } } }
        ]),
        Product.countDocuments({ active: { $ne: false } })
      ]);
      if (categories.length > 0) {
        const countMap = {};
        for (const grp of productCountGroups) {
          if (grp._id) {
            countMap[String(grp._id)] = grp.count;
          }
        }
        const categoryCounts = { all: totalActiveProducts };
        const formattedCategories = categories.map((c) => {
          const count = countMap[String(c._id)] ?? 0;
          categoryCounts[c.slug] = count;
          categoryCounts[String(c._id)] = count;
          return {
            id: c.slug,
            _id: String(c._id),
            slug: c.slug,
            name: c.name,
            label: c.name,
            shortLabel: c.name.replace(/(Signature|Heritage|Royal|Crisp)\s+/i, ""),
            description: c.description || "",
            image: c.image || "",
            productCount: count
          };
        });
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.json({
          success: true,
          totalProducts: totalActiveProducts,
          categoryCounts,
          categories: formattedCategories
        });
        return;
      }
    }
  } catch (_err) {
  }
  const staticCounts = { all: PRODUCTS.length };
  for (const p of PRODUCTS) {
    if (p.category) {
      staticCounts[p.category] = (staticCounts[p.category] ?? 0) + 1;
    }
  }
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.json({
    success: true,
    totalProducts: PRODUCTS.length,
    categoryCounts: staticCounts,
    categories: SHOP_CATEGORIES.map((c) => ({
      id: c.id,
      _id: c.id,
      slug: c.id,
      name: c.label,
      label: c.label,
      shortLabel: c.shortLabel,
      description: c.description,
      image: "",
      productCount: staticCounts[c.id] ?? 0
    }))
  });
});
router3.get("/products/best-sellers", async (_req, res) => {
  try {
    if (mongoose11.connection.readyState === 1) {
      let bestSellers = await Product.find({ active: { $ne: false }, isBestSeller: true }).populate({ path: "category", select: "name slug image", strictPopulate: false }).sort({ bestSellerAt: -1, updatedAt: -1, createdAt: -1 }).limit(4).lean();
      if (bestSellers.length < 4) {
        const existingIds = bestSellers.map((p) => p._id);
        const backfill = await Product.find({
          active: { $ne: false },
          _id: { $nin: existingIds }
        }).populate({ path: "category", select: "name slug image", strictPopulate: false }).sort({ featured: -1, rating: -1, createdAt: -1 }).limit(4 - bestSellers.length).lean();
        bestSellers = [...bestSellers, ...backfill];
      }
      if (bestSellers.length > 0) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.json({
          success: true,
          count: bestSellers.length,
          products: bestSellers.map(formatPublicProduct)
        });
        return;
      }
    }
  } catch (err) {
    console.warn("[Public Best Sellers Error]", err);
  }
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  const fallback = PRODUCTS.slice(0, 4);
  res.json({
    success: true,
    count: fallback.length,
    products: fallback
  });
});
router3.get("/products", async (req, res) => {
  try {
    const {
      category: category2 = "all",
      search: search2 = "",
      spice: spice2 = "All",
      sortBy: sortBy2 = "featured",
      featured,
      page = "1",
      limit = "100"
    } = req.query;
    if (mongoose11.connection.readyState === 1) {
      const filter = { active: { $ne: false } };
      if (category2 && category2 !== "all") {
        if (mongoose11.Types.ObjectId.isValid(category2)) {
          filter.category = new mongoose11.Types.ObjectId(category2);
        } else {
          const catDoc = await Category.findOne({
            $or: [
              { slug: category2.toLowerCase() },
              { name: new RegExp(`^${category2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }
            ],
            active: { $ne: false }
          }).maxTimeMS(2e3).lean();
          if (catDoc) {
            filter.category = catDoc._id;
          } else {
            res.json({
              success: true,
              products: [],
              categories: [],
              total: 0,
              page: 1,
              totalPages: 1
            });
            return;
          }
        }
      }
      if (spice2 && spice2 !== "All") {
        filter.spiceLevel = spice2;
      }
      if (featured === "true") {
        filter.featured = true;
      }
      if (search2 && search2.trim()) {
        const raw = search2.trim().slice(0, 200);
        const q = escapeRegex(raw);
        filter.$or = [
          { name: { $regex: q, $options: "i" } },
          { hindiName: { $regex: q, $options: "i" } },
          { tagline: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
          { ingredients: { $regex: q, $options: "i" } }
        ];
      }
      let sortObj = { featured: -1, createdAt: -1 };
      if (sortBy2 === "price-asc") {
        sortObj = { "variants.0.price": 1 };
      } else if (sortBy2 === "price-desc") {
        sortObj = { "variants.0.price": -1 };
      } else if (sortBy2 === "rating") {
        sortObj = { rating: -1 };
      } else if (sortBy2 === "name-asc") {
        sortObj = { name: 1 };
      } else if (sortBy2 === "newest") {
        sortObj = { createdAt: -1 };
      }
      const pageNum2 = Math.max(1, parseInt(page, 10) || 1);
      const limitNum2 = Math.min(100, Math.max(1, parseInt(limit, 10) || 100));
      const skip2 = (pageNum2 - 1) * limitNum2;
      const [total, rawProducts, allCategories] = await Promise.all([
        Product.countDocuments(filter).maxTimeMS(2e3),
        Product.find(filter).populate({ path: "category", select: "name slug image", strictPopulate: false }).sort(sortObj).skip(skip2).limit(limitNum2).maxTimeMS(2e3).lean(),
        Category.find({ active: { $ne: false } }).sort({ sortOrder: 1 }).maxTimeMS(2e3).lean()
      ]);
      const formattedProducts = rawProducts.map(formatPublicProduct);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json({
        success: true,
        products: formattedProducts,
        categories: allCategories.map((c) => ({
          id: c.slug,
          _id: String(c._id),
          slug: c.slug,
          name: c.name,
          label: c.name
        })),
        total,
        page: pageNum2,
        totalPages: Math.ceil(total / limitNum2) || 1
      });
      return;
    }
  } catch (_err) {
  }
  let filtered = [...PRODUCTS];
  const { category = "all", search = "", spice = "All", sortBy = "featured" } = req.query;
  if (category && category !== "all") {
    filtered = filtered.filter((p) => p.category === category || p.slug === category);
  }
  if (spice && spice !== "All") {
    filtered = filtered.filter((p) => p.spiceLevel === spice);
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(
      (p) => p.name.toLowerCase().includes(q) || p.hindiName && p.hindiName.toLowerCase().includes(q) || p.tagline.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || Array.isArray(p.ingredients) && p.ingredients.some((i) => i.toLowerCase().includes(q))
    );
  }
  if (sortBy === "price-asc") {
    filtered.sort((a, b) => (a.options[0]?.price || 0) - (b.options[0]?.price || 0));
  } else if (sortBy === "price-desc") {
    filtered.sort((a, b) => (b.options[0]?.price || 0) - (a.options[0]?.price || 0));
  } else if (sortBy === "name-asc") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }
  const pageNum = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 12));
  const skip = (pageNum - 1) * limitNum;
  const paginated = filtered.slice(skip, skip + limitNum);
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.json({
    success: true,
    products: paginated,
    categories: SHOP_CATEGORIES,
    total: filtered.length,
    page: pageNum,
    totalPages: Math.ceil(filtered.length / limitNum) || 1
  });
});
router3.get("/products/:slugOrId", async (req, res) => {
  const { slugOrId } = req.params;
  const cleanParam = decodeURIComponent(slugOrId || "").trim();
  const cleanSlug = cleanParam.toLowerCase();
  try {
    if (mongoose11.connection.readyState === 1) {
      let productDoc = null;
      if (mongoose11.Types.ObjectId.isValid(cleanParam)) {
        productDoc = await Product.findOne({ _id: cleanParam, active: true }).populate({ path: "category", select: "name slug image", strictPopulate: false }).lean();
      }
      if (!productDoc) {
        productDoc = await Product.findOne({ slug: cleanSlug, active: true }).populate({ path: "category", select: "name slug image", strictPopulate: false }).lean();
      }
      if (productDoc) {
        const product = formatPublicProduct(productDoc);
        if (process.env.NODE_ENV === "production") {
          res.setHeader("Cache-Control", "public, max-age=10, stale-while-revalidate=30");
        } else {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        }
        res.json({ success: true, product });
        return;
      }
      res.status(404).json({ success: false, message: "Product delicacy not found or unavailable." });
      return;
    }
  } catch (_err) {
  }
  const fallback = PRODUCTS.find(
    (p) => (p.slug || p.id).toLowerCase() === cleanSlug || p.id.toLowerCase() === cleanSlug
  );
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  if (fallback) {
    res.json({ success: true, product: fallback });
  } else {
    res.status(404).json({ success: false, message: "Product delicacy not found or unavailable." });
  }
});
var products_default = router3;

// server/routes/cartWishlist.ts
import { Router as Router4 } from "express";
import rateLimit3 from "express-rate-limit";
import mongoose14 from "mongoose";

// server/lib/discounts.ts
import mongoose13 from "mongoose";

// server/models/Discount.ts
import mongoose12, { Schema as Schema7 } from "mongoose";
var discountSchema = new Schema7(
  {
    code: {
      type: String,
      required: [true, "Discount code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
      required: true
    },
    value: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Discount value must be non-negative"]
    },
    minimumOrder: {
      type: Number,
      default: 0,
      min: [0, "Minimum order must be non-negative"]
    },
    maximumDiscount: {
      type: Number,
      default: null,
      min: [0, "Maximum discount must be non-negative"]
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    usageLimit: {
      type: Number,
      default: null
    },
    usageLimitPerUser: {
      type: Number,
      default: 1
    },
    usedCount: {
      type: Number,
      default: 0
    },
    isCombo: {
      type: Boolean,
      default: false
    },
    isComboOnly: {
      type: Boolean,
      default: false
    },
    restoredOrderOps: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);
var Discount = mongoose12.models.Discount || mongoose12.model("Discount", discountSchema);

// server/lib/discounts.ts
async function validateAndCalculateDiscount(rawCode, subtotal, cartItems) {
  if (!rawCode || typeof rawCode !== "string" || !rawCode.trim()) {
    return { valid: false, message: "Please enter a coupon code.", discountAmount: 0 };
  }
  if (isNaN(subtotal) || subtotal <= 0) {
    return { valid: false, message: "Invalid cart subtotal.", discountAmount: 0 };
  }
  const code = rawCode.trim().toUpperCase();
  const discount = await Discount.findOne({ code });
  if (!discount) {
    return { valid: false, message: `Coupon code "${code}" is invalid.`, discountAmount: 0 };
  }
  if (!discount.active) {
    return { valid: false, message: `Coupon code "${code}" is no longer active.`, discountAmount: 0 };
  }
  const now = /* @__PURE__ */ new Date();
  if (discount.startDate && new Date(discount.startDate) > now) {
    return {
      valid: false,
      message: `Coupon code "${code}" is not valid yet.`,
      discountAmount: 0
    };
  }
  if (discount.endDate && new Date(discount.endDate) < now) {
    return {
      valid: false,
      message: `Coupon code "${code}" has expired.`,
      discountAmount: 0
    };
  }
  if (typeof discount.usageLimit === "number" && discount.usageLimit > 0) {
    if (discount.usedCount >= discount.usageLimit) {
      return {
        valid: false,
        message: `Coupon code "${code}" has reached its maximum redemption limit.`,
        discountAmount: 0
      };
    }
  }
  if (discount.minimumOrder > 0 && subtotal < discount.minimumOrder) {
    return {
      valid: false,
      message: `Cart subtotal must be at least \u20B9${discount.minimumOrder} to use coupon "${code}".`,
      discountAmount: 0
    };
  }
  const isComboCoupon = Boolean(discount.isCombo || discount.isComboOnly);
  if (isComboCoupon) {
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return {
        valid: false,
        message: `Coupon "${code}" is only applicable when purchasing Combo products.`,
        discountAmount: 0
      };
    }
    const productIds = cartItems.map((item) => item.productId).filter((id) => id && mongoose13.Types.ObjectId.isValid(String(id)));
    let dbProductMap = /* @__PURE__ */ new Map();
    if (productIds.length > 0) {
      const dbProducts = await Product.find({ _id: { $in: productIds } }).select("_id isCombo name").lean();
      dbProductMap = new Map(dbProducts.map((p) => [String(p._id), Boolean(p.isCombo)]));
    }
    let hasComboItem = false;
    let hasNonComboItem = false;
    for (const item of cartItems) {
      const pId = item.productId ? String(item.productId) : "";
      let isItemCombo = false;
      if (pId && dbProductMap.has(pId)) {
        isItemCombo = Boolean(dbProductMap.get(pId));
      } else if (item.isCombo !== void 0) {
        isItemCombo = Boolean(item.isCombo);
      }
      if (isItemCombo) {
        hasComboItem = true;
      } else {
        hasNonComboItem = true;
      }
    }
    if (!hasComboItem) {
      return {
        valid: false,
        message: `Coupon "${code}" is only applicable on Combo products.`,
        discountAmount: 0
      };
    }
    if (hasNonComboItem) {
      return {
        valid: false,
        message: `Coupon "${code}" is valid exclusively on Combo products. It cannot be applied when non-combo items are in your cart.`,
        discountAmount: 0
      };
    }
  }
  let discountAmount = 0;
  if (discount.type === "percentage") {
    const rawDiscount = subtotal * discount.value / 100;
    if (discount.maximumDiscount && discount.maximumDiscount > 0) {
      discountAmount = Math.min(rawDiscount, discount.maximumDiscount);
    } else {
      discountAmount = rawDiscount;
    }
  } else if (discount.type === "fixed") {
    discountAmount = Math.min(subtotal, discount.value);
  }
  discountAmount = Math.round(discountAmount * 100) / 100;
  return {
    valid: true,
    code: discount.code,
    discountAmount,
    discount
  };
}

// server/routes/cartWishlist.ts
var router4 = Router4();
var cartRevalidateLimiter = rateLimit3({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { default: false },
  store: new MongoRateLimitStore("cart:revalidate", 15 * 60 * 1e3),
  message: {
    success: false,
    message: "Too many cart revalidations. Please wait a moment before trying again."
  }
});
router4.post("/revalidate", cartRevalidateLimiter, async (req, res) => {
  try {
    const { items = [], couponCode = "" } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      res.json({
        success: true,
        valid: true,
        items: [],
        adjustments: [],
        subtotal: 0,
        discountAmount: 0,
        total: 0
      });
      return;
    }
    const objectIds = [
      ...new Set(items.map((it) => it.productId).filter((id) => id && mongoose14.Types.ObjectId.isValid(id)))
    ];
    const slugs = [
      ...new Set(items.map((it) => it.productId).filter((id) => id && !mongoose14.Types.ObjectId.isValid(id)))
    ];
    const orClauses = [];
    if (objectIds.length > 0) {
      orClauses.push({ _id: { $in: objectIds } });
    }
    if (slugs.length > 0) {
      orClauses.push({ slug: { $in: slugs.map((s) => String(s).toLowerCase().trim()) } });
    }
    const products = orClauses.length > 0 ? await Product.find({
      $or: orClauses,
      active: true
    }).lean() : [];
    const productMap = /* @__PURE__ */ new Map();
    for (const p of products) {
      productMap.set(String(p._id), p);
      if (p.slug) {
        productMap.set(p.slug.toLowerCase().trim(), p);
      }
    }
    const validatedItems = [];
    const adjustments = [];
    for (const item of items) {
      const lookupKey = typeof item.productId === "string" ? item.productId.trim() : String(item.productId);
      const product = productMap.get(lookupKey) || productMap.get(lookupKey.toLowerCase());
      if (!product) {
        adjustments.push(`A product in your cart is no longer available and has been removed.`);
        continue;
      }
      let variant = null;
      if (Array.isArray(product.variants)) {
        if (item.variantId) {
          variant = product.variants.find(
            (v) => String(v._id) === item.variantId && v.active !== false
          );
        }
        if (!variant && item.sku) {
          variant = product.variants.find(
            (v) => v.sku === item.sku && v.active !== false
          );
        }
        if (!variant && item.weight) {
          variant = product.variants.find(
            (v) => (v.label === item.weight || `${v.value || ""} ${v.unit || ""}`.trim() === item.weight) && v.active !== false
          );
        }
        if (!variant && product.variants.length > 0) {
          variant = product.variants.find((v) => v.active !== false) || product.variants[0];
        }
      }
      if (!variant) {
        adjustments.push(`Selected packaging for "${product.name}" is currently unavailable.`);
        continue;
      }
      const availableStock = typeof variant.stock === "number" ? variant.stock : 100;
      if (availableStock <= 0) {
        adjustments.push(`"${product.name} (${variant.label})" is currently out of stock.`);
        continue;
      }
      let quantity = Math.max(1, parseInt(String(item.quantity), 10) || 1);
      if (quantity > availableStock) {
        adjustments.push(
          `Quantity for "${product.name} (${variant.label})" was reduced to available stock (${availableStock}).`
        );
        quantity = availableStock;
      }
      const livePrice = typeof variant.salePrice === "number" && variant.salePrice > 0 ? variant.salePrice : variant.price;
      const submittedPrice = typeof item.price === "number" ? item.price : typeof item.unitPrice === "number" ? item.unitPrice : void 0;
      if (submittedPrice !== void 0 && livePrice !== submittedPrice) {
        adjustments.push(
          `Price for "${product.name} (${variant.label})" was updated from \u20B9${submittedPrice} to current price \u20B9${livePrice}.`
        );
      }
      const primaryImage = Array.isArray(product.images) && product.images[0] || product.image || "/hero-banner-1.png";
      validatedItems.push({
        productId: String(product._id),
        slug: product.slug || "",
        variantId: String(variant._id || variant.sku || variant.label),
        productName: product.name,
        hindiName: product.hindiName || "",
        variantLabel: variant.label || `${variant.value || ""} ${variant.unit || ""}`.trim() || "Standard",
        sku: variant.sku || "",
        price: livePrice,
        originalPrice: typeof variant.salePrice === "number" && variant.salePrice > 0 ? variant.price : void 0,
        quantity,
        itemTotal: Math.round(livePrice * quantity * 100) / 100,
        stock: availableStock,
        isCombo: Boolean(product.isCombo),
        image: primaryImage
      });
    }
    const subtotal = validatedItems.reduce((sum, it) => sum + it.itemTotal, 0);
    let discountAmount = 0;
    let validatedCoupon = null;
    let couponError = null;
    if (couponCode && couponCode.trim()) {
      const discResult = await validateAndCalculateDiscount(couponCode.trim(), subtotal, validatedItems);
      if (discResult.valid) {
        discountAmount = discResult.discountAmount;
        validatedCoupon = discResult.discount;
      } else {
        couponError = discResult.message;
      }
    }
    const finalTotal = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);
    res.json({
      success: true,
      valid: adjustments.length === 0,
      items: validatedItems,
      adjustments,
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount,
      coupon: validatedCoupon ? {
        code: validatedCoupon.code,
        type: validatedCoupon.type,
        value: validatedCoupon.value
      } : null,
      couponError,
      total: finalTotal
    });
  } catch (err) {
    console.error("[Cart Revalidation Error]", err);
    res.status(500).json({ success: false, message: "Failed to revalidate cart." });
  }
});
router4.get("/wishlist", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user?.userId).populate({
      path: "wishlist",
      match: { active: true },
      select: "name slug hindiName tagline description images variants rating reviewCount price"
    }).lean();
    if (!user) {
      res.status(404).json({ success: false, message: "Customer account not found." });
      return;
    }
    const wishlistProducts = (user.wishlist || []).filter(Boolean);
    res.json({
      success: true,
      wishlist: wishlistProducts,
      productIds: wishlistProducts.map((p) => String(p._id))
    });
  } catch (err) {
    console.error("[Get Wishlist Error]", err);
    res.status(500).json({ success: false, message: "Failed to fetch wishlist." });
  }
});
router4.post("/wishlist/toggle", requireAuth, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId || !mongoose14.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ success: false, message: "Valid productId is required." });
      return;
    }
    const user = await User.findById(req.user?.userId);
    if (!user) {
      res.status(404).json({ success: false, message: "Customer account not found." });
      return;
    }
    const currentList = (user.wishlist || []).map((id) => String(id));
    const exists = currentList.includes(productId);
    if (exists) {
      user.wishlist = (user.wishlist || []).filter((id) => String(id) !== productId);
    } else {
      user.wishlist = [...user.wishlist || [], new mongoose14.Types.ObjectId(productId)];
    }
    await user.save();
    res.json({
      success: true,
      inWishlist: !exists,
      productIds: (user.wishlist || []).map((id) => String(id)),
      message: !exists ? "Added to your Wishlist." : "Removed from your Wishlist."
    });
  } catch (err) {
    console.error("[Toggle Wishlist Error]", err);
    res.status(500).json({ success: false, message: "Failed to update wishlist." });
  }
});
router4.post("/wishlist/sync", requireAuth, async (req, res) => {
  try {
    const { productIds = [] } = req.body;
    const validIds = productIds.filter((id) => mongoose14.Types.ObjectId.isValid(id));
    const user = await User.findById(req.user?.userId);
    if (!user) {
      res.status(404).json({ success: false, message: "Customer account not found." });
      return;
    }
    const existingStrings = new Set((user.wishlist || []).map((id) => String(id)));
    for (const id of validIds) {
      if (!existingStrings.has(id)) {
        user.wishlist?.push(new mongoose14.Types.ObjectId(id));
        existingStrings.add(id);
      }
    }
    await user.save();
    res.json({
      success: true,
      productIds: Array.from(existingStrings),
      message: "Wishlist synchronized."
    });
  } catch (err) {
    console.error("[Sync Wishlist Error]", err);
    res.status(500).json({ success: false, message: "Failed to sync wishlist." });
  }
});
var cartWishlist_default = router4;

// server/routes/customerAccount.ts
import { Router as Router5 } from "express";
import mongoose17 from "mongoose";

// server/models/Order.ts
import mongoose15, { Schema as Schema8 } from "mongoose";
var orderItemSchema = new Schema8(
  {
    productId: {
      type: Schema8.Types.ObjectId,
      ref: "Product"
    },
    variantId: {
      type: Schema8.Types.ObjectId
    },
    productName: {
      type: String,
      required: [true, "Product name snapshot is required"],
      trim: true
    },
    variantLabel: {
      type: String,
      required: [true, "Variant label snapshot is required (e.g. 500g)"],
      trim: true
    },
    sku: {
      type: String,
      trim: true,
      default: ""
    },
    price: {
      type: Number,
      required: [true, "Item unit price is required"],
      min: [0, "Price must be non-negative"]
    },
    quantity: {
      type: Number,
      required: [true, "Item quantity is required"],
      min: [1, "Quantity must be at least 1"]
    },
    itemTotal: {
      type: Number,
      required: [true, "Item total is required"]
    },
    image: {
      type: String,
      default: ""
    }
  },
  { _id: false }
);
var shippingAddressSchema = new Schema8(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true, default: "" },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true, default: "" }
  },
  { _id: false }
);
var orderSchema = new Schema8(
  {
    orderNumber: {
      type: String,
      required: [true, "Order number is required"],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    customer: {
      type: Schema8.Types.ObjectId,
      ref: "User",
      index: true
    },
    customerInfo: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, required: true, trim: true }
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: function(v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: "Order must contain at least one purchased item."
      }
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    discountCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: ""
    },
    shipping: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true
    },
    orderStatus: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "online", "upi", "card"],
      default: "cod"
    },
    paymentDetails: {
      transactionId: { type: String, trim: true },
      gateway: { type: String, trim: true },
      paidAt: { type: Date },
      razorpayOrderId: { type: String, trim: true },
      razorpayPaymentId: { type: String, trim: true },
      razorpaySignature: { type: String, trim: true },
      webhookEventId: { type: String, trim: true },
      failureReason: { type: String, trim: true }
    },
    processedWebhookEvents: {
      type: [String],
      default: []
    },
    shipmentStatus: {
      type: String,
      enum: ["unfulfilled", "ready_to_ship", "in_transit", "out_for_delivery", "delivered", "returned"],
      default: "unfulfilled",
      index: true
    },
    trackingInfo: {
      courierName: { type: String, trim: true },
      trackingNumber: { type: String, trim: true },
      trackingUrl: { type: String, trim: true }
    },
    shiprocketDetails: {
      shipmentId: { type: Number },
      orderId: { type: Number },
      awbCode: { type: String, trim: true },
      courierCompanyId: { type: Number },
      courierName: { type: String, trim: true },
      pickupScheduledDate: { type: Date },
      labelUrl: { type: String, trim: true },
      manifestUrl: { type: String, trim: true },
      trackingUrl: { type: String, trim: true },
      lastEvent: { type: String, trim: true },
      lastEventDate: { type: Date },
      syncedAt: { type: Date },
      rawStatus: { type: String, trim: true },
      error: { type: String, trim: true }
    },
    processedShippingEvents: {
      type: [String],
      default: []
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    },
    idempotencyKey: {
      type: String,
      trim: true,
      index: true
    },
    inventoryRestored: {
      type: Boolean,
      default: false,
      index: true
    },
    restorationStatus: {
      type: String,
      enum: ["none", "in_progress", "completed", "partial_failure", "failed"],
      default: "none",
      index: true
    },
    restoringLock: {
      type: Boolean,
      default: false
    },
    restoringLockedAt: {
      type: Date,
      default: null
    },
    couponRestored: {
      type: Boolean,
      default: false
    },
    cancelledAt: {
      type: Date
    },
    cancelledBy: {
      type: String,
      enum: ["admin", "customer", "system"]
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: ""
    },
    restorationDetails: {
      type: [
        {
          productId: { type: String },
          productName: { type: String },
          variantId: { type: String },
          variantLabel: { type: String },
          sku: { type: String },
          quantity: { type: Number },
          restored: { type: Boolean },
          restoredAt: { type: Date },
          error: { type: String }
        }
      ],
      default: []
    }
  },
  {
    timestamps: true
  }
);
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ "customerInfo.email": 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ "paymentDetails.razorpayOrderId": 1 }, { sparse: true });
orderSchema.index({ "paymentDetails.razorpayPaymentId": 1 }, { unique: true, sparse: true });
orderSchema.index({ processedWebhookEvents: 1 }, { sparse: true });
orderSchema.index({ "shiprocketDetails.shipmentId": 1 }, { sparse: true });
orderSchema.index({ "shiprocketDetails.orderId": 1 }, { sparse: true });
orderSchema.index({ "shiprocketDetails.awbCode": 1 }, { sparse: true });
orderSchema.index({ processedShippingEvents: 1 }, { sparse: true });
var Order = mongoose15.models.Order || mongoose15.model("Order", orderSchema);

// server/lib/orderRestoration.ts
import mongoose16 from "mongoose";

// server/lib/shiprocketService.ts
import crypto3 from "node:crypto";
var SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";
var cachedAuthToken = null;
var tokenExpiresAt = 0;
var _testClient = null;
function getShiprocketConfig() {
  const isTest = process.env.NODE_ENV === "test" || process.env.IS_E2E_TEST === "true";
  const email2 = (process.env.SHIPROCKET_EMAIL || "").trim();
  const password = (process.env.SHIPROCKET_PASSWORD || "").trim();
  const webhookToken = (process.env.SHIPROCKET_WEBHOOK_TOKEN || "").trim();
  const pickupLocation = (process.env.SHIPROCKET_PICKUP_LOCATION || "Primary").trim();
  const isSandbox = process.env.SHIPROCKET_SANDBOX === "true" || email2.includes("test") || isTest;
  const isConfigured = Boolean(email2 && password);
  return {
    email: email2,
    password,
    webhookToken,
    pickupLocation,
    isConfigured,
    isSandbox
  };
}
async function getShiprocketAuthToken() {
  if (_testClient?.auth) {
    try {
      const res = await _testClient.auth.login("mock@malwanamkeen.com", "mock_password");
      return { success: true, data: res.token };
    } catch (testErr) {
      const errMsg = testErr instanceof Error ? testErr.message : String(testErr);
      return { success: false, error: errMsg, statusCode: 401 };
    }
  }
  if (cachedAuthToken && Date.now() < tokenExpiresAt - 6e4) {
    return { success: true, data: cachedAuthToken };
  }
  const config = getShiprocketConfig();
  if (!config.isConfigured) {
    return {
      success: false,
      error: "Shiprocket logistics integration is not configured on this server.",
      statusCode: 503
    };
  }
  try {
    const res = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: config.email,
        password: config.password
      }),
      signal: AbortSignal.timeout(1e4)
      // 10s timeout
    });
    const data = await res.json();
    if (!res.ok || !data.token) {
      const msg = data.message || "Authentication with Shiprocket failed.";
      console.error("[Shiprocket Auth Error]:", msg);
      return {
        success: false,
        error: msg,
        statusCode: res.status || 401
      };
    }
    cachedAuthToken = data.token;
    tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1e3;
    return {
      success: true,
      data: data.token
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[Shiprocket Auth Exception]:", errMsg);
    return {
      success: false,
      error: "Shiprocket authentication service timed out or was unreachable.",
      statusCode: 502
    };
  }
}
function parseVariantWeightKg(variantLabel) {
  if (!variantLabel || typeof variantLabel !== "string") return null;
  const clean = variantLabel.trim().toLowerCase();
  const kgMatch = clean.match(/^(\d+(?:\.\d+)?)\s*kg(?:\s+(?:pack|pouch|box|jar|tin|bag|container))?$/);
  if (kgMatch) {
    const val = parseFloat(kgMatch[1]);
    return val > 0 ? val : null;
  }
  const gMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:g|gm|gms|grams)(?:\s+(?:pack|pouch|box|jar|tin|bag|container))?$/);
  if (gMatch) {
    const grams = parseFloat(gMatch[1]);
    return grams > 0 ? grams / 1e3 : null;
  }
  return null;
}
function validateAndCalculateShipmentPackage(order, customDimensions) {
  const missingMetadata = [];
  let totalWeightKg = 0;
  const orderItems = [];
  const items = Array.isArray(order.items) ? order.items : [];
  for (const item of items) {
    const itemWeightKg = parseVariantWeightKg(item.variantLabel);
    if (itemWeightKg === null || itemWeightKg <= 0) {
      missingMetadata.push(
        `Item "${item.productName}" (Packaging: "${item.variantLabel || "Unspecified"}") lacks standard weight metadata.`
      );
    } else {
      totalWeightKg += itemWeightKg * (item.quantity || 1);
    }
    orderItems.push({
      name: item.productName,
      sku: item.sku || `SKU-${item.productId || "GENERIC"}`,
      units: item.quantity,
      selling_price: item.price,
      discount: 0,
      tax: 0
    });
  }
  totalWeightKg = Math.max(0.05, Math.round(totalWeightKg * 1e3) / 1e3);
  const dimensions = customDimensions && customDimensions.length > 0 && customDimensions.breadth > 0 && customDimensions.height > 0 ? customDimensions : { length: 20, breadth: 15, height: 10 };
  const valid = missingMetadata.length === 0;
  return {
    valid,
    totalWeightKg,
    dimensions,
    missingMetadata,
    orderItems
  };
}
async function createShiprocketOrder(order, options) {
  if (order.shiprocketDetails?.shipmentId || order.shiprocketDetails?.orderId) {
    return {
      success: false,
      error: `Shipment already exists for Order #${order.orderNumber} (Shiprocket Shipment ID: ${order.shiprocketDetails.shipmentId || order.shiprocketDetails.orderId}).`,
      statusCode: 409
    };
  }
  if (order.orderStatus === "cancelled") {
    return {
      success: false,
      error: `Cannot create shipment for cancelled Order #${order.orderNumber}.`,
      statusCode: 400
    };
  }
  const packageInfo = validateAndCalculateShipmentPackage(order, options?.customDimensions);
  if (!packageInfo.valid) {
    return {
      success: false,
      error: `Cannot create shipment due to missing product packaging metadata: ${packageInfo.missingMetadata.join("; ")}`,
      statusCode: 422
    };
  }
  const shippingAddr = order.shippingAddress;
  if (!shippingAddr || !shippingAddr.name || !shippingAddr.addressLine1 || !shippingAddr.city || !shippingAddr.state || !shippingAddr.pincode || !shippingAddr.phone) {
    return {
      success: false,
      error: "Order has incomplete shipping address information.",
      statusCode: 400
    };
  }
  const config = getShiprocketConfig();
  if (_testClient?.orders) {
    try {
      const mockRes = await _testClient.orders.create({
        order_id: order.orderNumber,
        weight: packageInfo.totalWeightKg
      });
      return { success: true, data: mockRes };
    } catch (testErr) {
      const errMsg = testErr instanceof Error ? testErr.message : String(testErr);
      return { success: false, error: errMsg, statusCode: 500 };
    }
  }
  const authRes = await getShiprocketAuthToken();
  if (!authRes.success || !authRes.data) {
    return {
      success: false,
      error: authRes.error || "Failed to authenticate with Shiprocket.",
      statusCode: authRes.statusCode || 503
    };
  }
  const token = authRes.data;
  const dateObj = order.createdAt ? new Date(order.createdAt) : /* @__PURE__ */ new Date();
  const formattedDate = dateObj.toISOString().slice(0, 16).replace("T", " ");
  const isCOD = order.paymentMethod === "cod";
  const payload = {
    order_id: order.orderNumber,
    order_date: formattedDate,
    pickup_location: config.pickupLocation,
    channel_id: "",
    comment: order.notes || "Handle with care \u2014 Authentic Indian Savouries",
    billing_customer_name: shippingAddr.name,
    billing_last_name: "",
    billing_address: shippingAddr.addressLine1,
    billing_address_2: shippingAddr.addressLine2 || shippingAddr.landmark || "",
    billing_city: shippingAddr.city,
    billing_pincode: shippingAddr.pincode,
    billing_state: shippingAddr.state,
    billing_country: "India",
    billing_email: order.customerInfo?.email || "orders@malwanamkeen.com",
    billing_phone: shippingAddr.phone,
    shipping_is_billing: true,
    order_items: packageInfo.orderItems,
    payment_method: isCOD ? "COD" : "Prepaid",
    shipping_charges: order.shipping || 0,
    total_discount: order.discount || 0,
    sub_total: order.subtotal,
    length: packageInfo.dimensions.length,
    breadth: packageInfo.dimensions.breadth,
    height: packageInfo.dimensions.height,
    weight: packageInfo.totalWeightKg
  };
  try {
    const res = await fetch(`${SHIPROCKET_BASE_URL}/orders/create/adhoc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12e3)
    });
    const data = await res.json();
    if (!res.ok || data.status_code && data.status_code !== 1 && !data.shipment_id) {
      const errorMsg = data.message || data.error || "Shiprocket order creation failed.";
      console.error("[Shiprocket Order Creation Failed]:", errorMsg, data);
      return {
        success: false,
        error: typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg),
        statusCode: res.status || 400
      };
    }
    return {
      success: true,
      data: {
        order_id: data.order_id,
        shipment_id: data.shipment_id,
        status: data.status || "NEW",
        status_code: data.status_code || 1,
        onboarding_completed_now: data.onboarding_completed_now,
        awb_code: data.awb_code,
        courier_company_id: data.courier_company_id,
        courier_name: data.courier_name
      }
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[Shiprocket Network Error]:", errMsg);
    return {
      success: false,
      error: "Shiprocket API request timed out or was interrupted.",
      statusCode: 502
    };
  }
}
async function assignShiprocketAWB(shipmentId, courierId) {
  if (!shipmentId || shipmentId <= 0) {
    return {
      success: false,
      error: "Valid shipment ID is required.",
      statusCode: 400
    };
  }
  if (_testClient?.courier) {
    try {
      const mockRes = await _testClient.courier.assignAWB(shipmentId, courierId);
      return { success: true, data: mockRes };
    } catch (testErr) {
      const errMsg = testErr instanceof Error ? testErr.message : String(testErr);
      return { success: false, error: errMsg, statusCode: 500 };
    }
  }
  const authRes = await getShiprocketAuthToken();
  if (!authRes.success || !authRes.data) {
    return {
      success: false,
      error: authRes.error || "Failed to authenticate with Shiprocket.",
      statusCode: authRes.statusCode || 503
    };
  }
  const payload = { shipment_id: shipmentId };
  if (courierId) {
    payload.courier_id = courierId;
  }
  try {
    const res = await fetch(`${SHIPROCKET_BASE_URL}/courier/assign/awb`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authRes.data}`
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12e3)
    });
    const data = await res.json();
    if (!res.ok || data.awb_assign_status !== 1) {
      const msg = data.message || data.response?.data?.error || "Failed to generate AWB code with courier partner.";
      return {
        success: false,
        error: msg,
        statusCode: res.status || 400
      };
    }
    return {
      success: true,
      data
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: errMsg,
      statusCode: 502
    };
  }
}
async function trackShipmentByAWB(awbCode) {
  if (!awbCode || typeof awbCode !== "string" || !awbCode.trim()) {
    return {
      success: false,
      error: "Valid AWB tracking code is required.",
      statusCode: 400
    };
  }
  if (_testClient?.courier) {
    try {
      const mockRes = await _testClient.courier.track(awbCode.trim());
      return { success: true, data: mockRes };
    } catch (testErr) {
      const errMsg = testErr instanceof Error ? testErr.message : String(testErr);
      return { success: false, error: errMsg, statusCode: 500 };
    }
  }
  const authRes = await getShiprocketAuthToken();
  if (!authRes.success || !authRes.data) {
    return {
      success: false,
      error: authRes.error || "Failed to authenticate with Shiprocket.",
      statusCode: authRes.statusCode || 503
    };
  }
  try {
    const res = await fetch(`${SHIPROCKET_BASE_URL}/courier/track/awb/${encodeURIComponent(awbCode.trim())}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authRes.data}`
      },
      signal: AbortSignal.timeout(1e4)
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.message || "Tracking query failed.",
        statusCode: res.status
      };
    }
    return {
      success: true,
      data
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: errMsg,
      statusCode: 502
    };
  }
}
function verifyShiprocketWebhook(headers, expectedToken) {
  const config = getShiprocketConfig();
  const token = (expectedToken || config.webhookToken || "").trim();
  if (!token) {
    return false;
  }
  const rawReceived = headers["x-api-key"] || headers["http_x_api_key"] || headers["authorization"] || headers["x-shiprocket-token"];
  if (!rawReceived || typeof rawReceived !== "string") {
    return false;
  }
  const cleanReceived = rawReceived.replace(/^Bearer\s+/i, "").trim();
  if (!cleanReceived) {
    return false;
  }
  const expectedBuf = Buffer.from(token, "utf8");
  const receivedBuf = Buffer.from(cleanReceived, "utf8");
  if (expectedBuf.length !== receivedBuf.length) {
    crypto3.timingSafeEqual(expectedBuf, expectedBuf);
    return false;
  }
  return crypto3.timingSafeEqual(expectedBuf, receivedBuf);
}
async function cancelShiprocketOrder(shiprocketOrderIds) {
  if (!Array.isArray(shiprocketOrderIds) || shiprocketOrderIds.length === 0) {
    return {
      success: false,
      error: "At least one Shiprocket Order ID is required for cancellation.",
      statusCode: 400
    };
  }
  const validIds = shiprocketOrderIds.filter((id) => typeof id === "number" && !isNaN(id) && id > 0);
  if (validIds.length === 0) {
    return {
      success: false,
      error: "Valid numeric Shiprocket Order IDs are required.",
      statusCode: 400
    };
  }
  if (_testClient?.orders?.cancel) {
    try {
      const mockRes = await _testClient.orders.cancel(validIds);
      return { success: true, data: mockRes };
    } catch (testErr) {
      const errMsg = testErr instanceof Error ? testErr.message : String(testErr);
      return { success: false, error: errMsg, statusCode: 500 };
    }
  }
  const authRes = await getShiprocketAuthToken();
  if (!authRes.success || !authRes.data) {
    return {
      success: false,
      error: authRes.error || "Failed to authenticate with Shiprocket.",
      statusCode: authRes.statusCode || 503
    };
  }
  try {
    const res = await fetch(`${SHIPROCKET_BASE_URL}/orders/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authRes.data}`
      },
      body: JSON.stringify({ ids: validIds }),
      signal: AbortSignal.timeout(12e3)
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data.message || data.error || "Shiprocket order cancellation failed.";
      return {
        success: false,
        error: typeof msg === "string" ? msg : JSON.stringify(msg),
        statusCode: res.status || 400
      };
    }
    return {
      success: true,
      data
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[Shiprocket Cancel Order Exception]:", errMsg);
    return {
      success: false,
      error: "Shiprocket cancellation service timed out or was unreachable.",
      statusCode: 502
    };
  }
}
async function syncOrderTrackingFromShiprocket(order) {
  const awbCode = order.shiprocketDetails?.awbCode || order.trackingInfo?.trackingNumber;
  if (!awbCode || typeof awbCode !== "string" || !awbCode.trim()) {
    return {
      success: false,
      error: "Order has no AWB tracking code assigned.",
      statusCode: 400
    };
  }
  const result = await trackShipmentByAWB(awbCode.trim());
  if (!result.success || !result.data) {
    return result;
  }
  const trackingData = result.data.tracking_data;
  const trackEntries = trackingData.shipment_track || [];
  const primaryTrack = trackEntries[0];
  const currentStatus = primaryTrack?.current_status || "";
  order.shiprocketDetails = order.shiprocketDetails || {};
  order.shiprocketDetails.syncedAt = /* @__PURE__ */ new Date();
  if (currentStatus) {
    order.shiprocketDetails.rawStatus = currentStatus;
    order.shiprocketDetails.lastEvent = currentStatus;
    order.shiprocketDetails.lastEventDate = /* @__PURE__ */ new Date();
    const statusUpper = currentStatus.toUpperCase();
    if (order.orderStatus !== "cancelled") {
      const SHIPMENT_STATUS_RANK = {
        unfulfilled: 0,
        ready_to_ship: 1,
        in_transit: 2,
        out_for_delivery: 3,
        delivered: 4,
        returned: 4
      };
      const currentRank = SHIPMENT_STATUS_RANK[order.shipmentStatus || "unfulfilled"] ?? 0;
      if (statusUpper.includes("DELIVERED") && !statusUpper.includes("RTO")) {
        order.shipmentStatus = "delivered";
        order.orderStatus = "delivered";
        if (order.paymentMethod === "cod" && order.paymentStatus !== "paid") {
          order.paymentStatus = "paid";
          order.paymentDetails = {
            ...order.paymentDetails || {},
            gateway: "cod",
            paidAt: /* @__PURE__ */ new Date()
          };
        }
      } else if (statusUpper.includes("OUT FOR DELIVERY")) {
        if (currentRank < 3) {
          order.shipmentStatus = "out_for_delivery";
          if (["pending", "confirmed", "processing"].includes(order.orderStatus)) {
            order.orderStatus = "shipped";
          }
        }
      } else if (statusUpper.includes("IN TRANSIT") || statusUpper.includes("PICKED UP") || statusUpper.includes("REACHED")) {
        if (currentRank < 2) {
          order.shipmentStatus = "in_transit";
          if (["pending", "confirmed", "processing"].includes(order.orderStatus)) {
            order.orderStatus = "shipped";
          }
        }
      } else if (statusUpper.includes("AWB") || statusUpper === "READY TO SHIP") {
        if (currentRank < 1) {
          order.shipmentStatus = "ready_to_ship";
        }
      } else if (statusUpper.includes("RTO") || statusUpper.includes("RETURN")) {
        if (order.shipmentStatus !== "delivered") {
          order.shipmentStatus = "returned";
        }
      }
    }
  }
  if (primaryTrack?.courier_name && !order.shiprocketDetails.courierName) {
    order.shiprocketDetails.courierName = primaryTrack.courier_name;
  }
  if (!order.trackingInfo?.trackingUrl && (trackingData.track_url || awbCode)) {
    order.trackingInfo = {
      courierName: order.shiprocketDetails.courierName || order.trackingInfo?.courierName || "Shiprocket Partner",
      trackingNumber: awbCode.trim(),
      trackingUrl: trackingData.track_url || `https://shiprocket.co/tracking/${encodeURIComponent(awbCode.trim())}`
    };
  }
  await order.save();
  return result;
}

// server/lib/orderRestoration.ts
var NON_CANCELLABLE_ORDER_STATUSES = ["shipped", "delivered"];
var NON_CANCELLABLE_SHIPMENT_STATUSES = ["in_transit", "out_for_delivery", "delivered"];
async function cancelAndRestockOrder(orderId, options) {
  const cleanId = typeof orderId === "string" ? orderId.trim() : orderId;
  if (!mongoose16.Types.ObjectId.isValid(cleanId)) {
    return {
      success: false,
      restoredItems: [],
      couponRestored: false,
      warnings: ["Invalid order ID format."],
      message: "Invalid order ID format."
    };
  }
  const existing = await Order.findById(cleanId);
  if (!existing) {
    return {
      success: false,
      restoredItems: [],
      couponRestored: false,
      warnings: ["Order not found in database."],
      message: "Order not found."
    };
  }
  if (existing.orderStatus === "cancelled" && existing.inventoryRestored === true) {
    return {
      success: true,
      alreadyCancelled: true,
      order: existing,
      restoredItems: existing.restorationDetails || [],
      couponRestored: Boolean(existing.couponRestored),
      warnings: [],
      message: "Order was already cancelled and all inventory was previously restored."
    };
  }
  if (existing.orderStatus !== "cancelled") {
    if (options.allowedCurrentStatuses && options.allowedCurrentStatuses.length > 0) {
      if (!options.allowedCurrentStatuses.includes(existing.orderStatus)) {
        return {
          success: false,
          order: existing,
          restoredItems: [],
          couponRestored: false,
          warnings: [`Order status "${existing.orderStatus}" is not eligible for cancellation.`],
          message: `Orders in status "${existing.orderStatus}" cannot be cancelled.`
        };
      }
    } else {
      if (NON_CANCELLABLE_ORDER_STATUSES.includes(existing.orderStatus)) {
        return {
          success: false,
          order: existing,
          restoredItems: [],
          couponRestored: false,
          warnings: [`Order status "${existing.orderStatus}" indicates goods have already been dispatched or delivered.`],
          message: `Orders in status "${existing.orderStatus}" cannot be cancelled. Goods are already with the customer or in transit.`
        };
      }
    }
    if (existing.shipmentStatus && NON_CANCELLABLE_SHIPMENT_STATUSES.includes(existing.shipmentStatus)) {
      return {
        success: false,
        order: existing,
        restoredItems: [],
        couponRestored: false,
        warnings: [`Shipment status "${existing.shipmentStatus}" indicates goods have already left the facility.`],
        message: `Orders with shipment status "${existing.shipmentStatus}" cannot be cancelled.`
      };
    }
  }
  const isInitialCancellation = existing.orderStatus !== "cancelled";
  const lockFilter = {
    _id: cleanId,
    inventoryRestored: { $ne: true },
    $or: [
      { restoringLock: { $ne: true } },
      { restoringLockedAt: { $lt: new Date(Date.now() - 3e4) } },
      { restoringLockedAt: null },
      { restoringLockedAt: { $exists: false } }
    ]
  };
  const lockUpdate = {
    $set: {
      orderStatus: "cancelled",
      restoringLock: true,
      restoringLockedAt: /* @__PURE__ */ new Date(),
      cancelledAt: existing.cancelledAt || /* @__PURE__ */ new Date(),
      cancelledBy: existing.cancelledBy || options.cancelledBy,
      cancellationReason: options.reason ? options.reason.trim() : existing.cancellationReason || ""
    }
  };
  const lockedOrder = await Order.findOneAndUpdate(lockFilter, lockUpdate, { new: true });
  if (!lockedOrder) {
    const current = await Order.findById(cleanId);
    if (current && current.inventoryRestored) {
      return {
        success: true,
        alreadyCancelled: true,
        order: current,
        restoredItems: current.restorationDetails || [],
        couponRestored: Boolean(current.couponRestored),
        warnings: [],
        message: "Order was already cancelled and inventory was previously restored."
      };
    }
    return {
      success: false,
      order: current || existing,
      restoredItems: current?.restorationDetails || [],
      couponRestored: Boolean(current?.couponRestored),
      warnings: ["Cancellation or inventory restoration is currently in progress by another request."],
      message: "Restoration lock is currently held. Please retry in a few moments."
    };
  }
  const existingDetails = Array.isArray(lockedOrder.restorationDetails) ? lockedOrder.restorationDetails : [];
  const restoredItems = [];
  const warnings = [];
  let couponRestored = Boolean(lockedOrder.couponRestored);
  if (Array.isArray(lockedOrder.items)) {
    for (let i = 0; i < lockedOrder.items.length; i++) {
      const item = lockedOrder.items[i];
      const qty = item.quantity;
      if (!qty || qty <= 0) continue;
      const priorDetail = existingDetails.find(
        (d) => item.variantId && d.variantId && d.variantId.toString() === item.variantId.toString() || item.sku && d.sku && d.sku.toUpperCase() === item.sku.toUpperCase() || d.productName === item.productName && d.variantLabel === item.variantLabel
      );
      if (priorDetail && priorDetail.restored === true) {
        restoredItems.push(priorDetail);
        continue;
      }
      const itemDetail = {
        productId: item.productId ? item.productId.toString() : void 0,
        productName: item.productName || "Unknown Product",
        variantId: item.variantId ? item.variantId.toString() : void 0,
        variantLabel: item.variantLabel || "",
        sku: item.sku || "",
        quantity: qty,
        restored: false
      };
      if (!item.productId) {
        itemDetail.error = "No productId snapshot found on order item";
        warnings.push(`Cannot restore stock for "${item.productName}": Missing productId.`);
        restoredItems.push(itemDetail);
        continue;
      }
      try {
        const product = await Product.findById(item.productId);
        if (!product) {
          itemDetail.error = `Product ID ${item.productId} no longer exists in database`;
          warnings.push(`Cannot restore stock for "${item.productName}": Product no longer exists in database.`);
          restoredItems.push(itemDetail);
          continue;
        }
        let matchedVariant = null;
        if (Array.isArray(product.variants)) {
          if (item.variantId) {
            matchedVariant = product.variants.find(
              (v) => v._id && v._id.toString() === item.variantId.toString()
            );
          }
          if (!matchedVariant && item.sku) {
            matchedVariant = product.variants.find(
              (v) => v.sku && v.sku.toUpperCase() === item.sku.toUpperCase()
            );
          }
          if (!matchedVariant && item.variantLabel) {
            const targetLabel = item.variantLabel.trim().toLowerCase();
            matchedVariant = product.variants.find((v) => {
              const label = (v.label || "").trim().toLowerCase();
              const valUnit = `${v.value || ""} ${v.unit || ""}`.trim().toLowerCase();
              return label === targetLabel || valUnit === targetLabel;
            });
          }
        }
        if (!matchedVariant) {
          itemDetail.error = `Variant "${item.variantLabel}" (SKU: ${item.sku}) no longer exists on product "${product.name}"`;
          warnings.push(`Cannot restore stock for "${item.productName} (${item.variantLabel})": Variant not found.`);
          restoredItems.push(itemDetail);
          continue;
        }
        const opId = `restore_${cleanId}_item${i}_var_${matchedVariant._id}`;
        const updateResult = await Product.updateOne(
          {
            _id: product._id,
            variants: {
              $elemMatch: {
                _id: matchedVariant._id,
                restoredOrderOps: { $ne: opId }
              }
            }
          },
          {
            $inc: { "variants.$.stock": qty },
            $addToSet: { "variants.$.restoredOrderOps": opId }
          }
        );
        if (updateResult.modifiedCount > 0) {
          itemDetail.restored = true;
          itemDetail.restoredAt = /* @__PURE__ */ new Date();
          itemDetail.variantId = matchedVariant._id.toString();
        } else {
          const alreadyApplied = await Product.exists({
            _id: product._id,
            variants: {
              $elemMatch: {
                _id: matchedVariant._id,
                restoredOrderOps: opId
              }
            }
          });
          if (alreadyApplied) {
            itemDetail.restored = true;
            itemDetail.restoredAt = /* @__PURE__ */ new Date();
            itemDetail.variantId = matchedVariant._id.toString();
          } else {
            itemDetail.error = "MongoDB Product atomic stock update returned 0 modifiedCount";
            warnings.push(`Failed to update stock for "${item.productName} (${item.variantLabel})".`);
          }
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        itemDetail.error = errMsg;
        warnings.push(`Error updating stock for "${item.productName}": ${errMsg}`);
      }
      restoredItems.push(itemDetail);
    }
  }
  if (lockedOrder.discountCode && lockedOrder.discountCode.trim() && (typeof lockedOrder.discount === "number" && lockedOrder.discount > 0) && !couponRestored) {
    const code = lockedOrder.discountCode.trim().toUpperCase();
    const couponOpId = `restore_${cleanId}_coupon`;
    try {
      const discountUpdate = await Discount.updateOne(
        { code, usedCount: { $gt: 0 }, restoredOrderOps: { $ne: couponOpId } },
        { $inc: { usedCount: -1 }, $addToSet: { restoredOrderOps: couponOpId } }
      );
      if (discountUpdate.modifiedCount > 0) {
        couponRestored = true;
      } else {
        const alreadyRolledBack = await Discount.exists({
          code,
          restoredOrderOps: couponOpId
        });
        if (alreadyRolledBack) {
          couponRestored = true;
        } else {
          warnings.push(`Could not rollback coupon "${code}": Discount code not found or usedCount was already 0.`);
        }
      }
    } catch (couponErr) {
      const errMsg = couponErr instanceof Error ? couponErr.message : String(couponErr);
      warnings.push(`Failed to rollback coupon usage for "${code}": ${errMsg}`);
    }
  }
  const allItemsRestored = restoredItems.length > 0 && restoredItems.every((it) => it.restored === true);
  const anyItemsRestored = restoredItems.some((it) => it.restored === true);
  const finalRestorationStatus = allItemsRestored ? "completed" : anyItemsRestored ? "partial_failure" : "failed";
  const updatedOrder = await Order.findByIdAndUpdate(
    cleanId,
    {
      $set: {
        restoringLock: false,
        restoringLockedAt: null,
        inventoryRestored: allItemsRestored,
        restorationStatus: finalRestorationStatus,
        couponRestored,
        restorationDetails: restoredItems
      }
    },
    { new: true }
  );
  if (isInitialCancellation && updatedOrder) {
    (async () => {
      try {
        await sendOrderStatusUpdate({
          order: updatedOrder,
          previousStatus: existing.orderStatus,
          newStatus: "cancelled"
        });
        if (options.cancelledBy === "customer") {
          const activeAdmins = await User.find({
            role: { $in: ["admin", "super_admin"] },
            active: true
          }).select("email").lean();
          const configuredAdmin = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL;
          const adminEmails = [
            ...activeAdmins.map((a) => a.email),
            ...configuredAdmin ? [configuredAdmin] : []
          ].filter(Boolean);
          if (adminEmails.length > 0) {
            await sendCustomerOrderCancellationAdminAlert({
              order: updatedOrder,
              adminEmails,
              cancelledBy: "customer",
              reason: options.reason
            });
          }
        }
        if (updatedOrder.shiprocketDetails?.orderId) {
          try {
            await cancelShiprocketOrder([updatedOrder.shiprocketDetails.orderId]);
          } catch (srErr) {
            console.warn("[Cancellation Shiprocket Warning] Failed to cancel Shiprocket order:", srErr);
          }
        }
      } catch (emailErr) {
        console.warn("[Cancellation Email Warning] Failed to dispatch cancellation email:", emailErr);
      }
    })();
  }
  const success = allItemsRestored;
  let message2 = "Order cancelled successfully and reserved inventory returned to stock.";
  if (!allItemsRestored) {
    message2 = anyItemsRestored ? `Order cancelled, but some items could not be restocked (${warnings.join("; ")}). Retry is permitted.` : `Order cancelled, but inventory restoration failed: ${warnings.join("; ")}.`;
  }
  return {
    success,
    alreadyCancelled: false,
    order: updatedOrder || lockedOrder,
    restoredItems,
    couponRestored,
    warnings,
    message: message2
  };
}

// server/routes/customerAccount.ts
var router5 = Router5();
router5.use(requireAuth);
router5.get("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user || !user.active) {
      res.status(404).json({ success: false, message: "Account not found or inactive." });
      return;
    }
    const orderCount = await Order.countDocuments({
      $or: [{ customer: user._id }, { "customerInfo.email": user.email }]
    });
    res.json({
      success: true,
      profile: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        addressCount: (user.addresses || []).length,
        orderCount,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error("[Customer Profile Error]", err);
    res.status(500).json({ success: false, message: "Failed to retrieve profile." });
  }
});
router5.put("/profile", async (req, res) => {
  try {
    const { name: name2, phone: phone2 } = req.body;
    if (!name2 || typeof name2 !== "string" || name2.trim().length < 2) {
      res.status(400).json({ success: false, message: "Please provide a valid full name." });
      return;
    }
    const user = await User.findById(req.user?.userId);
    if (!user || !user.active) {
      res.status(404).json({ success: false, message: "Account not found or inactive." });
      return;
    }
    user.name = name2.trim();
    if (typeof phone2 === "string") {
      user.phone = phone2.trim();
    }
    await user.save();
    res.json({
      success: true,
      message: "Profile updated successfully.",
      profile: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    console.error("[Customer Profile Update Error]", err);
    res.status(500).json({ success: false, message: "Failed to update profile." });
  }
});
router5.put("/password", async (_req, res) => {
  res.status(400).json({
    success: false,
    message: "Direct password change is disabled for account security. Please use the secure email OTP flow via /api/auth/password-change/request."
  });
});
router5.get("/addresses", async (req, res) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user || !user.active) {
      res.status(404).json({ success: false, message: "Account not found or inactive." });
      return;
    }
    res.json({
      success: true,
      addresses: user.addresses || []
    });
  } catch (err) {
    console.error("[Get Addresses Error]", err);
    res.status(500).json({ success: false, message: "Failed to fetch addresses." });
  }
});
router5.post("/addresses", async (req, res) => {
  try {
    const { name: name2, phone: phone2, addressLine1, addressLine2, city, state, pincode, landmark, isDefault } = req.body;
    if (!name2 || typeof name2 !== "string" || name2.trim().length < 2) {
      res.status(400).json({ success: false, message: "Recipient name is required." });
      return;
    }
    if (!phone2 || typeof phone2 !== "string" || phone2.trim().length < 8) {
      res.status(400).json({ success: false, message: "Valid phone number is required." });
      return;
    }
    if (!addressLine1 || typeof addressLine1 !== "string" || addressLine1.trim().length < 3) {
      res.status(400).json({ success: false, message: "Address Line 1 is required." });
      return;
    }
    if (!city || typeof city !== "string" || city.trim().length < 2) {
      res.status(400).json({ success: false, message: "City is required." });
      return;
    }
    if (!state || typeof state !== "string" || state.trim().length < 2) {
      res.status(400).json({ success: false, message: "State is required." });
      return;
    }
    if (!pincode || typeof pincode !== "string" || !/^\d{6}$/.test(pincode.trim())) {
      res.status(400).json({ success: false, message: "Valid 6-digit Indian PIN code is required." });
      return;
    }
    const user = await User.findById(req.user?.userId);
    if (!user || !user.active) {
      res.status(404).json({ success: false, message: "Account not found or inactive." });
      return;
    }
    const currentAddresses = user.addresses || [];
    const shouldBeDefault = Boolean(isDefault) || currentAddresses.length === 0;
    if (shouldBeDefault) {
      currentAddresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }
    const newAddress = {
      name: name2.trim(),
      phone: phone2.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2 && typeof addressLine2 === "string" ? addressLine2.trim() : "",
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      landmark: landmark && typeof landmark === "string" ? landmark.trim() : "",
      isDefault: shouldBeDefault
    };
    user.addresses?.push(newAddress);
    await user.save();
    const saved = user.addresses?.[user.addresses.length - 1];
    res.status(201).json({
      success: true,
      message: "Address saved successfully.",
      address: saved,
      addresses: user.addresses
    });
  } catch (err) {
    console.error("[Add Address Error]", err);
    res.status(500).json({ success: false, message: "Failed to save address." });
  }
});
router5.put("/addresses/:addressId", async (req, res) => {
  try {
    const { addressId } = req.params;
    const { name: name2, phone: phone2, addressLine1, addressLine2, city, state, pincode, landmark, isDefault } = req.body;
    if (!mongoose17.Types.ObjectId.isValid(addressId)) {
      res.status(400).json({ success: false, message: "Invalid address ID format." });
      return;
    }
    const user = await User.findById(req.user?.userId);
    if (!user || !user.active) {
      res.status(404).json({ success: false, message: "Account not found or inactive." });
      return;
    }
    const address = user.addresses?.find((a) => a._id?.toString() === addressId);
    if (!address) {
      res.status(404).json({ success: false, message: "Address not found." });
      return;
    }
    if (name2 && typeof name2 === "string") address.name = name2.trim();
    if (phone2 && typeof phone2 === "string") address.phone = phone2.trim();
    if (addressLine1 && typeof addressLine1 === "string") address.addressLine1 = addressLine1.trim();
    if (typeof addressLine2 === "string") address.addressLine2 = addressLine2.trim();
    if (city && typeof city === "string") address.city = city.trim();
    if (state && typeof state === "string") address.state = state.trim();
    if (pincode && typeof pincode === "string") {
      if (!/^\d{6}$/.test(pincode.trim())) {
        res.status(400).json({ success: false, message: "Valid 6-digit PIN code required." });
        return;
      }
      address.pincode = pincode.trim();
    }
    if (typeof landmark === "string") address.landmark = landmark.trim();
    if (typeof isDefault === "boolean") {
      if (isDefault) {
        user.addresses?.forEach((a) => {
          a.isDefault = a._id?.toString() === addressId;
        });
      } else {
        address.isDefault = false;
      }
    }
    await user.save();
    res.json({
      success: true,
      message: "Address updated successfully.",
      address,
      addresses: user.addresses
    });
  } catch (err) {
    console.error("[Update Address Error]", err);
    res.status(500).json({ success: false, message: "Failed to update address." });
  }
});
router5.delete("/addresses/:addressId", async (req, res) => {
  try {
    const { addressId } = req.params;
    if (!mongoose17.Types.ObjectId.isValid(addressId)) {
      res.status(400).json({ success: false, message: "Invalid address ID format." });
      return;
    }
    const user = await User.findById(req.user?.userId);
    if (!user || !user.active) {
      res.status(404).json({ success: false, message: "Account not found or inactive." });
      return;
    }
    const initialLength = (user.addresses || []).length;
    const wasDefault = user.addresses?.find((a) => a._id?.toString() === addressId)?.isDefault;
    user.addresses = (user.addresses || []).filter((a) => a._id?.toString() !== addressId);
    if (user.addresses.length === initialLength) {
      res.status(404).json({ success: false, message: "Address not found." });
      return;
    }
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }
    await user.save();
    res.json({
      success: true,
      message: "Address deleted successfully.",
      addresses: user.addresses
    });
  } catch (err) {
    console.error("[Delete Address Error]", err);
    res.status(500).json({ success: false, message: "Failed to delete address." });
  }
});
router5.put("/addresses/:addressId/default", async (req, res) => {
  try {
    const { addressId } = req.params;
    if (!mongoose17.Types.ObjectId.isValid(addressId)) {
      res.status(400).json({ success: false, message: "Invalid address ID format." });
      return;
    }
    const user = await User.findById(req.user?.userId);
    if (!user || !user.active) {
      res.status(404).json({ success: false, message: "Account not found or inactive." });
      return;
    }
    const exists = user.addresses?.some((a) => a._id?.toString() === addressId);
    if (!exists) {
      res.status(404).json({ success: false, message: "Address not found." });
      return;
    }
    user.addresses?.forEach((a) => {
      a.isDefault = a._id?.toString() === addressId;
    });
    await user.save();
    res.json({
      success: true,
      message: "Default address updated.",
      addresses: user.addresses
    });
  } catch (err) {
    console.error("[Set Default Address Error]", err);
    res.status(500).json({ success: false, message: "Failed to set default address." });
  }
});
router5.get("/orders", async (req, res) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user || !user.active) {
      res.status(404).json({ success: false, message: "Account not found or inactive." });
      return;
    }
    const orders = await Order.find({
      $or: [{ customer: user._id }, { "customerInfo.email": user.email }]
    }).sort({ createdAt: -1 }).lean();
    res.json({
      success: true,
      orders
    });
  } catch (err) {
    console.error("[Customer Orders Error]", err);
    res.status(500).json({ success: false, message: "Failed to fetch customer orders." });
  }
});
router5.get("/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const user = await User.findById(req.user?.userId);
    if (!user || !user.active) {
      res.status(404).json({ success: false, message: "Account not found or inactive." });
      return;
    }
    const query = mongoose17.Types.ObjectId.isValid(orderId) ? { _id: orderId } : { orderNumber: orderId };
    const order = await Order.findOne(query).lean();
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found." });
      return;
    }
    const isOwner = order.customer && order.customer.toString() === user._id.toString() || order.customerInfo && order.customerInfo.email.toLowerCase() === user.email.toLowerCase();
    if (!isOwner) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to view this order."
      });
      return;
    }
    res.json({
      success: true,
      order
    });
  } catch (err) {
    console.error("[Customer Order Detail Error]", err);
    res.status(500).json({ success: false, message: "Failed to fetch order detail." });
  }
});
router5.get("/orders/:orderId/track", async (req, res) => {
  try {
    const { orderId } = req.params;
    const user = await User.findById(req.user?.userId);
    if (!user || !user.active) {
      res.status(404).json({ success: false, message: "Account not found or inactive." });
      return;
    }
    const query = mongoose17.Types.ObjectId.isValid(orderId) ? { $or: [{ _id: orderId }, { orderNumber: orderId }] } : { orderNumber: orderId };
    const order = await Order.findOne(query).lean();
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found." });
      return;
    }
    const isOwner = order.customer && order.customer.toString() === user._id.toString() || order.customerInfo && order.customerInfo.email.toLowerCase() === user.email.toLowerCase() || req.user?.role === "admin" || req.user?.role === "super_admin";
    if (!isOwner) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to view tracking for this order."
      });
      return;
    }
    const awbCode = order.shiprocketDetails?.awbCode || order.trackingInfo?.trackingNumber;
    if (!awbCode) {
      res.json({
        success: true,
        hasTracking: false,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        shipmentStatus: order.shipmentStatus || "unfulfilled",
        message: "Tracking information is not yet available for this order."
      });
      return;
    }
    res.json({
      success: true,
      hasTracking: true,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      shipmentStatus: order.shipmentStatus,
      courierName: order.trackingInfo?.courierName || order.shiprocketDetails?.courierName || "Shiprocket Partner",
      trackingNumber: awbCode,
      trackingUrl: order.trackingInfo?.trackingUrl || `https://shiprocket.co/tracking/${encodeURIComponent(awbCode)}`,
      lastEvent: order.shiprocketDetails?.lastEvent,
      lastEventDate: order.shiprocketDetails?.lastEventDate,
      syncedAt: order.shiprocketDetails?.syncedAt
    });
  } catch (err) {
    console.error("[Customer Order Track Error]", err);
    res.status(500).json({ success: false, message: "Failed to fetch tracking details." });
  }
});
router5.post("/orders/:orderId/cancel", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason = "Cancelled by customer" } = req.body || {};
    const user = await User.findById(req.user?.userId);
    if (!user || !user.active) {
      res.status(401).json({ success: false, message: "Account not found or inactive. Please sign in again." });
      return;
    }
    const query = mongoose17.Types.ObjectId.isValid(orderId) ? { _id: orderId } : { orderNumber: orderId };
    const order = await Order.findOne(query);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found." });
      return;
    }
    const isOwner = order.customer ? order.customer.toString() === user._id.toString() : Boolean(
      order.customerInfo?.email && order.customerInfo.email.toLowerCase() === user.email.toLowerCase()
    );
    if (!isOwner) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to cancel this order."
      });
      return;
    }
    if (order.orderStatus === "cancelled" || order.inventoryRestored) {
      res.json({
        success: true,
        alreadyCancelled: true,
        message: "This order is already cancelled.",
        order
      });
      return;
    }
    if (order.orderStatus !== "pending") {
      res.status(400).json({
        success: false,
        message: `Orders that are already in "${order.orderStatus}" status cannot be cancelled online. Please contact support.`,
        order
      });
      return;
    }
    if (order.shipmentStatus && order.shipmentStatus !== "unfulfilled") {
      res.status(400).json({
        success: false,
        message: "This order has already been prepared or dispatched for shipping and cannot be cancelled.",
        order
      });
      return;
    }
    const cancelResult = await cancelAndRestockOrder(order._id, {
      cancelledBy: "customer",
      reason: typeof reason === "string" && reason.trim() ? reason.trim() : "Cancelled by customer",
      allowedCurrentStatuses: ["pending"]
    });
    if (!cancelResult.success && !cancelResult.alreadyCancelled) {
      res.status(400).json({
        success: false,
        message: cancelResult.message || "Failed to cancel order.",
        warnings: cancelResult.warnings
      });
      return;
    }
    res.json({
      success: true,
      alreadyCancelled: Boolean(cancelResult.alreadyCancelled),
      message: cancelResult.alreadyCancelled ? "This order is already cancelled." : "Your order has been cancelled successfully. Any reserved items have been returned to stock.",
      order: cancelResult.order || order
    });
  } catch (err) {
    console.error("[Customer Order Cancel Error]", err);
    res.status(500).json({ success: false, message: "Failed to cancel order. Please try again or contact support." });
  }
});
var customerAccount_default = router5;

// server/routes/customerOrders.ts
import { Router as Router6 } from "express";
import rateLimit4 from "express-rate-limit";
import mongoose20 from "mongoose";
import crypto5 from "crypto";

// server/models/StoreSettings.ts
import mongoose18, { Schema as Schema9 } from "mongoose";
var storeSettingsSchema = new Schema9(
  {
    storeName: {
      type: String,
      default: "MALWA NAMKEEN HOUSE",
      trim: true
    },
    tagline: {
      type: String,
      default: "THE NAMKEEN & SNACKS HUB",
      trim: true
    },
    description: {
      type: String,
      default: "Heritage artisanal namkeens, sweets and chivdas extruded by hand and fried in pure cold-pressed groundnut oil.",
      trim: true
    },
    logo: {
      type: String,
      default: "/logo.png"
    },
    gstNumber: {
      type: String,
      default: "29AQWPP5638F2ZO",
      trim: true
    },
    fssaiNumber: {
      type: String,
      default: "11225302002687",
      trim: true
    },
    contact: {
      phone: { type: String, default: "+91 7987732765", trim: true },
      email: { type: String, default: "malwanamkeenhouse@gmail.com", lowercase: true, trim: true },
      whatsappNumber: { type: String, default: "917987732765", trim: true },
      address: {
        line1: { type: String, default: "No. 87/4-B, Sulikunte Village", trim: true },
        line2: { type: String, default: "Sarjapur Main Road, Dommasandra Post", trim: true },
        city: { type: String, default: "Bengaluru", trim: true },
        state: { type: String, default: "Karnataka", trim: true },
        postalCode: { type: String, default: "562125", trim: true },
        country: { type: String, default: "India", trim: true },
        full: { type: String, default: "No. 87/4-B, Sulikunte Village, Sarjapur Main Road, Dommasandra Post, Bengaluru \u2013 562125, Karnataka, India", trim: true }
      }
    },
    businessHours: {
      type: [
        {
          days: { type: String, required: true },
          open: { type: String, required: true },
          close: { type: String, required: true }
        }
      ],
      default: [
        { days: "Monday \u2013 Thursday", open: "9:00 AM", close: "10:30 PM" },
        { days: "Friday", open: "9:00 AM", close: "11:00 PM" },
        { days: "Saturday \u2013 Sunday", open: "8:30 AM", close: "11:00 PM" }
      ]
    },
    deliverySettings: {
      freeShippingThreshold: { type: Number, default: 499, min: 0 },
      standardShippingFee: { type: Number, default: 49, min: 0 },
      estimatedDeliveryDays: { type: String, default: "2\u20134 Business Days" },
      codEnabled: { type: Boolean, default: true },
      minOrderValue: { type: Number, default: 99, min: 0 }
    },
    socialLinks: {
      instagram: { type: String, default: "" },
      facebook: { type: String, default: "" },
      youtube: { type: String, default: "" },
      twitter: { type: String, default: "" },
      googleMapsUrl: { type: String, default: "" }
    },
    policies: {
      privacyPolicy: { type: String, default: "" },
      termsConditions: { type: String, default: "" },
      cancellationPolicy: { type: String, default: "" },
      refundPolicy: { type: String, default: "" },
      shippingPolicy: { type: String, default: "" }
    }
  },
  {
    timestamps: true
  }
);
var StoreSettings = mongoose18.models.StoreSettings || mongoose18.model("StoreSettings", storeSettingsSchema);

// server/models/IdempotencyRecord.ts
import mongoose19, { Schema as Schema10 } from "mongoose";
var idempotencyRecordSchema = new Schema10(
  {
    scopeKey: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    key: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    user: {
      type: Schema10.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    requestHash: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["started", "completed", "failed"],
      default: "started",
      index: true
    },
    order: {
      type: Schema10.Types.ObjectId,
      ref: "Order"
    },
    orderNumber: {
      type: String,
      trim: true
    },
    statusCode: {
      type: Number,
      default: 201
    },
    responsePayload: {
      type: Schema10.Types.Mixed
    },
    errorMessage: {
      type: String,
      trim: true
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);
idempotencyRecordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
idempotencyRecordSchema.index({ user: 1, key: 1 }, { unique: true });
var IdempotencyRecord = mongoose19.models.IdempotencyRecord || mongoose19.model("IdempotencyRecord", idempotencyRecordSchema);

// server/lib/razorpayService.ts
import crypto4 from "crypto";
var _testClient2 = null;
function getRazorpayConfig() {
  const isTest = process.env.NODE_ENV === "test" || process.env.IS_E2E_TEST === "true";
  const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
  const webhookSecret = (process.env.RAZORPAY_WEBHOOK_SECRET || "").trim();
  const isSandbox = process.env.RAZORPAY_SANDBOX === "true" || keyId.startsWith("rzp_test_") || isTest;
  const isConfigured = Boolean(keyId && keySecret);
  return {
    keyId,
    keySecret,
    webhookSecret,
    isConfigured,
    isSandbox
  };
}
function getPublicRazorpayKeyId() {
  const config = getRazorpayConfig();
  return config.keyId;
}
async function createRazorpayOrder(params) {
  const config = getRazorpayConfig();
  if (!Number.isInteger(params.amount) || params.amount <= 0) {
    return {
      success: false,
      error: "Invalid order amount. Amount must be a positive integer in paise.",
      statusCode: 400
    };
  }
  const currency = (params.currency || "INR").toUpperCase();
  if (currency !== "INR") {
    return {
      success: false,
      error: `Unsupported currency: ${currency}. Only INR is currently supported.`,
      statusCode: 400
    };
  }
  if (!params.receipt || typeof params.receipt !== "string" || !params.receipt.trim()) {
    return {
      success: false,
      error: "Order receipt identifier is required.",
      statusCode: 400
    };
  }
  if (_testClient2) {
    try {
      const mockOrder = await _testClient2.orders.create({
        amount: params.amount,
        currency,
        receipt: params.receipt.trim(),
        notes: params.notes || {}
      });
      return { success: true, data: mockOrder };
    } catch (testErr) {
      const errMsg = testErr instanceof Error ? testErr.message : String(testErr);
      return { success: false, error: errMsg, statusCode: 500 };
    }
  }
  if (!config.isConfigured) {
    return {
      success: false,
      error: "Razorpay payment gateway is not configured on this server.",
      statusCode: 503
    };
  }
  const authHeader = `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64")}`;
  const payload = {
    amount: params.amount,
    currency,
    receipt: params.receipt.trim().slice(0, 40),
    // Razorpay receipt max 40 chars
    notes: params.notes || {},
    payment_capture: 1
    // Automatically capture authorized payments
  };
  try {
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      const errorDescription = data?.error?.description || data?.error?.message || "Razorpay order creation failed.";
      console.error("[Razorpay Order Creation Error]:", errorDescription, data);
      return {
        success: false,
        error: errorDescription,
        statusCode: res.status
      };
    }
    return {
      success: true,
      data
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[Razorpay Network Exception]:", errMsg);
    return {
      success: false,
      error: "Payment gateway connection error. Please try again.",
      statusCode: 502
    };
  }
}
function verifyPaymentSignature(params) {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;
  if (!razorpayOrderId || typeof razorpayOrderId !== "string" || !razorpayPaymentId || typeof razorpayPaymentId !== "string" || !razorpaySignature || typeof razorpaySignature !== "string") {
    return false;
  }
  const config = getRazorpayConfig();
  const secret = (params.secret || config.keySecret || "").trim();
  if (!secret) {
    return false;
  }
  try {
    const payload = `${razorpayOrderId.trim()}|${razorpayPaymentId.trim()}`;
    const expectedSignature = crypto4.createHmac("sha256", secret).update(payload).digest("hex");
    const expectedBuf = Buffer.from(expectedSignature, "utf-8");
    const actualBuf = Buffer.from(razorpaySignature.trim(), "utf-8");
    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }
    return crypto4.timingSafeEqual(expectedBuf, actualBuf);
  } catch (err) {
    console.error("[Signature Verification Error]:", err);
    return false;
  }
}
function verifyWebhookSignature(params) {
  const { rawBody, signature } = params;
  if (!rawBody || !signature || typeof signature !== "string") {
    return false;
  }
  const config = getRazorpayConfig();
  const secret = (params.webhookSecret || config.webhookSecret || "").trim();
  if (!secret) {
    return false;
  }
  try {
    const expectedSignature = crypto4.createHmac("sha256", secret).update(rawBody).digest("hex");
    const expectedBuf = Buffer.from(expectedSignature, "utf-8");
    const actualBuf = Buffer.from(signature.trim(), "utf-8");
    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }
    return crypto4.timingSafeEqual(expectedBuf, actualBuf);
  } catch (err) {
    console.error("[Webhook Signature Verification Error]:", err);
    return false;
  }
}

// server/routes/customerOrders.ts
var router6 = Router6();
var recentSubmissions = /* @__PURE__ */ new Map();
function cleanupRecentSubmissions() {
  const now = Date.now();
  for (const [key, value] of recentSubmissions.entries()) {
    if (now - value.timestamp >= 3e5) {
      recentSubmissions.delete(key);
    }
  }
}
function computeCheckoutRequestHash(params) {
  const normalizedItems = (Array.isArray(params.items) ? params.items : []).map((it) => ({
    productId: String(it.productId || ""),
    variantId: String(it.variantId || it.sku || it.weight || ""),
    quantity: Number(it.quantity) || 0
  })).sort((a, b) => `${a.productId}:${a.variantId}`.localeCompare(`${b.productId}:${b.variantId}`));
  const normalizedAddress = {
    name: String(params.shippingAddress?.name || "").trim().toLowerCase(),
    phone: String(params.shippingAddress?.phone || "").trim(),
    addressLine1: String(params.shippingAddress?.addressLine1 || "").trim().toLowerCase(),
    city: String(params.shippingAddress?.city || "").trim().toLowerCase(),
    state: String(params.shippingAddress?.state || "").trim().toLowerCase(),
    pincode: String(params.shippingAddress?.pincode || "").trim()
  };
  const canonical = {
    items: normalizedItems,
    address: normalizedAddress,
    coupon: String(params.couponCode || "").trim().toUpperCase(),
    paymentMethod: String(params.paymentMethod || "cod").trim().toLowerCase()
  };
  return crypto5.createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}
function generateOrderNumber() {
  const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(2, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1e3 + Math.random() * 9e3);
  return `MN-${dateStr}-${randomSuffix}`;
}
var orderCreationLimiter = rateLimit4({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { default: false, keyGeneratorIpFallback: false },
  store: new MongoRateLimitStore("orders:create", 15 * 60 * 1e3),
  keyGenerator: (req) => {
    return req.user?.userId ? `user_${req.user.userId}` : req.ip || "127.0.0.1";
  },
  skip: (req) => {
    const rawKey = req.headers?.["idempotency-key"] || req.headers?.["x-idempotency-key"] || req.body?.idempotencyKey;
    const idempotencyKey = typeof rawKey === "string" && rawKey.trim() ? rawKey.trim() : "";
    if (idempotencyKey && req.user?.userId) {
      const cached = recentSubmissions.get(`${req.user.userId}:${idempotencyKey}`);
      if (cached && Date.now() - cached.timestamp < 3e5) {
        return true;
      }
    }
    return false;
  },
  message: {
    success: false,
    message: "Too many orders placed recently. Please try again after 15 minutes."
  }
});
router6.post("/", requireAuth, orderCreationLimiter, async (req, res) => {
  let appliedDiscountCode = "";
  const reservedStockUpdates = [];
  let scopeKey = "";
  let idempotencyRecord = null;
  const releaseIdempotencyLock = async () => {
    if (scopeKey && idempotencyRecord) {
      try {
        await IdempotencyRecord.deleteOne({ scopeKey, status: "started" });
      } catch {
      }
      idempotencyRecord = null;
    }
  };
  try {
    const {
      items = [],
      shippingAddress,
      saveAddressToBook = false,
      couponCode = "",
      paymentMethod = "cod",
      notes = ""
    } = req.body;
    const rawKey = req.headers?.["idempotency-key"] || req.headers?.["x-idempotency-key"] || req.body?.idempotencyKey;
    const idempotencyKey = typeof rawKey === "string" && rawKey.trim() ? rawKey.trim() : "";
    if (idempotencyKey && req.user?.userId) {
      const cached = recentSubmissions.get(`${req.user.userId}:${idempotencyKey}`);
      if (cached && Date.now() - cached.timestamp < 3e5) {
        const currentHash = computeCheckoutRequestHash({
          items,
          shippingAddress,
          couponCode,
          paymentMethod
        });
        if (cached.requestHash && cached.requestHash !== currentHash) {
          res.status(400).json({
            success: false,
            message: "Idempotency key was previously used with different checkout data."
          });
          return;
        }
        const existingOrder = await Order.findById(cached.orderId).lean();
        if (existingOrder && existingOrder.customer?.toString() === req.user?.userId) {
          res.json({
            success: true,
            order: existingOrder,
            isDuplicateReplay: true,
            ...cached.razorpay ? { razorpay: cached.razorpay } : {}
          });
          return;
        }
      }
    }
    const user = await User.findById(req.user?.userId);
    if (!user || !user.active) {
      res.status(401).json({
        success: false,
        message: "Your account is inactive or session is invalid. Please sign in again."
      });
      return;
    }
    if (idempotencyKey) {
      scopeKey = `cust_${user._id.toString()}:${idempotencyKey}`;
      const requestHash = computeCheckoutRequestHash({
        items,
        shippingAddress,
        couponCode,
        paymentMethod
      });
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1e3);
      try {
        idempotencyRecord = await IdempotencyRecord.create({
          scopeKey,
          key: idempotencyKey,
          user: user._id,
          requestHash,
          status: "started",
          expiresAt
        });
      } catch (idempErr) {
        if (idempErr?.code === 11e3 || idempErr?.name === "MongoServerError" && idempErr?.code === 11e3) {
          const existing = await IdempotencyRecord.findOne({ scopeKey });
          if (existing) {
            if (existing.user.toString() !== user._id.toString()) {
              res.status(403).json({
                success: false,
                message: "Idempotency key is not authorized for this account."
              });
              return;
            }
            if (existing.requestHash && existing.requestHash !== requestHash) {
              res.status(400).json({
                success: false,
                message: "Idempotency key was previously used with different checkout data."
              });
              return;
            }
            if (existing.status === "completed") {
              const existingOrder = await Order.findById(existing.order).lean();
              const returnedOrder = existing.responsePayload?.order || existingOrder;
              if (returnedOrder) {
                res.status(existing.statusCode || 200).json({
                  success: true,
                  isDuplicateReplay: true,
                  message: "Order already created.",
                  order: returnedOrder,
                  ...existing.responsePayload?.razorpay ? { razorpay: existing.responsePayload.razorpay } : {}
                });
                return;
              }
              res.status(409).json({
                success: false,
                message: "This checkout order has already been completed."
              });
              return;
            }
            if (existing.status === "started") {
              const pollStart = Date.now();
              let completedRecord = null;
              while (Date.now() - pollStart < 3e3) {
                await new Promise((r) => setTimeout(r, 200));
                const pollCheck = await IdempotencyRecord.findOne({ scopeKey }).lean();
                if (pollCheck?.status === "completed") {
                  completedRecord = pollCheck;
                  break;
                }
                if (pollCheck?.status === "failed") {
                  break;
                }
              }
              if (completedRecord) {
                const existingOrder = await Order.findById(completedRecord.order).lean();
                const returnedOrder = completedRecord.responsePayload?.order || existingOrder;
                if (returnedOrder) {
                  res.status(completedRecord.statusCode || 200).json({
                    success: true,
                    isDuplicateReplay: true,
                    message: "Order already created.",
                    order: returnedOrder,
                    ...completedRecord.responsePayload?.razorpay ? { razorpay: completedRecord.responsePayload.razorpay } : {}
                  });
                  return;
                }
              }
              res.status(409).json({
                success: false,
                message: "A checkout with this idempotency key is currently being processed. Please wait a moment and refresh."
              });
              return;
            }
            if (existing.status === "failed") {
              await IdempotencyRecord.deleteOne({ scopeKey, status: "failed" });
              try {
                idempotencyRecord = await IdempotencyRecord.create({
                  scopeKey,
                  key: idempotencyKey,
                  user: user._id,
                  requestHash,
                  status: "started",
                  expiresAt
                });
              } catch {
                res.status(409).json({
                  success: false,
                  message: "A checkout with this idempotency key is currently being processed."
                });
                return;
              }
            }
          }
        } else {
          throw idempErr;
        }
      }
    }
    const pendingOrderCount = await Order.countDocuments({
      customer: user._id,
      orderStatus: "pending"
    });
    if (pendingOrderCount >= 3) {
      await releaseIdempotencyLock();
      res.status(400).json({
        success: false,
        message: "You have too many pending orders. Please wait for them to be processed or contact support."
      });
      return;
    }
    if (!Array.isArray(items) || items.length === 0) {
      await releaseIdempotencyLock();
      res.status(400).json({
        success: false,
        message: "Your cart is empty. Please add items to checkout."
      });
      return;
    }
    if (!shippingAddress || typeof shippingAddress !== "object" || !shippingAddress.name?.trim() || !shippingAddress.phone?.trim() || !shippingAddress.addressLine1?.trim() || !shippingAddress.city?.trim() || !shippingAddress.state?.trim() || !shippingAddress.pincode?.trim()) {
      await releaseIdempotencyLock();
      res.status(400).json({
        success: false,
        message: "Please provide a complete delivery address with PIN code and phone."
      });
      return;
    }
    if (!/^\d{6}$/.test(String(shippingAddress.pincode).trim())) {
      await releaseIdempotencyLock();
      res.status(400).json({
        success: false,
        message: "Please provide a valid 6-digit Indian PIN code."
      });
      return;
    }
    const productIds = [
      ...new Set(
        items.map((it) => it.productId).filter((id) => mongoose20.Types.ObjectId.isValid(id))
      )
    ];
    const products = await Product.find({
      _id: { $in: productIds },
      active: true
    }).lean();
    const productMap = new Map(products.map((p) => [String(p._id), p]));
    const orderItems = [];
    const stockUpdates = [];
    for (const item of items) {
      const product = productMap.get(String(item.productId));
      if (!product) {
        await releaseIdempotencyLock();
        res.status(400).json({
          success: false,
          message: `Item in cart is no longer active or available.`
        });
        return;
      }
      let variant = null;
      if (Array.isArray(product.variants)) {
        if (item.variantId) {
          variant = product.variants.find(
            (v) => String(v._id) === String(item.variantId) && v.active !== false
          );
        }
        if (!variant && item.sku) {
          variant = product.variants.find((v) => v.sku === item.sku && v.active !== false);
        }
        if (!variant && item.weight) {
          variant = product.variants.find(
            (v) => (v.label === item.weight || `${v.value || ""} ${v.unit || ""}`.trim() === item.weight) && v.active !== false
          );
        }
        if (!variant && product.variants.length > 0) {
          variant = product.variants.find((v) => v.active !== false) || product.variants[0];
        }
      }
      if (!variant) {
        await releaseIdempotencyLock();
        res.status(400).json({
          success: false,
          message: `Packaging for "${product.name}" is currently unavailable.`
        });
        return;
      }
      const rawQty = parseInt(String(item.quantity), 10);
      if (isNaN(rawQty) || rawQty <= 0 || !Number.isInteger(Number(item.quantity))) {
        await releaseIdempotencyLock();
        res.status(400).json({
          success: false,
          message: `Invalid quantity for "${product.name}". Quantity must be a positive whole number.`
        });
        return;
      }
      const qty = rawQty;
      const stock = typeof variant.stock === "number" ? variant.stock : 100;
      if (stock < qty) {
        await releaseIdempotencyLock();
        res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name} (${variant.label || "Standard"})". Available: ${stock}.`
        });
        return;
      }
      const unitPrice = typeof variant.salePrice === "number" && variant.salePrice > 0 ? variant.salePrice : variant.price;
      const primaryImage = Array.isArray(product.images) && product.images[0] || product.image || "/hero-banner-1.png";
      const variantLabel = variant.label || `${variant.value || ""} ${variant.unit || ""}`.trim() || "Standard";
      orderItems.push({
        productId: product._id,
        variantId: variant._id,
        productName: product.name,
        variantLabel,
        sku: variant.sku || "",
        price: unitPrice,
        quantity: qty,
        itemTotal: Math.round(unitPrice * qty * 100) / 100,
        image: primaryImage
      });
      stockUpdates.push({
        productId: product._id,
        variantId: variant._id,
        decrement: qty,
        productName: product.name,
        variantLabel
      });
    }
    const subtotal = Math.round(orderItems.reduce((sum, it) => sum + it.itemTotal, 0) * 100) / 100;
    const storeSettings = await StoreSettings.findOne().lean();
    const minOrder = storeSettings?.deliverySettings?.minOrderValue ?? 0;
    if (minOrder > 0 && subtotal < minOrder) {
      await releaseIdempotencyLock();
      res.status(400).json({
        success: false,
        message: `Minimum order subtotal for delivery is \u20B9${minOrder}.`
      });
      return;
    }
    const freeThreshold = storeSettings?.deliverySettings?.freeShippingThreshold ?? 499;
    const standardFee = storeSettings?.deliverySettings?.standardShippingFee ?? 49;
    const shipping = subtotal >= freeThreshold ? 0 : standardFee;
    let discountAmount = 0;
    if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
      const discountCalc = await validateAndCalculateDiscount(couponCode.trim(), subtotal, orderItems);
      if (!discountCalc.valid || !discountCalc.discount) {
        await releaseIdempotencyLock();
        res.status(400).json({
          success: false,
          message: discountCalc.message || "Invalid or expired coupon code."
        });
        return;
      }
      const discountId = discountCalc.discount._id;
      const updatedDiscount = await Discount.findOneAndUpdate(
        {
          _id: discountId,
          active: true,
          $or: [
            { usageLimit: { $exists: false } },
            { usageLimit: null },
            { usageLimit: 0 },
            { $expr: { $lt: ["$usedCount", "$usageLimit"] } }
          ]
        },
        { $inc: { usedCount: 1 } },
        { returnDocument: "after" }
      );
      if (!updatedDiscount) {
        await releaseIdempotencyLock();
        res.status(400).json({
          success: false,
          message: `Coupon code "${discountCalc.code}" has just reached its maximum redemption limit.`
        });
        return;
      }
      discountAmount = discountCalc.discountAmount;
      appliedDiscountCode = updatedDiscount.code;
    }
    const finalTotal = Math.max(0, Math.round((subtotal - discountAmount + shipping) * 100) / 100);
    let orderNumber = generateOrderNumber();
    let collisionCheck = await Order.findOne({ orderNumber });
    while (collisionCheck) {
      orderNumber = generateOrderNumber();
      collisionCheck = await Order.findOne({ orderNumber });
    }
    const cleanShippingAddress = {
      name: shippingAddress.name.trim(),
      phone: shippingAddress.phone.trim(),
      addressLine1: shippingAddress.addressLine1.trim(),
      addressLine2: shippingAddress.addressLine2 ? String(shippingAddress.addressLine2).trim() : "",
      city: shippingAddress.city.trim(),
      state: shippingAddress.state.trim(),
      pincode: shippingAddress.pincode.trim(),
      landmark: shippingAddress.landmark ? String(shippingAddress.landmark).trim() : ""
    };
    if (saveAddressToBook) {
      const existsInBook = (user.addresses || []).some(
        (a) => a.addressLine1 === cleanShippingAddress.addressLine1 && a.pincode === cleanShippingAddress.pincode
      );
      if (!existsInBook) {
        user.addresses = user.addresses || [];
        user.addresses.push({
          ...cleanShippingAddress,
          isDefault: user.addresses.length === 0
        });
        await user.save();
      }
    }
    let stockFailure = false;
    let failedItemName = "";
    for (let i = 0; i < stockUpdates.length; i++) {
      const update = stockUpdates[i];
      if (update.variantId) {
        const updateResult = await Product.updateOne(
          {
            _id: update.productId,
            variants: {
              $elemMatch: {
                _id: update.variantId,
                stock: { $gte: update.decrement }
              }
            }
          },
          { $inc: { "variants.$.stock": -update.decrement } }
        );
        if (updateResult.matchedCount === 0 || updateResult.modifiedCount === 0) {
          stockFailure = true;
          failedItemName = `${update.productName} (${update.variantLabel})`;
          break;
        }
        reservedStockUpdates.push({
          productId: update.productId,
          variantId: update.variantId,
          decrement: update.decrement
        });
      }
    }
    if (stockFailure) {
      await releaseIdempotencyLock();
      for (const resv of reservedStockUpdates) {
        await Product.updateOne(
          { _id: resv.productId, "variants._id": resv.variantId },
          { $inc: { "variants.$.stock": resv.decrement } }
        );
      }
      if (appliedDiscountCode) {
        await Discount.updateOne(
          { code: appliedDiscountCode },
          { $inc: { usedCount: -1 } }
        );
      }
      res.status(400).json({
        success: false,
        message: `Insufficient stock for "${failedItemName}". It may have just been ordered by another customer.`
      });
      return;
    }
    let newOrder;
    try {
      newOrder = await Order.create({
        orderNumber,
        customer: user._id,
        customerInfo: {
          name: user.name || cleanShippingAddress.name,
          email: user.email,
          phone: cleanShippingAddress.phone || user.phone || ""
        },
        items: orderItems,
        subtotal,
        discount: discountAmount,
        discountCode: appliedDiscountCode,
        shipping,
        total: finalTotal,
        shippingAddress: cleanShippingAddress,
        orderStatus: "pending",
        paymentStatus: "pending",
        paymentMethod: ["cod", "online", "upi", "card"].includes(paymentMethod) ? paymentMethod : "cod",
        shipmentStatus: "unfulfilled",
        notes: typeof notes === "string" ? notes.trim() : "",
        idempotencyKey: idempotencyKey || void 0
      });
    } catch (orderCreateErr) {
      await releaseIdempotencyLock();
      for (const resv of reservedStockUpdates) {
        await Product.updateOne(
          { _id: resv.productId, "variants._id": resv.variantId },
          { $inc: { "variants.$.stock": resv.decrement } }
        );
      }
      if (appliedDiscountCode) {
        await Discount.updateOne(
          { code: appliedDiscountCode },
          { $inc: { usedCount: -1 } }
        );
      }
      throw orderCreateErr;
    }
    let razorpayPayload = null;
    const isOnlinePayment = ["online", "upi", "card"].includes(newOrder.paymentMethod);
    if (isOnlinePayment && newOrder.total > 0) {
      const rzpRes = await createRazorpayOrder({
        amount: Math.round(newOrder.total * 100),
        currency: "INR",
        receipt: newOrder.orderNumber,
        notes: {
          orderId: newOrder._id.toString(),
          orderNumber: newOrder.orderNumber,
          customerEmail: newOrder.customerInfo.email
        }
      });
      if (!rzpRes.success || !rzpRes.data) {
        await releaseIdempotencyLock();
        for (const resv of reservedStockUpdates) {
          try {
            await Product.updateOne(
              { _id: resv.productId, "variants._id": resv.variantId },
              { $inc: { "variants.$.stock": resv.decrement } }
            );
          } catch {
          }
        }
        if (appliedDiscountCode) {
          try {
            await Discount.updateOne(
              { code: appliedDiscountCode },
              { $inc: { usedCount: -1 } }
            );
          } catch {
          }
        }
        try {
          await Order.findByIdAndDelete(newOrder._id);
        } catch {
        }
        res.status(502).json({
          success: false,
          message: rzpRes.error || "Failed to initialize payment gateway. Please choose Cash on Delivery or try again later."
        });
        return;
      }
      newOrder.paymentDetails = {
        gateway: "razorpay",
        razorpayOrderId: rzpRes.data.id
      };
      await newOrder.save();
      razorpayPayload = {
        keyId: getPublicRazorpayKeyId(),
        orderId: rzpRes.data.id,
        amount: rzpRes.data.amount,
        currency: rzpRes.data.currency,
        name: "Malwa Namkeen House",
        description: `Order #${newOrder.orderNumber}`,
        prefill: {
          name: user.name || cleanShippingAddress.name,
          email: user.email,
          contact: cleanShippingAddress.phone || user.phone || ""
        }
      };
    } else if (isOnlinePayment && newOrder.total === 0) {
      newOrder.paymentStatus = "paid";
      newOrder.orderStatus = "confirmed";
      newOrder.paymentDetails = {
        gateway: "promo",
        paidAt: /* @__PURE__ */ new Date()
      };
      await newOrder.save();
    }
    if (scopeKey) {
      const responseOrderPayload = {
        _id: newOrder._id.toString(),
        orderNumber: newOrder.orderNumber,
        subtotal: newOrder.subtotal,
        discount: newOrder.discount,
        discountCode: newOrder.discountCode,
        shipping: newOrder.shipping,
        total: newOrder.total,
        items: newOrder.items,
        shippingAddress: newOrder.shippingAddress,
        orderStatus: newOrder.orderStatus,
        paymentStatus: newOrder.paymentStatus,
        paymentMethod: newOrder.paymentMethod,
        shipmentStatus: newOrder.shipmentStatus,
        createdAt: newOrder.createdAt
      };
      await IdempotencyRecord.updateOne(
        { scopeKey },
        {
          $set: {
            status: "completed",
            order: newOrder._id,
            orderNumber: newOrder.orderNumber,
            statusCode: 201,
            responsePayload: {
              order: responseOrderPayload,
              ...razorpayPayload ? { razorpay: razorpayPayload } : {}
            }
          }
        }
      );
      idempotencyRecord = null;
    }
    if (idempotencyKey && req.user?.userId) {
      cleanupRecentSubmissions();
      recentSubmissions.set(`${req.user.userId}:${idempotencyKey}`, {
        timestamp: Date.now(),
        orderId: newOrder._id.toString(),
        requestHash: scopeKey ? computeCheckoutRequestHash({ items, shippingAddress, couponCode, paymentMethod }) : void 0,
        razorpay: razorpayPayload || void 0
      });
    }
    if (newOrder.paymentMethod === "cod" || newOrder.paymentStatus === "paid") {
      dispatchOrderConfirmationEmails(newOrder);
    }
    res.status(201).json({
      success: true,
      message: isOnlinePayment && newOrder.total > 0 ? "Order initialized. Please complete payment." : "Order created successfully.",
      order: {
        _id: newOrder._id.toString(),
        orderNumber: newOrder.orderNumber,
        subtotal: newOrder.subtotal,
        discount: newOrder.discount,
        discountCode: newOrder.discountCode,
        shipping: newOrder.shipping,
        total: newOrder.total,
        items: newOrder.items,
        shippingAddress: newOrder.shippingAddress,
        orderStatus: newOrder.orderStatus,
        paymentStatus: newOrder.paymentStatus,
        paymentMethod: newOrder.paymentMethod,
        shipmentStatus: newOrder.shipmentStatus,
        createdAt: newOrder.createdAt
      },
      ...razorpayPayload ? { razorpay: razorpayPayload } : {}
    });
  } catch (err) {
    console.error("[Create Order Error]", err);
    await releaseIdempotencyLock();
    for (const resv of reservedStockUpdates) {
      try {
        await Product.updateOne(
          { _id: resv.productId, "variants._id": resv.variantId },
          { $inc: { "variants.$.stock": resv.decrement } }
        );
      } catch {
      }
    }
    if (appliedDiscountCode) {
      try {
        await Discount.updateOne(
          { code: appliedDiscountCode },
          { $inc: { usedCount: -1 } }
        );
      } catch {
      }
    }
    res.status(500).json({
      success: false,
      message: "Failed to process order. Please try again."
    });
  }
});
async function dispatchOrderConfirmationEmails(order) {
  try {
    await sendCustomerOrderConfirmation({ order });
    const activeAdmins = await User.find({
      role: { $in: ["admin", "super_admin"] },
      active: true
    }).select("email").lean();
    const configuredAdmin = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL;
    const adminEmails = [
      ...activeAdmins.map((a) => a.email),
      ...configuredAdmin ? [configuredAdmin] : []
    ].filter(Boolean);
    if (adminEmails.length > 0) {
      await sendNewOrderAdminAlert({ order, adminEmails });
    }
  } catch (notifyErr) {
    console.warn("[Order Notification Warning] Failed to dispatch order emails:", notifyErr);
  }
}
async function handleVerifyPayment(req, res) {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body || {};
    if (!orderId || typeof orderId !== "string" || !razorpayOrderId || typeof razorpayOrderId !== "string" || !razorpayPaymentId || typeof razorpayPaymentId !== "string" || !razorpaySignature || typeof razorpaySignature !== "string") {
      res.status(400).json({
        success: false,
        message: "Missing or invalid payment verification parameters."
      });
      return;
    }
    if (!mongoose20.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({
        success: false,
        message: "Invalid order ID format."
      });
      return;
    }
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found."
      });
      return;
    }
    const isOwner = order.customer?.toString() === req.user?.userId || req.user?.role === "admin" || req.user?.role === "super_admin";
    if (!isOwner) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to verify payment for this order."
      });
      return;
    }
    if (order.paymentStatus === "paid") {
      if (!order.paymentDetails?.razorpayPaymentId || order.paymentDetails.razorpayPaymentId === razorpayPaymentId.trim()) {
        res.json({
          success: true,
          message: "Payment has already been verified and recorded.",
          order
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: "Order is already marked as paid with a different payment reference."
      });
      return;
    }
    if (order.orderStatus === "cancelled") {
      res.status(400).json({
        success: false,
        message: "Cannot verify payment for a cancelled order. Reserved inventory was already restored."
      });
      return;
    }
    if (!["online", "upi", "card"].includes(order.paymentMethod)) {
      res.status(400).json({
        success: false,
        message: "Payment verification is only permitted for online orders."
      });
      return;
    }
    if (!order.paymentDetails?.razorpayOrderId) {
      res.status(400).json({
        success: false,
        message: "No Razorpay order ID is associated with this order record."
      });
      return;
    }
    if (order.paymentDetails.razorpayOrderId !== razorpayOrderId.trim()) {
      res.status(400).json({
        success: false,
        message: "Razorpay order ID does not match the order record."
      });
      return;
    }
    const duplicatePayment = await Order.findOne({
      _id: { $ne: order._id },
      "paymentDetails.razorpayPaymentId": razorpayPaymentId.trim()
    }).lean();
    if (duplicatePayment) {
      console.warn(`[Security Alert] Replay attack: paymentId ${razorpayPaymentId.trim()} already credited to order ${duplicatePayment.orderNumber}`);
      res.status(400).json({
        success: false,
        message: "Payment ID has already been credited to another order."
      });
      return;
    }
    const isValidSignature = verifyPaymentSignature({
      razorpayOrderId: razorpayOrderId.trim(),
      razorpayPaymentId: razorpayPaymentId.trim(),
      razorpaySignature: razorpaySignature.trim()
    });
    if (!isValidSignature) {
      console.warn(`[Security Alert] Invalid payment signature attempt for order ${order.orderNumber}`);
      res.status(400).json({
        success: false,
        message: "Invalid payment signature. Payment could not be verified."
      });
      return;
    }
    let updatedOrder;
    try {
      updatedOrder = await Order.findOneAndUpdate(
        {
          _id: order._id,
          paymentStatus: { $ne: "paid" },
          orderStatus: { $ne: "cancelled" }
        },
        {
          $set: {
            paymentStatus: "paid",
            orderStatus: "confirmed",
            "paymentDetails.gateway": "razorpay",
            "paymentDetails.transactionId": razorpayPaymentId.trim(),
            "paymentDetails.razorpayPaymentId": razorpayPaymentId.trim(),
            "paymentDetails.razorpaySignature": razorpaySignature.trim(),
            "paymentDetails.paidAt": /* @__PURE__ */ new Date()
          }
        },
        { new: true }
      );
    } catch (err) {
      if (err?.code === 11e3 || err?.name === "MongoServerError" && err?.code === 11e3) {
        console.warn(
          `[Security Alert] Duplicate key conflict: paymentId ${razorpayPaymentId.trim()} already credited to another order`
        );
        res.status(400).json({
          success: false,
          message: "Payment ID has already been credited to another order."
        });
        return;
      }
      throw err;
    }
    if (!updatedOrder) {
      const current = await Order.findById(order._id);
      if (current?.paymentStatus === "paid") {
        if (!current.paymentDetails?.razorpayPaymentId || current.paymentDetails.razorpayPaymentId === razorpayPaymentId.trim()) {
          res.json({
            success: true,
            message: "Payment already verified.",
            order: current
          });
          return;
        }
      }
      res.status(400).json({
        success: false,
        message: "Unable to update order payment state."
      });
      return;
    }
    dispatchOrderConfirmationEmails(updatedOrder);
    res.json({
      success: true,
      message: "Payment verified successfully.",
      order: updatedOrder
    });
  } catch (err) {
    console.error("[Payment Verification Error]:", err);
    res.status(500).json({
      success: false,
      message: "An error occurred during payment verification."
    });
  }
}
router6.post("/verify-payment", requireAuth, handleVerifyPayment);
async function handleRazorpayWebhook(req, res) {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = req.rawBody || JSON.stringify(req.body);
    if (!signature || !verifyWebhookSignature({ rawBody, signature })) {
      console.warn("[Razorpay Webhook Warning] Invalid webhook signature received.");
      res.status(400).json({ success: false, message: "Invalid webhook signature." });
      return;
    }
    const event = req.body?.event;
    const eventId = req.headers["x-razorpay-event-id"] || req.body?.id || "";
    if (eventId) {
      const alreadyHandled = await Order.findOne({ processedWebhookEvents: eventId }).lean();
      if (alreadyHandled) {
        res.json({
          success: true,
          message: "Webhook event already processed.",
          alreadyProcessed: true
        });
        return;
      }
    }
    if (event === "order.paid" || event === "payment.captured") {
      const paymentEntity = req.body?.payload?.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id || req.body?.payload?.order?.entity?.id;
      const paymentId = paymentEntity?.id;
      if (!rzpOrderId) {
        res.status(400).json({ success: false, message: "Missing order_id in webhook payload." });
        return;
      }
      const order = await Order.findOne({
        $or: [
          { "paymentDetails.razorpayOrderId": rzpOrderId },
          ...paymentEntity?.notes?.orderId && mongoose20.Types.ObjectId.isValid(paymentEntity.notes.orderId) ? [{ _id: paymentEntity.notes.orderId }] : []
        ]
      });
      if (!order) {
        console.warn(`[Razorpay Webhook Warning] No order found for Razorpay order ID ${rzpOrderId}.`);
        res.status(200).json({ success: true, message: "Order not found, ignored." });
        return;
      }
      const expectedAmount = Math.round(order.total * 100);
      if (paymentEntity?.amount !== expectedAmount || paymentEntity?.currency !== "INR") {
        console.error(
          `[Razorpay Security Alert] Webhook amount mismatch for order ${order.orderNumber}. Expected: ${expectedAmount} INR, Received: ${paymentEntity?.amount} ${paymentEntity?.currency}`
        );
        res.status(400).json({
          success: false,
          message: "Payment amount or currency mismatch."
        });
        return;
      }
      if (order.orderStatus === "cancelled") {
        console.warn(
          `[Razorpay Webhook Warning] Received captured payment for cancelled order ${order.orderNumber}. Merchant review required.`
        );
        if (eventId) {
          await Order.updateOne({ _id: order._id }, { $addToSet: { processedWebhookEvents: eventId } });
        }
        res.status(200).json({ success: true, message: "Order was previously cancelled." });
        return;
      }
      if (paymentId) {
        const duplicatePayment = await Order.findOne({
          _id: { $ne: order._id },
          "paymentDetails.razorpayPaymentId": paymentId
        }).lean();
        if (duplicatePayment) {
          console.warn(
            `[Razorpay Security Alert] Webhook replay attack: paymentId ${paymentId} already credited to order ${duplicatePayment.orderNumber}`
          );
          res.status(400).json({
            success: false,
            message: "Payment ID has already been credited to another order."
          });
          return;
        }
      }
      let updated;
      try {
        updated = await Order.findOneAndUpdate(
          {
            _id: order._id,
            paymentStatus: { $ne: "paid" },
            orderStatus: { $ne: "cancelled" }
          },
          {
            $set: {
              paymentStatus: "paid",
              orderStatus: "confirmed",
              "paymentDetails.gateway": "razorpay",
              "paymentDetails.transactionId": paymentId,
              "paymentDetails.razorpayPaymentId": paymentId,
              "paymentDetails.webhookEventId": eventId,
              "paymentDetails.paidAt": /* @__PURE__ */ new Date()
            },
            ...eventId ? { $addToSet: { processedWebhookEvents: eventId } } : {}
          },
          { new: true }
        );
      } catch (err) {
        if (err?.code === 11e3 || err?.name === "MongoServerError" && err?.code === 11e3) {
          console.warn(
            `[Razorpay Security Alert] Duplicate key conflict in webhook: paymentId ${paymentId} already credited to another order`
          );
          res.status(400).json({
            success: false,
            message: "Payment ID has already been credited to another order."
          });
          return;
        }
        throw err;
      }
      if (updated) {
        dispatchOrderConfirmationEmails(updated);
      } else if (eventId) {
        await Order.updateOne({ _id: order._id }, { $addToSet: { processedWebhookEvents: eventId } });
      }
      res.json({ success: true, message: "Payment recorded successfully." });
      return;
    }
    if (event === "payment.failed") {
      const paymentEntity = req.body?.payload?.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id;
      const failureReason = paymentEntity?.error_description || paymentEntity?.error_code || "Payment failed";
      if (rzpOrderId || paymentEntity?.notes?.orderId) {
        const order = await Order.findOne({
          $or: [
            ...rzpOrderId ? [{ "paymentDetails.razorpayOrderId": rzpOrderId }] : [],
            ...paymentEntity?.notes?.orderId && mongoose20.Types.ObjectId.isValid(paymentEntity.notes.orderId) ? [{ _id: paymentEntity.notes.orderId }] : []
          ]
        });
        if (order && order.paymentStatus !== "paid" && order.orderStatus !== "cancelled") {
          await Order.updateOne(
            { _id: order._id },
            {
              $set: { "paymentDetails.failureReason": failureReason },
              ...eventId ? { $addToSet: { processedWebhookEvents: eventId } } : {}
            }
          );
        }
      }
      res.json({ success: true, message: "Payment failure recorded." });
      return;
    }
    res.json({ success: true, message: `Event ${event} acknowledged.` });
  } catch (err) {
    console.error("[Razorpay Webhook Error]:", err);
    res.status(500).json({ success: false, message: "Webhook processing error." });
  }
}
router6.post("/webhook/razorpay", handleRazorpayWebhook);
router6.post("/webhook", handleRazorpayWebhook);
async function handleRetryPayment(req, res) {
  try {
    const { orderId } = req.params;
    if (!mongoose20.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ success: false, message: "Invalid order ID format." });
      return;
    }
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found." });
      return;
    }
    const isOwner = order.customer?.toString() === req.user?.userId || req.user?.role === "admin" || req.user?.role === "super_admin";
    if (!isOwner) {
      res.status(403).json({ success: false, message: "Not authorized." });
      return;
    }
    if (order.paymentStatus === "paid") {
      res.status(400).json({ success: false, message: "This order is already paid." });
      return;
    }
    if (order.orderStatus === "cancelled") {
      res.status(400).json({ success: false, message: "Cannot retry payment for a cancelled order." });
      return;
    }
    if (order.total <= 0) {
      res.status(400).json({ success: false, message: "Order total is zero; no payment required." });
      return;
    }
    const rzpRes = await createRazorpayOrder({
      amount: Math.round(order.total * 100),
      currency: "INR",
      receipt: order.orderNumber,
      notes: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        customerEmail: order.customerInfo.email
      }
    });
    if (!rzpRes.success || !rzpRes.data) {
      res.status(502).json({
        success: false,
        message: rzpRes.error || "Failed to initialize payment gateway retry."
      });
      return;
    }
    order.paymentDetails = {
      ...order.paymentDetails || {},
      gateway: "razorpay",
      razorpayOrderId: rzpRes.data.id
    };
    if (order.paymentMethod === "cod") {
      order.paymentMethod = "online";
    }
    await order.save();
    res.json({
      success: true,
      message: "Payment retry initialized.",
      razorpay: {
        keyId: getPublicRazorpayKeyId(),
        orderId: rzpRes.data.id,
        amount: rzpRes.data.amount,
        currency: rzpRes.data.currency,
        name: "Malwa Namkeen House",
        description: `Order #${order.orderNumber}`,
        prefill: {
          name: order.customerInfo.name,
          email: order.customerInfo.email,
          contact: order.customerInfo.phone
        }
      }
    });
  } catch (err) {
    console.error("[Retry Payment Error]:", err);
    res.status(500).json({ success: false, message: "Failed to retry payment." });
  }
}
router6.post("/:orderId/retry-payment", requireAuth, handleRetryPayment);
async function handleCancelUnpaid(req, res) {
  try {
    const { orderId } = req.params;
    if (!mongoose20.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ success: false, message: "Invalid order ID format." });
      return;
    }
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found." });
      return;
    }
    const isOwner = order.customer?.toString() === req.user?.userId || req.user?.role === "admin" || req.user?.role === "super_admin";
    if (!isOwner) {
      res.status(403).json({ success: false, message: "Not authorized." });
      return;
    }
    if (order.paymentStatus === "paid") {
      res.status(400).json({
        success: false,
        message: "Paid orders cannot be cancelled through this endpoint."
      });
      return;
    }
    if (order.orderStatus === "cancelled") {
      res.json({
        success: true,
        message: "Order was already cancelled and inventory restored.",
        order
      });
      return;
    }
    const result = await cancelAndRestockOrder(order._id, {
      cancelledBy: "customer",
      reason: req.body?.reason || "Customer cancelled unpaid checkout",
      allowedCurrentStatuses: ["pending"]
    });
    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.message
      });
      return;
    }
    res.json({
      success: true,
      message: "Unpaid order cancelled and reserved inventory restored to stock.",
      order: result.order
    });
  } catch (err) {
    console.error("[Cancel Unpaid Order Error]:", err);
    res.status(500).json({ success: false, message: "Failed to cancel unpaid order." });
  }
}
router6.post("/:orderId/cancel-unpaid", requireAuth, handleCancelUnpaid);
router6.post("/:orderId/cancel", requireAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason = "Cancelled by customer" } = req.body || {};
    const query = mongoose20.Types.ObjectId.isValid(orderId) ? { _id: orderId } : { orderNumber: orderId };
    const order = await Order.findOne(query);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found." });
      return;
    }
    const isOwner = order.customer && order.customer.toString() === req.user?.userId || !order.customer && order.customerInfo?.email && req.user?.email && order.customerInfo.email.toLowerCase() === req.user.email.toLowerCase() || req.user?.role === "admin" || req.user?.role === "super_admin";
    if (!isOwner) {
      res.status(403).json({ success: false, message: "You do not have permission to cancel this order." });
      return;
    }
    if (order.orderStatus === "cancelled" || order.inventoryRestored) {
      res.json({
        success: true,
        alreadyCancelled: true,
        message: "This order is already cancelled.",
        order
      });
      return;
    }
    if (order.orderStatus !== "pending") {
      res.status(400).json({
        success: false,
        message: `Orders that are already in "${order.orderStatus}" status cannot be cancelled online. Please contact support.`,
        order
      });
      return;
    }
    if (order.shipmentStatus && order.shipmentStatus !== "unfulfilled") {
      res.status(400).json({
        success: false,
        message: "This order has already been prepared or dispatched for shipping and cannot be cancelled.",
        order
      });
      return;
    }
    const cancelResult = await cancelAndRestockOrder(order._id, {
      cancelledBy: "customer",
      reason: typeof reason === "string" && reason.trim() ? reason.trim() : "Cancelled by customer",
      allowedCurrentStatuses: ["pending"]
    });
    if (!cancelResult.success && !cancelResult.alreadyCancelled) {
      res.status(400).json({
        success: false,
        message: cancelResult.message || "Failed to cancel order.",
        warnings: cancelResult.warnings
      });
      return;
    }
    res.json({
      success: true,
      alreadyCancelled: Boolean(cancelResult.alreadyCancelled),
      message: cancelResult.alreadyCancelled ? "This order is already cancelled." : "Your order has been cancelled successfully. Any reserved items have been returned to stock.",
      order: cancelResult.order || order
    });
  } catch (err) {
    console.error("[Customer Order Cancel Error]:", err);
    res.status(500).json({ success: false, message: "Failed to cancel order." });
  }
});
router6.get("/:orderId/track", async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId || typeof orderId !== "string" || !orderId.trim()) {
      res.status(400).json({ success: false, message: "Order identifier is required." });
      return;
    }
    const cleanId = orderId.trim();
    const query = mongoose20.Types.ObjectId.isValid(cleanId) ? { $or: [{ _id: cleanId }, { orderNumber: cleanId }] } : { orderNumber: cleanId };
    const order = await Order.findOne(query);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found." });
      return;
    }
    let authorized = false;
    const token = extractToken(req);
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        if (payload.role === "admin" || payload.role === "super_admin" || order.customer && order.customer.toString() === payload.userId || order.customerInfo?.email && order.customerInfo.email.toLowerCase() === payload.email.toLowerCase()) {
          authorized = true;
        }
      }
    }
    if (!authorized) {
      const reqEmail = String(req.query.email || "").trim().toLowerCase();
      const reqPhone = String(req.query.phone || "").trim();
      const orderEmail = (order.customerInfo?.email || "").trim().toLowerCase();
      const orderPhone = (order.customerInfo?.phone || "").trim();
      const shippingPhone = (order.shippingAddress?.phone || "").trim();
      if (reqEmail && reqEmail === orderEmail || reqPhone && (reqPhone === orderPhone || reqPhone === shippingPhone)) {
        authorized = true;
      }
    }
    if (!authorized) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to view tracking for this order. Please sign in or provide the order email/phone."
      });
      return;
    }
    const awbCode = order.shiprocketDetails?.awbCode || order.trackingInfo?.trackingNumber;
    if (!awbCode) {
      res.json({
        success: true,
        hasTracking: false,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        shipmentStatus: order.shipmentStatus || "unfulfilled",
        message: "Tracking information is not yet available for this order. Tracking will appear once dispatched."
      });
      return;
    }
    res.json({
      success: true,
      hasTracking: true,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      shipmentStatus: order.shipmentStatus,
      courierName: order.trackingInfo?.courierName || order.shiprocketDetails?.courierName || "Shiprocket Partner",
      trackingNumber: awbCode,
      trackingUrl: order.trackingInfo?.trackingUrl || `https://shiprocket.co/tracking/${encodeURIComponent(awbCode)}`,
      lastEvent: order.shiprocketDetails?.lastEvent,
      lastEventDate: order.shiprocketDetails?.lastEventDate,
      syncedAt: order.shiprocketDetails?.syncedAt
    });
  } catch (err) {
    console.error("[Customer Order Track Error]:", err);
    res.status(500).json({ success: false, message: "Failed to retrieve order tracking." });
  }
});
var customerOrders_default = router6;

// server/routes/adminProducts.ts
import { Router as Router7 } from "express";
import mongoose21 from "mongoose";
var router7 = Router7();
router7.use(requireAdmin);
async function enforceMaxBestSellers(currentProductId) {
  try {
    const filter = { isBestSeller: true };
    if (currentProductId) {
      filter._id = { $ne: currentProductId };
    }
    const existingBestSellers = await Product.find(filter).sort({ bestSellerAt: -1, updatedAt: -1, createdAt: -1 });
    if (existingBestSellers.length >= 4) {
      const toDemote = existingBestSellers.slice(3);
      if (toDemote.length > 0) {
        const demoteIds = toDemote.map((p) => p._id);
        await Product.updateMany(
          { _id: { $in: demoteIds } },
          { $set: { isBestSeller: false } }
        );
      }
    }
  } catch (err) {
    console.warn("[BestSellers] Warning while enforcing max 4:", err);
  }
}
async function ensureInitialSeed() {
  const catCount = await Category.countDocuments();
  if (catCount === 0) {
    const categoriesToSeed = SHOP_CATEGORIES.filter((c) => c.id !== "all").map((c, i) => ({
      name: c.label,
      slug: c.id,
      description: c.description,
      active: true,
      sortOrder: i
    }));
    await Category.insertMany(categoriesToSeed);
  }
  const prodCount = await Product.countDocuments();
  if (prodCount === 0) {
    const allCats = await Category.find();
    const catMap = new Map(allCats.map((c) => [c.slug, c._id]));
    const productsToSeed = PRODUCTS.map((p, idx) => {
      const catId = catMap.get(p.category) || allCats[0]._id;
      return {
        name: p.name,
        slug: p.slug || p.id,
        hindiName: p.hindiName || "",
        tagline: p.tagline || "",
        description: p.description,
        story: p.story || "",
        ingredients: p.ingredients || [],
        spiceLevel: p.spiceLevel || "Medium",
        shelfLife: p.shelfLife || "90 Days",
        oilUsed: p.oilUsed || "Pure Groundnut Oil",
        isVegetarian: p.isVegetarian ?? true,
        category: catId,
        images: [p.image],
        badge: p.badge || (idx < 4 ? "Best Seller" : ""),
        featured: idx < 4,
        isBestSeller: idx < 4,
        bestSellerAt: idx < 4 ? new Date(Date.now() - idx * 1e3) : null,
        isCombo: p.isCombo ?? false,
        active: p.isAvailable ?? true,
        rating: p.rating || 4.9,
        reviewCount: p.reviewCount || 42,
        variants: p.options.map((opt, vIdx) => ({
          label: opt.weight,
          value: parseFloat(opt.weight) || 250,
          unit: opt.weight.replace(/^[0-9.]+/, "").trim() || "g",
          price: opt.price,
          salePrice: opt.originalPrice && opt.originalPrice > opt.price ? opt.price : void 0,
          stock: 50,
          sku: `MLW-${p.id.slice(0, 4).toUpperCase()}-${opt.weight.replace(/\s+/g, "").toUpperCase()}`,
          active: true,
          sortOrder: vIdx
        }))
      };
    });
    if (productsToSeed.length > 0) {
      await Product.insertMany(productsToSeed);
    }
  }
}
router7.get("/categories/list", async (_req, res) => {
  try {
    await ensureInitialSeed();
    const categories = await Category.find({ active: true }).sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, categories });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, message: msg });
  }
});
router7.get("/", async (req, res) => {
  try {
    await ensureInitialSeed();
    const {
      search = "",
      category = "",
      status = "all",
      sortBy = "newest",
      page = "1",
      limit = "50"
    } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;
    const filter = {};
    if (search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { hindiName: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { "variants.sku": { $regex: q, $options: "i" } },
        { "variants.label": { $regex: q, $options: "i" } }
      ];
    }
    if (category && category !== "all") {
      if (mongoose21.Types.ObjectId.isValid(category)) {
        filter.category = new mongoose21.Types.ObjectId(category);
      } else {
        const cat = await Category.findOne({ slug: category });
        if (cat) filter.category = cat._id;
      }
    }
    if (status === "active") {
      filter.active = true;
    } else if (status === "inactive") {
      filter.active = false;
    }
    let sortObj = { createdAt: -1 };
    if (sortBy === "name") {
      sortObj = { name: 1 };
    } else if (sortBy === "priceAsc") {
      sortObj = { "variants.0.price": 1 };
    } else if (sortBy === "priceDesc") {
      sortObj = { "variants.0.price": -1 };
    } else if (sortBy === "rating") {
      sortObj = { rating: -1 };
    }
    const [total, products] = await Promise.all([
      Product.countDocuments(filter).maxTimeMS(5e3),
      Product.find(filter).populate("category", "name slug").sort(sortObj).skip(skip).limit(limitNum).maxTimeMS(5e3).lean()
    ]);
    res.json({
      success: true,
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (err) {
    console.error("[Admin Products List Error]", err);
    res.status(500).json({ success: false, message: "Failed to retrieve products." });
  }
});
router7.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose21.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid product ID format." });
      return;
    }
    const product = await Product.findById(id).populate("category");
    if (!product) {
      res.status(404).json({ success: false, message: "Product not found." });
      return;
    }
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to retrieve product details." });
  }
});
function slugify(text) {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
async function generateUniqueAutoSlug(name2) {
  const base = slugify(name2) || "delicacy";
  let candidate = base;
  let counter = 1;
  while (await Product.exists({ slug: candidate })) {
    counter += 1;
    candidate = `${base}-${counter}`;
  }
  return candidate;
}
router7.post("/", async (req, res) => {
  try {
    const {
      name: name2,
      slug,
      hindiName,
      tagline,
      description,
      story,
      ingredients,
      spiceLevel,
      shelfLife,
      oilUsed,
      dietaryStandard,
      packagingType,
      customSpecifications = [],
      isVegetarian = true,
      category,
      images = [],
      variants = [],
      featured = false,
      isBestSeller = false,
      isCombo = false,
      active = true,
      badge = "",
      rating = 5,
      reviewCount = 0
    } = req.body;
    if (isBestSeller) {
      await enforceMaxBestSellers();
    }
    if (!name2 || typeof name2 !== "string" || name2.trim().length < 2) {
      res.status(400).json({ success: false, message: "Product name is required (min 2 characters)." });
      return;
    }
    if (!description || typeof description !== "string" || description.trim().length < 2) {
      res.status(400).json({ success: false, message: "Product description is required." });
      return;
    }
    if (!category) {
      res.status(400).json({ success: false, message: "Please select a product category." });
      return;
    }
    let categoryId = category;
    if (!mongoose21.Types.ObjectId.isValid(category)) {
      const cat = await Category.findOne({ slug: category });
      if (!cat) {
        res.status(400).json({ success: false, message: "Invalid category specified." });
        return;
      }
      categoryId = cat._id;
    }
    let resolvedVariants = variants;
    if ((!Array.isArray(resolvedVariants) || resolvedVariants.length === 0) && (typeof req.body.price !== "undefined" || typeof req.body.stock !== "undefined")) {
      const p = Number(req.body.price) || 0;
      const s = typeof req.body.stock !== "undefined" ? Number(req.body.stock) : 50;
      resolvedVariants = [{
        label: "Standard Pack (250g)",
        value: 250,
        unit: "g",
        price: p,
        salePrice: req.body.salePrice ? Number(req.body.salePrice) : void 0,
        stock: Math.max(0, s),
        sku: `MLW-${(name2 || "PRD").slice(0, 3).toUpperCase()}-250G`,
        active: true,
        sortOrder: 0
      }];
    }
    if (!Array.isArray(resolvedVariants) || resolvedVariants.length === 0) {
      res.status(400).json({ success: false, message: "At least one product variant (pricing and packaging) is required." });
      return;
    }
    const cleanedVariants = resolvedVariants.map((v, idx) => {
      const label = String(v.label || "").trim();
      const price = Number(v.price);
      const stock = parseInt(String(v.stock ?? 0), 10) || 0;
      const sku = String(v.sku || "").trim().toUpperCase() || `MLW-${Date.now().toString(36).toUpperCase()}-${idx + 1}`;
      if (!label) {
        throw new Error(`Variant #${idx + 1} is missing a packaging/weight label.`);
      }
      if (isNaN(price) || price < 0) {
        throw new Error(`Variant "${label}" has an invalid price.`);
      }
      return {
        label,
        value: v.value ? Number(v.value) : void 0,
        unit: v.unit ? String(v.unit).trim() : void 0,
        price,
        salePrice: v.salePrice && Number(v.salePrice) > 0 ? Number(v.salePrice) : void 0,
        stock: Math.max(0, stock),
        sku,
        active: v.active !== false,
        sortOrder: typeof v.sortOrder === "number" ? v.sortOrder : idx
      };
    });
    const hasCustomSlug = Boolean(slug && typeof slug === "string" && slug.trim());
    let productSlug;
    if (hasCustomSlug) {
      const cleanCustom = slugify(slug);
      if (!cleanCustom) {
        res.status(400).json({ success: false, message: "Invalid slug format provided." });
        return;
      }
      const exists = await Product.exists({ slug: cleanCustom });
      if (exists) {
        res.status(409).json({ success: false, message: "Slug is already in use." });
        return;
      }
      productSlug = cleanCustom;
    } else {
      productSlug = await generateUniqueAutoSlug(name2);
    }
    const cleanedSpecs = Array.isArray(customSpecifications) ? customSpecifications.filter((s) => s && typeof s.label === "string" && s.label.trim() && typeof s.value === "string" && s.value.trim()).map((s) => ({ label: s.label.trim(), value: s.value.trim() })) : [];
    if (isBestSeller) {
      await enforceMaxBestSellers();
    }
    const newProduct = await Product.create({
      name: name2.trim(),
      slug: productSlug,
      hindiName: hindiName ? String(hindiName).trim() : "",
      tagline: tagline ? String(tagline).trim() : "",
      description: description.trim(),
      story: story ? String(story).trim() : "",
      ingredients: Array.isArray(ingredients) ? ingredients.map((i) => String(i).trim()).filter(Boolean) : typeof ingredients === "string" ? ingredients.split(",").map((i) => i.trim()).filter(Boolean) : [],
      spiceLevel: spiceLevel || "Medium",
      shelfLife: shelfLife ? String(shelfLife).trim() : "90 Days",
      oilUsed: oilUsed ? String(oilUsed).trim() : "Pure Groundnut Oil",
      dietaryStandard: dietaryStandard ? String(dietaryStandard).trim() : "100% Pure Vegetarian (Satvik)",
      packagingType: packagingType ? String(packagingType).trim() : "Food-Grade Multi-Layer Aroma Seal",
      customSpecifications: cleanedSpecs,
      isVegetarian: Boolean(isVegetarian),
      category: categoryId,
      images: Array.isArray(images) ? images.filter(Boolean) : [],
      variants: cleanedVariants,
      featured: Boolean(featured),
      isBestSeller: Boolean(isBestSeller),
      bestSellerAt: isBestSeller ? /* @__PURE__ */ new Date() : null,
      isCombo: Boolean(isCombo),
      active: Boolean(active),
      badge: badge ? String(badge).trim() : isBestSeller ? "Best Seller" : "",
      rating: typeof rating === "number" ? rating : 5,
      reviewCount: typeof reviewCount === "number" ? reviewCount : 0
    });
    const populated = await Product.findById(newProduct._id).populate("category", "name slug");
    res.status(201).json({
      success: true,
      message: "Product created successfully.",
      product: populated
    });
  } catch (err) {
    if (err?.code === 11e3 || err?.name === "MongoServerError") {
      res.status(409).json({ success: false, message: "Slug is already in use." });
      return;
    }
    console.error("[Create Product Error]", err);
    const msg = err instanceof Error ? err.message : "Failed to create product.";
    res.status(400).json({ success: false, message: msg });
  }
});
router7.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose21.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid product ID format." });
      return;
    }
    const {
      name: name2,
      slug,
      hindiName,
      tagline,
      description,
      story,
      ingredients,
      spiceLevel,
      shelfLife,
      oilUsed,
      dietaryStandard,
      packagingType,
      customSpecifications,
      isVegetarian,
      category,
      images,
      variants,
      featured,
      isBestSeller,
      isCombo,
      active,
      badge,
      rating,
      reviewCount
    } = req.body;
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      res.status(404).json({ success: false, message: "Product not found." });
      return;
    }
    if (name2) existingProduct.name = String(name2).trim();
    if (slug !== void 0 && typeof slug === "string" && slug.trim()) {
      const cleanSlug = slugify(slug);
      if (!cleanSlug) {
        res.status(400).json({ success: false, message: "Invalid slug format provided." });
        return;
      }
      if (cleanSlug !== existingProduct.slug) {
        const duplicate = await Product.exists({ slug: cleanSlug, _id: { $ne: existingProduct._id } });
        if (duplicate) {
          res.status(409).json({ success: false, message: "Slug is already in use." });
          return;
        }
        existingProduct.slug = cleanSlug;
      }
    }
    if (hindiName !== void 0) existingProduct.hindiName = String(hindiName).trim();
    if (tagline !== void 0) existingProduct.tagline = String(tagline).trim();
    if (description) existingProduct.description = String(description).trim();
    if (story !== void 0) existingProduct.story = String(story).trim();
    if (spiceLevel) existingProduct.spiceLevel = spiceLevel;
    if (shelfLife !== void 0) existingProduct.shelfLife = String(shelfLife).trim();
    if (oilUsed !== void 0) existingProduct.oilUsed = String(oilUsed).trim();
    if (dietaryStandard !== void 0) existingProduct.dietaryStandard = String(dietaryStandard).trim();
    if (packagingType !== void 0) existingProduct.packagingType = String(packagingType).trim();
    if (isVegetarian !== void 0) existingProduct.isVegetarian = Boolean(isVegetarian);
    if (featured !== void 0) existingProduct.featured = Boolean(featured);
    if (isCombo !== void 0) existingProduct.isCombo = Boolean(isCombo);
    if (active !== void 0) existingProduct.active = Boolean(active);
    if (badge !== void 0) existingProduct.badge = String(badge).trim();
    if (rating !== void 0 && !isNaN(Number(rating))) existingProduct.rating = Number(rating);
    if (reviewCount !== void 0 && !isNaN(Number(reviewCount))) existingProduct.reviewCount = Number(reviewCount);
    if (Array.isArray(customSpecifications)) {
      existingProduct.customSpecifications = customSpecifications.filter((s) => s && typeof s.label === "string" && s.label.trim() && typeof s.value === "string" && s.value.trim()).map((s) => ({ label: s.label.trim(), value: s.value.trim() }));
    }
    if (isBestSeller !== void 0) {
      const willBeBestSeller = Boolean(isBestSeller);
      if (willBeBestSeller && !existingProduct.isBestSeller) {
        await enforceMaxBestSellers(existingProduct._id);
        existingProduct.isBestSeller = true;
        existingProduct.bestSellerAt = /* @__PURE__ */ new Date();
      } else if (!willBeBestSeller) {
        existingProduct.isBestSeller = false;
        existingProduct.bestSellerAt = void 0;
      }
    }
    if (category) {
      if (mongoose21.Types.ObjectId.isValid(category)) {
        existingProduct.category = new mongoose21.Types.ObjectId(category);
      } else {
        const cat = await Category.findOne({ slug: category });
        if (cat) existingProduct.category = cat._id;
      }
    }
    if (Array.isArray(ingredients)) {
      existingProduct.ingredients = ingredients.map((i) => String(i).trim()).filter(Boolean);
    } else if (typeof ingredients === "string") {
      existingProduct.ingredients = ingredients.split(",").map((i) => i.trim()).filter(Boolean);
    }
    if (Array.isArray(images)) {
      existingProduct.images = images.filter(Boolean);
    }
    if (Array.isArray(variants) && variants.length > 0) {
      existingProduct.variants = variants.map((v, idx) => {
        const label = String(v.label || "").trim();
        const price = Number(v.price);
        const stock = parseInt(String(v.stock ?? 0), 10) || 0;
        const sku = String(v.sku || "").trim().toUpperCase() || `MLW-VAR-${idx + 1}`;
        if (!label) throw new Error(`Variant #${idx + 1} is missing a label.`);
        if (isNaN(price) || price < 0) throw new Error(`Variant "${label}" has an invalid price.`);
        return {
          label,
          value: v.value ? Number(v.value) : void 0,
          unit: v.unit ? String(v.unit).trim() : void 0,
          price,
          salePrice: v.salePrice && Number(v.salePrice) > 0 ? Number(v.salePrice) : void 0,
          stock: Math.max(0, stock),
          sku,
          active: v.active !== false,
          sortOrder: typeof v.sortOrder === "number" ? v.sortOrder : idx
        };
      });
    } else if (typeof req.body.price !== "undefined" || typeof req.body.stock !== "undefined") {
      const p = Number(req.body.price);
      const s = typeof req.body.stock !== "undefined" ? Number(req.body.stock) : void 0;
      if (existingProduct.variants && existingProduct.variants.length > 0) {
        if (!isNaN(p)) existingProduct.variants[0].price = p;
        if (s !== void 0 && !isNaN(s)) existingProduct.variants[0].stock = Math.max(0, s);
      } else {
        existingProduct.variants = [{
          label: "Standard Pack (250g)",
          value: 250,
          unit: "g",
          price: !isNaN(p) ? p : 199,
          stock: s !== void 0 && !isNaN(s) ? Math.max(0, s) : 50,
          sku: `MLW-${(existingProduct.name || "PRD").slice(0, 3).toUpperCase()}-250G`,
          active: true,
          sortOrder: 0
        }];
      }
    }
    await existingProduct.save();
    const updated = await Product.findById(id).populate("category", "name slug");
    res.json({
      success: true,
      message: "Product updated successfully.",
      product: updated
    });
  } catch (err) {
    if (err?.code === 11e3 || err?.name === "MongoServerError") {
      res.status(409).json({ success: false, message: "Slug is already in use." });
      return;
    }
    console.error("[Update Product Error]", err);
    const msg = err instanceof Error ? err.message : "Failed to update product.";
    res.status(400).json({ success: false, message: msg });
  }
});
router7.patch("/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose21.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid product ID." });
      return;
    }
    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ success: false, message: "Product not found." });
      return;
    }
    product.active = !product.active;
    await product.save();
    res.json({
      success: true,
      message: `Product is now ${product.active ? "Active" : "Inactive"}.`,
      active: product.active
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to toggle product status." });
  }
});
router7.patch("/:id/toggle-bestseller", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose21.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid product ID." });
      return;
    }
    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ success: false, message: "Product not found." });
      return;
    }
    const nextState = !product.isBestSeller;
    if (nextState) {
      await enforceMaxBestSellers(product._id);
      product.isBestSeller = true;
      product.bestSellerAt = /* @__PURE__ */ new Date();
      if (!product.badge) product.badge = "Best Seller";
    } else {
      product.isBestSeller = false;
      product.bestSellerAt = void 0;
      if (product.badge === "Best Seller") product.badge = "";
    }
    await product.save();
    res.json({
      success: true,
      message: `Product is ${product.isBestSeller ? "now marked as Best Seller" : "removed from Best Sellers"}.`,
      isBestSeller: product.isBestSeller,
      product
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to toggle best seller status." });
  }
});
router7.patch("/:id/toggle-combo", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose21.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid product ID." });
      return;
    }
    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ success: false, message: "Product not found." });
      return;
    }
    product.isCombo = !product.isCombo;
    await product.save();
    res.json({
      success: true,
      message: `Product is ${product.isCombo ? "now marked as Combo Delicacy" : "no longer marked as Combo"}.`,
      isCombo: product.isCombo,
      product
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to toggle combo status." });
  }
});
router7.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose21.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid product ID." });
      return;
    }
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      res.status(404).json({ success: false, message: "Product not found." });
      return;
    }
    res.json({
      success: true,
      message: "Product removed successfully."
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete product." });
  }
});
var adminProducts_default = router7;

// server/routes/adminCategories.ts
import { Router as Router8 } from "express";
import mongoose22 from "mongoose";
var router8 = Router8();
router8.use(requireAdmin);
async function ensureCategoriesSeeded() {
  const count = await Category.countDocuments();
  if (count === 0) {
    const toSeed = SHOP_CATEGORIES.filter((c) => c.id !== "all").map((c, i) => ({
      name: c.label,
      slug: c.id,
      description: c.description,
      image: "",
      active: true,
      sortOrder: i
    }));
    await Category.insertMany(toSeed);
  }
}
function generateSlug(name2) {
  return name2.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
router8.get("/", async (req, res) => {
  try {
    await ensureCategoriesSeeded();
    const { search = "", status = "all", sortBy = "sortOrder" } = req.query;
    const filter = {};
    if (search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { slug: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } }
      ];
    }
    if (status === "active") {
      filter.active = true;
    } else if (status === "inactive") {
      filter.active = false;
    }
    let sortObj = { sortOrder: 1, name: 1 };
    if (sortBy === "name") {
      sortObj = { name: 1 };
    } else if (sortBy === "newest") {
      sortObj = { createdAt: -1 };
    }
    const categories = await Category.find(filter).sort(sortObj).lean();
    const productCounts = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);
    const countMap = new Map(productCounts.map((item) => [String(item._id), item.count]));
    const categoriesWithCount = categories.map((cat) => ({
      ...cat,
      productCount: countMap.get(String(cat._id)) || 0
    }));
    res.json({
      success: true,
      categories: categoriesWithCount,
      total: categories.length
    });
  } catch (err) {
    console.error("[Admin Categories List Error]", err);
    res.status(500).json({ success: false, message: "Failed to retrieve categories." });
  }
});
router8.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose22.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid category ID format." });
      return;
    }
    const category = await Category.findById(id).lean();
    if (!category) {
      res.status(404).json({ success: false, message: "Category not found." });
      return;
    }
    const productCount = await Product.countDocuments({ category: id });
    res.json({
      success: true,
      category: {
        ...category,
        productCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to retrieve category." });
  }
});
router8.post("/", async (req, res) => {
  try {
    const { name: name2, slug, description, image, active = true, sortOrder = 0 } = req.body;
    if (!name2 || typeof name2 !== "string" || name2.trim().length < 2) {
      res.status(400).json({ success: false, message: "Category name is required (minimum 2 characters)." });
      return;
    }
    const cleanName = name2.trim();
    let finalSlug = slug && typeof slug === "string" && slug.trim() ? generateSlug(slug) : generateSlug(cleanName);
    if (!finalSlug) {
      finalSlug = `cat-${Date.now().toString(36)}`;
    }
    const existing = await Category.findOne({ slug: finalSlug });
    if (existing) {
      res.status(409).json({
        success: false,
        message: `Category with slug "${finalSlug}" already exists. Please choose a different slug or name.`
      });
      return;
    }
    const newCategory = await Category.create({
      name: cleanName,
      slug: finalSlug,
      description: description ? String(description).trim() : "",
      image: image ? String(image).trim() : "",
      active: Boolean(active),
      sortOrder: Number(sortOrder) || 0
    });
    res.status(201).json({
      success: true,
      message: "Category created successfully.",
      category: newCategory
    });
  } catch (err) {
    console.error("[Create Category Error]", err);
    const msg = err instanceof Error ? err.message : "Failed to create category.";
    res.status(400).json({ success: false, message: msg });
  }
});
router8.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose22.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid category ID format." });
      return;
    }
    const { name: name2, slug, description, image, active, sortOrder } = req.body;
    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({ success: false, message: "Category not found." });
      return;
    }
    if (name2) {
      category.name = String(name2).trim();
    }
    if (slug) {
      const cleanSlug = generateSlug(String(slug));
      if (cleanSlug && cleanSlug !== category.slug) {
        const existing = await Category.findOne({ slug: cleanSlug, _id: { $ne: id } });
        if (existing) {
          res.status(409).json({ success: false, message: `Slug "${cleanSlug}" is already in use by another category.` });
          return;
        }
        category.slug = cleanSlug;
      }
    }
    if (description !== void 0) category.description = String(description).trim();
    if (image !== void 0) category.image = String(image).trim();
    if (active !== void 0) category.active = Boolean(active);
    if (sortOrder !== void 0) category.sortOrder = Number(sortOrder) || 0;
    await category.save();
    res.json({
      success: true,
      message: "Category updated successfully.",
      category
    });
  } catch (err) {
    console.error("[Update Category Error]", err);
    const msg = err instanceof Error ? err.message : "Failed to update category.";
    res.status(400).json({ success: false, message: msg });
  }
});
router8.patch("/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose22.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid category ID." });
      return;
    }
    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({ success: false, message: "Category not found." });
      return;
    }
    category.active = !category.active;
    await category.save();
    res.json({
      success: true,
      message: `Category is now ${category.active ? "Active" : "Inactive"}.`,
      active: category.active
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to toggle category status." });
  }
});
router8.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose22.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid category ID format." });
      return;
    }
    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({ success: false, message: "Category not found." });
      return;
    }
    const referencingProductsCount = await Product.countDocuments({
      $or: [
        { category: id },
        { category: category._id }
      ]
    });
    if (referencingProductsCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete category "${category.name}" because ${referencingProductsCount} product(s) are currently assigned to it. Please reassign or delete those products first.`,
        productCount: referencingProductsCount
      });
      return;
    }
    await Category.findByIdAndDelete(id);
    res.json({
      success: true,
      message: `Category "${category.name}" deleted successfully.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete category." });
  }
});
var adminCategories_default = router8;

// server/routes/adminOrders.ts
import { Router as Router9 } from "express";
import mongoose23 from "mongoose";
var router9 = Router9();
router9.use(requireAdmin);
router9.get("/", async (req, res) => {
  try {
    const {
      search = "",
      orderStatus = "all",
      paymentStatus = "all",
      shipmentStatus = "all",
      sortBy = "newest",
      page = "1",
      limit = "25"
    } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;
    const filter = {};
    if (search.trim()) {
      const q = search.trim();
      filter.$or = [
        { orderNumber: { $regex: q, $options: "i" } },
        { "customerInfo.name": { $regex: q, $options: "i" } },
        { "customerInfo.email": { $regex: q, $options: "i" } },
        { "customerInfo.phone": { $regex: q, $options: "i" } },
        { "shippingAddress.city": { $regex: q, $options: "i" } },
        { "items.productName": { $regex: q, $options: "i" } },
        { "items.sku": { $regex: q, $options: "i" } }
      ];
    }
    if (orderStatus && orderStatus !== "all") {
      filter.orderStatus = orderStatus;
    }
    if (paymentStatus && paymentStatus !== "all") {
      filter.paymentStatus = paymentStatus;
    }
    if (shipmentStatus && shipmentStatus !== "all") {
      filter.shipmentStatus = shipmentStatus;
    }
    let sortObj = { createdAt: -1 };
    if (sortBy === "oldest") {
      sortObj = { createdAt: 1 };
    } else if (sortBy === "totalHigh") {
      sortObj = { total: -1 };
    } else if (sortBy === "totalLow") {
      sortObj = { total: 1 };
    }
    const [total, orders, statsAggregation] = await Promise.all([
      Order.countDocuments(filter).maxTimeMS(5e3),
      Order.find(filter).sort(sortObj).skip(skip).limit(limitNum).maxTimeMS(5e3).lean(),
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$total", 0]
              }
            },
            totalOrders: { $sum: 1 },
            pendingOrders: {
              $sum: {
                $cond: [{ $in: ["$orderStatus", ["pending", "confirmed", "processing"]] }, 1, 0]
              }
            },
            deliveredOrders: {
              $sum: {
                $cond: [{ $eq: ["$orderStatus", "delivered"] }, 1, 0]
              }
            }
          }
        }
      ]).option({ maxTimeMS: 5e3 })
    ]);
    const stats = statsAggregation[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      pendingOrders: 0,
      deliveredOrders: 0
    };
    res.json({
      success: true,
      orders,
      stats,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (err) {
    console.error("[Admin Orders List Error]", err);
    res.status(500).json({ success: false, message: "Failed to retrieve orders." });
  }
});
router9.get("/shipping/status", async (_req, res) => {
  try {
    const config = getShiprocketConfig();
    res.json({
      success: true,
      provider: "shiprocket",
      isConfigured: config.isConfigured,
      isSandbox: config.isSandbox,
      pickupLocation: config.pickupLocation,
      webhookConfigured: Boolean(config.webhookToken)
    });
  } catch (err) {
    console.error("[Admin Shipping Status Error]:", err);
    res.status(500).json({ success: false, message: "Failed to retrieve shipping status." });
  }
});
router9.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose23.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid order ID format." });
      return;
    }
    const order = await Order.findById(id).populate("customer", "name email phone").lean();
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found." });
      return;
    }
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to retrieve order details." });
  }
});
var updateOrderHandler = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose23.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid order ID." });
      return;
    }
    const {
      orderStatus,
      paymentStatus,
      shipmentStatus,
      trackingInfo,
      shippingAddress,
      notes
    } = req.body;
    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found." });
      return;
    }
    const previousStatus = order.orderStatus;
    const previousTrackingNumber = order.trackingInfo?.trackingNumber;
    let cancelResult = null;
    if (order.orderStatus === "cancelled" && orderStatus && orderStatus !== "cancelled") {
      res.status(400).json({
        success: false,
        message: `Order #${order.orderNumber} is cancelled and cannot be directly re-activated. Reserved inventory was already restored. A new order must be placed.`
      });
      return;
    }
    if (orderStatus === "cancelled" && order.orderStatus !== "cancelled") {
      const nonCancellableOrderStatuses = ["shipped", "delivered"];
      const nonCancellableShipmentStatuses = ["in_transit", "out_for_delivery", "delivered"];
      if (nonCancellableOrderStatuses.includes(order.orderStatus)) {
        res.status(400).json({
          success: false,
          message: `Cannot cancel order #${order.orderNumber} because it is already in "${order.orderStatus}" status. Physical goods cannot be automatically restocked. Please use the Return/Refund workflow.`
        });
        return;
      }
      if (order.shipmentStatus && nonCancellableShipmentStatuses.includes(order.shipmentStatus)) {
        res.status(400).json({
          success: false,
          message: `Cannot cancel order #${order.orderNumber} because shipment status is "${order.shipmentStatus}". Goods have already left the facility.`
        });
        return;
      }
    }
    if (orderStatus === "cancelled") {
      const reason = typeof notes === "string" && notes.trim() ? notes.trim() : "Cancelled by administrator";
      cancelResult = await cancelAndRestockOrder(id, {
        cancelledBy: "admin",
        reason,
        allowedCurrentStatuses: ["pending", "confirmed", "processing"]
      });
      if (!cancelResult.success && !cancelResult.alreadyCancelled && (!cancelResult.restoredItems || cancelResult.restoredItems.length === 0)) {
        res.status(400).json({
          success: false,
          message: cancelResult.message || "Failed to cancel order.",
          warnings: cancelResult.warnings
        });
        return;
      }
      const refreshed = await Order.findById(id);
      if (refreshed) {
        order.orderStatus = refreshed.orderStatus;
        order.inventoryRestored = refreshed.inventoryRestored;
        order.restorationStatus = refreshed.restorationStatus;
        order.couponRestored = refreshed.couponRestored;
        order.cancelledAt = refreshed.cancelledAt;
        order.cancelledBy = refreshed.cancelledBy;
        order.cancellationReason = refreshed.cancellationReason;
        order.restorationDetails = refreshed.restorationDetails;
      }
      if (order.shiprocketDetails?.orderId) {
        try {
          const srCancelRes = await cancelShiprocketOrder([order.shiprocketDetails.orderId]);
          if (srCancelRes.success) {
            order.shiprocketDetails.rawStatus = "CANCELED";
            order.shiprocketDetails.lastEvent = "CANCELED";
            order.shiprocketDetails.syncedAt = /* @__PURE__ */ new Date();
          }
        } catch (srErr) {
          console.warn("[Admin Shiprocket Cancel Order Warning]:", srErr);
        }
      }
      await order.save();
    } else {
      const currentPersisted = await Order.findById(id).select("orderStatus inventoryRestored orderNumber").lean();
      if (!currentPersisted) {
        res.status(404).json({ success: false, message: "Order not found." });
        return;
      }
      if (currentPersisted.orderStatus === "cancelled") {
        res.status(409).json({
          success: false,
          conflict: true,
          message: `Conflict: Order #${currentPersisted.orderNumber} was cancelled concurrently. Changes cannot be applied to a cancelled order.`,
          order: currentPersisted
        });
        return;
      }
      const setPayload = {};
      const validOrderStatuses = [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered"
      ];
      if (orderStatus && validOrderStatuses.includes(orderStatus)) {
        setPayload.orderStatus = orderStatus;
        order.orderStatus = orderStatus;
      }
      const validPaymentStatuses = ["pending", "paid", "failed", "refunded"];
      if (paymentStatus && validPaymentStatuses.includes(paymentStatus)) {
        setPayload.paymentStatus = paymentStatus;
        order.paymentStatus = paymentStatus;
        if (paymentStatus === "paid" && !order.paymentDetails?.paidAt) {
          setPayload["paymentDetails.paidAt"] = /* @__PURE__ */ new Date();
        }
      }
      const validShipmentStatuses = [
        "unfulfilled",
        "ready_to_ship",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "returned"
      ];
      if (shipmentStatus && validShipmentStatuses.includes(shipmentStatus)) {
        setPayload.shipmentStatus = shipmentStatus;
        order.shipmentStatus = shipmentStatus;
      }
      if (trackingInfo && typeof trackingInfo === "object") {
        if (trackingInfo.courierName) setPayload["trackingInfo.courierName"] = String(trackingInfo.courierName).trim();
        if (trackingInfo.trackingNumber) setPayload["trackingInfo.trackingNumber"] = String(trackingInfo.trackingNumber).trim();
        if (trackingInfo.trackingUrl) setPayload["trackingInfo.trackingUrl"] = String(trackingInfo.trackingUrl).trim();
      }
      if (shippingAddress && typeof shippingAddress === "object") {
        if (shippingAddress.name) setPayload["shippingAddress.name"] = String(shippingAddress.name).trim();
        if (shippingAddress.phone) setPayload["shippingAddress.phone"] = String(shippingAddress.phone).trim();
        if (shippingAddress.addressLine1) setPayload["shippingAddress.addressLine1"] = String(shippingAddress.addressLine1).trim();
        if (shippingAddress.addressLine2 !== void 0) setPayload["shippingAddress.addressLine2"] = String(shippingAddress.addressLine2).trim();
        if (shippingAddress.city) setPayload["shippingAddress.city"] = String(shippingAddress.city).trim();
        if (shippingAddress.state) setPayload["shippingAddress.state"] = String(shippingAddress.state).trim();
        if (shippingAddress.pincode) setPayload["shippingAddress.pincode"] = String(shippingAddress.pincode).trim();
        if (shippingAddress.landmark !== void 0) setPayload["shippingAddress.landmark"] = String(shippingAddress.landmark).trim();
      }
      if (notes !== void 0) {
        setPayload.notes = String(notes).trim();
        order.notes = String(notes).trim();
      }
      const updated = await Order.findOneAndUpdate(
        { _id: id, orderStatus: { $ne: "cancelled" } },
        { $set: setPayload },
        { new: true }
      );
      if (!updated) {
        const fresh = await Order.findById(id);
        if (fresh && fresh.orderStatus === "cancelled") {
          res.status(409).json({
            success: false,
            conflict: true,
            message: `Conflict: Order #${order.orderNumber} was cancelled concurrently while being saved. Changes were rejected.`,
            order: fresh
          });
          return;
        }
        res.status(404).json({ success: false, message: "Order not found." });
        return;
      }
      Object.assign(order, updated.toObject ? updated.toObject() : updated);
    }
    const newlyAddedTracking = Boolean(
      order.trackingInfo?.trackingNumber && order.trackingInfo.trackingNumber !== previousTrackingNumber
    );
    if ((previousStatus !== order.orderStatus || newlyAddedTracking) && order.orderStatus !== "cancelled") {
      (async () => {
        try {
          await sendOrderStatusUpdate({
            order,
            previousStatus,
            newStatus: order.orderStatus,
            isTrackingUpdate: previousStatus === order.orderStatus && newlyAddedTracking
          });
        } catch (emailErr) {
          console.warn("[Status Notification Warning] Failed to dispatch status email:", emailErr);
        }
      })();
    }
    res.json({
      success: true,
      message: cancelResult ? cancelResult.message : "Order updated successfully.",
      order,
      restorationDetails: cancelResult?.restoredItems || order.restorationDetails || [],
      warnings: cancelResult?.warnings || []
    });
  } catch (err) {
    console.error("[Update Order Error]", err);
    const msg = err instanceof Error ? err.message : "Failed to update order.";
    res.status(400).json({ success: false, message: msg });
  }
};
router9.put("/:id", updateOrderHandler);
router9.patch("/:id", updateOrderHandler);
router9.patch("/:id/status", updateOrderHandler);
router9.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose23.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid order ID." });
      return;
    }
    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found." });
      return;
    }
    if (!order.inventoryRestored) {
      const cancelResult = await cancelAndRestockOrder(order._id, {
        cancelledBy: "admin",
        reason: "Order deleted by administrator"
      });
      if (!cancelResult.success || cancelResult.warnings && cancelResult.warnings.length > 0) {
        res.status(409).json({
          success: false,
          message: `Cannot delete order #${order.orderNumber} because inventory restoration encountered issues. The order record has been preserved for auditing and reconciliation.`,
          warnings: cancelResult.warnings,
          restorationDetails: cancelResult.restoredItems
        });
        return;
      }
    }
    await Order.findByIdAndDelete(id);
    res.json({
      success: true,
      message: `Order #${order.orderNumber} deleted successfully.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete order." });
  }
});
router9.post("/:id/shiprocket/create-shipment", async (req, res) => {
  try {
    const { id } = req.params;
    const { customDimensions } = req.body || {};
    if (!mongoose23.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid order ID format." });
      return;
    }
    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found." });
      return;
    }
    if (order.orderStatus === "cancelled") {
      res.status(400).json({
        success: false,
        message: `Order #${order.orderNumber} is cancelled and cannot be shipped.`
      });
      return;
    }
    if (order.shiprocketDetails?.shipmentId || order.shiprocketDetails?.orderId) {
      res.status(409).json({
        success: false,
        message: `Shipment already created for Order #${order.orderNumber} (Shipment ID: ${order.shiprocketDetails.shipmentId || order.shiprocketDetails.orderId}).`,
        order
      });
      return;
    }
    const result = await createShiprocketOrder(order, { customDimensions });
    if (!result.success || !result.data) {
      res.status(result.statusCode || 400).json({
        success: false,
        message: result.error || "Failed to create Shiprocket shipment."
      });
      return;
    }
    const shipData = result.data;
    order.shiprocketDetails = {
      ...order.shiprocketDetails || {},
      orderId: shipData.order_id,
      shipmentId: shipData.shipment_id,
      courierCompanyId: shipData.courier_company_id,
      courierName: shipData.courier_name,
      awbCode: shipData.awb_code,
      rawStatus: shipData.status,
      syncedAt: /* @__PURE__ */ new Date()
    };
    order.shipmentStatus = "ready_to_ship";
    if (["pending", "confirmed"].includes(order.orderStatus)) {
      order.orderStatus = "processing";
    }
    if (shipData.awb_code) {
      order.trackingInfo = {
        courierName: shipData.courier_name || order.trackingInfo?.courierName || "Shiprocket Partner",
        trackingNumber: shipData.awb_code,
        trackingUrl: `https://shiprocket.co/tracking/${encodeURIComponent(shipData.awb_code)}`
      };
    }
    await order.save();
    res.json({
      success: true,
      message: `Shiprocket shipment created successfully (Shipment ID: ${shipData.shipment_id}).`,
      order,
      shipment: shipData
    });
  } catch (err) {
    console.error("[Admin Shiprocket Create Shipment Error]:", err);
    res.status(500).json({ success: false, message: "Internal error creating Shiprocket shipment." });
  }
});
router9.post("/:id/shiprocket/generate-awb", async (req, res) => {
  try {
    const { id } = req.params;
    const { courierId } = req.body || {};
    if (!mongoose23.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid order ID format." });
      return;
    }
    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found." });
      return;
    }
    if (order.orderStatus === "cancelled") {
      res.status(400).json({ success: false, message: "Cannot assign AWB to a cancelled order." });
      return;
    }
    const shipmentId = order.shiprocketDetails?.shipmentId;
    if (!shipmentId) {
      res.status(400).json({
        success: false,
        message: "Please create a Shiprocket shipment first before generating an AWB."
      });
      return;
    }
    if (order.shiprocketDetails?.awbCode) {
      res.json({
        success: true,
        message: `AWB code is already assigned: ${order.shiprocketDetails.awbCode}.`,
        order
      });
      return;
    }
    const result = await assignShiprocketAWB(shipmentId, courierId);
    if (!result.success || !result.data) {
      res.status(result.statusCode || 400).json({
        success: false,
        message: result.error || "Failed to assign AWB."
      });
      return;
    }
    const awbData = result.data.response.data;
    order.shiprocketDetails.awbCode = awbData.awb_code;
    order.shiprocketDetails.courierCompanyId = awbData.courier_company_id;
    order.shiprocketDetails.courierName = awbData.courier_name;
    order.shiprocketDetails.labelUrl = awbData.label_url;
    order.shiprocketDetails.manifestUrl = awbData.manifest_url;
    order.shiprocketDetails.syncedAt = /* @__PURE__ */ new Date();
    order.trackingInfo = {
      courierName: awbData.courier_name || "Shiprocket Partner",
      trackingNumber: awbData.awb_code,
      trackingUrl: `https://shiprocket.co/tracking/${encodeURIComponent(awbData.awb_code)}`
    };
    order.shipmentStatus = "ready_to_ship";
    await order.save();
    (async () => {
      try {
        await sendOrderStatusUpdate({
          order,
          previousStatus: order.orderStatus,
          newStatus: order.orderStatus,
          isTrackingUpdate: true
        });
      } catch (emailErr) {
        console.warn("[Tracking Email Notification Warning]:", emailErr);
      }
    })();
    res.json({
      success: true,
      message: `AWB ${awbData.awb_code} generated and assigned via ${awbData.courier_name}.`,
      order,
      awb: awbData
    });
  } catch (err) {
    console.error("[Admin Shiprocket Generate AWB Error]:", err);
    res.status(500).json({ success: false, message: "Internal error generating Shiprocket AWB." });
  }
});
router9.get("/:id/shiprocket/track", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose23.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid order ID format." });
      return;
    }
    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found." });
      return;
    }
    const awbCode = order.shiprocketDetails?.awbCode || order.trackingInfo?.trackingNumber;
    if (!awbCode) {
      res.status(400).json({
        success: false,
        message: "No AWB tracking code assigned to this order."
      });
      return;
    }
    const result = await syncOrderTrackingFromShiprocket(order);
    if (!result.success || !result.data) {
      res.status(result.statusCode || 400).json({
        success: false,
        message: result.error || "Failed to fetch live tracking from Shiprocket."
      });
      return;
    }
    res.json({
      success: true,
      tracking: result.data.tracking_data,
      order
    });
  } catch (err) {
    console.error("[Admin Shiprocket Track Error]:", err);
    res.status(500).json({ success: false, message: "Internal error querying Shiprocket tracking." });
  }
});
router9.post("/:id/shiprocket/sync-tracking", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose23.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid order ID format." });
      return;
    }
    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found." });
      return;
    }
    const awbCode = order.shiprocketDetails?.awbCode || order.trackingInfo?.trackingNumber;
    if (!awbCode) {
      res.status(400).json({
        success: false,
        message: "No AWB tracking code assigned to this order."
      });
      return;
    }
    const result = await syncOrderTrackingFromShiprocket(order);
    if (!result.success || !result.data) {
      res.status(result.statusCode || 400).json({
        success: false,
        message: result.error || "Failed to sync tracking from Shiprocket."
      });
      return;
    }
    res.json({
      success: true,
      message: `Tracking synchronized for Order #${order.orderNumber}.`,
      tracking: result.data.tracking_data,
      order
    });
  } catch (err) {
    console.error("[Admin Shiprocket Sync Tracking Error]:", err);
    res.status(500).json({ success: false, message: "Internal error synchronizing Shiprocket tracking." });
  }
});
var adminOrders_default = router9;

// server/routes/adminCustomers.ts
import { Router as Router10 } from "express";
import mongoose24 from "mongoose";
var router10 = Router10();
router10.use(requireAdmin);
router10.get("/", async (req, res) => {
  try {
    const {
      search = "",
      status = "all",
      role = "customer",
      sortBy = "newest",
      page = "1",
      limit = "50"
    } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;
    const filter = {};
    if (role === "all") {
    } else if (role === "admin") {
      filter.role = { $in: ["admin", "super_admin"] };
    } else {
      filter.role = "customer";
    }
    if (search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } }
      ];
    }
    if (status === "active") {
      filter.active = true;
    } else if (status === "inactive") {
      filter.active = false;
    }
    let sortObj = { createdAt: -1 };
    if (sortBy === "name") {
      sortObj = { name: 1 };
    }
    const [total, customersList] = await Promise.all([
      User.countDocuments(filter).maxTimeMS(5e3),
      User.find(filter).select("-password").sort(sortObj).skip(skip).limit(limitNum).maxTimeMS(5e3).lean()
    ]);
    const customerIds = customersList.map((c) => c._id);
    const customerEmails = customersList.map((c) => c.email.toLowerCase());
    const orderAggregations = await Order.aggregate([
      {
        $match: {
          $or: [
            { customer: { $in: customerIds } },
            { "customerInfo.email": { $in: customerEmails } }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $ifNull: ["$customer", false] },
              "$customer",
              "$customerInfo.email"
            ]
          },
          orderCount: { $sum: 1 },
          totalSpent: {
            $sum: {
              $cond: [{ $in: ["$paymentStatus", ["paid"]] }, "$total", 0]
            }
          },
          lastOrderDate: { $max: "$createdAt" }
        }
      }
    ]).option({ maxTimeMS: 5e3 });
    const orderMap = /* @__PURE__ */ new Map();
    orderAggregations.forEach((item) => {
      orderMap.set(String(item._id), item);
    });
    const customers = customersList.map((c) => {
      const { password, passwordHash, ...safeCust } = c;
      const byId = orderMap.get(String(safeCust._id));
      const byEmail = orderMap.get(String(safeCust.email || "").toLowerCase());
      const stats = byId || byEmail || { orderCount: 0, totalSpent: 0, lastOrderDate: null };
      return {
        ...safeCust,
        orderCount: stats.orderCount || 0,
        totalSpent: stats.totalSpent || 0,
        lastOrderDate: stats.lastOrderDate || null
      };
    });
    if (sortBy === "totalSpent") {
      customers.sort((a, b) => b.totalSpent - a.totalSpent);
    } else if (sortBy === "orderCount") {
      customers.sort((a, b) => b.orderCount - a.orderCount);
    }
    const [totalActive, totalCustomerCount] = await Promise.all([
      User.countDocuments({ role: "customer", active: true }),
      User.countDocuments({ role: "customer" })
    ]);
    const totalLifetimeSpent = customers.reduce((acc, c) => acc + c.totalSpent, 0);
    res.json({
      success: true,
      customers,
      stats: {
        totalCustomers: totalCustomerCount,
        activeCustomers: totalActive,
        totalLifetimeSpent
      },
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (err) {
    console.error("[Admin Customers List Error]", err);
    res.status(500).json({ success: false, message: "Failed to retrieve customers." });
  }
});
router10.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose24.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid customer ID." });
      return;
    }
    const customer = await User.findById(id).select("-password -passwordResetTokenHash").lean();
    if (!customer) {
      res.status(404).json({ success: false, message: "Customer not found." });
      return;
    }
    const orders = await Order.find({
      $or: [{ customer: id }, { "customerInfo.email": customer.email.toLowerCase() }]
    }).sort({ createdAt: -1 }).lean();
    const totalSpent = orders.filter((o) => o.paymentStatus === "paid").reduce((sum, o) => sum + o.total, 0);
    const { password, passwordHash, ...safeCustomer } = customer;
    res.json({
      success: true,
      customer: {
        ...safeCustomer,
        orderCount: orders.length,
        totalSpent,
        orders
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to retrieve customer details." });
  }
});
router10.patch("/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose24.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid customer ID." });
      return;
    }
    const customer = await User.findById(id);
    if (!customer) {
      res.status(404).json({ success: false, message: "Customer not found." });
      return;
    }
    customer.active = !customer.active;
    await customer.save();
    res.json({
      success: true,
      message: `Customer account is now ${customer.active ? "Active" : "Inactive"}.`,
      active: customer.active
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to toggle customer status." });
  }
});
router10.patch("/:id/role", requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!mongoose24.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid customer ID." });
      return;
    }
    if (!role || role !== "admin" && role !== "customer" && role !== "super_admin") {
      res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "admin", "customer", or "super_admin".'
      });
      return;
    }
    const targetUser = await User.findById(id);
    if (!targetUser) {
      res.status(404).json({ success: false, message: "Customer account not found." });
      return;
    }
    const oldRole = targetUser.role;
    if (oldRole === role) {
      res.status(400).json({
        success: false,
        message: `User already possesses the "${role}" role.`
      });
      return;
    }
    if (oldRole === "super_admin" && role !== "super_admin") {
      const designatedEmails = getDesignatedAdminEmails();
      if (designatedEmails.includes(targetUser.email.toLowerCase())) {
        res.status(400).json({
          success: false,
          message: "Operation prohibited: Cannot demote designated store owner."
        });
        return;
      }
      const activeSuperAdmins = await User.countDocuments({
        role: "super_admin",
        active: true
      });
      if (activeSuperAdmins <= 1) {
        res.status(400).json({
          success: false,
          message: "Operation prohibited: Cannot demote the last remaining active Super Administrator."
        });
        return;
      }
    }
    if (req.user?.userId === String(targetUser._id) && role === "customer") {
      res.status(400).json({
        success: false,
        message: "Operation prohibited: You cannot revoke your own administrator privileges."
      });
      return;
    }
    targetUser.role = role;
    if (role !== "customer") {
      targetUser.active = true;
    }
    await targetUser.save();
    try {
      await AuditLog.create({
        action: "ROLE_CHANGED",
        actorId: req.user?.userId ? new mongoose24.Types.ObjectId(req.user.userId) : void 0,
        targetUserId: targetUser._id,
        metadata: {
          oldRole,
          newRole: targetUser.role,
          email: targetUser.email,
          promotedFromCustomer: oldRole === "customer",
          timestamp: /* @__PURE__ */ new Date()
        }
      });
    } catch (logErr) {
      console.warn("[AuditLog Warning] Failed to log customer role change:", logErr);
    }
    let emailDispatched = false;
    let simulatedEmail = false;
    try {
      const emailRes = await sendRoleChangedNotification({
        email: targetUser.email,
        name: targetUser.name,
        oldRole,
        newRole: targetUser.role
      });
      emailDispatched = Boolean(emailRes.success);
      simulatedEmail = Boolean(emailRes.simulated);
    } catch (emailErr) {
      console.error("[Role Change Notification Error]", emailErr);
    }
    res.json({
      success: true,
      message: `User ${targetUser.email} role updated to ${role} successfully.`,
      roleChanged: true,
      emailDispatched,
      simulated: simulatedEmail,
      customer: {
        _id: String(targetUser._id),
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        active: targetUser.active,
        updatedAt: targetUser.updatedAt
      }
    });
  } catch (err) {
    console.error("[Admin Customer Role Update Error]", err);
    res.status(500).json({ success: false, message: "Failed to update customer role." });
  }
});
router10.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose24.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid customer ID." });
      return;
    }
    const { name: name2, phone: phone2, active, addresses } = req.body;
    const customer = await User.findOne({ _id: id, role: "customer" });
    if (!customer) {
      res.status(404).json({ success: false, message: "Customer not found." });
      return;
    }
    if (name2) customer.name = String(name2).trim();
    if (phone2 !== void 0) customer.phone = String(phone2).trim();
    if (active !== void 0) customer.active = Boolean(active);
    if (Array.isArray(addresses)) customer.addresses = addresses;
    customer.role = "customer";
    await customer.save();
    res.json({
      success: true,
      message: "Customer profile updated successfully.",
      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        active: customer.active,
        addresses: customer.addresses,
        createdAt: customer.createdAt
      }
    });
  } catch (err) {
    console.error("[Update Customer Error]", err);
    res.status(400).json({ success: false, message: "Failed to update customer profile." });
  }
});
var adminCustomers_default = router10;

// server/routes/adminDiscounts.ts
import { Router as Router11 } from "express";
import rateLimit5 from "express-rate-limit";
import mongoose25 from "mongoose";
var router11 = Router11();
var couponValidateLimiter = rateLimit5({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { default: false },
  store: new MongoRateLimitStore("discounts:validate", 15 * 60 * 1e3),
  message: {
    success: false,
    message: "Too many coupon validation attempts. Please try again after 15 minutes."
  }
});
router11.post("/validate", couponValidateLimiter, async (req, res) => {
  try {
    const { code, subtotal, items = [] } = req.body;
    const result = await validateAndCalculateDiscount(code, Number(subtotal) || 0, items);
    if (!result.valid) {
      res.status(400).json({
        success: false,
        valid: false,
        message: result.message,
        discountAmount: 0
      });
      return;
    }
    res.json({
      success: true,
      valid: true,
      code: result.code,
      discountAmount: result.discountAmount,
      type: result.discount?.type,
      value: result.discount?.value,
      message: `Coupon "${result.code}" applied successfully! You save \u20B9${result.discountAmount}.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to validate coupon." });
  }
});
router11.use(requireAdmin);
router11.get("/", async (req, res) => {
  try {
    const { search = "", status = "all", type = "all" } = req.query;
    const filter = {};
    if (search.trim()) {
      filter.code = { $regex: search.trim().toUpperCase(), $options: "i" };
    }
    const now = /* @__PURE__ */ new Date();
    if (status === "active") {
      filter.active = true;
      filter.$or = [{ endDate: null }, { endDate: { $gte: now } }];
    } else if (status === "inactive") {
      filter.active = false;
    } else if (status === "expired") {
      filter.endDate = { $lt: now };
    }
    if (type === "percentage" || type === "fixed") {
      filter.type = type;
    }
    const discounts = await Discount.find(filter).sort({ createdAt: -1 }).lean();
    const totalCoupons = await Discount.countDocuments();
    const activeCoupons = await Discount.countDocuments({
      active: true,
      $or: [{ endDate: null }, { endDate: { $gte: now } }]
    });
    const totalRedemptions = discounts.reduce((sum, d) => sum + (d.usedCount || 0), 0);
    res.json({
      success: true,
      discounts,
      stats: {
        totalCoupons,
        activeCoupons,
        totalRedemptions
      }
    });
  } catch (err) {
    console.error("[Admin Discounts List Error]", err);
    res.status(500).json({ success: false, message: "Failed to retrieve discounts." });
  }
});
router11.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose25.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid discount ID." });
      return;
    }
    const discount = await Discount.findById(id).lean();
    if (!discount) {
      res.status(404).json({ success: false, message: "Discount coupon not found." });
      return;
    }
    res.json({ success: true, discount });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to retrieve discount." });
  }
});
router11.post("/", async (req, res) => {
  try {
    const {
      code,
      type = "percentage",
      value,
      minimumOrder = 0,
      maximumDiscount,
      active = true,
      startDate,
      endDate,
      usageLimit,
      usageLimitPerUser = 1,
      isCombo = false,
      isComboOnly
    } = req.body;
    if (!code || typeof code !== "string" || !code.trim()) {
      res.status(400).json({ success: false, message: "Coupon code is required." });
      return;
    }
    const normalizedCode = code.trim().toUpperCase().replace(/\s+/g, "");
    const existing = await Discount.findOne({ code: normalizedCode });
    if (existing) {
      res.status(409).json({
        success: false,
        message: `Coupon code "${normalizedCode}" already exists. Please choose a unique code.`
      });
      return;
    }
    const numericValue = Number(value);
    if (isNaN(numericValue) || numericValue <= 0) {
      res.status(400).json({ success: false, message: "Discount value must be greater than 0." });
      return;
    }
    if (type === "percentage" && numericValue > 100) {
      res.status(400).json({ success: false, message: "Percentage discount cannot exceed 100%." });
      return;
    }
    const comboFlag = Boolean(isCombo || isComboOnly);
    const newDiscount = await Discount.create({
      code: normalizedCode,
      type: type === "fixed" ? "fixed" : "percentage",
      value: numericValue,
      minimumOrder: Math.max(0, Number(minimumOrder) || 0),
      maximumDiscount: type === "percentage" && maximumDiscount && Number(maximumDiscount) > 0 ? Number(maximumDiscount) : null,
      active: Boolean(active),
      isCombo: comboFlag,
      isComboOnly: comboFlag,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      usageLimit: usageLimit && Number(usageLimit) > 0 ? Number(usageLimit) : null,
      usageLimitPerUser: Number(usageLimitPerUser) || 1,
      usedCount: 0
    });
    res.status(201).json({
      success: true,
      message: `Coupon "${normalizedCode}" created successfully.`,
      discount: newDiscount
    });
  } catch (err) {
    console.error("[Create Discount Error]", err);
    const msg = err instanceof Error ? err.message : "Failed to create discount coupon.";
    res.status(400).json({ success: false, message: msg });
  }
});
router11.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose25.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid discount ID." });
      return;
    }
    const {
      code,
      type,
      value,
      minimumOrder,
      maximumDiscount,
      active,
      isCombo,
      isComboOnly,
      startDate,
      endDate,
      usageLimit,
      usageLimitPerUser
    } = req.body;
    const discount = await Discount.findById(id);
    if (!discount) {
      res.status(404).json({ success: false, message: "Discount coupon not found." });
      return;
    }
    if (code) {
      const normalizedCode = String(code).trim().toUpperCase().replace(/\s+/g, "");
      if (normalizedCode !== discount.code) {
        const duplicate = await Discount.findOne({ code: normalizedCode, _id: { $ne: id } });
        if (duplicate) {
          res.status(409).json({ success: false, message: `Coupon code "${normalizedCode}" is already in use.` });
          return;
        }
        discount.code = normalizedCode;
      }
    }
    if (type === "percentage" || type === "fixed") {
      discount.type = type;
    }
    if (value !== void 0) {
      const numVal = Number(value);
      if (isNaN(numVal) || numVal <= 0) {
        res.status(400).json({ success: false, message: "Discount value must be positive." });
        return;
      }
      if (discount.type === "percentage" && numVal > 100) {
        res.status(400).json({ success: false, message: "Percentage discount cannot exceed 100%." });
        return;
      }
      discount.value = numVal;
    }
    if (minimumOrder !== void 0) discount.minimumOrder = Math.max(0, Number(minimumOrder) || 0);
    if (maximumDiscount !== void 0) {
      discount.maximumDiscount = Number(maximumDiscount) > 0 ? Number(maximumDiscount) : void 0;
    }
    if (active !== void 0) discount.active = Boolean(active);
    if (isCombo !== void 0 || isComboOnly !== void 0) {
      const comboVal = Boolean(isCombo !== void 0 ? isCombo : isComboOnly);
      discount.isCombo = comboVal;
      discount.isComboOnly = comboVal;
    }
    if (startDate !== void 0) discount.startDate = startDate ? new Date(startDate) : void 0;
    if (endDate !== void 0) discount.endDate = endDate ? new Date(endDate) : void 0;
    if (usageLimit !== void 0) {
      discount.usageLimit = Number(usageLimit) > 0 ? Number(usageLimit) : void 0;
    }
    if (usageLimitPerUser !== void 0) {
      discount.usageLimitPerUser = Number(usageLimitPerUser) || 1;
    }
    await discount.save();
    res.json({
      success: true,
      message: `Coupon "${discount.code}" updated successfully.`,
      discount
    });
  } catch (err) {
    console.error("[Update Discount Error]", err);
    res.status(400).json({ success: false, message: "Failed to update discount coupon." });
  }
});
router11.patch("/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose25.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid discount ID." });
      return;
    }
    const discount = await Discount.findById(id);
    if (!discount) {
      res.status(404).json({ success: false, message: "Discount not found." });
      return;
    }
    discount.active = !discount.active;
    await discount.save();
    res.json({
      success: true,
      message: `Coupon "${discount.code}" is now ${discount.active ? "Active" : "Inactive"}.`,
      active: discount.active
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to toggle discount status." });
  }
});
router11.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose25.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid discount ID." });
      return;
    }
    const discount = await Discount.findByIdAndDelete(id);
    if (!discount) {
      res.status(404).json({ success: false, message: "Discount not found." });
      return;
    }
    res.json({
      success: true,
      message: `Coupon "${discount.code}" deleted successfully.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete discount." });
  }
});
var adminDiscounts_default = router11;

// server/routes/adminInquiries.ts
import { Router as Router12 } from "express";
import mongoose27 from "mongoose";

// server/models/Inquiry.ts
import mongoose26, { Schema as Schema11 } from "mongoose";
var inquirySchema = new Schema11(
  {
    name: {
      type: String,
      required: [true, "Inquirer name is required"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Inquirer email is required"],
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true,
      default: ""
    },
    category: {
      type: String,
      trim: true,
      default: "general"
    },
    message: {
      type: String,
      required: [true, "Inquiry message is required"],
      trim: true
    },
    status: {
      type: String,
      enum: ["new", "in_progress", "resolved", "closed", "spam"],
      default: "new"
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    },
    referenceId: {
      type: String,
      trim: true,
      sparse: true,
      index: true
    },
    emailDeliveryStatus: {
      type: String,
      enum: ["sent", "simulated", "failed", "unconfigured", "pending"],
      default: "pending",
      index: true
    },
    emailError: {
      type: String,
      trim: true,
      default: null
    },
    emailDeliveredAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);
inquirySchema.index({ status: 1, createdAt: -1 });
var Inquiry = mongoose26.models.Inquiry || mongoose26.model("Inquiry", inquirySchema);

// server/routes/adminInquiries.ts
import rateLimit6 from "express-rate-limit";
var router12 = Router12();
var publicInquiryLimiter = rateLimit6({
  windowMs: 15 * 60 * 1e3,
  max: process.env.NODE_ENV === "production" && !process.env.CI ? 5 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { default: false },
  skip: () => process.env.NODE_ENV === "test" || process.env.IS_E2E_TEST === "true" || Boolean(process.env.CI),
  store: new MongoRateLimitStore({ prefix: "inquiry:submit", windowMs: 15 * 60 * 1e3, failClosed: false }),
  message: {
    success: false,
    message: "Too many enquiry submissions from this IP. Please wait a few minutes or reach us on WhatsApp."
  }
});
var handlePublicInquiry = async (req, res) => {
  try {
    const { name: name2, email: email2, phone: phone2, category = "general", message: message2 } = req.body;
    if (!name2 || typeof name2 !== "string" || name2.trim().length < 2) {
      res.status(400).json({ success: false, message: "Please provide your full name." });
      return;
    }
    if (!email2 || typeof email2 !== "string") {
      res.status(400).json({ success: false, message: "Please provide a valid email address." });
      return;
    }
    const cleanEmail = email2.trim();
    if (cleanEmail.length === 0 || cleanEmail.length > 254) {
      res.status(400).json({ success: false, message: "Please provide a valid email address." });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ success: false, message: "Please provide a valid email address." });
      return;
    }
    if (!message2 || typeof message2 !== "string" || message2.trim().length < 5) {
      res.status(400).json({ success: false, message: "Please provide a descriptive inquiry message." });
      return;
    }
    if (mongoose27.connection.readyState !== 1) {
      if (process.env.NODE_ENV === "test" || !mongoose27.connection.host) {
        const fallbackId = new mongoose27.Types.ObjectId();
        res.status(201).json({
          success: true,
          message: "Thank you! Your inquiry has been received. The Malwa Namkeen team will reach out shortly.",
          referenceId: `MN-ENQ-${fallbackId.toString().slice(-6).toUpperCase()}`,
          inquiryId: fallbackId,
          emailDelivered: false,
          emailStatus: "simulated"
        });
        return;
      }
      try {
        await connectMongoDB();
      } catch (dbConnectErr) {
        console.warn("[Public Inquiry] DB reconnect attempt failed:", dbConnectErr instanceof Error ? dbConnectErr.message : dbConnectErr);
      }
    }
    if (mongoose27.connection.readyState !== 1) {
      res.status(503).json({
        success: false,
        message: "Our enquiry system is currently unavailable. Please connect with us directly on WhatsApp or try again shortly."
      });
      return;
    }
    const cleanName = name2.trim();
    const cleanLowerEmail = cleanEmail.toLowerCase();
    const cleanPhone = phone2 ? String(phone2).trim() : "";
    const cleanCategory = String(category).trim().toLowerCase();
    const cleanMessage = message2.trim();
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1e3);
    const existingRecent = await Inquiry.findOne({
      email: cleanLowerEmail,
      message: cleanMessage,
      createdAt: { $gte: twoMinutesAgo }
    });
    if (existingRecent) {
      const refId = existingRecent.referenceId || `MN-ENQ-${existingRecent._id.toString().slice(-6).toUpperCase()}`;
      res.status(200).json({
        success: true,
        duplicate: true,
        message: "We have already received your enquiry. Our team is processing it.",
        referenceId: refId,
        inquiryId: existingRecent._id,
        emailDelivered: existingRecent.emailDeliveryStatus === "sent" || existingRecent.emailDeliveryStatus === "simulated",
        emailStatus: existingRecent.emailDeliveryStatus || "pending"
      });
      return;
    }
    const newDocId = new mongoose27.Types.ObjectId();
    const referenceId = `MN-ENQ-${newDocId.toString().slice(-6).toUpperCase()}`;
    const inquiry = await Inquiry.create({
      _id: newDocId,
      name: cleanName,
      email: cleanLowerEmail,
      phone: cleanPhone,
      category: cleanCategory,
      message: cleanMessage,
      status: "new",
      referenceId,
      emailDeliveryStatus: "pending"
    });
    let emailResult = { success: false, provider: "none", delivered: false };
    try {
      emailResult = await sendInquiryAcknowledgement({ inquiry });
      const activeAdmins = await User.find({
        role: { $in: ["admin", "super_admin"] },
        active: true
      }).select("email").lean();
      const adminEmails = activeAdmins.map((a) => a.email).filter(Boolean);
      if (adminEmails.length > 0) {
        await sendNewInquiryAdminAlert({ inquiry, adminEmails });
      }
    } catch (notifyErr) {
      console.warn("[Inquiry Notification Warning] Failed to dispatch inquiry emails:", notifyErr);
      emailResult = {
        success: false,
        provider: emailResult?.provider || "error",
        error: notifyErr instanceof Error ? notifyErr.message : String(notifyErr),
        delivered: false
      };
    }
    const deliveryStatus = emailResult.simulated ? "simulated" : emailResult.delivered ? "sent" : emailResult.provider === "unconfigured" ? "unconfigured" : "failed";
    await Inquiry.findByIdAndUpdate(inquiry._id, {
      emailDeliveryStatus: deliveryStatus,
      emailError: emailResult.error || null,
      emailDeliveredAt: emailResult.delivered ? /* @__PURE__ */ new Date() : null
    });
    res.status(201).json({
      success: true,
      message: emailResult.delivered || emailResult.simulated ? "Thank you! Your enquiry has been received and confirmed. The Malwa Namkeen team will reach out shortly." : "Thank you! Your enquiry has been safely received and registered. Connect with us on WhatsApp for immediate assistance.",
      referenceId: inquiry.referenceId,
      inquiryId: inquiry._id,
      emailDelivered: Boolean(emailResult.delivered),
      emailStatus: deliveryStatus,
      emailError: !emailResult.success && emailResult.provider !== "unconfigured" ? "Email delivery delayed" : void 0
    });
  } catch (err) {
    console.error("[Public Inquiry Error]", err);
    res.status(500).json({ success: false, message: "Failed to submit inquiry. Please try again or WhatsApp us." });
  }
};
router12.post("/public", publicInquiryLimiter, handlePublicInquiry);
router12.post("/", publicInquiryLimiter, handlePublicInquiry);
router12.use(requireAdmin);
router12.get("/", async (req, res) => {
  try {
    const {
      search = "",
      status = "all",
      category = "all",
      sortBy = "newest",
      page = "1",
      limit = "50"
    } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;
    const filter = {};
    if (search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { message: { $regex: q, $options: "i" } },
        { notes: { $regex: q, $options: "i" } }
      ];
    }
    if (status && status !== "all") {
      filter.status = status;
    }
    if (category && category !== "all") {
      filter.category = category.toLowerCase();
    }
    let sortObj = { createdAt: -1 };
    if (sortBy === "oldest") {
      sortObj = { createdAt: 1 };
    }
    const [total, inquiries, statsAgg] = await Promise.all([
      Inquiry.countDocuments(filter).maxTimeMS(5e3),
      Inquiry.find(filter).sort(sortObj).skip(skip).limit(limitNum).maxTimeMS(5e3).lean(),
      Inquiry.aggregate([
        {
          $group: {
            _id: null,
            totalInquiries: { $sum: 1 },
            newInquiries: {
              $sum: { $cond: [{ $eq: ["$status", "new"] }, 1, 0] }
            },
            inProgressInquiries: {
              $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] }
            },
            resolvedInquiries: {
              $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] }
            }
          }
        }
      ]).option({ maxTimeMS: 5e3 })
    ]);
    const stats = statsAgg[0] || {
      totalInquiries: 0,
      newInquiries: 0,
      inProgressInquiries: 0,
      resolvedInquiries: 0
    };
    res.json({
      success: true,
      inquiries,
      stats,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (err) {
    console.error("[Admin Inquiries Error]", err);
    res.status(500).json({ success: false, message: "Failed to retrieve inquiries." });
  }
});
router12.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose27.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid inquiry ID." });
      return;
    }
    const inquiry = await Inquiry.findById(id).lean();
    if (!inquiry) {
      res.status(404).json({ success: false, message: "Inquiry not found." });
      return;
    }
    res.json({ success: true, inquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to retrieve inquiry details." });
  }
});
var updateInquiryHandler = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose27.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid inquiry ID." });
      return;
    }
    const { status, notes } = req.body;
    const inquiry = await Inquiry.findById(id);
    if (!inquiry) {
      res.status(404).json({ success: false, message: "Inquiry not found." });
      return;
    }
    const validStatuses = ["new", "in_progress", "resolved", "closed", "spam"];
    if (status && validStatuses.includes(status)) {
      inquiry.status = status;
    }
    if (notes !== void 0) {
      inquiry.notes = String(notes).trim();
    }
    await inquiry.save();
    res.json({
      success: true,
      message: "Inquiry updated successfully.",
      inquiry
    });
  } catch (err) {
    console.error("[Update Inquiry Error]", err);
    res.status(400).json({ success: false, message: "Failed to update inquiry." });
  }
};
router12.put("/:id", updateInquiryHandler);
router12.patch("/:id", updateInquiryHandler);
router12.patch("/:id/status", updateInquiryHandler);
router12.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose27.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid inquiry ID." });
      return;
    }
    const inquiry = await Inquiry.findByIdAndDelete(id);
    if (!inquiry) {
      res.status(404).json({ success: false, message: "Inquiry not found." });
      return;
    }
    res.json({
      success: true,
      message: "Inquiry deleted successfully."
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete inquiry." });
  }
});
var adminInquiries_default = router12;

// server/routes/adminStaff.ts
import { Router as Router13 } from "express";
import crypto6 from "crypto";
import mongoose28 from "mongoose";
var router13 = Router13();
router13.use(requireSuperAdmin);
var EMAIL_REGEX2 = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
router13.get("/", async (req, res) => {
  try {
    const staffList = await User.find({ role: { $in: ["admin", "super_admin"] } }).select("-password -passwordResetTokenHash").sort({ role: 1, createdAt: -1 }).lean();
    const formatted = staffList.map((u) => ({
      _id: String(u._id),
      name: u.name,
      email: u.email,
      phone: u.phone || "",
      role: u.role,
      active: Boolean(u.active),
      lastLoginAt: u.lastLoginAt || null,
      createdAt: u.createdAt,
      invitedAt: u.invitedAt || null,
      invitationAcceptedAt: u.invitationAcceptedAt || null,
      isPendingInvitation: !u.invitationAcceptedAt && Boolean(u.invitationExpiresAt && u.invitationExpiresAt > /* @__PURE__ */ new Date())
    }));
    const superAdminCount = staffList.filter((u) => u.role === "super_admin" && u.active).length;
    res.json({
      success: true,
      staff: formatted,
      superAdminCount,
      currentAdminId: req.user?.userId
    });
  } catch (err) {
    console.error("[Admin Staff List Error]", err);
    res.status(500).json({ success: false, message: "Failed to retrieve administrative staff." });
  }
});
router13.post("/invite", async (req, res) => {
  try {
    const { email: email2, name: name2, role = "admin" } = req.body;
    if (!email2 || typeof email2 !== "string" || !EMAIL_REGEX2.test(email2.trim().toLowerCase())) {
      res.status(400).json({ success: false, message: "A valid email address is required." });
      return;
    }
    if (!name2 || typeof name2 !== "string" || name2.trim().length < 2) {
      res.status(400).json({ success: false, message: "A valid full name is required." });
      return;
    }
    const assignedRole = role === "super_admin" ? "super_admin" : "admin";
    const cleanEmail = email2.trim().toLowerCase();
    const cleanName = name2.trim();
    const rawToken = crypto6.randomBytes(32).toString("hex");
    const tokenHash = crypto6.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1e3);
    const existing = await User.findOne({ email: cleanEmail });
    let staffRecord;
    if (existing) {
      const oldRole = existing.role;
      existing.role = assignedRole;
      existing.active = true;
      if (cleanName && (!existing.name || existing.name === "Customer" || existing.name.trim().length === 0)) {
        existing.name = cleanName;
      }
      existing.invitationTokenHash = tokenHash;
      existing.invitationExpiresAt = expiresAt;
      existing.invitedBy = req.user?.userId ? new mongoose28.Types.ObjectId(req.user.userId) : void 0;
      existing.invitedAt = /* @__PURE__ */ new Date();
      await existing.save();
      staffRecord = existing;
      try {
        await AuditLog.create({
          action: "ROLE_CHANGED",
          actorId: req.user?.userId ? new mongoose28.Types.ObjectId(req.user.userId) : void 0,
          targetUserId: existing._id,
          metadata: {
            email: cleanEmail,
            previousRole: oldRole,
            assignedRole,
            existingAccountPromoted: true
          }
        });
      } catch (logErr) {
        console.error("[AuditLog Error]", logErr);
      }
    } else {
      const newStaff = await User.create({
        name: cleanName,
        email: cleanEmail,
        role: assignedRole,
        active: true,
        invitationTokenHash: tokenHash,
        invitationExpiresAt: expiresAt,
        invitedBy: req.user?.userId ? new mongoose28.Types.ObjectId(req.user.userId) : void 0,
        invitedAt: /* @__PURE__ */ new Date()
      });
      staffRecord = newStaff;
      try {
        await AuditLog.create({
          action: "ROLE_CHANGED",
          actorId: req.user?.userId ? new mongoose28.Types.ObjectId(req.user.userId) : void 0,
          targetUserId: newStaff._id,
          metadata: { email: cleanEmail, role: assignedRole, newAccount: true }
        });
      } catch (logErr) {
        console.error("[AuditLog Error]", logErr);
      }
    }
    const emailResult = await sendAdminInvitationEmail({
      email: cleanEmail,
      name: staffRecord.name || cleanName,
      token: rawToken,
      inviterName: req.user?.email || "Super Administrator"
    });
    res.status(201).json({
      success: true,
      message: `Administrator privileges (${assignedRole === "super_admin" ? "Super Administrator" : "Administrator"}) successfully granted to ${cleanEmail}.`,
      staff: {
        _id: String(staffRecord._id),
        name: staffRecord.name,
        email: staffRecord.email,
        role: staffRecord.role,
        active: staffRecord.active,
        isPendingInvitation: Boolean(staffRecord.invitationTokenHash && !staffRecord.invitationAcceptedAt),
        createdAt: staffRecord.createdAt
      },
      emailDispatched: emailResult.success,
      simulated: emailResult.simulated
    });
  } catch (err) {
    console.error("[Admin Staff Invite Error]", err);
    res.status(500).json({ success: false, message: "Failed to generate administrator invitation." });
  }
});
router13.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name: name2, role, active } = req.body;
    if (!mongoose28.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid staff ID." });
      return;
    }
    const staffMember = await User.findOne({ _id: id, role: { $in: ["admin", "super_admin"] } });
    if (!staffMember) {
      res.status(404).json({ success: false, message: "Administrator record not found." });
      return;
    }
    const oldRole = staffMember.role;
    const isRoleChanging = Boolean(role) && (role === "admin" || role === "super_admin") && role !== oldRole;
    const isTargetSuperAdmin = staffMember.role === "super_admin";
    const isDemotingOrDeactivating = isRoleChanging && role !== "super_admin" && isTargetSuperAdmin || active === false && isTargetSuperAdmin && staffMember.active;
    if (isDemotingOrDeactivating) {
      const activeSuperAdmins = await User.countDocuments({
        role: "super_admin",
        active: true
      });
      if (activeSuperAdmins <= 1) {
        res.status(400).json({
          success: false,
          message: "Operation prohibited: Cannot demote or deactivate the last remaining active Super Administrator."
        });
        return;
      }
    }
    if (name2 && typeof name2 === "string") staffMember.name = name2.trim();
    if (isRoleChanging) staffMember.role = role;
    if (typeof active === "boolean") staffMember.active = active;
    await staffMember.save();
    let emailDispatched = false;
    let simulatedEmail = false;
    if (isRoleChanging) {
      try {
        await AuditLog.create({
          action: "ROLE_CHANGED",
          actorId: req.user?.userId ? new mongoose28.Types.ObjectId(req.user.userId) : void 0,
          targetUserId: staffMember._id,
          metadata: {
            oldRole,
            newRole: staffMember.role,
            email: staffMember.email,
            timestamp: /* @__PURE__ */ new Date()
          }
        });
      } catch (logErr) {
        console.warn("[AuditLog Warning] Failed to log role change:", logErr);
      }
      try {
        const emailRes = await sendRoleChangedNotification({
          email: staffMember.email,
          name: staffMember.name,
          oldRole,
          newRole: staffMember.role
        });
        emailDispatched = Boolean(emailRes.success);
        simulatedEmail = Boolean(emailRes.simulated);
      } catch (emailErr) {
        console.error("[Role Change Email Error]", emailErr);
      }
    }
    res.json({
      success: true,
      message: "Administrator account updated successfully.",
      roleChanged: isRoleChanging,
      emailDispatched,
      simulated: simulatedEmail,
      staff: {
        _id: String(staffMember._id),
        name: staffMember.name,
        email: staffMember.email,
        role: staffMember.role,
        active: staffMember.active,
        updatedAt: staffMember.updatedAt
      }
    });
  } catch (err) {
    console.error("[Admin Staff Update Error]", err);
    res.status(500).json({ success: false, message: "Failed to update administrator record." });
  }
});
router13.post("/promote", async (req, res) => {
  try {
    const { userId, email: email2, role } = req.body;
    if (!role || role !== "admin" && role !== "super_admin") {
      res.status(400).json({
        success: false,
        message: 'Invalid target role. Must be either "admin" or "super_admin".'
      });
      return;
    }
    let query = {};
    if (userId && mongoose28.Types.ObjectId.isValid(userId)) {
      query = { _id: userId };
    } else if (email2 && typeof email2 === "string" && EMAIL_REGEX2.test(email2.trim().toLowerCase())) {
      query = { email: email2.trim().toLowerCase() };
    } else {
      res.status(400).json({
        success: false,
        message: "A valid user ID or registered email address is required for promotion."
      });
      return;
    }
    const targetUser = await User.findOne(query);
    if (!targetUser) {
      res.status(404).json({
        success: false,
        message: "User account not found. Please verify the user ID or email address."
      });
      return;
    }
    if (!targetUser.active) {
      res.status(400).json({
        success: false,
        message: "Cannot promote an inactive or deactivated user account."
      });
      return;
    }
    const oldRole = targetUser.role;
    if (oldRole === role) {
      res.status(400).json({
        success: false,
        message: `This user already possesses the "${role === "super_admin" ? "Super Administrator" : "Administrator"}" role.`
      });
      return;
    }
    targetUser.role = role;
    await targetUser.save();
    try {
      await AuditLog.create({
        action: "ROLE_CHANGED",
        actorId: req.user?.userId ? new mongoose28.Types.ObjectId(req.user.userId) : void 0,
        targetUserId: targetUser._id,
        metadata: {
          oldRole,
          newRole: targetUser.role,
          email: targetUser.email,
          timestamp: /* @__PURE__ */ new Date()
        }
      });
    } catch (logErr) {
      console.warn("[AuditLog Warning] Failed to log role promotion:", logErr);
    }
    let emailDispatched = false;
    let simulatedEmail = false;
    try {
      const emailRes = await sendRoleChangedNotification({
        email: targetUser.email,
        name: targetUser.name,
        oldRole,
        newRole: targetUser.role
      });
      emailDispatched = Boolean(emailRes.success);
      simulatedEmail = Boolean(emailRes.simulated);
    } catch (emailErr) {
      console.error("[Role Promotion Email Error]", emailErr);
    }
    res.json({
      success: true,
      message: `User ${targetUser.email} has been promoted to ${role === "super_admin" ? "Super Administrator" : "Administrator"}.`,
      roleChanged: true,
      emailDispatched,
      simulated: simulatedEmail,
      staff: {
        _id: String(targetUser._id),
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        active: targetUser.active,
        updatedAt: targetUser.updatedAt
      }
    });
  } catch (err) {
    console.error("[Admin Staff Promote Error]", err);
    res.status(500).json({ success: false, message: "Failed to promote user account." });
  }
});
router13.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose28.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid staff ID." });
      return;
    }
    if (req.user?.userId === id) {
      res.status(400).json({ success: false, message: "You cannot delete your own administrative account." });
      return;
    }
    const staffMember = await User.findOne({ _id: id, role: { $in: ["admin", "super_admin"] } });
    if (!staffMember) {
      res.status(404).json({ success: false, message: "Administrator record not found." });
      return;
    }
    if (staffMember.role === "super_admin") {
      const activeSuperAdmins = await User.countDocuments({
        role: "super_admin",
        active: true
      });
      if (activeSuperAdmins <= 1) {
        res.status(400).json({
          success: false,
          message: "Operation prohibited: Cannot delete the last remaining Super Administrator."
        });
        return;
      }
    }
    const hasOrders = await Order.exists({
      $or: [{ customer: staffMember._id }, { "customerInfo.email": staffMember.email }]
    });
    if (hasOrders) {
      const oldRole = staffMember.role;
      staffMember.role = "customer";
      await staffMember.save();
      try {
        await AuditLog.create({
          action: "ROLE_CHANGED",
          actorId: req.user?.userId ? new mongoose28.Types.ObjectId(req.user.userId) : void 0,
          targetUserId: staffMember._id,
          metadata: { email: staffMember.email, oldRole, newRole: "customer", reason: "Preserved customer order history" }
        });
      } catch {
      }
      res.json({
        success: true,
        message: `Administrator privileges revoked for ${staffMember.email}. Account demoted to Customer to preserve associated order records.`
      });
      return;
    }
    await User.findByIdAndDelete(id);
    try {
      await AuditLog.create({
        action: "ROLE_CHANGED",
        actorId: req.user?.userId ? new mongoose28.Types.ObjectId(req.user.userId) : void 0,
        targetUserId: staffMember._id,
        metadata: { email: staffMember.email, deletedStaffRole: staffMember.role, event: "STAFF_DELETED" }
      });
    } catch {
    }
    res.json({
      success: true,
      message: `Administrator account for ${staffMember.email} has been permanently deleted.`
    });
  } catch (err) {
    console.error("[Admin Staff Delete Error]", err);
    res.status(500).json({ success: false, message: "Failed to remove administrator account." });
  }
});
var adminStaff_default = router13;

// server/routes/adminSettings.ts
import { Router as Router15 } from "express";
import mongoose30 from "mongoose";

// server/routes/adminEmail.ts
import { Router as Router14 } from "express";
import mongoose29 from "mongoose";
import rateLimit7 from "express-rate-limit";
var router14 = Router14();
router14.use(requireAdmin);
var EMAIL_REGEX3 = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var smokeTestLimiter = rateLimit7({
  windowMs: 10 * 60 * 1e3,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new MongoRateLimitStore("admin:email-smoke", 10 * 60 * 1e3),
  message: {
    success: false,
    message: "Too many smoke test requests. Please wait a few minutes before trying again."
  }
});
async function handleSmokeTest(req, res) {
  try {
    const { targetEmail } = req.body || {};
    let recipient = "";
    if (targetEmail) {
      if (typeof targetEmail !== "string" || !EMAIL_REGEX3.test(targetEmail.trim().toLowerCase())) {
        res.status(400).json({
          success: false,
          message: "Invalid target email address format."
        });
        return;
      }
      recipient = targetEmail.trim().toLowerCase();
    } else {
      recipient = req.user?.email || process.env.ADMIN_NOTIFICATION_EMAIL || "malwanamkeenhouse@gmail.com";
    }
    const result = await runEmailSmokeTest({ targetEmail: recipient });
    const maskedRecipient = maskEmail(recipient);
    if (!result.success) {
      const statusCode = result.provider === "none" || result.provider === "unconfigured" ? 503 : 502;
      const cleanError = sanitizeErrorMessage(result.error) || "Email smoke test failed.";
      res.status(statusCode).json({
        success: false,
        message: cleanError,
        recipient: maskedRecipient,
        result: {
          provider: result.provider,
          delivered: Boolean(result.delivered),
          simulated: Boolean(result.simulated),
          error: cleanError
        }
      });
      return;
    }
    res.json({
      success: true,
      message: result.simulated ? `Smoke test simulated successfully for <${maskedRecipient}>.` : `Smoke test email successfully delivered to <${maskedRecipient}>.`,
      recipient: maskedRecipient,
      result: {
        provider: result.provider,
        delivered: Boolean(result.delivered),
        simulated: Boolean(result.simulated),
        messageId: result.messageId || null
      }
    });
  } catch (err) {
    console.error("[Admin Email Smoke Test Error]:", err);
    const msg = err instanceof Error ? err.message : "Internal error during email smoke test.";
    res.status(500).json({ success: false, message: msg });
  }
}
router14.post("/smoke-test", smokeTestLimiter, handleSmokeTest);
router14.get("/status", async (_req, res) => {
  try {
    const config = getEmailConfig();
    const isKeyConfigured = Boolean(
      process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim()
    );
    let totalLogs = 0;
    let recentLogs = [];
    if (mongoose29.connection.readyState === 1) {
      totalLogs = await EmailLog.countDocuments();
      const rawLogs = await EmailLog.find().sort({ createdAt: -1 }).limit(10).select("eventType recipient subject provider status error attemptedAt createdAt").lean();
      recentLogs = rawLogs.map((log) => ({
        ...log,
        recipient: maskEmail(log.recipient)
      }));
    }
    res.json({
      success: true,
      provider: config.provider,
      isConfigured: isKeyConfigured,
      fromEmail: config.emailFrom,
      appBaseUrl: config.appBaseUrl,
      stats: {
        totalLogs
      },
      recentLogs
    });
  } catch (err) {
    console.error("[Admin Email Status Error]:", err);
    res.status(500).json({ success: false, message: "Failed to retrieve email status." });
  }
});
var adminEmail_default = router14;

// server/routes/adminSettings.ts
var router15 = Router15();
async function getOrCreateSingletonSettings() {
  let settings = await StoreSettings.findOne();
  if (!settings) {
    settings = await StoreSettings.create({});
  }
  return settings;
}
var DEFAULT_PUBLIC_SETTINGS = {
  storeName: "MALWA NAMKEEN HOUSE",
  tagline: "THE NAMKEEN & SNACKS HUB",
  description: "Authentic Ratlami Sev, Hing Sev, Ujjaini Mixture, and Mathris crafted with cold-pressed groundnut oil and hand-ground spices.",
  logo: "/logo.png",
  gstNumber: "23AAAAA0000A1Z5",
  fssaiNumber: BUSINESS.fssaiNumber,
  contact: {
    phone: "+91 7987732765",
    email: "malwanamkeenhouse@gmail.com",
    whatsappNumber: "+91 7987732765",
    address: {
      line1: "Near Mahakaleshwar Temple",
      line2: "Sarafa Bazaar",
      city: "Ujjain",
      state: "Madhya Pradesh",
      pincode: "456001"
    }
  },
  businessHours: {
    openingTime: "08:00 AM",
    closingTime: "10:00 PM",
    daysOpen: "All 7 Days"
  },
  deliverySettings: {
    freeDeliveryThreshold: 500,
    standardShippingFee: 50,
    estimatedDeliveryDays: "3-5 Business Days"
  },
  socialLinks: {
    instagram: "",
    facebook: "",
    twitter: ""
  },
  policies: {
    termsAndConditions: "",
    privacyPolicy: "",
    refundPolicy: ""
  }
};
var handlePublicSettings = async (_req, res) => {
  try {
    let settings = null;
    if (mongoose30.connection.readyState === 1) {
      settings = await StoreSettings.findOne().lean();
    }
    if (!settings) {
      settings = await getOrCreateSingletonSettings();
    }
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
    res.json({
      success: true,
      settings
    });
  } catch (_err) {
    res.json({ success: true, settings: DEFAULT_PUBLIC_SETTINGS });
  }
};
var publicSettingsRouter = Router15();
publicSettingsRouter.get("/public", handlePublicSettings);
publicSettingsRouter.get("/", handlePublicSettings);
router15.use(requireAdmin);
router15.get("/", async (_req, res) => {
  try {
    const settings = await getOrCreateSingletonSettings();
    res.json({
      success: true,
      settings
    });
  } catch (err) {
    console.error("[Admin Settings Error]", err);
    res.status(500).json({ success: false, message: "Failed to retrieve store settings." });
  }
});
router15.put("/", requireAdmin, async (req, res) => {
  try {
    const payload = req.body;
    const settings = await getOrCreateSingletonSettings();
    if (payload.storeName) settings.storeName = String(payload.storeName).trim();
    if (payload.tagline !== void 0) settings.tagline = String(payload.tagline).trim();
    if (payload.description !== void 0) settings.description = String(payload.description).trim();
    if (payload.logo !== void 0) settings.logo = String(payload.logo).trim();
    if (payload.gstNumber !== void 0) settings.gstNumber = String(payload.gstNumber).trim();
    if (payload.fssaiNumber !== void 0) settings.fssaiNumber = String(payload.fssaiNumber).trim();
    if (payload.contact && typeof payload.contact === "object") {
      settings.contact = {
        phone: payload.contact.phone ? String(payload.contact.phone).trim() : settings.contact.phone,
        email: payload.contact.email ? String(payload.contact.email).trim().toLowerCase() : settings.contact.email,
        whatsappNumber: payload.contact.whatsappNumber ? String(payload.contact.whatsappNumber).trim() : settings.contact.whatsappNumber,
        address: {
          line1: payload.contact.address?.line1 ?? settings.contact.address.line1,
          line2: payload.contact.address?.line2 ?? settings.contact.address.line2,
          city: payload.contact.address?.city ?? settings.contact.address.city,
          state: payload.contact.address?.state ?? settings.contact.address.state,
          postalCode: payload.contact.address?.postalCode ?? settings.contact.address.postalCode,
          country: payload.contact.address?.country ?? settings.contact.address.country,
          full: payload.contact.address?.full ?? settings.contact.address.full
        }
      };
    }
    if (Array.isArray(payload.businessHours)) {
      settings.businessHours = payload.businessHours;
    }
    if (payload.deliverySettings && typeof payload.deliverySettings === "object") {
      settings.deliverySettings = {
        freeShippingThreshold: payload.deliverySettings.freeShippingThreshold !== void 0 ? Number(payload.deliverySettings.freeShippingThreshold) : settings.deliverySettings.freeShippingThreshold,
        standardShippingFee: payload.deliverySettings.standardShippingFee !== void 0 ? Number(payload.deliverySettings.standardShippingFee) : settings.deliverySettings.standardShippingFee,
        estimatedDeliveryDays: payload.deliverySettings.estimatedDeliveryDays !== void 0 ? String(payload.deliverySettings.estimatedDeliveryDays).trim() : settings.deliverySettings.estimatedDeliveryDays,
        codEnabled: payload.deliverySettings.codEnabled !== void 0 ? Boolean(payload.deliverySettings.codEnabled) : settings.deliverySettings.codEnabled,
        minOrderValue: payload.deliverySettings.minOrderValue !== void 0 ? Number(payload.deliverySettings.minOrderValue) : settings.deliverySettings.minOrderValue
      };
    }
    if (payload.socialLinks && typeof payload.socialLinks === "object") {
      settings.socialLinks = {
        instagram: payload.socialLinks.instagram ?? settings.socialLinks.instagram,
        facebook: payload.socialLinks.facebook ?? settings.socialLinks.facebook,
        youtube: payload.socialLinks.youtube ?? settings.socialLinks.youtube,
        twitter: payload.socialLinks.twitter ?? settings.socialLinks.twitter,
        googleMapsUrl: payload.socialLinks.googleMapsUrl ?? settings.socialLinks.googleMapsUrl
      };
    }
    if (payload.policies && typeof payload.policies === "object") {
      settings.policies = {
        privacyPolicy: payload.policies.privacyPolicy ?? settings.policies?.privacyPolicy,
        termsConditions: payload.policies.termsConditions ?? settings.policies?.termsConditions,
        cancellationPolicy: payload.policies.cancellationPolicy ?? settings.policies?.cancellationPolicy,
        refundPolicy: payload.policies.refundPolicy ?? settings.policies?.refundPolicy,
        shippingPolicy: payload.policies.shippingPolicy ?? settings.policies?.shippingPolicy
      };
    }
    await settings.save();
    res.json({
      success: true,
      message: "Store settings updated successfully.",
      settings
    });
  } catch (err) {
    console.error("[Update Settings Error]", err);
    const msg = err instanceof Error ? err.message : "Failed to update store settings.";
    res.status(400).json({ success: false, message: msg });
  }
});
router15.post("/email/smoke-test", handleSmokeTest);
var adminSettings_default = router15;

// server/routes/adminDashboard.ts
import { Router as Router16 } from "express";
var router16 = Router16();
router16.use(requireAdmin);
router16.get("/stats", async (req, res) => {
  try {
    const { range = "30d" } = req.query;
    const now = /* @__PURE__ */ new Date();
    let startDate = /* @__PURE__ */ new Date();
    if (range === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "7d") {
      startDate.setDate(now.getDate() - 7);
    } else if (range === "90d") {
      startDate.setDate(now.getDate() - 90);
    } else {
      startDate.setDate(now.getDate() - 30);
    }
    const [
      totalOrders,
      pendingOrders,
      paidRevenueAgg,
      totalCustomers,
      totalProducts,
      activeProducts,
      totalCategories,
      activeDiscounts,
      newInquiries,
      statusBreakdownAgg,
      recentOrdersRaw,
      recentCustomers,
      recentInquiries,
      allProductsForStock,
      trendsAgg
    ] = await Promise.all([
      // Total orders count
      Order.countDocuments(),
      // Orders needing fulfillment attention
      Order.countDocuments({ orderStatus: { $in: ["pending", "confirmed", "processing"] } }),
      // Revenue aggregation for paid/confirmed orders
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$total" },
            paidCount: { $sum: 1 }
          }
        }
      ]).option({ maxTimeMS: 5e3 }),
      // Total registered customers
      User.countDocuments({ role: "customer" }),
      // Products
      Product.countDocuments(),
      Product.countDocuments({ active: true }),
      // Categories
      Category.countDocuments({ active: true }),
      // Discounts
      Discount.countDocuments({ active: true }),
      // New unread inquiries
      Inquiry.countDocuments({ status: "new" }),
      // Order status breakdown
      Order.aggregate([
        {
          $group: {
            _id: "$orderStatus",
            count: { $sum: 1 }
          }
        }
      ]).option({ maxTimeMS: 5e3 }),
      // Recent 6 orders
      Order.find().sort({ createdAt: -1 }).limit(6).select("orderNumber customerInfo total orderStatus paymentStatus items createdAt").lean(),
      // Recent 5 customers
      User.find({ role: "customer" }).sort({ createdAt: -1 }).limit(5).select("name email phone active createdAt").lean(),
      // Recent 5 inquiries
      Inquiry.find().sort({ createdAt: -1 }).limit(5).select("name email phone category message status createdAt").lean(),
      // Products for low-stock scanning
      Product.find({ active: true }).select("name slug variants").maxTimeMS(5e3).lean(),
      // Daily trends for the selected range
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            orders: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$total", 0]
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]).option({ maxTimeMS: 5e3 })
    ]);
    const totalRevenue = paidRevenueAgg[0]?.totalRevenue || 0;
    const paidCount = paidRevenueAgg[0]?.paidCount || 0;
    const averageOrderValue = paidCount > 0 ? Math.round(totalRevenue / paidCount * 100) / 100 : 0;
    const statusMap = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };
    for (const item of statusBreakdownAgg) {
      if (item._id) statusMap[item._id] = item.count;
    }
    const lowStockItems = [];
    for (const p of allProductsForStock) {
      if (Array.isArray(p.variants)) {
        for (const v of p.variants) {
          if (v.active !== false && typeof v.stock === "number" && v.stock <= 15) {
            lowStockItems.push({
              productId: String(p._id),
              productName: p.name,
              variantLabel: v.label || `${v.value || ""} ${v.unit || ""}`.trim() || "Standard",
              sku: v.sku || "N/A",
              stock: v.stock
            });
          }
        }
      }
    }
    const recentOrders = recentOrdersRaw.map((o) => ({
      _id: o._id,
      orderNumber: o.orderNumber,
      customerName: o.customerInfo?.name || "Guest Patron",
      customerPhone: o.customerInfo?.phone || "",
      total: o.total,
      orderStatus: o.orderStatus,
      paymentStatus: o.paymentStatus,
      itemsCount: Array.isArray(o.items) ? o.items.reduce((sum, it) => sum + (it.quantity || 1), 0) : 0,
      createdAt: o.createdAt
    }));
    res.json({
      success: true,
      metrics: {
        totalRevenue,
        averageOrderValue,
        totalOrders,
        pendingOrders,
        totalCustomers,
        totalProducts,
        activeProducts,
        totalCategories,
        activeDiscounts,
        newInquiries
      },
      statusBreakdown: statusMap,
      lowStockItems: lowStockItems.slice(0, 8),
      recentOrders,
      recentCustomers,
      recentInquiries,
      trends: trendsAgg.map((t) => ({
        date: t._id,
        orders: t.orders,
        revenue: t.revenue
      }))
    });
  } catch (err) {
    console.error("[Admin Dashboard Stats Error]", err);
    res.status(500).json({ success: false, message: "Failed to aggregate dashboard analytics." });
  }
});
var adminDashboard_default = router16;

// server/routes/uploads.ts
import { Router as Router17 } from "express";
import multer from "multer";

// server/lib/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "node:stream";
function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}
configureCloudinary();
var ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/x-png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/svg+xml"
];
var MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024;
function getUploadFolder(target) {
  if (target === "categories") {
    return "malwa-namkeen-house/categories";
  }
  if (target === "products") {
    return "malwa-namkeen-house/products";
  }
  if (target === "banners") {
    return "malwa-namkeen-house/banners";
  }
  if (target === "logo") {
    return "malwa-namkeen-house/logo";
  }
  if (target === "gallery") {
    return "malwa-namkeen-house/gallery";
  }
  return `malwa-namkeen-house/${target.replace(/^malwa-namkeen-house\/?/, "")}`;
}
function uploadImageBuffer(buffer, target = "products", customFilename) {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return Promise.reject(new Error("Cloudinary credentials are not configured. Upload is unavailable."));
  }
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const folder = getUploadFolder(target);
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const baseName = customFilename ? customFilename.replace(/\.[^/.]+$/, "").replace(/[^\w-]/g, "_") : "img";
    const publicId = `${baseName}_${uniqueSuffix}`;
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        public_id: publicId,
        overwrite: false
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary upload returned empty response."));
          return;
        }
        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes
        });
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}
async function uploadImageBase64(base64Data, target = "products") {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary credentials are not configured. Upload is unavailable.");
  }
  configureCloudinary();
  const folder = getUploadFolder(target);
  const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const publicId = `img_${uniqueSuffix}`;
  const result = await cloudinary.uploader.upload(base64Data, {
    folder,
    resource_type: "image",
    public_id: publicId,
    overwrite: false
  });
  return {
    secureUrl: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes
  };
}
async function deleteImage(publicId) {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary credentials are not configured. Deletion is unavailable.");
  }
  configureCloudinary();
  if (!publicId || typeof publicId !== "string") {
    throw new Error("publicId is required.");
  }
  const clean = publicId.trim().replace(/\\/g, "/");
  if (!clean.startsWith("malwa-namkeen-house/") || clean.includes("..") || clean.includes("%2e") || clean.includes("%2E") || !/^malwa-namkeen-house\/[a-zA-Z0-9_\-\/]+$/.test(clean)) {
    throw new Error("Deletion restricted: publicId must belong to malwa-namkeen-house namespace.");
  }
  const res = await cloudinary.uploader.destroy(clean, { resource_type: "image" });
  return {
    success: res.result === "ok",
    result: res.result
  };
}

// server/routes/uploads.ts
var router17 = Router17();
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES
  },
  fileFilter: (_req, file, cb) => {
    const mime = (file.mimetype || "").toLowerCase();
    const isImage = mime.startsWith("image/") || ALLOWED_MIME_TYPES.includes(mime);
    if (isImage || /\.(jpe?g|png|webp|avif|gif|heic|heif|svg)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: JPEG, PNG, WebP, AVIF, GIF, HEIC.`));
    }
  }
});
router17.post(
  "/",
  requireAdmin,
  (req, res, next) => {
    const contentType = req.headers["content-type"] || "";
    if (contentType.includes("multipart/form-data")) {
      upload.single("image")(req, res, (err) => {
        if (err) {
          if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
            res.status(400).json({
              success: false,
              message: `Image too large. Maximum allowed size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`
            });
            return;
          }
          res.status(400).json({ success: false, message: err.message });
          return;
        }
        next();
      });
    } else {
      next();
    }
  },
  async (req, res) => {
    try {
      const targetParam = req.body.target || req.query.target || "products";
      const validTargets = ["products", "categories", "banners", "logo", "gallery"];
      const target = validTargets.includes(targetParam) ? targetParam : "products";
      if (req.file) {
        const result2 = await uploadImageBuffer(
          req.file.buffer,
          target,
          req.file.originalname
        );
        res.status(201).json({
          success: true,
          message: "Image uploaded successfully.",
          ...result2
        });
        return;
      }
      const { image, base64 } = req.body;
      const imageData = image || base64;
      if (!imageData || typeof imageData !== "string") {
        res.status(400).json({
          success: false,
          message: "Please provide an image file (multipart/form-data) or a base64 image string."
        });
        return;
      }
      const result = await uploadImageBase64(imageData, target);
      res.status(201).json({
        success: true,
        message: "Image uploaded successfully.",
        ...result
      });
    } catch (err) {
      console.error("[Cloudinary Upload Error]", err instanceof Error ? err.message : err);
      res.status(500).json({
        success: false,
        message: "Image upload failed. Check Cloudinary credentials and try again."
      });
    }
  }
);
router17.delete("/", requireAdmin, async (req, res) => {
  try {
    const publicId = req.body.publicId || req.query.publicId;
    if (!publicId || typeof publicId !== "string") {
      res.status(400).json({ success: false, message: "publicId is required." });
      return;
    }
    const result = await deleteImage(publicId);
    res.json({
      success: true,
      message: "Asset removed successfully.",
      ...result
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ success: false, message: msg });
  }
});
var uploads_default = router17;

// server/routes/enquiries.ts
import { Router as Router18 } from "express";
import { ZodError } from "zod";
import mongoose31 from "mongoose";

// server/validate.ts
import { z } from "zod";
var name = z.string({ error: "Name is required." }).min(2, "Name must be at least 2 characters.").max(120, "Name is too long.").transform((s) => s.trim().replace(/\s+/g, " "));
var email = z.string({ error: "Email address is required." }).email("Please enter a valid email address.").max(254).transform((s) => s.trim().toLowerCase());
var emailOptional = z.string().email("Please enter a valid email address.").max(254).transform((s) => s.trim().toLowerCase()).optional().or(z.literal(""));
var phone = z.string({ error: "Phone number is required." }).min(7, "Please enter a valid phone number.").max(20, "Phone number is too long.").transform((s) => s.trim().replace(/[^\d\s+\-()]/g, ""));
var phoneOptional = z.string().max(20).transform((s) => s.trim().replace(/[^\d\s+\-()]/g, "")).optional().or(z.literal(""));
var message = z.string({ error: "Message is required." }).min(10, "Please provide at least 10 characters so we can understand your enquiry.").max(2e3, "Message is too long (max 2000 characters).").transform((s) => s.trim());
var messageOptional = z.string().max(2e3).transform((s) => s.trim()).optional().or(z.literal(""));
var consent = z.boolean({ error: "Please accept the terms to proceed." }).refine((v) => v === true, { message: "Please accept the terms to proceed." });
var locationId = z.string().optional().transform((v) => v ?? "bengaluru-sarjapur").refine((v) => VALID_LOCATION_IDS.includes(v), { message: "Invalid location." });
var honeypot = z.string().optional().refine((v) => !v || v.trim() === "", { message: "Submission rejected." });
var contactSchema = z.object({
  name,
  email,
  phone: phoneOptional,
  category: z.string({ error: "Please select an enquiry category." }).refine((v) => VALID_CATEGORIES.includes(v), { message: "Invalid category." }),
  message,
  consent_accepted: consent,
  location_id: locationId,
  _hp: honeypot
  // honeypot — must be empty
});
var reservationSchema = z.object({
  customer_name: name,
  email,
  phone,
  reservation_date: z.string({ error: "Please select a date." }).regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format.").refine((v) => {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(v) >= today;
  }, { message: "Reservation date cannot be in the past." }),
  preferred_time: z.string({ error: "Please select a preferred time." }).min(3, "Please select a preferred time.").max(50),
  guest_count: z.union([z.string(), z.number()]).transform((v) => Number(v)).refine((v) => Number.isInteger(v) && v >= 1, {
    message: "Guest count must be at least 1."
  }),
  special_request: messageOptional,
  consent_accepted: consent,
  location_id: locationId,
  _hp: honeypot
});
var ALLOWED_REQUIREMENT_TYPES = [
  "Corporate Gifting",
  "Wedding / Event",
  "Festival Gifting",
  "Bulk Namkeen Order",
  "Retail / Reseller Enquiry",
  "Other"
];
var bulkEnquirySchema = z.object({
  name,
  email,
  phone,
  company_name: z.string().max(120).transform((s) => s.trim()).optional().or(z.literal("")),
  requirement_type: z.string({ error: "Please select a requirement type." }).refine((v) => ALLOWED_REQUIREMENT_TYPES.includes(v), {
    message: "Invalid requirement type selected."
  }),
  approx_quantity: z.string({ error: "Please provide approximate quantity." }).min(1, "Please provide approximate quantity.").max(100).transform((s) => s.trim()),
  approx_budget: z.string().max(100).transform((s) => s.trim()).optional().or(z.literal("")),
  required_by_date: z.string().optional().or(z.literal("")).refine((v) => {
    if (!v || v.trim() === "") return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(v) >= today;
  }, { message: "Required by date cannot be in the past." }),
  delivery_city_pincode: z.string({ error: "Delivery city or pincode is required." }).min(2, "Please enter delivery city or pincode.").max(120).transform((s) => s.trim()),
  message: messageOptional,
  consent_accepted: consent,
  _hp: honeypot
});
var kateringSchema = z.object({
  name,
  email: emailOptional,
  phone,
  event_type: z.string({ error: "Event type is required." }).min(2).max(120).transform((s) => s.trim()),
  occasion: z.string().max(120).transform((s) => s.trim()).optional().or(z.literal("")),
  guest_count: z.union([z.string(), z.number()]).optional().transform((v) => v != null && v !== "" ? Number(v) : void 0).refine((v) => v === void 0 || Number.isInteger(v) && v > 0, {
    message: "Guest count must be a positive number."
  }),
  date: z.string().max(50).optional().or(z.literal("")),
  message: messageOptional,
  consent_accepted: consent,
  location_id: locationId,
  _hp: honeypot
});
var giftingSchema = z.object({
  name,
  email: emailOptional,
  phone,
  gift_type: z.string({ error: "Please specify the gift type." }).min(2).max(120).transform((s) => s.trim()),
  quantity: z.union([z.string(), z.number()]).optional().transform((v) => v != null && v !== "" ? Number(v) : void 0).refine((v) => v === void 0 || Number.isInteger(v) && v > 0, {
    message: "Quantity must be a positive number."
  }),
  message: messageOptional,
  consent_accepted: consent,
  location_id: locationId,
  _hp: honeypot
});
function zodToFieldErrors(err) {
  return err.issues.map((e) => ({
    field: e.path.join(".") || "form",
    message: e.message
  }));
}

// server/lib/whatsapp.ts
var BASE = `https://wa.me/${BUSINESS.whatsappNumber}`;
function buildWhatsAppUrl(message2) {
  return `${BASE}?text=${encodeURIComponent(message2)}`;
}
var WA_URLS = {
  general: buildWhatsAppUrl("Hello, I have a question about Malwa Namkeen House."),
  reservation: buildWhatsAppUrl("Hello, I would like to follow up on my enquiry at Malwa Namkeen House."),
  catering: buildWhatsAppUrl("Hello, I would like to enquire about bulk namkeen & catering services at Malwa Namkeen House."),
  gifting: buildWhatsAppUrl("Hello, I would like to enquire about festive gifting options at Malwa Namkeen House."),
  birthday: buildWhatsAppUrl("Hello, I would like to enquire about event savouries at Malwa Namkeen House."),
  bulkOrders: buildWhatsAppUrl("Hello, I would like to place a bulk order with Malwa Namkeen House."),
  corporate: buildWhatsAppUrl("Hello, I would like to enquire about corporate gifting at Malwa Namkeen House.")
};
function getWaUrlForCategory(category) {
  const map = {
    general_enquiry: WA_URLS.general,
    catering: WA_URLS.catering,
    bulk_orders: WA_URLS.bulkOrders,
    corporate_gifting: WA_URLS.corporate,
    birthday_parties_events: WA_URLS.birthday
  };
  return map[category] ?? WA_URLS.general;
}

// server/routes/enquiries.ts
import rateLimit8 from "express-rate-limit";
var router18 = Router18();
var enquiryLimiter = rateLimit8({
  windowMs: 15 * 60 * 1e3,
  max: process.env.NODE_ENV === "production" && !process.env.CI ? 5 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { default: false },
  skip: () => process.env.NODE_ENV === "test" || process.env.IS_E2E_TEST === "true" || Boolean(process.env.CI),
  store: new MongoRateLimitStore({ prefix: "enquiry:submit", windowMs: 15 * 60 * 1e3, failClosed: false }),
  message: {
    success: false,
    message: "Too many requests. Please wait a few minutes before submitting another enquiry, or connect directly on WhatsApp.",
    whatsappUrl: WA_URLS.general || "https://wa.me/917987732765"
  }
});
function categoryLabel(value) {
  return ENQUIRY_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
function isoNow() {
  return (/* @__PURE__ */ new Date()).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }) + " IST";
}
router18.post("/contact", enquiryLimiter, async (req, res) => {
  if (req.body._hp) {
    res.json({ success: true, message: "Your enquiry has been received. Our team will contact you shortly." });
    return;
  }
  let parsed;
  try {
    parsed = contactSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: "Please check the form and try again.",
        fieldErrors: Object.fromEntries(
          zodToFieldErrors(err).map((e) => [e.field, e.message])
        )
      });
      return;
    }
    throw err;
  }
  if (mongoose31.connection.readyState !== 1) {
    try {
      await connectMongoDB();
    } catch (dbErr) {
      console.warn("[Enquiries Contact] DB reconnect attempt failed:", dbErr instanceof Error ? dbErr.message : dbErr);
    }
  }
  if (mongoose31.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      message: "Enquiry database temporarily unavailable. Please reach out to us on WhatsApp or try again shortly.",
      whatsappUrl: getWaUrlForCategory(parsed.category)
    });
    return;
  }
  const cleanEmail = parsed.email.trim().toLowerCase();
  const cleanMessage = parsed.message.trim();
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1e3);
  const existingRecent = await Inquiry.findOne({
    email: cleanEmail,
    message: cleanMessage,
    createdAt: { $gte: twoMinutesAgo }
  });
  if (existingRecent) {
    const refId = existingRecent.referenceId || `MN-ENQ-${existingRecent._id.toString().slice(-6).toUpperCase()}`;
    res.status(200).json({
      success: true,
      duplicate: true,
      message: "Your enquiry has already been received. Our team will contact you shortly.",
      referenceId: refId,
      inquiryId: existingRecent._id,
      whatsappUrl: getWaUrlForCategory(parsed.category),
      emailDelivered: existingRecent.emailDeliveryStatus === "sent" || existingRecent.emailDeliveryStatus === "simulated",
      emailStatus: existingRecent.emailDeliveryStatus || "pending"
    });
    return;
  }
  const newDocId = new mongoose31.Types.ObjectId();
  const referenceId = `MN-ENQ-${newDocId.toString().slice(-6).toUpperCase()}`;
  let doc;
  try {
    doc = await Inquiry.create({
      _id: newDocId,
      name: parsed.name.trim(),
      email: cleanEmail,
      phone: parsed.phone ? parsed.phone.trim() : "",
      category: parsed.category,
      message: cleanMessage,
      status: "new",
      referenceId,
      emailDeliveryStatus: "pending"
    });
  } catch (saveErr) {
    console.error("[Contact] MongoDB save error:", saveErr instanceof Error ? saveErr.message : saveErr);
    res.status(503).json({
      success: false,
      message: "Failed to record your enquiry. Please reach out on WhatsApp or try again shortly.",
      whatsappUrl: getWaUrlForCategory(parsed.category)
    });
    return;
  }
  const emailData = {
    referenceId,
    customerName: parsed.name,
    customerEmail: cleanEmail,
    phone: parsed.phone ?? "",
    category: parsed.category,
    categoryLabel: categoryLabel(parsed.category),
    message: parsed.message,
    locationId: parsed.location_id,
    submittedAt: isoNow()
  };
  let emailResult = { success: false, provider: "none", delivered: false };
  try {
    const results = await Promise.allSettled([
      sendContactCustomerEmail(emailData),
      sendContactAdminEmail(emailData)
    ]);
    if (results[0].status === "fulfilled") {
      emailResult = results[0].value;
    }
  } catch (emailErr) {
    console.warn("[Contact Email Warning] Failed to dispatch contact emails:", emailErr);
  }
  const deliveryStatus = emailResult.simulated ? "simulated" : emailResult.delivered ? "sent" : emailResult.provider === "unconfigured" ? "unconfigured" : "failed";
  await Inquiry.findByIdAndUpdate(doc._id, {
    emailDeliveryStatus: deliveryStatus,
    emailError: emailResult.error || null,
    emailDeliveredAt: emailResult.delivered ? /* @__PURE__ */ new Date() : null
  });
  res.status(201).json({
    success: true,
    message: emailResult.delivered || emailResult.simulated ? "Your enquiry has been received and confirmed. Our team will contact you shortly." : "Your enquiry has been safely received and registered. Connect with us on WhatsApp for immediate assistance.",
    referenceId,
    inquiryId: doc._id,
    whatsappUrl: getWaUrlForCategory(parsed.category),
    emailDelivered: Boolean(emailResult.delivered),
    emailStatus: deliveryStatus
  });
});
router18.post(["/enquiries/bulk", "/enquiry/bulk", "/bulk-enquiry"], enquiryLimiter, async (req, res) => {
  if (req.body._hp) {
    res.json({ success: true, message: "Bulk & gifting enquiry received. Our team will contact you shortly." });
    return;
  }
  let parsed;
  try {
    parsed = bulkEnquirySchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: "Please check the form and try again.",
        fieldErrors: Object.fromEntries(
          zodToFieldErrors(err).map((e) => [e.field, e.message])
        )
      });
      return;
    }
    throw err;
  }
  if (mongoose31.connection.readyState !== 1) {
    try {
      await connectMongoDB();
    } catch {
    }
  }
  if (mongoose31.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      message: "Enquiry database temporarily unavailable. Please contact us on WhatsApp.",
      whatsappUrl: WA_URLS.catering || "https://wa.me/917987732765"
    });
    return;
  }
  const summaryMessage = [
    `Requirement: ${parsed.requirement_type}`,
    `Quantity: ${parsed.approx_quantity}`,
    parsed.company_name ? `Company: ${parsed.company_name}` : "",
    parsed.approx_budget ? `Budget: ${parsed.approx_budget}` : "",
    parsed.required_by_date ? `Required By: ${parsed.required_by_date}` : "",
    `Delivery To: ${parsed.delivery_city_pincode}`,
    parsed.message ? `Notes: ${parsed.message}` : ""
  ].filter(Boolean).join(" | ");
  const newDocId = new mongoose31.Types.ObjectId();
  const referenceId = `MN-ENQ-${newDocId.toString().slice(-6).toUpperCase()}`;
  let doc;
  try {
    doc = await Inquiry.create({
      _id: newDocId,
      name: parsed.name.trim(),
      email: parsed.email.trim().toLowerCase(),
      phone: parsed.phone ? parsed.phone.trim() : "",
      category: "bulk_gifting",
      message: summaryMessage,
      status: "new",
      referenceId,
      emailDeliveryStatus: "pending"
    });
  } catch (err) {
    console.error("[Bulk Enquiry] MongoDB save error:", err instanceof Error ? err.message : err);
    res.status(503).json({
      success: false,
      message: "Failed to record your enquiry. Please reach out to us on WhatsApp.",
      whatsappUrl: WA_URLS.catering || "https://wa.me/917987732765"
    });
    return;
  }
  const emailData = {
    referenceId,
    customerName: parsed.name,
    customerEmail: parsed.email,
    phone: parsed.phone,
    category: "bulk_gifting",
    categoryLabel: `Bulk & Gifting (${parsed.requirement_type})`,
    message: summaryMessage,
    locationId: "indore-headquarters",
    submittedAt: isoNow()
  };
  try {
    await Promise.allSettled([
      sendContactCustomerEmail(emailData),
      sendContactAdminEmail(emailData)
    ]);
  } catch (emailErr) {
    console.warn("[Bulk Enquiry Email Warning]:", emailErr);
  }
  res.status(201).json({
    success: true,
    message: "Your bulk & corporate gifting enquiry has been received. Our team will contact you with customized rates shortly.",
    referenceId,
    inquiryId: doc._id,
    whatsappUrl: WA_URLS.catering || "https://wa.me/917987732765"
  });
});
router18.post("/reservation", enquiryLimiter, async (req, res) => {
  if (req.body._hp) {
    res.json({ success: true, message: "Reservation enquiry received." });
    return;
  }
  let parsed;
  try {
    parsed = reservationSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: "Please check the form and try again.",
        fieldErrors: Object.fromEntries(
          zodToFieldErrors(err).map((e) => [e.field, e.message])
        )
      });
      return;
    }
    throw err;
  }
  if (mongoose31.connection.readyState !== 1) {
    try {
      await connectMongoDB();
    } catch {
    }
  }
  if (mongoose31.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      message: "Reservation service temporarily unavailable. Please connect on WhatsApp.",
      whatsappUrl: WA_URLS.reservation
    });
    return;
  }
  const newDocId = new mongoose31.Types.ObjectId();
  const referenceId = `MN-ENQ-${newDocId.toString().slice(-6).toUpperCase()}`;
  let doc;
  try {
    doc = await Inquiry.create({
      _id: newDocId,
      name: parsed.customer_name.trim(),
      email: parsed.email.trim().toLowerCase(),
      phone: parsed.phone ? parsed.phone.trim() : "",
      category: "reservation",
      message: parsed.special_request || `Reservation request for ${parsed.guest_count} guests on ${parsed.reservation_date} at ${parsed.preferred_time}`,
      status: "new",
      referenceId,
      emailDeliveryStatus: "pending"
    });
  } catch (err) {
    console.error("[Reservation] MongoDB save error:", err instanceof Error ? err.message : err);
    res.status(503).json({
      success: false,
      message: "Failed to record reservation enquiry. Please WhatsApp us.",
      whatsappUrl: WA_URLS.reservation
    });
    return;
  }
  const emailData = {
    referenceId,
    customerName: parsed.customer_name,
    customerEmail: parsed.email,
    phone: parsed.phone,
    reservationDate: parsed.reservation_date,
    preferredTime: parsed.preferred_time,
    guestCount: parsed.guest_count,
    specialRequest: parsed.special_request ?? "",
    locationId: parsed.location_id,
    submittedAt: isoNow()
  };
  try {
    await Promise.allSettled([
      sendReservationCustomerEmail(emailData),
      sendReservationAdminEmail(emailData)
    ]);
  } catch (emailErr) {
    console.warn("[Reservation Email Warning]:", emailErr);
  }
  res.status(201).json({
    success: true,
    message: "Reservation enquiry received. This is not a confirmed booking yet. Our team will contact you to confirm availability.",
    referenceId,
    inquiryId: doc._id,
    whatsappUrl: WA_URLS.reservation
  });
});
router18.post("/katering", enquiryLimiter, async (req, res) => {
  if (req.body._hp) {
    res.json({ success: true, message: "Enquiry received." });
    return;
  }
  let parsed;
  try {
    parsed = kateringSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: "Please check the form and try again.",
        fieldErrors: Object.fromEntries(
          zodToFieldErrors(err).map((e) => [e.field, e.message])
        )
      });
      return;
    }
    throw err;
  }
  if (mongoose31.connection.readyState !== 1) {
    try {
      await connectMongoDB();
    } catch {
    }
  }
  if (mongoose31.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      message: "Catering enquiry service temporarily unavailable. Please contact us on WhatsApp.",
      whatsappUrl: WA_URLS.catering
    });
    return;
  }
  const newDocId = new mongoose31.Types.ObjectId();
  const referenceId = `MN-ENQ-${newDocId.toString().slice(-6).toUpperCase()}`;
  let doc;
  try {
    doc = await Inquiry.create({
      _id: newDocId,
      name: parsed.name.trim(),
      email: (parsed.email || "not-provided@customer.local").trim().toLowerCase(),
      phone: parsed.phone ? parsed.phone.trim() : "",
      category: "catering",
      message: `Event: ${parsed.event_type}, Occasion: ${parsed.occasion || ""}, Guests: ${parsed.guest_count || ""}. Message: ${parsed.message || ""}`,
      status: "new",
      referenceId,
      emailDeliveryStatus: "pending"
    });
  } catch (err) {
    console.error("[Katering] MongoDB save error:", err instanceof Error ? err.message : err);
    res.status(503).json({
      success: false,
      message: "Failed to record catering enquiry. Please WhatsApp us.",
      whatsappUrl: WA_URLS.catering
    });
    return;
  }
  res.status(201).json({
    success: true,
    message: "Catering enquiry received. Our events team will reach out within 24 hours.",
    referenceId,
    inquiryId: doc._id,
    whatsappUrl: WA_URLS.catering
  });
});
router18.post("/gifting", enquiryLimiter, async (req, res) => {
  if (req.body._hp) {
    res.json({ success: true, message: "Enquiry received." });
    return;
  }
  let parsed;
  try {
    parsed = giftingSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: "Please check the form and try again.",
        fieldErrors: Object.fromEntries(
          zodToFieldErrors(err).map((e) => [e.field, e.message])
        )
      });
      return;
    }
    throw err;
  }
  if (mongoose31.connection.readyState !== 1) {
    try {
      await connectMongoDB();
    } catch {
    }
  }
  if (mongoose31.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      message: "Gifting enquiry service temporarily unavailable. Please contact us on WhatsApp.",
      whatsappUrl: WA_URLS.gifting
    });
    return;
  }
  const newDocId = new mongoose31.Types.ObjectId();
  const referenceId = `MN-ENQ-${newDocId.toString().slice(-6).toUpperCase()}`;
  let doc;
  try {
    doc = await Inquiry.create({
      _id: newDocId,
      name: parsed.name.trim(),
      email: (parsed.email || "not-provided@customer.local").trim().toLowerCase(),
      phone: parsed.phone ? parsed.phone.trim() : "",
      category: "gifting",
      message: parsed.message || `Gifting inquiry for ${parsed.gift_type}, Quantity: ${parsed.quantity || ""}`,
      status: "new",
      referenceId,
      emailDeliveryStatus: "pending"
    });
  } catch (err) {
    console.error("[Gifting] MongoDB save error:", err instanceof Error ? err.message : err);
    res.status(503).json({
      success: false,
      message: "Failed to record gift enquiry. Please WhatsApp us.",
      whatsappUrl: WA_URLS.gifting
    });
    return;
  }
  res.status(201).json({
    success: true,
    message: "Gift enquiry received. We will prepare options for you shortly.",
    referenceId,
    inquiryId: doc._id,
    whatsappUrl: WA_URLS.gifting
  });
});
var enquiries_default = router18;

// server/routes/adminBanners.ts
import { Router as Router19 } from "express";

// server/models/Banner.ts
import mongoose32, { Schema as Schema12 } from "mongoose";
var bannerSchema = new Schema12(
  {
    title: {
      type: String,
      required: [true, "Banner title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"]
    },
    alt: {
      type: String,
      trim: true,
      default: ""
    },
    image: {
      type: String,
      required: [true, "Banner image URL is required"],
      trim: true
    },
    mobileImage: {
      type: String,
      trim: true,
      default: ""
    },
    link: {
      type: String,
      trim: true,
      default: "/shop"
    },
    badge: {
      type: String,
      trim: true,
      default: ""
    },
    active: {
      type: Boolean,
      default: true
    },
    sortOrder: {
      type: Number,
      default: 0
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);
bannerSchema.index({ active: 1, sortOrder: 1 });
bannerSchema.index({ sortOrder: 1 });
var Banner = mongoose32.models.Banner || mongoose32.model("Banner", bannerSchema);

// server/routes/adminBanners.ts
var router19 = Router19();
var DEFAULT_BANNERS = [
  {
    title: "Pure Malwa Heritage in Every Crunchy Bite",
    alt: "Pure Malwa Heritage in Every Crunchy Bite - Special Ratlami Sev & Artisanal Namkeens",
    image: "/hero-banner-1.png",
    link: "/shop",
    active: true,
    sortOrder: 0
  },
  {
    title: "Add the Malwa Crunch: Complete Your Snack Time",
    alt: "Add the Malwa Crunch: Complete Your Snack Time - Roasted Not Fried, No Palm Oil",
    image: "/hero-banner-2.png",
    link: "/shop",
    active: true,
    sortOrder: 1
  }
];
async function ensureInitialBanners() {
  try {
    const count = await Banner.countDocuments();
    if (count === 0) {
      await Banner.insertMany(DEFAULT_BANNERS);
    }
  } catch (err) {
    console.warn("[Banners] Seed check warning:", err instanceof Error ? err.message : err);
  }
}
router19.use(requireAdmin);
router19.get("/", async (req, res) => {
  try {
    await ensureInitialBanners();
    const { search, status, sortBy } = req.query;
    const filter = {};
    if (search && typeof search === "string" && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { alt: { $regex: search.trim(), $options: "i" } },
        { link: { $regex: search.trim(), $options: "i" } }
      ];
    }
    if (status === "active") {
      filter.active = true;
    } else if (status === "inactive") {
      filter.active = false;
    }
    let sort = { sortOrder: 1, createdAt: -1 };
    if (sortBy === "newest") {
      sort = { createdAt: -1 };
    } else if (sortBy === "title") {
      sort = { title: 1 };
    }
    const banners = await Banner.find(filter).sort(sort);
    res.json({
      success: true,
      count: banners.length,
      banners
    });
  } catch (err) {
    console.error("[Admin Banners GET Error]:", err);
    res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Failed to retrieve banners."
    });
  }
});
router19.post("/", async (req, res) => {
  try {
    const { title, alt, image, mobileImage, link, badge, active, sortOrder } = req.body;
    if (!title || typeof title !== "string" || !title.trim()) {
      res.status(400).json({ success: false, message: "Banner title is required." });
      return;
    }
    if (!image || typeof image !== "string" || !image.trim()) {
      res.status(400).json({ success: false, message: "Banner image is required." });
      return;
    }
    let calculatedOrder = typeof sortOrder === "number" ? sortOrder : 0;
    if (typeof sortOrder !== "number") {
      const highest = await Banner.findOne().sort({ sortOrder: -1 }).select("sortOrder");
      calculatedOrder = highest && typeof highest.sortOrder === "number" ? highest.sortOrder + 1 : 0;
    }
    const newBanner = await Banner.create({
      title: title.trim(),
      alt: alt && typeof alt === "string" ? alt.trim() : title.trim(),
      image: image.trim(),
      mobileImage: mobileImage && typeof mobileImage === "string" ? mobileImage.trim() : "",
      link: link && typeof link === "string" && link.trim() ? link.trim() : "/shop",
      badge: badge && typeof badge === "string" ? badge.trim() : "",
      active: typeof active === "boolean" ? active : true,
      sortOrder: calculatedOrder
    });
    res.status(201).json({
      success: true,
      message: "Banner created successfully.",
      banner: newBanner
    });
  } catch (err) {
    console.error("[Admin Banners POST Error]:", err);
    res.status(400).json({
      success: false,
      message: err instanceof Error ? err.message : "Failed to create banner."
    });
  }
});
router19.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, alt, image, mobileImage, link, badge, active, sortOrder } = req.body;
    const banner = await Banner.findById(id);
    if (!banner) {
      res.status(404).json({ success: false, message: "Banner not found." });
      return;
    }
    if (title !== void 0) banner.title = title.trim();
    if (alt !== void 0) banner.alt = alt.trim();
    if (image !== void 0) banner.image = image.trim();
    if (mobileImage !== void 0) banner.mobileImage = mobileImage.trim();
    if (link !== void 0) banner.link = link.trim() || "/shop";
    if (badge !== void 0) banner.badge = badge.trim();
    if (active !== void 0) banner.active = Boolean(active);
    if (typeof sortOrder === "number") banner.sortOrder = sortOrder;
    await banner.save();
    res.json({
      success: true,
      message: "Banner updated successfully.",
      banner
    });
  } catch (err) {
    console.error("[Admin Banners PUT Error]:", err);
    res.status(400).json({
      success: false,
      message: err instanceof Error ? err.message : "Failed to update banner."
    });
  }
});
router19.patch("/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);
    if (!banner) {
      res.status(404).json({ success: false, message: "Banner not found." });
      return;
    }
    banner.active = !banner.active;
    await banner.save();
    res.json({
      success: true,
      message: `Banner is now ${banner.active ? "active" : "inactive"}.`,
      active: banner.active,
      banner
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err instanceof Error ? err.message : "Failed to toggle banner status."
    });
  }
});
router19.patch("/reorder", async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ success: false, message: "orderedIds must be an array of Banner IDs." });
      return;
    }
    const updates = orderedIds.map(
      (id, index) => Banner.findByIdAndUpdate(id, { sortOrder: index })
    );
    await Promise.all(updates);
    const banners = await Banner.find().sort({ sortOrder: 1 });
    res.json({
      success: true,
      message: "Banner ordering updated successfully.",
      banners
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err instanceof Error ? err.message : "Failed to reorder banners."
    });
  }
});
router19.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) {
      res.status(404).json({ success: false, message: "Banner not found." });
      return;
    }
    res.json({
      success: true,
      message: "Banner deleted successfully."
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err instanceof Error ? err.message : "Failed to delete banner."
    });
  }
});
var adminBanners_default = router19;

// server/routes/banners.ts
import { Router as Router20 } from "express";
var router20 = Router20();
router20.get("/", async (_req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  try {
    const banners = await Banner.find({ active: true }).sort({ sortOrder: 1, createdAt: -1 });
    if (banners && banners.length > 0) {
      res.json({
        success: true,
        count: banners.length,
        banners: banners.map((b) => ({
          id: b._id.toString(),
          title: b.title,
          alt: b.alt || b.title,
          image: b.image,
          mobileImage: b.mobileImage,
          link: b.link || "/shop",
          badge: b.badge,
          sortOrder: b.sortOrder
        }))
      });
      return;
    }
    await ensureInitialBanners();
    const seededBanners = await Banner.find({ active: true }).sort({ sortOrder: 1, createdAt: -1 });
    if (seededBanners && seededBanners.length > 0) {
      res.json({
        success: true,
        count: seededBanners.length,
        banners: seededBanners.map((b) => ({
          id: b._id.toString(),
          title: b.title,
          alt: b.alt || b.title,
          image: b.image,
          mobileImage: b.mobileImage,
          link: b.link || "/shop",
          badge: b.badge,
          sortOrder: b.sortOrder
        }))
      });
      return;
    }
    res.json({
      success: true,
      count: DEFAULT_BANNERS.length,
      banners: DEFAULT_BANNERS.map((b, i) => ({
        id: `default-${i + 1}`,
        title: b.title,
        alt: b.alt,
        image: b.image,
        link: b.link,
        sortOrder: b.sortOrder
      }))
    });
  } catch (err) {
    console.warn("[Public Banners] DB retrieval failed, returning default fallback:", err);
    res.json({
      success: true,
      count: DEFAULT_BANNERS.length,
      banners: DEFAULT_BANNERS.map((b, i) => ({
        id: `default-${i + 1}`,
        title: b.title,
        alt: b.alt,
        image: b.image,
        link: b.link,
        sortOrder: b.sortOrder
      }))
    });
  }
});
var banners_default = router20;

// server/routes/sitemap.ts
import { Router as Router21 } from "express";
var router21 = Router21();
router21.get("/sitemap.xml", async (req, res) => {
  try {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.headers["x-forwarded-host"] || req.get("host") || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;
    const staticRoutes = [
      { loc: "/", changefreq: "daily", priority: "1.0" },
      { loc: "/shop", changefreq: "daily", priority: "0.9" },
      { loc: "/about-us", changefreq: "weekly", priority: "0.8" },
      { loc: "/faq", changefreq: "weekly", priority: "0.8" },
      { loc: "/contact", changefreq: "monthly", priority: "0.7" },
      { loc: "/privacy-policy", changefreq: "monthly", priority: "0.5" },
      { loc: "/terms-and-conditions", changefreq: "monthly", priority: "0.5" },
      { loc: "/cancellation-policy", changefreq: "monthly", priority: "0.5" },
      { loc: "/refund-policy", changefreq: "monthly", priority: "0.5" }
    ];
    const activeProducts = await Product.find({ isAvailable: { $ne: false } }).select("slug updatedAt").lean().catch(() => []);
    const productRoutes = activeProducts.map((p) => ({
      loc: `/product/${p.slug}`,
      lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
      changefreq: "weekly",
      priority: "0.85"
    }));
    const allUrls = [...staticRoutes, ...productRoutes];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(
      (item) => `  <url>
    <loc>${baseUrl}${item.loc}</loc>
    ${item.lastmod ? `<lastmod>${item.lastmod}</lastmod>` : `<lastmod>${(/* @__PURE__ */ new Date()).toISOString()}</lastmod>`}
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
    ).join("\n")}
</urlset>`;
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=7200");
    res.status(200).send(xml);
  } catch (err) {
    console.error("[Sitemap Error]", err);
    res.status(500).send("Error generating sitemap");
  }
});
router21.get("/robots.txt", (req, res) => {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.get("host") || "localhost:3000";
  const baseUrl = `${protocol}://${host}`;
  const content = `# Robots.txt for Malwa Namkeen House
User-agent: *
Allow: /
Allow: /shop
Allow: /product/
Allow: /about-us
Allow: /faq
Allow: /contact
Allow: /privacy-policy
Allow: /terms-and-conditions
Allow: /cancellation-policy
Allow: /refund-policy

# Protect internal/authenticated/admin routes
Disallow: /admin/
Disallow: /admin/*
Disallow: /dashboard
Disallow: /dashboard/*
Disallow: /account
Disallow: /account/*
Disallow: /login
Disallow: /api/
Disallow: /api/*

# Sitemap Reference
Sitemap: ${baseUrl}/sitemap.xml
`;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.status(200).send(content);
});
var sitemap_default = router21;

// server/routes/concierge.ts
import { Router as Router22 } from "express";
import rateLimit9 from "express-rate-limit";
import { GoogleGenAI } from "@google/genai";
var router22 = Router22();
var apiKey = process.env.GEMINI_API_KEY;
var aiClient = null;
function getGemini() {
  if (!aiClient) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing");
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}
var INITIAL_CONCIERGE_PROMPT = `
You are Malwa Concierge, the warm, polite, and knowledgeable culinary guide at MALWA NAMKEEN HOUSE (EST. 1954).
Your tone is welcoming, respectful, and warm (refer to customers respectfully, greet with 'Namaste' or 'Pranam', and embody authentic Indian hospitality).

Key Business Knowledge & Guidelines:
1. Brand Truth: MALWA NAMKEEN HOUSE was established in 1954, bringing over seven decades of authentic Malwa culinary heritage.
2. Authentic Product Catalog: Artisanal small-batch namkeens including authentic Ratlami Sev (infused with clove and black pepper warmth), Ujjaini Sev, Laung Sev, Hing Peda Sev, Khatta Meetha Mixture, Khasta Mathri, and festive gift hampers.
3. Pure Ingredients: Prepared strictly in 100% Pure Cold-Pressed Groundnut Oil \u2014 zero palm oil, zero trans fats, and zero artificial preservatives.
4. Advisory Pricing & Cart: Product prices and weights are dynamically managed on the storefront and checkout. Always advise customers to check the active product cards for current pricing; never invent prices or override checkout data.
5. Shipping & Delivery: Nationwide delivery across India with free shipping on orders above \u20B9499 (standard delivery is \u20B949).
6. Bulk & Corporate Gifting: Custom corporate hampers, wedding boxes, festival gifting, and wholesale namkeen orders. Advise customers to submit an online Bulk & Gifting enquiry or reach out on WhatsApp at +91 7987732765.
7. Constraints: Never invent unverified ingredients, nutrition claims, medical claims, or stock promises. Never refer to table reservations or restaurant dine-in.
`;
var conciergeLimiter = rateLimit9({
  windowMs: 5 * 60 * 1e3,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { default: false },
  store: new MongoRateLimitStore("concierge:chat", 5 * 60 * 1e3),
  message: {
    success: false,
    message: "Too many requests to the concierge. Please wait a moment."
  }
});
router22.post("/", conciergeLimiter, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Messages array is required." });
      return;
    }
    if (messages.length > 50) {
      res.status(400).json({ error: "Conversation history too long. Please start a new session." });
      return;
    }
    for (const m of messages) {
      if (typeof m.text !== "string" || m.text.length > 1e3) {
        res.status(400).json({ error: "A message exceeds the maximum allowed length of 1000 characters." });
        return;
      }
    }
    const lastUserMessage = String(messages[messages.length - 1]?.text ?? "").slice(0, 500);
    if (!lastUserMessage) {
      res.status(400).json({ error: "Latest user message text is required." });
      return;
    }
    const conversationHistoryString = messages.slice(Math.max(0, messages.length - 7), messages.length - 1).map((m) => `${m.sender === "user" ? "Customer" : "Malwa Concierge"}: ${m.text}`).join("\n");
    const fullPrompt = `Conversation history:
${conversationHistoryString}

The guest asks: "${lastUserMessage}"
Response:`;
    try {
      const ai = getGemini();
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: fullPrompt,
        config: {
          systemInstruction: INITIAL_CONCIERGE_PROMPT,
          temperature: 0.8,
          topP: 0.9
        }
      });
      res.json({ text: response.text ?? "Namaste Ji. How can I help you today?" });
    } catch {
      const lower = lastUserMessage.toLowerCase();
      let fallback = "Namaste Ji! I would be delighted to guide you through our authentic Malwa namkeens & snacks. What would Aap like to know?";
      if (/menu|eat|food|namkeen/.test(lower))
        fallback = "Namaste Ji! Our authentic collection spans Ratlami Sev, Hing Sev, Ujjaini Mixture, Dalmoth, Sweets and Festive Gift Boxes. Our Ratlami Sev and Hing Sev are absolute must-tries!";
      else if (/reserve|book|table|seat|order/.test(lower))
        fallback = "Pranam Ji! You can explore and order all our authentic namkeens directly in our shop, or contact our team for bulk orders.";
      else if (/sweet|jalebi|dessert|mithai/.test(lower))
        fallback = "Ah, authentic Malwa confections and savouries! Handcrafted with pure ingredients and time-honoured recipes.";
      else if (/hello|hi|namaste/.test(lower))
        fallback = "Namaste Ji! Pranam! I am Malwa Concierge, your culinary guide at MALWA NAMKEEN HOUSE. How may I serve Aap today?";
      res.json({ text: fallback });
    }
  } catch (err) {
    console.error("[Concierge] Error:", err instanceof Error ? err.message : err);
    res.status(500).json({ error: "Internal server error." });
  }
});
var concierge_default = router22;

// server/routes/shippingWebhooks.ts
import { Router as Router23 } from "express";
var router23 = Router23();
function buildStableEventId(headers, payload, awb, shipmentId, orderNumber, currentStatus) {
  const headerEventId = headers["x-event-id"];
  if (headerEventId && typeof headerEventId === "string" && headerEventId.trim()) {
    return headerEventId.trim();
  }
  const payloadEventId = payload.event_id;
  if (payloadEventId && String(payloadEventId).trim()) {
    return String(payloadEventId).trim();
  }
  const stableRef = awb || (shipmentId ? String(shipmentId) : orderNumber || "");
  const stableStatus = currentStatus.toUpperCase().replace(/\s+/g, "_");
  const stableTimestamp = (payload.scanned_date || payload.etd || "").trim();
  if (!stableRef || !stableStatus) {
    return null;
  }
  if (!stableTimestamp) {
    return `sr_${stableRef}_${stableStatus}`;
  }
  return `sr_${stableRef}_${stableStatus}_${stableTimestamp}`;
}
router23.post(["/webhook/shiprocket", "/webhook", "/"], async (req, res) => {
  try {
    const isAuthorized = verifyShiprocketWebhook(req.headers);
    if (!isAuthorized) {
      console.warn("[Shiprocket Webhook Warning] Unauthorized webhook request rejected.");
      res.status(401).json({ success: false, message: "Unauthorized webhook request." });
      return;
    }
    const payload = req.body || {};
    const awb = String(payload.awb || payload.awb_code || "").trim();
    const shipmentId = payload.shipment_id ? Number(payload.shipment_id) : void 0;
    const orderNumber = String(payload.channel_order_id || payload.order_id || "").trim();
    const currentStatus = String(payload.current_status || payload.status || "").trim();
    if (!awb && !shipmentId && !orderNumber) {
      res.status(400).json({ success: false, message: "Missing shipment identifiers in webhook payload." });
      return;
    }
    const eventIdentifier = buildStableEventId(
      req.headers,
      payload,
      awb,
      shipmentId,
      orderNumber,
      currentStatus
    );
    if (eventIdentifier === null) {
      console.warn(
        `[Shiprocket Webhook] Received event with no stable identifier (AWB: "${awb}", Shipment: "${shipmentId}", Status: "${currentStatus}"). Acknowledged without processing to preserve replay safety.`
      );
      res.status(200).json({
        success: true,
        message: "Event acknowledged without processing: no stable event identifier available.",
        unidentifiable: true
      });
      return;
    }
    const orderQuery = {
      $or: [
        ...orderNumber ? [{ orderNumber }] : [],
        ...orderNumber && !isNaN(Number(orderNumber)) ? [{ "shiprocketDetails.orderId": Number(orderNumber) }] : [],
        ...shipmentId ? [{ "shiprocketDetails.shipmentId": shipmentId }] : [],
        ...awb ? [{ "shiprocketDetails.awbCode": awb }] : []
      ],
      // Atomic replay-protection: only match orders that have NOT yet recorded this event.
      // $nin is more reliable than $not+$elemMatch on empty/null/missing array fields.
      processedShippingEvents: { $nin: [eventIdentifier] }
    };
    const claimedOrder = await Order.findOneAndUpdate(
      orderQuery,
      { $addToSet: { processedShippingEvents: eventIdentifier } },
      { new: false }
      // return the pre-update doc so we can read previous state
    );
    if (!claimedOrder) {
      const existingOrder = await Order.findOne({
        $or: [
          ...orderNumber ? [{ orderNumber }] : [],
          ...orderNumber && !isNaN(Number(orderNumber)) ? [{ "shiprocketDetails.orderId": Number(orderNumber) }] : [],
          ...shipmentId ? [{ "shiprocketDetails.shipmentId": shipmentId }] : [],
          ...awb ? [{ "shiprocketDetails.awbCode": awb }] : []
        ]
      });
      if (!existingOrder) {
        console.warn(
          `[Shiprocket Webhook] No matching order found for AWB: "${awb}", Shipment: "${shipmentId}", Order: "${orderNumber}".`
        );
        res.status(200).json({ success: true, message: "Order not found, event acknowledged." });
        return;
      }
      res.json({ success: true, message: "Event already processed.", alreadyProcessed: true });
      return;
    }
    const order = claimedOrder;
    if (order.orderStatus === "cancelled") {
      console.warn(
        `[Shiprocket Webhook] Late event "${currentStatus}" received for CANCELLED Order #${order.orderNumber} \u2014 no state change applied.`
      );
      res.status(200).json({
        success: true,
        message: `Event "${currentStatus}" acknowledged for cancelled order #${order.orderNumber}. No state change applied.`,
        cancelledOrderGuard: true
      });
      return;
    }
    const previousStatus = order.orderStatus;
    const previousTrackingNumber = order.trackingInfo?.trackingNumber;
    let shouldNotifyCustomer = false;
    order.shiprocketDetails = order.shiprocketDetails || {};
    if (awb && !order.shiprocketDetails.awbCode) {
      order.shiprocketDetails.awbCode = awb;
    }
    if (payload.courier_name && !order.shiprocketDetails.courierName) {
      order.shiprocketDetails.courierName = String(payload.courier_name).trim();
    }
    order.shiprocketDetails.lastEvent = currentStatus;
    order.shiprocketDetails.lastEventDate = /* @__PURE__ */ new Date();
    order.shiprocketDetails.syncedAt = /* @__PURE__ */ new Date();
    order.shiprocketDetails.rawStatus = currentStatus;
    if (awb) {
      order.trackingInfo = {
        courierName: order.shiprocketDetails.courierName || order.trackingInfo?.courierName || "Shiprocket Partner",
        trackingNumber: awb,
        trackingUrl: payload.tracking_url || `https://shiprocket.co/tracking/${encodeURIComponent(awb)}`
      };
      if (previousTrackingNumber !== awb) {
        shouldNotifyCustomer = true;
      }
    }
    const statusUpper = currentStatus.toUpperCase();
    const SHIPMENT_STATUS_RANK = {
      unfulfilled: 0,
      ready_to_ship: 1,
      in_transit: 2,
      out_for_delivery: 3,
      delivered: 4,
      returned: 4
    };
    const currentRank = SHIPMENT_STATUS_RANK[order.shipmentStatus || "unfulfilled"] ?? 0;
    if (statusUpper.includes("DELIVERED") && !statusUpper.includes("RTO")) {
      order.shipmentStatus = "delivered";
      order.orderStatus = "delivered";
      if (order.paymentMethod === "cod" && order.paymentStatus !== "paid") {
        order.paymentStatus = "paid";
        order.paymentDetails = {
          ...order.paymentDetails || {},
          gateway: "cod",
          paidAt: /* @__PURE__ */ new Date()
        };
      }
      shouldNotifyCustomer = true;
    } else if (statusUpper.includes("OUT FOR DELIVERY")) {
      if (currentRank < 3) {
        order.shipmentStatus = "out_for_delivery";
        if (order.orderStatus !== "shipped" && order.orderStatus !== "delivered") {
          order.orderStatus = "shipped";
          shouldNotifyCustomer = true;
        }
      }
    } else if (statusUpper.includes("IN TRANSIT") || statusUpper.includes("PICKED UP") || statusUpper.includes("REACHED")) {
      if (currentRank < 2) {
        order.shipmentStatus = "in_transit";
        if (["pending", "confirmed", "processing"].includes(order.orderStatus)) {
          order.orderStatus = "shipped";
          shouldNotifyCustomer = true;
        }
      }
    } else if (statusUpper.includes("AWB") || statusUpper === "READY TO SHIP") {
      if (currentRank < 1) {
        order.shipmentStatus = "ready_to_ship";
      }
    } else if (statusUpper.includes("RTO") || statusUpper.includes("RETURN")) {
      if (order.shipmentStatus !== "delivered") {
        order.shipmentStatus = "returned";
      }
    }
    await order.save();
    if (shouldNotifyCustomer) {
      (async () => {
        try {
          await sendOrderStatusUpdate({
            order,
            previousStatus,
            newStatus: order.orderStatus,
            isTrackingUpdate: previousTrackingNumber !== order.trackingInfo?.trackingNumber
          });
        } catch (emailErr) {
          console.warn("[Shiprocket Webhook Notification Warning]:", emailErr);
        }
      })();
    }
    res.json({
      success: true,
      message: `Shiprocket event "${currentStatus}" processed for Order #${order.orderNumber}.`,
      orderStatus: order.orderStatus,
      shipmentStatus: order.shipmentStatus
    });
  } catch (err) {
    console.error("[Shiprocket Webhook Exception]:", err);
    res.status(500).json({ success: false, message: "Failed to process shipping webhook." });
  }
});
var shippingWebhooks_default = router23;

// server/api-entry.ts
var app = express();
app.set("trust proxy", 1);
var isProd = process.env.NODE_ENV === "production";
var allowedOrigins = (() => {
  const configured = process.env.ALLOWED_ORIGINS ?? "";
  const base = configured ? configured.split(",").map((s) => s.trim().replace(/\/+$/, "")).filter(Boolean) : [];
  if (!isProd) {
    base.push("http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://localhost:3000");
  } else {
    base.push(
      "https://malwanamkeenhouse.com",
      "https://www.malwanamkeenhouse.com",
      "https://malwa-namkeen.vercel.app"
    );
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      base.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim().replace(/\/+$/, "")}`);
    }
    if (process.env.VERCEL_URL) {
      base.push(`https://${process.env.VERCEL_URL.trim().replace(/\/+$/, "")}`);
    }
  }
  const appUrl = process.env.APP_URL;
  if (appUrl) base.push(appUrl.trim().replace(/\/+$/, ""));
  return Array.from(new Set(base));
})();
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const normalizedOrigin = origin ? origin.replace(/\/+$/, "") : null;
  if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin)) {
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Idempotency-Key, x-idempotency-key");
  res.setHeader("Vary", "Origin");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});
app.use(cookieParser());
app.use(express.json({
  limit: "10mb",
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(async (_req, _res, next) => {
  try {
    await connectMongoDB();
  } catch (err) {
    console.warn("[Vercel API] MongoDB connection attempt:", err instanceof Error ? err.message : err);
  }
  next();
});
app.use("/", sitemap_default);
app.get(["/health", "/api/health"], async (_req, res) => {
  const mongo = getMongoStatus();
  let dbHealthy = false;
  if (mongo.connected && mongoose33.connection.db) {
    try {
      await Promise.race([
        mongoose33.connection.db.command({ ping: 1 }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 2e3))
      ]);
      dbHealthy = true;
    } catch {
      dbHealthy = false;
    }
  }
  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? "ok" : "error",
    time: (/* @__PURE__ */ new Date()).toISOString(),
    service: BUSINESS.name,
    mongodb: dbHealthy ? "connected" : mongo.state,
    database: mongoose33.connection.name || null
  });
});
var routeConfigs = [
  { path: "/auth", router: auth_default },
  { path: "/auth", router: authRecovery_default },
  { path: "/cart", router: cartWishlist_default },
  { path: "/customer", router: cartWishlist_default },
  { path: "/customer", router: customerAccount_default },
  { path: "/orders", router: customerOrders_default },
  { path: "/settings", router: publicSettingsRouter },
  { path: "/inquiries", router: adminInquiries_default },
  { path: "/contact", router: adminInquiries_default },
  { path: "/discounts", router: adminDiscounts_default },
  { path: "/admin/dashboard", router: adminDashboard_default },
  { path: "/admin/staff", router: adminStaff_default },
  { path: "/admin/settings", router: adminSettings_default },
  { path: "/admin/email", router: adminEmail_default },
  { path: "/admin/inquiries", router: adminInquiries_default },
  { path: "/admin/discounts", router: adminDiscounts_default },
  { path: "/admin/customers", router: adminCustomers_default },
  { path: "/admin/orders", router: adminOrders_default },
  { path: "/admin/categories", router: adminCategories_default },
  { path: "/admin/products", router: adminProducts_default },
  { path: "/admin/banners", router: adminBanners_default },
  { path: "/banners", router: banners_default },
  { path: "/admin/uploads", router: uploads_default },
  { path: "/shipping", router: shippingWebhooks_default },
  { path: "/concierge", router: concierge_default },
  { path: "/", router: products_default },
  { path: "/", router: enquiries_default }
];
for (const config of routeConfigs) {
  if (config.path === "/") {
    app.use("/", config.router);
    app.use("/api", config.router);
  } else {
    app.use(config.path, config.router);
    app.use(`/api${config.path}`, config.router);
  }
}
app.use((err, _req, res, _next) => {
  console.error("[API Error]:", err.message);
  const message2 = isProd ? "Internal server error." : err.message || "Internal server error.";
  res.status(500).json({ success: false, message: message2 });
});
var api_entry_default = app;
export {
  api_entry_default as default
};
