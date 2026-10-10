// Разбор и проверка заявки. Принимает JSON (форма с JS) и обычный POST формы (без JS, PRD 8.1).

import { normalizePhone } from "../phone";
import { MESSENGERS, TOUCH_KEYS, type LeadErrorCode, type LeadRequest, type Messenger, type Touch } from "../types";

export type Parsed = { ok: true; data: LeadRequest; nojs: boolean } | { ok: false; code: LeadErrorCode } | { ok: false; bot: true; nojs: boolean };

const MAX_BODY = 16 * 1024;
const str = (v: unknown, n = 200) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const KEY_RE = /^[a-z][a-z0-9_]{0,31}$/;

function cleanExtra(v: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!v || typeof v !== "object") return out;
  for (const [k, val] of Object.entries(v as Record<string, unknown>).slice(0, 12)) {
    if (!KEY_RE.test(k)) continue;
    const s = typeof val === "number" || typeof val === "boolean" ? String(val) : str(val);
    if (s) out[k] = s;
  }
  return out;
}

function cleanTouch(v: unknown): Touch {
  const out: Touch = {};
  if (!v || typeof v !== "object") return out;
  const o = v as Record<string, unknown>;
  for (const k of TOUCH_KEYS) {
    const s = str(o[k], 300);
    if (s) out[k] = s;
  }
  return out;
}

const truthy = (v: unknown) => v === true || v === "on" || v === "true" || v === "1";

async function readBody(req: Request): Promise<{ body: Record<string, unknown>; nojs: boolean } | null> {
  const len = Number(req.headers.get("content-length") || 0);
  if (len > MAX_BODY) return null;
  const type = req.headers.get("content-type") || "";
  const text = await req.text();
  if (text.length > MAX_BODY) return null;
  if (type.includes("application/json")) {
    const body = JSON.parse(text);
    return body && typeof body === "object" && !Array.isArray(body) ? { body, nojs: false } : null;
  }
  if (type.includes("application/x-www-form-urlencoded")) {
    // Форма без JS: контекст приходит полями x_model, x_mode…
    const p = new URLSearchParams(text);
    const body: Record<string, unknown> = {};
    const extra: Record<string, string> = {};
    for (const [k, v] of p) {
      if (k.startsWith("x_")) extra[k.slice(2)] = v;
      else body[k] = v;
    }
    body.extra = extra;
    return { body, nojs: true };
  }
  return null;
}

export async function parseLead(req: Request): Promise<Parsed> {
  let raw: Awaited<ReturnType<typeof readBody>>;
  try {
    raw = await readBody(req);
  } catch {
    raw = null;
  }
  if (!raw) return { ok: false, code: "format" };
  const b = raw.body;
  // Ловушка заполнена — бот. Отвечаем «успехом», чтобы он не подбирал обход
  if (str(b.company_site)) return { ok: false, bot: true, nojs: raw.nojs };

  const name = str(b.name, 60).replace(/\s+/g, " ");
  // Буквы любых алфавитов, пробел, дефис, апостроф, точка
  if (name.length < 2 || !/^[\p{L}][\p{L}\p{M} .'’-]*$/u.test(name)) return { ok: false, code: "name" };
  const phone = normalizePhone(str(b.phone, 40));
  if (!phone) return { ok: false, code: "phone" };
  if (!truthy(b.consent)) return { ok: false, code: "consent" };

  const messenger = MESSENGERS.includes(b.messenger as Messenger) ? (b.messenger as Messenger) : undefined;
  const fill = Number(b.fill_ms);

  return {
    ok: true,
    nojs: raw.nojs,
    data: {
      name,
      phone,
      consent: true,
      marketing: truthy(b.marketing),
      messenger,
      fill_ms: Number.isFinite(fill) ? fill : undefined,
      source: str(b.source, 40) || "site",
      page: str(b.page, 300),
      lang: str(b.lang, 5),
      extra: cleanExtra(b.extra),
      first: cleanTouch(b.first),
      last: cleanTouch(b.last),
      ym_client_id: str(b.ym_client_id, 40).replace(/\D/g, ""),
      screen: str(b.screen, 20),
      captcha_token: str(b.captcha_token ?? b["smart-token"], 2000),
    },
  };
}

/** Тип устройства по User-Agent (PRD 8.1: устройство сохраняется с лидом) */
export function deviceOf(ua: string): "mobile" | "tablet" | "desktop" {
  if (/iPad|Tablet|Nexus (7|9|10)|SM-T|Tab\b/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone|iPod|Opera Mini|IEMobile/i.test(ua)) return "mobile";
  return "desktop";
}
