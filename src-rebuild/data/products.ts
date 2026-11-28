export interface ProductWeightOption {
  weight: string;
  price: number;
  originalPrice?: number;
}

export interface CustomSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  _id?: string;
  slug?: string;
  name: string;
  hindiName?: string;
  tagline: string;
  category: string;
  categoryId?: string;
  categoryLabel: string;
  description: string;
  story: string;
  ingredients: string[];
  spiceLevel: 'Mild' | 'Medium' | 'Zesty' | 'Clove Hot' | 'Sweet & Tangy' | 'High';
  shelfLife: string;
  image: string;
  images?: string[];
  badge?: string;
  rating: number;
  reviewCount: number;
  featured?: boolean;
  isBestSeller?: boolean;
  isCombo?: boolean;
  options: ProductWeightOption[];
  isAvailable: boolean;
  isVegetarian: boolean;
  oilUsed: string;
  dietaryStandard?: string;
  packagingType?: string;
  customSpecifications?: CustomSpec[];
}

export interface ShopCategory {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  image?: string;
}

export const SHOP_CATEGORIES: ShopCategory[] = [
  {
    "id": "all",
    "label": "All Delicacies",
    "shortLabel": "All",
    "description": "Explore our complete heritage collection of small-batch savouries, sweets, and curated gift boxes.",
    "image": "/products/ratlami-laung-sev.jpg"
  },
  {
    "id": "sev",
    "label": "Sev",
    "shortLabel": "Sev",
    "description": "Crisp, thick & fine aromatic sevs extruded by hand and fried in pure cold-pressed groundnut oil.",
    "image": "/products/ratlami-laung-sev.jpg"
  },
  {
    "id": "mixture",
    "label": "Mixture",
    "shortLabel": "Mixture",
    "description": "Time-honoured Malwa blends balancing sweet, tangy, and fiery spices with nuts, boondi, and lentils.",
    "image": "/products/indore-khatta-meetha-mixture.jpg"
  },
  {
    "id": "fariyali",
    "label": "Fariyali",
    "shortLabel": "Fariyali",
    "description": "Pure sendha namak fasting delicacies, crispy potato laccha chivda, sabudana mixture, and wafers.",
    "image": "/products/khatta-meetha-aloo-fariyali-chivda.jpg"
  },
  {
    "id": "munchies-snacks",
    "label": "Munchies / Snacks",
    "shortLabel": "Munchies / Snacks",
    "description": "Traditional afternoon chai accompaniments, Gujarati papdi, banana chips, and crispy seasoned peanuts.",
    "image": "/products/banana-chips.jpg"
  }
];

