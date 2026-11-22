export type PartnerSessionState = "GUEST" | "APPROVED_PARTNER";

export interface CatalogItem {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  packSize: string;
  image: string;
  gallery?: string[];
  wholesalePrice: number;
  inStock: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  badge?: string;
  description?: string;
  specs?: {
    origin: string;
    wrapper: string;
    vitola: string;
    strength: string;
  };
}

export interface CartEntry {
  product: CatalogItem;
  quantity: number;
}

export interface HeroBlockItem {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  icon: string;
  bgImage: string;
  enabled: boolean;
}

export interface HeroSectionConfig {
  id: string;
  type: "HERO_3D";
  label: string;
  enabled: boolean;
  eyebrow: string;
  headingLine1: string;
  headingLine2: string;
  subtext: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  highlights: string[];
  blocks: HeroBlockItem[];
}

export const INITIAL_HERO_CONFIG: HeroSectionConfig = {
  id: "sec-hero-v1",
  type: "HERO_3D",
  label: "Hero Section (3D Clouds)",
  enabled: true,
  eyebrow: "WHOLESALE TOBACCO DISTRIBUTOR",
  headingLine1: "Premium Tobacco Brands.",
  headingLine2: "Reliable Wholesale Distribution.",
  subtext:
    "A leading wholesale distributor of cigars, cigarettes, vapes, and accessories, serving retailers across Florida with a premium product portfolio, competitive terms, and dependable, on-time distribution.",
  primaryCta: { label: "EXPLORE PRODUCTS", href: "/products" },
  secondaryCta: { label: "WHOLESALE ACCESS", href: "/contact" },
  highlights: [
    "BUILT FOR RETAILERS",
    "RELIABLE DISTRIBUTION ACROSS FLORIDA",
    "PREMIUM BRANDS & DIVERSE CATEGORIES",
  ],
  blocks: [
    {
      id: "blk-brands",
      title: "BRANDS",
      description:
        "A curated portfolio of leading cigar, cigarette, and vape brands trusted by retailers.",
      ctaLabel: "LEARN MORE",
      href: "/brands",
      icon: "/icons/leaf-icon.svg",
      bgImage: "/leaf-bg.jpg",
      enabled: true,
    },
    {
      id: "blk-products",
      title: "PRODUCTS",
      description:
        "Cigars, cigarettes, vapes, and accessories to meet your customers' demand.",
      ctaLabel: "LEARN MORE",
      href: "/products",
      icon: "/icons/box-icon.svg",
      bgImage: "/smoke-bg.jpg",
      enabled: true,
    },
    {
      id: "blk-wholesale",
      title: "WHOLESALE",
      description:
        "Competitive pricing, consistent inventory, and dependable distribution.",
      ctaLabel: "LEARN MORE",
      href: "/company",
      icon: "/icons/truck-icon.svg",
      bgImage: "/warehouse-bg.jpg",
      enabled: true,
    },
    {
      id: "blk-access",
      title: "ACCESS",
      description:
        "Become an approved customer and get full catalog access and pricing.",
      ctaLabel: "APPLY NOW",
      href: "/contact",
      icon: "/icons/user-plus-icon.svg",
      bgImage: "/blur-bg.jpg",
      enabled: true,
    },
  ],
};

