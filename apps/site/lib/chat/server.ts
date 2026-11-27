// Чаты (раздел «Чаты» в админке). Источники: виджет на сайте, Telegram-бот, MAX-бот, WhatsApp через Wazzup.
// Первое сообщение создаёт диалог и заявку (origin = канал), дальше переписка идёт в диалоге.
// Ответ менеджера сохраняется и уходит обратно в тот канал, откуда пишет клиент (на сайт — через опрос виджетом).

import { randomBytes, randomUUID } from "node:crypto";
import { q, q1 } from "../db";
import { CONSENT_VERSION, type Lead, type Touch } from "../lead/types";
import { enrichLead } from "../lead/server/enrich";
import { bitrixCall, deliver, esc, MAX_API, post } from "../lead/server/deliver";
import { getIntegrations } from "../admin/integrations";

export type ChatChannel = "site" | "telegram" | "max" | "whatsapp";
export const CHANNEL_NAMES: Record<ChatChannel, string> = { site: "Сайт", telegram: "Telegram", max: "MAX", whatsapp: "WhatsApp" };

export interface ChatRow {
  id: string; created_at: string; updated_at: string; channel: ChatChannel; ext_id: string | null; token: string | null;
  name: string; phone: string; lang: string | null; lead_id: string | null; status: string; unread: number; assignee: string | null;
  last_text: string; last_dir: string | null; meta: Record<string, unknown>;
}
export interface MsgRow { id: string; at: string; dir: "in" | "out" | "sys"; text: string; author: string | null; error: string | null }

const cut = (s: string, n: number) => s.replace(/\u0000/g, "").trim().slice(0, n);

interface NewChat {
  channel: ChatChannel; extId?: string; name?: string; phone?: string; lang?: string; page?: string;
  first?: Touch; last?: Touch; ip?: string; ua?: string; device?: Lead["device"]; ymClientId?: string; meta?: Record<string, unknown>;
}

/** Создать диалог и заявку к нему */
export async function createChat(c: NewChat, firstText: string): Promise<ChatRow> {
  const id = randomUUID().slice(0, 10);
  const token = c.channel === "site" ? randomBytes(18).toString("base64url") : null;
  const at = new Date().toISOString();
  const origin = c.channel === "site" ? "chat" : c.channel;
  const lead: Lead = {
    id: randomUUID().slice(0, 8), at, name: cut(c.name ?? "", 60), phone: cut(c.phone ?? "", 20),
    source: c.channel === "site" ? "chat" : c.channel, page: c.page, lang: c.lang, extra: { message: cut(firstText, 600) },
    first: c.first ?? {}, last: c.last ?? {}, ymClientId: c.ymClientId, device: c.device ?? "desktop", userAgent: c.ua?.slice(0, 300),
    ip: c.ip ?? "", consent: { pd: true, marketing: false, version: CONSENT_VERSION, at, ip: c.ip ?? "" }, flags: [], origin, chatId: id,
  };
  if (c.channel !== "site") {
    // из мессенджера: источник — сам мессенджер, язык — русский, если не сказано иное
    lead.first = { utm_source: c.channel, utm_medium: "messenger" };
    lead.lang = c.lang ?? "ru";
  }
  await enrichLead(lead);
  const row = await q1<ChatRow>(
    `INSERT INTO chats (id, channel, ext_id, token, name, phone, lang, lead_id, meta) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (channel, ext_id) WHERE ext_id IS NOT NULL DO UPDATE SET updated_at = now() RETURNING *`,
    [id, c.channel, c.extId ?? null, token, lead.name, lead.phone, lead.lang ?? null, lead.id, JSON.stringify({ ...(c.meta ?? {}), city: lead.geo?.city ?? null })],
  );
  if (row!.id !== id) return row!; // гонка: диалог уже создан параллельным запросом
  // заявка: в базу, в Telegram/MAX менеджерам, в Битрикс24
  const { failed } = await deliver(lead);
  if (failed.length) console.error("chat lead: сбой доставки", { id: lead.id, failed });
  return row!;
}

export async function findChat(channel: ChatChannel, extId: string) {
  return (await q1<ChatRow>("SELECT * FROM chats WHERE channel=$1 AND ext_id=$2", [channel, extId])) ?? null;
}
export async function chatById(id: string) {
  return (await q1<ChatRow>("SELECT * FROM chats WHERE id=$1", [id])) ?? null;
}

