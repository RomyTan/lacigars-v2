"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
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
  Menu,
  Globe,
  ChevronDown,
} from "lucide-react";
import {
  type PartnerSessionState,
  type CatalogItem,
  type CartEntry,
  SAMPLE_CATALOG,
} from "@/lib/storefront-data";

type ActiveDrawer = null | "search" | "account" | "cart" | "mobile-menu";

interface HeaderSettings {
  logoImage: string;
  logoHeightDesktop: number;
  logoHeightMobile: number;
  logoPositionDesktop: string;
  mainMenu: string;
  autoFillBrandsDropdown: boolean;
  autoFillCollectionDropdown: boolean;
  maxProductsInDropdown: number;
  navAlignment: "center" | "left";
  menuFontSize: number;
  menuItemSpacing: number;
  uppercaseMenuLinks: boolean;
  stickyHeader: boolean;
  showSearchIcon: boolean;
  showLanguageIcon: boolean;
  showAccountIcon: boolean;
  headerPaddingY: number;
  maxContainerWidth: number;
  autoOpenCartOnQuickAdd: boolean;
  freeShippingThreshold: number;
  freeShippingProgressText: string;
  freeShippingUnlockedText: string;
  cartBadgeColor: string;
  facebookUrl: string;
  tiktokUrl: string;
  instagramUrl: string;
  mobileCtaLabel: string;
  mobileCtaLink: string;
  mobileCopyrightText: string;
  headerBgColor: string;
  headerTextColor: string;
  headerHoverAccentColor: string;
  headerBorderColor: string;
}

