import type { Metadata, Viewport } from "next";
import { refreshOverlay } from "@/lib/admin/overlay";
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
import { siteTheme, themeForced } from "@/lib/theme";
import { textsJson } from "@/lib/texts";
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

const surveyCopy = themeForced();

// Общие метаданные: коды верификации поисковиков и подпись сайта — из админки (SEO → Счётчики и верификация)
export async function generateMetadata(): Promise<Metadata> {
  const seo = (await refreshOverlay()).seo;
  const other: Record<string, string> = {};
  if (seo.bingVerification) other["msvalidate.01"] = seo.bingVerification;
  if (seo.mailruVerification) other["pmail-verification"] = seo.mailruVerification;
  return {
    metadataBase: new URL(seo.canonicalOrigin || company.domain),
    title: {
      default: "Аренда авто под такси с выкупом в Москве — Car City",
      template: "%s — Car City",
    },
    description: seo.defaultDescription,
    applicationName: seo.siteName,
    alternates: { canonical: "/" },
    openGraph: { type: "website", locale: "ru_RU", siteName: seo.siteName },
    // значки по тем же адресам, что на старом сайте (favicon.svg, carcity-16/32px.ico) + свои
    icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }, { url: "/carcity-32px.ico", sizes: "32x32" }, { url: "/carcity-16px.ico", sizes: "16x16" }, { url: asset("/brand/emblem-96.png") }], apple: asset("/brand/emblem-192.png") },
    verification: { yandex: seo.yandexVerification || undefined, google: seo.googleVerification || undefined, other },
    // копии сайта под опрос (тема закреплена при сборке) — не индексируем, чтобы не было дублей
    ...(surveyCopy || seo.noindexAll ? { robots: { index: false, follow: false } } : {}),
  };
}

export async function generateViewport(): Promise<Viewport> {
  await refreshOverlay();
  const light = siteTheme().theme === "light";
  return { themeColor: light ? "#F1F2F4" : "#0B0B0C", colorScheme: light ? "light" : "dark" };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const ov = await refreshOverlay();
  const { theme, variant } = siteTheme();
  const seo = ov.seo;
  const light = theme === "light";
  return (
    <html lang="ru" data-theme={light ? "light" : undefined} data-variant={light ? variant : undefined}
      data-ym={seo.metrikaId || undefined} data-ga={seo.gaId || undefined} data-gtm={seo.gtmId || undefined} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: gfxDetectScript }} />
        {/* правки текстов из админки — чтобы клиентские компоненты рисовали то же, что сервер */}
        <script id="cc-texts" type="application/json" dangerouslySetInnerHTML={{ __html: textsJson() }} />
        {/* свой код в <head> из админки (SEO → Счётчики): задаёт только администратор */}
        {seo.headHtml && <HeadHtml html={seo.headHtml} />}
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

/** Произвольные meta/link/script из админки. React не вставляет сырой HTML в <head>, поэтому раскладываем по тегам. */
function HeadHtml({ html }: { html: string }) {
  const tags = [...html.matchAll(/<(meta|link)\b([^>]*?)\/?>|<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].slice(0, 30);
  const attrs = (raw: string) => Object.fromEntries([...raw.matchAll(/([a-zA-Z:-]+)\s*=\s*["']([^"']*)["']/g)].map((m) => [m[1] === "charset" ? "charSet" : m[1] === "http-equiv" ? "httpEquiv" : m[1] === "crossorigin" ? "crossOrigin" : m[1], m[2]]));
  return (
    <>
      {tags.map((m, i) => {
        if (m[1]?.toLowerCase() === "meta") return <meta key={i} {...attrs(m[2])} />;
        if (m[1]?.toLowerCase() === "link") return <link key={i} {...attrs(m[2])} />;
        const a = attrs(m[3] ?? "");
        return a.src ? <script key={i} {...a} async /> : <script key={i} {...a} dangerouslySetInnerHTML={{ __html: m[4] ?? "" }} />;
      })}
    </>
  );
}
