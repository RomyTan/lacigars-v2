"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import {
  Boxes,
  ChevronDown,
  ChevronLeft,
  ClipboardList,
  FolderOpen,
  FolderTree,
  Layers,
  LayoutDashboard,
  Package,
  PanelLeftOpen,
  Tag,
  Users,
} from "lucide-react";

export type SidebarTabKey =
  | "dashboard"
  | "sections"
  | "orders"
  | "customers"
  | "brands"
  | "categories"
  | "collections"
  | "products"
  | "files";

export interface SidebarThemeSection {
  id: number;
  label: string;
  isActive: boolean;
  onSelect: () => void;
}

interface GlassSidebarProps {
  activeNavKey: string;
  adminEmail?: string;
  themeSectionsOpen: boolean;
  onToggleThemeSections: () => void;
  onOpenThemeEditor: () => void;
  onSelectHeader: () => void;
  onSelectFooter: () => void;
  themeSections: SidebarThemeSection[];
  onSelectTab: (tab: SidebarTabKey) => void;
  counts: {
    expiringLicenses: number;
    pendingCustomers: number;
    orders: number;
    customers: number;
    brands: number;
    categories: number;
    collections: number;
    products: number;
    files: number;
  };
  loading?: boolean;
}

interface DockItem {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  badge?: number;
  badgeTone?: "amber" | "neutral";
  onClick: () => void;
}

