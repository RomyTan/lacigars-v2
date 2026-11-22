"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import type { LiveBrand } from "@/lib/cms-server";
import { FooterSection } from "@/components/sections/FooterSection";

interface BrandsGridClientProps {
  brands: LiveBrand[];
}

export function BrandsGridClient({ brands }: BrandsGridClientProps) {
  const [query, setQuery] = useState("");

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#2b2621] pt-24">
      {/* Header */}
      <section className="border-b border-[#e6e2d8] bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-14 md:py-20">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#8c6d48] font-bold mb-3">
            — Curated Portfolio
          </p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#1a1714] tracking-tight">
                {brands.length}+ Trusted Tobacco Brands.
              </h1>
              <p className="text-sm text-[#6b6256] mt-3 max-w-2xl leading-relaxed">
                We partner directly with heritage cigar makers and high-demand
                manufacturers to keep Florida retailers consistently stocked.
              </p>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-[#8c6d48] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter brands..."
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-full focus:outline-none focus:border-[#8c6d48]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Brands Grid */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-14 md:py-20">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {filteredBrands.map((brand) => (
            <Link
              key={brand.id}
              href="/products"
              className="group bg-white border border-[#e6e2d8] hover:border-[#8c6d48] rounded-2xl p-6 flex flex-col items-center justify-between text-center gap-4 hover:shadow-md transition-all duration-300"
            >
              <div className="h-20 w-full flex items-center justify-center">
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="max-h-16 max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="w-full pt-3 border-t border-[#f2efe9] flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#1a1714] truncate">
                  {brand.name}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8c6d48] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>

        {filteredBrands.length === 0 && (
          <div className="text-center py-16 text-sm text-[#6b6256]">
            No brands match &ldquo;{query}&rdquo;.
          </div>
        )}
      </section>

      <FooterSection />
    </div>
  );
}