import type { Metadata, Viewport } from "next";
import { Unbounded, Onest, JetBrains_Mono } from "next/font/google";
import "@car-city/tokens/tokens.css";
import "./styles/base.css";
import "./styles/header.css";
import "./styles/hero.css";
import "./styles/sections.css";
import "./styles/pages.css";
import { gfxDetectScript } from "@/lib/gfx";
import { company } from "@/lib/content";
import { asset } from "@/lib/i18n";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { Cursor } from "@/components/motion/Cursor";

// Все три шрифта содержат кириллицу кыргызского и казахского и латиницу узбекского (проверено 2026-10-05).
// Предзагружаем только кириллицу и латиницу: ext-наборы для ky/kk/uz подтянутся по unicode-range, когда понадобятся.
const display = Unbounded({ subsets: ["cyrillic", "latin"], variable: "--ff-display", display: "optional" });
const text = Onest({ subsets: ["cyrillic", "latin"], variable: "--ff-text", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["cyrillic", "latin"], weight: ["300", "400"], variable: "--ff-mono", display: "swap", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(company.domain),
  title: {
    default: "Аренда авто под такси с выкупом в Москве — Car City",
    template: "%s — Car City",
  },
  description: "Аренда машин для работы в такси и выкуп без кредита. Эконом, Комфорт, Комфорт+, Грузовой. Машина в день заявки.",
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "ru_RU", siteName: "Car City" },
  icons: { icon: asset("/brand/emblem-96.png"), apple: asset("/brand/emblem-192.png") },
};

export const viewport: Viewport = {
  themeColor: "#0B0B0C",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${display.variable} ${text.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: gfxDetectScript }} />
      </head>
      <body>
        {children}
        <MotionRoot />
        <Cursor />
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
