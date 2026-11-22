"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Truck,
  ShieldCheck,
  PackageCheck,
  Headphones,
  ArrowRight,
} from "lucide-react";
import { useStorefront } from "@/components/StorefrontShell";

const TRUST_ITEMS = [
  {
    icon: Truck,
    title: "Florida-Wide Distribution",
    desc: "Dependable route delivery & fast warehouse dispatch.",
  },
  {
    icon: PackageCheck,
    title: "Climate-Controlled Stock",
    desc: "Properly humidified inventory ready for retail shelves.",
  },
  {
    icon: ShieldCheck,
    title: "Verified B2B Accounts",
    desc: "Dedicated wholesale pricing for licensed retailers.",
  },
  {
    icon: Headphones,
    title: "Direct Account Support",
    desc: "Dedicated sales reps for reorders & portfolio planning.",
  },
];

export function FooterSection() {
  const { openDrawer } = useStorefront();
  const [year, setYear] = useState(2026);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <div className="relative z-10">
      {/* Partner With Us CTA Card (v1 SS-6) */}
      <section className="bg-[#f2efe9] py-24 px-6 md:px-8 border-t border-[#e6e2d8]">
        <div className="max-w-4xl mx-auto text-center bg-white/90 backdrop-blur-xl border border-[#dcd4c5] p-10 md:p-16 rounded-2xl shadow-xl">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#8c6d48] font-bold mb-4">
            — Partner With Us
          </p>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#2b2621] mb-6 leading-tight">
            Ready to Elevate Your Retail Business?
          </h2>
          <p className="text-[#6b6256] text-sm md:text-base leading-relaxed mb-10 max-w-2xl mx-auto">
            Get in touch for wholesale inquiries, catalog access, or to learn
            more about our distribution capabilities across Florida.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-[#8c6d48] text-white px-10 py-4 text-[11px] tracking-[0.2em] font-bold hover:bg-[#F8B93C] hover:text-[#1a1714] transition-colors rounded-sm shadow-md uppercase"
            >
              Contact Sales
            </Link>
            <button
              type="button"
              onClick={() => openDrawer("account")}
              className="border border-[#8c6d48] text-[#8c6d48] px-10 py-4 text-[11px] tracking-[0.2em] font-bold hover:bg-[#8c6d48] hover:text-white transition-colors rounded-sm uppercase"
            >
              Partner Login
            </button>
          </div>
        </div>
      </section>

      {/* 4-Column Trust Bar */}
      <div className="bg-[#fdfbf7] border-y border-[#e6e2d8] py-12">
        <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {TRUST_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-start gap-3.5">
                <Icon className="w-5 h-5 text-[#8c6d48] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1a1714]">
                    {item.title}
                  </h4>
                  <p className="text-xs text-[#6b6256] mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dark Footer */}
      <footer className="bg-[#1a1714] text-[#fdfbf7] pt-16 pb-10">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-14 border-b border-white/10">
            <div className="md:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src="/lacigars-logo.png"
                  alt="Latin American Cigars Corp."
                  className="h-11 w-auto object-contain"
                />
                <span className="text-[11px] font-bold tracking-[0.16em] uppercase leading-snug border-l border-[#8c6d48] pl-3">
                  LATIN AMERICAN
                  <br />
                  CIGARS CORP.
                </span>
              </div>
              <p className="text-xs text-[#b8afa4] leading-relaxed max-w-sm">
                Wholesale distributor of premium cigars, cigarettes, vapes, and
                tobacco accessories serving licensed retailers across Florida.
              </p>
            </div>

            <div className="md:col-span-2 space-y-3">
              <h5 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#F8B93C]">
                Catalog
              </h5>
              <ul className="space-y-2 text-xs text-[#d8d0c5]">
                <li>
                  <Link href="/products" className="hover:text-[#F8B93C]">
                    Premium Cigars
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-[#F8B93C]">
                    Vapes &amp; E-Cigs
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-[#F8B93C]">
                    Accessories
                  </Link>
                </li>
                <li>
                  <Link href="/brands" className="hover:text-[#F8B93C]">
                    All 30+ Brands
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-2 space-y-3">
              <h5 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#F8B93C]">
                Company
              </h5>
              <ul className="space-y-2 text-xs text-[#d8d0c5]">
                <li>
                  <Link href="/company" className="hover:text-[#F8B93C]">
                    Our Story
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-[#F8B93C]">
                    Become a Customer
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-[#F8B93C]">
                    Contact Sales
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-4">
              <h5 className="text-xl font-serif font-bold text-[#fdfbf7]">
                Ready to stock your store?
              </h5>
              <p className="text-xs text-[#b8afa4]">
                Apply for an approved wholesale account to unlock full catalog
                pricing and online ordering.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#F8B93C] hover:bg-[#8c6d48] text-[#1a1714] hover:text-white text-[11px] font-bold uppercase tracking-[0.18em] transition-colors"
              >
                Become a Customer
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#8c8276]">
            <p>
              © {year} Latin American Cigars Corp. All Rights Reserved.
            </p>
            <p className="uppercase tracking-[0.18em]">
              Florida Licensed B2B Wholesale Distributor
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}