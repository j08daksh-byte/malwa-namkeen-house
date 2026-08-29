// server/api-entry.ts
import express from "express";
import cookieParser from "cookie-parser";

// server/lib/mongodb.ts
import mongoose4 from "mongoose";

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
    image: "/mishtichaat/chaat-plate.jpg",
    images: ["/mishtichaat/chaat-plate.jpg"],
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
    image: "/mishtichaat/dahi-puri.png",
    images: ["/mishtichaat/dahi-puri.png"],
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
    image: "/mishtichaat/dahi-bhalla.jpg",
    images: ["/mishtichaat/dahi-bhalla.jpg"],
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
    image: "/mishtichaat/semi-hero.png",
    images: ["/mishtichaat/semi-hero.png"],
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
    image: "/mishtichaat/chaat-tamatar.jpg",
    images: ["/mishtichaat/chaat-tamatar.jpg"],
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
    image: "/mishtichaat/tamatar-chaat.jpg",
    images: ["/mishtichaat/tamatar-chaat.jpg"],
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
    image: "/mishtichaat/FAMILY%20FEAST%20THALI.png",
    images: ["/mishtichaat/FAMILY%20FEAST%20THALI.png"],
    badge: "Luxury Gift Edition",
    featured: false,
    isBestSeller: false,
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
    image: "/mishtichaat/CHAAT-BAZAAR.png",
    images: ["/mishtichaat/CHAAT-BAZAAR.png"],
    badge: "Party Hit",
    featured: false,
    isBestSeller: false,
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
    image: "/mishtichaat/MEETHI%20GALI.png",
    images: ["/mishtichaat/MEETHI%20GALI.png"],
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

