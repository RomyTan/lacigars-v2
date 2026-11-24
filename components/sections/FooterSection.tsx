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

interface FooterContent {
  logoImage?: string;
  logoHeight?: number;
  brandLine1?: string;
  brandLine2?: string;
  tagline?: string;
  ctaHeading?: string;
  ctaDescription?: string;
  ctaLabel?: string;
  ctaHref?: string;
  copyright?: string;
  bottomRightText?: string;
  bgColor?: string;
  textColor?: string;
  accentColor?: string;
}

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

export function FooterSection({
  content,
}: {
  content?: Record<string, unknown>;
}) {
  const { openDrawer } = useStorefront();
  const [year, setYear] = useState(2026);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const cfg = (content ?? {}) as FooterContent;
  const logoImage = cfg.logoImage?.trim() || "/lacigars-logo.png";
  const logoHeight = Math.min(96, Math.max(24, Number(cfg.logoHeight ?? 44)));
  const brandLine1 = cfg.brandLine1?.trim() || "LATIN AMERICAN";
  const brandLine2 = cfg.brandLine2?.trim() || "CIGARS CORP.";
  const tagline =
    cfg.tagline?.trim() ||
    "Wholesale distributor of premium cigars, cigarettes, vapes, and tobacco accessories serving licensed retailers across Florida.";
  const ctaHeading = cfg.ctaHeading?.trim() || "Ready to stock your store?";
  const ctaDescription =
    cfg.ctaDescription?.trim() ||
    "Apply for an approved wholesale account to unlock full catalog pricing and online ordering.";
  const ctaLabel = cfg.ctaLabel?.trim() || "Become a Customer";
  const ctaHref = cfg.ctaHref?.trim() || "/contact";
  const copyright =
    cfg.copyright?.trim() ||
    `© ${year} Latin American Cigars Corp. All Rights Reserved.`;
  const bottomRightText =
    cfg.bottomRightText?.trim() ||
    "Florida Licensed B2B Wholesale Distributor";

  const bgColor = cfg.bgColor?.trim() || "#1a1714";
  const textColor = cfg.textColor?.trim() || "#fdfbf7";
  const accentColor = cfg.accentColor?.trim() || "#F8B93C";

  return (
    <div className="relative z-10">
      {/* Partner With Us CTA Card */}
      <section className="bg-[#f2efe9] py-24 px-6 md:px-8 border-t border-[#e6e2d8]">
        <div className="max-w-4xl mx-auto text-center bg-white/90 backdrop-blur-xl border border-[#dcd4c5] p-10 md:p-16 rounded-2xl shadow-xl flex flex-col items-center gap-6">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#8c6d48] font-bold">
            — Partner With Us
          </p>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#2b2621] leading-tight">
            Ready to Elevate Your Retail Business?
          </h2>
          <p className="text-[#6b6256] text-sm md:text-base leading-relaxed max-w-2xl pb-4">
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
                <Icon className="w-5 h-5 text-[#8c6d48] shrink-0 pt-0.5" />
                <div className="flex flex-col gap-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1a1714]">
                    {item.title}
                  </h4>
                  <p className="text-xs text-[#6b6256] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Dark Footer */}
      <footer
        style={{ backgroundColor: bgColor, color: textColor }}
        className="pt-16 pb-10"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-14 border-b border-white/10">
            <div className="md:col-span-4 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={logoImage}
                  alt={`${brandLine1} ${brandLine2}`}
                  style={{ height: `${logoHeight}px` }}
                  className="w-auto object-contain"
                />
                <span className="text-[11px] font-bold tracking-[0.16em] uppercase leading-snug border-l border-[#8c6d48] pl-3">
                  {brandLine1}
                  <br />
                  {brandLine2}
                </span>
              </div>
              <p className="text-xs opacity-75 leading-relaxed max-w-sm">
                {tagline}
              </p>
            </div>

            <div className="md:col-span-2 flex flex-col gap-3">
              <h5
                style={{ color: accentColor }}
                className="text-[11px] font-bold uppercase tracking-[0.18em]"
              >
                Catalog
              </h5>
              <ul className="flex flex-col gap-2 text-xs opacity-85">
                <li>
                  <Link href="/products" className="hover:opacity-100">
                    Premium Cigars
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:opacity-100">
                    Vapes &amp; E-Cigs
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:opacity-100">
                    Accessories
                  </Link>
                </li>
                <li>
                  <Link href="/brands" className="hover:opacity-100">
                    All 30+ Brands
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-2 flex flex-col gap-3">
              <h5
                style={{ color: accentColor }}
                className="text-[11px] font-bold uppercase tracking-[0.18em]"
              >
                Company
              </h5>
              <ul className="flex flex-col gap-2 text-xs opacity-85">
                <li>
                  <Link href="/company" className="hover:opacity-100">
                    Our Story
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:opacity-100">
                    Become a Customer
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:opacity-100">
                    Contact Sales
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4 flex flex-col items-start gap-4">
              <h5 className="text-xl font-serif font-bold">{ctaHeading}</h5>
              <p className="text-xs opacity-75 leading-relaxed">
                {ctaDescription}
              </p>
              <Link
                href={ctaHref}
                style={{ backgroundColor: accentColor }}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-[#1a1714] hover:opacity-90 text-[11px] font-bold uppercase tracking-[0.18em] transition-opacity"
              >
                {ctaLabel}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] opacity-65">
            <p>{copyright}</p>
            <p className="uppercase tracking-[0.18em]">{bottomRightText}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}