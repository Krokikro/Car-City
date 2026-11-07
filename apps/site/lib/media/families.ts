// Слоты графики сайта. Один слот — одна картинка или видео во всех размерах и форматах:
// например, фото машины в карточке — это /cars/x-640.webp, -640.avif, -1200.webp, -1200.avif.
// Замена слота в админке готовит все варианты сразу, точно в исходных размерах, поэтому вёрстка не ломается.

import manifest from "../media-manifest.json";
import { BASE_FLEET } from "../admin/overlay";

export interface Variant { path: string; w?: number; h?: number; fmt: string; bytes: number; dur?: number }
export interface Family { key: string; kind: "image" | "video"; group: string; label: string; variants: Variant[]; w?: number; h?: number; formats: string[]; maxBytes: number; transparent?: boolean; svg?: boolean }

type Entry = { bytes: number; w?: number; h?: number; dur?: number };
const M = manifest as Record<string, Entry>;
const VID = /\.(mp4|webm)$/i;

const GROUPS: [RegExp, string][] = [
  [/^\/video\//, "Видео главной"],
  [/^\/classes\//, "Страницы классов и выкупа: видео и обложки"],
  [/^\/cars\//, "Машины — тёмная версия"],
  [/^\/cars-light\//, "Машины — светлая версия"],
  [/^\/pages\//, "Картинки страниц"],
  [/^\/news\//, "Обложки статей — тёмная версия"],
  [/^\/news-light\//, "Обложки статей — светлая версия"],
  [/^\/team\//, "Команда"],
  [/^\/owners\//, "Выкупившие"],
  [/^\/promo\//, "Промо-карточки"],
  [/^\/steps\//, "Шаги и дорога"],
  [/^\/brand\//, "Логотип и знаки"],
  [/^\/themes\//, "Файлы старого сайта (по старым адресам)"],
];
export const GROUP_ORDER = GROUPS.map(([, g]) => g);

const SHOT: Record<string, string> = { front: "спереди", rear: "сзади", side: "сбоку", interior: "салон", lit: "свет фар при наведении (прозрачный слой)" };
const carName = (slug: string) => BASE_FLEET.find((c) => c.slug === slug)?.name;

function label(key: string, kind: "image" | "video"): string {
  const file = key.split("/").pop()!;
  const car = key.match(/^\/cars(?:-light)?\/(.+?)(?:-(front|rear|side|interior|lit))?$/);
  if (car && carName(car[1])) return `${carName(car[1])} — ${car[2] ? SHOT[car[2]] : "фото в карточке"}`;
  if (key.startsWith("/video/hero")) return kind === "video" ? "Видео первого экрана" : "Кадр-заставка первого экрана";
  if (key.startsWith("/classes/")) return `${{ ekonom: "Эконом", komfort: "Комфорт", "komfort-plus": "Комфорт+", gruzovoy: "Грузовой", vykup: "Выкуп", biznes: "Бизнес", dostavka: "Доставка" }[file] ?? file}: ${kind === "video" ? "видео в шапке" : "обложка до загрузки видео"}`;
  return file.replace(/[-_]+/g, " ");
}

/** Ключ слота: путь без размера (-640, -1200…) и без расширения + тип */
export function familyKey(path: string) {
  const kind = VID.test(path) ? "video" : "image";
  return { key: path.replace(/\.[a-z0-9]+$/i, "").replace(/-(\d{3,4})$/, ""), kind } as const;
}

let cache: Family[] | null = null;
export function families(): Family[] {
  if (cache) return cache;
  const map = new Map<string, Family>();
  for (const [path, e] of Object.entries(M)) {
    const { key, kind } = familyKey(path);
    const id = `${key}|${kind}`;
    const fmt = path.split(".").pop()!.toLowerCase();
    let f = map.get(id);
    if (!f) {
      f = { key, kind, group: GROUPS.find(([re]) => re.test(path))?.[1] ?? "Прочее", label: label(key, kind), variants: [], formats: [], maxBytes: 0 };
      map.set(id, f);
    }
    f.variants.push({ path, w: e.w, h: e.h, fmt, bytes: e.bytes, dur: e.dur });
  }
  for (const f of map.values()) {
    f.variants.sort((a, b) => (b.w ?? 0) - (a.w ?? 0));
    const big = f.variants[0];
    f.w = big.w; f.h = big.h;
    f.formats = [...new Set(f.variants.map((v) => v.fmt))];
    f.svg = f.formats.includes("svg");
    f.transparent = /-lit$/.test(f.key) || f.formats.includes("png") || f.svg;
    // предел веса: видео — до 40 МБ, картинка — до 15 МБ (исходник; на сайт уйдут сжатые варианты)
    f.maxBytes = f.kind === "video" ? 40 * 1024 * 1024 : 15 * 1024 * 1024;
  }
  cache = [...map.values()].sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) || a.label.localeCompare(b.label, "ru"));
  return cache;
}
export const familyById = (key: string, kind: string) => families().find((f) => f.key === key && f.kind === kind);

/** Рекомендация для загрузки: «1200 × 896 px, WebP/AVIF/JPG/PNG, до 15 МБ» */
export function recommend(f: Family): string {
  if (f.kind === "video") return `MP4 (H.264), ${f.w ?? "?"} × ${f.h ?? "?"} px (${ratio(f.w, f.h)}), без звука, до 40 МБ${f.variants[0].dur ? `, около ${f.variants[0].dur} с` : ""}`;
  if (f.svg) return "SVG (векторный файл), без скриптов";
  return `${f.w ?? "?"} × ${f.h ?? "?"} px (${ratio(f.w, f.h)}), JPG, PNG, WebP или AVIF${f.transparent ? " с прозрачным фоном" : ""}, до 15 МБ`;
}
export function ratio(w?: number, h?: number) {
  if (!w || !h) return "?";
  const known: [number, string][] = [[16 / 9, "16:9"], [4 / 3, "4:3"], [3 / 2, "3:2"], [1, "1:1"], [3 / 4, "3:4"], [2 / 3, "2:3"], [9 / 16, "9:16"], [21 / 9, "21:9"], [1200 / 896, "4:3"]];
  const r = w / h;
  const hit = known.find(([k]) => Math.abs(k - r) / k < 0.02);
  return hit ? hit[1] : `${Math.round(r * 100) / 100}:1`;
}
