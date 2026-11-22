"use client";

import { useState } from "react";
import { Lock, Minus, Plus, Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { EXTENDED_CATALOG } from "@/lib/storefront-data";
import { useStorefront } from "@/components/StorefrontShell";

export function FeaturedProductSection() {
  const { partnerState, openDrawer, addToCart } = useStorefront();
  const product =
    EXTENDED_CATALOG.find((p) => p.isFeatured) ?? EXTENDED_CATALOG[0];
  const images =
    product.gallery && product.gallery.length > 0
      ? product.gallery
      : [product.image];

  const [selectedImage, setSelectedImage] = useState(images[0]);
  const [qty, setQty] = useState(1);

  return (
    <section className="relative z-10 bg-white py-20 md:py-28 border-b border-[#e6e2d8]">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left: Vertical Thumbnails + Stage */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
            <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-visible">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                    selectedImage === img
                      ? "border-[#1a1714]"
                      : "border-[#e6e2d8] opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} view ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            <div className="relative flex-1 aspect-[4/3] sm:aspect-square bg-[#fdfbf7] border border-[#e6e2d8] rounded-2xl overflow-hidden">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-[#1a1714] text-[#F8B93C] text-[10px] font-bold uppercase tracking-[0.2em]">
                Featured Wholesale Pick
              </span>
            </div>
          </div>

          {/* Right: Details & B2B Action */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8c6d48] mb-2">
                {product.brand} · SKU {product.sku}
              </p>
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1a1714] leading-tight">
                  {product.name}
                </h2>
                {partnerState === "APPROVED_PARTNER" && (
                  <span className="text-2xl font-bold text-[#1a1714] flex-shrink-0">
                    ${product.wholesalePrice.toFixed(2)}
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-[#6b6256] mt-2">
                Selling Unit: {product.packSize}
              </p>
            </div>

            <p className="text-sm text-[#574f45] leading-relaxed">
              {product.description}
            </p>

            {/* B2B Gatekeeping Action Box */}
            <div className="pt-2 space-y-3">
              {partnerState === "APPROVED_PARTNER" ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-[#dcd4c5] rounded-full px-2 py-1.5 bg-[#fdfbf7]">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="p-1.5 text-[#2b2621] hover:text-[#8c6d48]"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-[#1a1714]">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => q + 1)}
                      className="p-1.5 text-[#2b2621] hover:text-[#8c6d48]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => addToCart(product, qty)}
                    className="flex-1 py-3.5 px-6 rounded-full bg-[#1a1714] hover:bg-[#8c6d48] text-white text-xs font-bold uppercase tracking-[0.18em] transition-colors"
                  >
                    Add to Order — ${(product.wholesalePrice * qty).toFixed(2)}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openDrawer("account")}
                  className="w-full py-3.5 px-6 rounded-full bg-[#1a1714] hover:bg-[#F8B93C] text-white hover:text-[#1a1714] text-xs font-bold uppercase tracking-[0.18em] flex items-center justify-center gap-2.5 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Login for Wholesale Price
                </button>
              )}

              <div className="flex items-center gap-2 text-xs text-[#6b6256] pt-1">
                <Check className="w-4 h-4 text-[#8c6d48]" />
                <span>In stock at Florida Operations Hub — ships in 24-48h</span>
              </div>
            </div>

            {/* Product Highlights Grid */}
            {product.specs && (
              <div className="pt-6 border-t border-[#e6e2d8]">
                <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#1a1714] mb-4">
                  Product Highlights
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#fdfbf7] border border-[#eae5db]">
                    <p className="text-[10px] uppercase tracking-wider text-[#8c6d48] font-bold">
                      Origin
                    </p>
                    <p className="text-xs font-bold text-[#1a1714] mt-0.5">
                      {product.specs.origin}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#fdfbf7] border border-[#eae5db]">
                    <p className="text-[10px] uppercase tracking-wider text-[#8c6d48] font-bold">
                      Wrapper
                    </p>
                    <p className="text-xs font-bold text-[#1a1714] mt-0.5">
                      {product.specs.wrapper}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#fdfbf7] border border-[#eae5db]">
                    <p className="text-[10px] uppercase tracking-wider text-[#8c6d48] font-bold">
                      Vitola
                    </p>
                    <p className="text-xs font-bold text-[#1a1714] mt-0.5">
                      {product.specs.vitola}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#fdfbf7] border border-[#eae5db]">
                    <p className="text-[10px] uppercase tracking-wider text-[#8c6d48] font-bold">
                      Strength
                    </p>
                    <p className="text-xs font-bold text-[#1a1714] mt-0.5">
                      {product.specs.strength}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#1a1714] hover:text-[#8c6d48] transition-colors"
              >
                View full catalog specifications
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}