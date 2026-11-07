// Статьи: счётчик просмотров и приём комментариев (комментарий публикуется после модерации в админке).
import { NextResponse } from "next/server";
import { addComment, addView, viewsOf, COMMENT_LIMITS } from "@/lib/articles/social";
import { clientIp, originAllowed, rateLimit } from "@/lib/lead/server/guard";

export const dynamic = "force-dynamic";

const str = (v: unknown, n: number) => (typeof v === "string" ? v.replace(/\s+\n/g, "\n").trim().slice(0, n) : "");

export async function GET(req: Request) {
  const path = new URL(req.url).searchParams.get("path") ?? "";
  try {
    return NextResponse.json({ ok: true, views: await viewsOf(path) }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, views: null });
  }
}

export async function POST(req: Request) {
  if (!originAllowed(req)) return NextResponse.json({ ok: false, error: "origin" }, { status: 403 });
  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "format" }, { status: 400 });
  }
  const path = str(b.path, 300);
  try {
    if (b.op === "view") return NextResponse.json({ ok: true, views: await addView(path) });
    if (b.op === "comment") {
      // ловушка для ботов и слишком быстрая отправка
      if (str(b.company_site, 100)) return NextResponse.json({ ok: true });
      if (typeof b.fill_ms !== "number" || b.fill_ms < 3000) return NextResponse.json({ ok: false, error: "too_fast" }, { status: 400 });
      const ip = clientIp(req);
      const rl = rateLimit(`c:${ip}`);
      if (rl !== true) return NextResponse.json({ ok: false, error: "rate" }, { status: 429, headers: { "retry-after": String(rl) } });
      const name = str(b.name, COMMENT_LIMITS.name).replace(/\s+/g, " ");
      const text = str(b.text, COMMENT_LIMITS.text);
      if (name.length < 2) return NextResponse.json({ ok: false, error: "name" }, { status: 400 });
      if (text.length < 5) return NextResponse.json({ ok: false, error: "text" }, { status: 400 });
      const ok = await addComment(path, str(b.lang, 5), name, text, ip);
      return NextResponse.json({ ok }, { status: ok ? 200 : 503 });
    }
  } catch (e) {
    console.error("article api:", (e as Error).message);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
  return NextResponse.json({ ok: false, error: "op" }, { status: 400 });
}
