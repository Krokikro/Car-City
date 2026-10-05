import { NextResponse } from "next/server";
import { company } from "@/lib/content";
import { maskPhone } from "@/lib/lead/phone";
import { CONSENT_VERSION, type Lead, type LeadErrorCode } from "@/lib/lead/types";
import { clientIp, forgetPhone, minFillMs, originAllowed, rateLimit, repeatOf } from "@/lib/lead/server/guard";
import { captchaEnabled, verifyCaptcha } from "@/lib/lead/server/captcha";
import { deviceOf, parseLead } from "@/lib/lead/server/parse";
import { channels, deliver } from "@/lib/lead/server/deliver";

// Приём заявки (PRD 8.1, 10, 14.3). Порядок: свой Origin → лимит с IP → ловушка → проверка полей →
// время заполнения и капча при подозрении → отсев двойной отправки → доставка во все каналы.

const MESSAGES: Record<LeadErrorCode, string> = {
  format: "Неверный формат заявки",
  name: "Укажите имя",
  phone: "Проверьте номер телефона",
  consent: "Нужно согласие на обработку персональных данных",
  too_fast: "Форма отправлена слишком быстро, попробуйте ещё раз",
  rate: "Слишком много заявок. Попробуйте позже или позвоните нам",
  captcha: "Не прошли проверку на робота, попробуйте ещё раз",
  captcha_required: "Нужна проверка на робота",
  origin: "Заявка отправлена не с сайта",
  delivery: `Не получилось отправить заявку. Позвоните нам: ${company.phones[0]}`,
};

const STATUS: Record<LeadErrorCode, number> = {
  format: 400,
  name: 422,
  phone: 422,
  consent: 422,
  too_fast: 422,
  rate: 429,
  captcha: 403,
  captcha_required: 428,
  origin: 403,
  delivery: 502,
};

const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/** Ответ форме без JS: успех — на страницу «Спасибо», ошибка — простая страница со ссылкой назад */
function nojsReply(req: Request, code?: LeadErrorCode, headers?: HeadersInit) {
  // Относительный Location: за балансировщиком req.url может указывать на внутренний адрес
  if (!code) return new Response(null, { status: 303, headers: { location: "/spasibo" } });
  const back = req.headers.get("referer") || "/";
  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Заявка не отправлена — Car City</title></head><body style="font:18px/1.5 system-ui,sans-serif;background:#0b0b0c;color:#ececea;padding:48px 20px;max-width:560px;margin:auto"><h1 style="font-size:26px">Заявка не отправлена</h1><p>${escHtml(MESSAGES[code])}</p><p><a style="color:#ffb700" href="${escHtml(back)}">Вернуться к форме</a> или позвоните: <a style="color:#ffb700" href="tel:${company.phones[0].replace(/[^\d+]/g, "")}">${company.phones[0]}</a></p></body></html>`;
  return new NextResponse(html, { status: STATUS[code], headers: { ...Object.fromEntries(new Headers(headers)), "content-type": "text/html; charset=utf-8" } });
}

function reply(req: Request, nojs: boolean, code?: LeadErrorCode, headers?: HeadersInit) {
  if (nojs) return nojsReply(req, code, headers);
  if (!code) return NextResponse.json({ ok: true });
  return NextResponse.json({ ok: false, code, error: MESSAGES[code] }, { status: STATUS[code], headers });
}

const isForm = (req: Request) => (req.headers.get("content-type") || "").includes("application/x-www-form-urlencoded");

export async function POST(req: Request) {
  const formPost = isForm(req);
  if (!originAllowed(req)) return reply(req, formPost, "origin");

  const ip = clientIp(req);
  const rl = rateLimit(ip);
  if (rl !== true) return reply(req, formPost, "rate", { "retry-after": String(rl) });

  const parsed = await parseLead(req);
  if (!parsed.ok) {
    if ("bot" in parsed) {
      console.info("lead: ловушка", { ip });
      return reply(req, parsed.nojs);
    }
    return reply(req, formPost, parsed.code);
  }
  const { data, nojs } = parsed;
  const flags: string[] = [];

  // Время заполнения: форма с JS присылает fill_ms. Без JS его нет — пропускаем с пометкой,
  // чтобы заявка не терялась из-за упавшего скрипта (PRD 8.1).
  const tooFast = !nojs && (data.fill_ms === undefined || data.fill_ms < minFillMs());
  const suspicious = tooFast || process.env.LEAD_CAPTCHA_ALWAYS === "1";
  if (nojs) flags.push("без JS");

  if (captchaEnabled() && (suspicious || data.captcha_token)) {
    if (!data.captcha_token) return reply(req, nojs, nojs ? "captcha" : "captcha_required");
    const v = await verifyCaptcha(data.captcha_token, ip);
    if (!v.ok) return reply(req, nojs, "captcha");
    flags.push(v.degraded ? "капча недоступна" : "капча пройдена");
  } else if (tooFast) {
    return reply(req, nojs, "too_fast");
  }

  const repeat = repeatOf(data.phone);
  if (repeat === "double") return reply(req, nojs); // двойной клик: уже отправили
  if (repeat === "repeat") flags.push("повторная");

  const at = new Date().toISOString();
  const ua = req.headers.get("user-agent") || "";
  const lead: Lead = {
    id: crypto.randomUUID().slice(0, 8),
    at,
    name: data.name,
    phone: data.phone,
    messenger: data.messenger,
    source: data.source || "site",
    page: data.page || req.headers.get("referer") || undefined,
    lang: data.lang || undefined,
    extra: data.extra ?? {},
    first: data.first ?? {},
    last: data.last ?? {},
    ymClientId: data.ym_client_id || undefined,
    device: deviceOf(ua),
    screen: data.screen || undefined,
    userAgent: ua.slice(0, 300) || undefined,
    ip,
    // Факт, дата, версия текста и IP согласия (PRD 8.2, 14.4) уходят вместе с заявкой в CRM
    consent: { pd: true, marketing: Boolean(data.marketing), version: CONSENT_VERSION, at, ip },
    flags,
  };

  const list = channels();
  const log = { id: lead.id, source: lead.source, phone: maskPhone(lead.phone), flags };
  if (!list.length) {
    // В разработке каналов может не быть; в продакшене заявка без канала потеряется — говорим об этом
    if (process.env.NODE_ENV === "production") {
      console.error("lead: не настроен ни один канал доставки", log);
      forgetPhone(lead.phone);
      return reply(req, nojs, "delivery");
    }
    console.info("lead (каналы не настроены)", log);
    return reply(req, nojs);
  }

  const { ok, failed } = await deliver(lead, list);
  if (failed.length) console.error("lead: сбой доставки", { ...log, ok, failed });
  else console.info("lead", { ...log, ok });
  if (!ok.length) {
    forgetPhone(lead.phone); // чтобы повторная попытка не посчиталась двойным кликом
    return reply(req, nojs, "delivery");
  }
  return reply(req, nojs);
}
