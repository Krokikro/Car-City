import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SitemapView } from "@/components/page/SitemapView";
import { buildMeta } from "@/lib/seo";
import { refreshOverlay } from "@/lib/admin/overlay";

export const revalidate = 300;

// title и description — как на старом car-city.pro/sitemap (сверено 16.11.2026 перед переездом)
// hreflang — через общие правила SEO: на закрытые от индексации языки не ссылаемся (правка 20.11.2026)
export async function generateMetadata(): Promise<Metadata> {
  const ov = await refreshOverlay();
  return buildMeta({ ov, lang: "ru", path: "/sitemap", title: "Карта сайта | Car-City - аренда авто под такси", description: "Карта сайта. Car-City - аренда авто под такси в Москве с выкупом, без залога" });
}

export default async function Sitemap() {
  const ov = await refreshOverlay();
  return (
    <>
      <Header />
      <SitemapView ov={ov} />
      <Footer />
    </>
  );
}