/** Входящее сообщение клиента */
export async function addIncoming(chat: ChatRow, text: string, extId?: string) {
  const t = cut(text, 2000);
  if (!t) return null;
  const prev = await q1<{ dir: string }>("SELECT dir FROM chat_messages WHERE chat_id=$1 ORDER BY id DESC LIMIT 1", [chat.id]);
  const m = await q1<MsgRow>("INSERT INTO chat_messages (chat_id, dir, text, ext_id) VALUES ($1,'in',$2,$3) RETURNING id::text, at, dir, text, author, error", [chat.id, t, extId ?? null]);
  await q("UPDATE chats SET updated_at=now(), unread=unread+1, last_text=$2, last_dir='in', status='open' WHERE id=$1", [chat.id, t.slice(0, 200)]);
  // менеджерам — уведомление, когда клиент начинает новую реплику (а не на каждое сообщение подряд)
  if (prev && prev.dir !== "in") void notifyStaff(chat, t).catch(() => {});
  void bitrixComment(chat, `Клиент (${CHANNEL_NAMES[chat.channel]}): ${t}`).catch(() => {});
  return m;
}

/** Служебная строка в переписке («клиент оставил телефон», «диалог закрыт») */
export async function addSystem(chatId: string, text: string) {
  await q("INSERT INTO chat_messages (chat_id, dir, text) VALUES ($1,'sys',$2)", [chatId, cut(text, 500)]);
}

/** Ответ менеджера: сохранить и отправить в канал клиента */
export async function sendReply(chat: ChatRow, text: string, author: string) {
  const t = cut(text, 4000);
  if (!t) throw new Error("Пустое сообщение");
  let error: string | null = null;
  let extId: string | null = null;
  try { extId = await deliverOut(chat, t); } catch (e) { error = e instanceof Error ? e.message.replace(/https?:\/\/\S+/g, "<url>").slice(0, 200) : "ошибка"; }
  await q("INSERT INTO chat_messages (chat_id, dir, text, author, ext_id, error) VALUES ($1,'out',$2,$3,$4,$5)", [chat.id, t, author, extId, error]);
  await q("UPDATE chats SET updated_at=now(), unread=0, last_text=$2, last_dir='out' WHERE id=$1", [chat.id, t.slice(0, 200)]);
  void bitrixComment(chat, `Менеджер ${author}: ${t}`).catch(() => {});
  return { error };
}

/** Отправка в мессенджер клиента. Для сайта ничего не делаем: виджет заберёт ответ сам. */
async function deliverOut(chat: ChatRow, text: string): Promise<string | null> {
  if (chat.channel === "site" || !chat.ext_id) return null;
  const c = await getIntegrations();
  if (chat.channel === "telegram") {
    if (!c.telegram.token) throw new Error("Telegram не подключён");
    const res = await post(`https://api.telegram.org/bot${c.telegram.token}/sendMessage`, JSON.stringify({ chat_id: chat.ext_id, text }), { "content-type": "application/json" });
    const j = (await res.json().catch(() => ({}))) as { result?: { message_id?: number } };
    return j.result?.message_id ? String(j.result.message_id) : null;
  }
  if (chat.channel === "max") {
    if (!c.max.token) throw new Error("MAX не подключён");
    const res = await post(`${MAX_API}/messages?chat_id=${encodeURIComponent(chat.ext_id)}`, JSON.stringify({ text }), { "content-type": "application/json", authorization: c.max.token });
    const j = (await res.json().catch(() => ({}))) as { message?: { body?: { mid?: string } } };
    return j.message?.body?.mid ?? null;
  }
  if (chat.channel === "whatsapp") {
    if (!c.wazzup.apiKey || !c.wazzup.channelId) throw new Error("WhatsApp (Wazzup) не подключён");
    const chatType = (chat.meta?.chatType as string) || "whatsapp";
    const res = await post("https://api.wazzup24.com/v3/message", JSON.stringify({ channelId: (chat.meta?.channelId as string) || c.wazzup.channelId, chatType, chatId: chat.ext_id, text }), { "content-type": "application/json", authorization: `Bearer ${c.wazzup.apiKey}` });
    const j = (await res.json().catch(() => ({}))) as { messageId?: string };
    return j.messageId ?? null;
  }
  return null;
}

