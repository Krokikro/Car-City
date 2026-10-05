import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SitemapView } from "@/components/page/SitemapView";
import { alternates } from "@/lib/meta";

export const metadata: Metadata = { title: "Карта сайта", alternates: alternates("/sitemap", "ru") };

export default function Sitemap() {
  return (
    <>
      <Header />
      <SitemapView />
      <Footer />
    </>
  );
}
