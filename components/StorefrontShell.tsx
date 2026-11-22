"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  User,
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Lock,
} from "lucide-react";
import {
  type PartnerSessionState,
  type CatalogItem,
  type CartEntry,
  SAMPLE_CATALOG,
} from "@/lib/storefront-data";

type ActiveDrawer = null | "search" | "account" | "cart";

interface StorefrontContextValue {
  partnerState: PartnerSessionState;
  partnerCompany: string;
  setPartnerState: (state: PartnerSessionState) => void;
  openDrawer: (drawer: ActiveDrawer) => void;
  closeDrawer: () => void;
  cart: CartEntry[];
  addToCart: (item: CatalogItem, qty?: number) => void;
  updateQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  totalUnits: number;
  subtotal: number;
}

const StorefrontContext = createContext<StorefrontContextValue | null>(null);

export function useStorefront() {
  const ctx = useContext(StorefrontContext);
  if (!ctx) {
    throw new Error("useStorefront must be used inside StorefrontShell");
  }
  return ctx;
}

export function StorefrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawer>(null);

  const [partnerState, setPartnerState] =
    useState<PartnerSessionState>("GUEST");
  const [partnerCompany, setPartnerCompany] = useState(
    "Sunshine Tobacco & Smoke LLC"
  );
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Company", href: "/company" },
    { name: "Brands", href: "/brands" },
    { name: "Products", href: "/products" },
    { name: "Contact", href: "/contact" },
  ];

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setActiveDrawer(null);
  }, [pathname]);

  const addToCart = (product: CatalogItem, qty = 1) => {
    if (partnerState !== "APPROVED_PARTNER") {
      setActiveDrawer("account");
      return;
    }
    setOrderSubmitted(false);
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        return prev.map((c) =>
          c.product.id === product.id
            ? { ...c, quantity: c.quantity + qty }
            : c
        );
      }
      return [...prev, { product, quantity: qty }];
    });
    setActiveDrawer("cart");
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((c) =>
        c.product.id === productId ? { ...c, quantity: qty } : c
      )
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.product.id !== productId));
  };

  const totalUnits = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce(
    (acc, item) => acc + item.product.wholesalePrice * item.quantity,
    0
  );

  const filteredCatalog = SAMPLE_CATALOG.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.brand.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q)
    );
  });

  const handlePartnerSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail.trim()) {
      setPartnerCompany(loginEmail.split("@")[0].toUpperCase() + " RETAIL LLC");
    }
    setPartnerState("APPROVED_PARTNER");
  };

  return (
    <StorefrontContext.Provider
      value={{
        partnerState,
        partnerCompany,
        setPartnerState,
        openDrawer: setActiveDrawer,
        closeDrawer: () => setActiveDrawer(null),
        cart,
        addToCart,
        updateQty,
        removeItem,
        totalUnits,
        subtotal,
      }}
    >
      {/* STICKY HEADER */}
      <header
        className={`fixed top-0 left-0 w-full px-6 md:px-8 py-4 flex justify-between items-center z-[90] transition-all duration-300 ${
          isScrolled
            ? "bg-[#fdfbf7]/95 backdrop-blur-md border-b border-[#e6e2d8] shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/lacigars-logo.png"
              alt="Latin American Cigars Corp"
              className="h-11 md:h-12 w-auto object-contain"
            />
            <div className="hidden sm:block text-[10px] font-bold tracking-[0.15em] text-[#2b2621] leading-snug border-l border-[#8c6d48] pl-3 uppercase">
              LATIN AMERICAN
              <br />
              CIGARS CORP.
            </div>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="text-[11px] tracking-[0.18em] uppercase font-bold text-[#4a4238] hover:text-[#8c6d48] transition-colors py-1.5 relative group"
              >
                {item.name}
                <span
                  className={`absolute bottom-0 left-0 h-0.5 bg-[#8c6d48] transition-all duration-300 ${
                    active ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setActiveDrawer("search")}
            aria-label="Search Catalog"
            className="p-2.5 text-[#2b2621] hover:text-[#8c6d48] transition-colors rounded-sm"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setActiveDrawer("account")}
            aria-label="Partner Login"
            className="inline-flex items-center gap-2 px-3 py-2 text-[11px] tracking-[0.15em] uppercase font-bold text-[#4a4238] hover:text-[#8c6d48] transition-colors rounded-sm"
          >
            <User className="w-4 h-4 text-[#8c6d48]" />
            <span>
              {partnerState === "APPROVED_PARTNER"
                ? "Partner Portal"
                : "Partner Login"}
            </span>
          </button>

          {partnerState === "APPROVED_PARTNER" ? (
            <button
              type="button"
              onClick={() => setActiveDrawer("cart")}
              aria-label="Wholesale Order Cart"
              className="relative inline-flex items-center gap-2 bg-[#8c6d48] hover:bg-[#F8B93C] text-white hover:text-[#1a1714] px-5 py-2.5 text-[10px] tracking-[0.2em] uppercase font-bold rounded-sm transition-colors shadow-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Order</span>
              {totalUnits > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 text-[9px] font-bold bg-[#1a1714] text-[#F8B93C] rounded-full">
                  {totalUnits}
                </span>
              )}
            </button>
          ) : (
            <Link
              href="/contact"
              className="hidden sm:inline-block bg-[#8c6d48] text-white px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#7a5d3b] transition-all duration-300 shadow-sm rounded-sm"
            >
              Become a Customer
            </Link>
          )}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main>{children}</main>

      {/* DRAWER BACKDROP */}
      {activeDrawer && (
        <div
          onClick={() => setActiveDrawer(null)}
          className="fixed inset-0 bg-[#1a1714]/55 backdrop-blur-[2px] z-[110] transition-opacity"
        />
      )}

      {/* 1. SEARCH DRAWER */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#fdfbf7] border-l border-[#e6e2d8] z-[120] flex flex-col justify-between transition-transform duration-300 ${
          activeDrawer === "search" ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-[#e6e2d8]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] tracking-[0.22em] uppercase font-bold text-[#8c6d48]">
              Wholesale Catalog Search
            </span>
            <button
              type="button"
              onClick={() => setActiveDrawer(null)}
              className="p-1.5 text-[#6b6256] hover:text-[#1a1714]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-[#8c6d48] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SKU, cigar brand, vapes, accessories..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#dcd4c5] rounded-sm text-[#2b2621] focus:outline-none focus:border-[#8c6d48]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredCatalog.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 p-3 bg-white border border-[#eae5db] rounded-lg"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 object-cover rounded-sm flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-[0.15em] font-bold text-[#8c6d48]">
                    {item.brand} · {item.packSize}
                  </p>
                  <p className="text-xs font-bold text-[#2b2621] truncate">
                    {item.name}
                  </p>
                  {partnerState === "APPROVED_PARTNER" ? (
                    <p className="text-xs font-bold text-[#1a1714] mt-0.5">
                      ${item.wholesalePrice.toFixed(2)}
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveDrawer("account")}
                      className="text-[10px] font-bold text-[#8c6d48] underline mt-0.5"
                    >
                      Login for Wholesale Price
                    </button>
                  )}
                </div>
              </div>

              {partnerState === "APPROVED_PARTNER" ? (
                <button
                  type="button"
                  onClick={() => addToCart(item, 1)}
                  className="px-3 py-1.5 bg-[#1a1714] hover:bg-[#8c6d48] text-white text-[10px] font-bold uppercase tracking-wider rounded-sm flex-shrink-0 transition-colors"
                >
                  Add
                </button>
              ) : (
                <Lock className="w-3.5 h-3.5 text-[#8c6d48] flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* 2. PARTNER LOGIN / ACCOUNT DRAWER */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#fdfbf7] border-l border-[#e6e2d8] z-[120] flex flex-col justify-between transition-transform duration-300 ${
          activeDrawer === "account" ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-[#e6e2d8] flex items-center justify-between">
          <span className="text-[10px] tracking-[0.22em] uppercase font-bold text-[#8c6d48]">
            Florida Retail Partner Portal
          </span>
          <button
            type="button"
            onClick={() => setActiveDrawer(null)}
            className="p-1.5 text-[#6b6256] hover:text-[#1a1714]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {partnerState === "APPROVED_PARTNER" ? (
            <div className="space-y-6">
              <div className="p-4 bg-white border border-[#e6e2d8] rounded-lg">
                <div className="flex items-center gap-2 text-[#8c6d48] text-[10px] font-bold uppercase tracking-widest mb-1">
                  <CheckCircle2 className="w-4 h-4" /> Approved Wholesale Account
                </div>
                <h3 className="text-lg font-serif font-bold text-[#2b2621]">
                  {partnerCompany}
                </h3>
                <p className="text-xs text-[#6b6256] mt-1">
                  Wholesale pricing &amp; order submission are active for your
                  Florida retail account.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <Link
                  href="/products"
                  className="block w-full text-center py-3 bg-[#8c6d48] hover:bg-[#F8B93C] text-white hover:text-[#1a1714] font-bold uppercase tracking-[0.18em] text-[10px] rounded-sm transition-colors"
                >
                  Browse Wholesale Catalog
                </Link>
                <button
                  type="button"
                  onClick={() => setPartnerState("GUEST")}
                  className="block w-full text-center py-2.5 border border-[#dcd4c5] text-[#6b6256] hover:text-[#1a1714] font-bold uppercase tracking-[0.15em] text-[10px] rounded-sm transition-colors"
                >
                  Sign Out (Preview Guest Mode)
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePartnerSignIn} className="space-y-4">
              <div>
                <h3 className="text-2xl font-serif font-bold text-[#2b2621]">
                  Partner Sign In
                </h3>
                <p className="text-xs text-[#6b6256] mt-1">
                  Sign in with your approved retail account to unlock wholesale
                  pricing and order cart.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4a4238] mb-1.5">
                  Business Email
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="buyer@retailer-fl.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#dcd4c5] rounded-sm focus:outline-none focus:border-[#8c6d48]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4a4238] mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#dcd4c5] rounded-sm focus:outline-none focus:border-[#8c6d48]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#8c6d48] hover:bg-[#F8B93C] text-white hover:text-[#1a1714] text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm transition-colors"
              >
                Sign In to Wholesale Portal
              </button>

              <div className="pt-4 border-t border-[#e6e2d8] text-center">
                <p className="text-xs text-[#6b6256] mb-2">
                  New retail account in Florida?
                </p>
                <Link
                  href="/contact"
                  className="inline-block text-[10px] font-bold uppercase tracking-[0.18em] text-[#8c6d48] underline"
                >
                  Apply for Wholesale Access →
                </Link>
              </div>
            </form>
          )}
        </div>
      </aside>

      {/* 3. WHOLESALE ORDER CART DRAWER */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#fdfbf7] border-l border-[#e6e2d8] z-[120] flex flex-col justify-between transition-transform duration-300 ${
          activeDrawer === "cart" ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-[#e6e2d8] flex items-center justify-between">
          <span className="text-[10px] tracking-[0.22em] uppercase font-bold text-[#8c6d48]">
            Wholesale Order Cart
          </span>
          <button
            type="button"
            onClick={() => setActiveDrawer(null)}
            className="p-1.5 text-[#6b6256] hover:text-[#1a1714]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {partnerState !== "APPROVED_PARTNER" ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <Lock className="w-8 h-8 text-[#8c6d48] mb-3" />
              <h3 className="text-lg font-serif font-bold text-[#2b2621] mb-1">
                Login for Wholesale Price
              </h3>
              <p className="text-xs text-[#6b6256] mb-5">
                Wholesale unit pricing and order cart actions are available for
                approved retail partners.
              </p>
              <button
                type="button"
                onClick={() => setActiveDrawer("account")}
                className="px-6 py-3 bg-[#8c6d48] hover:bg-[#F8B93C] text-white hover:text-[#1a1714] text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm transition-colors"
              >
                Login for Wholesale Price
              </button>
            </div>
          ) : orderSubmitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <CheckCircle2 className="w-9 h-9 text-[#8c6d48] mb-3" />
              <h3 className="text-xl font-serif font-bold text-[#2b2621] mb-1">
                Wholesale Order Submitted
              </h3>
              <p className="text-xs text-[#6b6256] mb-5">
                Your order request has been queued for {partnerCompany}.
              </p>
              <button
                type="button"
                onClick={() => setOrderSubmitted(false)}
                className="px-5 py-2.5 border border-[#8c6d48] text-[#8c6d48] text-[10px] font-bold uppercase tracking-[0.18em] rounded-sm"
              >
                Continue Ordering
              </button>
            </div>
          ) : cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <p className="text-sm font-serif font-bold text-[#2b2621] mb-1">
                Your wholesale order is empty
              </p>
              <p className="text-xs text-[#6b6256] mb-5">
                Add cigars, vapes, or accessories from the catalog to build your
                order.
              </p>
              <Link
                href="/products"
                className="px-5 py-2.5 bg-[#8c6d48] text-white text-[10px] font-bold uppercase tracking-[0.18em] rounded-sm"
              >
                Explore Products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((entry) => (
                <div
                  key={entry.product.id}
                  className="p-3.5 bg-white border border-[#eae5db] rounded-lg flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#8c6d48]">
                      {entry.product.sku} · {entry.product.packSize}
                    </p>
                    <p className="text-xs font-bold text-[#2b2621] truncate">
                      {entry.product.name}
                    </p>
                    <p className="text-xs font-bold text-[#1a1714] mt-0.5">
                      $
                      {(
                        entry.product.wholesalePrice * entry.quantity
                      ).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        updateQty(entry.product.id, entry.quantity - 1)
                      }
                      className="p-1 border border-[#dcd4c5] rounded-sm text-[#2b2621]"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold">
                      {entry.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQty(entry.product.id, entry.quantity + 1)
                      }
                      className="p-1 border border-[#dcd4c5] rounded-sm text-[#2b2621]"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(entry.product.id)}
                      className="p-1 text-[#6b6256] hover:text-red-600 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {partnerState === "APPROVED_PARTNER" &&
          cart.length > 0 &&
          !orderSubmitted && (
            <div className="p-6 border-t border-[#e6e2d8] bg-white space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6b6256] font-medium">
                  Total Units: {totalUnits}
                </span>
                <span className="text-base font-bold text-[#1a1714]">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCart([]);
                  setOrderSubmitted(true);
                }}
                className="w-full py-3.5 bg-[#1a1714] hover:bg-[#8c6d48] text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm transition-colors"
              >
                Submit Wholesale Order
              </button>
            </div>
          )}
      </aside>
    </StorefrontContext.Provider>
  );
}