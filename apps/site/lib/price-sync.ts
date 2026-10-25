// Таблицы «Модель | График 7/0 | 6/1 | 5/2» (и «Модель | 1–2 дня | …» у грузовых) в текстах страниц
// перезаполняются из единого источника цен (lib/prices.ts), чтобы на всех страницах у машины была одна цена.
import { fleet, type FleetCar } from "./fleet";
import { rentRows, type PriceRow } from "./prices";

const norm = (s: string) => s.toLowerCase().replace(/<[^>]+>/g, "").replace(/&nbsp;/g, "").replace(/[^a-zа-я0-9]/gi, "");
const ALIAS: Record<string, string> = { kiario16: "kia-rio-1.6", kiario14: "kia-rio-1.4", kiarioxline: "kia-rio-1.4", kiario: "kia-rio-1.6", volkswagenpolo: "volkswagen-polo-1.6", skodarapid: "skoda-rapid-1.6", omodas5: "omoda-s-5", exeedlx: "exeed-lx-2023" };

export function carByName(name: string): FleetCar | undefined {
  const n = norm(name);
  if (!n) return undefined;
  const slug = ALIAS[n];
  return fleet.find((c) => (slug ? c.slug === slug : norm(c.name) === n || norm(c.slug) === n));
}

const fmt = (n: number) => n.toLocaleString("ru-RU").replace(/\s/g, " ") + " ₽";
const td = (r: PriceRow) => (r.o && r.o > r.p ? `<td class="td-price"><span class="pr-now">${fmt(r.p)}</span><s class="pr-old">${fmt(r.o)}</s></td>` : `<td>${fmt(r.p)}</td>`);
const cells = (row: string, tag: string) => [...row.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "g"))].map((m) => m[1]);

export function syncPriceTables(html: string): string {
  return html.replace(/<table>([\s\S]*?)<\/table>/g, (whole, inner: string) => {
    const head = cells(inner.match(/<thead>([\s\S]*?)<\/thead>/)?.[1] ?? "", "th");
    if (head.length < 3 || !/модел|model|модел|modell/i.test(norm(head[0]) + head[0])) return whole;
    const sched = head.slice(1).map((h) => h.match(/\d\/\d/)?.[0]);
    const body = inner.replace(/<tr>([\s\S]*?)<\/tr>/g, (tr, row: string) => {
      if (/<th/.test(row)) return tr;
      const c = cells(row, "td");
      const car = carByName(c[0] ?? "");
      if (!car) return tr;
      const rows = rentRows(car);
      if (!rows.length) return tr;
      const out = head.slice(1).map((_, i) => {
        const r = sched[i] ? rows.find((x) => x.k === sched[i]) : rows.length === head.length - 1 ? rows[i] : undefined;
        return r ? td(r) : `<td>${c[i + 1] ?? ""}</td>`;
      });
      return `<tr><td>${c[0]}</td>${out.join("")}</tr>`;
    });
    return `<table>${body}</table>`;
  });
}
