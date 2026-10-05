import { allDocs } from "@/lib/docs";
import { LANGS } from "@/lib/i18n";

export const dynamic = "force-static";

export function GET() {
  const ru = ["/", "/sitemap", ...allDocs().keys()].filter((p, i, a) => a.indexOf(p) === i);
  const urls = LANGS.flatMap((l) => ru.map((p) => (l === "ru" ? p : `/${l}${p === "/" ? "" : p}`)));
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((p) => `  <url><loc>https://car-city.pro${encodeURI(p === "/" ? "" : p)}</loc></url>`)
    .join("\n")}\n</urlset>\n`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
