"use server";
// Интеграции: сохранение ключей, проверка подключения, регистрация вебхуков для входящих сообщений.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { audit, requireCan } from "@/lib/admin/auth";
import { getIntegrations, hookKey, saveIntegration, type Integrations } from "@/lib/admin/integrations";
import { bitrixCall, MAX_API } from "@/lib/lead/server/deliver";
import { LIM } from "@/lib/admin/limits";

const f = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const on = (fd: FormData, k: string) => fd.get(k) === "on";
function go(kind: string, t: "ok" | "e", msg: string): never {
  redirect(`/admin/integrations?${t}=${encodeURIComponent(msg)}#${kind}`);
}
const KINDS = ["bitrix", "telegram", "max", "wazzup", "webhook"] as const;
type Kind = (typeof KINDS)[number];
const kindOf = (fd: FormData): Kind => { const k = f(fd, "kind") as Kind; if (!KINDS.includes(k)) throw new Error("Неизвестная интеграция"); return k; };

async function base() {
  const h = await headers();
  const host = (h.get("x-forwarded-host") || h.get("host") || "").split(",")[0].trim();
  const local = /^(localhost|127\.)/.test(host);
  return `${local ? "http" : "https"}://${host}`;
}
export async function hookUrl(kind: "telegram" | "max" | "wazzup") { return `${await base()}/api/hooks/${kind}/${hookKey(kind)}`; }

async function call(url: string, init: RequestInit = {}) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });
  const text = await res.text();
  let json: unknown = null;
  try { json = JSON.parse(text); } catch { /* не JSON */ }
  return { ok: res.ok, status: res.status, json: json as Record<string, unknown> | null, text: text.slice(0, 300) };
}

