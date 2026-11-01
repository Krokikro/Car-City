// Доставка заявки (PRD 10, 11): Telegram менеджерам, Bitrix24 (crm.lead.add), вебхук своей CRM.
// Каждый канал включается своей переменной окружения. Каналы идут параллельно, у каждого таймаут:
// упавший канал не мешает остальным.

import { createHmac } from "node:crypto";
import { dbEnabled, q } from "../../db";
import { EXTRA_LABELS, MESSENGER_LABELS, MODE_LABELS, type Lead, type Touch } from "../types";
import { getIntegrations, type Integrations } from "../../admin/integrations";
import { sourceLine } from "../source";
import { geoLine } from "./geo";

const TIMEOUT = 5000;
export const LANG_NAMES: Record<string, string> = { ru: "русская", en: "английская", ky: "кыргызская", kk: "казахская", uz: "узбекская" };

export interface Channel {
  name: string;
  send: (lead: Lead) => Promise<void>;
}

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function extraLine(k: string, v: string) {
  return `${EXTRA_LABELS[k] ?? k}: ${k === "mode" ? (MODE_LABELS[v] ?? v) : v}`;
}

function touchLine(t: Touch) {
  const utm = [t.utm_source, t.utm_medium, t.utm_campaign].filter(Boolean).join(" / ");
  return [utm, t.utm_term && `«${t.utm_term}»`, t.yclid && `yclid ${t.yclid}`, t.gclid && "gclid", t.ref && `реф. код ${t.ref}`, t.referrer && `с ${t.referrer}`]
    .filter(Boolean)
    .join(", ");
}

/** Текст заявки для людей: Telegram и комментарий в Bitrix24 */
export function leadText(lead: Lead, html = false): string {
  const e = html ? esc : (s: string) => s;
  const b = (s: string) => (html ? `<b>${esc(s)}</b>` : s);
  const lines = [
    b(`Заявка с сайта${lead.flags.length ? " (" + lead.flags.join(", ") + ")" : ""}`),
    `Имя: ${e(lead.name || "не указано")}`,
    lead.phone && `Телефон: ${e(lead.phone)}`,
    lead.messenger && `Связь: ${MESSENGER_LABELS[lead.messenger]}`,
    ...Object.entries(lead.extra).map(([k, v]) => e(extraLine(k, v))),
    lead.attr && `Источник: ${e(sourceLine(lead.attr))}`,
    lead.geo && geoLine(lead.geo) && `Город: ${e(geoLine(lead.geo))}`,
    `Форма: ${e(lead.source)}${lead.lang ? ` · версия сайта ${e(LANG_NAMES[lead.lang] ?? lead.lang)}` : ""} · ${lead.device}`,
    lead.page && `Страница: ${e(lead.page)}`,
    touchLine(lead.first) && `Первый вход: ${e(touchLine(lead.first))}`,
    lead.first.landing && `Страница входа: ${e(lead.first.landing)}`,
    touchLine(lead.last) && touchLine(lead.last) !== touchLine(lead.first) && `Последний вход: ${e(touchLine(lead.last))}`,
    lead.ymClientId && `ClientID Метрики: ${lead.ymClientId}`,
    `Согласие ПДн: да, ред. ${lead.consent.version}; реклама: ${lead.consent.marketing ? "да" : "нет"}`,
    `${lead.at} · IP ${e(lead.ip)} · #${lead.id}`,
  ];
  return lines.filter(Boolean).join("\n");
}

