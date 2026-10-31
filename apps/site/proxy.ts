import { NextResponse, type NextRequest } from "next/server";

// Светлая копия сайта (NEXT_PUBLIC_THEME=light) — только для опроса: без админки и без индексации поисковиками.
// В обычной (тёмной) сборке прокси ничего не делает.
const LIGHT = process.env.NEXT_PUBLIC_THEME === "light";

export function proxy(req: NextRequest) {
  if (!LIGHT) return NextResponse.next();
  if (req.nextUrl.pathname === "/admin" || req.nextUrl.pathname.startsWith("/admin/")) {
    return new NextResponse("Not found", { status: 404, headers: { "X-Robots-Tag": "noindex, nofollow" } });
  }
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  matcher: ["/((?!_next/|cars/|cars-light/|cars-light-a/|classes/|steps/|brand/|favicon).*)"],
};
