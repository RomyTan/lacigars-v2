"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Plus, ArrowRight } from "lucide-react";
import { EXTENDED_CATALOG } from "@/lib/storefront-data";
import { useStorefront } from "@/components/StorefrontShell";

const FILTER_TABS = [
  "All",
  "Premium Cigars",
  "Vapes & E-Cigs",
  "Accessories",
];

export function BestSellersSection() {
  const { partnerState, openDrawer, addToCart } = useStorefront();
  const [activeTab, setActiveTab] = useState("All");

  const items = EXTENDED_CATALOG.filter((item) =>
    activeTab === "All" ? true : item.category === activeTab
  ).slice(0, 4);

  return (
    <section className="relative z-10 bg-[#fdfbf7] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Header + Filter Pills */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8c6d48] mb-2">
              High-Turnover Retail Picks
            </p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1a1714]">
              Best Sellers
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {FILTER_TABS.map((tab) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
                    active
                      ? "bg-[#1a1714] text-[#fdfbf7]"
                      : "bg-white border border-[#e6e2d8] text-[#4a4238] hover:border-[#8c6d48]"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4-Column Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="group bg-white border border-[#e6e2d8] rounded-2xl overflow-hidden flex flex-col justify-between hover:border-[#8c6d48] hover:shadow-md transition-all duration-300"
            >
              <div>
                <div className="relative aspect-[4/3] bg-[#f2efe9] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {item.badge && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#1a1714] text-[#F8B93C] text-[9px] font-bold uppercase tracking-wider">
                      {item.badge}
                    </span>
                  )}

                  {/* Hover Quick Action */}
                  <div className="absolute inset-x-3 bottom-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    {partnerState === "APPROVED_PARTNER" ? (
                      <button
                        type="button"
                        onClick={() => addToCart(item, 1)}
                        className="w-full py-2.5 rounded-full bg-[#1a1714] hover:bg-[#F8B93C] text-white hover:text-[#1a1714] text-[10px] font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-1.5 shadow-lg transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add to Order
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openDrawer("account")}
                        className="w-full py-2.5 rounded-full bg-[#1a1714] hover:bg-[#F8B93C] text-white hover:text-[#1a1714] text-[10px] font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-1.5 shadow-lg transition-colors"
                      >
                        <Lock className="w-3 h-3" />
                        Login for Price
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8c6d48]">
                    {item.brand}
                  </p>
                  <div className="flex items-start justify-between gap-2 mt-1">
                    <h3 className="text-sm font-bold text-[#1a1714] leading-snug">
                      {item.name}
                    </h3>
                    {partnerState === "APPROVED_PARTNER" && (
                      <span className="text-sm font-bold text-[#1a1714] flex-shrink-0">
                        ${item.wholesalePrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6b6256] mt-1">{item.packSize}</p>
                </div>
              </div>

              <div className="px-5 py-3.5 border-t border-[#f0ece3] flex items-center justify-between text-[10px] text-[#6b6256]">
                <span>{item.specs?.origin ?? "Wholesale"}</span>
                <span>{item.specs?.vitola ?? item.sku}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full border border-[#2b2621] text-[#1a1714] hover:bg-[#1a1714] hover:text-[#fdfbf7] text-xs font-bold uppercase tracking-[0.18em] transition-colors"
          >
            View Full Wholesale Catalog
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}