/* ==========================================================================
   CRAFTORA - Authentic Demo Data Structure (Indian Regional Crafts)
   Strict Compliance: No fake blockchain hashes. Explicit demo labeling.
   ========================================================================== */

export const INDIAN_CRAFT_CATEGORIES = [
  { id: "bamboo", name: "Bamboo Craft", region: "Assam, India", sampleMaterials: ["Natural Bamboo", "Cane"] },
  { id: "madhubani", name: "Madhubani Painting", region: "Bihar, India", sampleMaterials: ["Handmade Paper", "Natural Pigments"] },
  { id: "pottery", name: "Blue Pottery", region: "Jaipur, Rajasthan", sampleMaterials: ["Quartz Powder", "Glazed Ceramic"] },
  { id: "phulkari", name: "Phulkari Embroidery", region: "Punjab, India", sampleMaterials: ["Khadi Cotton", "Silk Thread"] },
  { id: "banarasi", name: "Banarasi Weaving", region: "Varanasi, Uttar Pradesh", sampleMaterials: ["Pure Mulberry Silk", "Zari Thread"] },
  { id: "terracotta", name: "Terracotta Clay Work", region: "Bankura, West Bengal", sampleMaterials: ["Natural Clay", "Terracotta Soil"] }
];

export const INITIAL_ARTISANS = [
  {
    id: "CRF-ART-001284",
    name: "Ramesh Kumar",
    craftCategory: "Bamboo Craft",
    location: "Assam, India",
    bio: "Ramesh is a traditional bamboo artisan from Assam. His craft reflects local weaving techniques passed through generations.",
    photoUrl: "assets/artisan_ramesh.png",
    isVerified: true,
    registeredAt: "17 Sep 2026",
    craftExperience: "Traditional Handcrafted Bamboo Work",
    productCount: 2,
    passportCount: 2
  },
  {
    id: "CRF-ART-001285",
    name: "Sita Devi",
    craftCategory: "Madhubani Painting",
    location: "Bihar, India",
    bio: "Sita Devi practices authentic Mithila and Madhubani painting techniques using natural dyes and handmade paper.",
    photoUrl: "assets/madhubani_art.png",
    isVerified: true,
    registeredAt: "15 Sep 2026",
    craftExperience: "Heritage Folk Art",
    productCount: 1,
    passportCount: 1
  }
];

