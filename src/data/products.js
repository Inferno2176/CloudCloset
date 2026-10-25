/**
 * CloudCloset Atelier Product Catalogue & Image Storage Architecture
 * 
 * Supports:
 * - 60 unique contemporary luxury apparel pieces & accessories
 * - Balanced categorization across Men, Women, Unisex
 * - Complete coverage for: Outerwear (10), Shirts (10), Trousers (10), Knitwear (10), Dresses (10), Accessories (10)
 * - S3 Storage Abstraction: centralized getProductImageUrl() helper prepared for Amazon S3 bucket migration
 * - High-resolution, sharp editorial 3:4 portrait photography with fail-safe inline SVG fallback
 */

// Architectural Inline SVG Fallback: Guaranteed 0% network failure rate, zero broken-image icons
export const FALLBACK_PRODUCT_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" fill="#FAF9F6">
  <rect width="600" height="800" fill="#FAF9F6"/>
  <rect x="24" y="24" width="552" height="752" fill="none" stroke="#E8E6E1" stroke-width="1"/>
  <circle cx="300" cy="350" r="48" fill="#F4F3F1" stroke="#E8E6E1" stroke-width="1"/>
  <path d="M300 326 C290 326 284 332 284 338 C284 346 294 350 300 354 L324 366 C326 367 328 370 328 374 L272 374" fill="none" stroke="#5B614E" stroke-width="2.5" stroke-linecap="round"/>
  <text x="300" y="440" font-family="'Playfair Display', Georgia, serif" font-size="20" fill="#111111" text-anchor="middle" letter-spacing="1">CloudCloset</text>
  <text x="300" y="468" font-family="'Inter', sans-serif" font-size="10" font-weight="600" fill="#747878" text-anchor="middle" letter-spacing="3">ATELIER ARCHIVE</text>
</svg>
`)}`;

/**
 * Resolves a product's image URL.
 * When an Amazon S3 Bucket URL is set in environment (e.g. VITE_S3_BUCKET_URL),
 * resolves against object keys (s3Key / galleryKeys).
 * Otherwise resolves the high-resolution CDN development asset.
 */
export const getProductImageUrl = (product, index = 0) => {
  if (!product) return FALLBACK_PRODUCT_IMAGE;

  // Use pre-signed S3 URL if provided by backend for authorized private bucket viewing
  if (index === 0 && product.presignedImageUrl && typeof product.presignedImageUrl === "string" && !product.presignedImageUrl.startsWith("s3://")) {
    return product.presignedImageUrl;
  }
  if (product.presignedGalleryUrls && product.presignedGalleryUrls[index - 1] && !product.presignedGalleryUrls[index - 1].startsWith("s3://")) {
    return product.presignedGalleryUrls[index - 1];
  }

  // Use S3 public CDN/distribution if explicitly configured
  const s3Base = typeof import.meta !== "undefined" && import.meta.env?.VITE_S3_BUCKET_URL;
  if (s3Base && product.s3Key) {
    if (index === 0) return `${s3Base}/${product.s3Key}`;
    if (product.galleryKeys && product.galleryKeys[index - 1]) {
      return `${s3Base}/${product.galleryKeys[index - 1]}`;
    }
  }

  // Normalize images array (handles array or stringified JSON from database)
  let imagesArr = product.images;
  if (typeof imagesArr === "string") {
    try {
      imagesArr = JSON.parse(imagesArr);
    } catch {
      imagesArr = [imagesArr];
    }
  }

  const rawImage = imagesArr?.[index] || imagesArr?.[0];
  // Ensure we NEVER return an s3:// protocol URL directly to an <img> src
  if (rawImage && typeof rawImage === "string" && !rawImage.startsWith("s3://")) {
    return rawImage;
  }

  return FALLBACK_PRODUCT_IMAGE;
};

