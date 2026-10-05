import { NextResponse } from "next/server";

// Приём заявки. TODO: отправка в CRM и Telegram менеджерам (PRD 4, заявки) — когда будут доступы.
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Неверный формат" }, { status: 400 });
  }
  if (body.company_site) return NextResponse.json({ ok: true }); // бот
  const name = String(body.name ?? "").trim();
  const phone = String(body.phone ?? "").replace(/[^\d+]/g, "");
  if (name.length < 2) return NextResponse.json({ error: "Укажите имя" }, { status: 422 });
  if (phone.replace(/\D/g, "").length < 10) return NextResponse.json({ error: "Проверьте телефон" }, { status: 422 });
  if (body.consent !== "on") return NextResponse.json({ error: "Нужно согласие на обработку данных" }, { status: 422 });
  console.info("lead", { name, phone: phone.slice(0, 4) + "…", at: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
