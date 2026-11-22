import { prisma } from "@/lib/prisma";
import {
  EXTENDED_CATALOG,
  INITIAL_BRANDS,
  INITIAL_HERO_CONFIG,
  INITIAL_SECTIONS_CONFIG,
  type CatalogItem,
} from "@/lib/storefront-data";

export interface LiveCmsSection {
  id: number;
  key: string;
  type: string;
  title: string;
  content: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
}

export interface LiveBrand {
  id: number;
  name: string;
  slug: string;
  logoUrl: string;
  isActive: boolean;
  sortOrder: number;
}

const FALLBACK_SECTIONS: LiveCmsSection[] = [
  {
    id: 1,
    key: "home-hero",
    type: "HERO_3D",
    title: "Hero Section (3D Clouds)",
    sortOrder: 0,
    isActive: true,
    content: INITIAL_HERO_CONFIG as unknown as Record<string, unknown>,
  },
  {
    id: 2,
    key: "home-editorial-categories",
    type: "EDITORIAL_CATEGORIES",
    title: "Editorial Intro & Categories",
    sortOrder: 1,
    isActive: true,
    content: INITIAL_SECTIONS_CONFIG.editorialIntro as unknown as Record<
      string,
      unknown
    >,
  },
  {
    id: 3,
    key: "home-editorial-banner",
    type: "EDITORIAL_BANNER",
    title: "Editorial Banner",
    sortOrder: 2,
    isActive: true,
    content: INITIAL_SECTIONS_CONFIG.editorialBanner as unknown as Record<
      string,
      unknown
    >,
  },
  {
    id: 4,
    key: "home-featured-product",
    type: "FEATURED_PRODUCT",
    title: "Featured Wholesale Product",
    sortOrder: 3,
    isActive: true,
    content: { badge: "Featured Wholesale Pick" },
  },
  {
    id: 5,
    key: "home-best-sellers",
    type: "BEST_SELLERS",
    title: "Best Sellers Grid",
    sortOrder: 4,
    isActive: true,
    content: {
      eyebrow: "High-Turnover Retail Picks",
      heading: "Best Sellers",
    },
  },
  {
    id: 6,
    key: "home-brand-marquee",
    type: "BRAND_MARQUEE",
    title: "Tilted Brand Marquee",
    sortOrder: 5,
    isActive: true,
    content: {
      eyebrow: "— Curated Wholesale Portfolio",
      heading: "30+ Trusted Tobacco Brands.",
      ctaLabel: "Explore All 30+ Brands",
      ctaHref: "/brands",
    },
  },
  {
    id: 7,
    key: "home-footer",
    type: "FOOTER",
    title: "Trust Bar & Footer",
    sortOrder: 6,
    isActive: true,
    content: {},
  },
];

const FALLBACK_BRANDS: LiveBrand[] = INITIAL_BRANDS.map((b, idx) => ({
  id: idx + 1,
  name: b.name,
  slug: b.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, ""),
  logoUrl: `/brands/${b.img}`,
  isActive: true,
  sortOrder: idx,
}));

export async function getLiveHomeData(): Promise<{
  sections: LiveCmsSection[];
  brands: LiveBrand[];
}> {
  try {
    const [dbSections, dbBrands] = await Promise.all([
      prisma.cmsSection.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.brand.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
    ]);

    const sections: LiveCmsSection[] =
      dbSections.length > 0
        ? dbSections.map((s) => ({
            id: s.id,
            key: s.key,
            type: s.type,
            title: s.title,
            content: (s.content as Record<string, unknown>) ?? {},
            sortOrder: s.sortOrder,
            isActive: s.isActive,
          }))
        : FALLBACK_SECTIONS;

    const brands: LiveBrand[] =
      dbBrands.length > 0 ? dbBrands : FALLBACK_BRANDS;

    return { sections, brands };
  } catch (error) {
    console.error("Failed to fetch live homepage data from Prisma:", error);
    return { sections: FALLBACK_SECTIONS, brands: FALLBACK_BRANDS };
  }
}

export async function getLiveBrands(): Promise<LiveBrand[]> {
  try {
    const dbBrands = await prisma.brand.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return dbBrands.length > 0 ? dbBrands : FALLBACK_BRANDS;
  } catch (error) {
    console.error("Failed to fetch live brands from Prisma:", error);
    return FALLBACK_BRANDS;
  }
}

export async function getLiveCatalog(): Promise<CatalogItem[]> {
  try {
    const dbProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { publicVisibilityOverride: true },
          {
            publicVisibilityOverride: null,
            category: { isPublic: true, isActive: true },
          },
        ],
      },
      include: {
        category: { select: { name: true } },
      },
      orderBy: [{ name: "asc" }],
    });

    if (dbProducts.length === 0) {
      return EXTENDED_CATALOG;
    }

    return dbProducts.map((p) => ({
      id: String(p.id),
      sku: p.sku,
      name: p.name,
      brand: p.brand ?? "Latin American Cigars",
      category: p.category.name,
      packSize: p.boxInfo ?? "Wholesale Unit",
      wholesalePrice: Number(p.wholesalePrice ?? p.quickBooksPrice ?? 0),
      image: p.image ?? "/hero-products.jpg",
      inStock: p.isActive,
      specs:
        p.origin || p.wrapper || p.shape || p.strength
          ? {
              origin: p.origin ?? "—",
              wrapper: p.wrapper ?? "—",
              vitola: p.shape ?? "—",
              strength: p.strength ?? "—",
            }
          : undefined,
    }));
  } catch (error) {
    console.error("Failed to fetch live catalog from Prisma:", error);
    return EXTENDED_CATALOG;
  }
}