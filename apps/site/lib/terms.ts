// «Условия»: пункты (заголовок + текст) и тарифы из текста страницы старого сайта.
// Тексты не меняем — только раскладываем по плиткам и добавляем к тарифам цену и машину из автопарка.
import type { Parsed } from "./blocks";
import { fleet } from "./fleet";
import { carImages } from "./car-images";
import { hasRent, hasBuy } from "./prices";
import { ui } from "./ui";

export interface TermItem { title: string; text: string }
export interface Tariff { label: string; href: string; cls: string; from: number; count: number; car?: { slug: string; name: string } }
export interface Terms { items: TermItem[]; title: string; tariffs: Tariff[]; btn?: { label: string; href: string } }

const strip = (h: string) => h.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const CLS: [RegExp, string][] = [[/biznes/, "biznes"], [/dostavka/, "dostavka"], [/komfort-?pl/, "komfort-plus"], [/komfort/, "komfort"], [/ekonom/, "ekonom"], [/gruzov/, "gruzovoy"]];
// лицо класса: не Polo, а машины, которые хорошо смотрятся на фото
const FACE: Record<string, string> = { ekonom: "kia-rio-1.6", komfort: "belgee-x50", "komfort-plus": "chery-tiggo-7-pro-max", biznes: "hongqi-h5", gruzovoy: "sollers-argo", dostavka: "lada-granta" };
// все тарифы парка: блок «У нас доступны разные тарифы» показывает каждый, кроме класса текущей страницы
const ALL: { cls: string; rent: string; buy: string; key: string }[] = [
  { cls: "ekonom", rent: "/ekonom", buy: "/vykup/ekonom", key: "ekonom" },
  { cls: "komfort", rent: "/komfort", buy: "/vykup/komfort", key: "komfort" },
  { cls: "komfort-plus", rent: "/komfortplus", buy: "/vykup/komfort-plyus", key: "komfortplus" },
  { cls: "biznes", rent: "/biznes", buy: "/biznes", key: "biznes" },
  { cls: "gruzovoy", rent: "/gruzovoy", buy: "/gruzovoy", key: "gruzovoy" },
  { cls: "dostavka", rent: "/vykup/dostavka/lada-granta", buy: "/vykup/dostavka/lada-granta", key: "dostavka" },
];

/** Карточки тарифов из блока-«пилюль» («комфорт · комфорт+ · грузовой»): цена, число машин и лицо класса из автопарка */
export function tariffsOf(html: string, lang = "ru", own?: string): Tariff[] {
  const pills = [...html.matchAll(/<a class="pill" href="([^"]+)">([\s\S]*?)<\/a>/g)].map((m) => ({ href: m[1], label: strip(m[2]), cls: CLS.find(([re]) => re.test(m[1]))?.[1] ?? "" }));
  const buyCtx = pills.length > 0 && pills.every((x) => /vykup/.test(x.href));
  // недостающие тарифы — в общем порядке парка
  const list = ALL.filter((a) => a.cls !== own).map((a) => pills.find((x) => x.cls === a.cls) ?? { href: buyCtx ? a.buy : a.rent, label: (ui(lang as never).cls as Record<string, string>)[a.key] ?? a.cls, cls: a.cls });
  return list.map(({ href: to, label, cls }) => {
    const buy = /vykup/.test(to) || cls === "biznes" || cls === "dostavka";
    const cars = fleet.filter((f) => f.cls === cls && (buy ? hasBuy(f) : hasRent(f)));
    const face = cars.find((f) => f.slug === FACE[cls]) ?? cars.find((f) => carImages[f.slug]);
    return {
      label: label.toLowerCase(),
      href: to,
      cls,
      count: cars.length,
      from: cars.length ? Math.min(...cars.map((c) => (buy ? c.buyPrice ?? c.price : c.price))) : 0,
      car: face && carImages[face.slug] ? { slug: face.slug, name: face.name } : undefined,
    };
  }).filter((t) => t.count > 0);
}

export function termsOf(p: Parsed, lang = "ru"): Terms {
  const items = [...p.intro.html.matchAll(/<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g)].map((m) => ({ title: strip(m[1]), text: strip(m[2]) }));
  const sec = p.blocks.find((b) => b.t === "section" && /pill-row/.test(b.html));
  const tariffs: Tariff[] = sec && sec.t === "section" ? tariffsOf(sec.html, lang) : [];
  return { items, title: sec && sec.t === "section" ? sec.title : "", tariffs, btn: sec && sec.t === "section" ? sec.btns?.[0] : undefined };
}
