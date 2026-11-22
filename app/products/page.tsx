"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Lock,
  Plus,
  SlidersHorizontal,
  Package,
  X,
} from "lucide-react";
import {
  EXTENDED_CATALOG,
  INITIAL_CATEGORIES,
  type CatalogItem,
} from "@/lib/storefront-data";
import { useStorefront } from "@/components/StorefrontShell";
import { FooterSection } from "@/components/sections/FooterSection";

type SortOption = "featured" | "name-asc" | "price-asc" | "price-desc";

function ProductsCatalogContent() {
  const searchParams = useSearchParams();
  const initialSlug = searchParams.get("category") ?? "";
  const matchedCategory =
    INITIAL_CATEGORIES.find((c) => c.slug === initialSlug)?.name ?? "All";

  const { partnerState, openDrawer, addToCart } = useStorefront();
  const [selectedCategory, setSelectedCategory] =
    useState<string>(matchedCategory);
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [quickViewItem, setQuickViewItem] = useState<CatalogItem | null>(null);

  const categories = [
    "All",
    ...Array.from(new Set(EXTENDED_CATALOG.map((p) => p.category))),
  ];
  const brands = [
    "All",
    ...Array.from(new Set(EXTENDED_CATALOG.map((p) => p.brand))),
  ];

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = EXTENDED_CATALOG.filter((item) => {
      const matchCat =
        selectedCategory === "All" || item.category === selectedCategory;
      const matchBrand =
        selectedBrand === "All" || item.brand === selectedBrand;
      const matchQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchCat && matchBrand && matchQuery;
    });

    if (sortBy === "name-asc") {
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortBy === "price-asc") {
      return [...list].sort((a, b) => a.wholesalePrice - b.wholesalePrice);
    }
    if (sortBy === "price-desc") {
      return [...list].sort((a, b) => b.wholesalePrice - a.wholesalePrice);
    }
    return list;
  }, [selectedCategory, selectedBrand, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#2b2621] pt-24">
      {/* Page Header */}
      <section className="border-b border-[#e6e2d8] bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-14 md:py-16">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#8c6d48] font-bold mb-3">
            — Wholesale Catalog
          </p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#1a1714] tracking-tight">
                {selectedCategory === "All"
                  ? "All Wholesale Products"
                  : selectedCategory}
              </h1>
              <p className="text-sm text-[#6b6256] mt-2 max-w-2xl">
                Curated cigars, cigarettes, vapes, and retail accessories stocked
                at our Florida Operations Hub.
              </p>
            </div>

            {partnerState !== "APPROVED_PARTNER" && (
              <button
                type="button"
                onClick={() => openDrawer("account")}
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#1a1714] hover:bg-[#F8B93C] text-white hover:text-[#1a1714] text-[10px] font-bold uppercase tracking-[0.18em] rounded-sm transition-colors self-start md:self-auto"
              >
                <Lock className="w-3.5 h-3.5" />
                Partner Login for Pricing
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Filter & Toolbar */}
      <section className="sticky top-[72px] z-30 bg-[#fdfbf7]/95 backdrop-blur-md border-b border-[#e6e2d8]">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                    active
                      ? "bg-[#1a1714] text-[#fdfbf7]"
                      : "bg-white border border-[#e6e2d8] text-[#4a4238] hover:border-[#8c6d48]"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search + Brand + Sort */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-[#8c6d48] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU or name..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#dcd4c5] rounded-full focus:outline-none focus:border-[#8c6d48]"
              />
            </div>

            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-[#dcd4c5] rounded-full text-[#2b2621] focus:outline-none focus:border-[#8c6d48]"
            >
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b === "All" ? "All Brands" : b}
                </option>
              ))}
            </select>

            <div className="relative flex items-center">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#8c6d48] absolute left-3 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="pl-8 pr-4 py-2 text-xs font-semibold bg-white border border-[#dcd4c5] rounded-full text-[#2b2621] focus:outline-none focus:border-[#8c6d48]"
              >
                <option value="featured">Featured</option>
                <option value="name-asc">Name: A–Z</option>
                {partnerState === "APPROVED_PARTNER" && (
                  <>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-16">
        <div className="flex items-center justify-between mb-6 text-xs text-[#6b6256]">
          <span>
            Showing <strong className="text-[#1a1714]">{filteredProducts.length}</strong>{" "}
            wholesale items
          </span>
          {(selectedCategory !== "All" ||
            selectedBrand !== "All" ||
            searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("All");
                setSelectedBrand("All");
                setSearchQuery("");
              }}
              className="text-[#8c6d48] font-bold hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-[#e6e2d8] rounded-2xl p-16 text-center">
            <Package className="w-8 h-8 text-[#8c6d48] mx-auto mb-3" />
            <h3 className="text-lg font-serif font-bold text-[#1a1714]">
              No matching products found
            </h3>
            <p className="text-xs text-[#6b6256] mt-1">
              Try adjusting your category, brand, or search keyword.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((item) => (
              <div
                key={item.id}
                className="group bg-white border border-[#e6e2d8] rounded-2xl overflow-hidden flex flex-col justify-between hover:border-[#8c6d48] hover:shadow-md transition-all duration-300"
              >
                <div>
                  <div
                    onClick={() => setQuickViewItem(item)}
                    className="relative aspect-[4/3] bg-[#f2efe9] overflow-hidden cursor-pointer"
                  >
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
                  </div>

                  <div className="p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8c6d48]">
                      {item.brand} · {item.sku}
                    </p>
                    <div className="flex items-start justify-between gap-2 mt-1">
                      <h3
                        onClick={() => setQuickViewItem(item)}
                        className="text-sm font-bold text-[#1a1714] leading-snug cursor-pointer hover:text-[#8c6d48] transition-colors"
                      >
                        {item.name}
                      </h3>
                      {partnerState === "APPROVED_PARTNER" && (
                        <span className="text-sm font-bold text-[#1a1714] flex-shrink-0">
                          ${item.wholesalePrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6b6256] mt-1">
                      {item.packSize}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-2">
                  {partnerState === "APPROVED_PARTNER" ? (
                    <button
                      type="button"
                      onClick={() => addToCart(item, 1)}
                      className="w-full py-2.5 rounded-full bg-[#1a1714] hover:bg-[#8c6d48] text-white text-[10px] font-bold uppercase tracking-[0.16em] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add to Order
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openDrawer("account")}
                      className="w-full py-2.5 rounded-full border border-[#dcd4c5] hover:border-[#1a1714] hover:bg-[#1a1714] hover:text-white text-[#2b2621] text-[10px] font-bold uppercase tracking-[0.16em] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Lock className="w-3 h-3" />
                      Login for Price
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick View Modal */}
      {quickViewItem && (
        <div
          onClick={() => setQuickViewItem(null)}
          className="fixed inset-0 bg-[#1a1714]/60 backdrop-blur-xs z-[130] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#fdfbf7] border border-[#e6e2d8] rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl grid grid-cols-1 sm:grid-cols-2"
          >
            <div className="relative h-64 sm:h-auto bg-[#f2efe9]">
              <img
                src={quickViewItem.image}
                alt={quickViewItem.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-6 flex flex-col justify-between gap-5">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8c6d48]">
                    {quickViewItem.brand} · {quickViewItem.sku}
                  </p>
                  <button
                    type="button"
                    onClick={() => setQuickViewItem(null)}
                    className="text-[#6b6256] hover:text-[#1a1714]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-xl font-serif font-bold text-[#1a1714] mt-1">
                  {quickViewItem.name}
                </h3>
                <p className="text-xs text-[#6b6256] mt-1">
                  {quickViewItem.packSize} · {quickViewItem.category}
                </p>

                {quickViewItem.specs && (
                  <div className="grid grid-cols-2 gap-2 mt-4 text-[11px]">
                    <div className="p-2.5 bg-white border border-[#eae5db] rounded-lg">
                      <span className="text-[#8c6d48] font-bold block text-[9px] uppercase">
                        Origin
                      </span>
                      {quickViewItem.specs.origin}
                    </div>
                    <div className="p-2.5 bg-white border border-[#eae5db] rounded-lg">
                      <span className="text-[#8c6d48] font-bold block text-[9px] uppercase">
                        Vitola
                      </span>
                      {quickViewItem.specs.vitola}
                    </div>
                  </div>
                )}
              </div>

              {partnerState === "APPROVED_PARTNER" ? (
                <button
                  type="button"
                  onClick={() => {
                    addToCart(quickViewItem, 1);
                    setQuickViewItem(null);
                  }}
                  className="w-full py-3 rounded-full bg-[#1a1714] hover:bg-[#8c6d48] text-white text-[10px] font-bold uppercase tracking-[0.18em] transition-colors"
                >
                  Add to Order — ${quickViewItem.wholesalePrice.toFixed(2)}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setQuickViewItem(null);
                    openDrawer("account");
                  }}
                  className="w-full py-3 rounded-full bg-[#1a1714] hover:bg-[#F8B93C] text-white hover:text-[#1a1714] text-[10px] font-bold uppercase tracking-[0.18em] flex items-center justify-center gap-2 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Login for Wholesale Price
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <FooterSection />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fdfbf7] pt-32 text-center text-xs text-[#6b6256]">
          Loading wholesale catalog...
        </div>
      }
    >
      <ProductsCatalogContent />
    </Suspense>
  );
}