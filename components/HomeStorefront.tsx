"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  Package,
  Truck,
  KeyRound,
  Sparkles,
  ArrowRight,
  Lock,
} from "lucide-react";
import { HeroClouds } from "@/components/HeroClouds";
import { useStorefront } from "@/components/StorefrontShell";
import { INITIAL_HERO_CONFIG } from "@/lib/storefront-data";
import type { LiveBrand, LiveCmsSection } from "@/lib/cms-server";
import { EditorialBannerSection } from "@/components/sections/EditorialBannerSection";
import { FeaturedProductSection } from "@/components/sections/FeaturedProductSection";
import { BestSellersSection } from "@/components/sections/BestSellersSection";
import { BrandMarqueeSection } from "@/components/sections/BrandMarqueeSection";
import { FooterSection } from "@/components/sections/FooterSection";

interface HomeStorefrontProps {
  sections: LiveCmsSection[];
  brands: LiveBrand[];
  isCustomerLoggedIn?: boolean;
}

interface HeroCardBlock {
  id: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  icon?: string;
  bgImage?: string;
  enabled?: boolean;
  overlayEnabled?: boolean;
  overlayColor?: string;
  overlayType?: "full" | "left" | "right";
  overlayOpacity?: number;
}

interface CollectionCardItem {
  id: string;
  title: string;
  count: string;
  description: string;
  href: string;
  image?: string;
  onlyVisibleForCustomer?: boolean;
}

const DEFAULT_COLLECTION_ITEMS: CollectionCardItem[] = [
  {
    id: "premium-cigars",
    title: "Premium Cigars",
    count: "140",
    description: "Hand-rolled Nicaraguan, Dominican...",
    href: "/products?category=cigars",
    image: "",
  },
  {
    id: "cigarettes",
    title: "Cigarettes & Little Cigars",
    count: "45",
    description: "High-turnover retail cartons &...",
    href: "/products?category=cigarettes",
    image: "",
  },
  {
    id: "vapes",
    title: "Vapes & E-Cigs",
    count: "68",
    description: "Compliant retail displays & top-...",
    href: "/products?category=vapes",
    image: "",
  },
  {
    id: "accessories",
    title: "Accessories",
    count: "32",
    description: "Humidors, cutters, torch lighters &...",
    href: "/products?category=accessories",
    image: "",
  },
];

function getHeadingStyleClass(style: unknown): string {
  switch (style) {
    case "regular":
      return "font-normal not-italic";
    case "italic":
      return "font-normal italic";
    case "bold-italic":
      return "font-bold italic";
    default:
      return "font-bold not-italic";
  }
}

function renderHeroCardIcon(blk: HeroCardBlock) {
  const key = `${blk.id ?? ""} ${blk.title ?? ""}`.toLowerCase();
  if (key.includes("brand")) {
    return <Award className="w-5 h-5 text-[#8c6d48]" strokeWidth={1.75} />;
  }
  if (key.includes("product")) {
    return <Package className="w-5 h-5 text-[#8c6d48]" strokeWidth={1.75} />;
  }
  if (key.includes("wholesale")) {
    return <Truck className="w-5 h-5 text-[#8c6d48]" strokeWidth={1.75} />;
  }
  if (key.includes("access")) {
    return <KeyRound className="w-5 h-5 text-[#8c6d48]" strokeWidth={1.75} />;
  }
  return <Sparkles className="w-5 h-5 text-[#8c6d48]" strokeWidth={1.75} />;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    return hex;
  }
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getHeroCardOverlayStyle(
  blk: HeroCardBlock
): React.CSSProperties | null {
  if (!blk.overlayEnabled) return null;
  const color =
    typeof blk.overlayColor === "string" && blk.overlayColor.trim()
      ? blk.overlayColor.trim()
      : "#fcfbf9";
  const opacityPct = Math.min(
    100,
    Math.max(0, Number(blk.overlayOpacity ?? 80))
  );
  const rgba = hexToRgba(color, opacityPct / 100);
  const type = blk.overlayType ?? "left";

  if (type === "full") {
    return {
      backgroundColor: rgba,
    };
  }
  if (type === "right") {
    return {
      backgroundImage: `linear-gradient(to left, ${rgba} 0%, ${rgba} 48%, transparent 100%)`,
    };
  }
  return {
    backgroundImage: `linear-gradient(to right, ${rgba} 0%, ${rgba} 48%, transparent 100%)`,
  };
}

