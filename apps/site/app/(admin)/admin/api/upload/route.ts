import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { audit, getSession, twoFaRequired } from "@/lib/admin/auth";
import { can } from "@/lib/admin/roles";
import { q } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX = 12 * 1024 * 1024;
const OK = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

// Загрузка в медиатеку. Картинки сжимаются в WebP не шире 2400 px; GIF и SVG не принимаем.
export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.stage !== "full" || (!s.user.totpOn && twoFaRequired()) || !can(s.user.role, "media", "write")) return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  // защита от подделки запроса с чужого сайта
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return NextResponse.json({ error: "Запрос с чужого сайта" }, { status: 403 });
  const form = await req.formData().catch(() => null);
  const files = (form?.getAll("file") ?? []).filter((x): x is File => x instanceof File);
  if (!files.length) return NextResponse.json({ error: "Файл не выбран" }, { status: 400 });
  const done: { id: string; name: string }[] = [];
  const failed: string[] = [];
  for (const file of files.slice(0, 20)) {
    try {
      if (file.size > MAX || !OK.has(file.type) || file.type === "image/gif") throw new Error("формат");
      const src = Buffer.from(await file.arrayBuffer());
      const img = sharp(src, { failOn: "error" }).rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true });
      const { data, info } = await img.webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
      const id = randomUUID().replace(/-/g, "").slice(0, 16);
      const name = file.name.replace(/\.[a-z0-9]+$/i, "").slice(0, 80) + ".webp";
      await q("INSERT INTO media (id, name, mime, w, h, bytes, size, by) VALUES ($1,$2,'image/webp',$3,$4,$5,$6,$7)", [id, name, info.width, info.height, data, data.length, s.user.email]);
      done.push({ id, name });
    } catch {
      failed.push(file.name);
    }
  }
  if (done.length) await audit(s.user, "Загружены файлы в медиатеку", "media", done.map((d) => d.id).join(","), undefined, { count: done.length });
  return NextResponse.json({ done, failed });
}
