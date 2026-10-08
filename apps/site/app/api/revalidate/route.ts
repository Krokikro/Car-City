import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { refreshOverlay } from "@/lib/admin/overlay";

export const dynamic = "force-dynamic";

// Вызывается самим сервером после запуска (instrumentation.ts): страницы, собранные при деплое из файлов,
// пересобираются с правками из базы. Секрет — ADMIN_SECRET_KEY или адрес базы.
function secret() {
  return process.env.ADMIN_SECRET_KEY || process.env.DATABASE_URL || "";
}

export async function POST(req: Request) {
  const want = secret();
  const got = req.headers.get("x-revalidate-secret") || "";
  if (!want || got.length !== want.length || !timingSafeEqual(Buffer.from(got), Buffer.from(want))) return NextResponse.json({ ok: false }, { status: 401 });
  await refreshOverlay(true);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