function renderSectionShell(
  content: Record<string, unknown> | undefined,
  children: React.ReactNode,
  options?: { suppressTopDivider?: boolean }
) {
  const c = content ?? {};
  const bgColor =
    typeof c.bgColor === "string" && c.bgColor.trim()
      ? c.bgColor.trim()
      : undefined;
  const bgImage =
    typeof c.bgImage === "string" && c.bgImage.trim() ? c.bgImage.trim() : "";
  const overlayEnabled = Boolean(c.overlayEnabled);
  const overlayColor =
    typeof c.overlayColor === "string" && c.overlayColor.trim()
      ? c.overlayColor.trim()
      : "#000000";
  const overlayOpacity = Math.min(
    100,
    Math.max(0, Number(c.overlayOpacity ?? 40))
  );
  const textColor =
    typeof c.textColor === "string" && c.textColor.trim()
      ? c.textColor.trim()
      : undefined;

  const showDivider = !options?.suppressTopDivider && Boolean(c.showDivider);
  const dividerWidth = Number(c.dividerWidth ?? 100);
  const dividerThickness = Number(c.dividerThickness ?? 1);

  return (
    <div
      className="relative z-10 w-full overflow-hidden bg-cover bg-center"
      style={{
        ...(bgColor ? { backgroundColor: bgColor } : {}),
        ...(bgImage ? { backgroundImage: `url('${bgImage}')` } : {}),
        ...(textColor ? { color: textColor } : {}),
      }}
    >
      {overlayEnabled && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundColor: overlayColor,
            opacity: overlayOpacity / 100,
          }}
        />
      )}

      <div className="relative z-10">
        {showDivider && (
          <div className="pt-8 px-6 md:px-10 max-w-7xl mx-auto flex justify-center">
            <div
              style={{
                width: `${dividerWidth}%`,
                height: `${dividerThickness}px`,
              }}
              className="bg-current opacity-30"
            />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function normalizeCollectionCopy(c: Record<string, unknown>) {
  const nested =
    c.collectionSection && typeof c.collectionSection === "object"
      ? (c.collectionSection as Record<string, unknown>)
      : {};

  const rawHeading = typeof c.heading === "string" ? c.heading.trim() : "";
  const isLegacyHeading =
    !rawHeading ||
    rawHeading.toLowerCase() === "a legacy of reliable wholesale distribution.";

  const rawCtaLabel = typeof c.ctaLabel === "string" ? c.ctaLabel.trim() : "";
  const isLegacyCta =
    !rawCtaLabel || rawCtaLabel.toLowerCase() === "our story";

  const rawCtaHref = typeof c.ctaHref === "string" ? c.ctaHref.trim() : "";
  const isLegacyHref = !rawCtaHref || rawCtaHref === "/company";

  const rawP1 = typeof c.paragraph1 === "string" ? c.paragraph1.trim() : "";
  const isLegacyP1 =
    !rawP1 || rawP1.startsWith("Based in Florida, Latin American Cigars Corp.");

  const rawP2 = typeof c.paragraph2 === "string" ? c.paragraph2.trim() : "";
  const isLegacyP2 =
    !rawP2 || rawP2.startsWith("From flagship hand-rolled humidors");

  const rawItems = Array.isArray(c.items)
    ? (c.items as CollectionCardItem[])
    : Array.isArray(nested.items)
    ? (nested.items as CollectionCardItem[])
    : DEFAULT_COLLECTION_ITEMS;

  return {
    heading: isLegacyHeading
      ? "Curated wholesale collections built for retail velocity."
      : rawHeading,
    headingSize: Number(c.headingSize ?? 48),
    headingStyleClass: getHeadingStyleClass(c.headingStyle),
    textColor:
      typeof c.textColor === "string" && c.textColor.trim()
        ? c.textColor.trim()
        : undefined,
    showDivider: Boolean(c.showDivider),
    dividerWidth: Math.min(100, Math.max(10, Number(c.dividerWidth ?? 100))),
    dividerThickness: Math.min(
      10,
      Math.max(1, Number(c.dividerThickness ?? 1))
    ),
    ctaLabel: isLegacyCta ? "OUR COLLECTION" : rawCtaLabel,
    ctaHref: isLegacyHref ? "/products" : rawCtaHref,
    paragraph1: isLegacyP1
      ? "Explore our core wholesale categories curated specifically for licensed tobacconists, smoke shops, and retail lounges across Florida. Every line is selected for consistent availability and strong shelf turn."
      : rawP1,
    paragraph2: isLegacyP2
      ? "From hand-rolled premium cigars and high-demand cigarette cartons to compliant vape displays and humidor accessories, stock your entire storefront through one dependable distributor."
      : rawP2,
    cardRadius: Math.min(
      32,
      Math.max(0, Number(c.cardRadius ?? nested.cardRadius ?? 16))
    ),
    cardBorder:
      c.cardBorder !== undefined
        ? Boolean(c.cardBorder)
        : nested.cardBorder !== undefined
        ? Boolean(nested.cardBorder)
        : true,
    cardBorderColor:
      typeof (c.cardBorderColor ?? nested.cardBorderColor) === "string" &&
      String(c.cardBorderColor ?? nested.cardBorderColor).trim()
        ? String(c.cardBorderColor ?? nested.cardBorderColor).trim()
        : "#e5dfd3",
    cardShadow: String(c.cardShadow ?? nested.cardShadow ?? "sm"),
    rawItems,
  };
}

function CollectionSection({
  content,
  canViewCustomerOnly,
  isInPreviewIframe,
}: {
  content?: Record<string, unknown>;
  canViewCustomerOnly: boolean;
  isInPreviewIframe: boolean;
}) {
  const cfg = normalizeCollectionCopy(content ?? {});
  const shadowClass =
    cfg.cardShadow === "none"
      ? "shadow-none"
      : cfg.cardShadow === "lg"
      ? "shadow-lg"
      : cfg.cardShadow === "md"
      ? "shadow-md"
      : "shadow-xs";

  const visibleItems = cfg.rawItems.filter(
    (item) => !item.onlyVisibleForCustomer || canViewCustomerOnly
  );

  return (
    <section className="w-full bg-transparent py-20 md:py-24 px-6 md:px-10">
      <div className="max-w-7xl mx-auto flex flex-col gap-14">
        {/* Top Intro Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-5 flex flex-col items-start">
            <h2
              style={{
                fontSize: `${cfg.headingSize}px`,
                ...(cfg.textColor ? { color: cfg.textColor } : {}),
              }}
              className={`font-serif tracking-tight leading-[1.08] ${cfg.headingStyleClass}`}
            >
              {cfg.heading}
            </h2>

            {cfg.showDivider && (
              <div className="w-full pt-4">
                <div
                  style={{
                    width: `${cfg.dividerWidth}%`,
                    height: `${cfg.dividerThickness}px`,
                    ...(cfg.textColor ? { backgroundColor: cfg.textColor } : {}),
                  }}
                  className={
                    !cfg.textColor ? "bg-current opacity-35" : "opacity-60"
                  }
                />
              </div>
            )}

            <div className="pt-6">
              <Link
                href={cfg.ctaHref}
                style={
                  cfg.textColor
                    ? { color: cfg.textColor, borderColor: cfg.textColor }
                    : undefined
                }
                className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full border border-current text-[10px] font-bold tracking-[0.18em] uppercase transition-opacity hover:opacity-75"
              >
                <span>{cfg.ctaLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-5 text-sm md:text-base leading-relaxed opacity-85">
            <p>{cfg.paragraph1}</p>
            {cfg.paragraph2 && <p>{cfg.paragraph2}</p>}
          </div>
        </div>

        {/* 4-Column Collection Cards */}
        {visibleItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {visibleItems.map((item) => (
              <Link
                key={item.id}
                href={item.href || "/products"}
                style={{
                  borderRadius: `${cfg.cardRadius}px`,
                  ...(cfg.cardBorder
                    ? { borderWidth: "1px", borderColor: cfg.cardBorderColor }
                    : { borderWidth: "0px" }),
                }}
                className={`group bg-white overflow-hidden flex flex-col justify-between ${shadowClass} hover:shadow-md transition-all text-[#1a1714]`}
              >
                <div className="relative h-56 w-full bg-linear-to-b from-[#edeae4] via-[#e3dfd6] to-[#9b968d] overflow-hidden">
                  {isInPreviewIframe && item.onlyVisibleForCustomer && (
                    <span className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1a1714]/85 text-[#F8B93C] text-[9px] font-bold uppercase tracking-wider">
                      <Lock className="w-2.5 h-2.5" />
                      Customer Only
                    </span>
                  )}
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <span className="absolute top-3 left-3 text-xs font-medium text-[#2b2621]/80">
                      {item.title}
                    </span>
                  )}
                </div>

                <div className="p-5 flex items-end justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <h3 className="font-serif font-bold text-base leading-snug text-[#1a1714]">
                      {item.title}{" "}
                      {item.count && (
                        <sup className="text-[10px] font-sans font-semibold text-[#8c6d48]">
                          {item.count}
                        </sup>
                      )}
                    </h3>
                    <p className="text-[11px] text-[#6b6256] truncate">
                      {item.description}
                    </p>
                  </div>

                  <span className="w-8 h-8 rounded-full border border-[#dcd4c5] flex items-center justify-center shrink-0 text-[#1a1714] group-hover:bg-[#1a1714] group-hover:text-white transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PartnerSection({ content }: { content?: Record<string, unknown> }) {
  const c = content ?? {};
  const eyebrow =
    typeof c.eyebrow === "string" && c.eyebrow.trim()
      ? c.eyebrow.trim()
      : "PARTNER WITH US";
  const heading =
    typeof c.heading === "string" && c.heading.trim()
      ? c.heading.trim()
      : "Ready to Elevate Your Retail Business?";
  const subtext =
    typeof c.subtext === "string" && c.subtext.trim()
      ? c.subtext.trim()
      : "Get in touch for wholesale inquiries, catalog access, or to learn more about our distribution capabilities across Florida.";
  const primaryLabel =
    typeof c.primaryLabel === "string" && c.primaryLabel.trim()
      ? c.primaryLabel.trim()
      : "CONTACT SALES";
  const primaryHref =
    typeof c.primaryHref === "string" && c.primaryHref.trim()
      ? c.primaryHref.trim()
      : "/contact";
  const secondaryLabel =
    typeof c.secondaryLabel === "string" && c.secondaryLabel.trim()
      ? c.secondaryLabel.trim()
      : "PARTNER LOGIN";
  const secondaryHref =
    typeof c.secondaryHref === "string" && c.secondaryHref.trim()
      ? c.secondaryHref.trim()
      : "/wholesale";
  const textColor =
    typeof c.textColor === "string" && c.textColor.trim()
      ? c.textColor.trim()
      : undefined;

  return (
    <section className="py-16 px-6 md:px-10">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-[#e6e0d4] shadow-sm px-6 py-12 md:px-12 text-center flex flex-col items-center gap-4">
        <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#8c6d48]">
          — {eyebrow}
        </p>
        <h2
          style={textColor ? { color: textColor } : undefined}
          className="text-3xl md:text-5xl font-serif font-bold text-[#1a1714] leading-tight"
        >
          {heading}
        </h2>
        <p className="text-xs md:text-sm text-[#6b6256] max-w-xl leading-relaxed pb-4">
          {subtext}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={primaryHref}
            className="px-6 py-3 rounded-md bg-[#8c6d48] hover:bg-[#735838] text-white text-[10px] font-bold tracking-[0.18em] uppercase transition-colors"
          >
            {primaryLabel}
          </Link>
          <Link
            href={secondaryHref}
            className="px-6 py-3 rounded-md border border-[#d6cfc2] hover:border-[#1a1714] text-[#1a1714] text-[10px] font-bold tracking-[0.18em] uppercase transition-colors"
          >
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HomeStorefront({
  sections: initialSections,
  brands,
  isCustomerLoggedIn = false,
}: HomeStorefrontProps) {
  const { partnerState } = useStorefront();
  const [sections, setSections] = useState<LiveCmsSection[]>(initialSections);
  const [selectedSectionId, setSelectedSectionId] = useState<
    number | string | null
  >(null);
  const [isInPreviewIframe, setIsInPreviewIframe] = useState(false);
  const [liveFooterDraft, setLiveFooterDraft] = useState<Record<
    string,
    unknown
  > | null>(null);

  useEffect(() => {
    setSections(initialSections);
  }, [initialSections]);

  useEffect(() => {
    setIsInPreviewIframe(Boolean(window.parent && window.parent !== window));

    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.source !== "lac-cms-preview") return;

      if (Array.isArray(data.sections)) {
        const sorted = [...data.sections].sort(
          (a: LiveCmsSection, b: LiveCmsSection) =>
            (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
        );
        setSections(sorted);
      }

      if (data.selectedSectionId !== undefined) {
        setSelectedSectionId(data.selectedSectionId);
      }

      if (data.footerDraft && typeof data.footerDraft === "object") {
        setLiveFooterDraft(data.footerDraft as Record<string, unknown>);
      }

      const targetIndex =
        typeof data.sectionIndex === "number" ? data.sectionIndex : -1;

      requestAnimationFrame(() => {
        if (data.editorFocus === "footer") {
          const footerEl = document.querySelector("[data-cms-footer]");
          footerEl?.scrollIntoView({ behavior: "smooth", block: "end" });
          return;
        }

        const byId =
          data.selectedSectionId !== null && data.selectedSectionId !== undefined
            ? document.querySelector(
                `[data-cms-section-id="${String(data.selectedSectionId)}"]`
              )
            : null;
        const byIndex =
          targetIndex >= 0
            ? document.querySelector(
                `[data-cms-section-index="${targetIndex}"]`
              )
            : null;

        const targetEl = byId || byIndex;
        if (targetEl instanceof HTMLElement) {
          targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    };

    window.addEventListener("message", onMessage);
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ source: "lac-cms-preview-ready" }, "*");
    }
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const resolvedSections = useMemo(() => sections, [sections]);

  const canViewCustomerOnly =
    isCustomerLoggedIn ||
    partnerState === "APPROVED_PARTNER" ||
    isInPreviewIframe;

  const hasHero = resolvedSections.some(
    (s) => s.type === "HERO_3D" && s.isActive
  );

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#fdfbf7] text-[#2b2621]">
      {hasHero && <HeroClouds />}

      {resolvedSections.map((section, idx) => {
        if (!section.isActive) return null;

        const contentObj = (section.content ?? {}) as Record<string, unknown>;
        const onlyVisibleForCustomer = Boolean(
          contentObj.onlyVisibleForCustomer
        );

        if (onlyVisibleForCustomer && !canViewCustomerOnly) {
          return null;
        }

        const isSelected =
          selectedSectionId !== null &&
          String(section.id) === String(selectedSectionId);

        const wrapSection = (node: React.ReactNode, isFooter = false) => (
          <div
            key={section.key ?? `${section.type}-${idx}`}
            data-cms-section-id={
              section.id !== undefined ? String(section.id) : ""
            }
            data-cms-section-index={idx}
            {...(isFooter ? { "data-cms-footer": "" } : {})}
            className={
              isSelected
                ? "outline-2 outline-offset-[-2px] outline-[#F8B93C]"
                : undefined
            }
          >
            {node}
          </div>
        );

        switch (section.type) {
          case "HERO_3D": {
            const hero = {
              ...INITIAL_HERO_CONFIG,
              ...(contentObj as Partial<typeof INITIAL_HERO_CONFIG>),
            };
            const rawBlocks: HeroCardBlock[] =
              Array.isArray(contentObj.blocks) && contentObj.blocks.length > 0
                ? (contentObj.blocks as HeroCardBlock[])
                : (INITIAL_HERO_CONFIG.blocks as unknown as HeroCardBlock[]);

            const hasCustomHeading =
              typeof contentObj.heading === "string" &&
              contentObj.heading.trim().length > 0;
            const textColor =
              typeof contentObj.textColor === "string" &&
              contentObj.textColor.trim()
                ? contentObj.textColor.trim()
                : undefined;

            return wrapSection(
              renderSectionShell(
                contentObj,
                <section
                  id="home"
                  className="relative min-h-screen w-full flex flex-col justify-center items-center px-6 md:px-8 py-20 z-10"
                >
                  <div className="relative z-10 max-w-6xl mx-auto w-full text-center pt-10 lg:pt-14">
                    <p className="text-[9px] md:text-[10px] tracking-[0.3em] uppercase text-[#8c6d48] font-bold pb-4 flex items-center justify-center gap-4">
                      <span className="w-8 h-px bg-[#8c6d48]" />
                      {hero.eyebrow}
                      <span className="w-8 h-px bg-[#8c6d48]" />
                    </p>

                    {!hasCustomHeading && (
                      <h1
                        style={textColor ? { color: textColor } : undefined}
                        className="text-4xl md:text-[64px] font-serif font-bold text-[#2b2621] tracking-tight leading-[1.05] pb-4"
                      >
                        {hero.headingLine1}
                        <br />
                        {hero.headingLine2}
                      </h1>
                    )}

                    <p
                      style={textColor ? { color: textColor } : undefined}
                      className="text-[#6b6256] text-xs md:text-sm max-w-3xl mx-auto leading-relaxed pb-8"
                    >
                      {hero.subtext}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pb-8 w-full">
                      <Link
                        href={hero.primaryCta?.href ?? "/products"}
                        className="group relative overflow-hidden w-full sm:w-65 bg-[#8c6d48] text-white px-6 py-3 text-[10px] tracking-[0.15em] font-bold transition-all duration-500 flex items-center justify-center shadow-md rounded-sm"
                      >
                        <span className="relative z-10 flex items-center gap-3">
                          {hero.primaryCta?.label ?? "EXPLORE PRODUCTS"}{" "}
                          <span className="group-hover:translate-x-1.5 transition-transform duration-300">
                            →
                          </span>
                        </span>
                        <div className="absolute inset-0 h-full w-full scale-0 rounded-sm transition-all duration-500 ease-out group-hover:scale-100 group-hover:bg-[#F8B93C] z-0" />
                      </Link>

                      <Link
                        href={hero.secondaryCta?.href ?? "/contact"}
                        className="group relative overflow-hidden w-full sm:w-65 border border-[#8c6d48] bg-transparent text-[#8c6d48] px-6 py-3 text-[10px] tracking-[0.15em] font-bold transition-colors duration-500 flex items-center justify-center hover:text-white rounded-sm"
                      >
                        <span className="relative z-10 flex items-center gap-3">
                          {hero.secondaryCta?.label ?? "WHOLESALE ACCESS"}{" "}
                          <span className="group-hover:translate-x-1.5 transition-transform duration-300">
                            →
                          </span>
                        </span>
                        <div className="absolute inset-0 h-full w-full origin-left scale-x-0 bg-[#F8B93C] border-[#F8B93C] transition-transform duration-500 ease-out group-hover:scale-x-100 z-0" />
                      </Link>
                    </div>

                    <div className="flex flex-wrap justify-center gap-8 md:gap-12 pb-8 opacity-90">
                      <div className="flex items-center gap-3 text-left">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="text-[#8c6d48]"
                        >
                          <path d="M2 7l4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
                          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                          <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
                          <path d="M2 7h20" />
                          <path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v-3a2 2 0 0 1-2-2V7" />
                        </svg>
                        <span className="text-[9px] tracking-[0.15em] font-bold leading-tight">
                          BUILT FOR
                          <br />
                          RETAILERS
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-left">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="text-[#8c6d48]"
                        >
                          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                          <path d="M15 18H9" />
                          <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                          <circle cx="17" cy="18" r="2" />
                          <circle cx="7" cy="18" r="2" />
                        </svg>
                        <span className="text-[9px] tracking-[0.15em] font-bold leading-tight">
                          RELIABLE DISTRIBUTION
                          <br />
                          ACROSS FLORIDA
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-left">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="text-[#8c6d48]"
                        >
                          <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                        <span className="text-[9px] tracking-[0.15em] font-bold leading-tight">
                          PREMIUM BRANDS
                          <br />
                          &amp; DIVERSE CATEGORIES
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-2 md:px-4">
                      {rawBlocks
                        .filter((blk) => blk.enabled !== false)
                        .map((blk) => {
                          const overlayStyle = getHeroCardOverlayStyle(blk);
                          return (
                            <div
                              key={blk.id}
                              className="bg-[#fcfbf9]/90 backdrop-blur-lg p-5 flex flex-col group hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden border border-[#e8e4db] rounded-lg text-left h-44 shadow-sm text-[#2b2621]"
                            >
                              {blk.bgImage && (
                                <div
                                  className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                                  style={{
                                    backgroundImage: `url('${blk.bgImage}')`,
                                  }}
                                />
                              )}

                              {overlayStyle && (
                                <div
                                  className="absolute inset-0 pointer-events-none"
                                  style={overlayStyle}
                                />
                              )}

                              <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="space-y-1.5">
                                  <div className="w-6 h-6 flex items-center justify-start">
                                    {renderHeroCardIcon(blk)}
                                  </div>
                                  <h3 className="text-xs font-serif font-bold text-[#2b2621] uppercase">
                                    {blk.title}
                                  </h3>
                                  <p className="text-[10px] text-[#6b6256] leading-snug pr-2 line-clamp-3">
                                    {blk.description}
                                  </p>
                                </div>
                                <Link
                                  href={blk.href}
                                  className="text-[9px] tracking-[0.2em] font-bold text-[#8c6d48] group-hover:text-[#F8B93C] transition-colors flex items-center gap-2"
                                >
                                  {blk.ctaLabel} <span>→</span>
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </section>
              )
            );
          }

          case "EDITORIAL_CATEGORIES":
          case "COLLECTION_SECTION":
            return wrapSection(
              renderSectionShell(
                contentObj,
                <CollectionSection
                  content={contentObj}
                  canViewCustomerOnly={canViewCustomerOnly}
                  isInPreviewIframe={isInPreviewIframe}
                />,
                { suppressTopDivider: true }
              )
            );

          case "EDITORIAL_BANNER":
            return wrapSection(
              renderSectionShell(contentObj, <EditorialBannerSection />)
            );

          case "FEATURED_PRODUCT":
            return wrapSection(
              renderSectionShell(
                contentObj,
                <FeaturedProductSection content={contentObj} />,
                { suppressTopDivider: true }
              )
            );

          case "BEST_SELLERS":
            return wrapSection(
              renderSectionShell(
                contentObj,
                <BestSellersSection content={contentObj} />,
                { suppressTopDivider: true }
              )
            );

          case "BRAND_MARQUEE":
            return wrapSection(
              renderSectionShell(
                contentObj,
                <BrandMarqueeSection
                  brands={brands}
                  content={
                    contentObj as {
                      eyebrow?: string;
                      heading?: string;
                      headingSize?: number;
                      headingStyle?: string;
                      textColor?: string;
                      showDivider?: boolean;
                      dividerWidth?: number;
                      dividerThickness?: number;
                      logoSize?: number;
                      ctaLabel?: string;
                      ctaHref?: string;
                    }
                  }
                />,
                { suppressTopDivider: true }
              )
            );

          case "PARTNER_SECTION":
          case "PARTNER_CTA":
            return wrapSection(
              renderSectionShell(
                contentObj,
                <PartnerSection content={contentObj} />
              )
            );

          case "FOOTER":
            return wrapSection(
              <FooterSection
                content={{
                  ...contentObj,
                  ...(liveFooterDraft ?? {}),
                }}
              />,
              true
            );

          default:
            return null;
        }
      })}
    </div>
  );
}