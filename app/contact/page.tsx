"use client";

import { useState } from "react";
import { MapPin, Mail, Clock, CheckCircle2 } from "lucide-react";
import { FooterSection } from "@/components/sections/FooterSection";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    tobaccoLicense: "",
    cityState: "Florida",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#2b2621] pt-24">
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-14 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left: Info */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#8c6d48] font-bold mb-3">
                — Become a Customer
              </p>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#1a1714] leading-tight">
                Apply for Wholesale Access.
              </h1>
              <p className="text-sm text-[#6b6256] mt-4 leading-relaxed">
                Submit your retail business details below. Once verified by our
                sales team, you will receive Partner Portal credentials with
                full wholesale pricing and online ordering access.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-[#e6e2d8]">
              <div className="flex items-start gap-3.5">
                <MapPin className="w-4 h-4 text-[#8c6d48] mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#1a1714]">
                    Florida Operations Hub
                  </p>
                  <p className="text-xs text-[#6b6256] mt-0.5">
                    Serving licensed smoke shops, lounges &amp; retailers across
                    Florida.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <Mail className="w-4 h-4 text-[#8c6d48] mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#1a1714]">
                    Wholesale Sales Desk
                  </p>
                  <p className="text-xs text-[#6b6256] mt-0.5">
                    sales@latinamericancigars.com
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <Clock className="w-4 h-4 text-[#8c6d48] mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#1a1714]">
                    Business Hours
                  </p>
                  <p className="text-xs text-[#6b6256] mt-0.5">
                    Monday – Friday · 9:00 AM – 5:30 PM EST
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Application Form */}
          <div className="lg:col-span-7 bg-white border border-[#e6e2d8] rounded-2xl p-8 md:p-10 shadow-sm">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <CheckCircle2 className="w-10 h-10 text-[#8c6d48] mx-auto" />
                <h2 className="text-2xl font-serif font-bold text-[#1a1714]">
                  Application Received
                </h2>
                <p className="text-xs text-[#6b6256] max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{form.contactName || "Partner"}</strong>.
                  Our wholesale team will review{" "}
                  <strong>{form.businessName || "your account"}</strong> and
                  follow up via email within 1 business day.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 border border-[#8c6d48] text-[#8c6d48] text-[10px] font-bold uppercase tracking-[0.18em] rounded-sm"
                >
                  Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="text-xl font-serif font-bold text-[#1a1714] pb-3 border-b border-[#f0ece3]">
                  Retail Partner Application
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4a4238] mb-1.5">
                      Business / Store Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.businessName}
                      onChange={(e) =>
                        setForm({ ...form, businessName: e.target.value })
                      }
                      placeholder="Sunshine Smoke & Cigar LLC"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#fdfbf7] border border-[#dcd4c5] rounded-sm focus:outline-none focus:border-[#8c6d48]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4a4238] mb-1.5">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.contactName}
                      onChange={(e) =>
                        setForm({ ...form, contactName: e.target.value })
                      }
                      placeholder="Full Name"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#fdfbf7] border border-[#dcd4c5] rounded-sm focus:outline-none focus:border-[#8c6d48]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4a4238] mb-1.5">
                      Business Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      placeholder="buyer@yourstore.com"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#fdfbf7] border border-[#dcd4c5] rounded-sm focus:outline-none focus:border-[#8c6d48]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4a4238] mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      placeholder="(305) 555-0199"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#fdfbf7] border border-[#dcd4c5] rounded-sm focus:outline-none focus:border-[#8c6d48]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4a4238] mb-1.5">
                      FL Retail Tobacco License #
                    </label>
                    <input
                      type="text"
                      value={form.tobaccoLicense}
                      onChange={(e) =>
                        setForm({ ...form, tobaccoLicense: e.target.value })
                      }
                      placeholder="Optional for initial inquiry"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#fdfbf7] border border-[#dcd4c5] rounded-sm focus:outline-none focus:border-[#8c6d48]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4a4238] mb-1.5">
                      City / State *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.cityState}
                      onChange={(e) =>
                        setForm({ ...form, cityState: e.target.value })
                      }
                      placeholder="Miami, FL"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#fdfbf7] border border-[#dcd4c5] rounded-sm focus:outline-none focus:border-[#8c6d48]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4a4238] mb-1.5">
                    Inquiry / Categories of Interest
                  </label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    placeholder="Tell us about your storefront and preferred brands or categories..."
                    className="w-full px-3.5 py-2.5 text-sm bg-[#fdfbf7] border border-[#dcd4c5] rounded-sm focus:outline-none focus:border-[#8c6d48]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#8c6d48] hover:bg-[#F8B93C] text-white hover:text-[#1a1714] text-[11px] font-bold uppercase tracking-[0.2em] rounded-sm transition-colors shadow-sm"
                >
                  Submit Wholesale Application
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
}