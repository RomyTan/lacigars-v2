"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BellRing,
  CheckCircle2,
  Package,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import type { CustomerRecord } from "@/components/admin/CustomerListView";

interface DashboardProduct {
  id: number;
  name: string;
  sku: string;
  quickBooksPrice: number;
  wholesalePrice: number | null;
  qboQtyOnHand: number;
  isActive: boolean;
  category?: { id: number; name: string };
}

interface DashboardCategory {
  id: number;
  name: string;
  _count?: { products: number };
}

interface DashboardOrder {
  id: string;
  orderNumber: string;
  customer: string;
  total: number;
  status: string;
  date: string;
}

interface AdminB2BDashboardProps {
  adminEmail?: string;
  customers: CustomerRecord[];
  products: DashboardProduct[];
  categories: DashboardCategory[];
  brandsCount: number;
  orders: DashboardOrder[];
  onNavigate: (
    tab: "customers" | "products" | "orders" | "sections"
  ) => void;
  onTriggerAlertEmail: () => Promise<void>;
  sendingAlerts: boolean;
}

export function getDaysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const parsed = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  const now = new Date();
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  return Math.round((parsed.getTime() - todayUtc) / (1000 * 60 * 60 * 24));
}

function useCountUp(target: number, duration = 950, delay = 0, decimals = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let rafId = 0;
    let startTime = 0;

    const timer = window.setTimeout(() => {
      const tick = (now: number) => {
        if (!startTime) startTime = now;
        const progress = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = target * eased;
        setValue(
          decimals > 0
            ? Number(current.toFixed(decimals))
            : Math.round(current)
        );
        if (progress < 1) {
          rafId = requestAnimationFrame(tick);
        }
      };
      rafId = requestAnimationFrame(tick);
    }, delay);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(rafId);
    };
  }, [target, duration, delay, decimals]);

  return value;
}

const MONTHLY_METRICS = [
  { month: "Jun", revenue: 64200, target: 60000, orders: 42 },
  { month: "Jul", revenue: 71800, target: 68000, orders: 49 },
  { month: "Aug", revenue: 83400, target: 76000, orders: 56 },
  { month: "Sep", revenue: 79100, target: 82000, orders: 52 },
  { month: "Oct", revenue: 94600, target: 88000, orders: 64 },
  { month: "Nov", revenue: 112400, target: 98000, orders: 74 },
];

