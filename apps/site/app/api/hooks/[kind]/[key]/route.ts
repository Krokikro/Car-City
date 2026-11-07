import { NextResponse } from "next/server";
import { getIntegrations, hookKey } from "@/lib/admin/integrations";
import { addIncoming, addSystem, createChat, findChat, sendReply, setContact, type ChatChannel, type ChatRow } from "@/lib/chat/server";
import { dbEnabled } from "@/lib/db";

export const dynamic = "force-dynamic";

// Входящие сообщения мессенджеров → раздел «Чаты».
// Адрес: /api/hooks/{telegram|max|wazzup}/{ключ}. Ключ выдаёт админка («Интеграции»), без него запрос отклоняется.
// Telegram дополнительно проверяется по заголовку X-Telegram-Bot-Api-Secret-Token, MAX — по X-Max-Bot-Api-Secret.

const GREETING = "Здравствуйте! Это Car City. Напишите ваш вопрос — менеджер ответит здесь, обычно в течение 15 минут (с 9:00 до 21:00).";
const ok = () => NextResponse.json({ ok: true });

async function incoming(channel: ChatChannel, extId: string, text: string, who: { name?: string; phone?: string; meta?: Record<string, unknown> }, msgId?: string) {
  let chat: ChatRow | null = await findChat(channel, extId);
  const isNew = !chat;
  if (!chat) chat = await createChat({ channel, extId, name: who.name, phone: who.phone, meta: who.meta }, text);
  else if (who.phone && !chat.phone) await setContact(chat, who.name, who.phone);
  await addIncoming(chat, text, msgId);
  return { chat, isNew };
}

export async function POST(req: Request, { params }: { params: Promise<{ kind: string; key: string }> }) {
  const { kind, key } = await params;
  if (!dbEnabled() || !["telegram", "max", "wazzup"].includes(kind) || key !== hookKey(kind)) return NextResponse.json({ ok: false }, { status: 404 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return ok();
  const c = await getIntegrations();

  try {
    if (kind === "telegram") {
      if (req.headers.get("x-telegram-bot-api-secret-token") !== hookKey("tg-secret")) return NextResponse.json({ ok: false }, { status: 403 });
      if (!c.telegram.chats) return ok();
      const m = body.message as { message_id?: number; chat?: { id: number; type: string }; from?: { first_name?: string; last_name?: string; username?: string }; text?: string; caption?: string; contact?: { phone_number?: string; first_name?: string } } | undefined;
      if (!m?.chat || m.chat.type !== "private") return ok(); // группы менеджеров и каналы не трогаем
      const name = [m.from?.first_name, m.from?.last_name].filter(Boolean).join(" ") || m.from?.username || "";
      const meta = { username: m.from?.username ?? null };
      const ext = String(m.chat.id);
      if (m.contact?.phone_number) {
        const chat = await findChat("telegram", ext) ?? (await incoming("telegram", ext, "Поделился контактом", { name, meta })).chat;
        await setContact(chat, m.contact.first_name || name, m.contact.phone_number);
        return ok();
      }
      const text = (m.text ?? m.caption ?? "").trim() || "[файл или стикер — откройте переписку в Telegram]";
      if (text === "/start") {
        const existing = await findChat("telegram", ext);
        const chat = existing ?? (await createChat({ channel: "telegram", extId: ext, name, meta }, "Открыл бота"));
        await addSystem(chat.id, "Клиент открыл бота");
        await sendReply(chat, GREETING, "Бот");
        return ok();
      }
      await incoming("telegram", ext, text, { name, meta }, m.message_id ? String(m.message_id) : undefined);
      return ok();
    }

    if (kind === "max") {
      if (req.headers.get("x-max-bot-api-secret") !== hookKey("max-secret")) return NextResponse.json({ ok: false }, { status: 403 });
      if (!c.max.chats) return ok();
      const type = body.update_type as string;
      if (type === "bot_started") {
        const u = body.user as { user_id?: number; name?: string; first_name?: string } | undefined;
        const chatId = String(body.chat_id ?? "");
        if (!chatId) return ok();
        const existing = await findChat("max", chatId);
        const chat = existing ?? (await createChat({ channel: "max", extId: chatId, name: u?.name || u?.first_name }, "Открыл бота"));
        await addSystem(chat.id, "Клиент открыл бота");
        await sendReply(chat, GREETING, "Бот");
        return ok();
      }
      if (type !== "message_created") return ok();
      const m = body.message as { sender?: { user_id?: number; name?: string; first_name?: string; last_name?: string; username?: string; is_bot?: boolean }; recipient?: { chat_id?: number; chat_type?: string }; body?: { text?: string; mid?: string } } | undefined;
      if (!m || m.sender?.is_bot || (m.recipient?.chat_type && m.recipient.chat_type !== "dialog")) return ok();
      const ext = String(m.recipient?.chat_id ?? m.sender?.user_id ?? "");
      if (!ext) return ok();
      const name = m.sender?.name || [m.sender?.first_name, m.sender?.last_name].filter(Boolean).join(" ") || m.sender?.username || "";
      await incoming("max", ext, (m.body?.text ?? "").trim() || "[вложение — откройте переписку в MAX]", { name, meta: { userId: m.sender?.user_id ?? null } }, m.body?.mid);
      return ok();
    }

    // Wazzup: WhatsApp (и другие каналы Wazzup, если подключены)
    if (body.test) return ok();
    if (!c.wazzup.chats) return ok();
    const list = (body.messages as { messageId?: string; channelId?: string; chatType?: string; chatId?: string; text?: string; isEcho?: boolean; type?: string; contact?: { name?: string; phone?: string } }[] | undefined) ?? [];
    for (const m of list) {
      if (m.isEcho || !m.chatId || !m.chatType) continue; // isEcho — наше же исходящее
      const phone = m.chatType === "whatsapp" ? `+${m.chatId.replace(/\D/g, "")}` : m.contact?.phone;
      const text = (m.text ?? "").trim() || `[${m.type ?? "вложение"} — откройте переписку в WhatsApp]`;
      await incoming("whatsapp", m.chatId, text, { name: m.contact?.name, phone, meta: { chatType: m.chatType, channelId: m.channelId } }, m.messageId);
    }
    return ok();
  } catch (e) {
    console.error(`hook ${kind}:`, e instanceof Error ? e.message : e);
    return ok(); // отвечаем 200, чтобы мессенджер не слал повторно; ошибка в логах
  }
}
