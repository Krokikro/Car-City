// Две таблички под фото на странице модели: «Цена» (главное) и «Детали» (характеристики).
// Берём таблицы из текста страницы старого сайта и убираем их из разделов ниже, чтобы не повторять.
import type { Parsed } from "./blocks";
import type { FleetCar } from "./fleet";

export interface PriceTable { head: string[]; rows: string[][] }
export interface Panels { price?: PriceTable; details: [string, string][] }

const TBL = /<div class="tbl"[^>]*>\s*<table>([\s\S]*?)<\/table>\s*<\/div>/g;
const cells = (row: string, tag: "th" | "td") => [...row.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "g"))].map((m) => m[1].trim());

function parseTable(inner: string) {
  const head = cells(inner.match(/<thead>([\s\S]*?)<\/thead>/)?.[1] ?? "", "th");
  const rows = [...(inner.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1] ?? "").matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((m) => cells(m[1], "td"));
  return { head, rows };
}
const text = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
// денежная ячейка → <b class="pm">; срок («1 год», «от 3-7 дней») оставляем текстом
const money = (h: string) => {
  if (/pr-now/.test(h)) return h;
  const t = text(h);
  if (/год|дн|мес/.test(t) || !/\d/.test(t)) return t;
  return `<b class="pm">${/₽/.test(t) ? t.replace(/\s*₽/, "&nbsp;₽") : `${t}&nbsp;₽`}</b>`;
};

// «Объем двигателя 2 л» → [«Объем двигателя», «2 л»], «2020 год выпуска» → [«Год выпуска», «2020»]
function specPair(s: string): [string, string] | null {
  let m = s.match(/^(\d{4})\s+год выпуска$/i);
  if (m) return ["Год выпуска", m[1]];
  m = s.match(/^(.*?)\s+привод$/i);
  if (m) return ["Привод", m[1][0].toUpperCase() + m[1].slice(1)];
  m = s.match(/^(Объем двигателя|Средний расход|Расход|Мощность|Коробка|КПП|Грузоподъемность|Объем кузова|Двигатель)\s*:?\s+(.+)$/i);
  if (m) return [m[1], m[2]];
  return null;
}

export function modelPanels(p: Parsed, car?: FleetCar, clsName?: string): Panels {
  let price: PriceTable | undefined;
  let details: [string, string][] = [];
  for (const b of p.blocks) {
    if (b.t !== "section") continue;
    b.html = b.html.replace(TBL, (whole, inner: string) => {
      const t = parseTable(inner);
      const h0 = (t.head[0] ?? "").toLowerCase();
      if (!details.length && /параметр/.test(h0)) {
        details = t.rows.filter((r) => r[1] && !/пусто/i.test(r[1])).map((r) => [text(r[0]), text(r[1])]);
        return "";
      }
      if (!price && /график|модель|взнос|депозит|срок/.test(t.head.join(" ").toLowerCase())) {
        // «Модель | График 7/0 | 6/1 | 5/2» в одну строку → столбиком: график → цена
        if (/модель/.test(h0) && t.rows.length === 1) price = { head: ["График", "Цена в сутки"], rows: t.head.slice(1).map((h, i) => [h.replace(/^График\s*/i, ""), money(t.rows[0][i + 1] ?? "")]) };
        else price = { head: t.head, rows: t.rows.map((r) => r.map((c, i) => (i === 0 ? c : money(c)))) };
        return "";
      }
      return whole;
    });
  }
  // нет таблицы характеристик — собираем из строк под заголовком и данных автопарка
  const have = new Set(details.map(([k]) => k.toLowerCase()));
  const add = (k: string, v?: string) => { if (v && !have.has(k.toLowerCase())) { details.push([k, v]); have.add(k.toLowerCase()); } };
  for (const s of p.intro.specs) { const pr = specPair(s); if (pr) add(pr[0], pr[1]); }
  add("Объем двигателя", car?.engine);
  add("Коробка", car?.gearbox);
  if (clsName) add("Класс", clsName);
  return { price, details };
}
