// Снимок SEO старого сайта car-city.pro перед переездом: все адреса (sitemap + обход ссылок), статус, title,
// description, H1, canonical, robots, OG, картинки из image_sitemap, файлы (pdf), коды верификации и счётчики.
// Результат — content/seo/baseline.json. Админка сравнивает с ним новый сайт (раздел «Переезд»).
// Запуск: node scripts/seo-baseline.mjs [https://car-city.pro]
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ORIGIN = (process.argv[2] || "https://car-city.pro").replace(/\/$/, "");
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "content", "seo", "baseline.json");
const MAX = 1500;
const UA = "Mozilla/5.0 (compatible; CarCityMigrationBot/1.0; +https://car-city.pro)";

const dec = (s = "") => s.replace(/&quot;/g, '"').replace(/&#039;|&#39;/g, "'").replace(/&laquo;/g, "«").replace(/&raquo;/g, "»").replace(/&nbsp;/g, " ").replace(/&ndash;/g, "–").replace(/&mdash;/g, "—").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
const meta = (h, attr, name) => { const m = h.match(new RegExp(`<meta[^>]+${attr}=["']${name}["'][^>]*>`, "i")); return m ? dec(m[0].match(/content=["']([^"']*)["']/i)?.[1]) : undefined; };
const strip = (s) => dec(s.replace(/<[^>]+>/g, " "));

async function get(url, method = "GET") {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { method, redirect: "manual", headers: { "user-agent": UA }, signal: AbortSignal.timeout(25000) });
      return { status: r.status, location: r.headers.get("location"), type: r.headers.get("content-type") || "", text: method === "GET" && /html|xml/.test(r.headers.get("content-type") || "") ? await r.text() : "" };
    } catch (e) { if (i === 2) return { status: 0, error: String(e) }; await new Promise((r) => setTimeout(r, 1500)); }
  }
}
const locs = (xml) => [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
const norm = (u) => { try { const x = new URL(u, ORIGIN + "/"); if (x.origin !== ORIGIN) return null; x.hash = ""; return x.toString(); } catch { return null; } };
const skip = (u) => /\/(assets|manager|core|connectors)\/|\/index\.php|[?&](utm_|openstat|from=)|\.(jpe?g|png|gif|webp|svg|ico|css|js|woff2?|ttf|mp4|zip)(\?|$)/i.test(u);

const home = await get(ORIGIN + "/");
const sitemap = locs((await get(ORIGIN + "/sitemap.xml")).text || "");
const imgXml = (await get(ORIGIN + "/image_sitemap.xml")).text || "";
const images = [...imgXml.matchAll(/<image:loc>\s*([^<\s]+)\s*<\/image:loc>/g)].map((m) => m[1]);
const robots = (await get(ORIGIN + "/robots.txt")).text || "";

const queue = [...new Set([ORIGIN + "/", ...sitemap.map(norm).filter(Boolean)])];
const seen = new Set(queue);
const pages = [];
const files = new Set();
let i = 0;
async function worker() {
  while (i < queue.length && pages.length < MAX) {
    const url = queue[i++];
    const r = await get(url);
    const p = { url, path: new URL(url).pathname + new URL(url).search, status: r.status, inSitemap: sitemap.includes(url) };
    if (r.location) {
      p.location = r.location;
      // старый сайт отдаёт редирект на http:// — идём по нему на https, чтобы снять и конечную страницу
      const to = norm(r.location.replace(/^http:\/\//i, "https://"));
      if (to && !seen.has(to) && !skip(to)) { seen.add(to); queue.push(to); }
    }
    if (r.status === 200 && /html/.test(r.type)) {
      const h = r.text;
      p.title = dec(h.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
      p.description = meta(h, "name", "description");
      p.keywords = meta(h, "name", "keywords");
      p.robots = meta(h, "name", "robots");
      p.canonical = h.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1];
      p.h1 = (h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] ? strip(h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)[1]) : undefined;
      p.ogTitle = meta(h, "property", "og:title");
      p.ogDescription = meta(h, "property", "og:description");
      p.ogImage = meta(h, "property", "og:image");
      p.words = strip(h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, "")).split(" ").length;
      for (const m of h.matchAll(/href=["']([^"'#]+)["']/gi)) {
        const u = norm(m[1]);
        if (!u) continue;
        if (/\.(pdf|docx?|xlsx?)(\?|$)/i.test(u)) { files.add(u); continue; }
        if (skip(u) || seen.has(u)) continue;
        seen.add(u); queue.push(u);
      }
    }
    pages.push(p);
    if (pages.length % 25 === 0) console.log(pages.length, "/", queue.length);
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
const fileList = [];
for (const u of files) { const r = await get(u, "HEAD"); fileList.push({ url: u, path: new URL(u).pathname, status: r.status }); }

const h = home.text || "";
const out = {
  origin: ORIGIN,
  takenAt: new Date().toISOString(),
  head: {
    yandexVerification: meta(h, "name", "yandex-verification"),
    googleVerification: meta(h, "name", "google-site-verification"),
    metrika: h.match(/mc\.yandex\.ru\/watch\/(\d+)|ym\((\d+)/)?.slice(1).find(Boolean),
    ga: h.match(/gtag\/js\?id=([A-Z0-9-]+)/)?.[1],
    gtm: h.match(/GTM-[A-Z0-9]+/)?.[0],
    icons: [...h.matchAll(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*>/gi)].map((m) => m[0]),
  },
  robots,
  sitemap,
  images,
  files: fileList,
  pages: pages.sort((a, b) => a.path.localeCompare(b.path)),
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(`готово: ${pages.length} страниц, ${images.length} картинок, ${fileList.length} файлов → ${OUT}`);
