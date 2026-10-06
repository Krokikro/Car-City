import type { Metadata, Viewport } from "next";
import "@fontsource-variable/unbounded";
import "@fontsource-variable/onest";
import "@fontsource/jetbrains-mono/300.css";
import "@fontsource/jetbrains-mono/400.css";
import "@car-city/tokens/tokens.css";
import "./styles/base.css";
import "./styles/header.css";
import "./styles/hero.css";
import "./styles/sections.css";
import "./styles/pages.css";
import "./styles/lead.css";
import "./styles/v2.css";
import { gfxDetectScript } from "@/lib/gfx";
import { company } from "@/lib/content";
import { asset } from "@/lib/i18n";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { Analytics } from "@/components/analytics/Analytics";
import { CookieNotice } from "@/components/CookieNotice";

// Шрифты лежат в проекте (@fontsource): сборка не ходит в Google Fonts. Наборы cyrillic-ext/latin-ext для ky/kk/uz
// подключаются браузером по unicode-range, только когда нужны.

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
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: gfxDetectScript }} />
      </head>
      <body>
        {children}
        <MotionRoot />
        <CookieNotice />
        <Analytics />
      </body>
    </html>
  );
}
