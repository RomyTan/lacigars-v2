"use client";

import Link from "next/link";
import { ShieldCheck, Truck, Warehouse, Handshake } from "lucide-react";
import { FooterSection } from "@/components/sections/FooterSection";

const PILLARS = [
  {
    icon: Warehouse,
    title: "Climate-Controlled Hub",
    desc: "Every box and carton is stored in humidity-regulated facilities in Florida to preserve wrapper integrity and freshness.",
  },
  {
    icon: Truck,
    title: "Disciplined Logistics",
    desc: "Predictable dispatch schedules and dependable route fulfillment built around retail restocking cycles.",
  },
  {
    icon: ShieldCheck,
    title: "Licensed B2B Compliance",
    desc: "Strict age-verified, Florida-licensed wholesale distribution serving smoke shops, lounges, and independent retailers.",
  },
  {
    icon: Handshake,
    title: "Long-Term Retail Margin",
    desc: "Competitive wholesale pricing and portfolio curation focused on high-velocity SKUs and repeat customer demand.",
  },
];

export default function CompanyPage() {
  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#2b2621] pt-24">
      {/* Hero Split */}
      <section className="relative overflow-hidden border-b border-[#e6e2d8] bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#8c6d48] font-bold">
              — Our Company
            </p>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-[#1a1714] leading-[1.08] tracking-tight">
              A Legacy of Reliable Wholesale Distribution.
            </h1>
            <p className="text-sm md:text-base text-[#574f45] leading-relaxed">
              Based in Florida, Latin American Cigars Corp. bridges the gap
              between world-class tobacco manufacturers and retail storefronts.
              We combine heritage cigar expertise with modern B2B logistics so
              retailers never miss a sale.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/contact"
                className="px-7 py-3.5 bg-[#8c6d48] hover:bg-[#F8B93C] text-white hover:text-[#1a1714] text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm transition-colors"
              >
                Become a Customer →
              </Link>
              <Link
                href="/brands"
                className="px-7 py-3.5 border border-[#2b2621] text-[#1a1714] hover:bg-[#1a1714] hover:text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm transition-colors"
              >
                Explore 30+ Brands
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-[420px] md:h-[500px] rounded-2xl overflow-hidden shadow-xl border border-[#e6e2d8]">
              <img
                src="/company-02.jpg"
                alt="Florida Operations Hub"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-md px-4 py-2 rounded-sm text-[9px] tracking-[0.2em] uppercase font-bold text-[#8c6d48] shadow-md">
                Florida Operations Hub
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Strip */}
      <section className="bg-[#1a1714] text-[#fdfbf7] py-14">
        <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl md:text-4xl font-serif font-bold text-[#F8B93C]">
              30+
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#b8afa4] mt-1">
              Curated Tobacco Brands
            </p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-serif font-bold text-[#F8B93C]">
              250+
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#b8afa4] mt-1">
              Active Wholesale SKUs
            </p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-serif font-bold text-[#F8B93C]">
              24–48h
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#b8afa4] mt-1">
              Florida Dispatch Window
            </p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-serif font-bold text-[#F8B93C]">
              100%
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#b8afa4] mt-1">
              Licensed B2B Focus
            </p>
          </div>
        </div>
      </section>

      {/* 4 Operational Pillars */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-28">
        <div className="max-w-2xl mb-14">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#8c6d48] font-bold mb-3">
            — How We Operate
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1a1714]">
            Built for Retail Reliability.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PILLARS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-white border border-[#e6e2d8] rounded-2xl p-6 space-y-4"
              >
                <div className="w-10 h-10 rounded-xl bg-[#fdfbf7] border border-[#e6e2d8] flex items-center justify-center text-[#8c6d48]">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-serif font-bold text-[#1a1714]">
                  {item.title}
                </h3>
                <p className="text-xs text-[#6b6256] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <FooterSection />
    </div>
  );
}