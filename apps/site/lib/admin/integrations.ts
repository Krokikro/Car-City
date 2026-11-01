// Подключения: Битрикс24, Telegram, MAX, WhatsApp (Wazzup), свой вебхук. Настраиваются в админке («Интеграции»),
// хранятся в settings.integrations. Токены и ключи — в зашифрованном виде (seal), в браузер не отдаются.
// Если в админке ничего не задано, берём старые переменные окружения (TELEGRAM_BOT_TOKEN, BITRIX24_WEBHOOK_URL…).

import { createHmac } from "node:crypto";
import { seal, unseal } from "./crypto";
import { getSetting, setSetting } from "./store";
import { dbEnabled } from "../db";

export interface Integrations {
  bitrix: { on: boolean; webhook: string; sourceId: string; leads: boolean };
  telegram: { on: boolean; token: string; notify: string; thread: string; chats: boolean; username: string };
  max: { on: boolean; token: string; notify: string; chats: boolean; username: string };
  wazzup: { on: boolean; apiKey: string; channelId: string; chats: boolean; phone: string };
  webhook: { on: boolean; url: string; secret: string };
}
/** поля-секреты: хранятся зашифрованными, в форме показываются как «задан» */
export const SECRETS = { bitrix: ["webhook"], telegram: ["token"], max: ["token"], wazzup: ["apiKey"], webhook: ["secret"] } as const;

const EMPTY: Integrations = {
  bitrix: { on: false, webhook: "", sourceId: "WEB", leads: true },
  telegram: { on: false, token: "", notify: "", thread: "", chats: false, username: "" },
  max: { on: false, token: "", notify: "", chats: false, username: "" },
  wazzup: { on: false, apiKey: "", channelId: "", chats: false, phone: "" },
  webhook: { on: false, url: "", secret: "" },
};

type Stored = { [K in keyof Integrations]?: Partial<Record<keyof Integrations[K], unknown>> };

function fromEnv(): Integrations {
  const e = process.env;
  return {
    bitrix: { ...EMPTY.bitrix, on: Boolean(e.BITRIX24_WEBHOOK_URL), webhook: e.BITRIX24_WEBHOOK_URL ?? "", sourceId: e.BITRIX24_SOURCE_ID || "WEB" },
    telegram: { ...EMPTY.telegram, on: Boolean(e.TELEGRAM_BOT_TOKEN && e.TELEGRAM_CHAT_ID), token: e.TELEGRAM_BOT_TOKEN ?? "", notify: e.TELEGRAM_CHAT_ID ?? "", thread: e.TELEGRAM_THREAD_ID ?? "" },
    max: { ...EMPTY.max },
    wazzup: { ...EMPTY.wazzup },
    webhook: { ...EMPTY.webhook, on: Boolean(e.LEAD_WEBHOOK_URL), url: e.LEAD_WEBHOOK_URL ?? "", secret: e.LEAD_WEBHOOK_SECRET ?? "" },
  };
}

const g = globalThis as typeof globalThis & { __ccInt?: { at: number; v: Integrations } };

/** Настройки с расшифрованными секретами — только для сервера */
export async function getIntegrations(fresh = false): Promise<Integrations> {
  if (!fresh && g.__ccInt && Date.now() - g.__ccInt.at < 15_000) return g.__ccInt.v;
  const env = fromEnv();
  let stored: Stored | undefined;
  if (dbEnabled()) stored = await getSetting<Stored>("integrations").catch(() => undefined);
  const out = structuredClone(env) as Integrations;
  if (stored) {
    for (const k of Object.keys(EMPTY) as (keyof Integrations)[]) {
      const s = stored[k];
      if (!s) continue;
      const block = out[k] as Record<string, unknown>;
      for (const [f, v] of Object.entries(s)) {
        if (v === undefined || v === null) continue;
        const secret = (SECRETS[k] as readonly string[]).includes(f);
        if (secret) { if (typeof v === "string" && v) { try { block[f] = unseal(v); } catch { /* ключ сменился */ } } }
        else block[f] = v;
      }
    }
  }
  g.__ccInt = { at: Date.now(), v: out };
  return out;
}

/** Сохранить блок настроек. Пустой секрет — оставить прежний; "-" — удалить. */
export async function saveIntegration<K extends keyof Integrations>(k: K, patch: Partial<Integrations[K]>, by: string) {
  const stored = ((await getSetting<Stored>("integrations")) ?? {}) as Stored;
  const cur = { ...(stored[k] ?? {}) } as Record<string, unknown>;
  for (const [f, v] of Object.entries(patch)) {
    const secret = (SECRETS[k] as readonly string[]).includes(f);
    if (secret) {
      if (v === "-") cur[f] = "";
      else if (typeof v === "string" && v.trim()) cur[f] = seal(v.trim());
    } else cur[f] = v;
  }
  (stored as Record<string, unknown>)[k] = cur;
  await setSetting("integrations", stored, by);
  g.__ccInt = undefined;
}

/** Для формы: секреты заменены на признак «задан» и последние 4 символа */
export async function integrationsForForm() {
  const v = await getIntegrations(true);
  const mask = (s: string) => (s ? `•••• ${s.slice(-4)}` : "");
  return {
    ...v,
    bitrix: { ...v.bitrix, webhook: mask(v.bitrix.webhook) },
    telegram: { ...v.telegram, token: mask(v.telegram.token) },
    max: { ...v.max, token: mask(v.max.token) },
    wazzup: { ...v.wazzup, apiKey: mask(v.wazzup.apiKey) },
    webhook: { ...v.webhook, secret: mask(v.webhook.secret) },
  };
}

/** Секрет для проверки входящих вебхуков мессенджеров (часть адреса вебхука) */
export function hookKey(kind: string) {
  return createHmac("sha256", process.env.ADMIN_SECRET_KEY || "dev").update(`hook:${kind}`).digest("hex").slice(0, 32);
}
