import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_TC } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const notoTC = Noto_Sans_TC({ variable: "--font-noto-tc", subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "計番 廣東牌 · Mahjong Scorer",
  description: "Snap a photo of your winning Hong Kong mahjong hand and get the 番 breakdown instantly.",
};

// Mobile Safari (KAN-219): viewport-fit=cover exposes env(safe-area-inset-*).
// Pinch zoom stays on — double-tap zoom is handled with touch-action in globals.css.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${notoTC.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0b1a14] text-[#f5f1e6]">{children}</body>
    </html>
  );
}
