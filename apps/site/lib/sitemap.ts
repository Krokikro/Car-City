// Карта сайта для поисковиков: какие адреса, с какими приоритетами, датой изменения и переводами (hreflang).
// Управляется из админки: SEO → Sitemap (языки, исключения, приоритеты) и SEO отдельных страниц (исключить, noindex).
import { allDocs } from "./docs";
import { LANGS, type Lang } from "./i18n";
import { pageKey, type Overlay } from "./admin/overlay";
import { matchMask, pageType } from "./site-settings";
import { langPath, lc } from "./seo";
import { originOf } from "./hosts";

export interface SmUrl { loc: string; lastmod?: string; priority: number; changefreq: string; alt: [string, string][] }

const BUILD_TIME = new Date().toISOString();

export function sitemapUrls(ov: Overlay): SmUrl[] {
  const s = ov.seo;
  const o = originOf(s);
  const langs = LANGS.filter((l) => s.sitemap.langs.includes(l));
  const ruDocs = allDocs("ru", ov);
  // какие страницы реально есть на каждом языке (непереведённые не дублируем)
  const has = new Map<Lang, Set<string>>();
  for (const l of langs) {
    const set = new Set<string>(["/", "/sitemap"]);
    for (const [p, d] of allDocs(l, ov)) if (l === "ru" || d.lang === l) set.add(p);
    has.set(l, set);
  }
  const paths = ["/", "/sitemap", ...ruDocs.keys()].filter((p, i, a) => a.indexOf(p) === i);
  const out: SmUrl[] = [];
  for (const p of paths) {
    const doc = ruDocs.get(p);
    if (doc?.kind === undefined && p !== "/" && p !== "/sitemap") continue;
    const type = pageType(lc(p), doc?.kind);
    const avail = langs.filter((l) => has.get(l)?.has(p));
    for (const l of avail) {
      const ps = ov.seoPages.get(pageKey(l, lc(p))) ?? {};
      if (ps.sitemapExclude || ps.noindex || (ps.canonical && lc(ps.canonical) !== langPath(p, l) && !ps.canonical.endsWith(langPath(p, l)))) continue;
      if (s.sitemap.exclude.some((m) => matchMask(lc(p), m) || matchMask(langPath(p, l), m))) continue;
      out.push({
        loc: o + encodeURI(langPath(p, l) === "/" ? "/" : langPath(p, l)),
        lastmod: ov.updated.get(pageKey(l, lc(p))) ?? BUILD_TIME,
        priority: ps.priority ?? s.sitemap.priority[type],
        changefreq: ps.changefreq ?? s.sitemap.changefreq[type],
        alt: s.hreflang && !ps.noHreflang && avail.length > 1 ? [...avail.map((x) => [x, o + encodeURI(langPath(p, x))] as [string, string]), ["x-default", o + encodeURI(lc(p))]] : [],
      });
    }
  }
  return out;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function sitemapXml(urls: SmUrl[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map((u) => `  <url>
    <loc>${esc(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod.slice(0, 10)}</lastmod>` : ""}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority.toFixed(1)}</priority>${u.alt.map(([l, h]) => `\n    <xhtml:link rel="alternate" hreflang="${l}" href="${esc(h)}"/>`).join("")}
  </url>`).join("\n")}
</urlset>
`;
}