const DEFAULT_HEADER_SETTINGS: HeaderSettings = {
  logoImage: "/lacigars-logo.png",
  logoHeightDesktop: 48,
  logoHeightMobile: 42,
  logoPositionDesktop: "left",
  mainMenu: "main-menu",
  autoFillBrandsDropdown: true,
  autoFillCollectionDropdown: true,
  maxProductsInDropdown: 9,
  navAlignment: "center",
  menuFontSize: 11,
  menuItemSpacing: 28,
  uppercaseMenuLinks: true,
  stickyHeader: true,
  showSearchIcon: true,
  showLanguageIcon: false,
  showAccountIcon: true,
  headerPaddingY: 16,
  maxContainerWidth: 1600,
  autoOpenCartOnQuickAdd: true,
  freeShippingThreshold: 100,
  freeShippingProgressText:
    "You're [amount] from Free Domestic Standard Shipping",
  freeShippingUnlockedText:
    "You've unlocked Free Domestic Standard Shipping!",
  cartBadgeColor: "#D92D20",
  facebookUrl: "",
  tiktokUrl: "",
  instagramUrl: "",
  mobileCtaLabel: "Contact Us",
  mobileCtaLink: "/contact",
  mobileCopyrightText:
    "© 2026 Latin American Cigars Corp. All Rights Reserved.",
  headerBgColor: "#FFFFFF",
  headerTextColor: "#2b2621",
  headerHoverAccentColor: "#8c6d48",
  headerBorderColor: "#e6e2d8",
};

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
  const isAdminRoute = pathname?.startsWith("/admin");

  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawer>(null);
  const [language, setLanguage] = useState<"EN" | "ES">("EN");
  const [headerCfg, setHeaderCfg] = useState<HeaderSettings>(
    DEFAULT_HEADER_SETTINGS
  );
  const [hasCustomHeader, setHasCustomHeader] = useState(false);

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

  const navLinks = useMemo(() => {
    if (headerCfg.mainMenu === "wholesale-menu") {
      return [
        { name: "Home", href: "/" },
        { name: "Brands", href: "/brands" },
        { name: "Products", href: "/products" },
        { name: "Wholesale", href: "/wholesale" },
        { name: "Contact", href: "/contact" },
      ];
    }
    if (headerCfg.mainMenu === "footer-menu") {
      return [
        { name: "Company", href: "/company" },
        { name: "Brands", href: "/brands" },
        { name: "Products", href: "/products" },
        { name: "Contact", href: "/contact" },
      ];
    }
    return [
      { name: "Home", href: "/" },
      { name: "Company", href: "/company" },
      { name: "Brands", href: "/brands" },
      { name: "Products", href: "/products" },
      { name: "Contact", href: "/contact" },
    ];
  }, [headerCfg.mainMenu]);

  const uniqueBrands = useMemo(
    () =>
      Array.from(new Set(SAMPLE_CATALOG.map((item) => item.brand))).slice(
        0,
        headerCfg.maxProductsInDropdown
      ),
    [headerCfg.maxProductsInDropdown]
  );

  const dropdownProducts = useMemo(
    () => SAMPLE_CATALOG.slice(0, headerCfg.maxProductsInDropdown),
    [headerCfg.maxProductsInDropdown]
  );

  // Load saved Header section config from database if available
  useEffect(() => {
    if (isAdminRoute) return;
    let cancelled = false;
    fetch("/api/cms/sections")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !Array.isArray(data?.sections)) return;
        const headerSec = data.sections.find(
          (s: { type?: string; key?: string; content?: Record<string, unknown> }) =>
            String(s.type ?? "").toUpperCase().includes("HEADER") ||
            String(s.key ?? "").toLowerCase().includes("header")
        );
        if (headerSec?.content && typeof headerSec.content === "object") {
          setHeaderCfg((prev) => ({ ...prev, ...headerSec.content }));
          setHasCustomHeader(true);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAdminRoute]);

  // Listen to live preview updates from AdminDashboardClient
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.source !== "lac-cms-preview") return;

      if (data.headerDraft && typeof data.headerDraft === "object") {
        setHeaderCfg((prev) => ({
          ...prev,
          ...(data.headerDraft as Partial<HeaderSettings>),
        }));
        setHasCustomHeader(true);
      }

      if (data.editorFocus === "header") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

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
    if (headerCfg.autoOpenCartOnQuickAdd) {
      setActiveDrawer("cart");
    }
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

  const shippingRemaining = Math.max(
    0,
    headerCfg.freeShippingThreshold - subtotal
  );
  const shippingProgressPct =
    headerCfg.freeShippingThreshold > 0
      ? Math.min(100, (subtotal / headerCfg.freeShippingThreshold) * 100)
      : 0;

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

  const headerVars = {
    "--logo-h-mobile": `${headerCfg.logoHeightMobile}px`,
    "--logo-h-desktop": `${headerCfg.logoHeightDesktop}px`,
    "--header-hover": headerCfg.headerHoverAccentColor,
  } as React.CSSProperties;

  const renderLogo = () => (
    <Link href="/" className="flex items-center gap-3 shrink-0">
      <img
        src={headerCfg.logoImage || "/lacigars-logo.png"}
        alt="Latin American Cigars Corp"
        className="h-[var(--logo-h-mobile)] lg:h-[var(--logo-h-desktop)] w-auto object-contain transition-all"
      />
      <div
        className="hidden sm:block text-[10px] font-bold tracking-[0.15em] leading-snug border-l pl-3 uppercase"
        style={{
          color: headerCfg.headerTextColor,
          borderColor: headerCfg.headerHoverAccentColor,
        }}
      >
        LATIN AMERICAN
        <br />
        CIGARS CORP.
      </div>
    </Link>
  );

  const renderNav = (extraClass = "") => (
    <nav
      className={`hidden lg:flex items-center ${
        headerCfg.navAlignment === "center" ? "justify-center" : "justify-start"
      } ${extraClass}`}
      style={{ gap: `${headerCfg.menuItemSpacing}px` }}
    >
      {navLinks.map((item) => {
        const active = pathname === item.href;
        const showBrandsDrop =
          item.href === "/brands" && headerCfg.autoFillBrandsDropdown;
        const showProductsDrop =
          item.href === "/products" && headerCfg.autoFillCollectionDropdown;
        const hasDropdown = showBrandsDrop || showProductsDrop;

        return (
          <div key={item.href} className="relative group py-1.5">
            <Link
              href={item.href}
              style={{
                fontSize: `${headerCfg.menuFontSize}px`,
                color: headerCfg.headerTextColor,
              }}
              className={`tracking-[0.16em] font-bold transition-colors hover:text-[var(--header-hover)] inline-flex items-center gap-1 ${
                headerCfg.uppercaseMenuLinks ? "uppercase" : "normal-case"
              }`}
            >
              {item.name}
              {hasDropdown && <ChevronDown className="w-3 h-3 opacity-70" />}
              <span
                className={`absolute bottom-0 left-0 h-0.5 transition-all duration-300 ${
                  active ? "w-full" : "w-0 group-hover:w-full"
                }`}
                style={{ backgroundColor: headerCfg.headerHoverAccentColor }}
              />
            </Link>

            {hasDropdown && (
              <div className="pointer-events-none opacity-0 translate-y-1 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 absolute left-0 top-full pt-2 z-50 min-w-56">
                <div
                  className="rounded-lg border shadow-lg p-2 space-y-0.5"
                  style={{
                    backgroundColor: headerCfg.headerBgColor || "#FFFFFF",
                    borderColor: headerCfg.headerBorderColor || "#ECECE8",
                    color: headerCfg.headerTextColor,
                  }}
                >
                  {showBrandsDrop
                    ? uniqueBrands.map((brand) => (
                        <Link
                          key={brand}
                          href={`/brands?q=${encodeURIComponent(brand)}`}
                          className="block px-3 py-1.5 rounded text-xs font-semibold hover:bg-black/5 hover:text-[var(--header-hover)] transition-colors"
                        >
                          {brand}
                        </Link>
                      ))
                    : dropdownProducts.map((prod) => (
                        <Link
                          key={prod.id}
                          href="/products"
                          className="flex items-center justify-between gap-3 px-3 py-1.5 rounded text-xs font-semibold hover:bg-black/5 hover:text-[var(--header-hover)] transition-colors"
                        >
                          <span className="truncate">{prod.name}</span>
                          <span className="text-[10px] opacity-60 shrink-0">
                            {prod.brand}
                          </span>
                        </Link>
                      ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  const renderActions = () => (
    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
      <button
        type="button"
        onClick={() => setActiveDrawer("mobile-menu")}
        aria-label="Open Menu"
        style={{ color: headerCfg.headerTextColor }}
        className="lg:hidden p-2 hover:text-[var(--header-hover)] transition-colors rounded-sm"
      >
        <Menu className="w-5 h-5" />
      </button>

      {headerCfg.showSearchIcon && (
        <button
          type="button"
          onClick={() => setActiveDrawer("search")}
          aria-label="Search Catalog"
          style={{ color: headerCfg.headerTextColor }}
          className="p-2 hover:text-[var(--header-hover)] transition-colors rounded-sm"
        >
          <Search className="w-4 h-4" />
        </button>
      )}

      {headerCfg.showLanguageIcon && (
        <button
          type="button"
          onClick={() => setLanguage((prev) => (prev === "EN" ? "ES" : "EN"))}
          aria-label="Switch Language"
          style={{ color: headerCfg.headerTextColor }}
          className="inline-flex items-center gap-1 px-2 py-1.5 text-[10px] tracking-[0.14em] uppercase font-bold hover:text-[var(--header-hover)] transition-colors rounded-sm"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{language}</span>
        </button>
      )}

      {headerCfg.showAccountIcon && (
        <button
          type="button"
          onClick={() => setActiveDrawer("account")}
          aria-label="Partner Login"
          style={{ color: headerCfg.headerTextColor }}
          className="inline-flex items-center gap-2 px-2.5 py-2 text-[11px] tracking-[0.15em] uppercase font-bold hover:text-[var(--header-hover)] transition-colors rounded-sm"
        >
          <User
            className="w-4 h-4"
            style={{ color: headerCfg.headerHoverAccentColor }}
          />
          <span className="hidden md:inline">
            {partnerState === "APPROVED_PARTNER"
              ? "Partner Portal"
              : "Partner Login"}
          </span>
        </button>
      )}

      {partnerState === "APPROVED_PARTNER" ? (
        <button
          type="button"
          onClick={() => setActiveDrawer("cart")}
          aria-label="Wholesale Order Cart"
          className="relative inline-flex items-center gap-2 bg-[#8c6d48] hover:bg-[#F8B93C] text-white hover:text-[#1a1714] px-4 py-2.5 text-[10px] tracking-[0.2em] uppercase font-bold rounded-sm transition-colors shadow-sm"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Order</span>
          {totalUnits > 0 && (
            <span
              className="px-1.5 py-0.5 text-[9px] font-bold text-white rounded-full"
              style={{ backgroundColor: headerCfg.cartBadgeColor }}
            >
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
  );

  const computedHeaderBg = isScrolled
    ? headerCfg.headerBgColor || "rgba(253, 251, 247, 0.95)"
    : "transparent";

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
      {/* DYNAMIC HEADER */}
      {!isAdminRoute && (
        <header
          data-cms-header=""
          style={{
            ...headerVars,
            backgroundColor: computedHeaderBg,
            color: headerCfg.headerTextColor,
            paddingTop: `${headerCfg.headerPaddingY}px`,
            paddingBottom: `${headerCfg.headerPaddingY}px`,
            borderBottomWidth: isScrolled ? "1px" : "0px",
            borderBottomColor: headerCfg.headerBorderColor,
          }}
          className={`${
            headerCfg.stickyHeader ? "fixed top-0 left-0" : "relative"
          } w-full px-6 md:px-8 z-[90] transition-all duration-300 ${
            isScrolled ? "backdrop-blur-md shadow-sm" : ""
          }`}
        >
          <div
            className="w-full mx-auto"
            style={{ maxWidth: `${headerCfg.maxContainerWidth}px` }}
          >
            {headerCfg.logoPositionDesktop === "top-center" ? (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-3 items-center gap-4">
                  <div />
                  <div className="flex justify-center">{renderLogo()}</div>
                  <div className="flex justify-end">{renderActions()}</div>
                </div>
                {renderNav("w-full")}
              </div>
            ) : headerCfg.logoPositionDesktop === "center" ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 items-center gap-4">
                <div className="hidden lg:flex items-center">
                  {renderNav("w-full")}
                </div>
                <div className="flex items-center lg:justify-center">
                  {renderLogo()}
                </div>
                <div className="flex justify-end">{renderActions()}</div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-6">
                {renderLogo()}
                <div className="hidden lg:flex flex-1 min-w-0">
                  {renderNav("w-full")}
                </div>
                {renderActions()}
              </div>
            )}
          </div>
        </header>
      )}

      {/* MAIN CONTENT */}
      <main>{children}</main>

      {/* DRAWER BACKDROP */}
      {!isAdminRoute && activeDrawer && (
        <div
          onClick={() => setActiveDrawer(null)}
          className="fixed inset-0 bg-[#1a1714]/55 backdrop-blur-[2px] z-[110] transition-opacity"
        />
      )}

      {/* 0. MOBILE MENU DRAWER */}
      {!isAdminRoute && (
        <aside
          className={`fixed top-0 left-0 h-full w-full max-w-sm bg-[#fdfbf7] border-r border-[#e6e2d8] z-[120] flex flex-col justify-between transition-transform duration-300 ${
            activeDrawer === "mobile-menu"
              ? "translate-x-0"
              : "-translate-x-full"
          }`}
        >
          <div className="p-6 border-b border-[#e6e2d8] flex items-center justify-between">
            <img
              src={headerCfg.logoImage || "/lacigars-logo.png"}
              alt="Logo"
              style={{ height: `${headerCfg.logoHeightMobile}px` }}
              className="w-auto object-contain"
            />
            <button
              type="button"
              onClick={() => setActiveDrawer(null)}
              className="p-1.5 text-[#6b6256] hover:text-[#1a1714]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-2">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setActiveDrawer(null)}
                style={{ fontSize: `${Math.max(13, headerCfg.menuFontSize)}px` }}
                className={`block py-2.5 border-b border-[#ece8df] font-bold text-[#2b2621] hover:text-[#8c6d48] ${
                  headerCfg.uppercaseMenuLinks ? "uppercase" : "normal-case"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="p-6 border-t border-[#e6e2d8] bg-white space-y-4">
            {headerCfg.mobileCtaLabel && (
              <Link
                href={headerCfg.mobileCtaLink || "/contact"}
                onClick={() => setActiveDrawer(null)}
                className="block w-full text-center py-3 bg-[#1a1714] hover:bg-[#8c6d48] text-white text-[11px] font-bold uppercase tracking-[0.18em] rounded-sm transition-colors"
              >
                {headerCfg.mobileCtaLabel}
              </Link>
            )}

            {(headerCfg.facebookUrl ||
              headerCfg.tiktokUrl ||
              headerCfg.instagramUrl) && (
              <div className="flex items-center justify-center gap-4 text-[11px] font-bold uppercase tracking-wider text-[#6b6256]">
                {headerCfg.facebookUrl && (
                  <a
                    href={headerCfg.facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#1a1714]"
                  >
                    Facebook
                  </a>
                )}
                {headerCfg.instagramUrl && (
                  <a
                    href={headerCfg.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#1a1714]"
                  >
                    Instagram
                  </a>
                )}
                {headerCfg.tiktokUrl && (
                  <a
                    href={headerCfg.tiktokUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#1a1714]"
                  >
                    TikTok
                  </a>
                )}
              </div>
            )}

            {headerCfg.mobileCopyrightText && (
              <p className="text-[10px] text-center text-[#6b6256]">
                {headerCfg.mobileCopyrightText}
              </p>
            )}
          </div>
        </aside>
      )}

      {/* 1. SEARCH DRAWER */}
      {!isAdminRoute && (
        <aside
          className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#fdfbf7] border-l border-[#e6e2d8] z-[120] flex flex-col justify-between transition-transform duration-300 ${
            activeDrawer === "search" ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="p-6 border-b border-[#e6e2d8] space-y-4">
            <div className="flex items-center justify-between">
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
                    className="w-12 h-12 object-cover rounded-sm shrink-0"
                  />
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-[9px] uppercase tracking-[0.15em] font-bold text-[#8c6d48]">
                      {item.brand} · {item.packSize}
                    </p>
                    <p className="text-xs font-bold text-[#2b2621] truncate">
                      {item.name}
                    </p>
                    {partnerState === "APPROVED_PARTNER" ? (
                      <p className="text-xs font-bold text-[#1a1714]">
                        ${item.wholesalePrice.toFixed(2)}
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveDrawer("account")}
                        className="text-[10px] font-bold text-[#8c6d48] underline"
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
                    className="px-3 py-1.5 bg-[#1a1714] hover:bg-[#8c6d48] text-white text-[10px] font-bold uppercase tracking-wider rounded-sm shrink-0 transition-colors"
                  >
                    Add
                  </button>
                ) : (
                  <Lock className="w-3.5 h-3.5 text-[#8c6d48] shrink-0" />
                )}
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* 2. PARTNER LOGIN / ACCOUNT DRAWER */}
      {!isAdminRoute && (
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
                <div className="p-4 bg-white border border-[#e6e2d8] rounded-lg space-y-1">
                  <div className="flex items-center gap-2 text-[#8c6d48] text-[10px] font-bold uppercase tracking-widest">
                    <CheckCircle2 className="w-4 h-4" /> Approved Wholesale
                    Account
                  </div>
                  <h3 className="text-lg font-serif font-bold text-[#2b2621]">
                    {partnerCompany}
                  </h3>
                  <p className="text-xs text-[#6b6256]">
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
                <div className="space-y-1">
                  <h3 className="text-2xl font-serif font-bold text-[#2b2621]">
                    Partner Sign In
                  </h3>
                  <p className="text-xs text-[#6b6256]">
                    Sign in with your approved retail account to unlock
                    wholesale pricing and order cart.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4a4238]">
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

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4a4238]">
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

                <div className="pt-4 border-t border-[#e6e2d8] text-center space-y-2">
                  <p className="text-xs text-[#6b6256]">
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
      )}

      {/* 3. WHOLESALE ORDER CART DRAWER */}
      {!isAdminRoute && (
        <aside
          className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#fdfbf7] border-l border-[#e6e2d8] z-[120] flex flex-col justify-between transition-transform duration-300 ${
            activeDrawer === "cart" ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div>
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

            {headerCfg.freeShippingThreshold > 0 &&
              partnerState === "APPROVED_PARTNER" && (
                <div className="px-6 py-3 bg-white border-b border-[#e6e2d8] space-y-2">
                  <p className="text-[11px] font-semibold text-[#2b2621]">
                    {shippingRemaining > 0
                      ? headerCfg.freeShippingProgressText.replace(
                          "[amount]",
                          `$${shippingRemaining.toFixed(2)}`
                        )
                      : headerCfg.freeShippingUnlockedText}
                  </p>
                  <div className="w-full h-1.5 rounded-full bg-[#e6e2d8] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${shippingProgressPct}%`,
                        backgroundColor: headerCfg.cartBadgeColor,
                      }}
                    />
                  </div>
                </div>
              )}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {partnerState !== "APPROVED_PARTNER" ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 gap-3">
                <Lock className="w-8 h-8 text-[#8c6d48]" />
                <div className="space-y-1">
                  <h3 className="text-lg font-serif font-bold text-[#2b2621]">
                    Login for Wholesale Price
                  </h3>
                  <p className="text-xs text-[#6b6256]">
                    Wholesale unit pricing and order cart actions are available
                    for approved retail partners.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDrawer("account")}
                  className="px-6 py-3 bg-[#8c6d48] hover:bg-[#F8B93C] text-white hover:text-[#1a1714] text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm transition-colors"
                >
                  Login for Wholesale Price
                </button>
              </div>
            ) : orderSubmitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 gap-3">
                <CheckCircle2 className="w-9 h-9 text-[#8c6d48]" />
                <div className="space-y-1">
                  <h3 className="text-xl font-serif font-bold text-[#2b2621]">
                    Wholesale Order Submitted
                  </h3>
                  <p className="text-xs text-[#6b6256]">
                    Your order request has been queued for {partnerCompany}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOrderSubmitted(false)}
                  className="px-5 py-2.5 border border-[#8c6d48] text-[#8c6d48] text-[10px] font-bold uppercase tracking-[0.18em] rounded-sm"
                >
                  Continue Ordering
                </button>
              </div>
            ) : cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-serif font-bold text-[#2b2621]">
                    Your wholesale order is empty
                  </p>
                  <p className="text-xs text-[#6b6256]">
                    Add cigars, vapes, or accessories from the catalog to build
                    your order.
                  </p>
                </div>
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
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[#8c6d48]">
                        {entry.product.sku} · {entry.product.packSize}
                      </p>
                      <p className="text-xs font-bold text-[#2b2621] truncate">
                        {entry.product.name}
                      </p>
                      <p className="text-xs font-bold text-[#1a1714]">
                        $
                        {(
                          entry.product.wholesalePrice * entry.quantity
                        ).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
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
                        className="p-1 text-[#6b6256] hover:text-red-600"
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
      )}
    </StorefrontContext.Provider>
  );
}