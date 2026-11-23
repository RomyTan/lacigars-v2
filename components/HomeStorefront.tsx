"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { HeroClouds } from "@/components/HeroClouds";
import { INITIAL_HERO_CONFIG } from "@/lib/storefront-data";
import type { LiveBrand, LiveCmsSection } from "@/lib/cms-server";
import { EditorialCategoriesSection } from "@/components/sections/EditorialCategoriesSection";
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

function renderSectionShell(
  content: Record<string, unknown> | undefined,
  children: React.ReactNode
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

  const showDivider = Boolean(c.showDivider);
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

export function HomeStorefront({
  sections: initialSections,
  brands,
  isCustomerLoggedIn = false,
}: HomeStorefrontProps) {
  const [sections, setSections] = useState<LiveCmsSection[]>(initialSections);
  const [selectedSectionId, setSelectedSectionId] = useState<
    number | string | null
  >(null);
  const [isInPreviewIframe, setIsInPreviewIframe] = useState(false);

  useEffect(() => {
    setSections(initialSections);
  }, [initialSections]);

  useEffect(() => {
    setIsInPreviewIframe(window.parent && window.parent !== window);

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

  const canViewCustomerOnly = isCustomerLoggedIn || isInPreviewIframe;
  const hasHero = sections.some((s) => s.type === "HERO_3D" && s.isActive);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#fdfbf7] text-[#2b2621]">
      {hasHero && <HeroClouds />}

      {sections.map((section, idx) => {
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
            const blocks = Array.isArray(hero.blocks)
              ? hero.blocks
              : INITIAL_HERO_CONFIG.blocks;

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
                section.content,
                <section
                  id="home"
                  className="relative min-h-screen w-full flex flex-col justify-center items-center px-6 md:px-8 py-20 z-10"
                >
                  <div className="relative z-10 max-w-6xl mx-auto w-full text-center mt-6 lg:mt-10">
                    <p className="text-[9px] md:text-[10px] tracking-[0.3em] uppercase text-[#8c6d48] font-bold mb-4 flex items-center justify-center gap-4">
                      <span className="w-8 h-px bg-[#8c6d48]" />
                      {hero.eyebrow}
                      <span className="w-8 h-px bg-[#8c6d48]" />
                    </p>

                    {!hasCustomHeading && (
                      <h1
                        style={textColor ? { color: textColor } : undefined}
                        className="text-4xl md:text-[64px] font-serif font-bold text-[#2b2621] tracking-tight leading-[1.05] mb-4"
                      >
                        {hero.headingLine1}
                        <br />
                        {hero.headingLine2}
                      </h1>
                    )}

                    <p
                      style={textColor ? { color: textColor } : undefined}
                      className="text-[#6b6256] text-xs md:text-sm max-w-3xl mx-auto leading-relaxed mb-8"
                    >
                      {hero.subtext}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 w-full">
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

                    <div className="flex flex-wrap justify-center gap-8 md:gap-12 mb-8 opacity-90">
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
                      {blocks
                        .filter((blk) => blk.enabled)
                        .map((blk) => (
                          <div
                            key={blk.id}
                            className="bg-[#fcfbf9]/90 backdrop-blur-lg p-5 flex flex-col group hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden border border-[#e8e4db] rounded-lg text-left h-42.5 shadow-sm text-[#2b2621]"
                          >
                            <div
                              className="absolute right-0 top-0 bottom-0 w-2/3 opacity-30 group-hover:opacity-40 group-hover:scale-105 transition-transform duration-500 bg-cover bg-center"
                              style={{
                                backgroundImage: `url('${blk.bgImage}')`,
                              }}
                            />
                            <div className="absolute inset-0 bg-linear-to-r from-[#fcfbf9] via-[#fcfbf9]/90 to-transparent" />
                            <div className="relative z-10 flex flex-col h-full justify-between">
                              <div>
                                <div className="w-5 h-5 mb-2">
                                  <img
                                    src={blk.icon}
                                    alt={blk.title}
                                    className="w-full h-full object-contain opacity-80"
                                  />
                                </div>
                                <h3 className="text-xs font-serif font-bold text-[#2b2621] mb-1 uppercase">
                                  {blk.title}
                                </h3>
                                <p className="text-[10px] text-[#6b6256] leading-snug pr-4 line-clamp-2">
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
                        ))}
                    </div>
                  </div>
                </section>
              )
            );
          }

          case "EDITORIAL_CATEGORIES":
            return wrapSection(
              renderSectionShell(
                section.content,
                <EditorialCategoriesSection />
              )
            );

          case "EDITORIAL_BANNER":
            return wrapSection(
              renderSectionShell(
                section.content,
                <EditorialBannerSection />
              )
            );

          case "FEATURED_PRODUCT":
            return wrapSection(
              renderSectionShell(
                section.content,
                <FeaturedProductSection content={section.content} />
              )
            );

          case "BEST_SELLERS":
            return wrapSection(
              renderSectionShell(
                section.content,
                <BestSellersSection content={section.content} />
              )
            );

          case "BRAND_MARQUEE":
            return wrapSection(
              renderSectionShell(
                section.content,
                <BrandMarqueeSection
                  brands={brands}
                  content={
                    section.content as {
                      eyebrow?: string;
                      heading?: string;
                      ctaLabel?: string;
                      ctaHref?: string;
                    }
                  }
                />
              )
            );

          case "FOOTER":
            return wrapSection(<FooterSection />, true);

          default:
            return null;
        }
      })}
    </div>
  );
}