/** Клиент назвал имя и телефон (в виджете на сайте или поделился контактом в мессенджере) */
export async function setContact(chat: ChatRow, name?: string, phone?: string, marketing = false) {
  const n = cut(name ?? "", 60) || chat.name;
  const p = cut(phone ?? "", 20) || chat.phone;
  await q("UPDATE chats SET name=$2, phone=$3, updated_at=now() WHERE id=$1", [chat.id, n, p]);
  if (chat.lead_id) {
    await q(
      `UPDATE leads SET data = data || jsonb_build_object('name', $2::text, 'phone', $3::text) || CASE WHEN $4 THEN jsonb_build_object('consent', (data->'consent') || jsonb_build_object('marketing', true)) ELSE '{}'::jsonb END, updated_at=now() WHERE id=$1`,
      [chat.lead_id, n, p, marketing],
    );
  }
  await addSystem(chat.id, `Клиент оставил контакт: ${[n, p].filter(Boolean).join(", ")}`);
  void notifyStaff({ ...chat, name: n, phone: p }, `Оставил контакт: ${[n, p].filter(Boolean).join(", ")}`).catch(() => {});
  void bitrixUpdateContact(chat, n, p).catch(() => {});
}

// ── уведомления и Битрикс24 ──

async function notifyStaff(chat: ChatRow, text: string) {
  const c = await getIntegrations();
  const who = [chat.name, chat.phone].filter(Boolean).join(", ") || "без имени";
  const head = `Сообщение в чате (${CHANNEL_NAMES[chat.channel]}) — ${who}`;
  const chats = c.telegram.notify.split(/[\s,]+/).filter(Boolean);
  if (c.telegram.on && c.telegram.token && chats.length) {
    const body = `<b>${esc(head)}</b>\n${esc(text.slice(0, 800))}\n\nОтветить: раздел «Чаты» в админке, диалог ${chat.id}`;
    await Promise.allSettled(chats.map((chat_id) => post(`https://api.telegram.org/bot${c.telegram.token}/sendMessage`, JSON.stringify({ chat_id, text: body, parse_mode: "HTML", message_thread_id: Number(c.telegram.thread) || undefined }), { "content-type": "application/json" })));
  }
  const maxChats = c.max.notify.split(/[\s,]+/).filter(Boolean);
  if (c.max.on && c.max.token && maxChats.length) {
    await Promise.allSettled(maxChats.map((id) => post(`${MAX_API}/messages?chat_id=${encodeURIComponent(id)}`, JSON.stringify({ text: `${head}\n${text.slice(0, 800)}` }), { "content-type": "application/json", authorization: c.max.token })));
  }
}

async function bitrixLeadId(chat: ChatRow) {
  if (!chat.lead_id) return null;
  const r = await q1<{ b: string | null }>("SELECT data->>'bitrixId' b FROM leads WHERE id=$1", [chat.lead_id]);
  return r?.b ? Number(r.b) : null;
}
async function bitrixComment(chat: ChatRow, text: string) {
  const c = await getIntegrations();
  if (!c.bitrix.on || !c.bitrix.webhook) return;
  const id = await bitrixLeadId(chat);
  if (!id) return;
  await bitrixCall(c.bitrix.webhook, "crm.timeline.comment.add", { fields: { ENTITY_ID: id, ENTITY_TYPE: "lead", COMMENT: text.slice(0, 4000) } });
}
async function bitrixUpdateContact(chat: ChatRow, name: string, phone: string) {
  const c = await getIntegrations();
  if (!c.bitrix.on || !c.bitrix.webhook) return;
  const id = await bitrixLeadId(chat);
  if (!id) return;
  await bitrixCall(c.bitrix.webhook, "crm.lead.update", { id, fields: { NAME: name || undefined, PHONE: phone ? [{ VALUE: phone, VALUE_TYPE: "MOBILE" }] : undefined } });
}

export async function messages(chatId: string, after = 0, limit = 300) {
  return q<MsgRow>("SELECT id::text, at, dir, text, author, error FROM chat_messages WHERE chat_id=$1 AND id > $2 ORDER BY id ASC LIMIT $3", [chatId, after, limit]);
}
