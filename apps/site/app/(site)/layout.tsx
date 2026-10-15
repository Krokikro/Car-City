import type { Metadata, Viewport } from "next";
import "@fontsource-variable/unbounded";
import "@fontsource-variable/onest";
import "@fontsource/jetbrains-mono/300.css";
import "@fontsource/jetbrains-mono/400.css";
import "@car-city/tokens/tokens.css";
import "../styles/base.css";
import "../styles/header.css";
import "../styles/hero.css";
import "../styles/sections.css";
import "../styles/pages.css";
import "../styles/lead.css";
import "../styles/v2.css";
import "../styles/v3.css";
import "../styles/vykup.css";
import "../styles/light.gen.css";
import "../styles/light.css";
import { LIGHT, LIGHT_VARIANT } from "@/lib/theme";
import { gfxDetectScript } from "@/lib/gfx";
import { company } from "@/lib/content";
import { asset } from "@/lib/i18n";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { ToTop } from "@/components/motion/ToTop";
import { OffscreenPause } from "@/components/motion/OffscreenPause";
import { ScrollHints } from "@/components/motion/ScrollHints";
import { LeadModal } from "@/components/LeadModal";
import { ChatWidget } from "@/components/ChatWidget";
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
  // светлая копия для опроса — не индексируем, чтобы не было дублей
  ...(LIGHT ? { robots: { index: false, follow: false } } : {}),
};

export const viewport: Viewport = {
  themeColor: LIGHT ? "#F1F2F4" : "#0B0B0C",
  colorScheme: LIGHT ? "light" : "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-theme={LIGHT ? "light" : undefined} data-variant={LIGHT ? LIGHT_VARIANT : undefined} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: gfxDetectScript }} />
      </head>
      <body>
        {children}
        <MotionRoot />
        <OffscreenPause />
        <ScrollHints />
        <ToTop />
        <LeadModal />
        <CookieNotice />
        <ChatWidget />
        <Analytics />
      </body>
    </html>
  );
}
