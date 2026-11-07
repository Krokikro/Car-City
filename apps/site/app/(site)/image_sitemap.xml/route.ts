import { refreshOverlay } from "@/lib/admin/overlay";
import { allDocs } from "@/lib/docs";
import { carImages } from "@/lib/car-images";
import { newsImages } from "@/lib/news-images";
import { fleet } from "@/lib/fleet";
import { originOf } from "@/lib/hosts";
import { lc } from "@/lib/seo";

export const revalidate = 300;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Карта картинок — на старом сайте была по этому же адресу (image_sitemap.xml), её знает Яндекс.Вебмастер.
export async function GET() {
  const ov = await refreshOverlay();
  const o = originOf(ov.seo);
  if (!ov.seo.sitemap.images) return new Response("Not found", { status: 404 });
  const pages = new Map<string, { loc: string; title: string }[]>();
  const add = (page: string, loc: string, title: string) => { const k = o + encodeURI(lc(page)); (pages.get(k) ?? pages.set(k, []).get(k)!).push({ loc: o + loc, title }); };
  for (const c of fleet) {
    if (!carImages[c.slug]) continue;
    const img = `/cars/${c.slug}-1200.webp`;
    add("/", img, c.name);
    if (c.rent) add(c.rent, img, `${c.name} в аренду под такси`);
    if (c.buy) add(c.buy, img, `${c.name} в выкуп`);
  }
  for (const [p, d] of allDocs("ru", ov)) {
    const slug = p.split("/").pop() ?? "";
    if (d.kind === "article" && newsImages[slug]) add(p, `/news/${slug}-1200.webp`, d.h1);
  }
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${[...pages].map(([loc, imgs]) => `  <url>\n    <loc>${esc(loc)}</loc>\n${imgs.map((i) => `    <image:image><image:loc>${esc(i.loc)}</image:loc><image:title>${esc(i.title)}</image:title></image:image>`).join("\n")}\n  </url>`).join("\n")}
</urlset>
`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
