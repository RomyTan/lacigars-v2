"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { INITIAL_BRANDS } from "@/lib/storefront-data";

interface BrandMarqueeProps {
  brands?: { name: string; logoUrl: string }[];
  content?: {
    eyebrow?: string;
    heading?: string;
    headingSize?: number;
    headingStyle?: string;
    textColor?: string;
    showDivider?: boolean;
    dividerWidth?: number;
    dividerThickness?: number;
    logoSize?: number;
    frontOffsetY?: number;
    backOffsetY?: number;
    ctaLabel?: string;
    ctaHref?: string;
  };
}

function getHeadingStyleClass(style?: string): string {
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

export function BrandMarqueeSection({ brands, content }: BrandMarqueeProps) {
  const list =
    brands && brands.length > 0
      ? brands
      : INITIAL_BRANDS.map((b) => ({
          name: b.name,
          logoUrl: `/brands/${b.img}`,
        }));

  const mid = Math.ceil(list.length / 2);
  const firstHalf = list.slice(0, mid);
  const secondHalf = list.slice(mid).length > 0 ? list.slice(mid) : firstHalf;

  const eyebrow = content?.eyebrow ?? "— Curated Wholesale Portfolio";
  const heading = content?.heading?.trim() || "30+ Trusted Tobacco Brands.";
  const headingSize =
    typeof content?.headingSize === "number" && content.headingSize > 0
      ? content.headingSize
      : undefined;
  const headingStyleClass = getHeadingStyleClass(content?.headingStyle);
  const textColor =
    typeof content?.textColor === "string" && content.textColor.trim()
      ? content.textColor.trim()
      : undefined;

  const showDivider = Boolean(content?.showDivider);
  const dividerWidth = Math.min(
    100,
    Math.max(10, Number(content?.dividerWidth ?? 100))
  );
  const dividerThickness = Math.min(
    10,
    Math.max(1, Number(content?.dividerThickness ?? 1))
  );

  const ctaLabel = content?.ctaLabel ?? "Explore All 30+ Brands";
  const ctaHref = content?.ctaHref ?? "/brands";

  // Skala proporsional berbasis logoSize (default 36px)
  const logoSize = Math.min(96, Math.max(24, Number(content?.logoSize ?? 36)));
  const scale = logoSize / 36;
  const logoMaxWidth = Math.round(logoSize * 3.1);
  const nameFontSize = Math.max(12, Math.round(14 * scale));
  const bandPaddingY = Math.round(20 * scale);
  const itemInnerGap = Math.round(12 * scale);
  const trackGap = Math.round(64 * scale);
  const wrapPaddingY = Math.round(48 * scale);
  const backBandOffsetY = Math.round(16 * scale);
  const frontOffsetY = Number(content?.frontOffsetY ?? 0);
  const backOffsetY = Number(content?.backOffsetY ?? 0);

  return (
    <section className="relative z-10 bg-transparent py-24 md:py-32 overflow-hidden border-y border-[#e6e2d8] flex flex-col gap-16">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes lac-marquee-left {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            @keyframes lac-marquee-right {
              0% { transform: translateX(-50%); }
              100% { transform: translateX(0); }
            }
            .lac-track-left {
              display: flex;
              flex-direction: row;
              flex-wrap: nowrap;
              width: max-content;
              animation: lac-marquee-left 45s linear infinite;
            }
            .lac-track-right {
              display: flex;
              flex-direction: row;
              flex-wrap: nowrap;
              width: max-content;
              animation: lac-marquee-right 45s linear infinite;
            }
            .lac-marquee-wrap:hover .lac-track-left,
            .lac-marquee-wrap:hover .lac-track-right {
              animation-play-state: paused;
            }
          `,
        }}
      />

      <div className="max-w-7xl mx-auto px-6 md:px-8 text-center flex flex-col items-center gap-3 w-full">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#8c6d48] font-bold">
          {eyebrow}
        </p>
        <h2
          style={{
            ...(headingSize ? { fontSize: `${headingSize}px` } : {}),
            ...(textColor ? { color: textColor } : {}),
          }}
          className={`text-3xl md:text-5xl font-serif leading-tight text-[#1a1714] ${headingStyleClass}`}
        >
          {heading}
        </h2>
        {showDivider && (
          <div className="w-full pt-2 flex justify-center">
            <div
              style={{
                width: `${dividerWidth}%`,
                height: `${dividerThickness}px`,
                ...(textColor ? { backgroundColor: textColor } : {}),
              }}
              className={!textColor ? "bg-current opacity-35" : "opacity-60"}
            />
          </div>
        )}
      </div>

      {/* Tilted Dual-Band Marquee */}
      <div
        className="relative lac-marquee-wrap"
        style={{
          paddingTop: `${wrapPaddingY}px`,
          paddingBottom: `${wrapPaddingY}px`,
        }}
      >
        {/* Band 2 (Behind): Subtle Light Gray Tilted Down-Right */}
        <div
          className="absolute inset-x-0 top-1/2 bg-[#f4f2ee] border-y border-[#e6e2d8] overflow-hidden"
          style={{
            paddingTop: `${bandPaddingY}px`,
            paddingBottom: `${bandPaddingY}px`,
            transform: `translateY(calc(-50% + ${backOffsetY - backBandOffsetY}px)) rotate(2deg) scale(1.05)`,
          }}
        >
          <div
            className="lac-track-right items-center"
            style={{
              gap: `${trackGap}px`,
              paddingRight: `${trackGap}px`,
            }}
          >
            {[...secondHalf, ...secondHalf].map((brand, idx) => (
              <div
                key={`b2-${idx}`}
                className="flex items-center shrink-0 opacity-45 grayscale"
                style={{ gap: `${itemInnerGap}px` }}
              >
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  style={{
                    height: `${logoSize}px`,
                    maxWidth: `${logoMaxWidth}px`,
                  }}
                  className="w-auto object-contain mix-blend-multiply"
                />
                <span
                  style={{ fontSize: `${nameFontSize}px` }}
                  className="font-serif font-bold tracking-wide text-[#2b2621] whitespace-nowrap"
                >
                  {brand.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Band 1 (Front): Gold #F8B93C Tilted Up-Right */}
        <div
          className="relative z-10 bg-[#F8B93C] shadow-md overflow-hidden"
          style={{
            paddingTop: `${bandPaddingY}px`,
            paddingBottom: `${bandPaddingY}px`,
            transform: `translateY(${frontOffsetY}px) rotate(-2deg) scale(1.05)`,
          }}
        >
          <div
            className="lac-track-left items-center"
            style={{
              gap: `${trackGap}px`,
              paddingRight: `${trackGap}px`,
            }}
          >
            {[...firstHalf, ...firstHalf].map((brand, idx) => (
              <div
                key={`b1-${idx}`}
                className="flex items-center shrink-0"
                style={{ gap: `${itemInnerGap}px` }}
              >
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  style={{
                    height: `${logoSize}px`,
                    maxWidth: `${logoMaxWidth}px`,
                  }}
                  className="w-auto object-contain mix-blend-multiply"
                />
                <span
                  style={{ fontSize: `${nameFontSize}px` }}
                  className="font-serif font-bold tracking-wide text-[#1a1714] whitespace-nowrap"
                >
                  {brand.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#1a1714] hover:bg-[#8c6d48] text-[#fdfbf7] text-xs font-bold uppercase tracking-[0.18em] transition-colors"
        >
          {ctaLabel}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}