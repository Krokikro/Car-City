// Источник заявки: по UTM-меткам, yclid/gclid, рефереру и реферальному коду определяем канал
// («Яндекс Директ», «Яндекс поиск», «ВКонтакте», «Прямой заход»…) и группу каналов для аналитики.
// Метки расшифровываем в читаемый вид: «+» и %-кодировка → текст, известные макросы Директа → подписи.
// Модель атрибуции для отчётов — последний значимый переход: последний вход с меткой или реферером,
// а если последний вход прямой — первый (прямой заход не перебивает рекламу, как в Метрике).

import type { Touch } from "./types";

export type SourceGroup = "Реклама" | "Поиск" | "Соцсети" | "Мессенджеры" | "Карты и справочники" | "Объявления" | "Реферальная программа" | "Другие сайты" | "Email" | "Прямой заход";

export interface SourceInfo {
  /** канал: «Яндекс Директ», «Google поиск», «ВКонтакте»… */
  channel: string;
  group: SourceGroup;
  /** что известно из меток: кампания, ключевая фраза, объявление, сайт-источник */
  campaign?: string;
  term?: string;
  content?: string;
  medium?: string;
  site?: string;
}

/** Атрибуция заявки: канал для отчётов + первый и последний входы */
export interface Attribution extends SourceInfo {
  model: "last-significant";
  first: SourceInfo;
  last: SourceInfo;
}

export function decodeTag(v?: string): string | undefined {
  if (!v) return undefined;
  let s = v.replace(/\+/g, " ");
  for (let i = 0; i < 2 && /%[0-9a-f]{2}/i.test(s); i++) {
    try { s = decodeURIComponent(s); } catch { break; }
  }
  s = s.replace(/\s+/g, " ").trim();
  // Незаполненные макросы Директа и UTM-шаблонов — не показываем
  if (!s || /^\{[a-z_]+\}$/i.test(s)) return undefined;
  return s.slice(0, 200);
}

/** utm_content в формате Директа «type|search|pos|premium|source|none|…» → читаемая строка */
function decodeContent(v?: string): string | undefined {
  const s = decodeTag(v);
  if (!s || !s.includes("|")) return s;
  const parts = s.split("|");
  const map: Record<string, string> = { type: "площадка", source_type: "площадка", source: "сайт", pos: "позиция", position_type: "блок", block: "блок", added: "доп. фраза", region: "регион", device: "устройство", gid: "группа", aid: "объявление", cid: "кампания", phrase: "фраза", keyword: "фраза" };
  const vals: Record<string, string> = { search: "поиск", context: "РСЯ", premium: "спецразмещение", other: "гарантия", none: "—", desktop: "компьютер", mobile: "телефон", tablet: "планшет" };
  const out: string[] = [];
  for (let i = 0; i + 1 < parts.length; i += 2) {
    const k = parts[i].toLowerCase();
    const val = parts[i + 1];
    if (!val || val === "none" || /^\{.*\}$/.test(val)) continue;
    out.push(`${map[k] ?? k}: ${vals[val] ?? val}`);
  }
  return out.length ? out.join(", ") : s;
}

const PAID = /^(cpc|ppc|cpa|cpm|cpv|paid|paidsearch|paid_search|paid-social|paid_social|paidsocial|social_paid|target|targeted|context|search|display|banner|retargeting|smart|rsya|mk|ads?)$/i;

function hostOf(url?: string): string {
  if (!url) return "";
  try { return new URL(url).hostname.replace(/^(www|m)\./, "").toLowerCase(); } catch { return ""; }
}

const REFERRERS: [RegExp, string, SourceGroup][] = [
  [/(^|\.)yandex\.[a-z.]+$|(^|\.)ya\.ru$/, "Яндекс поиск", "Поиск"],
  [/(^|\.)google\.[a-z.]+$/, "Google поиск", "Поиск"],
  [/(^|\.)bing\.com$/, "Bing", "Поиск"],
  [/(^|\.)(go\.)?mail\.ru$/, "Поиск Mail.ru", "Поиск"],
  [/(^|\.)duckduckgo\.com$/, "DuckDuckGo", "Поиск"],
  [/(^|\.)(vk\.com|vk\.ru|vkvideo\.ru)$/, "ВКонтакте", "Соцсети"],
  [/(^|\.)ok\.ru$/, "Одноклассники", "Соцсети"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "YouTube", "Соцсети"],
  [/(^|\.)dzen\.ru$|(^|\.)zen\.yandex\.ru$/, "Дзен", "Соцсети"],
  [/(^|\.)instagram\.com$/, "Instagram", "Соцсети"],
  [/(^|\.)rutube\.ru$/, "Rutube", "Соцсети"],
  [/(^|\.)(t\.me|telegram\.org|telegram\.me)$/, "Telegram", "Мессенджеры"],
  [/(^|\.)(wa\.me|whatsapp\.com)$/, "WhatsApp", "Мессенджеры"],
  [/(^|\.)max\.ru$/, "MAX", "Мессенджеры"],
  [/(^|\.)2gis\.[a-z.]+$/, "2ГИС", "Карты и справочники"],
  [/(^|\.)avito\.ru$/, "Авито", "Объявления"],
  [/(^|\.)(auto\.ru|drom\.ru)$/, "Авто.ру / Дром", "Объявления"],
  [/(^|\.)(hh\.ru|superjob\.ru)$/, "Сайты вакансий", "Объявления"],
];

