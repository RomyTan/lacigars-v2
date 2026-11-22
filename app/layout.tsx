import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { StorefrontShell } from "@/components/StorefrontShell";

const sansFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const serifFont = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Latin American Cigars Corp. | B2B Wholesale Tobacco Distributor",
  description:
    "Wholesale distributor of cigars, cigarettes, vapes, and accessories serving retailers across Florida.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sansFont.variable} ${serifFont.variable}`}>
      <body className="font-sans bg-[#fdfbf7] text-[#2b2621] antialiased selection:bg-[#F8B93C] selection:text-[#1a1714]">
        <StorefrontShell>{children}</StorefrontShell>
      </body>
    </html>
  );
}