export const INITIAL_BRANDS = [
  { name: "ACID Cigars", img: "acid.jpg" },
  { name: "Aging Room", img: "aging-room.jpg" },
  { name: "AJ Fernandez", img: "aj-fernandez.jpg" },
  { name: "Altadis", img: "altadis2.png" },
  { name: "Arturo Fuente", img: "arturo-fuente.jpg" },
  { name: "AVO", img: "avo.jpg" },
  { name: "Cafeteros", img: "cafeteros.png" },
  { name: "Camacho", img: "camacho.jpg" },
  { name: "Chevere", img: "chevere.jpg" },
  { name: "Cohiba", img: "cohiba.jpg" },
  { name: "Cuban Rejects", img: "cuban-rejects.jpg" },
  { name: "Cuban Sandwich", img: "cuban-sandwich.webp" },
  { name: "Cubiche", img: "cubiche.webp" },
  { name: "Don Felo", img: "don-felo.jpg" },
  { name: "Drew Estate", img: "drew-estate.jpg" },
  { name: "ElBacan", img: "elbacan.jpg" },
  { name: "H Upmann", img: "h-upmann.jpg" },
  { name: "Jaime Garcia", img: "jaime-garcia.jpg" },
  { name: "Java", img: "java.jpg" },
  { name: "La Aurora", img: "la-aurora.jpg" },
  { name: "La Galera", img: "la-galera.jpg" },
  { name: "La Gloria Cubana", img: "la-gloria-cubana.jpg" },
  { name: "Macanudo", img: "macnudo.jpg" },
  { name: "Maravilla Gigantes", img: "maravilla-gigantes.jpg" },
  { name: "My Father", img: "my-father.jpg" },
  { name: "New Cuba", img: "new-cuba.jpg" },
  { name: "Olivia", img: "olivia.jpg" },
  { name: "Partagas", img: "partagas.jpg" },
  { name: "Perdomo", img: "perdomo.jpg" },
  { name: "Perez Carillo", img: "perez-carillo.jpg" },
];

export const SAMPLE_CATALOG: CatalogItem[] = [
  {
    id: "prd-1",
    sku: "LAC-ELB-001",
    name: "El Bacán Reserve Robusto",
    brand: "ElBacan",
    category: "Premium Cigars",
    packSize: "Box of 20",
    image: "/smoke-bg.jpg",
    wholesalePrice: 124.0,
    inStock: true,
  },
  {
    id: "prd-2",
    sku: "LAC-PER-002",
    name: "Perdomo Lot 23 Toro",
    brand: "Perdomo",
    category: "Premium Cigars",
    packSize: "Box of 24",
    image: "/leaf-bg.jpg",
    wholesalePrice: 142.5,
    inStock: true,
  },
  {
    id: "prd-3",
    sku: "LAC-VPE-003",
    name: "Florida Retail Disposable Display",
    brand: "Altadis",
    category: "Vapes & E-Cigs",
    packSize: "Display of 10",
    image: "/blur-bg.jpg",
    wholesalePrice: 98.0,
    inStock: true,
  },
  {
    id: "prd-4",
    sku: "LAC-ACC-004",
    name: "Cedar Countertop Humidor Tray",
    brand: "Arturo Fuente",
    category: "Accessories",
    packSize: "Pack of 6",
    image: "/warehouse-bg.jpg",
    wholesalePrice: 86.0,
    inStock: true,
  },
];

export interface CategoryCardItem {
  id: string;
  name: string;
  slug: string;
  count: number;
  subtitle: string;
  image: string;
}

export const INITIAL_CATEGORIES: CategoryCardItem[] = [
  {
    id: "cat-cigars",
    name: "Premium Cigars",
    slug: "premium-cigars",
    count: 140,
    subtitle: "Hand-rolled Nicaraguan, Dominican & Honduran boxes",
    image: "/smoke-bg.jpg",
  },
  {
    id: "cat-cigarettes",
    name: "Cigarettes & Little Cigars",
    slug: "cigarettes",
    count: 45,
    subtitle: "High-turnover retail cartons & display packs",
    image: "/leaf-bg.jpg",
  },
  {
    id: "cat-vapes",
    name: "Vapes & E-Cigs",
    slug: "vapes",
    count: 68,
    subtitle: "Compliant retail displays & top-selling disposables",
    image: "/blur-bg.jpg",
  },
  {
    id: "cat-accessories",
    name: "Accessories",
    slug: "accessories",
    count: 32,
    subtitle: "Humidors, cutters, torch lighters & retail trays",
    image: "/warehouse-bg.jpg",
  },
];

