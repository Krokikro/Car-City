// «Условия»: пункты (заголовок + текст) и тарифы из текста страницы старого сайта.
// Тексты не меняем — только раскладываем по плиткам и добавляем к тарифам цену и машину из автопарка.
import type { Parsed } from "./blocks";
import { fleet } from "./fleet";
import { carImages } from "./car-images";

export interface TermItem { title: string; text: string }
export interface Tariff { label: string; href: string; cls: string; from: number; count: number; car?: { slug: string; name: string } }
export interface Terms { items: TermItem[]; title: string; tariffs: Tariff[]; btn?: { label: string; href: string } }

const strip = (h: string) => h.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const CLS: [RegExp, string][] = [[/komfort-?pl/, "komfort-plus"], [/komfort/, "komfort"], [/ekonom/, "ekonom"], [/gruzov/, "gruzovoy"]];
// лицо класса: не Polo, а машины, которые хорошо смотрятся на фото
const FACE: Record<string, string> = { ekonom: "kia-rio-1.6", komfort: "belgee-x50", "komfort-plus": "chery-tiggo-7-pro-max" };

export function termsOf(p: Parsed): Terms {
  const items = [...p.intro.html.matchAll(/<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g)].map((m) => ({ title: strip(m[1]), text: strip(m[2]) }));
  const sec = p.blocks.find((b) => b.t === "section" && /pill-row/.test(b.html));
  const tariffs: Tariff[] = sec && sec.t === "section"
    ? [...sec.html.matchAll(/<a class="pill" href="([^"]+)">([\s\S]*?)<\/a>/g)].map((m) => {
        const cls = CLS.find(([re]) => re.test(m[1]))?.[1] ?? "";
        const cars = fleet.filter((f) => f.cls === cls);
        const face = cars.find((f) => f.slug === FACE[cls]) ?? cars.find((f) => carImages[f.slug]);
        return {
          label: strip(m[2]),
          href: m[1],
          cls,
          count: cars.length,
          from: cars.length ? Math.min(...cars.map((c) => c.price)) : 0,
          car: face && carImages[face.slug] ? { slug: face.slug, name: face.name } : undefined,
        };
      })
    : [];
  return { items, title: sec && sec.t === "section" ? sec.title : "", tariffs, btn: sec && sec.t === "section" ? sec.btns?.[0] : undefined };
}
