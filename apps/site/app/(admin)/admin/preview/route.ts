import { draftMode } from "next/headers";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/admin/auth";
import { can } from "@/lib/admin/roles";

// Предпросмотр: включает режим черновиков в браузере сотрудника и открывает страницу сайта.
export async function GET(req: Request) {
  const s = await getSession();
  if (!s || s.stage !== "full" || !can(s.user.role, "content", "read")) return NextResponse.redirect(new URL("/admin/login", req.url));
  const to = new URL(req.url).searchParams.get("to") || "/";
  // только внутренние адреса сайта
  const path = to.startsWith("/") && !to.startsWith("//") && !to.startsWith("/\\") ? to : "/";
  (await draftMode()).enable();
  return new NextResponse(null, { status: 307, headers: { location: path, "cache-control": "no-store" } });
}
