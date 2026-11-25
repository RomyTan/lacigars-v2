"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

interface CardProduct {
  id?: number;
  sku?: string;
  name?: string;
  brand?: string | null;
  boxInfo?: string | null;
  origin?: string | null;
  shape?: string | null;
  image?: string | null;
  category?: string;
  badge?: string;
}

interface BestSellersContent {
  eyebrow?: string;
  heading?: string;
  headingSize?: number;
  headingStyle?: string;
  textColor?: string;
  showDivider?: boolean;
  dividerWidth?: number;
  dividerThickness?: number;
  cardRadius?: number;
  cardBorder?: boolean;
  cardBorderColor?: string;
  cardShadow?: "none" | "sm" | "md" | "lg" | string;
  cards?: Array<CardProduct | null>;
}

const FALLBACK_CARDS: CardProduct[] = [
  {
    id: 1,
    brand: "EL BACÁN",
    name: "El Bacán Reserve Robusto",
    boxInfo: "Box of 20",
    origin: "Nicaragua",
    shape: "Robusto 5x52",
    badge: "FEATURED",
    image: "/hero-products.jpg",
  },
  {
    id: 2,
    brand: "PERDOMO",
    name: "Perdomo Lot 23 Toro",
    boxInfo: "Box of 24",
    origin: "Nicaragua",
    shape: "Toro 6x50",
    badge: "BEST SELLER",
    image: "/hero-products.jpg",
  },
  {
    id: 3,
    brand: "ARTURO FUENTE",
    name: "Arturo Fuente Gran Reserva",
    boxInfo: "Box of 25",
    origin: "Dominican Rep.",
    shape: "Corona 5.5x44",
    image: "/hero-products.jpg",
  },
  {
    id: 4,
    brand: "ALTADIS",
    name: "Florida Retail Disposable Display",
    boxInfo: "Display of 10",
    origin: "USA Dist.",
    shape: "10-Count Counter",
    badge: "FAST MOVER",
    image: "/hero-products.jpg",
  },
];

export function BestSellersSection({
  content,
}: {
  content?: Record<string, unknown>;
}) {
  const cfg = (content ?? {}) as BestSellersContent;

  const headingStyleClass =
    cfg.headingStyle === "regular"
      ? "font-normal not-italic"
      : cfg.headingStyle === "italic"
      ? "font-normal italic"
      : cfg.headingStyle === "bold-italic"
      ? "font-bold italic"
      : "font-bold not-italic";

  const shadowClass =
    cfg.cardShadow === "none"
      ? "shadow-none"
      : cfg.cardShadow === "md"
      ? "shadow-md"
      : cfg.cardShadow === "lg"
      ? "shadow-lg"
      : "shadow-sm";

  const cardRadius = Number(cfg.cardRadius ?? 12);
  const showBorder = cfg.cardBorder ?? true;
  const borderColor = cfg.cardBorderColor || "#e5dfd3";
  const textColor =
    typeof cfg.textColor === "string" && cfg.textColor.trim()
      ? cfg.textColor.trim()
      : undefined;

  const displayCards = [0, 1, 2, 3].map((idx) => {
    const picked = Array.isArray(cfg.cards) ? cfg.cards[idx] : null;
    return picked ?? FALLBACK_CARDS[idx];
  });

  return (
    <section
      style={textColor ? { color: textColor } : undefined}
      className="relative z-10 py-16 px-6 md:px-10 bg-transparent text-[#1a1714]"
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          {cfg.eyebrow !== "" && (
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8c6d48] mb-1.5">
              {cfg.eyebrow || "HIGH-TURNOVER RETAIL PICKS"}
            </p>
          )}
          <h2
            style={{
              fontSize: `${cfg.headingSize ?? 36}px`,
              ...(textColor ? { color: textColor } : {}),
            }}
            className={`font-serif text-[#1a1714] leading-tight ${headingStyleClass}`}
          >
            {cfg.heading || "Best Sellers"}
          </h2>

          {cfg.showDivider && (
            <div className="mt-4">
              <div
                style={{
                  width: `${cfg.dividerWidth ?? 100}%`,
                  height: `${cfg.dividerThickness ?? 1}px`,
                  ...(textColor ? { backgroundColor: textColor } : {}),
                }}
                className={textColor ? "opacity-50" : "bg-[#d6cfc2]"}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {displayCards.map((item, idx) => (
            <div
              key={`${item.id ?? idx}-${idx}`}
              style={{
                borderRadius: `${cardRadius}px`,
                borderWidth: showBorder ? "1px" : "0px",
                borderColor: showBorder ? borderColor : "transparent",
              }}
              className={`bg-white overflow-hidden flex flex-col justify-between transition-all ${shadowClass}`}
            >
              <div className="relative aspect-square bg-[#f2efe9] overflow-hidden">
                {item.badge && (
                  <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-[#1a1714] text-[#F8B93C] text-[9px] font-bold uppercase tracking-wider">
                    {item.badge}
                  </span>
                )}
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name || "Product"}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#8c6d48]">
                    {item.brand || "WHOLESALE"}
                  </p>
                  <h3 className="text-sm font-sans font-bold text-[#1a1714] mt-0.5 line-clamp-2">
                    {item.name}
                  </h3>
                  {item.boxInfo && (
                    <p className="text-[11px] text-[#6b6256] mt-0.5">
                      {item.boxInfo}
                    </p>
                  )}
                </div>

                <div className="space-y-2.5">
                  <Link
                    href="/wholesale"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-[#1a1714] hover:bg-[#8c6d48] text-white text-[10px] font-bold tracking-wider uppercase transition-colors"
                  >
                    <Lock className="w-3 h-3" />
                    Login for Price
                  </Link>

                  <div className="pt-2 border-t border-[#f0ece3] flex items-center justify-between text-[10px] text-[#6b6256]">
                    <span>{item.origin || "—"}</span>
                    <span>{item.shape || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/products"
            style={
              textColor
                ? { color: textColor, borderColor: textColor }
                : undefined
            }
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#1a1714] text-[#1a1714] hover:bg-[#1a1714] hover:text-white text-[11px] font-bold tracking-[0.15em] uppercase transition-colors"
          >
            View Full Wholesale Catalog →
          </Link>
        </div>
      </div>
    </section>
  );
}