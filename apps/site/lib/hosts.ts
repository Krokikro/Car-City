// Какой домен можно индексировать. Сайт одновременно открыт на car-city.pro и на служебных адресах Railway —
// служебные закрыты от поисковиков (noindex + запрет в robots.txt), чтобы не было дублей при переезде.
import type { SeoSettings } from "./site-settings";

export const hostOf = (h: string | null | undefined) => (h || "").split(",")[0].trim().toLowerCase().replace(/:\d+$/, "");

export function indexable(seo: Pick<SeoSettings, "indexHosts" | "noindexAll">, host: string) {
  if (seo.noindexAll) return false;
  const h = hostOf(host);
  return seo.indexHosts.some((x) => {
    const want = x.trim().toLowerCase();
    return want && (h === want || (want.startsWith("*.") && h.endsWith(want.slice(1))));
  });
}

/** Адрес robots/sitemap по умолчанию — основной домен из настроек */
export const originOf = (seo: Pick<SeoSettings, "canonicalOrigin">) => (seo.canonicalOrigin || "https://car-city.pro").replace(/\/$/, "");

export function defaultRobots(seo: SeoSettings) {
  const o = originOf(seo);
  return [
    "User-agent: *",
    "Disallow: /admin",
    "Disallow: /api/",
    "Disallow: /lab",
    "Disallow: /spasibo",
    "Disallow: /*?",
    "Allow: /*?page=",
    "Allow: /",
    "",
    "# Яндекс: метки и служебные параметры не создают дублей",
    "User-agent: Yandex",
    "Disallow: /admin",
    "Disallow: /api/",
    "Disallow: /lab",
    "Disallow: /spasibo",
    "Clean-param: utm_source&utm_medium&utm_campaign&utm_content&utm_term&yclid&gclid&fbclid&from&openstat&gfx",
    "Allow: /",
    "",
    `Sitemap: ${o}/sitemap.xml`,
    ...(seo.sitemap.images ? [`Sitemap: ${o}/image_sitemap.xml`] : []),
    `Host: ${o}`,
    "",
  ].join("\n");
}
