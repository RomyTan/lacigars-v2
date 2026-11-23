import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StorefrontShell } from "@/components/StorefrontShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="font-sans bg-[#fdfbf7] text-[#2b2621] antialiased selection:bg-[#F8B93C] selection:text-[#1a1714]">
        <StorefrontShell>{children}</StorefrontShell>
      </body>
    </html>
  );
}