// server/lib/mongodb.ts
var isConnected = false;
async function seedInitialAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.toLowerCase().trim() : "";
    const adminPassword = process.env.ADMIN_PASSWORD || "";
    if (!adminEmail) return;
    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      if (existing.role !== "super_admin" || !existing.active) {
        existing.role = "super_admin";
        existing.active = true;
        await existing.save();
        console.log(`[MongoDB] Designated owner <${adminEmail}> successfully designated as super_admin.`);
      }
      return;
    }
    console.log(`[MongoDB] ADMIN_EMAIL <${adminEmail}> is configured. Registered account will automatically receive super_admin privileges.`);
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
      } else {
        cat.name = catData.label;
        cat.description = catData.description;
        cat.active = true;
        cat.sortOrder = i;
        await cat.save();
      }
      categoryDocMap.set(catData.id, cat._id);
    }
    await Category.deleteMany({ slug: { $regex: /^test-category/i } });
    for (let idx = 0; idx < PRODUCTS.length; idx++) {
      const p = PRODUCTS[idx];
      const catId = categoryDocMap.get(p.category) || Array.from(categoryDocMap.values())[0];
      const pSlug = p.slug || p.id;
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
      await Product.findOneAndUpdate(
        { slug: pSlug },
        { $set: productPayload },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    await Product.deleteMany({ slug: { $nin: PRODUCTS.map((p) => p.slug || p.id) } });
    console.log(`[MongoDB] Database catalog synchronized: ${validCategories.length} categories, ${PRODUCTS.length} products (4 bestsellers).`);
  } catch (err) {
    console.warn("[MongoDB] Database catalog sync warning:", err instanceof Error ? err.message : err);
  }
}
async function connectMongoDB() {
  if (isConnected) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("[MongoDB] MONGODB_URI not set \u2014 skipping MongoDB connection.");
    return;
  }
  try {
    await mongoose4.connect(uri, {
      serverSelectionTimeoutMS: 5e3,
      dbName: process.env.MONGODB_DB_NAME || "malwa_namkeen"
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to database: "${mongoose4.connection.name}".`);
    await seedInitialAdmin();
    await syncDatabaseCatalog();
  } catch (err) {
    const message2 = err instanceof Error ? err.message : String(err);
    console.error("[MongoDB] Connection failed:", message2);
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
  const state = mongoose4.connection.readyState;
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
import { Router } from "express";
import rateLimit from "express-rate-limit";

// server/lib/auth.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
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
  if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
    return req.cookies[AUTH_COOKIE_NAME];
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
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
  if (payload.role !== "admin" && payload.role !== "super_admin") {
    res.status(403).json({
      success: false,
      message: "Access denied. Administrator privilege required."
    });
    return;
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
  if (payload.role !== "super_admin") {
    res.status(403).json({
      success: false,
      message: "Access denied. Super Administrator privilege required."
    });
    return;
  }
  req.user = payload;
  res.locals.user = payload;
  next();
}

// server/routes/auth.ts
var router = Router();
var loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many sign in attempts. Please try again after 15 minutes."
  }
});
var adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many admin sign in attempts. Please try again after 15 minutes."
  }
});
var registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1e3,
  // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
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
    const newUser = await User.create({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password: hashedPassword,
      role: "customer",
      active: true
    });
    const token = generateToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role
    });
    setAuthCookie(res, token);
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
async function verifyGoogleToken(credential) {
  if (!credential || typeof credential !== "string" || credential.trim().length < 10) {
    return null;
  }
  try {
    const configuredClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "";
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
    if (configuredClientId && payload.aud && payload.aud !== configuredClientId) {
      console.warn("[Google Auth Error] Audience mismatch. Expected:", configuredClientId, "Got:", payload.aud);
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
    const tokenToVerify = credential || idToken;
    if (!tokenToVerify || typeof tokenToVerify !== "string") {
      res.status(400).json({
        success: false,
        message: "Google credential token is required."
      });
      return;
    }
    const googleUser = await verifyGoogleToken(tokenToVerify);
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
      if (!user.googleId) user.googleId = googleUser.sub;
      if (googleUser.picture && !user.avatar) user.avatar = googleUser.picture;
      user.lastLoginAt = /* @__PURE__ */ new Date();
      if (!user.emailVerifiedAt) user.emailVerifiedAt = /* @__PURE__ */ new Date();
      await user.save();
    } else {
      user = await User.create({
        name: googleUser.name.trim(),
        email: cleanEmail,
        googleId: googleUser.sub,
        avatar: googleUser.picture || "",
        role: "customer",
        active: true,
        lastLoginAt: /* @__PURE__ */ new Date(),
        emailVerifiedAt: /* @__PURE__ */ new Date()
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
        role: user.role
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
    const user = await User.findById(req.user.userId);
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
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve profile."
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
var auth_default = router;

// server/routes/authRecovery.ts
import { Router as Router2 } from "express";
import crypto from "crypto";
import rateLimit2 from "express-rate-limit";

// server/lib/emailService.ts
import { Resend } from "resend";
import mongoose6 from "mongoose";

// server/models/EmailLog.ts
import mongoose5, { Schema as Schema4 } from "mongoose";
var emailLogSchema = new Schema4(
  {
    eventType: {
      type: String,
      required: true,
      enum: [
        "admin_invitation",
        "admin_password_reset",
        "customer_password_reset",
        "order_confirmation",
        "order_status_update",
        "inquiry_acknowledgement",
        "admin_new_order_alert",
        "admin_new_inquiry_alert"
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
      type: Schema4.Types.Mixed,
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
var EmailLog = mongoose5.models.EmailLog || mongoose5.model("EmailLog", emailLogSchema);

// server/lib/emailService.ts
function getEmailConfig() {
  const rawBaseUrl = process.env.APP_URL || process.env.APP_BASE_URL || "http://localhost:3000";
  return {
    provider: process.env.EMAIL_PROVIDER || (process.env.RESEND_API_KEY ? "resend" : "simulated"),
    resendApiKey: process.env.RESEND_API_KEY || "",
    emailFrom: process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || "Malwa Namkeen House <orders@malwanamkeen.com>",
    appBaseUrl: rawBaseUrl.replace(/\/+$/, "")
  };
}
var resendClient = null;
function getResendClient() {
  const { resendApiKey } = getEmailConfig();
  if (!resendApiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(resendApiKey);
  }
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
  const cleanTo = to.trim().toLowerCase();
  if (!cleanTo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanTo)) {
    return { success: false, provider: "none", error: "Invalid recipient email address." };
  }
  let result = { success: false, provider: config.provider };
  if (config.resendApiKey) {
    try {
      const client = getResendClient();
      if (!client) throw new Error("Resend client initialization failed");
      const response = await client.emails.send({
        from: config.emailFrom,
        to: [cleanTo],
        subject,
        html,
        text: text || html.replace(/<[^>]*>?/gm, "")
      });
      if (response.error) {
        result = { success: false, provider: "resend", error: response.error.message };
      } else {
        result = { success: true, provider: "resend", messageId: response.data?.id };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result = { success: false, provider: "resend", error: msg };
    }
  } else if (isProd2) {
    console.warn(`[Email Service] Production email provider unconfigured. Message to <${cleanTo}> safely dropped.`);
    result = { success: false, provider: "unconfigured", error: "Email provider unconfigured." };
  } else {
    console.log("\n================== [DEV EMAIL SIMULATOR] ==================");
    console.log(`To: ${cleanTo}`);
    console.log(`From: ${config.emailFrom}`);
    console.log(`Event: ${eventType || "generic"}`);
    console.log(`Subject: ${subject}`);
    console.log(`Preview:
${text || html.replace(/<[^>]*>?/gm, "").slice(0, 300)}...`);
    console.log("===========================================================\n");
    result = { success: true, provider: "simulated", simulated: true };
  }
  if (eventType && mongoose6.connection.readyState === 1) {
    try {
      await EmailLog.create({
        eventType,
        recipient: cleanTo,
        subject,
        relatedId: relatedId || null,
        provider: result.provider,
        providerMessageId: result.messageId || null,
        status: result.simulated ? "simulated" : result.success ? "sent" : result.provider === "unconfigured" ? "unconfigured" : "failed",
        error: result.error || null,
        attemptedAt: /* @__PURE__ */ new Date()
      });
    } catch (logErr) {
      console.warn("[EmailLog Warning] Failed to log email record:", logErr);
    }
  }
  return result;
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
  return sendEmail({
    to: email2,
    subject: `Invitation to join Malwa Namkeen House Staff Portal (${roleTitle})`,
    html,
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
  return sendEmail({
    to: email2,
    subject: "Password Reset Request \u2014 Malwa Namkeen House Staff Portal",
    html,
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
  return sendEmail({
    to: email2,
    subject: "Password Reset Request \u2014 Malwa Namkeen House",
    html,
    eventType: "customer_password_reset",
    relatedId: email2
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
    return { success: false, provider: "none", error: "No recipient email found on order." };
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
        <span style="background: #D1FAE5; color: #065F46; font-size: 12px; font-weight: 700; padding: 4px 12px; borderRadius: 20px; text-transform: uppercase;">
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
  return sendEmail({
    to: customerEmail,
    subject: `Order Confirmation \u2014 #${order.orderNumber} (Malwa Namkeen House)`,
    html,
    eventType: "order_confirmation",
    relatedId: order.orderNumber
  });
}
async function sendOrderStatusUpdate({
  order,
  previousStatus,
  newStatus,
  storeContact
}) {
  const { appBaseUrl } = getEmailConfig();
  const customerEmail = order.customerInfo?.email || order.shippingAddress?.email;
  const customerName = order.customerInfo?.name || order.shippingAddress?.name || "Customer";
  if (!customerEmail) {
    return { success: false, provider: "none", error: "No recipient email found on order." };
  }
  if (previousStatus === newStatus) {
    return { success: true, provider: "none", simulated: true };
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
  return sendEmail({
    to: customerEmail,
    subject: `Order Update (#${order.orderNumber}): ${statusInfo.title}`,
    html,
    eventType: "order_status_update",
    relatedId: `${order.orderNumber}_${newStatus}`
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
  const results = [];
  const uniqueEmails = [...new Set(adminEmails.map((e) => e.trim().toLowerCase()))];
  for (const adminEmail of uniqueEmails) {
    const res = await sendEmail({
      to: adminEmail,
      subject: `[Admin Alert] New Order #${order.orderNumber} (\u20B9${order.total})`,
      html,
      eventType: "admin_new_order_alert",
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
    return { success: false, provider: "none", error: "No recipient email provided." };
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
  return sendEmail({
    to: customerEmail,
    subject: `We have received your inquiry (Ref: #${referenceId}) \u2014 Malwa Namkeen House`,
    html,
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
  const results = [];
  const uniqueEmails = [...new Set(adminEmails.map((e) => e.trim().toLowerCase()))];
  for (const adminEmail of uniqueEmails) {
    const res = await sendEmail({
      to: adminEmail,
      subject: `[Admin Alert] New Inquiry #${referenceId} from ${inquiry.name}`,
      html,
      eventType: "admin_new_inquiry_alert",
      relatedId: String(inquiry._id || referenceId)
    });
    results.push(res);
  }
  return results;
}
var sendAdminInvitationEmail = sendAdminInvitation;
var sendPasswordResetEmail = sendAdminPasswordReset;

// server/routes/authRecovery.ts
var router2 = Router2();
var forgotPasswordLimiter = rateLimit2({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
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
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1e3);
    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = expiresAt;
    await user.save();
    await sendCustomerPasswordReset({
      email: user.email,
      name: user.name,
      token: rawToken
    });
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
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
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
    const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");
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
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      res.status(400).json({
        success: false,
        message: "Your new password must be at least 8 characters long."
      });
      return;
    }
    const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");
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
    const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");
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
    const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");
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
import mongoose7 from "mongoose";
var router3 = Router3();
function formatPublicProduct(p) {
  const primaryImage = Array.isArray(p.images) && p.images[0] || p.image || "/mishtichaat/chaat-plate.jpg";
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
    badge: p.badge || (p.isBestSeller ? "Best Seller" : p.featured ? "Signature" : void 0),
    rating: typeof p.rating === "number" ? p.rating : 4.9,
    reviewCount: typeof p.reviewCount === "number" ? p.reviewCount : 124,
    featured: Boolean(p.featured),
    isBestSeller: Boolean(p.isBestSeller),
    options
  };
}
router3.get("/categories", async (_req, res) => {
  try {
    if (mongoose7.connection.readyState === 1) {
      const categories = await Category.find({ active: true }).sort({ sortOrder: 1, name: 1 }).lean();
      if (categories.length > 0) {
        res.setHeader("Cache-Control", "public, max-age=120, stale-while-revalidate=300");
        res.json({
          success: true,
          categories: categories.map((c) => ({
            id: c.slug,
            _id: String(c._id),
            slug: c.slug,
            name: c.name,
            label: c.name,
            shortLabel: c.name.replace(/(Signature|Heritage|Royal|Crisp)\s+/i, ""),
            description: c.description || "",
            image: c.image || ""
          }))
        });
        return;
      }
    }
  } catch (_err) {
  }
  res.json({
    success: true,
    categories: SHOP_CATEGORIES.map((c) => ({
      id: c.id,
      _id: c.id,
      slug: c.id,
      name: c.label,
      label: c.label,
      shortLabel: c.shortLabel,
      description: c.description,
      image: ""
    }))
  });
});
router3.get("/products/best-sellers", async (_req, res) => {
  try {
    if (mongoose7.connection.readyState === 1) {
      let bestSellers = await Product.find({ active: true, isBestSeller: true }).populate({ path: "category", select: "name slug image", strictPopulate: false }).sort({ bestSellerAt: -1, updatedAt: -1, createdAt: -1 }).limit(4).lean();
      if (bestSellers.length < 4) {
        const existingIds = bestSellers.map((p) => p._id);
        const backfill = await Product.find({
          active: true,
          _id: { $nin: existingIds }
        }).populate({ path: "category", select: "name slug image", strictPopulate: false }).sort({ featured: -1, rating: -1, createdAt: -1 }).limit(4 - bestSellers.length).lean();
        bestSellers = [...bestSellers, ...backfill];
      }
      if (bestSellers.length > 0) {
        res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
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
    if (mongoose7.connection.readyState === 1) {
      const filter = { active: true };
      if (category2 && category2 !== "all") {
        if (mongoose7.Types.ObjectId.isValid(category2)) {
          filter.category = new mongoose7.Types.ObjectId(category2);
        } else {
          const catDoc = await Category.findOne({ slug: category2.toLowerCase(), active: true }).maxTimeMS(2e3).lean();
          if (catDoc) {
            filter.category = catDoc._id;
          } else {
            const hasAnyCat = await Category.countDocuments().maxTimeMS(2e3);
            if (hasAnyCat > 0) {
              res.json({ success: true, products: [], total: 0 });
              return;
            }
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
        const q = search2.trim();
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
        Category.find({ active: true }).sort({ sortOrder: 1 }).maxTimeMS(2e3).lean()
      ]);
      if (total > 0 || rawProducts.length > 0) {
        const formattedProducts = rawProducts.map(formatPublicProduct);
        res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
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
  try {
    if (mongoose7.connection.readyState === 1) {
      let productDoc = null;
      if (mongoose7.Types.ObjectId.isValid(slugOrId)) {
        productDoc = await Product.findOne({ _id: slugOrId, active: true }).populate({ path: "category", select: "name slug image", strictPopulate: false }).lean();
      }
      if (!productDoc) {
        productDoc = await Product.findOne({ slug: slugOrId.toLowerCase(), active: true }).populate({ path: "category", select: "name slug image", strictPopulate: false }).lean();
      }
      if (productDoc) {
        const product = formatPublicProduct(productDoc);
        res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
        res.json({ success: true, product });
        return;
      }
    }
  } catch (_err) {
  }
  const cleanSlug = slugOrId.toLowerCase().trim();
  const fallback = PRODUCTS.find(
    (p) => (p.slug || p.id).toLowerCase() === cleanSlug || p.id === cleanSlug || p.name.toLowerCase().replace(/\s+/g, "-").includes(cleanSlug) || cleanSlug.includes(p.id)
  );
  if (fallback) {
    res.json({ success: true, product: fallback });
  } else {
    res.status(404).json({ success: false, message: "Product delicacy not found or unavailable." });
  }
});
var products_default = router3;

// server/routes/cartWishlist.ts
import { Router as Router4 } from "express";
import mongoose9 from "mongoose";

// server/models/Discount.ts
import mongoose8, { Schema as Schema5 } from "mongoose";
var discountSchema = new Schema5(
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
    }
  },
  {
    timestamps: true
  }
);
var Discount = mongoose8.models.Discount || mongoose8.model("Discount", discountSchema);

// server/lib/discounts.ts
async function validateAndCalculateDiscount(rawCode, subtotal) {
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
router4.post("/revalidate", async (req, res) => {
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
    const productIds = [
      ...new Set(items.map((it) => it.productId).filter((id) => mongoose9.Types.ObjectId.isValid(id)))
    ];
    const products = await Product.find({
      _id: { $in: productIds },
      active: true
    }).lean();
    const productMap = new Map(products.map((p) => [String(p._id), p]));
    const validatedItems = [];
    const adjustments = [];
    for (const item of items) {
      const product = productMap.get(item.productId);
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
      if (livePrice !== item.price) {
        adjustments.push(
          `Price for "${product.name} (${variant.label})" was updated from \u20B9${item.price} to current price \u20B9${livePrice}.`
        );
      }
      const primaryImage = Array.isArray(product.images) && product.images[0] || product.image || "/mishtichaat/chaat-plate.jpg";
      validatedItems.push({
        productId: String(product._id),
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
        image: primaryImage
      });
    }
    const subtotal = validatedItems.reduce((sum, it) => sum + it.itemTotal, 0);
    let discountAmount = 0;
    let validatedCoupon = null;
    let couponError = null;
    if (couponCode && couponCode.trim()) {
      const discResult = await validateAndCalculateDiscount(couponCode.trim(), subtotal);
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
    if (!productId || !mongoose9.Types.ObjectId.isValid(productId)) {
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
      user.wishlist = [...user.wishlist || [], new mongoose9.Types.ObjectId(productId)];
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
    const validIds = productIds.filter((id) => mongoose9.Types.ObjectId.isValid(id));
    const user = await User.findById(req.user?.userId);
    if (!user) {
      res.status(404).json({ success: false, message: "Customer account not found." });
      return;
    }
    const existingStrings = new Set((user.wishlist || []).map((id) => String(id)));
    for (const id of validIds) {
      if (!existingStrings.has(id)) {
        user.wishlist?.push(new mongoose9.Types.ObjectId(id));
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
import mongoose11 from "mongoose";

// server/models/Order.ts
import mongoose10, { Schema as Schema6 } from "mongoose";
var orderItemSchema = new Schema6(
  {
    productId: {
      type: Schema6.Types.ObjectId,
      ref: "Product"
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
var shippingAddressSchema = new Schema6(
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
var orderSchema = new Schema6(
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
      type: Schema6.Types.ObjectId,
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
      paidAt: { type: Date }
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
    notes: {
      type: String,
      trim: true,
      default: ""
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
var Order = mongoose10.models.Order || mongoose10.model("Order", orderSchema);

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
router5.put("/password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: "Current password and new password are required."
      });
      return;
    }
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long."
      });
      return;
    }
    const user = await User.findById(req.user?.userId).select("+password");
    if (!user || !user.active) {
      res.status(404).json({ success: false, message: "Account not found or inactive." });
      return;
    }
    if (!user.password) {
      res.status(400).json({ success: false, message: "Account has no password set." });
      return;
    }
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ success: false, message: "Incorrect current password." });
      return;
    }
    user.password = await hashPassword(newPassword);
    await user.save();
    res.json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    console.error("[Customer Password Change Error]", err);
    res.status(500).json({ success: false, message: "Failed to change password." });
  }
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
    if (!mongoose11.Types.ObjectId.isValid(addressId)) {
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
    if (!mongoose11.Types.ObjectId.isValid(addressId)) {
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
    if (!mongoose11.Types.ObjectId.isValid(addressId)) {
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
    const query = mongoose11.Types.ObjectId.isValid(orderId) ? { _id: orderId } : { orderNumber: orderId };
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
var customerAccount_default = router5;

// server/routes/customerOrders.ts
import { Router as Router6 } from "express";
import mongoose13 from "mongoose";

// server/models/StoreSettings.ts
import mongoose12, { Schema as Schema7 } from "mongoose";
var storeSettingsSchema = new Schema7(
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
var StoreSettings = mongoose12.models.StoreSettings || mongoose12.model("StoreSettings", storeSettingsSchema);

// server/routes/customerOrders.ts
var router6 = Router6();
var recentSubmissions = /* @__PURE__ */ new Map();
function generateOrderNumber() {
  const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(2, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1e3 + Math.random() * 9e3);
  return `MN-${dateStr}-${randomSuffix}`;
}
router6.post("/", requireAuth, async (req, res) => {
  let appliedDiscountCode = "";
  const reservedStockUpdates = [];
  try {
    const {
      items = [],
      shippingAddress,
      saveAddressToBook = false,
      couponCode = "",
      paymentMethod = "cod",
      notes = "",
      idempotencyKey = ""
    } = req.body;
    if (idempotencyKey && typeof idempotencyKey === "string") {
      const cached = recentSubmissions.get(idempotencyKey);
      if (cached && Date.now() - cached.timestamp < 3e5) {
        const existingOrder = await Order.findById(cached.orderId).lean();
        if (existingOrder) {
          res.json({
            success: true,
            order: existingOrder,
            isDuplicateReplay: true
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
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: "Your cart is empty. Please add items to checkout."
      });
      return;
    }
    if (!shippingAddress || typeof shippingAddress !== "object" || !shippingAddress.name?.trim() || !shippingAddress.phone?.trim() || !shippingAddress.addressLine1?.trim() || !shippingAddress.city?.trim() || !shippingAddress.state?.trim() || !shippingAddress.pincode?.trim()) {
      res.status(400).json({
        success: false,
        message: "Please provide a complete delivery address with PIN code and phone."
      });
      return;
    }
    if (!/^\d{6}$/.test(String(shippingAddress.pincode).trim())) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid 6-digit Indian PIN code."
      });
      return;
    }
    const productIds = [
      ...new Set(
        items.map((it) => it.productId).filter((id) => mongoose13.Types.ObjectId.isValid(id))
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
        res.status(400).json({
          success: false,
          message: `Packaging for "${product.name}" is currently unavailable.`
        });
        return;
      }
      const qty = Math.max(1, parseInt(String(item.quantity), 10) || 1);
      const stock = typeof variant.stock === "number" ? variant.stock : 100;
      if (stock < qty) {
        res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name} (${variant.label || "Standard"})". Available: ${stock}.`
        });
        return;
      }
      const unitPrice = typeof variant.salePrice === "number" && variant.salePrice > 0 ? variant.salePrice : variant.price;
      const primaryImage = Array.isArray(product.images) && product.images[0] || product.image || "/mishtichaat/chaat-plate.jpg";
      const variantLabel = variant.label || `${variant.value || ""} ${variant.unit || ""}`.trim() || "Standard";
      orderItems.push({
        productId: product._id,
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
      const discountCalc = await validateAndCalculateDiscount(couponCode.trim(), subtotal);
      if (!discountCalc.valid || !discountCalc.discount) {
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
        notes: typeof notes === "string" ? notes.trim() : ""
      });
    } catch (orderCreateErr) {
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
    if (idempotencyKey) {
      recentSubmissions.set(idempotencyKey, {
        timestamp: Date.now(),
        orderId: newOrder._id.toString()
      });
    }
    (async () => {
      try {
        await sendCustomerOrderConfirmation({ order: newOrder });
        const activeAdmins = await User.find({
          role: { $in: ["admin", "super_admin"] },
          active: true
        }).select("email").lean();
        const adminEmails = activeAdmins.map((a) => a.email).filter(Boolean);
        if (adminEmails.length > 0) {
          await sendNewOrderAdminAlert({ order: newOrder, adminEmails });
        }
      } catch (notifyErr) {
        console.warn("[Order Notification Warning] Failed to dispatch order emails:", notifyErr);
      }
    })();
    res.status(201).json({
      success: true,
      message: "Order created successfully.",
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
      }
    });
  } catch (err) {
    console.error("[Create Order Error]", err);
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
var customerOrders_default = router6;

// server/routes/adminProducts.ts
import { Router as Router7 } from "express";
import mongoose14 from "mongoose";
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
        slug: `${p.id}-${Date.now().toString(36).slice(-4)}`,
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
      if (mongoose14.Types.ObjectId.isValid(category)) {
        filter.category = new mongoose14.Types.ObjectId(category);
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
      Product.countDocuments(filter),
      Product.find(filter).populate("category", "name slug").sort(sortObj).skip(skip).limit(limitNum).lean()
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
    if (!mongoose14.Types.ObjectId.isValid(id)) {
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
function createSlug(name2) {
  const base = name2.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
  return `${base}-${Date.now().toString(36).slice(-4)}`;
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
    if (!description || typeof description !== "string" || description.trim().length < 5) {
      res.status(400).json({ success: false, message: "Product description is required." });
      return;
    }
    if (!category) {
      res.status(400).json({ success: false, message: "Please select a product category." });
      return;
    }
    let categoryId = category;
    if (!mongoose14.Types.ObjectId.isValid(category)) {
      const cat = await Category.findOne({ slug: category });
      if (!cat) {
        res.status(400).json({ success: false, message: "Invalid category specified." });
        return;
      }
      categoryId = cat._id;
    }
    if (!Array.isArray(variants) || variants.length === 0) {
      res.status(400).json({ success: false, message: "At least one product variant (pricing and packaging) is required." });
      return;
    }
    const cleanedVariants = variants.map((v, idx) => {
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
    const finalSlug = slug && typeof slug === "string" && slug.trim() ? slug.trim().toLowerCase().replace(/[\s_]+/g, "-") : createSlug(name2);
    const existing = await Product.findOne({ slug: finalSlug });
    const productSlug = existing ? `${finalSlug}-${Date.now().toString(36).slice(-4)}` : finalSlug;
    const cleanedSpecs = Array.isArray(customSpecifications) ? customSpecifications.filter((s) => s && typeof s.label === "string" && s.label.trim() && typeof s.value === "string" && s.value.trim()).map((s) => ({ label: s.label.trim(), value: s.value.trim() })) : [];
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
    console.error("[Create Product Error]", err);
    const msg = err instanceof Error ? err.message : "Failed to create product.";
    res.status(400).json({ success: false, message: msg });
  }
});
router7.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose14.Types.ObjectId.isValid(id)) {
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
    if (slug) existingProduct.slug = String(slug).trim().toLowerCase().replace(/[\s_]+/g, "-");
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
      if (mongoose14.Types.ObjectId.isValid(category)) {
        existingProduct.category = new mongoose14.Types.ObjectId(category);
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
    }
    await existingProduct.save();
    const updated = await Product.findById(id).populate("category", "name slug");
    res.json({
      success: true,
      message: "Product updated successfully.",
      product: updated
    });
  } catch (err) {
    console.error("[Update Product Error]", err);
    const msg = err instanceof Error ? err.message : "Failed to update product.";
    res.status(400).json({ success: false, message: msg });
  }
});
router7.patch("/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose14.Types.ObjectId.isValid(id)) {
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
    if (!mongoose14.Types.ObjectId.isValid(id)) {
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
router7.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose14.Types.ObjectId.isValid(id)) {
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
import mongoose15 from "mongoose";
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
    if (!mongoose15.Types.ObjectId.isValid(id)) {
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
    if (!mongoose15.Types.ObjectId.isValid(id)) {
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
    if (!mongoose15.Types.ObjectId.isValid(id)) {
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
    if (!mongoose15.Types.ObjectId.isValid(id)) {
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
import mongoose16 from "mongoose";
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
      Order.countDocuments(filter),
      Order.find(filter).sort(sortObj).skip(skip).limit(limitNum).lean(),
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
      ])
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
router9.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose16.Types.ObjectId.isValid(id)) {
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
router9.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose16.Types.ObjectId.isValid(id)) {
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
    const validOrderStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled"
    ];
    if (orderStatus && validOrderStatuses.includes(orderStatus)) {
      order.orderStatus = orderStatus;
    }
    const validPaymentStatuses = ["pending", "paid", "failed", "refunded"];
    if (paymentStatus && validPaymentStatuses.includes(paymentStatus)) {
      order.paymentStatus = paymentStatus;
      if (paymentStatus === "paid" && !order.paymentDetails?.paidAt) {
        order.paymentDetails = {
          ...order.paymentDetails,
          paidAt: /* @__PURE__ */ new Date()
        };
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
      order.shipmentStatus = shipmentStatus;
    }
    if (trackingInfo && typeof trackingInfo === "object") {
      order.trackingInfo = {
        courierName: trackingInfo.courierName ? String(trackingInfo.courierName).trim() : order.trackingInfo?.courierName,
        trackingNumber: trackingInfo.trackingNumber ? String(trackingInfo.trackingNumber).trim() : order.trackingInfo?.trackingNumber,
        trackingUrl: trackingInfo.trackingUrl ? String(trackingInfo.trackingUrl).trim() : order.trackingInfo?.trackingUrl
      };
    }
    if (shippingAddress && typeof shippingAddress === "object") {
      if (shippingAddress.name) order.shippingAddress.name = String(shippingAddress.name).trim();
      if (shippingAddress.phone) order.shippingAddress.phone = String(shippingAddress.phone).trim();
      if (shippingAddress.addressLine1) order.shippingAddress.addressLine1 = String(shippingAddress.addressLine1).trim();
      if (shippingAddress.addressLine2 !== void 0) order.shippingAddress.addressLine2 = String(shippingAddress.addressLine2).trim();
      if (shippingAddress.city) order.shippingAddress.city = String(shippingAddress.city).trim();
      if (shippingAddress.state) order.shippingAddress.state = String(shippingAddress.state).trim();
      if (shippingAddress.pincode) order.shippingAddress.pincode = String(shippingAddress.pincode).trim();
      if (shippingAddress.landmark !== void 0) order.shippingAddress.landmark = String(shippingAddress.landmark).trim();
    }
    if (notes !== void 0) {
      order.notes = String(notes).trim();
    }
    await order.save();
    if (previousStatus !== order.orderStatus) {
      (async () => {
        try {
          await sendOrderStatusUpdate({
            order,
            previousStatus,
            newStatus: order.orderStatus
          });
        } catch (emailErr) {
          console.warn("[Status Notification Warning] Failed to dispatch status email:", emailErr);
        }
      })();
    }
    res.json({
      success: true,
      message: "Order updated successfully.",
      order
    });
  } catch (err) {
    console.error("[Update Order Error]", err);
    const msg = err instanceof Error ? err.message : "Failed to update order.";
    res.status(400).json({ success: false, message: msg });
  }
});
router9.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose16.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid order ID." });
      return;
    }
    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found." });
      return;
    }
    res.json({
      success: true,
      message: `Order #${order.orderNumber} deleted successfully.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete order." });
  }
});
var adminOrders_default = router9;

// server/routes/adminCustomers.ts
import { Router as Router10 } from "express";
import mongoose17 from "mongoose";
var router10 = Router10();
router10.use(requireAdmin);
router10.get("/", async (req, res) => {
  try {
    const {
      search = "",
      status = "all",
      sortBy = "newest",
      page = "1",
      limit = "50"
    } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;
    const filter = { role: "customer" };
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
      User.countDocuments(filter),
      User.find(filter).select("-password").sort(sortObj).skip(skip).limit(limitNum).lean()
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
    ]);
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
    if (!mongoose17.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid customer ID." });
      return;
    }
    const customer = await User.findOne({ _id: id, role: "customer" }).select("-password").lean();
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
    if (!mongoose17.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid customer ID." });
      return;
    }
    const customer = await User.findOne({ _id: id, role: "customer" });
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
router10.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose17.Types.ObjectId.isValid(id)) {
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
import mongoose18 from "mongoose";
var router11 = Router11();
router11.post("/validate", async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    const result = await validateAndCalculateDiscount(code, Number(subtotal) || 0);
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
    if (!mongoose18.Types.ObjectId.isValid(id)) {
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
      usageLimitPerUser = 1
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
    const newDiscount = await Discount.create({
      code: normalizedCode,
      type: type === "fixed" ? "fixed" : "percentage",
      value: numericValue,
      minimumOrder: Math.max(0, Number(minimumOrder) || 0),
      maximumDiscount: type === "percentage" && maximumDiscount && Number(maximumDiscount) > 0 ? Number(maximumDiscount) : null,
      active: Boolean(active),
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
    if (!mongoose18.Types.ObjectId.isValid(id)) {
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
    if (!mongoose18.Types.ObjectId.isValid(id)) {
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
    if (!mongoose18.Types.ObjectId.isValid(id)) {
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
import mongoose20 from "mongoose";

// server/models/Inquiry.ts
import mongoose19, { Schema as Schema8 } from "mongoose";
var inquirySchema = new Schema8(
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
      trim: true,
      index: true
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
      default: "new",
      index: true
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true
  }
);
var Inquiry = mongoose19.models.Inquiry || mongoose19.model("Inquiry", inquirySchema);

// server/routes/adminInquiries.ts
var router12 = Router12();
var handlePublicInquiry = async (req, res) => {
  try {
    const { name: name2, email: email2, phone: phone2, category = "general", message: message2 } = req.body;
    if (!name2 || typeof name2 !== "string" || name2.trim().length < 2) {
      res.status(400).json({ success: false, message: "Please provide your full name." });
      return;
    }
    if (!email2 || typeof email2 !== "string" || !email2.includes("@")) {
      res.status(400).json({ success: false, message: "Please provide a valid email address." });
      return;
    }
    if (!message2 || typeof message2 !== "string" || message2.trim().length < 5) {
      res.status(400).json({ success: false, message: "Please provide a descriptive inquiry message." });
      return;
    }
    if (mongoose20.connection.readyState !== 1) {
      const fallbackInquiry = {
        _id: new mongoose20.Types.ObjectId(),
        name: name2.trim(),
        email: email2.trim().toLowerCase(),
        phone: phone2 ? String(phone2).trim() : "",
        category: String(category).trim().toLowerCase(),
        message: message2.trim(),
        status: "new",
        createdAt: /* @__PURE__ */ new Date()
      };
      (async () => {
        try {
          await sendInquiryAcknowledgement({ inquiry: fallbackInquiry });
        } catch (err) {
          console.warn("[Inquiry Acknowledgement Warning]", err);
        }
      })();
      res.status(201).json({
        success: true,
        message: "Thank you! Your inquiry has been received. The Malwa Namkeen team will reach out shortly.",
        referenceId: fallbackInquiry._id.toString().slice(-6).toUpperCase(),
        inquiryId: fallbackInquiry._id
      });
      return;
    }
    const inquiry = await Inquiry.create({
      name: name2.trim(),
      email: email2.trim().toLowerCase(),
      phone: phone2 ? String(phone2).trim() : "",
      category: String(category).trim().toLowerCase(),
      message: message2.trim(),
      status: "new"
    });
    (async () => {
      try {
        await sendInquiryAcknowledgement({ inquiry });
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
      }
    })();
    res.status(201).json({
      success: true,
      message: "Thank you! Your inquiry has been received. The Malwa Namkeen team will reach out shortly.",
      referenceId: inquiry._id.toString().slice(-6).toUpperCase(),
      inquiryId: inquiry._id
    });
  } catch (err) {
    console.error("[Public Inquiry Error]", err);
    res.status(500).json({ success: false, message: "Failed to submit inquiry. Please try again or WhatsApp us." });
  }
};
router12.post("/public", handlePublicInquiry);
router12.post("/", handlePublicInquiry);
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
      Inquiry.countDocuments(filter),
      Inquiry.find(filter).sort(sortObj).skip(skip).limit(limitNum).lean(),
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
      ])
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
    if (!mongoose20.Types.ObjectId.isValid(id)) {
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
router12.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose20.Types.ObjectId.isValid(id)) {
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
});
router12.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose20.Types.ObjectId.isValid(id)) {
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
import crypto2 from "crypto";
import mongoose21 from "mongoose";
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
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      if (existing.role === "customer") {
        res.status(409).json({
          success: false,
          message: "An account with this email is currently registered as a customer. Please use a unique staff email address."
        });
        return;
      }
      res.status(409).json({
        success: false,
        message: "An administrator with this email address already exists."
      });
      return;
    }
    const rawToken = crypto2.randomBytes(32).toString("hex");
    const tokenHash = crypto2.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1e3);
    const newStaff = await User.create({
      name: cleanName,
      email: cleanEmail,
      role: assignedRole,
      active: true,
      invitationTokenHash: tokenHash,
      invitationExpiresAt: expiresAt,
      invitedBy: req.user?.userId ? new mongoose21.Types.ObjectId(req.user.userId) : void 0,
      invitedAt: /* @__PURE__ */ new Date()
    });
    const emailResult = await sendAdminInvitationEmail({
      email: cleanEmail,
      name: cleanName,
      token: rawToken,
      inviterName: req.user?.email || "Super Administrator"
    });
    res.status(201).json({
      success: true,
      message: `Invitation generated successfully for ${cleanEmail}.`,
      staff: {
        _id: String(newStaff._id),
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
        active: newStaff.active,
        isPendingInvitation: true,
        createdAt: newStaff.createdAt
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
    if (!mongoose21.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid staff ID." });
      return;
    }
    const staffMember = await User.findOne({ _id: id, role: { $in: ["admin", "super_admin"] } });
    if (!staffMember) {
      res.status(404).json({ success: false, message: "Administrator record not found." });
      return;
    }
    const isTargetSuperAdmin = staffMember.role === "super_admin";
    const isDemotingOrDeactivating = role && role !== "super_admin" && isTargetSuperAdmin || active === false && isTargetSuperAdmin && staffMember.active;
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
    if (role && (role === "admin" || role === "super_admin")) staffMember.role = role;
    if (typeof active === "boolean") staffMember.active = active;
    await staffMember.save();
    res.json({
      success: true,
      message: "Administrator account updated successfully.",
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
router13.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose21.Types.ObjectId.isValid(id)) {
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
    await User.findByIdAndDelete(id);
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
import { Router as Router14 } from "express";
import mongoose22 from "mongoose";
var router14 = Router14();
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
  fssaiNumber: "11422850001234",
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
    if (mongoose22.connection.readyState === 1) {
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
var publicSettingsRouter = Router14();
publicSettingsRouter.get("/public", handlePublicSettings);
publicSettingsRouter.get("/", handlePublicSettings);
router14.use(requireAdmin);
router14.get("/", async (_req, res) => {
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
router14.put("/", async (req, res) => {
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
var adminSettings_default = router14;

// server/routes/adminDashboard.ts
import { Router as Router15 } from "express";
var router15 = Router15();
router15.use(requireAdmin);
router15.get("/stats", async (req, res) => {
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
      ]),
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
      ]),
      // Recent 6 orders
      Order.find().sort({ createdAt: -1 }).limit(6).select("orderNumber customerInfo total orderStatus paymentStatus items createdAt").lean(),
      // Recent 5 customers
      User.find({ role: "customer" }).sort({ createdAt: -1 }).limit(5).select("name email phone active createdAt").lean(),
      // Recent 5 inquiries
      Inquiry.find().sort({ createdAt: -1 }).limit(5).select("name email phone category message status createdAt").lean(),
      // Products for low-stock scanning
      Product.find({ active: true }).select("name slug variants").lean(),
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
      ])
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
var adminDashboard_default = router15;

// server/routes/uploads.ts
import { Router as Router16 } from "express";
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
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif"
];
var MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
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
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const folder = getUploadFolder(target);
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        public_id: customFilename ? customFilename.replace(/\.[^/.]+$/, "") : void 0,
        overwrite: true
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
  configureCloudinary();
  const folder = getUploadFolder(target);
  const result = await cloudinary.uploader.upload(base64Data, {
    folder,
    resource_type: "image"
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
  configureCloudinary();
  if (!publicId || !publicId.startsWith("malwa-namkeen-house/")) {
    throw new Error("Deletion restricted: publicId must belong to malwa-namkeen-house namespace.");
  }
  const res = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  return {
    success: res.result === "ok",
    result: res.result
  };
}

// server/routes/uploads.ts
var router16 = Router16();
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: JPEG, PNG, WebP, AVIF, GIF.`));
    }
  }
});
router16.post(
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
router16.delete("/", requireAdmin, async (req, res) => {
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
var uploads_default = router16;

// server/routes/enquiries.ts
import { Router as Router17 } from "express";
import { ZodError } from "zod";
import mongoose23 from "mongoose";

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

// server/lib/email.ts
import { Resend as Resend2 } from "resend";
var _resend = null;
function getResend() {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  _resend = new Resend2(key);
  return _resend;
}
var FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? `no-reply@malwanamkeen.com`;
var ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL ?? BUSINESS.email;
function esc(s) {
  if (s == null) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function wrap(title, body, isDark = false) {
  const bg = isDark ? "#3C0815" : "#F6EFE3";
  const card = isDark ? "#4F0A18" : "#FFFDF8";
  const text = isDark ? "#FFF8EC" : "#34211D";
  const muted = isDark ? "rgba(255,248,236,0.70)" : "#75645C";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:${bg};font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${bg};padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:${isDark ? "#3C0815" : "#3C0815"};border-radius:16px 16px 0 0;padding:28px 36px;text-align:center;">
          <p style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#FFF8EC;letter-spacing:-0.01em;">
            ${esc(BUSINESS.name)}
          </p>
          <p style="margin:4px 0 0;font-size:11px;color:rgba(255,248,236,0.60);letter-spacing:0.18em;text-transform:uppercase;">
            ${esc(BUSINESS.tagline)}
          </p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:${card};border-radius:0 0 16px 16px;padding:36px;color:${text};">
          ${body}
          <!-- Footer -->
          <div style="margin-top:32px;padding-top:24px;border-top:1px solid rgba(200,154,61,0.24);">
            <p style="margin:0;font-size:12px;color:${muted};line-height:1.6;">
              ${esc(BUSINESS.name)} \xB7 ${esc(BUSINESS.address.full)}<br/>
              <a href="mailto:${esc(BUSINESS.email)}" style="color:#C89A3D;">${esc(BUSINESS.email)}</a> \xB7
              ${esc(BUSINESS.phone)}
            </p>
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
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
async function send(opts) {
  const client = getResend();
  if (!client) {
    console.warn("[Email] RESEND_API_KEY not set \u2014 email skipped.");
    return { sent: false, reason: "not_configured" };
  }
  try {
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html
    });
    if (error || !data?.id) {
      console.error("[Email] Resend error:", error?.message ?? "no data");
      return { sent: false, reason: "send_failed", error: error?.message };
    }
    return { sent: true, messageId: data.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[Email] send threw:", msg);
    return { sent: false, reason: "send_failed", error: msg };
  }
}
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
  return send({
    to: d.customerEmail,
    subject: `We received your enquiry \u2014 ${BUSINESS.name}`,
    html: wrap(`Enquiry Received \u2014 ${BUSINESS.name}`, body)
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
  return send({
    to: ADMIN_EMAIL,
    subject: `[${d.categoryLabel}] ${d.customerName} \u2014 ${BUSINESS.name}`,
    html: wrap(`New Enquiry \u2014 ${BUSINESS.name}`, body, true)
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
  return send({
    to: d.customerEmail,
    subject: `Reservation enquiry received \u2014 ${BUSINESS.name}`,
    html: wrap(`Reservation Enquiry \u2014 ${BUSINESS.name}`, body)
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
  return send({
    to: ADMIN_EMAIL,
    subject: `[Reservation] ${d.customerName} \xB7 ${d.reservationDate} \xB7 ${d.guestCount} guests`,
    html: wrap(`New Reservation \u2014 ${BUSINESS.name}`, body, true)
  });
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
var router17 = Router17();
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
router17.post("/contact", async (req, res) => {
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
  let id = new mongoose23.Types.ObjectId().toString();
  try {
    const doc = await Inquiry.create({
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone ?? "",
      category: parsed.category,
      message: parsed.message,
      status: "new"
    });
    id = String(doc._id);
  } catch (err) {
    console.error("[Contact] MongoDB save error:", err instanceof Error ? err.message : err);
  }
  const emailData = {
    referenceId: id,
    customerName: parsed.name,
    customerEmail: parsed.email,
    phone: parsed.phone ?? "",
    category: parsed.category,
    categoryLabel: categoryLabel(parsed.category),
    message: parsed.message,
    locationId: parsed.location_id,
    submittedAt: isoNow()
  };
  Promise.allSettled([
    sendContactCustomerEmail(emailData),
    sendContactAdminEmail(emailData)
  ]).catch(() => {
  });
  res.json({
    success: true,
    message: "Your enquiry has been received. Our team will contact you shortly.",
    referenceId: id,
    whatsappUrl: getWaUrlForCategory(parsed.category)
  });
});
router17.post("/reservation", async (req, res) => {
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
  let id = new mongoose23.Types.ObjectId().toString();
  try {
    const doc = await Inquiry.create({
      name: parsed.customer_name,
      email: parsed.email,
      phone: parsed.phone,
      category: "reservation",
      message: parsed.special_request || `Reservation request for ${parsed.guest_count} guests on ${parsed.reservation_date} at ${parsed.preferred_time}`,
      status: "new"
    });
    if (doc) id = String(doc._id);
  } catch (err) {
    console.error("[Reservation] MongoDB save error:", err instanceof Error ? err.message : err);
  }
  const emailData = {
    referenceId: id,
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
  Promise.allSettled([
    sendReservationCustomerEmail(emailData),
    sendReservationAdminEmail(emailData)
  ]).catch(() => {
  });
  res.json({
    success: true,
    message: "Reservation enquiry received. This is not a confirmed booking yet. Our team will contact you to confirm availability.",
    referenceId: id,
    whatsappUrl: WA_URLS.reservation
  });
});
router17.post("/katering", async (req, res) => {
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
  let id = new mongoose23.Types.ObjectId().toString();
  try {
    const doc = await Inquiry.create({
      name: parsed.name,
      email: parsed.email || "not-provided@customer.local",
      phone: parsed.phone,
      category: "catering",
      message: `Event: ${parsed.event_type}, Occasion: ${parsed.occasion || ""}, Guests: ${parsed.guest_count || ""}. Message: ${parsed.message || ""}`,
      status: "new"
    });
    if (doc) id = String(doc._id);
  } catch (err) {
    console.error("[Katering] MongoDB save error:", err instanceof Error ? err.message : err);
  }
  res.json({
    success: true,
    message: "Catering enquiry received. Our events team will reach out within 24 hours.",
    referenceId: id,
    whatsappUrl: WA_URLS.catering
  });
});
router17.post("/gifting", async (req, res) => {
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
  let id = new mongoose23.Types.ObjectId().toString();
  try {
    const doc = await Inquiry.create({
      name: parsed.name,
      email: parsed.email || "not-provided@customer.local",
      phone: parsed.phone,
      category: "gifting",
      message: parsed.message || `Gifting inquiry for ${parsed.gift_type}, Quantity: ${parsed.quantity || ""}`,
      status: "new"
    });
    if (doc) id = String(doc._id);
  } catch (err) {
    console.error("[Gifting] MongoDB save error:", err instanceof Error ? err.message : err);
  }
  res.json({
    success: true,
    message: "Gift enquiry received. We will prepare options for you shortly.",
    referenceId: id,
    whatsappUrl: WA_URLS.gifting
  });
});
var enquiries_default = router17;

// server/routes/adminBanners.ts
import { Router as Router18 } from "express";

// server/models/Banner.ts
import mongoose24, { Schema as Schema9 } from "mongoose";
var bannerSchema = new Schema9(
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
var Banner = mongoose24.models.Banner || mongoose24.model("Banner", bannerSchema);

// server/routes/adminBanners.ts
var router18 = Router18();
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
router18.use(requireAdmin);
router18.get("/", async (req, res) => {
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
router18.post("/", async (req, res) => {
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
router18.put("/:id", async (req, res) => {
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
router18.patch("/:id/toggle", async (req, res) => {
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
router18.patch("/reorder", async (req, res) => {
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
router18.delete("/:id", async (req, res) => {
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
var adminBanners_default = router18;

// server/routes/banners.ts
import { Router as Router19 } from "express";
var router19 = Router19();
router19.get("/", async (_req, res) => {
  try {
    await ensureInitialBanners();
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
var banners_default = router19;

// server/routes/sitemap.ts
import { Router as Router20 } from "express";
var router20 = Router20();
router20.get("/sitemap.xml", async (req, res) => {
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
router20.get("/robots.txt", (req, res) => {
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
var sitemap_default = router20;

// server/api-entry.ts
var app = express();
var isProd = process.env.NODE_ENV === "production";
var allowedOrigins = (() => {
  const configured = process.env.ALLOWED_ORIGINS ?? "";
  const base = configured ? configured.split(",").map((s) => s.trim().replace(/\/+$/, "")).filter(Boolean) : [];
  if (!isProd) {
    base.push("http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://localhost:3000");
  }
  const appUrl = process.env.APP_URL;
  if (appUrl) base.push(appUrl.trim().replace(/\/+$/, ""));
  return base;
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
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.setHeader("Vary", "Origin");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(async (_req, _res, next) => {
  try {
    await connectMongoDB();
  } catch (err) {
    console.warn("[Vercel API] MongoDB connection attempt:", err instanceof Error ? err.message : err);
  }
  next();
});
app.use("/", sitemap_default);
app.get(["/health", "/api/health"], (_req, res) => {
  const mongo = getMongoStatus();
  res.json({
    status: "ok",
    time: (/* @__PURE__ */ new Date()).toISOString(),
    service: BUSINESS.name,
    mongodb: mongo.state
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
  { path: "/admin/inquiries", router: adminInquiries_default },
  { path: "/admin/discounts", router: adminDiscounts_default },
  { path: "/admin/customers", router: adminCustomers_default },
  { path: "/admin/orders", router: adminOrders_default },
  { path: "/admin/categories", router: adminCategories_default },
  { path: "/admin/products", router: adminProducts_default },
  { path: "/admin/banners", router: adminBanners_default },
  { path: "/banners", router: banners_default },
  { path: "/admin/uploads", router: uploads_default },
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