const UTM_SOURCES: [RegExp, string, SourceGroup][] = [
  [/^(vk|vkontakte|vk_ads|vkads|mytarget)$/i, "ВКонтакте", "Соцсети"],
  [/^(tg|telegram|tgads|telegram_ads)$/i, "Telegram", "Мессенджеры"],
  [/^(wa|whatsapp)$/i, "WhatsApp", "Мессенджеры"],
  [/^max$/i, "MAX", "Мессенджеры"],
  [/^(avito)$/i, "Авито", "Объявления"],
  [/^(2gis|dgis)$/i, "2ГИС", "Карты и справочники"],
  [/^(yandex_maps|yandexmaps|ya_maps|maps|yandex_business|yabusiness)$/i, "Яндекс Карты", "Карты и справочники"],
  [/^(email|e-mail|mail|newsletter|sendpulse|unisender)$/i, "Email-рассылка", "Email"],
  [/^(youtube|yt)$/i, "YouTube", "Соцсети"],
  [/^(dzen|zen)$/i, "Дзен", "Соцсети"],
  [/^(instagram|ig)$/i, "Instagram", "Соцсети"],
  [/^(ok|odnoklassniki)$/i, "Одноклассники", "Соцсети"],
  [/^(hh|headhunter)$/i, "hh.ru", "Объявления"],
];

/** Канал одной точки входа */
export function classifyTouch(t: Touch | undefined, ownHost = "car-city.pro"): SourceInfo {
  t = t ?? {};
  const campaign = decodeTag(t.utm_campaign);
  const term = decodeTag(t.utm_term);
  const content = decodeContent(t.utm_content);
  const medium = decodeTag(t.utm_medium);
  const src = decodeTag(t.utm_source)?.toLowerCase() ?? "";
  const host = hostOf(t.referrer);
  const extra = { campaign, term, content, medium, ...(host ? { site: host } : {}) };
  const paid = PAID.test(medium ?? "");

  if (t.ref) return { channel: `Реферальная программа`, group: "Реферальная программа", ...extra, content: `код ${t.ref}${content ? ", " + content : ""}` };
  if (t.yclid || (/^(yandex|ya|direct|yandex_direct|yandexdirect|yd)$/.test(src) && (paid || !medium))) return { channel: "Яндекс Директ", group: "Реклама", ...extra };
  if (t.gclid || (/^(google|adwords|google_ads|googleads)$/.test(src) && paid)) return { channel: "Google Ads", group: "Реклама", ...extra };
  if (src) {
    for (const [re, name, group] of UTM_SOURCES) if (re.test(src)) return { channel: paid ? `${name}: реклама` : name, group: paid ? "Реклама" : group, ...extra };
    return { channel: `Метка: ${decodeTag(t.utm_source)}`, group: paid ? "Реклама" : "Другие сайты", ...extra };
  }
  if (host && !host.endsWith(ownHost.replace(/^www\./, "")) && !host.endsWith(".up.railway.app")) {
    if (/(^|\.)yandex\.[a-z.]+$/.test(host) && /\/maps/.test(t.referrer ?? "")) return { channel: "Яндекс Карты", group: "Карты и справочники", ...extra };
    for (const [re, name, group] of REFERRERS) if (re.test(host)) return { channel: name, group, ...extra };
    return { channel: `Сайт ${host}`, group: "Другие сайты", ...extra };
  }
  return { channel: "Прямой заход", group: "Прямой заход", ...extra };
}

/** Атрибуция заявки по первому и последнему входу */
export function attribute(first: Touch | undefined, last: Touch | undefined, ownHost?: string): Attribution {
  const f = classifyTouch(first, ownHost);
  const l = classifyTouch(last, ownHost);
  const main = l.group !== "Прямой заход" ? l : f;
  return { ...main, model: "last-significant", first: f, last: l };
}

/** Короткая строка «Яндекс Директ · кампания · «фраза»» для списков */
export function sourceLine(s?: SourceInfo): string {
  if (!s) return "—";
  return [s.channel, s.campaign, s.term && `«${s.term}»`].filter(Boolean).join(" · ");
}

export const SOURCE_GROUPS: SourceGroup[] = ["Реклама", "Поиск", "Карты и справочники", "Соцсети", "Мессенджеры", "Объявления", "Реферальная программа", "Email", "Другие сайты", "Прямой заход"];
