"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { INITIAL_BRANDS } from "@/lib/storefront-data";

interface BrandMarqueeProps {
  brands?: { name: string; logoUrl: string }[];
  content?: {
    eyebrow?: string;
    heading?: string;
    ctaLabel?: string;
    ctaHref?: string;
  };
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
  const heading = content?.heading ?? "30+ Trusted Tobacco Brands.";
  const ctaLabel = content?.ctaLabel ?? "Explore All 30+ Brands";
  const ctaHref = content?.ctaHref ?? "/brands";

  return (
    <section className="relative z-10 bg-white py-24 md:py-32 overflow-hidden border-y border-[#e6e2d8]">
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

      <div className="max-w-7xl mx-auto px-6 md:px-8 text-center mb-16">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#8c6d48] font-bold mb-3">
          {eyebrow}
        </p>
        <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#1a1714]">
          {heading}
        </h2>
      </div>

      {/* Tilted Dual-Band Marquee */}
      <div className="relative py-12 lac-marquee-wrap">
        {/* Band 2 (Behind): Subtle Light Gray Tilted Down-Right */}
        <div className="rotate-[2deg] scale-105 bg-[#f4f2ee] py-5 border-y border-[#e6e2d8] overflow-hidden">
          <div className="lac-track-right items-center gap-16 pr-16">
            {[...secondHalf, ...secondHalf].map((brand, idx) => (
              <div
                key={`b2-${idx}`}
                className="flex items-center gap-3 flex-shrink-0 opacity-45 grayscale"
              >
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="h-9 w-auto max-w-[110px] object-contain mix-blend-multiply"
                />
                <span className="text-sm font-serif font-bold tracking-wide text-[#2b2621] whitespace-nowrap">
                  {brand.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Band 1 (Front): Gold #F8B93C Tilted Up-Right */}
        <div className="-rotate-[2deg] -mt-12 scale-105 bg-[#F8B93C] py-5 shadow-md overflow-hidden relative z-10">
          <div className="lac-track-left items-center gap-16 pr-16">
            {[...firstHalf, ...firstHalf].map((brand, idx) => (
              <div
                key={`b1-${idx}`}
                className="flex items-center gap-3 flex-shrink-0"
              >
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="h-9 w-auto max-w-[110px] object-contain mix-blend-multiply"
                />
                <span className="text-sm font-serif font-bold tracking-wide text-[#1a1714] whitespace-nowrap">
                  {brand.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-16 text-center">
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