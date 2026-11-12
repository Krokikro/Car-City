import { refreshOverlay } from "@/lib/admin/overlay";
import { sitemapUrls, sitemapXml } from "@/lib/sitemap";

export const revalidate = 300;

// sitemap.xml по тому же адресу, что на старом сайте. Состав и приоритеты — в админке: SEO → Sitemap.
export async function GET() {
  const ov = await refreshOverlay();
  return new Response(sitemapXml(sitemapUrls(ov)), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