export const PRODUCTS: Product[] = [
  {
    "id": "ratlami-laung-sev",
    "_id": "6aeac18ce32ed580fefd700c",
    "slug": "ratlami-laung-sev",
    "name": "Ratlami Laung Sev",
    "hindiName": "रतलामी लौंग सेव",
    "tagline": "Bold Clove Crunch",
    "category": "sev",
    "categoryId": "6aeac18ce32ed580fefd7005",
    "categoryLabel": "Sev",
    "description": "Crispy, spicy sev with the distinctive warmth and aroma of cloves.",
    "story": "Inspired by Ratlam's famous sev tradition and the bold flavours of the Malwa region.",
    "ingredients": [
      "Gram Flour (Besan)",
      "Whole Cloves (Laung)",
      "Black Pepper",
      "Carom Seeds (Ajwain)",
      "Asafoetida (Hing)",
      "Cold-Pressed Groundnut Oil",
      "Rock Salt"
    ],
    "spiceLevel": "High",
    "shelfLife": "90 Days",
    "image": "/products/ratlami-laung-sev.jpg",
    "images": [
      "/products/ratlami-laung-sev.jpg"
    ],
    "badge": "Regional Favourite",
    "rating": 4.9,
    "reviewCount": 0,
    "featured": true,
    "isBestSeller": true,
    "isCombo": false,
    "options": [
      {
        "weight": "250g",
        "price": 100,
        "originalPrice": 120
      },
      {
        "weight": "500g",
        "price": 200,
        "originalPrice": 240
      },
      {
        "weight": "1kg",
        "price": 400,
        "originalPrice": 480
      }
    ],
    "isAvailable": true,
    "isVegetarian": true,
    "oilUsed": "Pure Cold-Pressed Groundnut Oil",
    "dietaryStandard": "100% Pure Vegetarian (Satvik)",
    "packagingType": "Food-Grade Multi-Layer Aroma Seal Pouch",
    "customSpecifications": [
      {
        "label": "Flavour",
        "value": "Spicy, Clove"
      },
      {
        "label": "SKU Code",
        "value": "MNH-SEV-RLS"
      }
    ]
  },
  {
    "id": "ujjaini-hing-sev",
    "_id": "6aeac18ce32ed580fefd7010",
    "slug": "ujjaini-hing-sev",
    "name": "Ujjaini Hing Sev",
    "hindiName": "उज्जैनी हींग सेव",
    "tagline": "Classic Hing Flavour",
    "category": "sev",
    "categoryId": "6aeac18ce32ed580fefd7005",
    "categoryLabel": "Sev",
    "description": "Crispy traditional sev with the distinctive aroma and taste of hing.",
    "story": "Inspired by Ujjain's traditional namkeen culture and familiar regional flavours.",
    "ingredients": [
      "Gram Flour (Besan)",
      "Pure Compounded Hing (Asafoetida)",
      "Roasted Cumin",
      "Carom Seeds",
      "Cold-Pressed Groundnut Oil",
      "Rock Salt"
    ],
    "spiceLevel": "Medium",
    "shelfLife": "90 Days",
    "image": "/products/ujjaini-hing-sev.jpg",
    "images": [
      "/products/ujjaini-hing-sev.jpg"
    ],
    "badge": "Malwa Speciality",
    "rating": 4.9,
    "reviewCount": 0,
    "featured": true,
    "isBestSeller": true,
    "isCombo": false,
    "options": [
      {
        "weight": "250g",
        "price": 100,
        "originalPrice": 120
      },
      {
        "weight": "500g",
        "price": 200,
        "originalPrice": 240
      },
      {
        "weight": "1kg",
        "price": 400,
        "originalPrice": 480
      }
    ],
    "isAvailable": true,
    "isVegetarian": true,
    "oilUsed": "Pure Cold-Pressed Groundnut Oil",
    "dietaryStandard": "100% Pure Vegetarian (Satvik)",
    "packagingType": "Food-Grade Multi-Layer Aroma Seal Pouch",
    "customSpecifications": [
      {
        "label": "Flavour",
        "value": "Hing, Savoury"
      },
      {
        "label": "SKU Code",
        "value": "MNH-SEV-UHS"
      }
    ]
  },
  {
    "id": "teekha-lasun-sev",
    "_id": "6aeac18ce32ed580fefd7014",
    "slug": "teekha-lasun-sev",
    "name": "Teekha Lasun Sev",
    "hindiName": "तीखा लहसुन सेव",
    "tagline": "Bold Garlic Punch",
    "category": "sev",
    "categoryId": "6aeac18ce32ed580fefd7005",
    "categoryLabel": "Sev",
    "description": "Crunchy, spicy sev packed with a strong garlic flavour.",
    "story": "A bold regional namkeen inspired by Malwa's love for spicy, flavourful snacks.",
    "ingredients": [
      "Gram Flour (Besan)",
      "Fresh Garlic (Lasun Paste)",
      "Kashmiri Red Chilli",
      "Carom Seeds",
      "Groundnut Oil",
      "Pink Salt"
    ],
    "spiceLevel": "High",
    "shelfLife": "90 Days",
    "image": "/products/teekha-lasun-sev.jpg",
    "images": [
      "/products/teekha-lasun-sev.jpg"
    ],
    "badge": "Spicy Favourite",
    "rating": 4.9,
    "reviewCount": 0,
    "featured": true,
    "isBestSeller": true,
    "isCombo": false,
    "options": [
      {
        "weight": "250g",
        "price": 100,
        "originalPrice": 120
      },
      {
        "weight": "500g",
        "price": 200,
        "originalPrice": 240
      },
      {
        "weight": "1kg",
        "price": 400,
        "originalPrice": 480
      }
    ],
    "isAvailable": true,
    "isVegetarian": true,
    "oilUsed": "Pure Cold-Pressed Groundnut Oil",
    "dietaryStandard": "100% Pure Vegetarian (Satvik)",
    "packagingType": "Food-Grade Multi-Layer Aroma Seal Pouch",
    "customSpecifications": [
      {
        "label": "Flavour",
        "value": "Garlic, Spicy"
      },
      {
        "label": "SKU Code",
        "value": "MNH-SEV-TLS"
      }
    ]
  },
  {
    "id": "indori-poha-sev",
    "_id": "6aeac18ce32ed580fefd7018",
    "slug": "indori-poha-sev",
    "name": "Indori Poha Sev",
    "hindiName": "इंदौरी पोहा सेव",
    "tagline": "Crunchy Indori Twist",
    "category": "sev",
    "categoryId": "6aeac18ce32ed580fefd7005",
    "categoryLabel": "Sev",
    "description": "A crunchy combination of sev and nutki, inspired by Indore's much-loved snack culture.",
    "story": "Inspired by Indore's distinctive street-food culture and its love for creative namkeen combinations.",
    "ingredients": [
      "Gram Flour (Besan)",
      "Nutki (Fried Gram Pulses)",
      "Turmeric",
      "Roasted Cumin",
      "Groundnut Oil",
      "Rock Salt"
    ],
    "spiceLevel": "Medium",
    "shelfLife": "90 Days",
    "image": "/products/indori-poha-sev.jpg",
    "images": [
      "/products/indori-poha-sev.jpg"
    ],
    "badge": "Indori Favourite",
    "rating": 4.9,
    "reviewCount": 0,
    "featured": false,
    "isBestSeller": false,
    "isCombo": false,
    "options": [
      {
        "weight": "250g",
        "price": 100,
        "originalPrice": 120
      },
      {
        "weight": "500g",
        "price": 200,
        "originalPrice": 240
      },
      {
        "weight": "1kg",
        "price": 400,
        "originalPrice": 480
      }
    ],
    "isAvailable": true,
    "isVegetarian": true,
    "oilUsed": "Pure Cold-Pressed Groundnut Oil",
    "dietaryStandard": "100% Pure Vegetarian (Satvik)",
    "packagingType": "Food-Grade Multi-Layer Aroma Seal Pouch",
    "customSpecifications": [
      {
        "label": "Flavour",
        "value": "Savoury, Crunchy"
      },
      {
        "label": "SKU Code",
        "value": "MNH-SEV-IPS"
      }
    ]
  },
  {
    "id": "teekha-mixture",
    "_id": "6aeac18ce32ed580fefd701c",
    "slug": "teekha-mixture",
    "name": "Teekha Mixture",
    "hindiName": "तीखा मिक्सचर",
    "tagline": "Full-On Spice",
    "category": "mixture",
    "categoryId": "6aeac18ce32ed580fefd7006",
    "categoryLabel": "Mixture",
    "description": "A crunchy traditional mixture with a bold, spicy blend of namkeen ingredients.",
    "story": "A classic Indian namkeen combination inspired by the bold flavours of Malwa.",
    "ingredients": [
      "Crispy Sev",
      "Fried Masoor Dal",
      "Roasted Peanuts",
      "Crispy Boondi",
      "Red Chilli Powder",
      "Chaat Masala",
      "Groundnut Oil"
    ],
    "spiceLevel": "High",
    "shelfLife": "90 Days",
    "image": "/products/teekha-mixture.jpg",
    "images": [
      "/products/teekha-mixture.jpg"
    ],
    "badge": "Spicy Favourite",
    "rating": 4.9,
    "reviewCount": 0,
    "featured": true,
    "isBestSeller": false,
    "isCombo": false,
    "options": [
      {
        "weight": "250g",
        "price": 100,
        "originalPrice": 120
      },
      {
        "weight": "500g",
        "price": 200,
        "originalPrice": 240
      },
      {
        "weight": "1kg",
        "price": 400,
        "originalPrice": 480
      }
    ],
    "isAvailable": true,
    "isVegetarian": true,
    "oilUsed": "Pure Cold-Pressed Groundnut Oil",
    "dietaryStandard": "100% Pure Vegetarian (Satvik)",
    "packagingType": "Food-Grade Multi-Layer Aroma Seal Pouch",
    "customSpecifications": [
      {
        "label": "Flavour",
        "value": "Spicy, Savoury"
      },
      {
        "label": "SKU Code",
        "value": "MNH-MIX-TM"
      }
    ]
  },
  {
    "id": "indore-khatta-meetha-mixture",
    "_id": "6aeac18ce32ed580fefd7020",
    "slug": "indore-khatta-meetha-mixture",
    "name": "Indore Khatta Meetha Mixture",
    "hindiName": "इंदौरी खट्टा मीठा मिक्सचर",
    "tagline": "Sweet Meets Tangy",
    "category": "mixture",
    "categoryId": "6aeac18ce32ed580fefd7006",
    "categoryLabel": "Mixture",
    "description": "A crunchy Indori-style mixture bringing together sweet, tangy and savoury flavours.",
    "story": "Inspired by Indore's fondness for balanced sweet, sour and savoury namkeen flavours.",
    "ingredients": [
      "Crisp Sev",
      "Sago Wafers",
      "Roasted Peanuts",
      "Fried Boondi",
      "Golden Raisins",
      "Dry Mango Powder (Amchur)",
      "Raw Sugar",
      "Groundnut Oil"
    ],
    "spiceLevel": "Sweet & Tangy",
    "shelfLife": "90 Days",
    "image": "/products/indore-khatta-meetha-mixture.jpg",
    "images": [
      "/products/indore-khatta-meetha-mixture.jpg"
    ],
    "badge": "Sweet & Tangy",
    "rating": 4.9,
    "reviewCount": 0,
    "featured": true,
    "isBestSeller": true,
    "isCombo": false,
    "options": [
      {
        "weight": "250g",
        "price": 100,
        "originalPrice": 120
      },
      {
        "weight": "500g",
        "price": 200,
        "originalPrice": 240
      },
      {
        "weight": "1kg",
        "price": 400,
        "originalPrice": 480
      }
    ],
    "isAvailable": true,
    "isVegetarian": true,
    "oilUsed": "Pure Cold-Pressed Groundnut Oil",
    "dietaryStandard": "100% Pure Vegetarian (Satvik)",
    "packagingType": "Food-Grade Multi-Layer Aroma Seal Pouch",
    "customSpecifications": [
      {
        "label": "Flavour",
        "value": "Sweet, Tangy, Savoury"
      },
      {
        "label": "SKU Code",
        "value": "MNH-MIX-IKM"
      }
    ]
  },
  {
    "id": "teekha-aloo-fariyali-chivda",
    "_id": "6aeac18ce32ed580fefd7024",
    "slug": "teekha-aloo-fariyali-chivda",
    "name": "Teekha Aloo Fariyali Chivda",
    "hindiName": "तीखा आलू फरियाली चिवड़ा",
    "tagline": "Spicy Potato Crunch",
    "category": "fariyali",
    "categoryId": "6aeac18ce32ed580fefd7007",
    "categoryLabel": "Fariyali",
    "description": "Crispy potato-based fariyali chivda with a spicy, savoury flavour.",
    "story": "A traditional fasting-inspired snack made for those who enjoy a little spice with their crunch.",
    "ingredients": [
      "Crispy Potato Laccha",
      "Roasted Peanuts",
      "Sendha Namak (Rock Salt)",
      "Red Chilli Powder",
      "Curry Leaves",
      "Groundnut Oil"
    ],
    "spiceLevel": "High",
    "shelfLife": "90 Days",
    "image": "/products/teekha-aloo-fariyali-chivda.jpg",
    "images": [
      "/products/teekha-aloo-fariyali-chivda.jpg"
    ],
    "badge": "Fasting Favourite",
    "rating": 4.9,
    "reviewCount": 0,
    "featured": false,
    "isBestSeller": false,
    "isCombo": false,
    "options": [
      {
        "weight": "250g",
        "price": 80,
        "originalPrice": 100
      },
      {
        "weight": "500g",
        "price": 160,
        "originalPrice": 200
      },
      {
        "weight": "1kg",
        "price": 320,
        "originalPrice": 400
      }
    ],
    "isAvailable": true,
    "isVegetarian": true,
    "oilUsed": "Pure Cold-Pressed Groundnut Oil",
    "dietaryStandard": "100% Pure Vegetarian (Satvik)",
    "packagingType": "Food-Grade Multi-Layer Aroma Seal Pouch",
    "customSpecifications": [
      {
        "label": "Flavour",
        "value": "Spicy, Savoury"
      },
      {
        "label": "SKU Code",
        "value": "MNH-FAR-TAFC"
      }
    ]
  },
  {
    "id": "khatta-meetha-aloo-fariyali-chivda",
    "_id": "6aeac18ce32ed580fefd7028",
    "slug": "khatta-meetha-aloo-fariyali-chivda",
    "name": "Khatta Meetha Aloo Fariyali Chivda",
    "hindiName": "खट्टा मीठा आलू फरियाली चिवड़ा",
    "tagline": "Sweet Tangy Crunch",
    "category": "fariyali",
    "categoryId": "6aeac18ce32ed580fefd7007",
    "categoryLabel": "Fariyali",
    "description": "Crispy potato-based fariyali chivda with a delightful sweet and tangy taste.",
    "story": "A sweet and tangy take on traditional potato-based fasting snacks.",
    "ingredients": [
      "Potato Laccha",
      "Roasted Peanuts",
      "Kishmish (Raisins)",
      "Sendha Namak",
      "Amchur Powder",
      "Sugar",
      "Peanut Oil"
    ],
    "spiceLevel": "Sweet & Tangy",
    "shelfLife": "90 Days",
    "image": "/products/khatta-meetha-aloo-fariyali-chivda.jpg",
    "images": [
      "/products/khatta-meetha-aloo-fariyali-chivda.jpg"
    ],
    "badge": "Sweet & Tangy",
    "rating": 4.9,
    "reviewCount": 0,
    "featured": true,
    "isBestSeller": false,
    "isCombo": false,
    "options": [
      {
        "weight": "250g",
        "price": 80,
        "originalPrice": 100
      },
      {
        "weight": "500g",
        "price": 160,
        "originalPrice": 200
      },
      {
        "weight": "1kg",
        "price": 320,
        "originalPrice": 400
      }
    ],
    "isAvailable": true,
    "isVegetarian": true,
    "oilUsed": "Pure Cold-Pressed Groundnut Oil",
    "dietaryStandard": "100% Pure Vegetarian (Satvik)",
    "packagingType": "Food-Grade Multi-Layer Aroma Seal Pouch",
    "customSpecifications": [
      {
        "label": "Flavour",
        "value": "Sweet, Tangy"
      },
      {
        "label": "SKU Code",
        "value": "MNH-FAR-KMAFC"
      }
    ]
  },
  {
    "id": "sabudana-fariyali-mixture",
    "_id": "6aeac18ce32ed580fefd702c",
    "slug": "sabudana-fariyali-mixture",
    "name": "Sabudana Fariyali Mixture",
    "hindiName": "साबूदाना फरियाली मिक्सचर",
    "tagline": "Light & Crunchy",
    "category": "fariyali",
    "categoryId": "6aeac18ce32ed580fefd7007",
    "categoryLabel": "Fariyali",
    "description": "A crunchy sabudana-based mixture prepared in the traditional fariyali style.",
    "story": "Inspired by India's traditional fasting food culture and familiar regional flavours.",
    "ingredients": [
      "Puffed Sago Pearls (Sabudana)",
      "Crispy Potato Sticks",
      "Roasted Peanuts",
      "Curry Leaves",
      "Sendha Namak",
      "Cold-Pressed Peanut Oil"
    ],
    "spiceLevel": "Mild",
    "shelfLife": "90 Days",
    "image": "/products/sabudana-fariyali-mixture.jpg",
    "images": [
      "/products/sabudana-fariyali-mixture.jpg"
    ],
    "badge": "Fasting Special",
    "rating": 4.9,
    "reviewCount": 0,
    "featured": false,
    "isBestSeller": false,
    "isCombo": false,
    "options": [
      {
        "weight": "250g",
        "price": 80,
        "originalPrice": 100
      },
      {
        "weight": "500g",
        "price": 160,
        "originalPrice": 200
      },
      {
        "weight": "1kg",
        "price": 320,
        "originalPrice": 400
      }
    ],
    "isAvailable": true,
    "isVegetarian": true,
    "oilUsed": "Pure Cold-Pressed Groundnut Oil",
    "dietaryStandard": "100% Pure Vegetarian (Satvik)",
    "packagingType": "Food-Grade Multi-Layer Aroma Seal Pouch",
    "customSpecifications": [
      {
        "label": "Flavour",
        "value": "Savoury, Crunchy"
      },
      {
        "label": "SKU Code",
        "value": "MNH-FAR-SFM"
      }
    ]
  },
  {
    "id": "salted-aloo-wafers",
    "_id": "6aeac18ce32ed580fefd7030",
    "slug": "salted-aloo-wafers",
    "name": "Salted Aloo Wafers",
    "hindiName": "नमकीन आलू वेफर्स",
    "tagline": "Simple Salty Crunch",
    "category": "fariyali",
    "categoryId": "6aeac18ce32ed580fefd7007",
    "categoryLabel": "Fariyali",
    "description": "Thin, crispy potato wafers with a simple salted flavour.",
    "story": "A familiar Indian snack loved for its simple taste and satisfying crunch.",
    "ingredients": [
      "Fresh Farm Potatoes",
      "Sendha Namak (Rock Salt)",
      "Cold-Pressed Groundnut Oil"
    ],
    "spiceLevel": "Mild",
    "shelfLife": "90 Days",
    "image": "/products/salted-aloo-wafers.jpg",
    "images": [
      "/products/salted-aloo-wafers.jpg"
    ],
    "badge": "Classic Favourite",
    "rating": 4.9,
    "reviewCount": 0,
    "featured": false,
    "isBestSeller": false,
    "isCombo": false,
    "options": [
      {
        "weight": "250g",
        "price": 80,
        "originalPrice": 100
      },
      {
        "weight": "500g",
        "price": 160,
        "originalPrice": 200
      },
      {
        "weight": "1kg",
        "price": 320,
        "originalPrice": 400
      }
    ],
    "isAvailable": true,
    "isVegetarian": true,
    "oilUsed": "Pure Cold-Pressed Groundnut Oil",
    "dietaryStandard": "100% Pure Vegetarian (Satvik)",
    "packagingType": "Food-Grade Multi-Layer Aroma Seal Pouch",
    "customSpecifications": [
      {
        "label": "Flavour",
        "value": "Salted"
      },
      {
        "label": "SKU Code",
        "value": "MNH-FAR-SAW"
      }
    ]
  },
  {
    "id": "teekha-aloo-wafers",
    "_id": "6aeac18ce32ed580fefd7034",
    "slug": "teekha-aloo-wafers",
    "name": "Teekha Aloo Wafers",
    "hindiName": "तीखा आलू वेफर्स",
    "tagline": "Spicy Potato Crunch",
    "category": "fariyali",
    "categoryId": "6aeac18ce32ed580fefd7007",
    "categoryLabel": "Fariyali",
    "description": "Crispy potato wafers with a bold and spicy seasoning.",
    "story": "A spicy twist on a much-loved Indian potato snack.",
    "ingredients": [
      "Fresh Potatoes",
      "Red Chilli Seasoning",
      "Sendha Namak",
      "Groundnut Oil"
    ],
    "spiceLevel": "High",
    "shelfLife": "90 Days",
    "image": "/products/teekha-aloo-wafers.jpg",
    "images": [
      "/products/teekha-aloo-wafers.jpg"
    ],
    "badge": "Spicy Favourite",
    "rating": 4.9,
    "reviewCount": 0,
    "featured": false,
    "isBestSeller": false,
    "isCombo": false,
    "options": [
      {
        "weight": "250g",
        "price": 80,
        "originalPrice": 100
      },
      {
        "weight": "500g",
        "price": 160,
        "originalPrice": 200
      },
      {
        "weight": "1kg",
        "price": 320,
        "originalPrice": 400
      }
    ],
    "isAvailable": true,
    "isVegetarian": true,
    "oilUsed": "Pure Cold-Pressed Groundnut Oil",
    "dietaryStandard": "100% Pure Vegetarian (Satvik)",
    "packagingType": "Food-Grade Multi-Layer Aroma Seal Pouch",
    "customSpecifications": [
      {
        "label": "Flavour",
        "value": "Spicy"
      },
      {
        "label": "SKU Code",
        "value": "MNH-FAR-TAW"
      }
    ]
  },
  {
    "id": "khatta-meetha-aloo-wafers",
    "_id": "6aeac18ce32ed580fefd7038",
    "slug": "khatta-meetha-aloo-wafers",
    "name": "Khatta Meetha Aloo Wafers",
    "hindiName": "खट्टा मीठा आलू वेफर्स",
    "tagline": "Tangy Potato Crunch",
    "category": "fariyali",
    "categoryId": "6aeac18ce32ed580fefd7007",
    "categoryLabel": "Fariyali",
    "description": "Crispy potato wafers with a delicious balance of sweet and tangy flavours.",
    "story": "A playful regional twist on the traditional potato wafer.",
    "ingredients": [
      "Fresh Potatoes",
      "Amchur Seasoning",
      "Sugar Powder",
      "Sendha Namak",
      "Groundnut Oil"
    ],
    "spiceLevel": "Sweet & Tangy",
    "shelfLife": "90 Days",
    "image": "/products/khatta-meetha-aloo-wafers.jpg",
    "images": [
      "/products/khatta-meetha-aloo-wafers.jpg"
    ],
    "badge": "Sweet & Tangy",
    "rating": 4.9,
    "reviewCount": 0,
    "featured": false,
    "isBestSeller": false,
    "isCombo": false,
    "options": [
      {
        "weight": "250g",
        "price": 80,
        "originalPrice": 100
      },
      {
        "weight": "500g",
        "price": 160,
        "originalPrice": 200
      },
      {
        "weight": "1kg",
        "price": 320,
        "originalPrice": 400
      }
    ],
    "isAvailable": true,
    "isVegetarian": true,
    "oilUsed": "Pure Cold-Pressed Groundnut Oil",
    "dietaryStandard": "100% Pure Vegetarian (Satvik)",
    "packagingType": "Food-Grade Multi-Layer Aroma Seal Pouch",
    "customSpecifications": [
      {
        "label": "Flavour",
        "value": "Sweet, Tangy"
      },
      {
        "label": "SKU Code",
        "value": "MNH-FAR-KMAW"
      }
    ]
  },
  {
    "id": "fiki-gujarati-papdi",
    "_id": "6aeac18ce32ed580fefd703c",
    "slug": "fiki-gujarati-papdi",
    "name": "Fiki Gujarati Papdi",
    "hindiName": "फीकी गुजराती पापड़ी",
    "tagline": "Classic Crispy Bites",
    "category": "munchies-snacks",
    "categoryId": "6aeac18ce32ed580fefd7008",
    "categoryLabel": "Munchies / Snacks",
    "description": "Traditional Gujarati-style papdi with a simple, mild taste and crispy texture.",
    "story": "Inspired by Gujarat's traditional papdi-making and snacking culture.",
    "ingredients": [
      "Besan (Gram Flour)",
      "Ajwain (Carom Seeds)",
      "Papad Khar",
      "Groundnut Oil",
      "Salt"
    ],
    "spiceLevel": "Mild",
    "shelfLife": "90 Days",
    "image": "/products/fiki-gujarati-papdi.jpg",
    "images": [
      "/products/fiki-gujarati-papdi.jpg"
    ],
    "badge": "Traditional Favourite",
    "rating": 4.9,
    "reviewCount": 0,
    "featured": true,
    "isBestSeller": false,
    "isCombo": false,
    "options": [
      {
        "weight": "250g",
        "price": 100,
        "originalPrice": 120
      },
      {
        "weight": "500g",
        "price": 200,
        "originalPrice": 240
      },
      {
        "weight": "1kg",
        "price": 400,
        "originalPrice": 480
      }
    ],
    "isAvailable": true,
    "isVegetarian": true,
    "oilUsed": "Pure Cold-Pressed Groundnut Oil",
    "dietaryStandard": "100% Pure Vegetarian (Satvik)",
    "packagingType": "Food-Grade Multi-Layer Aroma Seal Pouch",
    "customSpecifications": [
      {
        "label": "Flavour",
        "value": "Plain, Savoury"
      },
      {
        "label": "SKU Code",
        "value": "MNH-MUN-FGP"
      }
    ]
  },
  {
    "id": "banana-chips",
    "_id": "6aeac18ce32ed580fefd7040",
    "slug": "banana-chips",
    "name": "Banana Chips",
    "hindiName": "केले के चिप्स",
    "tagline": "Crispy Banana Bites",
    "category": "munchies-snacks",
    "categoryId": "6aeac18ce32ed580fefd7008",
    "categoryLabel": "Munchies / Snacks",
    "description": "Thin, crispy banana chips with a satisfying crunch.",
    "story": "A familiar Indian snack enjoyed across regions and generations.",
    "ingredients": [
      "Raw Nendran Bananas",
      "Pure Vegetable Oil",
      "Turmeric",
      "Rock Salt"
    ],
    "spiceLevel": "Mild",
    "shelfLife": "90 Days",
    "image": "/products/banana-chips.jpg",
    "images": [
      "/products/banana-chips.jpg"
    ],
    "badge": "Crunchy Favourite",
    "rating": 4.9,
    "reviewCount": 0,
    "featured": true,
    "isBestSeller": false,
    "isCombo": false,
    "options": [
      {
        "weight": "250g",
        "price": 120,
        "originalPrice": 150
      },
      {
        "weight": "500g",
        "price": 240,
        "originalPrice": 300
      },
      {
        "weight": "1kg",
        "price": 480,
        "originalPrice": 600
      }
    ],
    "isAvailable": true,
    "isVegetarian": true,
    "oilUsed": "Pure Cold-Pressed Groundnut Oil",
    "dietaryStandard": "100% Pure Vegetarian (Satvik)",
    "packagingType": "Food-Grade Multi-Layer Aroma Seal Pouch",
    "customSpecifications": [
      {
        "label": "Flavour",
        "value": "Salty, Crispy"
      },
      {
        "label": "SKU Code",
        "value": "MNH-MUN-BC"
      }
    ]
  },
  {
    "id": "spicy-peanuts",
    "_id": "6aeac18ce32ed580fefd7044",
    "slug": "spicy-peanuts",
    "name": "Spicy Peanuts",
    "hindiName": "मसालेदार मूंगफली",
    "tagline": "Bold Masala Crunch",
    "category": "munchies-snacks",
    "categoryId": "6aeac18ce32ed580fefd7008",
    "categoryLabel": "Munchies / Snacks",
    "description": "Crunchy peanuts coated with a bold and spicy flavour.",
    "story": "Inspired by India's love for spicy, flavour-packed peanut snacks.",
    "ingredients": [
      "Selected Peanuts",
      "Besan Crust",
      "Red Chilli Powder",
      "Chaat Masala",
      "Hing",
      "Groundnut Oil",
      "Rock Salt"
    ],
    "spiceLevel": "High",
    "shelfLife": "90 Days",
    "image": "/products/spicy-peanuts.jpg",
    "images": [
      "/products/spicy-peanuts.jpg"
    ],
    "badge": "Spicy Favourite",
    "rating": 4.9,
    "reviewCount": 0,
    "featured": false,
    "isBestSeller": false,
    "isCombo": false,
    "options": [
      {
        "weight": "250g",
        "price": 110,
        "originalPrice": 130
      },
      {
        "weight": "500g",
        "price": 210,
        "originalPrice": 250
      },
      {
        "weight": "1kg",
        "price": 400,
        "originalPrice": 480
      }
    ],
    "isAvailable": true,
    "isVegetarian": true,
    "oilUsed": "Pure Cold-Pressed Groundnut Oil",
    "dietaryStandard": "100% Pure Vegetarian (Satvik)",
    "packagingType": "Food-Grade Multi-Layer Aroma Seal Pouch",
    "customSpecifications": [
      {
        "label": "Flavour",
        "value": "Spicy (Allergen: Peanuts)"
      },
      {
        "label": "SKU Code",
        "value": "MNH-MUN-SP"
      }
    ]
  },
  {
    "id": "khatta-meetha-peanuts",
    "_id": "6aeac18ce32ed580fefd7048",
    "slug": "khatta-meetha-peanuts",
    "name": "Khatta Meetha Peanuts",
    "hindiName": "खट्टा मीठा मूंगफली",
    "tagline": "Tangy Peanut Crunch",
    "category": "munchies-snacks",
    "categoryId": "6aeac18ce32ed580fefd7008",
    "categoryLabel": "Munchies / Snacks",
    "description": "Crunchy peanuts with a delicious balance of sweet and tangy flavours.",
    "story": "A flavourful take on the much-loved Indian tradition of seasoned peanut snacks.",
    "ingredients": [
      "Roasted Peanuts",
      "Amchur Seasoning",
      "Cane Sugar",
      "Kala Namak",
      "Groundnut Oil"
    ],
    "spiceLevel": "Sweet & Tangy",
    "shelfLife": "90 Days",
    "image": "/products/khatta-meetha-peanuts.jpg",
    "images": [
      "/products/khatta-meetha-peanuts.jpg"
    ],
    "badge": "Sweet & Tangy",
    "rating": 4.9,
    "reviewCount": 0,
    "featured": false,
    "isBestSeller": false,
    "isCombo": false,
    "options": [
      {
        "weight": "250g",
        "price": 110,
        "originalPrice": 130
      },
      {
        "weight": "500g",
        "price": 210,
        "originalPrice": 250
      },
      {
        "weight": "1kg",
        "price": 400,
        "originalPrice": 480
      }
    ],
    "isAvailable": true,
    "isVegetarian": true,
    "oilUsed": "Pure Cold-Pressed Groundnut Oil",
    "dietaryStandard": "100% Pure Vegetarian (Satvik)",
    "packagingType": "Food-Grade Multi-Layer Aroma Seal Pouch",
    "customSpecifications": [
      {
        "label": "Flavour",
        "value": "Sweet, Tangy (Allergen: Peanuts)"
      },
      {
        "label": "SKU Code",
        "value": "MNH-MUN-KMP"
      }
    ]
  }
];