export async function post(url: string, body: string, headers: Record<string, string>) {
  const res = await fetch(url, { method: "POST", headers, body, signal: AbortSignal.timeout(TIMEOUT) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

// MAX: адрес API можно поменять в настройках интеграции (по умолчанию platform-api.max.ru)
export const MAX_API = "https://platform-api.max.ru";

function telegram(c: Integrations["telegram"]): Channel | null {
  const chats = c.notify.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
  if (!c.on || !c.token || !chats.length) return null;
  const thread = Number(c.thread) || undefined;
  return {
    name: "telegram",
    async send(lead) {
      const text = leadText(lead, true);
      // Хватает доставки хотя бы в один чат
      const results = await Promise.allSettled(
        chats.map((chat_id) =>
          post(`https://api.telegram.org/bot${c.token}/sendMessage`, JSON.stringify({ chat_id, text, parse_mode: "HTML", message_thread_id: thread, link_preview_options: { is_disabled: true } }), {
            "content-type": "application/json",
          }),
        ),
      );
      if (!results.some((r) => r.status === "fulfilled")) throw new Error("telegram: ни один чат не принял");
    },
  };
}

function max(c: Integrations["max"]): Channel | null {
  const chats = c.notify.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
  if (!c.on || !c.token || !chats.length) return null;
  return {
    name: "max",
    async send(lead) {
      const text = leadText(lead);
      const results = await Promise.allSettled(
        chats.map((id) => post(`${MAX_API}/messages?chat_id=${encodeURIComponent(id)}`, JSON.stringify({ text }), { "content-type": "application/json", authorization: c.token })),
      );
      if (!results.some((r) => r.status === "fulfilled")) throw new Error("max: ни один чат не принял");
    },
  };
}

function webhook(c: Integrations["webhook"]): Channel | null {
  if (!c.on || !c.url) return null;
  return {
    name: "webhook",
    async send(lead) {
      const body = JSON.stringify({ type: "lead", lead });
      const headers: Record<string, string> = { "content-type": "application/json", "x-lead-id": lead.id };
      // Подпись тела, чтобы CRM проверила, что заявка от сайта (PRD 14.3)
      if (c.secret) headers["x-signature"] = "sha256=" + createHmac("sha256", c.secret).update(body).digest("hex");
      await post(c.url, body, headers);
    },
  };
}

/** Вызов REST-метода Битрикс24 по входящему вебхуку */
export async function bitrixCall<T = unknown>(base: string, method: string, params: unknown): Promise<T> {
  const url = base.replace(/\/?$/, "/") + method + ".json";
  const res = await post(url, JSON.stringify(params), { "content-type": "application/json" });
  const json = (await res.json().catch(() => ({}))) as { result?: T; error?: string; error_description?: string };
  if (json.result === undefined) throw new Error(`bitrix24: ${json.error_description || json.error || "нет result"}`);
  return json.result;
}

function bitrix24(c: Integrations["bitrix"]): Channel | null {
  if (!c.on || !c.webhook || !c.leads) return null;
  return {
    name: "bitrix24",
    async send(lead) {
      // Источник и UTM — из последнего входа с метками, иначе из первого
      const t = lead.last.utm_source ? lead.last : lead.first;
      const what = [lead.extra.mode && (MODE_LABELS[lead.extra.mode] ?? lead.extra.mode), lead.extra.model].filter(Boolean).join(", ");
      const fields = {
        TITLE: `${lead.origin === "chat" ? "Чат с сайта" : "Заявка с сайта"}${what ? ": " + what : ""} (${lead.attr?.channel ?? lead.source})`,
        NAME: lead.name || "Без имени",
        PHONE: lead.phone ? [{ VALUE: lead.phone, VALUE_TYPE: "MOBILE" }] : undefined,
        SOURCE_ID: c.sourceId || "WEB",
        SOURCE_DESCRIPTION: [lead.attr?.channel, lead.page || lead.first.landing].filter(Boolean).join(" · "),
        ADDRESS_CITY: lead.geo?.city,
        ADDRESS_COUNTRY: lead.geo?.country,
        UTM_SOURCE: t.utm_source,
        UTM_MEDIUM: t.utm_medium,
        UTM_CAMPAIGN: t.utm_campaign,
        UTM_CONTENT: t.utm_content,
        UTM_TERM: t.utm_term,
        COMMENTS: leadText(lead).replace(/\n/g, "<br>"),
      };
      const id = await bitrixCall<number>(c.webhook, "crm.lead.add", { fields, params: { REGISTER_SONET_EVENT: "Y" } });
      if (dbEnabled() && id) await q("UPDATE leads SET data = jsonb_set(data, '{bitrixId}', to_jsonb($2::int)) WHERE id=$1", [lead.id, Number(id)]).catch(() => {});
    },
  };
}

// Своя база: заявка сохраняется в Postgres и видна в админке (раздел «Заявки»). Включается, когда задан DATABASE_URL.
function database(): Channel | null {
  if (!dbEnabled()) return null;
  return {
    name: "database",
    async send(lead) {
      await q(
        "INSERT INTO leads (id, at, data, channel, src_group, city, country, lang, origin) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING",
        [lead.id, lead.at, JSON.stringify(lead), lead.attr?.channel ?? null, lead.attr?.group ?? null, lead.geo?.city ?? null, lead.geo?.country ?? null, lead.lang ?? null, lead.origin ?? "form"],
      );
    },
  };
}

export async function channels(): Promise<Channel[]> {
  const c = await getIntegrations().catch(() => null);
  if (!c) return [database()].filter((x): x is Channel => x !== null);
  // база первой: заявка должна сохраниться до того, как Битрикс24 вернёт номер лида
  return [database(), telegram(c.telegram), max(c.max), bitrix24(c.bitrix), webhook(c.webhook)].filter((x): x is Channel => x !== null);
}

/** Отправляет во все каналы. Возвращает имена каналов, которые приняли и не приняли заявку. */
export async function deliver(lead: Lead, list?: Channel[]) {
  list ??= await channels();
  // база — первой и отдельно (Битрикс24 дописывает в неё номер лида)
  const db = list.filter((c) => c.name === "database");
  const rest = list.filter((c) => c.name !== "database");
  const res = [...(await Promise.allSettled(db.map((c) => c.send(lead)))), ...(await Promise.allSettled(rest.map((c) => c.send(lead))))];
  list = [...db, ...rest];
  const ok: string[] = [];
  const failed: { name: string; error: string }[] = [];
  res.forEach((r, i) => {
    if (r.status === "fulfilled") ok.push(list[i].name);
    // В ошибке может оказаться адрес вебхука с токеном — пишем только имя канала и класс ошибки
    else failed.push({ name: list[i].name, error: r.reason instanceof Error ? r.reason.message.replace(/https?:\/\/\S+/g, "<url>").slice(0, 120) : "error" });
  });
  return { ok, failed };
}
