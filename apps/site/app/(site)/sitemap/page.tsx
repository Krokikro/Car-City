import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SitemapView } from "@/components/page/SitemapView";
import { alternates } from "@/lib/meta";
import { refreshOverlay } from "@/lib/admin/overlay";

export const revalidate = 300;

export const metadata: Metadata = { title: "Карта сайта", alternates: alternates("/sitemap", "ru") };

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
