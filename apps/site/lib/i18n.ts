// Языки и адреса. Русский живёт в корне, остальные под /en, /ky, /kk, /uz (PRD 6).
// BASE — префикс хостинга: на GitHub Pages сайт лежит в /Car-City, на car-city.pro пусто.
import type { Locale } from "@car-city/i18n";

export type Lang = Locale;
export const LANGS: Lang[] = ["ru", "ky", "kk", "uz", "en"];
export const LANG_NAMES: Record<Lang, string> = { ru: "Русский", ky: "Кыргызча", kk: "Қазақша", uz: "Oʻzbekcha", en: "English" };
export const LANG_SHORT: Record<Lang, string> = { ru: "RU", ky: "KG", kk: "KZ", uz: "UZ", en: "EN" };
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const isLang = (s: string | undefined): s is Lang => !!s && (LANGS as string[]).includes(s);

/** Номер сборки: у картинок и видео одинаковые имена, а браузер держит их в кэше неделю.
 *  ?v=сборка в адресе — новая выкладка сразу показывает новые файлы, а не старые из кэша. */
export const BUILD = process.env.NEXT_PUBLIC_BUILD_ID ?? "";
const MEDIA = /\.(webp|avif|png|jpe?g|svg|mp4|webm|gif)$/i;

/** Файлы из public/: картинки, видео, иконки */
export const asset = (p: string) => {
  if (!p.startsWith("/") || p.startsWith("//")) return p;
  const url = BASE && p.startsWith(BASE + "/") ? p : BASE + p;
  return BUILD && MEDIA.test(p) ? `${url}?v=${BUILD}` : url;
};

/** Ссылка на страницу сайта на нужном языке. Внешние ссылки, якоря и tel: не трогает. */
export function href(p: string | undefined, lang: Lang = "ru") {
  if (!p) return "";
  if (!p.startsWith("/") || p.startsWith("//")) return p;
  const pre = lang === "ru" ? "" : `/${lang}`;
  if (p === "/") return BASE + (pre || "/");
  if (p.startsWith("/#")) return BASE + (pre || "") + "/" + p.slice(1);
  return BASE + pre + p;
}

/** Разбор пути из адресной строки: язык и путь русской версии */
export function splitLang(pathname: string): { lang: Lang; path: string } {
  let p = pathname;
  if (BASE && p.startsWith(BASE)) p = p.slice(BASE.length) || "/";
  const seg = p.split("/").filter(Boolean);
  if (isLang(seg[0]) && seg[0] !== "ru") return { lang: seg[0], path: "/" + seg.slice(1).join("/") };
  return { lang: "ru", path: p.replace(/\/+$/, "") || "/" };
}

/** Внутренние ссылки в готовом HTML из текстов страниц */
export function localizeHtml(html: string, lang: Lang) {
  return html
    .replace(/(<a\b[^>]*?\shref=")(\/(?!\/)[^"]*)"/g, (_, a: string, p: string) => `${a}${href(p, lang)}"`)
    .replace(/(<img\b[^>]*?\ssrc=")(\/(?!\/)[^"]*)"/g, (_, a: string, p: string) => `${a}${asset(p)}"`);
}
