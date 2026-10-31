import { NextResponse, type NextRequest } from "next/server";
import { countHit, findRedirect, rules } from "@/lib/edge-rules";
import { hostOf, indexable } from "@/lib/hosts";

// Перед каждым запросом к сайту (не к статике):
// 1) www → основной домен; 2) редиректы из админки (301/302/410); 3) адреса с заглавными → строчные (301);
// 4) служебные домены (Railway) и копии под опрос — X-Robots-Tag: noindex; 5) путь для журнала 404.
const FORCED = process.env.NEXT_PUBLIC_THEME === "light" || process.env.NEXT_PUBLIC_THEME === "dark";

export async function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const path = url.pathname;
  const host = hostOf(req.headers.get("x-forwarded-host") || req.headers.get("host"));
  const isAdmin = path === "/admin" || path.startsWith("/admin/");

  // копии сайта под опрос — без админки
  if (FORCED && isAdmin) return new NextResponse("Not found", { status: 404, headers: { "X-Robots-Tag": "noindex, nofollow" } });
  if (isAdmin) return NextResponse.next();

  const s = await rules();
  const origin = (s.seo.canonicalOrigin || "https://car-city.pro").replace(/\/$/, "");
  const abs = (to: string) => (/^https?:\/\//i.test(to) ? to : (host.startsWith("www.") ? origin : `${url.protocol}//${req.headers.get("x-forwarded-host") || url.host}`) + (to.startsWith("/") ? to : "/" + to));

  // 1) www.car-city.pro → car-city.pro
  if (s.seo.wwwRedirect && host.startsWith("www.") && s.seo.indexHosts.includes(host.slice(4))) {
    return NextResponse.redirect(origin + path + url.search, 301);
  }

  // 2) редиректы из админки
  const hit = findRedirect(s, path, url.search);
  if (hit) {
    countHit(hit.rule.id);
    if (hit.rule.code === 410) return new NextResponse("Gone", { status: 410, headers: { "X-Robots-Tag": "noindex" } });
    const target = abs(hit.to || "/");
    // защита от петли: правило не должно вести само на себя
    if (new URL(target).pathname.toLowerCase() !== path.toLowerCase()) return NextResponse.redirect(target, hit.rule.code === 302 ? 302 : hit.rule.code === 307 ? 307 : hit.rule.code === 308 ? 308 : 301);
  }

  // 3) заглавные буквы в адресе → строчные, как делал старый сайт (только путь, параметры не трогаем)
  if (s.seo.lowercaseRedirect && /[A-ZА-ЯЁ]/.test(decodeURIComponent(path)) && !/\.[a-z0-9]{2,5}$/i.test(path)) {
    const u = url.clone();
    u.pathname = path.toLowerCase();
    return NextResponse.redirect(u, 301);
  }

  // 4–5) заголовки
  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("x-pathname", path + url.search);
  const res = NextResponse.next({ request: { headers: reqHeaders } });
  if (FORCED || !indexable(s.seo, host)) res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  matcher: ["/((?!_next/|cars/|cars-light/|cars-light-a/|classes/|steps/|brand/|video/|pages/|news/|news-light/|team/|owners/|promo/|media/|favicon|carcity-).*)"],
};