export const EXTENDED_CATALOG: CatalogItem[] = [
  {
    id: "prd-1",
    sku: "LAC-ELB-001",
    name: "El Bacán Reserve Robusto",
    brand: "ElBacan",
    category: "Premium Cigars",
    packSize: "Box of 20",
    image: "/smoke-bg.jpg",
    gallery: ["/smoke-bg.jpg", "/leaf-bg.jpg", "/company-02.jpg"],
    wholesalePrice: 124.0,
    inStock: true,
    isFeatured: true,
    isBestSeller: true,
    badge: "Featured",
    description:
      "Rich Nicaraguan long-filler blend wrapped in an oily Habano leaf. Engineered for consistent draw, clean burn, and high repeat velocity across Florida retail humidors.",
    specs: {
      origin: "Nicaragua",
      wrapper: "Habano Oscuro",
      vitola: "Robusto 5x52",
      strength: "Medium - Full",
    },
  },
  {
    id: "prd-2",
    sku: "LAC-PER-002",
    name: "Perdomo Lot 23 Toro",
    brand: "Perdomo",
    category: "Premium Cigars",
    packSize: "Box of 24",
    image: "/leaf-bg.jpg",
    wholesalePrice: 142.5,
    inStock: true,
    isBestSeller: true,
    badge: "Best Seller",
    specs: {
      origin: "Nicaragua",
      wrapper: "Connecticut",
      vitola: "Toro 6x50",
      strength: "Medium",
    },
  },
  {
    id: "prd-3",
    sku: "LAC-AF-003",
    name: "Arturo Fuente Gran Reserva",
    brand: "Arturo Fuente",
    category: "Premium Cigars",
    packSize: "Box of 25",
    image: "/company-01.jpg",
    wholesalePrice: 168.0,
    inStock: true,
    isBestSeller: true,
    specs: {
      origin: "Dominican Rep.",
      wrapper: "Cameroon",
      vitola: "Corona 5.5x44",
      strength: "Medium",
    },
  },
  {
    id: "prd-4",
    sku: "LAC-VPE-004",
    name: "Florida Retail Disposable Display",
    brand: "Altadis",
    category: "Vapes & E-Cigs",
    packSize: "Display of 10",
    image: "/blur-bg.jpg",
    wholesalePrice: 98.0,
    inStock: true,
    isBestSeller: true,
    badge: "Fast Mover",
    specs: {
      origin: "USA Dist.",
      wrapper: "Display Box",
      vitola: "10-Count Counter",
      strength: "5% Nicotine",
    },
  },
  {
    id: "prd-5",
    sku: "LAC-ACC-005",
    name: "Cedar Countertop Humidor Tray",
    brand: "Arturo Fuente",
    category: "Accessories",
    packSize: "Pack of 6",
    image: "/warehouse-bg.jpg",
    wholesalePrice: 86.0,
    inStock: true,
    isBestSeller: true,
    specs: {
      origin: "Spanish Cedar",
      wrapper: "Retail Ready",
      vitola: "25-Cigar Cap.",
      strength: "Accessory",
    },
  },
  {
    id: "prd-6",
    sku: "LAC-MYF-006",
    name: "My Father Le Bijou 1922",
    brand: "My Father",
    category: "Premium Cigars",
    packSize: "Box of 23",
    image: "/company-02.jpg",
    wholesalePrice: 194.0,
    inStock: true,
    isBestSeller: true,
    badge: "Top Rated",
    specs: {
      origin: "Nicaragua",
      wrapper: "Habano Oscuro",
      vitola: "Torpedo 6.1x52",
      strength: "Full",
    },
  },
];

export const INITIAL_SECTIONS_CONFIG = {
  editorialIntro: {
    enabled: true,
    heading: "A legacy of reliable wholesale distribution.",
    ctaLabel: "Our Story",
    ctaHref: "/company",
    paragraph1:
      "Based in Florida, Latin American Cigars Corp. is more than a tobacco distributor. We bridge world-class cigar manufacturers and retail storefronts with consistent inventory, transparent terms, and disciplined logistics.",
    paragraph2:
      "From flagship hand-rolled humidors to high-turnover vapes and accessories, every SKU in our portfolio is curated to maximize your shelf velocity and retail margin.",
  },
  editorialBanner: {
    enabled: true,
    eyebrow: "FLORIDA OPERATIONS HUB",
    heading: "Stocked. Climate-Controlled. On Time.",
    subtext:
      "Direct wholesale supply chains serving smoke shops, lounges, and independent retailers across Florida.",
    ctaLabel: "Apply for Wholesale Access",
    ctaHref: "/contact",
    bgImage: "/company-01.jpg",
  },
};