export async function saveIntegrationAction(fd: FormData) {
  const u = await requireCan("integrations", "write");
  const kind = kindOf(fd);
  const long = [...f(fd, "webhook"), ...f(fd, "url"), ...f(fd, "token"), ...f(fd, "apiKey")].length;
  if (long > 4 * LIM.url) go(kind, "e", "Слишком длинное значение");
  let patch: Partial<Integrations[Kind]>;
  if (kind === "bitrix") {
    const w = f(fd, "webhook");
    if (w && w !== "-" && !/^https:\/\/[a-z0-9.-]+\/rest\/\d+\/[a-z0-9]+\/?$/i.test(w)) go(kind, "e", "Адрес вебхука Битрикс24 выглядит так: https://ваш-портал.bitrix24.ru/rest/1/abcdef123456/");
    patch = { on: on(fd, "on"), webhook: w, sourceId: f(fd, "sourceId").slice(0, 40) || "WEB", leads: on(fd, "leads") };
  } else if (kind === "telegram") {
    const t = f(fd, "token");
    if (t && t !== "-" && !/^\d+:[\w-]{30,}$/.test(t)) go(kind, "e", "Токен бота выглядит так: 123456789:AA… — его выдаёт @BotFather");
    patch = { on: on(fd, "on"), token: t, notify: f(fd, "notify").slice(0, 300), thread: f(fd, "thread").replace(/\D/g, "").slice(0, 12), chats: on(fd, "chats") };
  } else if (kind === "max") {
    patch = { on: on(fd, "on"), token: f(fd, "token"), notify: f(fd, "notify").slice(0, 300), chats: on(fd, "chats") };
  } else if (kind === "wazzup") {
    const ch = f(fd, "channelId");
    if (ch && !/^[0-9a-f-]{36}$/i.test(ch)) go(kind, "e", "ID канала Wazzup — это UUID вида 1234abcd-…; нажмите «Проверить», чтобы увидеть список каналов");
    patch = { on: on(fd, "on"), apiKey: f(fd, "apiKey"), channelId: ch, chats: on(fd, "chats"), phone: f(fd, "phone").slice(0, 20) };
  } else {
    const url = f(fd, "url");
    if (url && !/^https:\/\//.test(url)) go(kind, "e", "Адрес вебхука должен начинаться с https://");
    patch = { on: on(fd, "on"), url: url.slice(0, 500), secret: f(fd, "secret") };
  }
  await saveIntegration(kind, patch as never, u.login || u.email);
  await audit(u, "Изменены настройки интеграции", "integration", kind);
  go(kind, "ok", "Сохранено");
}

export async function testIntegrationAction(fd: FormData) {
  const u = await requireCan("integrations", "write");
  const kind = kindOf(fd);
  const c = await getIntegrations(true);
  let msg = "";
  try {
    if (kind === "bitrix") {
      if (!c.bitrix.webhook) go(kind, "e", "Сначала укажите адрес вебхука");
      const fields = await bitrixCall<Record<string, unknown>>(c.bitrix.webhook, "crm.lead.fields", {});
      msg = `Битрикс24 отвечает, доступ к лидам есть (${Object.keys(fields).length} полей лида)`;
    } else if (kind === "telegram") {
      if (!c.telegram.token) go(kind, "e", "Сначала укажите токен бота");
      const r = await call(`https://api.telegram.org/bot${c.telegram.token}/getMe`);
      const bot = (r.json?.result ?? {}) as { username?: string; first_name?: string };
      if (!r.ok || !bot.username) throw new Error(`Telegram не принял токен (${r.status})`);
      await saveIntegration("telegram", { username: bot.username }, u.login || u.email);
      const info = await call(`https://api.telegram.org/bot${c.telegram.token}/getWebhookInfo`);
      const wh = (info.json?.result ?? {}) as { url?: string; last_error_message?: string };
      msg = `Бот @${bot.username} работает. Приём сообщений: ${wh.url?.includes("/api/hooks/telegram/") ? "подключён" : "не подключён"}${wh.last_error_message ? ` (последняя ошибка: ${wh.last_error_message})` : ""}`;
    } else if (kind === "max") {
      if (!c.max.token) go(kind, "e", "Сначала укажите токен бота");
      const r = await call(`${MAX_API}/me`, { headers: { authorization: c.max.token } });
      const me = (r.json ?? {}) as { name?: string; username?: string };
      if (!r.ok) throw new Error(`MAX не принял токен (${r.status}: ${r.text})`);
      if (me.username) await saveIntegration("max", { username: me.username }, u.login || u.email);
      const subs = await call(`${MAX_API}/subscriptions`, { headers: { authorization: c.max.token } });
      const list = ((subs.json?.subscriptions ?? []) as { url?: string }[]).map((s) => s.url ?? "");
      msg = `Бот «${me.name ?? me.username ?? "MAX"}» работает. Приём сообщений: ${list.some((x) => x.includes("/api/hooks/max/")) ? "подключён" : "не подключён"}`;
    } else if (kind === "wazzup") {
      if (!c.wazzup.apiKey) go(kind, "e", "Сначала укажите API-ключ");
      const r = await call("https://api.wazzup24.com/v3/channels", { headers: { authorization: `Bearer ${c.wazzup.apiKey}` } });
      if (!r.ok || !Array.isArray(r.json)) throw new Error(`Wazzup не принял ключ (${r.status})`);
      const ch = r.json as unknown as { channelId: string; transport: string; plainId?: string; state?: string }[];
      msg = ch.length ? `Ключ работает. Каналы: ${ch.map((x) => `${x.transport} ${x.plainId ?? ""} — ${x.state ?? "?"}, ID ${x.channelId}`).join("; ")}` : "Ключ работает, но каналов в Wazzup нет — подключите WhatsApp в кабинете Wazzup";
    } else {
      if (!c.webhook.url) go(kind, "e", "Сначала укажите адрес");
      const r = await call(c.webhook.url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "test" }) });
      msg = `Вебхук ответил кодом ${r.status}`;
    }
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e; // redirect
    go(kind, "e", `Проверка не прошла: ${e instanceof Error ? e.message.replace(/https?:\/\/\S+/g, "<адрес>") : "ошибка"}`);
  }
  await audit(u, "Проверка интеграции", "integration", kind);
  go(kind, "ok", msg);
}

