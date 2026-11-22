"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  INITIAL_CATEGORIES,
  INITIAL_SECTIONS_CONFIG,
} from "@/lib/storefront-data";

export function EditorialCategoriesSection() {
  const intro = INITIAL_SECTIONS_CONFIG.editorialIntro;
  if (!intro.enabled) return null;

  return (
    <section className="relative z-10 bg-[#fdfbf7] border-t border-[#e6e2d8] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* 2-Column Editorial Intro */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start mb-16 md:mb-20">
          <div className="lg:col-span-5">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#1a1714] leading-[1.1] tracking-tight mb-6">
              {intro.heading}
            </h2>
            <Link
              href={intro.ctaHref}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full border border-[#2b2621] text-[#1a1714] hover:bg-[#1a1714] hover:text-[#fdfbf7] text-xs font-bold tracking-wider uppercase transition-colors"
            >
              {intro.ctaLabel}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="lg:col-span-7 space-y-5 text-sm md:text-base text-[#574f45] leading-relaxed">
            <p>{intro.paragraph1}</p>
            <p>{intro.paragraph2}</p>
          </div>
        </div>

        {/* Horizontal Category Cards */}
        <div className="flex lg:grid lg:grid-cols-4 gap-5 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6 lg:mx-0 lg:px-0">
          {INITIAL_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group min-w-[270px] sm:min-w-[300px] lg:min-w-0 bg-white border border-[#e6e2d8] rounded-2xl overflow-hidden flex flex-col justify-between hover:border-[#8c6d48] hover:shadow-md transition-all duration-300"
            >
              <div className="relative h-56 w-full overflow-hidden bg-[#f2efe9]">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1714]/40 via-transparent to-transparent" />
              </div>

              <div className="p-5 flex items-end justify-between gap-3">
                <div>
                  <h3 className="text-lg font-serif font-bold text-[#1a1714] group-hover:text-[#8c6d48] transition-colors">
                    {cat.name}
                    <sup className="ml-1 text-[10px] font-sans font-semibold text-[#8c6d48]">
                      {cat.count}
                    </sup>
                  </h3>
                  <p className="text-xs text-[#6b6256] mt-1 line-clamp-1">
                    {cat.subtitle}
                  </p>
                </div>
                <span className="w-8 h-8 rounded-full border border-[#e6e2d8] group-hover:bg-[#F8B93C] group-hover:border-[#F8B93C] text-[#1a1714] flex items-center justify-center flex-shrink-0 transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}