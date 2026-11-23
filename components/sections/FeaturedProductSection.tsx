"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";

interface ProductSnapshot {
  id?: number;
  sku?: string;
  name?: string;
  brand?: string | null;
  boxInfo?: string | null;
  origin?: string | null;
  shape?: string | null;
  description?: string | null;
  image?: string | null;
}

interface FeaturedProductContent {
  badge?: string;
  heading?: string;
  headingSize?: number;
  headingStyle?: "regular" | "bold" | "italic" | "bold-italic" | string;
  showDivider?: boolean;
  dividerWidth?: number;
  images?: string[];
  bgColor?: string;
  bgImage?: string;
  overlayEnabled?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;
  productSnapshot?: ProductSnapshot | null;
}

export function FeaturedProductSection({
  content,
}: {
  content?: Record<string, unknown>;
}) {
  const cfg = (content ?? {}) as FeaturedProductContent;
  const prod = cfg.productSnapshot;

  const gallery =
    Array.isArray(cfg.images) && cfg.images.length > 0
      ? cfg.images.filter((u): u is string => typeof u === "string" && u.trim() !== "")
      : prod?.image
      ? [prod.image]
      : [];

  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (activeIdx >= gallery.length) {
      setActiveIdx(0);
    }
  }, [gallery.length, activeIdx]);

  const activeImage = gallery[activeIdx] ?? gallery[0] ?? null;

  const headingStyleClass =
    cfg.headingStyle === "regular"
      ? "font-normal not-italic"
      : cfg.headingStyle === "italic"
      ? "font-normal italic"
      : cfg.headingStyle === "bold-italic"
      ? "font-bold italic"
      : "font-bold not-italic";

  const bgColor = cfg.bgColor?.trim() || "#fdfbf7";
  const bgImage = cfg.bgImage?.trim() || "";
  const overlayEnabled = Boolean(cfg.overlayEnabled);
  const overlayColor = cfg.overlayColor?.trim() || "#000000";
  const overlayOpacity = Math.min(
    100,
    Math.max(0, Number(cfg.overlayOpacity ?? 40))
  );

  return (
    <section
      className="relative z-10 py-16 px-6 md:px-10 text-[#1a1714] overflow-hidden bg-cover bg-center"
      style={{
        backgroundColor: bgColor,
        ...(bgImage ? { backgroundImage: `url('${bgImage}')` } : {}),
      }}
    >
      {/* Optional Color Overlay */}
      {overlayEnabled && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundColor: overlayColor,
            opacity: overlayOpacity / 100,
          }}
        />
      )}

      <div className="relative z-10 max-w-6xl mx-auto">
        {cfg.heading && (
          <div className="mb-8 text-center">
            <h2
              style={{ fontSize: `${cfg.headingSize ?? 32}px` }}
              className={`font-serif text-[#1a1714] leading-tight ${headingStyleClass}`}
            >
              {cfg.heading}
            </h2>
            {cfg.showDivider && (
              <div className="mt-4 flex justify-center">
                <div
                  style={{ width: `${cfg.dividerWidth ?? 100}%` }}
                  className="h-px bg-[#d6cfc2]"
                />
              </div>
            )}
          </div>
        )}

        {!cfg.heading && cfg.showDivider && (
          <div className="mb-8 flex justify-center">
            <div
              style={{ width: `${cfg.dividerWidth ?? 100}%` }}
              className="h-px bg-[#d6cfc2]"
            />
          </div>
        )}

        <div
          className={`grid grid-cols-1 ${
            gallery.length > 0 ? "lg:grid-cols-12" : ""
          } gap-8 items-start`}
        >
          {/* Optional Image Gallery */}
          {gallery.length > 0 && (
            <div className="lg:col-span-6 flex gap-3">
              {gallery.length > 1 && (
                <div className="relative z-20 flex flex-col gap-2 w-16 shrink-0">
                  {gallery.map((url, idx) => (
                    <button
                      key={`${url}-${idx}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveIdx(idx);
                      }}
                      className={`cursor-pointer aspect-square rounded-lg overflow-hidden border bg-white transition-all ${
                        idx === activeIdx
                          ? "border-[#1a1714] ring-2 ring-[#1a1714]"
                          : "border-[#e5dfd3] opacity-75 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={url}
                        alt={prod?.name || `Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className="relative flex-1 aspect-square rounded-2xl overflow-hidden border border-[#e5dfd3] bg-white">
                {cfg.badge && (
                  <span className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full bg-[#1a1714] text-[#F8B93C] text-[10px] font-bold uppercase tracking-wider">
                    {cfg.badge}
                  </span>
                )}
                {activeImage && (
                  <img
                    key={activeImage}
                    src={activeImage}
                    alt={prod?.name || "Featured product"}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          )}

          {/* Product Details */}
          <div
            className={
              gallery.length > 0
                ? "lg:col-span-6 space-y-4"
                : "max-w-2xl mx-auto space-y-4"
            }
          >
            {gallery.length === 0 && cfg.badge && (
              <span className="inline-block px-3 py-1 rounded-full bg-[#1a1714] text-[#F8B93C] text-[10px] font-bold uppercase tracking-wider">
                {cfg.badge}
              </span>
            )}

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8c6d48]">
              {prod?.brand || "EL BACÁN"} · SKU {prod?.sku || "LAC-ELB-001"}
            </p>

            <h3 className="text-3xl font-sans font-bold tracking-tight text-[#1a1714]">
              {prod?.name || "El Bacán Reserve Robusto"}
            </h3>

            <p className="text-xs text-[#6b6256]">
              Selling Unit: {prod?.boxInfo || "Box of 20"}
            </p>

            <p className="text-sm text-[#4a4238] leading-relaxed">
              {prod?.description ||
                "Rich Nicaraguan long-filler blend wrapped in an oily Habano leaf. Engineered for consistent draw, clean burn, and high repeat velocity across Florida retail humidors."}
            </p>

            <Link
              href="/wholesale"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#1a1714] hover:bg-[#8c6d48] text-white text-xs font-bold tracking-wider uppercase transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              Login for Wholesale Price
            </Link>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl border border-[#e5dfd3] bg-white/95">
                <p className="text-[9px] uppercase tracking-wider text-[#8c6d48] font-bold">
                  Origin
                </p>
                <p className="text-xs font-bold text-[#1a1714] mt-0.5">
                  {prod?.origin || "Nicaragua"}
                </p>
              </div>
              <div className="p-3 rounded-xl border border-[#e5dfd3] bg-white/95">
                <p className="text-[9px] uppercase tracking-wider text-[#8c6d48] font-bold">
                  Vitola
                </p>
                <p className="text-xs font-bold text-[#1a1714] mt-0.5">
                  {prod?.shape || "Robusto 5x52"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}