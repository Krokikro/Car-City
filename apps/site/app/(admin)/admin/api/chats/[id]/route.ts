import { NextResponse } from "next/server";
import { audit, getSession, twoFaRequired } from "@/lib/admin/auth";
import { can } from "@/lib/admin/roles";
import { q } from "@/lib/db";
import { chatForUser } from "@/lib/chat/admin";
import { messages, sendReply } from "@/lib/chat/server";

export const dynamic = "force-dynamic";

async function who() {
  const s = await getSession();
  if (!s || s.stage !== "full" || (!s.user.totpOn && twoFaRequired()) || !can(s.user, "chats", "read")) return null;
  return s.user;
}

// Новые сообщения диалога (опрос раз в несколько секунд) и отметка о прочтении
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await who();
  if (!user) return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  const { id } = await params;
  const chat = await chatForUser(user, id);
  if (!chat) return NextResponse.json({ error: "Нет такого диалога" }, { status: 404 });
  const after = Number(new URL(req.url).searchParams.get("after")) || 0;
  const list = await messages(id, after);
  if (chat.unread) await q("UPDATE chats SET unread = 0 WHERE id = $1", [id]);
  return NextResponse.json({ messages: list, chat: { status: chat.status, name: chat.name, phone: chat.phone } }, { headers: { "cache-control": "no-store" } });
}

// Ответ менеджера
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await who();
  if (!user || !can(user, "chats", "write")) return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return NextResponse.json({ error: "Запрос с чужого сайта" }, { status: 403 });
  const { id } = await params;
  const chat = await chatForUser(user, id);
  if (!chat) return NextResponse.json({ error: "Нет такого диалога" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { text?: string };
  const text = (body.text ?? "").trim();
  if (!text) return NextResponse.json({ error: "Пустое сообщение" }, { status: 400 });
  if ([...text].length > 4000) return NextResponse.json({ error: "Не больше 4000 символов" }, { status: 400 });
  // ничей диалог — забирает тот, кто ответил
  if (!chat.assignee) await q("UPDATE chats SET assignee = $2 WHERE id = $1 AND assignee IS NULL", [id, user.id]);
  if (chat.lead_id) await q("UPDATE leads SET assignee = COALESCE(assignee, $2), status = CASE WHEN status = 'new' THEN 'call' ELSE status END, updated_at = now() WHERE id = $1", [chat.lead_id, user.id]);
  const r = await sendReply(chat, text, user.name || user.login || "Менеджер");
  if (chat.channel !== "site") await audit(user, "Ответ в чате", "chat", id);
  return NextResponse.json({ ok: true, error: r.error });
}