/** Зарегистрировать адрес для входящих сообщений у мессенджера */
export async function connectHookAction(fd: FormData) {
  const u = await requireCan("integrations", "write");
  const kind = kindOf(fd);
  if (kind !== "telegram" && kind !== "max" && kind !== "wazzup") go(kind, "e", "Для этой интеграции вебхук не нужен");
  const c = await getIntegrations(true);
  const url = await hookUrl(kind);
  if (!url.startsWith("https://")) go(kind, "e", `Мессенджеры принимают только https-адреса, а админка открыта по ${url.split("/api")[0]}`);
  try {
    if (kind === "telegram") {
      if (!c.telegram.token) go(kind, "e", "Сначала укажите токен бота");
      const r = await call(`https://api.telegram.org/bot${c.telegram.token}/setWebhook`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url, secret_token: hookKey("tg-secret"), allowed_updates: ["message"], drop_pending_updates: false }) });
      if (!r.ok || r.json?.ok !== true) throw new Error(String(r.json?.description ?? r.status));
      await saveIntegration("telegram", { chats: true }, u.login || u.email);
    } else if (kind === "max") {
      if (!c.max.token) go(kind, "e", "Сначала укажите токен бота");
      const r = await call(`${MAX_API}/subscriptions`, { method: "POST", headers: { "content-type": "application/json", authorization: c.max.token }, body: JSON.stringify({ url, update_types: ["message_created", "bot_started"], secret: hookKey("max-secret") }) });
      if (!r.ok || r.json?.success === false) throw new Error(String(r.json?.message ?? r.text ?? r.status));
      await saveIntegration("max", { chats: true }, u.login || u.email);
    } else {
      if (!c.wazzup.apiKey) go(kind, "e", "Сначала укажите API-ключ");
      const r = await call("https://api.wazzup24.com/v3/webhooks", { method: "PATCH", headers: { "content-type": "application/json", authorization: `Bearer ${c.wazzup.apiKey}` }, body: JSON.stringify({ webhooksUri: url, subscriptions: { messagesAndStatuses: true, contactsAndDealsCreation: false, channelsUpdates: false, templateStatus: false } }) });
      if (!r.ok) throw new Error(String((r.json as { description?: string } | null)?.description ?? r.text ?? r.status));
      await saveIntegration("wazzup", { chats: true }, u.login || u.email);
    }
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    go(kind, "e", `Не удалось подключить приём сообщений: ${e instanceof Error ? e.message : "ошибка"}`);
  }
  await audit(u, "Подключён приём сообщений", "integration", kind);
  go(kind, "ok", "Приём сообщений подключён: новые сообщения клиентов будут появляться в разделе «Чаты»");
}

/** Пробное уведомление менеджерам */
export async function notifyTestAction(fd: FormData) {
  const u = await requireCan("integrations", "write");
  const kind = kindOf(fd);
  const c = await getIntegrations(true);
  const text = `Проверка уведомлений Car City из админки (${u.name || u.login}). Сюда будут приходить новые заявки и сообщения из чатов.`;
  const ids = (kind === "telegram" ? c.telegram.notify : c.max.notify).split(/[\s,]+/).filter(Boolean);
  if (!ids.length) go(kind, "e", "Укажите, куда слать уведомления (ID чатов)");
  const res = await Promise.all(ids.map((id) => kind === "telegram"
    ? call(`https://api.telegram.org/bot${c.telegram.token}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: id, text, message_thread_id: Number(c.telegram.thread) || undefined }) })
    : call(`${MAX_API}/messages?chat_id=${encodeURIComponent(id)}`, { method: "POST", headers: { "content-type": "application/json", authorization: c.max.token }, body: JSON.stringify({ text }) })));
  const bad = ids.filter((_, i) => !res[i].ok);
  if (bad.length) go(kind, "e", `Не доставлено в: ${bad.join(", ")}. Проверьте, что бот добавлен в чат и ID указан верно.`);
  go(kind, "ok", `Пробное уведомление отправлено (${ids.length})`);
}
