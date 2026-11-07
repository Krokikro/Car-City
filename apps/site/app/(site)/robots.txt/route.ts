import { headers } from "next/headers";
import { refreshOverlay } from "@/lib/admin/overlay";
import { defaultRobots, indexable, originOf } from "@/lib/hosts";
import { themeForced } from "@/lib/theme";

export const dynamic = "force-dynamic";

// robots.txt: текст из админки (SEO → robots.txt) или собранный автоматически.
// На служебных адресах (Railway, копии под опрос) — полный запрет индексации.
export async function GET() {
  const seo = (await refreshOverlay()).seo;
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  const body = themeForced() || !indexable(seo, host)
    ? `User-agent: *\nDisallow: /\n\n# Служебный адрес. Основной сайт: ${originOf(seo)}\n`
    : (seo.robotsTxt.trim() ? seo.robotsTxt.trim() + "\n" : defaultRobots(seo));
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