export const initialProducts = [
  // ==========================================
  // 1. OUTERWEAR (10 DISTINCT PRODUCTS)
  // ==========================================
  {
    id: "cc-001",
    name: "Minimalist Ecru Linen Trench Coat",
    slug: "minimalist-ecru-linen-trench-coat",
    category: "Outerwear",
    subcategory: "Trench Coats",
    gender: "Women",
    price: 4890,
    originalPrice: 5990,
    badge: "Archival Exclusive",
    provenance: "Belgian Heavy Linen",
    rating: 5.0,
    reviewCount: 42,
    isFeatured: true,
    isTrending: true,
    isNewArrival: false,
    description: "An unadorned double-breasted trench silhouette engineered from dense Belgian flax linen. Features sweeping storm flaps, deep storm welt pockets, and a wide matching tie sash.",
    fabric: "100% Belgian flax linen (320 GSM). Untreated raw finish that develops exceptional softness and organic patina over years of wear.",
    care: "Dry clean only using eco-friendly solvents, or gentle cold hand wash. Store on broad wooden garment hanger.",
    origin: "Loomed in Flanders, Belgium · Assembled in Jaipur Atelier",
    inStock: true,
    status: "active",
    stockCount: 12,
    colors: [
      { name: "Warm Dunes Sand", hex: "#D8CCBA" },
      { name: "Alabaster Ecru", hex: "#FAF9F6" },
      { name: "Charcoal Black", hex: "#222222" }
    ],
    sizes: [
      { size: "XS", available: true },
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true },
      { size: "XL", available: false }
    ],
    s3Key: "products/cc-001/primary.webp",
    galleryKeys: ["products/cc-001/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1508427953056-b00b8d78ebf5?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-002",
    name: "Architectural Wool-Blend Blazer",
    slug: "architectural-wool-blend-blazer",
    category: "Outerwear",
    subcategory: "Blazers",
    gender: "Women",
    price: 6200,
    originalPrice: 7800,
    badge: "Runway Cut",
    provenance: "Australian Merino Blend",
    rating: 4.9,
    reviewCount: 19,
    isFeatured: true,
    isTrending: true,
    isNewArrival: false,
    description: "Sculptural unlined jacket with softly structured shoulders and a minimalist single corozo button closure. Straight vented cuffs and discreet jetted pockets.",
    fabric: "65% Fine Australian Merino Wool, 35% Lyocell for structural drape and lightweight year-round breathability.",
    care: "Specialist dry clean only. Steam gently between wears to refresh wool fibers.",
    origin: "Spun in Biella, Italy · Crafted in New Delhi Atelier",
    inStock: true,
    status: "active",
    stockCount: 9,
    colors: [
      { name: "Obsidian Black", hex: "#111111" },
      { name: "Warm Espresso", hex: "#3A2A22" }
    ],
    sizes: [
      { size: "XS", available: true },
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true }
    ],
    s3Key: "products/cc-002/primary.webp",
    galleryKeys: ["products/cc-002/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-003",
    name: "Raw Flax Linen Safari Jacket",
    slug: "raw-flax-linen-safari-jacket",
    category: "Outerwear",
    subcategory: "Jackets",
    gender: "Women",
    price: 4250,
    badge: "Organic Linen",
    provenance: "100% Normandy Flax",
    rating: 4.8,
    reviewCount: 26,
    isFeatured: true,
    isTrending: false,
    isNewArrival: true,
    description: "Utilitarian yet ethereal field jacket finished with concealed horn buttons, adjustable drawstring waist tunnel, and quartet bellows pockets.",
    fabric: "100% GOTS organic French flax (280 GSM) pre-washed with river stones.",
    care: "Cold delicate machine wash. Hang dry in shade. Warm steam iron on reverse.",
    origin: "Tailored in Bengaluru Atelier",
    inStock: true,
    status: "active",
    stockCount: 18,
    colors: [
      { name: "Khaki Chalk", hex: "#D4CBB9" },
      { name: "Dried Olive", hex: "#5B614E" }
    ],
    sizes: [
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true }
    ],
    s3Key: "products/cc-003/primary.webp",
    galleryKeys: ["products/cc-003/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-004",
    name: "Structured Wool Cocoon Cape Coat",
    slug: "structured-wool-cocoon-cape-coat",
    category: "Outerwear",
    subcategory: "Coats",
    gender: "Women",
    price: 7800,
    originalPrice: 9200,
    badge: "Limited Drop",
    provenance: "Double-Faced Wool",
    rating: 5.0,
    reviewCount: 14,
    isFeatured: false,
    isTrending: true,
    isNewArrival: false,
    description: "Voluminous cocoon silhouette draping from sloped shoulders with slit hand portals and an oversized sculptural shawl collar.",
    fabric: "90% Virgin Wool, 10% Cashmere double-faced cloth with hand-finished interior seams.",
    care: "Dry clean only.",
    origin: "Handcrafted in Srinagar Atelier",
    inStock: true,
    status: "active",
    stockCount: 6,
    colors: [
      { name: "Oatmeal Heather", hex: "#DDD8CD" },
      { name: "Pitch Charcoal", hex: "#222222" }
    ],
    sizes: [
      { size: "S/M", available: true },
      { size: "L/XL", available: true }
    ],
    s3Key: "products/cc-004/primary.webp",
    galleryKeys: ["products/cc-004/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-005",
    name: "Unlined Tailored Linen Blazer",
    slug: "unlined-tailored-linen-blazer",
    category: "Outerwear",
    subcategory: "Blazers",
    gender: "Men",
    price: 5450,
    originalPrice: 6500,
    badge: "Summer Tailoring",
    provenance: "Irish Heavy Flax",
    rating: 4.8,
    reviewCount: 33,
    isFeatured: true,
    isTrending: true,
    isNewArrival: false,
    description: "Effortless unstructured tailoring crafted without shoulder padding for a featherlight drape. Features notch lapels and natural horn buttons.",
    fabric: "100% Irish flax linen with artisanal slub texture.",
    care: "Professional dry clean or steam refresh.",
    origin: "Tailored in Bengaluru Atelier",
    inStock: true,
    status: "active",
    stockCount: 14,
    colors: [
      { name: "Sandstone Beige", hex: "#D8CCBA" },
      { name: "Deep Navy", hex: "#1A2238" }
    ],
    sizes: [
      { size: "38", available: true },
      { size: "40", available: true },
      { size: "42", available: true },
      { size: "44", available: true }
    ],
    s3Key: "products/cc-005/primary.webp",
    galleryKeys: ["products/cc-005/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-006",
    name: "Structured Japanese Selvedge Denim Jacket",
    slug: "structured-japanese-selvedge-denim-jacket",
    category: "Outerwear",
    subcategory: "Jackets",
    gender: "Men",
    price: 4600,
    badge: "14oz Selvedge",
    provenance: "Kuroki Mills Japan",
    rating: 4.9,
    reviewCount: 37,
    isFeatured: false,
    isTrending: false,
    isNewArrival: true,
    description: "Modified Type-II trucker jacket loomed on vintage shuttle looms. Raw copper rivets, pink selvedge ID on internal placket, and boxy architectonic drape.",
    fabric: "100% Cotton 14oz red-cast selvedge denim unwashed for custom breaking in.",
    care: "Soak cold inside out. Hang dry. Wash infrequently.",
    origin: "Fabric: Okayama, Japan · Tailored in Bengaluru",
    inStock: true,
    status: "active",
    stockCount: 16,
    colors: [
      { name: "Raw Indigo", hex: "#1C273A" },
      { name: "Overdyed Black", hex: "#111111" }
    ],
    sizes: [
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true },
      { size: "XL", available: true }
    ],
    s3Key: "products/cc-006/primary.webp",
    galleryKeys: ["products/cc-006/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-007",
    name: "Minimalist Mac Coat in Sandstone Cotton",
    slug: "minimalist-mac-coat-sandstone-cotton",
    category: "Outerwear",
    subcategory: "Coats",
    gender: "Men",
    price: 6890,
    originalPrice: 8200,
    badge: "Water-Repellent",
    provenance: "Storm Cotton Gabardine",
    rating: 4.9,
    reviewCount: 21,
    isFeatured: true,
    isTrending: true,
    isNewArrival: false,
    description: "Single-breasted architectural raincoat with concealed horn placket, raglan sleeves for natural movement, and a high stand storm collar.",
    fabric: "100% Compact combed Egyptian cotton gabardine treated with PFC-free water-repellent finish.",
    care: "Machine wash delicate 30°C. Cool iron to reactivate repellency.",
    origin: "Tailored in New Delhi Atelier",
    inStock: true,
    status: "active",
    stockCount: 11,
    colors: [
      { name: "Sandstone", hex: "#D4C7B4" },
      { name: "Obsidian", hex: "#111111" }
    ],
    sizes: [
      { size: "38", available: true },
      { size: "40", available: true },
      { size: "42", available: true },
      { size: "44", available: false }
    ],
    s3Key: "products/cc-007/primary.webp",
    galleryKeys: ["products/cc-007/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-008",
    name: "Cropped Utility Canvas Harrington",
    slug: "cropped-utility-canvas-harrington",
    category: "Outerwear",
    subcategory: "Jackets",
    gender: "Men",
    price: 3990,
    badge: "Drop 03 Live",
    provenance: "Duck Canvas 10oz",
    rating: 4.7,
    reviewCount: 30,
    isFeatured: true,
    isTrending: false,
    isNewArrival: true,
    description: "Contemporary interpretation of the Harrington jacket with sharp boxy proportions, matte gunmetal two-way zip, and tailored elasticated rear waistband.",
    fabric: "100% Organic cotton duck canvas with peach skin wash.",
    care: "Machine wash cold inside out. Hang dry.",
    origin: "Tailored in Bengaluru Atelier",
    inStock: true,
    status: "active",
    stockCount: 22,
    colors: [
      { name: "Dried Olive", hex: "#5B614E" },
      { name: "Clay Terracotta", hex: "#8C6239" }
    ],
    sizes: [
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true },
      { size: "XL", available: true }
    ],
    s3Key: "products/cc-008/primary.webp",
    galleryKeys: ["products/cc-008/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-009",
    name: "Architectural Kimono Haori Coat",
    slug: "architectural-kimono-haori-coat",
    category: "Outerwear",
    subcategory: "Robes & Coats",
    gender: "Unisex",
    price: 4950,
    badge: "Archival Silhouette",
    provenance: "Woven Cotton-Linen",
    rating: 5.0,
    reviewCount: 28,
    isFeatured: false,
    isTrending: true,
    isNewArrival: true,
    description: "Genderless open-front haori coat designed with wide architectonic sleeve openings, continuous neckband, and discreet internal tie cord.",
    fabric: "55% Belgian Linen, 45% Combed Cotton blend with structured slub weave.",
    care: "Gentle cold hand wash or machine cycle. Line dry.",
    origin: "Jaipur Atelier",
    inStock: true,
    status: "active",
    stockCount: 15,
    colors: [
      { name: "Chalk White", hex: "#FAF9F6" },
      { name: "Mineral Ink", hex: "#111111" }
    ],
    sizes: [
      { size: "1 (XS/S)", available: true },
      { size: "2 (M/L)", available: true },
      { size: "3 (XL/XXL)", available: true }
    ],
    s3Key: "products/cc-009/primary.webp",
    galleryKeys: ["products/cc-009/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1550614000-4895a10e1bfd?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-010",
    name: "Minimalist Packable Technical Windbreaker",
    slug: "minimalist-packable-technical-windbreaker",
    category: "Outerwear",
    subcategory: "Outerwear",
    gender: "Unisex",
    price: 3490,
    originalPrice: 4200,
    badge: "Weatherproof",
    provenance: "Recycled Ripstop Nylon",
    rating: 4.7,
    reviewCount: 18,
    isFeatured: false,
    isTrending: false,
    isNewArrival: false,
    description: "Ultralight wind-resistant jacket that compresses into its own interior pocket. Minimalist high collar with concealed hood zip and bungee cinch cords.",
    fabric: "100% Recycled micro-ripstop nylon with matte hydrophobic coating.",
    care: "Machine wash cold. Do not iron.",
    origin: "Engineered in Bengaluru Atelier",
    inStock: true,
    status: "active",
    stockCount: 25,
    colors: [
      { name: "Slate Grey", hex: "#747878" },
      { name: "Dried Olive", hex: "#5B614E" }
    ],
    sizes: [
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true },
      { size: "XL", available: true }
    ],
    s3Key: "products/cc-010/primary.webp",
    galleryKeys: ["products/cc-010/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=1200&q=85"
    ]
  },

  // ==========================================
  // 2. SHIRTS (10 DISTINCT PRODUCTS)
  // ==========================================
  {
    id: "cc-011",
    name: "Oversized Structured Poplin Shirt",
    slug: "oversized-structured-poplin-shirt",
    category: "Shirts",
    subcategory: "Poplin Shirts",
    gender: "Men",
    price: 1899,
    originalPrice: 2499,
    badge: "New Season",
    provenance: "100% GOTS Organic",
    rating: 4.9,
    reviewCount: 38,
    isFeatured: true,
    isTrending: true,
    isNewArrival: false,
    description: "Architectural drop-shoulder silhouette cut from heavyweight crisp organic cotton poplin. Fastened with genuine polished mother-of-river-shell buttons and finished with an engineered box pleat.",
    fabric: "100% GOTS-certified European Flax grown in Normandy, France. Loomed with traditional non-toxic washing techniques that eliminate stiffness while preserving crisp natural weave tension.",
    care: "Machine wash cold at 30°C on delicate cycle. Hang to dry naturally away from direct sunlight. Cool iron on reverse with light steam.",
    origin: "Fiber Origin: Normandy, France · Tailored in Bengaluru Atelier",
    inStock: true,
    status: "active",
    stockCount: 24,
    colors: [
      { name: "Chalk White", hex: "#F4F3F1" },
      { name: "Ink Black", hex: "#111111" },
      { name: "Dried Olive", hex: "#5B614E" }
    ],
    sizes: [
      { size: "XS", available: true },
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true },
      { size: "XL", available: true }
    ],
    s3Key: "products/cc-011/primary.webp",
    galleryKeys: ["products/cc-011/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-012",
    name: "Brutalist Relaxed Cuban Collar Shirt",
    slug: "brutalist-relaxed-cuban-collar-shirt",
    category: "Shirts",
    subcategory: "Resort Shirts",
    gender: "Men",
    price: 2150,
    originalPrice: 2800,
    badge: "Limited Drop",
    provenance: "Compact Poplin 80s",
    rating: 4.9,
    reviewCount: 31,
    isFeatured: false,
    isTrending: true,
    isNewArrival: false,
    description: "Clean straight-cut architectural overshirt featuring a sharp convertible Cuban collar, seamless concealed placket, and deep chest patch pocket.",
    fabric: "High-density 80s two-ply organic cotton with crisp paper-touch hand feel.",
    care: "Machine wash cold at 30°C. Do not bleach. Cool iron on reverse.",
    origin: "Tailored in Bengaluru Atelier",
    inStock: true,
    status: "active",
    stockCount: 15,
    colors: [
      { name: "Pitch Black", hex: "#111111" },
      { name: "Slate Grey", hex: "#444748" }
    ],
    sizes: [
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true },
      { size: "XL", available: true }
    ],
    s3Key: "products/cc-012/primary.webp",
    galleryKeys: ["products/cc-012/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-013",
    name: "French Linen Band-Collar Tunic Shirt",
    slug: "french-linen-band-collar-tunic-shirt",
    category: "Shirts",
    subcategory: "Linen Shirts",
    gender: "Men",
    price: 2750,
    badge: "Normandy Flax",
    provenance: "100% Normandy Flax",
    rating: 4.8,
    reviewCount: 42,
    isFeatured: true,
    isTrending: false,
    isNewArrival: true,
    description: "Architectonic longline tunic shirt with grandfather stand collar, curved vented hem, and mother-of-pearl buttons.",
    fabric: "Pure French Normandy flax linen (185 GSM) woven on heritage looms.",
    care: "Cold wash. Air dry naturally.",
    origin: "Jaipur Atelier",
    inStock: true,
    status: "active",
    stockCount: 20,
    colors: [
      { name: "Alabaster Ecru", hex: "#FAF9F6" },
      { name: "Dried Olive", hex: "#5B614E" }
    ],
    sizes: [
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true },
      { size: "XL", available: true }
    ],
    s3Key: "products/cc-013/primary.webp",
    galleryKeys: ["products/cc-013/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-014",
    name: "Heavy Cotton Poplin Workshirt",
    slug: "heavy-cotton-poplin-workshirt",
    category: "Shirts",
    subcategory: "Overshirts",
    gender: "Men",
    price: 2450,
    originalPrice: 3100,
    badge: "Core Atelier",
    provenance: "Egyptian Giza Cotton",
    rating: 4.7,
    reviewCount: 22,
    isFeatured: false,
    isTrending: false,
    isNewArrival: false,
    description: "Rugged yet refined utility overshirt with twin gusseted flap pockets, reinforced shoulder yoke, and triple-needle chainstitch construction.",
    fabric: "100% Long-staple Egyptian cotton twill poplin (220 GSM).",
    care: "Machine wash cold. Tumble dry low.",
    origin: "Bengaluru Atelier",
    inStock: true,
    status: "active",
    stockCount: 17,
    colors: [
      { name: "Mineral Stone", hex: "#C7C2B8" },
      { name: "Ink Black", hex: "#111111" }
    ],
    sizes: [
      { size: "M", available: true },
      { size: "L", available: true },
      { size: "XL", available: true }
    ],
    s3Key: "products/cc-014/primary.webp",
    galleryKeys: ["products/cc-014/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-015",
    name: "Raw Silk-Cotton Fluid Evening Shirt",
    slug: "raw-silk-cotton-fluid-evening-shirt",
    category: "Shirts",
    subcategory: "Luxury Shirts",
    gender: "Men",
    price: 3600,
    badge: "Artisan Silk",
    provenance: "Mulberry Silk & Matka",
    rating: 5.0,
    reviewCount: 16,
    isFeatured: true,
    isTrending: false,
    isNewArrival: true,
    description: "Sensual fluid drape shirt with concealed front placket, French cuffs, and subtle natural slub sheen suited for contemporary formalwear.",
    fabric: "50% Raw Mulberry Silk, 50% Organic Combed Cotton.",
    care: "Dry clean or gentle hand wash in cold water.",
    origin: "Murshidabad Silk Guild · Tailored in Bengaluru",
    inStock: true,
    status: "active",
    stockCount: 11,
    colors: [
      { name: "Chalk Pearl", hex: "#F8F7F3" },
      { name: "Smoky Anthracite", hex: "#2E2E30" }
    ],
    sizes: [
      { size: "38", available: true },
      { size: "40", available: true },
      { size: "42", available: true }
    ],
    s3Key: "products/cc-015/primary.webp",
    galleryKeys: ["products/cc-015/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-016",
    name: "Asymmetrical Drape Silk-Modal Blouse",
    slug: "asymmetrical-drape-silk-modal-blouse",
    category: "Shirts",
    subcategory: "Blouses",
    gender: "Women",
    price: 3450,
    originalPrice: 4200,
    badge: "Capsule SS25",
    provenance: "Sandwashed Silk",
    rating: 4.8,
    reviewCount: 29,
    isFeatured: true,
    isTrending: true,
    isNewArrival: false,
    description: "Architectural asymmetric neckline blouse with diagonally pleated shoulder and graceful cascading drape through the torso.",
    fabric: "45% Sandwashed Mulberry Silk, 55% Lenzing Modal.",
    care: "Hand wash cold. Dry flat in shade.",
    origin: "Tailored in Mumbai Atelier",
    inStock: true,
    status: "active",
    stockCount: 14,
    colors: [
      { name: "Warm Dunes Sand", hex: "#D8CCBA" },
      { name: "Onyx Black", hex: "#111111" }
    ],
    sizes: [
      { size: "XS", available: true },
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true }
    ],
    s3Key: "products/cc-016/primary.webp",
    galleryKeys: ["products/cc-016/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-017",
    name: "Sculptural Balloon-Sleeve Poplin Blouse",
    slug: "sculptural-balloon-sleeve-poplin-blouse",
    category: "Shirts",
    subcategory: "Blouses",
    gender: "Women",
    price: 2950,
    badge: "Architectural Drape",
    provenance: "Compact Organic Poplin",
    rating: 4.9,
    reviewCount: 35,
    isFeatured: false,
    isTrending: false,
    isNewArrival: true,
    description: "Voluminous puff sleeves anchored by tailored extended cuffs. Clean stand collar with keyhole button fastening at back neck.",
    fabric: "100% GOTS Organic Cotton with crisp archival paper finish.",
    care: "Machine wash cold. Crisp steam iron.",
    origin: "Tailored in Bengaluru Atelier",
    inStock: true,
    status: "active",
    stockCount: 19,
    colors: [
      { name: "Pristine White", hex: "#FAF9F6" },
      { name: "Dried Olive", hex: "#5B614E" }
    ],
    sizes: [
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true }
    ],
    s3Key: "products/cc-017/primary.webp",
    galleryKeys: ["products/cc-017/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-018",
    name: "Cropped Boxy Linen Resort Shirt",
    slug: "cropped-boxy-linen-resort-shirt",
    category: "Shirts",
    subcategory: "Linen Shirts",
    gender: "Women",
    price: 2350,
    originalPrice: 2990,
    badge: "Summer Drop",
    provenance: "100% Belgian Flax",
    rating: 4.8,
    reviewCount: 24,
    isFeatured: false,
    isTrending: true,
    isNewArrival: false,
    description: "Relaxed square-cut crop silhouette designed to pair flawlessly with high-waisted linen trousers. Camp collar with river shell buttons.",
    fabric: "100% Pure Flax Linen (190 GSM).",
    care: "Machine wash cold on gentle cycle. Line dry.",
    origin: "Jaipur Atelier",
    inStock: true,
    status: "active",
    stockCount: 18,
    colors: [
      { name: "Terracotta Earth", hex: "#8C6239" },
      { name: "Chalk White", hex: "#FAF9F6" }
    ],
    sizes: [
      { size: "XS", available: true },
      { size: "S", available: true },
      { size: "M", available: true }
    ],
    s3Key: "products/cc-018/primary.webp",
    galleryKeys: ["products/cc-018/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-019",
    name: "Minimalist Drop-Shoulder Oxford Shirt",
    slug: "minimalist-drop-shoulder-oxford-shirt",
    category: "Shirts",
    subcategory: "Classic Shirts",
    gender: "Unisex",
    price: 2200,
    badge: "Unisex Atelier",
    provenance: "Heavy Oxford Weave",
    rating: 4.9,
    reviewCount: 48,
    isFeatured: true,
    isTrending: false,
    isNewArrival: true,
    description: "Generous genderless proportions engineered with traditional basket-weave oxford cloth. Seamless button placket and locker loop on rear box pleat.",
    fabric: "100% Heavy Combed Cotton Oxford (210 GSM).",
    care: "Machine wash 40°C. Tumble dry or hang dry.",
    origin: "Tailored in Bengaluru Atelier",
    inStock: true,
    status: "active",
    stockCount: 30,
    colors: [
      { name: "Ecru Chalk", hex: "#FAF9F6" },
      { name: "Muted Olive", hex: "#5B614E" },
      { name: "Deep Ink", hex: "#111111" }
    ],
    sizes: [
      { size: "1 (XS/S)", available: true },
      { size: "2 (M/L)", available: true },
      { size: "3 (XL/XXL)", available: true }
    ],
    s3Key: "products/cc-019/primary.webp",
    galleryKeys: ["products/cc-019/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-020",
    name: "Crisp Atelier Studio Uniform Overshirt",
    slug: "crisp-atelier-studio-uniform-overshirt",
    category: "Shirts",
    subcategory: "Overshirts",
    gender: "Unisex",
    price: 2890,
    originalPrice: 3600,
    badge: "Studio Line",
    provenance: "Dense Cotton Twill",
    rating: 4.8,
    reviewCount: 39,
    isFeatured: true,
    isTrending: true,
    isNewArrival: false,
    description: "Daily studio utility piece with oversized chest cargo pockets, straight split hem, and internal pen holder sleeve.",
    fabric: "100% Recycled Cotton Twill (240 GSM).",
    care: "Machine wash cold. Warm iron.",
    origin: "Bengaluru Atelier",
    inStock: true,
    status: "active",
    stockCount: 16,
    colors: [
      { name: "Matte Black", hex: "#111111" },
      { name: "Dune Khaki", hex: "#D4C7B4" }
    ],
    sizes: [
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true }
    ],
    s3Key: "products/cc-020/primary.webp",
    galleryKeys: ["products/cc-020/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=85"
    ]
  },

  // ==========================================
  // 3. TROUSERS (10 DISTINCT PRODUCTS)
  // ==========================================
  {
    id: "cc-021",
    name: "Pleated Tapered Chinos",
    slug: "pleated-tapered-chinos",
    category: "Trousers",
    subcategory: "Chinos",
    gender: "Men",
    price: 3450,
    originalPrice: 4200,
    badge: "Drop 03 Live",
    provenance: "Handwoven Cotton Twill",
    rating: 4.8,
    reviewCount: 29,
    isFeatured: true,
    isTrending: true,
    isNewArrival: false,
    description: "Relaxed high-rise trousers with double reverse pleats tapering softly toward a clean cropped ankle. Finished with internal horn button tab closures and slant side pockets.",
    fabric: "100% compact combed long-staple cotton twill with subtle peach finish. Breathable, durable, and resistant to wrinkles.",
    care: "Machine wash warm with similar tones. Tumble dry low or air dry. Warm iron if desired.",
    origin: "Woven in Coimbatore · Tailored in Bengaluru Atelier",
    inStock: true,
    status: "active",
    stockCount: 18,
    colors: [
      { name: "Warm Sand", hex: "#D8CCBA" },
      { name: "Dried Olive", hex: "#5B614E" },
      { name: "Midnight Navy", hex: "#1A2238" }
    ],
    sizes: [
      { size: "30", available: true },
      { size: "32", available: true },
      { size: "34", available: true },
      { size: "36", available: true }
    ],
    s3Key: "products/cc-021/primary.webp",
    galleryKeys: ["products/cc-021/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-022",
    name: "Wide-Leg Japanese Selvedge Denim",
    slug: "wide-leg-japanese-selvedge-denim",
    category: "Trousers",
    subcategory: "Jeans",
    gender: "Men",
    price: 4990,
    badge: "Kuroki Mills Denim",
    provenance: "13.5oz White-Line Selvedge",
    rating: 5.0,
    reviewCount: 41,
    isFeatured: true,
    isTrending: false,
    isNewArrival: true,
    description: "Architectural wide straight fit cut with generous rise and gentle pooling break over footwear. Silver donut button fly and vegetable-tanned leather back patch.",
    fabric: "100% Zimbabwe long-staple cotton woven on Toyoda shuttle looms in Kojima, Japan.",
    care: "Cold rinse inside out. Air dry flat.",
    origin: "Loomed in Okayama, Japan · Tailored in Bengaluru",
    inStock: true,
    status: "active",
    stockCount: 14,
    colors: [
      { name: "Pure Indigo", hex: "#18263D" },
      { name: "Washed Chalk", hex: "#E8E6E1" }
    ],
    sizes: [
      { size: "30", available: true },
      { size: "32", available: true },
      { size: "34", available: true }
    ],
    s3Key: "products/cc-022/primary.webp",
    galleryKeys: ["products/cc-022/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-023",
    name: "Raw Edge Linen Drawstring Trousers",
    slug: "raw-edge-linen-drawstring-trousers",
    category: "Trousers",
    subcategory: "Linen Pants",
    gender: "Men",
    price: 2890,
    originalPrice: 3500,
    badge: "Relaxed Fit",
    provenance: "100% Belgian Flax",
    rating: 4.8,
    reviewCount: 27,
    isFeatured: false,
    isTrending: true,
    isNewArrival: false,
    description: "Laid-back tailored summer trousers with elasticated tunnel waist, natural cord drawstrings, and discreet welt back pockets.",
    fabric: "100% Pure Flax Linen (230 GSM).",
    care: "Gentle cold cycle. Hang to dry naturally.",
    origin: "Jaipur Atelier",
    inStock: true,
    status: "active",
    stockCount: 22,
    colors: [
      { name: "Alabaster Ecru", hex: "#FAF9F6" },
      { name: "Dried Olive", hex: "#5B614E" }
    ],
    sizes: [
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true },
      { size: "XL", available: true }
    ],
    s3Key: "products/cc-023/primary.webp",
    galleryKeys: ["products/cc-023/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-024",
    name: "Tailored Straight-Leg Tropical Wool Slacks",
    slug: "tailored-straight-leg-tropical-wool-slacks",
    category: "Trousers",
    subcategory: "Tailored Trousers",
    gender: "Men",
    price: 4500,
    badge: "Fine Suiting",
    provenance: "High-Twist Wool",
    rating: 4.9,
    reviewCount: 19,
    isFeatured: false,
    isTrending: false,
    isNewArrival: true,
    description: "Clean pressed permanent front crease slacks with extended tab waistband and curtained interior lining for formal comfort.",
    fabric: "100% High-twist tropical wool with natural stretch and wrinkle bounce-back.",
    care: "Dry clean only.",
    origin: "Bengaluru Atelier",
    inStock: true,
    status: "active",
    stockCount: 12,
    colors: [
      { name: "Charcoal Melange", hex: "#333333" },
      { name: "Dark Navy", hex: "#151B29" }
    ],
    sizes: [
      { size: "30", available: true },
      { size: "32", available: true },
      { size: "34", available: true },
      { size: "36", available: true }
    ],
    s3Key: "products/cc-024/primary.webp",
    galleryKeys: ["products/cc-024/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-025",
    name: "Tailored Pleated Wide-Leg Trousers",
    slug: "tailored-pleated-wide-leg-trousers",
    category: "Trousers",
    subcategory: "Wide-Leg",
    gender: "Women",
    price: 3890,
    originalPrice: 4600,
    badge: "SS25 Runway",
    provenance: "Viscose-Wool Suiting",
    rating: 4.7,
    reviewCount: 22,
    isFeatured: false,
    isTrending: true,
    isNewArrival: false,
    description: "Dramatic wide-leg trousers cut with architectural precision. High waist with extended tab closure, deep twin pleats, and full floor pooling length.",
    fabric: "55% Recycled Polyester, 40% Fine Wool, 5% Elastane for structured drape without sagging.",
    care: "Dry clean or gentle cold wash cycle. Steam while hanging.",
    origin: "Tailored in Bengaluru Atelier",
    inStock: true,
    status: "active",
    stockCount: 16,
    colors: [
      { name: "Ivory Chalk", hex: "#FAF9F6" },
      { name: "Olive Drab", hex: "#5B614E" },
      { name: "Obsidian", hex: "#111111" }
    ],
    sizes: [
      { size: "XS", available: true },
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true }
    ],
    s3Key: "products/cc-025/primary.webp",
    galleryKeys: ["products/cc-025/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-026",
    name: "High-Rise Sculptural Barrel Trousers",
    slug: "high-rise-sculptural-barrel-trousers",
    category: "Trousers",
    subcategory: "Tailored Trousers",
    gender: "Women",
    price: 3650,
    badge: "Curated Cut",
    provenance: "Organic Cotton Drill",
    rating: 4.9,
    reviewCount: 38,
    isFeatured: true,
    isTrending: false,
    isNewArrival: true,
    description: "Curved balloon-leg silhouette tapered sharply into ankle darts. High-rise waist with tailored buckle tabs at sides.",
    fabric: "100% Compact Organic Cotton Drill (290 GSM).",
    care: "Machine wash cold inside out. Hang dry.",
    origin: "Bengaluru Atelier",
    inStock: true,
    status: "active",
    stockCount: 15,
    colors: [
      { name: "Ecru", hex: "#FAF9F6" },
      { name: "Charcoal", hex: "#222222" }
    ],
    sizes: [
      { size: "26", available: true },
      { size: "28", available: true },
      { size: "30", available: true },
      { size: "32", available: true }
    ],
    s3Key: "products/cc-026/primary.webp",
    galleryKeys: ["products/cc-026/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-027",
    name: "Fluid Sandwashed Silk Lounge Pants",
    slug: "fluid-sandwashed-silk-lounge-pants",
    category: "Trousers",
    subcategory: "Lounge Trousers",
    gender: "Women",
    price: 4200,
    originalPrice: 5100,
    badge: "Pure Silk",
    provenance: "Mulberry Silk Crepe",
    rating: 5.0,
    reviewCount: 20,
    isFeatured: false,
    isTrending: false,
    isNewArrival: false,
    description: "Sumptuous silk trousers with soft gathered elastic waistband, slash pockets, and an effortless floor-skimming wide straight hem.",
    fabric: "100% Sandwashed Mulberry Silk Crepe de Chine.",
    care: "Dry clean or cold delicate silk wash.",
    origin: "Karnataka Silk Guild · Assembled in Mumbai",
    inStock: true,
    status: "active",
    stockCount: 8,
    colors: [
      { name: "Terracotta Bronze", hex: "#8C6239" },
      { name: "Ivory Pearl", hex: "#FAF9F6" }
    ],
    sizes: [
      { size: "XS", available: true },
      { size: "S", available: true },
      { size: "M", available: true }
    ],
    s3Key: "products/cc-027/primary.webp",
    galleryKeys: ["products/cc-027/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-028",
    name: "Cropped Cigarette Linen Trousers",
    slug: "cropped-cigarette-linen-trousers",
    category: "Trousers",
    subcategory: "Cropped Trousers",
    gender: "Women",
    price: 2790,
    badge: "Belgian Linen",
    provenance: "Mid-Weight Flax",
    rating: 4.8,
    reviewCount: 31,
    isFeatured: false,
    isTrending: false,
    isNewArrival: true,
    description: "Slim ankle-cropped trousers with clean flat front, side invisible zip closure, and subtle hemline side slits.",
    fabric: "100% Belgian Flax Linen.",
    care: "Gentle machine wash cold. Hang dry.",
    origin: "Jaipur Atelier",
    inStock: true,
    status: "active",
    stockCount: 21,
    colors: [
      { name: "Dune Sand", hex: "#D8CCBA" },
      { name: "Midnight Navy", hex: "#1A2238" }
    ],
    sizes: [
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true }
    ],
    s3Key: "products/cc-028/primary.webp",
    galleryKeys: ["products/cc-028/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-029",
    name: "Relaxed Architectural Carpenter Trousers",
    slug: "relaxed-architectural-carpenter-trousers",
    category: "Trousers",
    subcategory: "Utility Pants",
    gender: "Unisex",
    price: 3250,
    originalPrice: 3950,
    badge: "Heavy Twill",
    provenance: "Organic Ring-Spun Cotton",
    rating: 4.8,
    reviewCount: 34,
    isFeatured: true,
    isTrending: true,
    isNewArrival: false,
    description: "Workwear-inspired trousers elevated by tailored knee darts, hammer loop detail, and rear reinforced patch pockets.",
    fabric: "100% Heavy Organic Cotton Twill (310 GSM).",
    care: "Machine wash cold. Tumble dry low.",
    origin: "Bengaluru Atelier",
    inStock: true,
    status: "active",
    stockCount: 19,
    colors: [
      { name: "Chalk Off-White", hex: "#FAF9F6" },
      { name: "Dried Olive", hex: "#5B614E" },
      { name: "Deep Ink", hex: "#111111" }
    ],
    sizes: [
      { size: "28", available: true },
      { size: "30", available: true },
      { size: "32", available: true },
      { size: "34", available: true }
    ],
    s3Key: "products/cc-029/primary.webp",
    galleryKeys: ["products/cc-029/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-030",
    name: "Pleated Easy-Fit Drawstring Chinos",
    slug: "pleated-easy-fit-drawstring-chinos",
    category: "Trousers",
    subcategory: "Casual Trousers",
    gender: "Unisex",
    price: 2650,
    badge: "Daily Essential",
    provenance: "Combed Cotton Twill",
    rating: 4.9,
    reviewCount: 52,
    isFeatured: false,
    isTrending: false,
    isNewArrival: true,
    description: "Versatile unisex relaxed trousers with hybrid elasticated drawstring waistband and single front pleat for clean silhouette.",
    fabric: "100% Combed Cotton Twill (230 GSM).",
    care: "Machine wash warm with like colors.",
    origin: "Bengaluru Atelier",
    inStock: true,
    status: "active",
    stockCount: 28,
    colors: [
      { name: "Khaki Tan", hex: "#D4C7B4" },
      { name: "Obsidian", hex: "#111111" }
    ],
    sizes: [
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true },
      { size: "XL", available: true }
    ],
    s3Key: "products/cc-030/primary.webp",
    galleryKeys: ["products/cc-030/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1200&q=85"
    ]
  },

  // ==========================================
  // 4. KNITWEAR (10 DISTINCT PRODUCTS)
  // ==========================================
  {
    id: "cc-031",
    name: "Heavyweight Mercerized Mock Neck",
    slug: "heavyweight-mercerized-mock-neck",
    category: "Knitwear",
    subcategory: "Sweaters",
    gender: "Men",
    price: 1950,
    originalPrice: 2400,
    badge: "Core Essential",
    provenance: "Double Mercerized Cotton",
    rating: 4.8,
    reviewCount: 45,
    isFeatured: true,
    isTrending: false,
    isNewArrival: false,
    description: "A foundational layering piece with a snug architectural mock collar, seamless tubular body construction, and clean lock-stitched hemlines.",
    fabric: "100% double-mercerized 280 GSM cotton jersey with a lustrous silk-like surface and remarkable shape retention.",
    care: "Machine wash cold inside out. Reshape while damp. Do not tumble dry.",
    origin: "Knit in Tiruppur · Finished in Bengaluru Atelier",
    inStock: true,
    status: "active",
    stockCount: 30,
    colors: [
      { name: "Chalk Alabaster", hex: "#FAF9F6" },
      { name: "Dried Olive", hex: "#5B614E" },
      { name: "Ink Black", hex: "#111111" }
    ],
    sizes: [
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true },
      { size: "XL", available: true }
    ],
    s3Key: "products/cc-031/primary.webp",
    galleryKeys: ["products/cc-031/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1550246140-5119ae4790b8?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-032",
    name: "Fine-Gauge Extra-Fine Merino Polo",
    slug: "fine-gauge-extra-fine-merino-polo",
    category: "Knitwear",
    subcategory: "Knit Polos",
    gender: "Men",
    price: 3450,
    badge: "100% Merino",
    provenance: "19.5 Micron Merino Wool",
    rating: 4.9,
    reviewCount: 28,
    isFeatured: false,
    isTrending: true,
    isNewArrival: true,
    description: "Refined seamless knit polo with fashioned collar, three natural mother-of-pearl buttons, and fine ribbing at cuffs and hem.",
    fabric: "100% Extrafine Australian Merino Wool (16-gauge knit).",
    care: "Hand wash cold with wool wash. Dry flat.",
    origin: "Ludhiana Knitwear Guild · Assembled in Bengaluru",
    inStock: true,
    status: "active",
    stockCount: 16,
    colors: [
      { name: "Espresso Brown", hex: "#3A2A22" },
      { name: "Sandstone", hex: "#D8CCBA" }
    ],
    sizes: [
      { size: "M", available: true },
      { size: "L", available: true },
      { size: "XL", available: true }
    ],
    s3Key: "products/cc-032/primary.webp",
    galleryKeys: ["products/cc-032/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1550246140-5119ae4790b8?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-033",
    name: "Waffle-Knit Organic Cotton Cardigan",
    slug: "waffle-knit-organic-cotton-cardigan",
    category: "Knitwear",
    subcategory: "Cardigans",
    gender: "Men",
    price: 2890,
    originalPrice: 3600,
    badge: "Heavy Waffle",
    provenance: "GOTS Organic Cotton",
    rating: 4.8,
    reviewCount: 33,
    isFeatured: true,
    isTrending: true,
    isNewArrival: false,
    description: "Chunky thermal waffle knit cardigan with V-neckline, deep welt pockets, and genuine sustainable corozo nut buttons.",
    fabric: "100% Organic combed cotton waffle (380 GSM).",
    care: "Machine wash cold on wool cycle. Dry flat.",
    origin: "Tiruppur Atelier",
    inStock: true,
    status: "active",
    stockCount: 20,
    colors: [
      { name: "Dune Beige", hex: "#D4C7B4" },
      { name: "Mineral Ink", hex: "#111111" }
    ],
    sizes: [
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true }
    ],
    s3Key: "products/cc-033/primary.webp",
    galleryKeys: ["products/cc-033/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-034",
    name: "Chunky Fisherman Rib Wool Pullover",
    slug: "chunky-fisherman-rib-wool-pullover",
    category: "Knitwear",
    subcategory: "Crewnecks",
    gender: "Men",
    price: 4200,
    badge: "Heritage Wool",
    provenance: "Unspun Lambswool",
    rating: 5.0,
    reviewCount: 17,
    isFeatured: true,
    isTrending: false,
    isNewArrival: false,
    description: "Substantial 5-gauge fisherman rib crewneck with raglan sleeves and reinforced collar. Engineered to withstand chilly highland winds.",
    fabric: "100% Pure Highland Lambswool with natural lanolin water-resistance.",
    care: "Hand wash cold. Dry flat.",
    origin: "Kashmir Mountain Loom",
    inStock: true,
    status: "active",
    stockCount: 10,
    colors: [
      { name: "Raw Ecru", hex: "#FAF9F6" },
      { name: "Charcoal Heather", hex: "#2E2E30" }
    ],
    sizes: [
      { size: "M", available: true },
      { size: "L", available: true },
      { size: "XL", available: true }
    ],
    s3Key: "products/cc-034/primary.webp",
    galleryKeys: ["products/cc-034/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1550246140-5119ae4790b8?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-035",
    name: "Brushed Alpaca Bouclé Jumper",
    slug: "brushed-alpaca-boucle-jumper",
    category: "Knitwear",
    subcategory: "Sweaters",
    gender: "Women",
    price: 4890,
    originalPrice: 5990,
    badge: "Baby Alpaca",
    provenance: "Peruvian Baby Alpaca",
    rating: 5.0,
    reviewCount: 25,
    isFeatured: false,
    isTrending: true,
    isNewArrival: false,
    description: "Cloud-soft crewneck sweater knit from textured bouclé yarn with relaxed drop shoulders and delicate ribbed trims.",
    fabric: "70% Baby Alpaca, 23% Polyamide, 7% Fine Merino Wool.",
    care: "Hand wash cold. Reshape and dry flat.",
    origin: "Spun in Arequipa, Peru · Finished in New Delhi",
    inStock: true,
    status: "active",
    stockCount: 12,
    colors: [
      { name: "Alabaster Ecru", hex: "#FAF9F6" },
      { name: "Warm Terracotta", hex: "#8C6239" }
    ],
    sizes: [
      { size: "XS", available: true },
      { size: "S", available: true },
      { size: "M", available: true }
    ],
    s3Key: "products/cc-035/primary.webp",
    galleryKeys: ["products/cc-035/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1576188973526-0e5d7047b0cf?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-036",
    name: "Fine-Ribbed Cashmere Mock-Neck Top",
    slug: "fine-ribbed-cashmere-mock-neck-top",
    category: "Knitwear",
    subcategory: "Knit Tops",
    gender: "Women",
    price: 3950,
    badge: "Grade-A Cashmere",
    provenance: "Inner Mongolian Cashmere",
    rating: 4.9,
    reviewCount: 36,
    isFeatured: true,
    isTrending: false,
    isNewArrival: true,
    description: "Fitted seamless 18-gauge micro-ribbed top designed for sophisticated layering beneath tailoring or worn as a standalone statement.",
    fabric: "100% Grade-A Pure Cashmere with silk-touch hand feel.",
    care: "Specialist wool/cashmere wash.",
    origin: "Jaipur Atelier",
    inStock: true,
    status: "active",
    stockCount: 18,
    colors: [
      { name: "Ivory Chalk", hex: "#FAF9F6" },
      { name: "Dried Olive", hex: "#5B614E" },
      { name: "Obsidian", hex: "#111111" }
    ],
    sizes: [
      { size: "XS", available: true },
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true }
    ],
    s3Key: "products/cc-036/primary.webp",
    galleryKeys: ["products/cc-036/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-037",
    name: "Cocoon Open-Front Cardigan in Oatmeal",
    slug: "cocoon-open-front-cardigan-oatmeal",
    category: "Knitwear",
    subcategory: "Cardigans",
    gender: "Women",
    price: 3650,
    originalPrice: 4400,
    badge: "Archival Knit",
    provenance: "Organic Merino-Cotton",
    rating: 4.8,
    reviewCount: 29,
    isFeatured: false,
    isTrending: true,
    isNewArrival: false,
    description: "Enveloping cocoon wrap cardigan with oversized patch pockets and ribbed cuffs that push up comfortably on arms.",
    fabric: "60% Organic Cotton, 40% Extra-fine Merino Wool.",
    care: "Hand wash cold. Dry flat.",
    origin: "Ludhiana Atelier",
    inStock: true,
    status: "active",
    stockCount: 15,
    colors: [
      { name: "Oatmeal Heather", hex: "#DCD6C8" },
      { name: "Charcoal", hex: "#222222" }
    ],
    sizes: [
      { size: "S/M", available: true },
      { size: "L/XL", available: true }
    ],
    s3Key: "products/cc-037/primary.webp",
    galleryKeys: ["products/cc-037/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-038",
    name: "Sheer Open-Weave Linen Knit Sweater",
    slug: "sheer-open-weave-linen-knit-sweater",
    category: "Knitwear",
    subcategory: "Lightweight Knits",
    gender: "Women",
    price: 2750,
    badge: "Spring Linen",
    provenance: "Italian Spun Linen",
    rating: 4.7,
    reviewCount: 21,
    isFeatured: false,
    isTrending: false,
    isNewArrival: true,
    description: "Airy loose-gauge summer sweater intended to layer over bralettes or slip dresses. Relaxed boat neckline and elongated sleeves.",
    fabric: "100% Linen Tape Yarn (Italian Spun).",
    care: "Hand wash cold. Dry flat.",
    origin: "Jaipur Atelier",
    inStock: true,
    status: "active",
    stockCount: 14,
    colors: [
      { name: "Sandstone", hex: "#D8CCBA" },
      { name: "Pure White", hex: "#FAF9F6" }
    ],
    sizes: [
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true }
    ],
    s3Key: "products/cc-038/primary.webp",
    galleryKeys: ["products/cc-038/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1576188973526-0e5d7047b0cf?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-039",
    name: "Heavyweight Loopback Raglan Sweatshirt",
    slug: "heavyweight-loopback-raglan-sweatshirt",
    category: "Knitwear",
    subcategory: "Sweatshirts",
    gender: "Unisex",
    price: 2350,
    originalPrice: 2950,
    badge: "450 GSM French Terry",
    provenance: "Combed Organic Cotton",
    rating: 4.9,
    reviewCount: 54,
    isFeatured: false,
    isTrending: false,
    isNewArrival: false,
    description: "Indestructible French Terry crewneck with V-insert at collar, flatlock flat-felled seams, and heavy 2x2 ribbing.",
    fabric: "100% GOTS Organic Cotton (450 GSM heavyweight loopback).",
    care: "Machine wash warm. Tumble dry.",
    origin: "Tiruppur Atelier",
    inStock: true,
    status: "active",
    stockCount: 35,
    colors: [
      { name: "Chalk", hex: "#FAF9F6" },
      { name: "Dried Olive", hex: "#5B614E" },
      { name: "Black", hex: "#111111" }
    ],
    sizes: [
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true },
      { size: "XL", available: true }
    ],
    s3Key: "products/cc-039/primary.webp",
    galleryKeys: ["products/cc-039/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-040",
    name: "Seamless Minimalist Boxy Knit Hoodie",
    slug: "seamless-minimalist-boxy-knit-hoodie",
    category: "Knitwear",
    subcategory: "Hoodies",
    gender: "Unisex",
    price: 3150,
    badge: "Seamless Knit",
    provenance: "Double-Knit Cotton Wool",
    rating: 4.9,
    reviewCount: 40,
    isFeatured: true,
    isTrending: false,
    isNewArrival: true,
    description: "Drawstring-free crossover hood construction with clean kangaroo pocket integrated directly into the knit structure.",
    fabric: "75% Combed Organic Cotton, 25% Fine Merino Wool.",
    care: "Machine wash delicate cold. Line dry.",
    origin: "Bengaluru Atelier",
    inStock: true,
    status: "active",
    stockCount: 22,
    colors: [
      { name: "Mineral Stone", hex: "#C7C2B8" },
      { name: "Matte Black", hex: "#111111" }
    ],
    sizes: [
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true },
      { size: "XL", available: true }
    ],
    s3Key: "products/cc-040/primary.webp",
    galleryKeys: ["products/cc-040/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1200&q=85"
    ]
  },

  // ==========================================
  // 5. DRESSES (10 DISTINCT PRODUCTS)
  // ==========================================
  {
    id: "cc-041",
    name: "Fluid Silk-Modal Slip Dress",
    slug: "fluid-silk-modal-slip-dress",
    category: "Dresses",
    subcategory: "Slip Dresses",
    gender: "Women",
    price: 4750,
    originalPrice: 5500,
    badge: "Capsule SS25",
    provenance: "Mulberry Silk & Modal",
    rating: 4.9,
    reviewCount: 27,
    isFeatured: true,
    isTrending: true,
    isNewArrival: false,
    description: "An intoxicating bias-cut silhouette that glides over contours. Features delicate micro-straps, a soft scoop neckline, and an ankle-grazing fluid hemline.",
    fabric: "40% Mulberry Silk, 60% Sustainable Beechwood Modal. Sand-washed finish for an ultra-matte, liquid feel against skin.",
    care: "Hand wash cold with silk detergent. Dry flat in shade. Cool iron on silk setting.",
    origin: "Silk sourced from Karnataka · Assembled in Mumbai Atelier",
    inStock: true,
    status: "active",
    stockCount: 14,
    colors: [
      { name: "Terracotta Earth", hex: "#8C6239" },
      { name: "Ivory Pearl", hex: "#FAF9F6" },
      { name: "Onyx Black", hex: "#111111" }
    ],
    sizes: [
      { size: "XS", available: true },
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true }
    ],
    s3Key: "products/cc-041/primary.webp",
    galleryKeys: ["products/cc-041/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-042",
    name: "Architectural Tiered Linen Maxi Dress",
    slug: "architectural-tiered-linen-maxi-dress",
    category: "Dresses",
    subcategory: "Maxi Dresses",
    gender: "Women",
    price: 5200,
    badge: "Pure Flax",
    provenance: "Belgian Heavy Flax",
    rating: 5.0,
    reviewCount: 32,
    isFeatured: true,
    isTrending: false,
    isNewArrival: true,
    description: "Floor-length column dress with structured horizontal seam tiers, low square back cut, and side in-seam pockets.",
    fabric: "100% Belgian flax linen (260 GSM) stone-washed for soft crumpled drape.",
    care: "Machine wash cold delicate. Hang dry in shade.",
    origin: "Jaipur Atelier",
    inStock: true,
    status: "active",
    stockCount: 12,
    colors: [
      { name: "Chalk Ecru", hex: "#FAF9F6" },
      { name: "Dried Olive", hex: "#5B614E" }
    ],
    sizes: [
      { size: "XS", available: true },
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true }
    ],
    s3Key: "products/cc-042/primary.webp",
    galleryKeys: ["products/cc-042/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-043",
    name: "Structured Poplin Midi Shirt Dress",
    slug: "structured-poplin-midi-shirt-dress",
    category: "Dresses",
    subcategory: "Midi Dresses",
    gender: "Women",
    price: 3850,
    originalPrice: 4600,
    badge: "Tailored Waist",
    provenance: "Organic Poplin 100s",
    rating: 4.8,
    reviewCount: 29,
    isFeatured: false,
    isTrending: true,
    isNewArrival: false,
    description: "Architectural shirt dress with sharp wing collar, buttoned front placket, removable wide fabric sash, and deep flared hem.",
    fabric: "100% High-density organic cotton poplin.",
    care: "Machine wash cold. Crisp steam iron.",
    origin: "Bengaluru Atelier",
    inStock: true,
    status: "active",
    stockCount: 16,
    colors: [
      { name: "Crisp Chalk", hex: "#FAF9F6" },
      { name: "Pitch Charcoal", hex: "#222222" }
    ],
    sizes: [
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true }
    ],
    s3Key: "products/cc-043/primary.webp",
    galleryKeys: ["products/cc-043/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-044",
    name: "Column Knit Minimalist Halter Dress",
    slug: "column-knit-minimalist-halter-dress",
    category: "Dresses",
    subcategory: "Knit Dresses",
    gender: "Women",
    price: 4450,
    badge: "Ribbed Mercerized",
    provenance: "Combed Mercerized Cotton",
    rating: 4.9,
    reviewCount: 23,
    isFeatured: false,
    isTrending: false,
    isNewArrival: true,
    description: "Sculptural ribbed knit maxi dress hugging curves gently before descending into a straight column hem with side knee slit.",
    fabric: "100% Double-mercerized Egyptian cotton knit with generous natural give.",
    care: "Hand wash cold. Dry flat.",
    origin: "Tiruppur Atelier",
    inStock: true,
    status: "active",
    stockCount: 15,
    colors: [
      { name: "Mineral Black", hex: "#111111" },
      { name: "Warm Dunes", hex: "#D8CCBA" }
    ],
    sizes: [
      { size: "XS", available: true },
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true }
    ],
    s3Key: "products/cc-044/primary.webp",
    galleryKeys: ["products/cc-044/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-045",
    name: "Asymmetric Drape Raw Silk Gown",
    slug: "asymmetric-drape-raw-silk-gown",
    category: "Dresses",
    subcategory: "Evening Gowns",
    gender: "Women",
    price: 8900,
    originalPrice: 10500,
    badge: "Atelier Haute",
    provenance: "Handwoven Matka Silk",
    rating: 5.0,
    reviewCount: 14,
    isFeatured: false,
    isTrending: true,
    isNewArrival: false,
    description: "One-shoulder evening masterpiece draped by hand in raw slub silk. Flattering side cascade drape and dramatic sweep hemline.",
    fabric: "100% Handloom Matka Silk from Bhagalpur.",
    care: "Specialist dry clean only.",
    origin: "Bhagalpur Silk Guild · New Delhi Atelier",
    inStock: true,
    status: "active",
    stockCount: 7,
    colors: [
      { name: "Terracotta Raw", hex: "#8C6239" },
      { name: "Smoky Obsidian", hex: "#18181A" }
    ],
    sizes: [
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true }
    ],
    s3Key: "products/cc-045/primary.webp",
    galleryKeys: ["products/cc-045/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-046",
    name: "Minimalist Pleated Apron Pinafore Dress",
    slug: "minimalist-pleated-apron-pinafore-dress",
    category: "Dresses",
    subcategory: "Day Dresses",
    gender: "Women",
    price: 3490,
    badge: "Crisp Twill",
    provenance: "Organic Cotton Twill",
    rating: 4.8,
    reviewCount: 30,
    isFeatured: true,
    isTrending: false,
    isNewArrival: false,
    description: "Clean Japanese-inspired apron dress with crossover back straps, deep waist pleats, and square apron chest. Perfect layered over poplin shirts.",
    fabric: "100% Compact Organic Cotton Twill (240 GSM).",
    care: "Machine wash delicate cold. Hang dry.",
    origin: "Bengaluru Atelier",
    inStock: true,
    status: "active",
    stockCount: 17,
    colors: [
      { name: "Dried Olive", hex: "#5B614E" },
      { name: "Jet Black", hex: "#111111" }
    ],
    sizes: [
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true }
    ],
    s3Key: "products/cc-046/primary.webp",
    galleryKeys: ["products/cc-046/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-047",
    name: "Raw Flax Linen Wrap Kimono Dress",
    slug: "raw-flax-linen-wrap-kimono-dress",
    category: "Dresses",
    subcategory: "Wrap Dresses",
    gender: "Women",
    price: 4150,
    originalPrice: 4990,
    badge: "Artisan Loomed",
    provenance: "French Flax Linen",
    rating: 4.9,
    reviewCount: 37,
    isFeatured: false,
    isTrending: true,
    isNewArrival: false,
    description: "Effortless wrap dress with internal tie anchor and wide outer wrap belt. Relaxed kimono-style sleeves and midi length.",
    fabric: "100% Pure Flax Linen (210 GSM).",
    care: "Gentle cold machine wash. Line dry.",
    origin: "Jaipur Atelier",
    inStock: true,
    status: "active",
    stockCount: 16,
    colors: [
      { name: "Warm Dune Sand", hex: "#D8CCBA" },
      { name: "Alabaster Ecru", hex: "#FAF9F6" }
    ],
    sizes: [
      { size: "XS", available: true },
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true }
    ],
    s3Key: "products/cc-047/primary.webp",
    galleryKeys: ["products/cc-047/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-048",
    name: "Bias-Cut Satin Slip Midi Dress",
    slug: "bias-cut-satin-slip-midi-dress",
    category: "Dresses",
    subcategory: "Midi Dresses",
    gender: "Women",
    price: 3950,
    badge: "Satin Finish",
    provenance: "Recycled Satin Weave",
    rating: 4.7,
    reviewCount: 26,
    isFeatured: false,
    isTrending: false,
    isNewArrival: true,
    description: "Sleek V-neck midi slip with fluid bias drape that contours without clinging. Finished with French seams and adjustable lingerie straps.",
    fabric: "100% Certified Recycled Heavy Satin.",
    care: "Hand wash cold. Low steam.",
    origin: "Mumbai Atelier",
    inStock: true,
    status: "active",
    stockCount: 20,
    colors: [
      { name: "Onyx Black", hex: "#111111" },
      { name: "Champagne Pearl", hex: "#EBE5D8" }
    ],
    sizes: [
      { size: "XS", available: true },
      { size: "S", available: true },
      { size: "M", available: true }
    ],
    s3Key: "products/cc-048/primary.webp",
    galleryKeys: ["products/cc-048/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-049",
    name: "Sculptural Cotton Smock Tent Dress",
    slug: "sculptural-cotton-smock-tent-dress",
    category: "Dresses",
    subcategory: "Casual Dresses",
    gender: "Women",
    price: 3250,
    originalPrice: 3900,
    badge: "Relaxed Volume",
    provenance: "Organic Crinkle Cotton",
    rating: 4.8,
    reviewCount: 31,
    isFeatured: false,
    isTrending: false,
    isNewArrival: false,
    description: "Billowing tent silhouette with delicate micro-gathers below high neckline. Generous hidden side pockets and airy ankle-length hem.",
    fabric: "100% Organic Cotton Crinkle Muslin.",
    care: "Machine wash cold. Line dry in shade.",
    origin: "Bengaluru Atelier",
    inStock: true,
    status: "active",
    stockCount: 18,
    colors: [
      { name: "Chalk Ecru", hex: "#FAF9F6" },
      { name: "Dried Olive", hex: "#5B614E" }
    ],
    sizes: [
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true }
    ],
    s3Key: "products/cc-049/primary.webp",
    galleryKeys: ["products/cc-049/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-050",
    name: "Sleeveless Poplin A-Line Day Dress",
    slug: "sleeveless-poplin-a-line-day-dress",
    category: "Dresses",
    subcategory: "Day Dresses",
    gender: "Women",
    price: 2990,
    badge: "Summer Essential",
    provenance: "Egyptian Poplin",
    rating: 4.9,
    reviewCount: 44,
    isFeatured: true,
    isTrending: false,
    isNewArrival: true,
    description: "Clean minimalist A-line shift dress with high jewel neck, concealed back zipper, and crisp architectural flare.",
    fabric: "100% Egyptian Giza Cotton Poplin (170 GSM).",
    care: "Machine wash cold. Crisp steam iron.",
    origin: "Bengaluru Atelier",
    inStock: true,
    status: "active",
    stockCount: 22,
    colors: [
      { name: "Pristine White", hex: "#FAF9F6" },
      { name: "Ink Black", hex: "#111111" }
    ],
    sizes: [
      { size: "XS", available: true },
      { size: "S", available: true },
      { size: "M", available: true },
      { size: "L", available: true }
    ],
    s3Key: "products/cc-050/primary.webp",
    galleryKeys: ["products/cc-050/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1200&q=85"
    ]
  },

  // ==========================================
  // 6. ACCESSORIES (10 DISTINCT PRODUCTS)
  // ==========================================
  {
    id: "cc-051",
    name: "Brutalist Leather Crossbody Pouch",
    slug: "brutalist-leather-crossbody-pouch",
    category: "Accessories",
    subcategory: "Bags",
    gender: "Unisex",
    price: 2800,
    originalPrice: 3500,
    badge: "Artisan Made",
    provenance: "Full-Grain Vegetable Tanned",
    rating: 4.9,
    reviewCount: 34,
    isFeatured: true,
    isTrending: true,
    isNewArrival: false,
    description: "Architectural sharp-edged mini bag with hand-beveled burnished edges, concealed magnetic closure, and adjustable slim leather strap.",
    fabric: "100% Full-grain vegetable-tanned leather from certified sustainable tanneries in Tamil Nadu.",
    care: "Condition with natural beeswax leather cream every 6 months. Keep dry.",
    origin: "Handcrafted in Ambur Leather Atelier",
    inStock: true,
    status: "active",
    stockCount: 20,
    colors: [
      { name: "Matte Black", hex: "#111111" },
      { name: "Sienna Brown", hex: "#8C6239" }
    ],
    sizes: [
      { size: "ONE SIZE", available: true }
    ],
    s3Key: "products/cc-051/primary.webp",
    galleryKeys: ["products/cc-051/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1524498250077-390f9e378fc0?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-052",
    name: "Heavyweight Waxed Canvas Market Tote",
    slug: "heavyweight-waxed-canvas-market-tote",
    category: "Accessories",
    subcategory: "Bags",
    gender: "Unisex",
    price: 2250,
    badge: "Waterproofed Wax",
    provenance: "18oz Paraffin Duck Canvas",
    rating: 4.8,
    reviewCount: 46,
    isFeatured: true,
    isTrending: false,
    isNewArrival: true,
    description: "Indestructible boxy utilitarian tote with bridle leather handles, solid brass rivets, and internal zip organizer pocket.",
    fabric: "100% Waxed Cotton Duck Canvas with vegetable-tanned leather handles.",
    care: "Wipe with damp cloth. Re-wax every 2 years.",
    origin: "Handmade in Bengaluru Atelier",
    inStock: true,
    status: "active",
    stockCount: 30,
    colors: [
      { name: "Dried Olive", hex: "#5B614E" },
      { name: "Charcoal Black", hex: "#111111" }
    ],
    sizes: [
      { size: "ONE SIZE", available: true }
    ],
    s3Key: "products/cc-052/primary.webp",
    galleryKeys: ["products/cc-052/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-053",
    name: "Structured Architectural Leather Shoulder Tote",
    slug: "structured-architectural-leather-shoulder-tote",
    category: "Accessories",
    subcategory: "Bags",
    gender: "Women",
    price: 5800,
    originalPrice: 7200,
    badge: "Italian Calfskin",
    provenance: "Semi-Vegetable Calfskin",
    rating: 5.0,
    reviewCount: 22,
    isFeatured: false,
    isTrending: true,
    isNewArrival: false,
    description: "Refined geometric shoulder bag designed to hold a 14-inch laptop. Minimalist magnetic top bridge closure and microfiber suede lining.",
    fabric: "100% Italian Semi-Vegetable Tanned Calfskin.",
    care: "Wipe with soft micro-fiber cloth.",
    origin: "Crafted in Ambur Atelier",
    inStock: true,
    status: "active",
    stockCount: 9,
    colors: [
      { name: "Espresso", hex: "#3A2A22" },
      { name: "Obsidian Black", hex: "#111111" }
    ],
    sizes: [
      { size: "ONE SIZE", available: true }
    ],
    s3Key: "products/cc-053/primary.webp",
    galleryKeys: ["products/cc-053/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-054",
    name: "Minimalist Full-Grain Saddle Leather Belt",
    slug: "minimalist-full-grain-saddle-leather-belt",
    category: "Accessories",
    subcategory: "Belts",
    gender: "Men",
    price: 1750,
    badge: "Solid Brass Buckle",
    provenance: "English Bridle Leather",
    rating: 4.9,
    reviewCount: 51,
    isFeatured: true,
    isTrending: false,
    isNewArrival: false,
    description: "Beveled hand-burnished 32mm belt with a matte brushed solid brass buckle. Cut from 9oz vegetable-tanned steer hide.",
    fabric: "100% Full-grain vegetable-tanned bridle leather with solid brass hardware.",
    care: "Wipe with clean dry cloth. Apply leather balm as needed.",
    origin: "Handcrafted in Kanpur Leather Atelier",
    inStock: true,
    status: "active",
    stockCount: 25,
    colors: [
      { name: "Pitch Black", hex: "#111111" },
      { name: "Cognac Tan", hex: "#8C6239" }
    ],
    sizes: [
      { size: "30", available: true },
      { size: "32", available: true },
      { size: "34", available: true },
      { size: "36", available: true }
    ],
    s3Key: "products/cc-054/primary.webp",
    galleryKeys: ["products/cc-054/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1556306535-0f09a537f0a3?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-055",
    name: "Washed Twill Minimalist Cap",
    slug: "washed-twill-minimalist-cap",
    category: "Accessories",
    subcategory: "Headwear",
    gender: "Unisex",
    price: 1290,
    originalPrice: 1650,
    badge: "Embroidered Monogram",
    provenance: "Organic Chino Twill",
    rating: 4.8,
    reviewCount: 63,
    isFeatured: false,
    isTrending: true,
    isNewArrival: false,
    description: "Low-profile unconstructed 6-panel dad cap with subtle tonal CloudCloset monogram embroidery and antique brass tri-glide closure.",
    fabric: "100% Washed Organic Cotton Chino Twill.",
    care: "Spot clean with damp cloth.",
    origin: "Bengaluru Atelier",
    inStock: true,
    status: "active",
    stockCount: 40,
    colors: [
      { name: "Dried Olive", hex: "#5B614E" },
      { name: "Chalk Ecru", hex: "#FAF9F6" },
      { name: "Ink Black", hex: "#111111" }
    ],
    sizes: [
      { size: "ONE SIZE", available: true }
    ],
    s3Key: "products/cc-055/primary.webp",
    galleryKeys: ["products/cc-055/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1556306535-0f09a537f0a3?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-056",
    name: "Handwoven Pashmina & Silk Scarf",
    slug: "handwoven-pashmina-silk-scarf",
    category: "Accessories",
    subcategory: "Scarves",
    gender: "Unisex",
    price: 3450,
    originalPrice: 4200,
    badge: "Kashmiri Loom",
    provenance: "70% Cashmere, 30% Silk",
    rating: 5.0,
    reviewCount: 27,
    isFeatured: false,
    isTrending: true,
    isNewArrival: false,
    description: "Featherweight handwoven wrap with delicate eyelash fringe edges. Soft beyond measure and compact enough to slip into any handbag or overcoat pocket.",
    fabric: "70% Changthangi Cashmere Pashmina, 30% Mulberry Silk.",
    care: "Dry clean only. Store folded in breathable fabric bag.",
    origin: "Handloom Weavers Guild, Srinagar, Kashmir",
    inStock: true,
    status: "active",
    stockCount: 15,
    colors: [
      { name: "Ivory Cloud", hex: "#FAF9F6" },
      { name: "Smoke Slate", hex: "#747878" }
    ],
    sizes: [
      { size: "200cm x 70cm", available: true }
    ],
    s3Key: "products/cc-056/primary.webp",
    galleryKeys: ["products/cc-056/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-057",
    name: "Handcrafted Mazzucchelli Acetate Sunglasses",
    slug: "handcrafted-mazzucchelli-acetate-sunglasses",
    category: "Accessories",
    subcategory: "Eyewear",
    gender: "Unisex",
    price: 4900,
    badge: "Carl Zeiss Lenses",
    provenance: "Italian Bio-Acetate",
    rating: 4.9,
    reviewCount: 38,
    isFeatured: true,
    isTrending: false,
    isNewArrival: true,
    description: "Sculptural geometric sunglasses milled from plant-based Italian acetate. Fitted with 100% UVA/UVB category-3 tinted Carl Zeiss CR-39 optical lenses.",
    fabric: "Mazzucchelli M49 Bio-Acetate with five-barrel German steel hinges.",
    care: "Clean with micro-fiber cloth and optical cleaner.",
    origin: "Hand-finished in Mumbai Atelier",
    inStock: true,
    status: "active",
    stockCount: 18,
    colors: [
      { name: "Smoky Tortoise", hex: "#443425" },
      { name: "Polished Jet", hex: "#111111" }
    ],
    sizes: [
      { size: "ONE SIZE", available: true }
    ],
    s3Key: "products/cc-057/primary.webp",
    galleryKeys: ["products/cc-057/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-058",
    name: "Sculptural Cast Brass Cuff Bracelet",
    slug: "sculptural-cast-brass-cuff-bracelet",
    category: "Accessories",
    subcategory: "Jewellery",
    gender: "Women",
    price: 1950,
    originalPrice: 2500,
    badge: "Hand-Burnished",
    provenance: "Solid Recycled Brass",
    rating: 4.8,
    reviewCount: 19,
    isFeatured: false,
    isTrending: false,
    isNewArrival: false,
    description: "Architectural brutalist cuff with gently contoured thickness and a soft matte brushed satin finish that patinas handsomely over time.",
    fabric: "100% Recycled Solid Brass with anti-tarnish protective micro-coating.",
    care: "Polish with soft jewelry cloth.",
    origin: "Jaipur Metal Atelier",
    inStock: true,
    status: "active",
    stockCount: 14,
    colors: [
      { name: "Brushed Gold Brass", hex: "#C5A86A" }
    ],
    sizes: [
      { size: "S/M", available: true },
      { size: "M/L", available: true }
    ],
    s3Key: "products/cc-058/primary.webp",
    galleryKeys: ["products/cc-058/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-059",
    name: "Mercerized Combed Cotton Socks (3-Pack)",
    slug: "mercerized-combed-cotton-socks-3-pack",
    category: "Accessories",
    subcategory: "Essentials",
    gender: "Unisex",
    price: 950,
    badge: "Seamless Toe",
    provenance: "Long-Staple Cotton",
    rating: 4.9,
    reviewCount: 58,
    isFeatured: false,
    isTrending: false,
    isNewArrival: true,
    description: "Fine-gauge ribbed crew socks knit on 200-needle Italian Lonati machines with seamless hand-linked toe seams that eliminate pressure ridges.",
    fabric: "80% Double-Mercerized Combed Cotton, 18% Polyamide, 2% Elastane.",
    care: "Machine wash warm. Hang dry.",
    origin: "Coimbatore Knitting Atelier",
    inStock: true,
    status: "active",
    stockCount: 45,
    colors: [
      { name: "Trio (Ivory/Olive/Black)", hex: "#5B614E" }
    ],
    sizes: [
      { size: "M (UK 6-8)", available: true },
      { size: "L (UK 9-11)", available: true }
    ],
    s3Key: "products/cc-059/primary.webp",
    galleryKeys: ["products/cc-059/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    id: "cc-060",
    name: "Compact Bifold Vegetable-Tanned Wallet",
    slug: "compact-bifold-vegetable-tanned-wallet",
    category: "Accessories",
    subcategory: "Small Leather Goods",
    gender: "Men",
    price: 2100,
    originalPrice: 2600,
    badge: "Edge-Dyed",
    provenance: "Full-Grain Cowhide",
    rating: 4.8,
    reviewCount: 36,
    isFeatured: false,
    isTrending: true,
    isNewArrival: false,
    description: "Ultra-slim front pocket wallet featuring 6 card slots, central cash sleeve, and hand-painted edge crease lines.",
    fabric: "100% Full-grain vegetable-tanned leather.",
    care: "Clean with soft cloth. Condition twice yearly.",
    origin: "Ambur Leather Atelier",
    inStock: true,
    status: "active",
    stockCount: 20,
    colors: [
      { name: "Obsidian Black", hex: "#111111" },
      { name: "Tan Sienna", hex: "#8C6239" }
    ],
    sizes: [
      { size: "ONE SIZE", available: true }
    ],
    s3Key: "products/cc-060/primary.webp",
    galleryKeys: ["products/cc-060/gallery-1.webp"],
    images: [
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=85"
    ]
  }
];

export const mockOrders = [
  {
    id: "ORD-9481",
    customer: "Ananya Mehra",
    email: "ananya.mehra@atelier.in",
    date: "2026-10-19",
    items: [
      { name: "Oversized Structured Poplin Shirt", qty: 1, size: "M", price: 1899 },
      { name: "Pleated Tapered Chinos", qty: 1, size: "32", price: 3450 }
    ],
    total: 5349,
    status: "Shipped",
    payment: "UPI (Google Pay)",
    destination: "Mumbai (400001)"
  },
  {
    id: "ORD-9480",
    customer: "Vikramaditya Rao",
    email: "vikram.rao@delhicapital.com",
    date: "2026-10-18",
    items: [
      { name: "Minimalist Ecru Linen Trench Coat", qty: 1, size: "L", price: 4890 }
    ],
    total: 4890,
    status: "Processing",
    payment: "HDFC Credit Card",
    destination: "New Delhi (110001)"
  },
  {
    id: "ORD-9479",
    customer: "Priya Sundaram",
    email: "priya.s@bengaluru.design",
    date: "2026-10-17",
    items: [
      { name: "Fluid Silk-Modal Slip Dress", qty: 1, size: "S", price: 4750 },
      { name: "Brutalist Leather Crossbody Pouch", qty: 1, size: "ONE SIZE", price: 2800 }
    ],
    total: 7550,
    status: "Delivered",
    payment: "Net Banking (ICICI)",
    destination: "Bengaluru (560001)"
  }
];
