import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { dbEnabled, q } from "@/lib/db";
import { reviewKey, SOURCES } from "@/lib/reviews";

// Приём новых отзывов от внешнего сборщика (парсер, Make/n8n, скрипт). Отзывы попадают в админку в «Новые»,
// на сайт — только после кнопки «Опубликовать». Включается переменной REVIEWS_INGEST_TOKEN; пока её нет, адрес отвечает 404.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const token = process.env.REVIEWS_INGEST_TOKEN;
  if (!token || !dbEnabled()) return new NextResponse(null, { status: 404 });
  const got = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(got), b = Buffer.from(token);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: { reviews?: { source?: string; name?: string; date?: string; text?: string; url?: string }[] };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "json" }, { status: 400 }); }
  let added = 0;
  for (const r of (body.reviews ?? []).slice(0, 200)) {
    const source = String(r.source ?? ""), name = String(r.name ?? "").trim().slice(0, 120), text = String(r.text ?? "").trim().slice(0, 5000), date = String(r.date ?? "").slice(0, 60);
    if (!SOURCES.includes(source) || !name || text.length < 3) continue;
    const url = /^https?:\/\/\S+$/i.test(String(r.url ?? "")) ? String(r.url).slice(0, 500) : "";
    const k = reviewKey({ source, name, date, text });
    const rows = await q("INSERT INTO reviews (key, source, name, date_text, text, url, status, origin) VALUES ($1,$2,$3,$4,$5,$6,'new','feed') ON CONFLICT (key) DO NOTHING RETURNING id", [k, source, name, date, text, url]);
    added += rows.length;
  }
  return NextResponse.json({ added });
}