export function AdminB2BDashboard({
  adminEmail,
  customers,
  products,
  categories,
  brandsCount,
  orders,
  onNavigate,
  onTriggerAlertEmail,
  sendingAlerts,
}: AdminB2BDashboardProps) {
  const [chartMode, setChartMode] = useState<"revenue" | "orders">("revenue");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(5);
  const [entered, setEntered] = useState(false);
  const [chartAnimated, setChartAnimated] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    setChartAnimated(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setChartAnimated(true));
    });
    return () => cancelAnimationFrame(id);
  }, [chartMode]);

  const licenseAlerts = useMemo(() => {
    const items: Array<{
      customerId: number;
      companyName: string;
      docType: "Resale Tax" | "Tobacco License";
      docNumber: string;
      expDate: string;
      daysLeft: number;
    }> = [];

    for (const c of customers) {
      if (c.status === "REJECTED") continue;
      const taxDays = getDaysUntil(c.resaleTaxExpirationDate);
      if (taxDays !== null && taxDays <= 45) {
        items.push({
          customerId: c.id,
          companyName: c.companyName,
          docType: "Resale Tax",
          docNumber: c.resaleTaxNumber || "Missing #",
          expDate: c.resaleTaxExpirationDate || "",
          daysLeft: taxDays,
        });
      }
      const tobDays = getDaysUntil(c.tobaccoLicenseExpirationDate);
      if (tobDays !== null && tobDays <= 45) {
        items.push({
          customerId: c.id,
          companyName: c.companyName,
          docType: "Tobacco License",
          docNumber: c.tobaccoLicense || "Missing #",
          expDate: c.tobaccoLicenseExpirationDate || "",
          daysLeft: tobDays,
        });
      }
    }

    return items.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [customers]);

  const approvedCount = customers.filter((c) => c.status === "APPROVED").length;
  const pendingCount = customers.filter((c) => c.status === "PENDING").length;
  const expiredCount = licenseAlerts.filter((a) => a.daysLeft < 0).length;
  const expiringSoonCount = licenseAlerts.filter(
    (a) => a.daysLeft >= 0 && a.daysLeft <= 30
  ).length;

  const compliantAccounts = useMemo(() => {
    if (customers.length === 0) return 0;
    return customers.filter((c) => {
      const t = getDaysUntil(c.resaleTaxExpirationDate);
      const l = getDaysUntil(c.tobaccoLicenseExpirationDate);
      return t !== null && t > 30 && l !== null && l > 30;
    }).length;
  }, [customers]);

  const compliancePct =
    customers.length > 0
      ? Math.round((compliantAccounts / customers.length) * 100)
      : 100;

  const totalInventoryUnits = products.reduce(
    (acc, p) => acc + (p.qboQtyOnHand ?? 0),
    0
  );
  const catalogValue = products.reduce(
    (acc, p) =>
      acc + (p.wholesalePrice ?? p.quickBooksPrice ?? 0) * (p.qboQtyOnHand ?? 0),
    0
  );

  // Animated Counters
  const animVolumeK = useCountUp(112.4, 1000, 80, 1);
  const animCustomers = useCountUp(customers.length, 850, 140, 0);
  const animProducts = useCountUp(products.length, 850, 200, 0);
  const animAlerts = useCountUp(licenseAlerts.length, 850, 260, 0);
  const animCompliancePct = useCountUp(compliancePct, 1150, 220, 0);

  // SVG Trend Chart Geometry
  const chartW = 560;
  const chartH = 200;
  const padX = 28;
  const padY = 20;
  const values = MONTHLY_METRICS.map((m) =>
    chartMode === "revenue" ? m.revenue : m.orders
  );
  const targets = MONTHLY_METRICS.map((m) =>
    chartMode === "revenue" ? m.target : Math.round(m.target / 1450)
  );
  const maxVal = Math.max(...values, ...targets) * 1.12;
  const stepX = (chartW - padX * 2) / (MONTHLY_METRICS.length - 1);

  const toPoint = (val: number, idx: number) => ({
    x: padX + idx * stepX,
    y: chartH - padY - (val / maxVal) * (chartH - padY * 2),
  });

  const mainPoints = values.map(toPoint);
  const targetPoints = targets.map(toPoint);

  const mainPath = mainPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const targetPath = targetPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${mainPath} L ${mainPoints[mainPoints.length - 1].x.toFixed(
    1
  )} ${(chartH - padY).toFixed(1)} L ${mainPoints[0].x.toFixed(1)} ${(
    chartH - padY
  ).toFixed(1)} Z`;

  // Category Breakdown
  const categoryBars = useMemo(() => {
    const list = categories.map((cat) => ({
      name: cat.name,
      count:
        cat._count?.products ??
        products.filter((p) => p.category?.id === cat.id).length,
    }));
    const sorted = list.sort((a, b) => b.count - a.count).slice(0, 6);
    const max = Math.max(1, ...sorted.map((s) => s.count));
    return sorted.map((s) => ({
      ...s,
      pct: Math.max(8, Math.round((s.count / max) * 100)),
    }));
  }, [categories, products]);

  // Compliance Semi-Circle Gauge (0% gray -> target %)
  const radius = 64;
  const circumference = Math.PI * radius;
  const dashOffset = entered
    ? circumference - (compliancePct / 100) * circumference
    : circumference;

  const displayName = adminEmail ? adminEmail.split("@")[0] : "Partner";
  const activePoint =
    hoveredIdx !== null ? MONTHLY_METRICS[hoveredIdx] : MONTHLY_METRICS[5];

  const cardAnim = (delayMs: number): React.CSSProperties => ({
    opacity: entered ? 1 : 0,
    transform: entered ? "translateY(0px) scale(1)" : "translateY(14px) scale(0.985)",
    transition: `opacity 480ms cubic-bezier(0.22, 1, 0.36, 1) ${delayMs}ms, transform 520ms cubic-bezier(0.22, 1, 0.36, 1) ${delayMs}ms`,
  });

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-8">
      {/* Top Greeting Header */}
      <div
        style={cardAnim(0)}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8c6d48]">
            B2B Wholesale Overview
          </p>
          <h1 className="text-2xl font-serif font-bold text-[#1a1714] mt-0.5 capitalize">
            Welcome back, {displayName}
          </h1>
          <p className="text-xs text-[#6b6256] mt-0.5">
            {pendingCount} pending account approval{pendingCount === 1 ? "" : "s"}{" "}
            · {licenseAlerts.length} license compliance alert
            {licenseAlerts.length === 1 ? "" : "s"} across Florida wholesale accounts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={sendingAlerts}
            onClick={onTriggerAlertEmail}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#faf8f4] border border-[#dcd4c5] text-[#1a1714] text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
          >
            <BellRing className="w-3.5 h-3.5 text-[#8c6d48]" />
            {sendingAlerts ? "Checking..." : "Send Expiration Alerts"}
          </button>
          <button
            type="button"
            onClick={() => onNavigate("customers")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1a1714] hover:bg-[#8c6d48] text-white text-xs font-bold shadow-xs transition-colors"
          >
            Manage Accounts
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          style={cardAnim(60)}
          className="bg-white border border-[#e5dfd3] rounded-2xl p-4 shadow-xs flex flex-col justify-between gap-3"
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#6b6256]">
            <span>Est. Wholesale Volume</span>
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold text-[#1a1714] tracking-tight tabular-nums">
                ${animVolumeK.toFixed(1)}K
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                +18.8% vs last month
              </span>
            </div>
            <svg width="68" height="28" viewBox="0 0 68 28" className="shrink-0">
              <path
                d="M2 24 L16 19 L30 14 L44 16 L56 9 L66 4"
                pathLength={1}
                fill="none"
                stroke="#15803d"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="1"
                strokeDashoffset={entered ? 0 : 1}
                style={{
                  transition: "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1) 240ms",
                }}
              />
            </svg>
          </div>
        </div>

        <button
          type="button"
          style={cardAnim(120)}
          onClick={() => onNavigate("customers")}
          className="text-left bg-white hover:border-[#8c6d48] border border-[#e5dfd3] rounded-2xl p-4 shadow-xs flex flex-col justify-between gap-3 transition-colors"
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#6b6256]">
            <span>Active B2B Accounts</span>
            <Users className="w-4 h-4 text-[#8c6d48]" />
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold text-[#1a1714] tracking-tight tabular-nums">
                {animCustomers}
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#f4f1ea] text-[#574d42] text-[10px] font-bold">
                {approvedCount} approved · {pendingCount} pending
              </span>
            </div>
            <svg width="68" height="28" viewBox="0 0 68 28" className="shrink-0">
              <path
                d="M2 22 L16 20 L30 17 L44 12 L56 10 L66 5"
                pathLength={1}
                fill="none"
                stroke="#8c6d48"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="1"
                strokeDashoffset={entered ? 0 : 1}
                style={{
                  transition: "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1) 300ms",
                }}
              />
            </svg>
          </div>
        </button>

        <button
          type="button"
          style={cardAnim(180)}
          onClick={() => onNavigate("products")}
          className="text-left bg-white hover:border-[#8c6d48] border border-[#e5dfd3] rounded-2xl p-4 shadow-xs flex flex-col justify-between gap-3 transition-colors"
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#6b6256]">
            <span>Wholesale Catalog</span>
            <Package className="w-4 h-4 text-[#8c6d48]" />
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold text-[#1a1714] tracking-tight tabular-nums">
                {animProducts}{" "}
                <span className="text-xs font-semibold text-[#6b6256]">
                  SKUs
                </span>
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#f4f1ea] text-[#574d42] text-[10px] font-bold">
                {brandsCount} brands · {totalInventoryUnits} units ($
                {catalogValue.toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}
                )
              </span>
            </div>
          </div>
        </button>

        <button
          type="button"
          style={cardAnim(240)}
          onClick={() => onNavigate("customers")}
          className="text-left bg-white hover:border-amber-600 border border-[#e5dfd3] rounded-2xl p-4 shadow-xs flex flex-col justify-between gap-3 transition-colors"
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#6b6256]">
            <span>License Compliance Alerts</span>
            <ShieldAlert
              className={`w-4 h-4 ${
                expiredCount > 0
                  ? "text-red-600"
                  : expiringSoonCount > 0
                  ? "text-amber-600"
                  : "text-emerald-700"
              }`}
            />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#1a1714] tracking-tight tabular-nums">
              {animAlerts}
            </p>
            <span
              className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                expiredCount > 0
                  ? "bg-red-50 text-red-700"
                  : expiringSoonCount > 0
                  ? "bg-amber-50 text-amber-800"
                  : "bg-emerald-50 text-emerald-800"
              }`}
            >
              {expiredCount > 0
                ? `${expiredCount} expired · ${expiringSoonCount} due <30d`
                : expiringSoonCount > 0
                ? `${expiringSoonCount} expiring within 30d`
                : "All recorded licenses valid"}
            </span>
          </div>
        </button>
      </div>

      {/* Compliance Insights Bar */}
      <div
        style={cardAnim(300)}
        className="bg-white border border-[#e5dfd3] rounded-2xl p-3.5 shadow-xs flex flex-col lg:flex-row lg:items-center gap-3"
      >
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#faf8f4] border border-[#ebe6dc] shrink-0">
          <Sparkles className="w-4 h-4 text-[#8c6d48]" />
          <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#1a1714]">
            Compliance Insights
          </span>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {licenseAlerts.length === 0 ? (
            <div className="md:col-span-3 flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-xs text-emerald-900">
              <span className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                No Resale Tax or Tobacco Licenses expiring within the next 45
                days.
              </span>
              <button
                type="button"
                onClick={() => onNavigate("customers")}
                className="font-bold underline"
              >
                Review Profiles
              </button>
            </div>
          ) : (
            licenseAlerts.slice(0, 3).map((alert, idx) => (
              <div
                key={`${alert.customerId}-${alert.docType}-${idx}`}
                className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                  alert.daysLeft < 0
                    ? "bg-red-50/70 border-red-200 text-red-950"
                    : "bg-amber-50/70 border-amber-200 text-amber-950"
                }`}
              >
                <div className="min-w-0">
                  <p className="font-bold truncate flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {alert.companyName}
                  </p>
                  <p className="text-[11px] opacity-80 truncate">
                    {alert.docType} ·{" "}
                    {alert.daysLeft < 0
                      ? `Expired ${Math.abs(alert.daysLeft)}d ago`
                      : alert.daysLeft === 0
                      ? "Expires today"
                      : `Expires in ${alert.daysLeft}d`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate("customers")}
                  className="px-2 py-1 rounded-lg bg-white border border-black/10 text-[10px] font-bold shrink-0 hover:bg-[#1a1714] hover:text-white transition-colors"
                >
                  Review
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Analytics Row: Revenue/Order Trend + Compliance Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Animated Area + Line Trend Chart */}
        <div
          style={cardAnim(360)}
          className="lg:col-span-8 bg-white border border-[#e5dfd3] rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#1a1714]">
                Wholesale Performance vs Target
              </h2>
              <p className="text-[11px] text-[#6b6256]">
                6-month B2B {chartMode === "revenue" ? "revenue" : "order count"}{" "}
                trajectory · Selected:{" "}
                <strong className="text-[#1a1714]">
                  {activePoint.month} (
                  {chartMode === "revenue"
                    ? `$${activePoint.revenue.toLocaleString()}`
                    : `${activePoint.orders} orders`}
                  )
                </strong>
              </p>
            </div>

            <div className="flex items-center gap-1 bg-[#f3f0e9] p-1 rounded-xl border border-[#e5dfd3]">
              {(["revenue", "orders"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setChartMode(mode)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold capitalize transition-colors ${
                    chartMode === mode
                      ? "bg-white text-[#1a1714] shadow-xs"
                      : "text-[#6b6256]"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartW} ${chartH + 22}`}
              className="w-full h-56 overflow-visible"
            >
              <defs>
                <linearGradient id="lacAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8c6d48" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#8c6d48" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {[0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = chartH - padY - ratio * (chartH - padY * 2);
                return (
                  <line
                    key={ratio}
                    x1={padX}
                    x2={chartW - padX}
                    y1={y}
                    y2={y}
                    stroke="#ece8df"
                    strokeDasharray="3 3"
                  />
                );
              })}

              <path
                d={areaPath}
                fill="url(#lacAreaGrad)"
                style={{
                  opacity: chartAnimated ? 1 : 0,
                  transition: "opacity 700ms ease 280ms",
                }}
              />
              <path
                d={targetPath}
                pathLength={1}
                fill="none"
                stroke="#b8afa4"
                strokeWidth="1.75"
                strokeDasharray="1"
                strokeDashoffset={chartAnimated ? 0 : 1}
                style={{
                  transition: "stroke-dashoffset 950ms cubic-bezier(0.22, 1, 0.36, 1) 120ms",
                }}
              />
              <path
                d={mainPath}
                pathLength={1}
                fill="none"
                stroke="#241307"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="1"
                strokeDashoffset={chartAnimated ? 0 : 1}
                style={{
                  transition: "stroke-dashoffset 1050ms cubic-bezier(0.22, 1, 0.36, 1) 180ms",
                }}
              />

              {mainPoints.map((pt, idx) => {
                const isActive = hoveredIdx === idx;
                return (
                  <g
                    key={MONTHLY_METRICS[idx].month}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(idx)}
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isActive ? 6 : 4}
                      fill={isActive ? "#F8B93C" : "#1a1714"}
                      stroke="#ffffff"
                      strokeWidth="2"
                      style={{
                        opacity: chartAnimated ? 1 : 0,
                        transition: `opacity 320ms ease ${260 + idx * 90}ms, r 180ms ease`,
                      }}
                    />
                    <text
                      x={pt.x}
                      y={chartH + 8}
                      textAnchor="middle"
                      className="fill-[#6b6256] text-[10px] font-semibold"
                    >
                      {MONTHLY_METRICS[idx].month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right: Animated License Compliance Gauge (0% -> target%) */}
        <div
          style={cardAnim(420)}
          className="lg:col-span-4 bg-white border border-[#e5dfd3] rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#1a1714]">
                License Compliance Health
              </h2>
              <p className="text-[11px] text-[#6b6256]">
                Resale Tax &amp; Tobacco License status
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("customers")}
              className="text-[11px] font-bold text-[#8c6d48] hover:underline"
            >
              View all
            </button>
          </div>

          <div className="flex flex-col items-center justify-center py-2">
            <svg width="176" height="106" viewBox="0 0 176 106">
              <path
                d="M 24 88 A 64 64 0 0 1 152 88"
                fill="none"
                stroke="#e5e2da"
                strokeWidth="14"
                strokeLinecap="round"
              />
              <path
                d="M 24 88 A 64 64 0 0 1 152 88"
                fill="none"
                stroke={
                  compliancePct >= 75
                    ? "#15803d"
                    : compliancePct >= 40
                    ? "#d97706"
                    : "#b91c1c"
                }
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{
                  transition:
                    "stroke-dashoffset 1200ms cubic-bezier(0.22, 1, 0.36, 1) 240ms",
                }}
              />
              <text
                x="88"
                y="74"
                textAnchor="middle"
                className="fill-[#1a1714] text-2xl font-bold tabular-nums"
              >
                {animCompliancePct}%
              </text>
              <text
                x="88"
                y="92"
                textAnchor="middle"
                className="fill-[#6b6256] text-[10px]"
              >
                fully compliant
              </text>
            </svg>
          </div>

          <div className="space-y-2 text-xs border-t border-[#f0ece3] pt-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#4a4238]">
                <span className="w-2 h-2 rounded-full bg-emerald-700" />
                Valid (&gt;30 days)
              </span>
              <span className="font-bold text-[#1a1714]">
                {compliantAccounts}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#4a4238]">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Expiring within 30d
              </span>
              <span className="font-bold text-amber-800">
                {expiringSoonCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#4a4238]">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                Expired documents
              </span>
              <span className="font-bold text-red-700">{expiredCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Row: Animated Category Breakdown + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div
          style={cardAnim(480)}
          className="lg:col-span-7 bg-white border border-[#e5dfd3] rounded-2xl p-5 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#1a1714]">
                Catalog Breakdown by Category
              </h2>
              <p className="text-[11px] text-[#6b6256]">
                Active SKUs distributed across wholesale categories
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("products")}
              className="text-[11px] font-bold text-[#8c6d48] hover:underline"
            >
              Open Products
            </button>
          </div>

          {categoryBars.length === 0 ? (
            <p className="text-xs text-[#6b6256] py-6 text-center">
              No categories configured yet.
            </p>
          ) : (
            <div className="space-y-3">
              {categoryBars.map((bar, idx) => (
                <div key={bar.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#1a1714]">
                      {bar.name}
                    </span>
                    <span className="font-mono text-[11px] text-[#6b6256]">
                      {bar.count} SKU{bar.count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#f0ece3] overflow-hidden">
                    <div
                      style={{
                        width: entered ? `${bar.pct}%` : "0%",
                        transition: `width 900ms cubic-bezier(0.22, 1, 0.36, 1) ${
                          340 + idx * 100
                        }ms`,
                      }}
                      className="h-full rounded-full bg-gradient-to-r from-[#241307] to-[#8c6d48]"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={cardAnim(540)}
          className="lg:col-span-5 bg-white border border-[#e5dfd3] rounded-2xl p-5 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#1a1714]">
                Recent Wholesale Orders
              </h2>
              <p className="text-[11px] text-[#6b6256]">
                Latest B2B portal submissions
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("orders")}
              className="text-[11px] font-bold text-[#8c6d48] hover:underline"
            >
              View Orders
            </button>
          </div>

          <div className="divide-y divide-[#f0ece3]">
            {orders.slice(0, 5).map((ord) => (
              <div
                key={ord.id}
                className="py-2.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-bold text-[#1a1714] truncate">
                    {ord.orderNumber} · {ord.customer}
                  </p>
                  <p className="text-[10px] text-[#6b6256]">{ord.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[#1a1714]">
                    ${ord.total.toFixed(2)}
                  </p>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[9px] font-bold">
                    {ord.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}