export const INITIAL_PRODUCTS = [
  {
    id: "CRF-BAM-001284",
    artisanId: "CRF-ART-001284",
    artisanName: "Ramesh Kumar",
    artisanLocation: "Assam, India",
    artisanPhoto: "assets/artisan_ramesh.png",
    title: "Bamboo Handwoven Basket",
    category: "Bamboo Craft",
    materials: ["Natural Bamboo"],
    productionTimeDays: 2,
    description: "Handcrafted bamboo basket made using traditional Assamese weaving techniques. Durable, eco-friendly, and lightweight.",
    tags: ["Handmade", "Eco-friendly", "Traditional", "Bamboo"],
    price: 680,
    costBreakdown: {
      materialCost: 180,
      labourCost: 250,
      productionTimeDays: 2,
      packagingCost: 40,
      totalEstimatedCost: 470
    },
    aiInsight: {
      marketDemand: "High",
      similarPriceRange: { min: 550, max: 750 },
      indicativePriceRange: { min: 650, max: 700 },
      suggestedPrice: 680,
      confidenceScore: 0.94
    },
    buyerMatches: [
      { id: "M1", buyerCategory: "Handicraft Retailer", matchPercentage: 94, lookingFor: "Bamboo crafts", requirement: "Seeking eco-friendly home storage inventory" },
      { id: "M2", buyerCategory: "Hospitality & Decor Buyer", matchPercentage: 88, lookingFor: "Handmade decor", requirement: "Resort lobby & dining table accent pieces" },
      { id: "M3", buyerCategory: "Gift & Lifestyle Store", matchPercentage: 81, lookingFor: "Eco-friendly handmade products", requirement: "Sustainable gift packaging & hampers" }
    ],
    blockchainRecord: {
      network: "Polygon Testnet Demo",
      recordType: "Prototype Blockchain Record",
      status: "Recorded",
      recordedAt: "17 Sep 2026",
      isDemo: true,
      events: [
        { title: "Product Registration", date: "17 Sep 2026", status: "Completed" },
        { title: "Product Details Recorded", date: "17 Sep 2026", status: "Completed" },
        { title: "Verification Review", date: "17 Sep 2026", status: "Verification Approved" }
      ]
    },
    status: "verified",
    imageUrl: "assets/bamboo_basket.png",
    passportAvailable: true
  },
  {
    id: "CRF-MAD-001285",
    artisanId: "CRF-ART-001285",
    artisanName: "Sita Devi",
    artisanLocation: "Bihar, India",
    artisanPhoto: "assets/madhubani_art.png",
    title: "Madhubani Artwork",
    category: "Madhubani Painting",
    materials: ["Handmade Paper", "Natural Dyes"],
    productionTimeDays: 5,
    description: "Intricate traditional Madhubani painting depicting nature and cultural folk motifs.",
    tags: ["Folk Art", "Handmade Paper", "Natural Dyes"],
    price: 1200,
    costBreakdown: {
      materialCost: 350,
      labourCost: 600,
      productionTimeDays: 5,
      packagingCost: 50,
      totalEstimatedCost: 1000
    },
    aiInsight: {
      marketDemand: "High",
      similarPriceRange: { min: 1000, max: 1500 },
      indicativePriceRange: { min: 1150, max: 1300 },
      suggestedPrice: 1200,
      confidenceScore: 0.96
    },
    buyerMatches: [
      { id: "M4", buyerCategory: "Art Gallery & Decor", matchPercentage: 96, lookingFor: "Heritage Folk Art", requirement: "Exhibition wall art collection" }
    ],
    blockchainRecord: {
      network: "Polygon Testnet Demo",
      recordType: "Prototype Blockchain Record",
      status: "Recorded",
      recordedAt: "15 Sep 2026",
      isDemo: true,
      events: [
        { title: "Product Registration", date: "15 Sep 2026", status: "Completed" },
        { title: "Product Details Recorded", date: "15 Sep 2026", status: "Completed" }
      ]
    },
    status: "verified",
    imageUrl: "assets/madhubani_art.png",
    passportAvailable: true
  },
  {
    id: "CRF-BAM-001286",
    artisanId: "CRF-ART-001284",
    artisanName: "Ramesh Kumar",
    artisanLocation: "Assam, India",
    artisanPhoto: "assets/artisan_ramesh.png",
    title: "Bamboo Woven Table Lamp",
    category: "Bamboo Craft",
    materials: ["Natural Bamboo", "Woven Mesh"],
    productionTimeDays: 3,
    description: "Handcrafted bamboo ambient table lamp projecting geometric shadow patterns.",
    tags: ["Lighting", "Bamboo", "Eco-friendly"],
    price: 950,
    costBreakdown: {
      materialCost: 280,
      labourCost: 400,
      productionTimeDays: 3,
      packagingCost: 60,
      totalEstimatedCost: 740
    },
    aiInsight: {
      marketDemand: "High",
      similarPriceRange: { min: 850, max: 1200 },
      indicativePriceRange: { min: 900, max: 1000 },
      suggestedPrice: 950,
      confidenceScore: 0.93
    },
    buyerMatches: [
      { id: "M5", buyerCategory: "Boutique Home Decor", matchPercentage: 91, lookingFor: "Ambient Bamboo Lamps", requirement: "Modern eco-lighting fixtures" }
    ],
    blockchainRecord: {
      network: "Polygon Testnet Demo",
      recordType: "Prototype Blockchain Record",
      status: "Recorded",
      recordedAt: "18 Sep 2026",
      isDemo: true,
      events: [
        { title: "Product Registration", date: "18 Sep 2026", status: "Completed" }
      ]
    },
    status: "verified",
    imageUrl: "assets/bamboo_lamp.png",
    passportAvailable: true
  }
];

export const INITIAL_BUYER_REQUESTS = [
  {
    id: "REQ-001",
    buyerName: "Arjun Sharma",
    productTitle: "Bamboo Handwoven Basket",
    productId: "CRF-BAM-001284",
    artisanName: "Ramesh Kumar",
    interestType: "Bulk / Wholesale Order",
    quantity: 50,
    message: "Interested in carrying 50 units for our craft boutique chain.",
    status: "Interest Sent",
    createdAt: "18 Sep 2026"
  }
];

export const INITIAL_ADMIN_STATS = {
  registeredArtisans: 24,
  registeredProducts: 86,
  artisanVerificationPending: 8,
  productVerificationPending: 12
};