export function GlassSidebar({
  activeNavKey,
  adminEmail,
  themeSectionsOpen,
  onToggleThemeSections,
  onOpenThemeEditor,
  onSelectHeader,
  onSelectFooter,
  themeSections,
  onSelectTab,
  counts,
  loading,
}: GlassSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredDockIdx, setHoveredDockIdx] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{
    label: string;
    shortcut?: string;
    top: number;
    left: number;
  } | null>(null);

  const navContainerRef = useRef<HTMLDivElement | null>(null);
  const hasMeasuredRef = useRef(false);

  const [indicator, setIndicator] = useState({
    y: 0,
    height: 0,
    visible: false,
    animate: false,
  });

  // Shortcut Cmd/Ctrl + B untuk collapse/expand
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setCollapsed((prev) => !prev);
        setTooltip(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const catalogItems = useMemo(
    () => [
      {
        key: "brands" as const,
        label: "Brands",
        icon: Tag,
        count: counts.brands,
      },
      {
        key: "categories" as const,
        label: "Categories",
        icon: FolderTree,
        count: counts.categories,
      },
      {
        key: "collections" as const,
        label: "Collections",
        icon: Boxes,
        count: counts.collections,
      },
      {
        key: "products" as const,
        label: "Products",
        icon: Package,
        count: counts.products,
      },
    ],
    [counts]
  );

  // Pure GPU sliding active pill (tanpa SVG blur -> 60fps mulus)
  useLayoutEffect(() => {
    if (collapsed) {
      hasMeasuredRef.current = false;
      setIndicator((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }

    const container = navContainerRef.current;
    if (!container) return;

    const measure = (allowAnimate: boolean) => {
      const target = container.querySelector<HTMLElement>(
        `[data-nav-key="${activeNavKey}"]`
      );
      if (!target) {
        setIndicator((prev) =>
          prev.visible ? { ...prev, visible: false } : prev
        );
        return;
      }

      const cRect = container.getBoundingClientRect();
      const tRect = target.getBoundingClientRect();
      const y = Math.round(tRect.top - cRect.top);
      const height = Math.round(tRect.height);

      setIndicator({
        y,
        height,
        visible: true,
        animate: allowAnimate && hasMeasuredRef.current,
      });
      hasMeasuredRef.current = true;
    };

    measure(true);
    const timer = window.setTimeout(() => measure(false), 310);
    return () => window.clearTimeout(timer);
  }, [activeNavKey, collapsed, themeSectionsOpen, themeSections.length, loading]);

  const isThemeActive =
    activeNavKey === "header" ||
    activeNavKey === "footer" ||
    activeNavKey.startsWith("section-");

  const dockItems: DockItem[] = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: counts.expiringLicenses || undefined,
      badgeTone: "amber",
      onClick: () => onSelectTab("dashboard"),
    },
    {
      key: "theme-editor",
      label: "Theme Editor",
      icon: Layers,
      onClick: () => {
        onOpenThemeEditor();
        setCollapsed(false);
      },
    },
    {
      key: "orders",
      label: "Orders",
      icon: ClipboardList,
      badge: counts.orders || undefined,
      badgeTone: "neutral",
      onClick: () => onSelectTab("orders"),
    },
    {
      key: "customers",
      label: "Customer List",
      icon: Users,
      badge: counts.pendingCustomers + counts.expiringLicenses || undefined,
      badgeTone: "amber",
      onClick: () => onSelectTab("customers"),
    },
    {
      key: "brands",
      label: `Brands (${counts.brands})`,
      icon: Tag,
      onClick: () => onSelectTab("brands"),
    },
    {
      key: "categories",
      label: `Categories (${counts.categories})`,
      icon: FolderTree,
      onClick: () => onSelectTab("categories"),
    },
    {
      key: "collections",
      label: `Collections (${counts.collections})`,
      icon: Boxes,
      onClick: () => onSelectTab("collections"),
    },
    {
      key: "products",
      label: `Products (${counts.products})`,
      icon: Package,
      onClick: () => onSelectTab("products"),
    },
    {
      key: "files",
      label: "Files",
      icon: FolderOpen,
      onClick: () => onSelectTab("files"),
    },
  ];

  const getDockScale = (idx: number) => {
    if (hoveredDockIdx === null) return 1;
    const dist = Math.abs(hoveredDockIdx - idx);
    if (dist === 0) return 1.2;
    if (dist === 1) return 1.08;
    return 1;
  };

  const showFloatingTip = (
    el: HTMLElement,
    label: string,
    shortcut?: string
  ) => {
    const rect = el.getBoundingClientRect();
    setTooltip({
      label,
      shortcut,
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    });
  };

  const initials = useMemo(() => {
    if (!adminEmail) return "LA";
    const namePart = adminEmail.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
    return (namePart.slice(0, 2) || "AD").toUpperCase();
  }, [adminEmail]);

  const pillInactive =
    "text-[#e8e3dc]/85 bg-white/[0.05] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-white/[0.11] hover:border-white/[0.18] hover:text-white active:scale-[0.985]";

  const pillActive = "border border-transparent text-[#1a1714] font-bold";

  return (
    <>
      {/* Floating Glass Sidebar */}
      <aside
        className={`relative shrink-0 md:h-full select-none text-[#e8e3dc] rounded-2xl border border-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),0_12px_32px_rgba(0,0,0,0.4)] overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          collapsed ? "w-full md:w-[68px]" : "w-full md:w-[258px]"
        }`}
        style={{
          background:
            "radial-gradient(140% 38% at 18% 0%, rgba(196, 164, 124, 0.22) 0%, rgba(44, 37, 31, 0.72) 40%, rgba(22, 19, 16, 0.94) 100%)",
        }}
      >
        <div className="lac-sidebar-scroll relative z-10 h-full md:overflow-y-auto overflow-x-hidden">
          {collapsed ? (
            /* ================= COLLAPSED FLOATING DOCK ================= */
            <div
              className="hidden md:flex flex-col items-center justify-between min-h-full py-4 px-2 gap-3"
              onMouseLeave={() => {
                setHoveredDockIdx(null);
                setTooltip(null);
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setCollapsed(false);
                  setTooltip(null);
                }}
                onMouseEnter={(e) =>
                  showFloatingTip(e.currentTarget, "Expand", "⌘B")
                }
                onMouseLeave={() => setTooltip(null)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.12] hover:bg-white/[0.22] border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.28)] text-white transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center gap-2 my-1">
                {dockItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isAct =
                    item.key === "theme-editor"
                      ? isThemeActive
                      : activeNavKey === item.key;
                  const scale = getDockScale(idx);

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={item.onClick}
                      onMouseEnter={(e) => {
                        setHoveredDockIdx(idx);
                        showFloatingTip(e.currentTarget, item.label);
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        transform: `scale(${scale})`,
                        transition:
                          "transform 200ms cubic-bezier(0.22, 1, 0.36, 1), background-color 180ms ease",
                      }}
                      className={`relative w-9 h-9 rounded-full flex items-center justify-center ${
                        isAct
                          ? "bg-[#f6f4ef] text-[#1a1714] shadow-[0_0_16px_rgba(246,244,239,0.4)]"
                          : "bg-white/[0.06] hover:bg-white/[0.16] border border-white/[0.1] text-[#e5dfd7] hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.badge ? (
                        <span
                          className={`absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 rounded-full text-[9px] font-extrabold flex items-center justify-center ${
                            item.badgeTone === "amber"
                              ? "bg-amber-500 text-white"
                              : "bg-[#241307] text-[#F8B93C] border border-white/20"
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div
                onMouseEnter={(e) =>
                  showFloatingTip(
                    e.currentTarget,
                    adminEmail || "Admin Account"
                  )
                }
                onMouseLeave={() => setTooltip(null)}
                className="relative w-9 h-9 rounded-full bg-gradient-to-br from-[#F8B93C] to-[#b87b22] text-[#1a1714] font-extrabold text-[11px] flex items-center justify-center border border-white/25 cursor-default"
              >
                {initials}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#161412]" />
              </div>
            </div>
          ) : (
            /* ================= EXPANDED FLOATING GLASS MODE ================= */
            <div
              ref={navContainerRef}
              className="relative min-h-full p-3 flex flex-col justify-between"
            >
              {/* Single GPU-accelerated Sliding Active Pill */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-3 right-3 top-0 rounded-xl bg-[#f6f4ef] shadow-[0_6px_18px_rgba(0,0,0,0.28)] z-0 will-change-transform"
                style={{
                  transform: `translate3d(0, ${indicator.y}px, 0)`,
                  height: `${indicator.height}px`,
                  opacity: indicator.visible ? 1 : 0,
                  transition: indicator.animate
                    ? "transform 280ms cubic-bezier(0.22, 1, 0.36, 1), height 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 150ms ease"
                    : "opacity 150ms ease",
                }}
              />

              <div className="relative z-10 flex flex-col gap-2">
                {/* 0. DASHBOARD (Menu Pertama) + Tombol Collapse */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    data-nav-key="dashboard"
                    onClick={() => onSelectTab("dashboard")}
                    className={`flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-colors duration-200 ${
                      activeNavKey === "dashboard" ? pillActive : pillInactive
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <LayoutDashboard className="w-4 h-4 shrink-0" />
                      <span>Dashboard</span>
                    </span>
                    {counts.expiringLicenses > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                        {counts.expiringLicenses}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCollapsed(true)}
                    title="Collapse sidebar (⌘B)"
                    className="hidden md:flex w-9 h-9 shrink-0 rounded-xl items-center justify-center bg-white/[0.06] hover:bg-white/[0.15] border border-white/[0.1] text-[#e5dfd7] hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>

                <hr className="border-white/[0.09] my-0.5" />

                {/* THEME EDITOR */}
                <div>
                  <div className="flex items-center justify-between px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#b8afa4]/85">
                    <button
                      type="button"
                      onClick={onOpenThemeEditor}
                      className="flex-1 text-left hover:text-white transition-colors"
                    >
                      THEME EDITOR
                    </button>
                    <button
                      type="button"
                      onClick={onToggleThemeSections}
                      className="w-6 h-6 rounded-full flex items-center justify-center bg-white/[0.07] hover:bg-white/[0.16] border border-white/[0.1] text-[#e5dfd7] transition-colors"
                      title={
                        themeSectionsOpen ? "Collapse editor" : "Expand editor"
                      }
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-250 ${
                          themeSectionsOpen ? "rotate-0" : "-rotate-90"
                        }`}
                      />
                    </button>
                  </div>

                  <div
                    className="grid transition-[grid-template-rows,opacity] duration-250 ease-out"
                    style={{
                      gridTemplateRows: themeSectionsOpen ? "1fr" : "0fr",
                      opacity: themeSectionsOpen ? 1 : 0,
                    }}
                  >
                    <div className="overflow-hidden">
                      <div className="pt-1.5 space-y-1">
                        {/* 1. Header */}
                        <button
                          type="button"
                          data-nav-key="header"
                          onClick={onSelectHeader}
                          className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs transition-colors duration-200 ${
                            activeNavKey === "header"
                              ? pillActive
                              : pillInactive
                          }`}
                        >
                          <span className="truncate">1. Header</span>
                        </button>

                        {/* 2..N Theme Sections */}
                        {themeSections.map((sec, idx) => {
                          const key = `section-${sec.id}`;
                          const isCurrent = activeNavKey === key;
                          return (
                            <div
                              key={sec.id}
                              data-nav-key={key}
                              onClick={sec.onSelect}
                              className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs cursor-pointer transition-colors duration-200 ${
                                isCurrent ? pillActive : pillInactive
                              }`}
                            >
                              <span
                                className={`truncate ${
                                  sec.isActive ? "" : "line-through opacity-50"
                                }`}
                              >
                                {idx + 2}. {sec.label}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 transition-colors ${
                                  sec.isActive
                                    ? isCurrent
                                      ? "bg-[#51853D] text-white"
                                      : "bg-white/15 text-[#F8B93C]"
                                    : "bg-white/10 text-white/40"
                                }`}
                              >
                                {sec.isActive ? "ON" : "OFF"}
                              </span>
                            </div>
                          );
                        })}

                        {/* Last. Footer */}
                        <button
                          type="button"
                          data-nav-key="footer"
                          onClick={onSelectFooter}
                          className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs transition-colors duration-200 ${
                            activeNavKey === "footer"
                              ? pillActive
                              : pillInactive
                          }`}
                        >
                          <span className="truncate">
                            {themeSections.length + 2}. Footer
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-white/[0.09] my-0.5" />

                {/* ORDERS & CUSTOMERS */}
                <div className="space-y-1">
                  <p className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#b8afa4]/85">
                    ORDERS &amp; CUSTOMERS
                  </p>

                  <button
                    type="button"
                    data-nav-key="orders"
                    onClick={() => onSelectTab("orders")}
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs transition-colors duration-200 ${
                      activeNavKey === "orders" ? pillActive : pillInactive
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <ClipboardList className="w-3.5 h-3.5 opacity-85" />
                      <span>Orders</span>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                        activeNavKey === "orders"
                          ? "bg-[#1a1714] text-white"
                          : "bg-white/12 text-[#fdfbf7]"
                      }`}
                    >
                      {String(counts.orders).padStart(2, "0")}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-nav-key="customers"
                    onClick={() => onSelectTab("customers")}
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs transition-colors duration-200 ${
                      activeNavKey === "customers" ? pillActive : pillInactive
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Users className="w-3.5 h-3.5 opacity-85 shrink-0" />
                      <span className="truncate">Customer List</span>
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      {counts.pendingCustomers + counts.expiringLicenses >
                        0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white">
                          {counts.pendingCustomers + counts.expiringLicenses}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                          activeNavKey === "customers"
                            ? "bg-[#1a1714] text-white"
                            : "bg-white/12 text-[#fdfbf7]"
                        }`}
                      >
                        {String(counts.customers).padStart(2, "0")}
                      </span>
                    </span>
                  </button>
                </div>

                <hr className="border-white/[0.09] my-0.5" />

                {/* WHOLESALE CATALOG (Semua Icon Dikembalikan) */}
                <div className="space-y-1">
                  <p className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#b8afa4]/85">
                    WHOLESALE CATALOG
                  </p>

                  {catalogItems.map((cat) => {
                    const Icon = cat.icon;
                    const isAct = activeNavKey === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        data-nav-key={cat.key}
                        onClick={() => onSelectTab(cat.key)}
                        className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs transition-colors duration-200 ${
                          isAct ? pillActive : pillInactive
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon className="w-3.5 h-3.5 opacity-85 shrink-0" />
                          <span>{cat.label}</span>
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                            isAct
                              ? "bg-[#1a1714] text-white"
                              : "bg-white/12 text-[#fdfbf7]"
                          }`}
                        >
                          {String(cat.count).padStart(2, "0")}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <hr className="border-white/[0.09] my-0.5" />

                {/* FILES */}
                <button
                  type="button"
                  data-nav-key="files"
                  onClick={() => onSelectTab("files")}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs transition-colors duration-200 ${
                    activeNavKey === "files" ? pillActive : pillInactive
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <FolderOpen className="w-3.5 h-3.5 opacity-85" />
                    <span>Files</span>
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                      activeNavKey === "files"
                        ? "bg-[#1a1714] text-white"
                        : "bg-white/12 text-[#fdfbf7]"
                    }`}
                  >
                    {String(counts.files).padStart(2, "0")}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Floating Tooltip saat Collapsed */}
      {collapsed && tooltip && (
        <div
          style={{
            top: `${tooltip.top}px`,
            left: `${tooltip.left}px`,
            transform: "translateY(-50%)",
          }}
          className="fixed z-[9999] pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#181614]/95 border border-white/15 text-xs font-semibold text-white shadow-[0_10px_28px_rgba(0,0,0,0.45)] whitespace-nowrap"
        >
          <span>{tooltip.label}</span>
          {tooltip.shortcut && (
            <span className="text-[10px] font-mono text-white/60 px-1.5 py-0.5 rounded bg-white/10">
              {tooltip.shortcut}
            </span>
          )}
        </div>
      )}
    </>
  );
}