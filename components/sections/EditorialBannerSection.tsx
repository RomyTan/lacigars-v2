"use client";

import Link from "next/link";

export function EditorialBannerSection() {
  return (
    <section className="relative min-h-[85vh] w-full flex items-center bg-[#fdfbf7] z-10 overflow-hidden py-20">
      {/* Background & Soft Off-White Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('/company-01.jpg')` }}
        />
        <div className="absolute inset-0 bg-[#fdfbf7]/85 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 w-full flex flex-col md:flex-row items-center gap-12 lg:gap-16">
        {/* Left: Copy */}
        <div className="w-full md:w-1/2">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#8c6d48] font-bold mb-4">
            — Our Company
          </p>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#2b2621] leading-tight mb-6">
            A Legacy of Reliable Distribution.
          </h2>
          <p className="text-[#6b6256] text-sm leading-relaxed mb-10 max-w-lg font-medium">
            Based in Florida, Latin American Cigars Corp. has established itself
            as a premier wholesale partner for retailers. We bridge the gap
            between world-class tobacco manufacturers and the retail market,
            offering a streamlined supply chain, competitive terms, and
            uncompromised service quality.
          </p>
          <div>
            <Link
              href="/company"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#8c6d48] text-white text-[10px] tracking-[0.2em] font-bold hover:bg-[#F8B93C] hover:text-[#1a1714] transition-colors rounded-sm shadow-md uppercase"
            >
              Discover Our Story <span>→</span>
            </Link>
          </div>
        </div>

        {/* Right: Florida Operations Hub Photo */}
        <div className="w-full md:w-1/2 h-[420px] md:h-[520px] relative rounded-xl overflow-hidden shadow-2xl group border border-[#e6e2d8]">
          <div
            className="absolute inset-0 bg-[#eae5db] bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url('/company-02.jpg')` }}
          />
          <div className="absolute inset-0 bg-black/10 pointer-events-none transition-opacity duration-700 group-hover:bg-black/0" />
          <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-md px-4 py-2 rounded-sm text-[9px] tracking-widest uppercase font-bold text-[#8c6d48] shadow-lg">
            Florida Operations Hub
          </div>
        </div>
      </div>
    </section>
  );
}