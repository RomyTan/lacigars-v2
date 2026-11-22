import { requireAdminSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  INITIAL_HERO_CONFIG,
  INITIAL_SECTIONS_CONFIG,
} from "@/lib/storefront-data";
import { SectionType } from "@prisma/client";

const DEFAULT_SECTIONS = [
  {
    key: "home-hero",
    type: SectionType.HERO_3D,
    title: "Hero Section (3D Clouds)",
    sortOrder: 0,
    isActive: true,
    content: INITIAL_HERO_CONFIG,
  },
  {
    key: "home-editorial-categories",
    type: SectionType.EDITORIAL_CATEGORIES,
    title: "Editorial Intro & Categories",
    sortOrder: 1,
    isActive: true,
    content: INITIAL_SECTIONS_CONFIG.editorialIntro,
  },
  {
    key: "home-editorial-banner",
    type: SectionType.EDITORIAL_BANNER,
    title: "Editorial Banner",
    sortOrder: 2,
    isActive: true,
    content: INITIAL_SECTIONS_CONFIG.editorialBanner,
  },
  {
    key: "home-featured-product",
    type: SectionType.FEATURED_PRODUCT,
    title: "Featured Wholesale Product",
    sortOrder: 3,
    isActive: true,
    content: { badge: "Featured Wholesale Pick" },
  },
  {
    key: "home-best-sellers",
    type: SectionType.BEST_SELLERS,
    title: "Best Sellers Grid",
    sortOrder: 4,
    isActive: true,
    content: { eyebrow: "High-Turnover Retail Picks", heading: "Best Sellers" },
  },
  {
    key: "home-brand-marquee",
    type: SectionType.BRAND_MARQUEE,
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
    key: "home-footer",
    type: SectionType.FOOTER,
    title: "Trust Bar & Footer",
    sortOrder: 6,
    isActive: true,
    content: {
      ctaHeading: "Ready to stock your store?",
      ctaSubtext:
        "Apply for an approved wholesale account to unlock full catalog pricing and online ordering.",
    },
  },
];

export async function GET() {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    let sections = await prisma.cmsSection.findMany({
      orderBy: { sortOrder: "asc" },
    });

    if (sections.length === 0) {
      await prisma.cmsSection.createMany({
        data: DEFAULT_SECTIONS.map((s) => ({
          key: s.key,
          type: s.type,
          title: s.title,
          sortOrder: s.sortOrder,
          isActive: s.isActive,
          content: s.content as object,
        })),
      });
      sections = await prisma.cmsSection.findMany({
        orderBy: { sortOrder: "asc" },
      });
    }

    return NextResponse.json({ sections });
  } catch (error) {
    console.error("GET /api/cms/sections error:", error);
    return NextResponse.json(
      { error: "Failed to load CMS sections" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();

    if (Array.isArray(body.order)) {
      await prisma.$transaction(
        body.order.map((item: { id: number; sortOrder: number }) =>
          prisma.cmsSection.update({
            where: { id: item.id },
            data: { sortOrder: item.sortOrder },
          })
        )
      );
      const updated = await prisma.cmsSection.findMany({
        orderBy: { sortOrder: "asc" },
      });
      return NextResponse.json({ sections: updated });
    }

    const { id, title, isActive, content } = body;
    if (!id) {
      return NextResponse.json(
        { error: "Section id is required" },
        { status: 400 }
      );
    }

    const updated = await prisma.cmsSection.update({
      where: { id: Number(id) },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(content !== undefined ? { content } : {}),
      },
    });

    return NextResponse.json({ section: updated });
  } catch (error) {
    console.error("PATCH /api/cms/sections error:", error);
    return NextResponse.json(
      { error: "Failed to update section" },
      { status: 500 }
    );
  }
}