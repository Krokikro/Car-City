// Доставка заявки (PRD 10, 11): Telegram менеджерам, Bitrix24 (crm.lead.add), вебхук своей CRM.
// Каждый канал включается своей переменной окружения. Каналы идут параллельно, у каждого таймаут:
// упавший канал не мешает остальным.

import { createHmac } from "node:crypto";
import { EXTRA_LABELS, MESSENGER_LABELS, MODE_LABELS, type Lead, type Touch } from "../types";

const TIMEOUT = 5000;

export interface Channel {
  name: string;
  send: (lead: Lead) => Promise<void>;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

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
    `Имя: ${e(lead.name)}`,
    `Телефон: ${e(lead.phone)}`,
    lead.messenger && `Связь: ${MESSENGER_LABELS[lead.messenger]}`,
    ...Object.entries(lead.extra).map(([k, v]) => e(extraLine(k, v))),
    `Форма: ${e(lead.source)}${lead.lang ? ` · язык ${e(lead.lang)}` : ""} · ${lead.device}`,
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

async function post(url: string, body: string, headers: Record<string, string>) {
  const res = await fetch(url, { method: "POST", headers, body, signal: AbortSignal.timeout(TIMEOUT) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

function telegram(): Channel | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chats = (process.env.TELEGRAM_CHAT_ID || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!token || !chats.length) return null;
  const thread = Number(process.env.TELEGRAM_THREAD_ID) || undefined;
  return {
    name: "telegram",
    async send(lead) {
      const text = leadText(lead, true);
      // Хватает доставки хотя бы в один чат
      const results = await Promise.allSettled(
        chats.map((chat_id) =>
          post(`https://api.telegram.org/bot${token}/sendMessage`, JSON.stringify({ chat_id, text, parse_mode: "HTML", message_thread_id: thread, link_preview_options: { is_disabled: true } }), {
            "content-type": "application/json",
          }),
        ),
      );
      if (!results.some((r) => r.status === "fulfilled")) throw new Error("telegram: ни один чат не принял");
    },
  };
}

function webhook(): Channel | null {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) return null;
  const secret = process.env.LEAD_WEBHOOK_SECRET;
  return {
    name: "webhook",
    async send(lead) {
      const body = JSON.stringify({ type: "lead", lead });
      const headers: Record<string, string> = { "content-type": "application/json", "x-lead-id": lead.id };
      // Подпись тела, чтобы CRM проверила, что заявка от сайта (PRD 14.3)
      if (secret) headers["x-signature"] = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
      await post(url, body, headers);
    },
  };
}

function bitrix24(): Channel | null {
  const base = process.env.BITRIX24_WEBHOOK_URL;
  if (!base) return null;
  const url = base.replace(/\/?$/, "/") + "crm.lead.add.json";
  return {
    name: "bitrix24",
    async send(lead) {
      // Источник и UTM — из последнего входа с метками, иначе из первого
      const t = lead.last.utm_source ? lead.last : lead.first;
      const what = [lead.extra.mode && (MODE_LABELS[lead.extra.mode] ?? lead.extra.mode), lead.extra.model].filter(Boolean).join(", ");
      const fields = {
        TITLE: `Заявка с сайта${what ? ": " + what : ""} (${lead.source})`,
        NAME: lead.name,
        PHONE: [{ VALUE: lead.phone, VALUE_TYPE: "MOBILE" }],
        SOURCE_ID: process.env.BITRIX24_SOURCE_ID || "WEB",
        SOURCE_DESCRIPTION: lead.page || lead.first.landing || "",
        UTM_SOURCE: t.utm_source,
        UTM_MEDIUM: t.utm_medium,
        UTM_CAMPAIGN: t.utm_campaign,
        UTM_CONTENT: t.utm_content,
        UTM_TERM: t.utm_term,
        COMMENTS: leadText(lead).replace(/\n/g, "<br>"),
      };
      const res = await post(url, JSON.stringify({ fields, params: { REGISTER_SONET_EVENT: "Y" } }), { "content-type": "application/json" });
      const json = (await res.json().catch(() => ({}))) as { result?: unknown; error?: string };
      if (!json.result) throw new Error(`bitrix24: ${json.error || "нет result"}`);
    },
  };
}

export function channels(): Channel[] {
  return [telegram(), bitrix24(), webhook()].filter((c): c is Channel => c !== null);
}

/** Отправляет во все каналы. Возвращает имена каналов, которые приняли и не приняли заявку. */
export async function deliver(lead: Lead, list = channels()) {
  const res = await Promise.allSettled(list.map((c) => c.send(lead)));
  const ok: string[] = [];
  const failed: { name: string; error: string }[] = [];
  res.forEach((r, i) => {
    if (r.status === "fulfilled") ok.push(list[i].name);
    // В ошибке может оказаться адрес вебхука с токеном — пишем только имя канала и класс ошибки
    else failed.push({ name: list[i].name, error: r.reason instanceof Error ? r.reason.message.replace(/https?:\/\/\S+/g, "<url>").slice(0, 120) : "error" });
  });
  return { ok, failed };
}
