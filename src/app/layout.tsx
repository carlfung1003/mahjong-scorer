import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_TC } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const notoTC = Noto_Sans_TC({ variable: "--font-noto-tc", subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "計番 廣東牌 · Mahjong Scorer",
  description: "Snap a photo of your winning Hong Kong mahjong hand and get the 番 breakdown instantly.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${notoTC.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0b1a14] text-[#f5f1e6]">{children}</body>
    </html>
  );
}
