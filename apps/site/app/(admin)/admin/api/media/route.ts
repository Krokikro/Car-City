import { NextResponse } from "next/server";
import { getSession } from "@/lib/admin/auth";
import { can } from "@/lib/admin/roles";
import { q } from "@/lib/db";

export const dynamic = "force-dynamic";

// Список картинок для окна выбора в редакторе
export async function GET() {
  const s = await getSession();
  if (!s || s.stage !== "full" || !can(s.user.role, "content", "read")) return NextResponse.json({ items: [] }, { status: 401 });
  const items = await q("SELECT id, name, w, h FROM media ORDER BY at DESC LIMIT 200");
  return NextResponse.json({ items }, { headers: { "cache-control": "no-store" } });
}
