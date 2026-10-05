// Общие типы заявки: форма → /api/lead → каналы доставки.

/** Версия текста согласия на обработку ПДн. Меняем вместе с текстом (PRD 8.2: версия хранится с согласием). */
export const CONSENT_VERSION = "2026-10-05";

export const MESSENGERS = ["call", "telegram", "whatsapp", "max"] as const;
export type Messenger = (typeof MESSENGERS)[number];

/** Метки входа: UTM, клик-идентификаторы, реферальный код, откуда и куда пришёл. */
export interface Touch {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  yclid?: string;
  gclid?: string;
  ref?: string;
  referrer?: string;
  landing?: string;
  at?: string;
}

export const TOUCH_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "yclid", "gclid", "ref", "referrer", "landing", "at"] as const;

/** Тело JSON-запроса формы */
export interface LeadRequest {
  name: string;
  phone: string;
  consent: boolean;
  marketing?: boolean;
  messenger?: Messenger;
  company_site?: string;
  /** Сколько мс прошло от показа формы до отправки */
  fill_ms?: number;
  source?: string;
  page?: string;
  lang?: string;
  extra?: Record<string, string>;
  first?: Touch;
  last?: Touch;
  ym_client_id?: string;
  screen?: string;
  captcha_token?: string;
}

/** Коды ошибок API: форма переводит их через свой словарь */
export type LeadErrorCode = "format" | "name" | "phone" | "consent" | "too_fast" | "rate" | "captcha" | "captcha_required" | "origin" | "delivery";

/** Заявка после проверки — уходит в каналы */
export interface Lead {
  id: string;
  at: string;
  name: string;
  phone: string;
  messenger?: Messenger;
  source: string;
  page?: string;
  lang?: string;
  extra: Record<string, string>;
  first: Touch;
  last: Touch;
  ymClientId?: string;
  device: "mobile" | "tablet" | "desktop";
  screen?: string;
  userAgent?: string;
  ip: string;
  consent: { pd: true; marketing: boolean; version: string; at: string; ip: string };
  /** Пометки для менеджера: без JS, капча, повтор */
  flags: string[];
}

/** Подписи известных полей контекста (PRD 8.1: модель, тип, офис, калькулятор) */
export const EXTRA_LABELS: Record<string, string> = {
  model: "Модель",
  mode: "Тип",
  cls: "Класс",
  office: "Офис",
  calc: "Калькулятор",
  price: "Цена",
};

export const MODE_LABELS: Record<string, string> = { rent: "Аренда", buyout: "Выкуп" };

export const MESSENGER_LABELS: Record<Messenger, string> = { call: "Звонок", telegram: "Telegram", whatsapp: "WhatsApp", max: "MAX" };
