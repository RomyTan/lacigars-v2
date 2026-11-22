"use client";

import Link from "next/link";
import { HeroClouds } from "@/components/HeroClouds";
import { INITIAL_HERO_CONFIG } from "@/lib/storefront-data";
import { EditorialCategoriesSection } from "@/components/sections/EditorialCategoriesSection";
import { EditorialBannerSection } from "@/components/sections/EditorialBannerSection";
import { FeaturedProductSection } from "@/components/sections/FeaturedProductSection";
import { BestSellersSection } from "@/components/sections/BestSellersSection";
import { BrandMarqueeSection } from "@/components/sections/BrandMarqueeSection";
import { FooterSection } from "@/components/sections/FooterSection";

export default function HomePage() {
  const hero = INITIAL_HERO_CONFIG;

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#fdfbf7] text-[#2b2621]">
      <HeroClouds />

      <section
        id="home"
        className="relative min-h-screen w-full flex flex-col justify-center items-center px-6 md:px-8 py-24 z-10 overflow-hidden"
      >
        <div className="relative z-10 max-w-6xl mx-auto w-full text-center mt-10 lg:mt-16">
          <p className="text-[9px] md:text-[10px] tracking-[0.3em] uppercase text-[#8c6d48] font-bold mb-4 flex items-center justify-center gap-4">
            <span className="w-8 h-px bg-[#8c6d48]" />
            {hero.eyebrow}
            <span className="w-8 h-px bg-[#8c6d48]" />
          </p>

          <h1 className="text-4xl md:text-[64px] font-serif font-bold text-[#2b2621] tracking-tight leading-[1.05] mb-4">
            {hero.headingLine1}
            <br />
            {hero.headingLine2}
          </h1>

          <p className="text-[#6b6256] text-xs md:text-sm max-w-3xl mx-auto leading-relaxed mb-8">
            {hero.subtext}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 w-full">
            <Link
              href={hero.primaryCta.href}
              className="group relative overflow-hidden w-full sm:w-65 bg-[#8c6d48] text-white px-6 py-3 text-[10px] tracking-[0.15em] font-bold transition-all duration-500 flex items-center justify-center shadow-md rounded-sm"
            >
              <span className="relative z-10 flex items-center gap-3">
                {hero.primaryCta.label}{" "}
                <span className="group-hover:translate-x-1.5 transition-transform duration-300">
                  →
                </span>
              </span>
              <div className="absolute inset-0 h-full w-full scale-0 rounded-sm transition-all duration-500 ease-out group-hover:scale-100 group-hover:bg-[#F8B93C] z-0" />
            </Link>

            <Link
              href={hero.secondaryCta.href}
              className="group relative overflow-hidden w-full sm:w-65 border border-[#8c6d48] bg-transparent text-[#8c6d48] px-6 py-3 text-[10px] tracking-[0.15em] font-bold transition-colors duration-500 flex items-center justify-center hover:text-white rounded-sm"
            >
              <span className="relative z-10 flex items-center gap-3">
                {hero.secondaryCta.label}{" "}
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
              <span className="text-[9px] tracking-[0.15em] font-bold text-[#3d332a] leading-tight">
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
              <span className="text-[9px] tracking-[0.15em] font-bold text-[#3d332a] leading-tight">
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
              <span className="text-[9px] tracking-[0.15em] font-bold text-[#3d332a] leading-tight">
                PREMIUM BRANDS
                <br />
                &amp; DIVERSE CATEGORIES
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-2 md:px-4">
            {hero.blocks
              .filter((blk) => blk.enabled)
              .map((blk) => (
                <div
                  key={blk.id}
                  className="bg-[#fcfbf9]/85 backdrop-blur-lg p-5 flex flex-col group hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden border border-[#e8e4db] rounded-lg text-left h-42.5 shadow-sm"
                >
                  <div
                    className="absolute right-0 top-0 bottom-0 w-2/3 opacity-30 group-hover:opacity-40 group-hover:scale-105 transition-transform duration-500 bg-cover bg-center"
                    style={{ backgroundImage: `url('${blk.bgImage}')` }}
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

      <EditorialCategoriesSection />
      <EditorialBannerSection />
      <FeaturedProductSection />
      <BestSellersSection />
      <BrandMarqueeSection />
      <FooterSection />
    </div>
  );
}