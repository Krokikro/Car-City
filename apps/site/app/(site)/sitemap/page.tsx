import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SitemapView } from "@/components/page/SitemapView";
import { alternates } from "@/lib/meta";
import { refreshOverlay } from "@/lib/admin/overlay";

export const revalidate = 300;

// title и description — как на старом car-city.pro/sitemap (сверено 16.11.2026 перед переездом)
export const metadata: Metadata = { title: { absolute: "Карта сайта | Car-City - аренда авто под такси" }, description: "Карта сайта. Car-City - аренда авто под такси в Москве с выкупом, без залога", alternates: alternates("/sitemap", "ru") };

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
