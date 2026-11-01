// Единый источник цен: таблицы аренды по графикам (или по сроку у грузовых) и графики выкупа для каждой машины.
// Из него рисуются карточки, шапки и таблицы на всех страницах, поэтому цена одной машины везде одинаковая.
// Самая низкая строка аренды = «от …» из автопарка (fleet.price), самая низкая строка выкупа = fleet.buyPrice:
// если цену поменять в админке, остальные строки таблицы пересчитаются в той же пропорции.
import type { FleetCar } from "./fleet";

export interface PriceRow { /** график «7/0», срок «от 30 дней» или «1 год» */ k: string; /** цена в сутки */ p: number; /** старая цена (зачёркнутая) */ o?: number; /** первоначальный взнос / депозит */ dep?: number }
interface CarPrices { rent?: PriceRow[]; buy?: PriceRow[] }

/** Как показывать скидку: старая цена зачёркнута + плашка, только старая цена, только плашка «−N%», плашка «до −N%», не показывать */
export type Disp = "auto" | "old" | "badge" | "upto" | "none";
export const DISP_NAMES: Record<Disp, string> = { auto: "Старая цена + плашка", old: "Только зачёркнутая цена", badge: "Только плашка «−N%»", upto: "Плашка «до −N%»", none: "Не показывать скидку" };
/** Таблица цен машины из админки (раздел «Автопарк и цены»). Пустой массив — этого вида у машины нет. */
export interface PriceTable { rent?: PriceRow[]; buy?: PriceRow[]; rentDisp?: Disp; buyDisp?: Disp }
export type PriceTables = Record<string, PriceTable>;

// Таблицы из админки: на сервере — из базы (overlay → setPriceTables), в браузере — из <script id="cc-prices">.
const gp = globalThis as typeof globalThis & { __ccPrices?: PriceTables };
let clientPrices: PriceTables | null = null;
export function priceTables(): PriceTables {
  if (typeof document !== "undefined") {
    if (!clientPrices) { try { clientPrices = JSON.parse(document.getElementById("cc-prices")?.textContent || "{}"); } catch { clientPrices = {}; } }
    return clientPrices!;
  }
  return gp.__ccPrices ?? {};
}
export function setPriceTables(t: PriceTables) { gp.__ccPrices = t; }
export const pricesJson = () => JSON.stringify(priceTables()).replace(/</g, "\\u003c");
/** исходные строки из файла — для админки (кнопка «вернуть как было») */
export const filePrices = (slug: string): CarPrices => DATA[slug] ?? {};
const showsOld = (d?: Disp) => !d || d === "auto" || d === "old";
const stripOld = (rows: PriceRow[], d?: Disp) => (showsOld(d) ? rows : rows.map((r) => ({ ...r, o: undefined })));

// prettier-ignore
const DATA: Record<string, CarPrices> = {
  "moskvich-3": {"rent": [{"k": "7/0", "p": 2000}, {"k": "6/1", "p": 2340}, {"k": "5/2", "p": 2800}], "buy": [{"dep": 0, "k": "1 год", "p": 2800}, {"dep": 0, "k": "1,5 года", "p": 2200}, {"dep": 0, "k": "2 года", "p": 2000}]},
  "belgee-x50": {"rent": [{"k": "7/0", "p": 2400}, {"k": "6/1", "p": 2800, "o": 3000}, {"k": "5/2", "p": 3360, "o": 3600}], "buy": [{"dep": 120000, "k": "1 год", "p": 5370}, {"dep": 120000, "k": "1,5 года", "p": 4088}, {"dep": 120000, "k": "2 года", "p": 3452}, {"dep": 120000, "k": "3 года", "p": 2813}]},
  "geely-emgrand": {"rent": [{"k": "7/0", "p": 2000}, {"k": "6/1", "p": 2340, "o": 3000}, {"k": "5/2", "p": 2800, "o": 3600}], "buy": [{"dep": 100000, "k": "1 год", "p": 4373}, {"dep": 100000, "k": "1,5 года", "p": 3328}, {"dep": 100000, "k": "2 года", "p": 2811}, {"dep": 100000, "k": "3 года", "p": 2290}]},
  "chery-tiggo-4-pro": {"rent": [{"k": "7/0", "p": 2000}, {"k": "6/1", "p": 2340, "o": 3000}, {"k": "5/2", "p": 2800, "o": 3600}], "buy": [{"dep": 100000, "k": "1 год", "p": 3529}, {"dep": 100000, "k": "1,5 года", "p": 2686}, {"dep": 100000, "k": "2 года", "p": 2268}, {"dep": 100000, "k": "3 года", "p": 1848}]},
  "omoda-s-5": {"rent": [{"k": "7/0", "p": 2000}, {"k": "6/1", "p": 2340, "o": 3000}, {"k": "5/2", "p": 2800, "o": 3600}], "buy": [{"dep": 100000, "k": "1 год", "p": 3644}, {"dep": 100000, "k": "1,5 года", "p": 2774}, {"dep": 100000, "k": "2 года", "p": 2342}]},
  "chery-tiggo-4": {"rent": [{"k": "7/0", "p": 2000}, {"k": "6/1", "p": 2340, "o": 3300}, {"k": "5/2", "p": 2800, "o": 3920}], "buy": [{"dep": 100000, "k": "1 год", "p": 3145}, {"dep": 100000, "k": "1,5 года", "p": 2394}, {"dep": 100000, "k": "2 года", "p": 2022}]},
  "exeed-lx-2023": {"rent": [{"k": "7/0", "p": 2600}, {"k": "6/1", "p": 3040}, {"k": "5/2", "p": 3640}], "buy": [{"dep": 150000, "k": "1 год", "p": 4411}, {"dep": 150000, "k": "1,5 года", "p": 3358}, {"dep": 150000, "k": "2 года", "p": 2836}]},
  "jac-j7": {"rent": [{"k": "7/0", "p": 2600}, {"k": "6/1", "p": 3040}, {"k": "5/2", "p": 3640}], "buy": [{"dep": 120000, "k": "1 год", "p": 3145}, {"dep": 120000, "k": "1,5 года", "p": 2394}, {"dep": 120000, "k": "2 года", "p": 2022}]},
  "haval-f7": {"rent": [{"k": "7/0", "p": 2600}, {"k": "6/1", "p": 3040}, {"k": "5/2", "p": 3640}], "buy": [{"dep": 140000, "k": "1 год", "p": 4411}, {"dep": 140000, "k": "1,5 года", "p": 3358}, {"dep": 140000, "k": "2 года", "p": 2836}]},
  "chery-tiggo-7-pro-max": {"rent": [{"k": "7/0", "p": 2600}, {"k": "6/1", "p": 3040}, {"k": "5/2", "p": 3640}], "buy": [{"dep": 150000, "k": "1 год", "p": 6330}, {"dep": 150000, "k": "1,5 года", "p": 4820}, {"dep": 150000, "k": "2 года", "p": 4070}, {"dep": 150000, "k": "3 года", "p": 3315}]},
  "hyundai-sonata": {"rent": [{"k": "7/0", "p": 2800}, {"k": "6/1", "p": 3600}, {"k": "5/2", "p": 4400}], "buy": [{"dep": 130000, "k": "1 год", "p": 5753}, {"dep": 130000, "k": "1,5 года", "p": 4380}, {"dep": 130000, "k": "2 года", "p": 3699}, {"dep": 130000, "k": "3 года", "p": 3200}]},
  "kia-k5": {"rent": [{"k": "7/0", "p": 2800}, {"k": "6/1", "p": 3600}, {"k": "5/2", "p": 4400}], "buy": [{"dep": 130000, "k": "1 год", "p": 7288}, {"dep": 130000, "k": "1,5 года", "p": 5547}, {"dep": 130000, "k": "2 года", "p": 4685}, {"dep": 130000, "k": "3 года", "p": 3420}]},
  "geely-atlas-pro": {"rent": [{"k": "7/0", "p": 2600}, {"k": "6/1", "p": 3040}, {"k": "5/2", "p": 3640}], "buy": [{"dep": 140000, "k": "1 год", "p": 5370}, {"dep": 140000, "k": "1,5 года", "p": 4090}, {"dep": 140000, "k": "2 года", "p": 3460}, {"dep": 140000, "k": "3 года", "p": 2900}]},
  "chery-tiggo-7-pro": {"rent": [{"k": "7/0", "p": 2600}, {"k": "6/1", "p": 3040}, {"k": "5/2", "p": 3640}], "buy": [{"dep": 140000, "k": "1 год", "p": 4795}, {"dep": 140000, "k": "1,5 года", "p": 3650}, {"dep": 140000, "k": "2 года", "p": 3082}, {"dep": 140000, "k": "3 года", "p": 2511}]},
  "tenet-t7": {"buy": [{"dep": 170000, "k": "1 год", "p": 7211}, {"dep": 170000, "k": "1,5 года", "p": 5489}, {"dep": 170000, "k": "2 года", "p": 4636}, {"dep": 170000, "k": "3 года", "p": 3777}]},
  "belgee-x70": {"buy": [{"dep": 170000, "k": "1 год", "p": 8170}, {"dep": 170000, "k": "1,5 года", "p": 6219}, {"dep": 170000, "k": "2 года", "p": 5252}, {"dep": 170000, "k": "3 года", "p": 4279}]},
  "volkswagen-polo-1.6": {"rent": [{"k": "7/0", "p": 1900, "o": 2100}, {"k": "6/1", "p": 2250}, {"k": "5/2", "p": 2660}], "buy": [{"dep": 100000, "k": "1 год", "p": 3414}, {"dep": 100000, "k": "1,5 года", "p": 2599}, {"dep": 100000, "k": "2 года", "p": 2195}]},
  "kia-rio-1.4": {"rent": [{"k": "7/0", "p": 1900, "o": 2100}, {"k": "6/1", "p": 2550}, {"k": "5/2", "p": 2660}], "buy": [{"dep": 100000, "k": "1 год", "p": 3989}, {"dep": 100000, "k": "1,5 года", "p": 3036}, {"dep": 100000, "k": "2 года", "p": 2564}, {"dep": 100000, "k": "3 года", "p": 2089}]},
  "kia-rio-1.6": {"rent": [{"k": "7/0", "p": 1900, "o": 2100}, {"k": "6/1", "p": 2250}, {"k": "5/2", "p": 2660}], "buy": [{"dep": 100000, "k": "1 год", "p": 3989}, {"dep": 100000, "k": "1,5 года", "p": 3036}, {"dep": 100000, "k": "2 года", "p": 2564}, {"dep": 100000, "k": "3 года", "p": 2089}]},
  "skoda-rapid-1.6": {"rent": [{"k": "7/0", "p": 1500}, {"k": "6/1", "p": 1750}, {"k": "5/2", "p": 2100}], "buy": [{"dep": 100000, "k": "1 год", "p": 3989}, {"dep": 100000, "k": "1,5 года", "p": 3036}, {"dep": 100000, "k": "2 года", "p": 2564}, {"dep": 100000, "k": "3 года", "p": 2089}]},
  "hongqi-h5": {"buy": [{"dep": 0, "k": "1 год", "p": 10042}, {"dep": 0, "k": "1,5 года", "p": 7644}, {"dep": 0, "k": "2 года", "p": 6455}, {"dep": 0, "k": "3 года", "p": 5260}]},
  "voyah-dream": {"buy": [{"dep": 300000, "k": "1 год", "p": 17260}, {"dep": 300000, "k": "1,5 года", "p": 13139}, {"dep": 300000, "k": "2 года", "p": 11096}, {"dep": 300000, "k": "3 года", "p": 9041}]},
  "gac-m8": {"buy": [{"dep": 300000, "k": "1 год", "p": 14575}, {"dep": 300000, "k": "1,5 года", "p": 11095}, {"dep": 300000, "k": "2 года", "p": 9370}, {"dep": 300000, "k": "3 года", "p": 7635}]},
  "sollers-atlant-19-td": {"rent": [{"k": "1–15 дней", "p": 3825, "dep": 20000}, {"k": "16–29 дней", "p": 3525, "dep": 20000}, {"k": "от 30 дней", "p": 3375, "dep": 20000}], "buy": [{"dep": 130000, "k": "1 год", "p": 5370}, {"dep": 130000, "k": "1,5 года", "p": 4088}, {"dep": 130000, "k": "2 года", "p": 3452}, {"dep": 130000, "k": "3 года", "p": 2813}]},
  "sollers-atlant-l3h2-2-7d": {"rent": [{"k": "1–2 дней", "p": 4650, "dep": 20000}, {"k": "3–7 дней", "p": 4125, "dep": 20000}, {"k": "8–15 дней", "p": 3975, "dep": 20000}, {"k": "16–29 дней", "p": 3900, "dep": 20000}, {"k": "от 30 дней", "p": 3600, "dep": 20000}], "buy": [{"dep": 150000, "k": "1 год", "p": 9041}, {"dep": 150000, "k": "1,5 года", "p": 6945}, {"dep": 150000, "k": "2 года", "p": 5877}, {"dep": 150000, "k": "3 года", "p": 4420}]},
  "sollers-argo": {"rent": [{"k": "1–2 дней", "p": 3600, "dep": 20000}, {"k": "3–7 дней", "p": 3525, "dep": 20000}, {"k": "8–15 дней", "p": 3975, "dep": 20000}, {"k": "16–29 дней", "p": 3300, "dep": 20000}, {"k": "от 30 дней", "p": 3150, "dep": 20000}], "buy": [{"dep": 150000, "k": "1 год", "p": 6575}, {"dep": 150000, "k": "1,5 года", "p": 5051}, {"dep": 150000, "k": "2 года", "p": 4274}]},
  "lada-largus": {"buy": [{"dep": 120000, "k": "1 год", "p": 4756}, {"dep": 120000, "k": "1,5 года", "p": 3620}, {"dep": 120000, "k": "2 года", "p": 3058}, {"dep": 120000, "k": "3 года", "p": 2491}]},
  "sollers-atlant-sf4-l4": {"rent": [{"k": "1–2 дней", "p": 6500, "dep": 20000}, {"k": "3–7 дней", "p": 6100, "dep": 20000}, {"k": "8–15 дней", "p": 5900, "dep": 20000}, {"k": "16–29 дней", "p": 5700, "dep": 20000}, {"k": "от 30 дней", "p": 5500, "dep": 20000}], "buy": [{"dep": 200000, "k": "1 год", "p": 12082}, {"dep": 200000, "k": "1,5 года", "p": 9197}, {"dep": 200000, "k": "2 года", "p": 7767}, {"dep": 200000, "k": "3 года", "p": 6329}]},
  "lada-granta": {"buy": [{"dep": 80000, "k": "1 год", "p": 3452}, {"dep": 80000, "k": "1,5 года", "p": 2628}, {"dep": 80000, "k": "2 года", "p": 2219}, {"dep": 80000, "k": "3 года", "p": 1808}]},
};

const r10 = (n: number) => Math.round(n / 10) * 10;
function scale(rows: PriceRow[] | undefined, target?: number, baseOld?: number): PriceRow[] {
  if (!rows?.length) return [];
  const min = Math.min(...rows.map((r) => r.p));
  const f = target && target > 0 ? target / min : 1;
  return rows.map((r) => {
    const p = f === 1 ? r.p : r.p === min ? target! : r10(r.p * f);
    const o = r.p === min && baseOld && baseOld > p ? baseOld : r.o ? (f === 1 ? r.o : r10(r.o * f)) : undefined;
    return { ...r, p, ...(o ? { o } : { o: undefined }) };
  });
}

/** строки аренды машины (по графикам или по сроку) с учётом цены и скидки из автопарка */
export const rentRows = (c: FleetCar): PriceRow[] => {
  if (!hasRent(c)) return [];
  const t = priceTables()[c.slug];
  if (t?.rent) return stripOld(t.rent, t.rentDisp);
  return scale(DATA[c.slug]?.rent, c.price, c.old);
};
/** строки выкупа: взнос, срок, платёж в сутки (без выкупного платежа) */
export const buyRows = (c: FleetCar): PriceRow[] => {
  if (!hasBuy(c)) return [];
  const t = priceTables()[c.slug];
  if (t?.buy) return stripOld(t.buy, t.buyDisp);
  return scale(DATA[c.slug]?.buy, c.buyPrice, c.buyOld);
};

/** Цены «от» и скидки машины из таблицы админки — для автопарка (overlay вызывает при загрузке) */
export function deriveFromTable(c: FleetCar) {
  const t = priceTables()[c.slug];
  if (!t) return;
  const pick = (rows: PriceRow[]) => rows.reduce((a, b) => (b.p < a.p ? b : a));
  const best = (rows: PriceRow[]) => Math.max(0, ...rows.map((r) => (r.o && r.o > r.p ? Math.round((1 - r.p / r.o) * 100) : 0)));
  if (t.rent) {
    const rows = t.rent.filter((r) => r.p > 0);
    const m = rows.length ? pick(rows) : null;
    c.price = m?.p ?? 0;
    c.old = m && showsOld(t.rentDisp) && m.o && m.o > m.p ? m.o : undefined;
    c.off = rows.length && t.rentDisp !== "none" && t.rentDisp !== "old" ? best(rows) || undefined : undefined;
    c.rentDisp = t.rentDisp;
  }
  if (t.buy) {
    const rows = t.buy.filter((r) => r.p > 0);
    const m = rows.length ? pick(rows) : null;
    c.buyPrice = m?.p ?? undefined;
    c.buyOld = m && showsOld(t.buyDisp) && m.o && m.o > m.p ? m.o : undefined;
    c.buyOff = rows.length && t.buyDisp !== "none" && t.buyDisp !== "old" ? best(rows) || undefined : undefined;
    c.buyDisp = t.buyDisp;
  }
}

/** аренда доступна: есть адрес страницы аренды (не совпадающий с выкупом) и цена */
export const hasRent = (c: FleetCar) => !!c.rent && c.rent !== c.buy && c.price > 0;
/** выкуп доступен: есть страница выкупа и цена выкупа */
export const hasBuy = (c: FleetCar) => !!c.buy && (c.buyPrice ?? 0) > 0;

const pct = (now: number, old?: number) => (old && old > now ? Math.round((1 - now / old) * 100) : 0);
export interface SaleChip { kind: "rent" | "buy" | "badge"; text: string }
/** плашки скидки: отдельно на аренду и на выкуп, плюс своя надпись из админки */
export function saleChips(c: FleetCar, lang: string = "ru", only?: "rent" | "buy"): SaleChip[] {
  const L = lang === "ru" ? { rent: "аренда", buy: "выкуп", upTo: "до " } : { rent: "rent", buy: "buy", upTo: "up to " };
  const out: SaleChip[] = [];
  if (c.badge) out.push({ kind: "badge", text: c.badge });
  if (only !== "buy" && hasRent(c) && c.rentDisp !== "none" && c.rentDisp !== "old") {
    if (c.rentDisp === "upto" || c.rentDisp === "badge") {
      const best = c.off ?? 0;
      if (best) out.push({ kind: "rent", text: `${c.rentDisp === "upto" ? L.upTo : ""}−${best}% ${L.rent}` });
      return finishBuy(c, out, L, only);
    }
    const p = pct(c.price, c.old);
    if (p) out.push({ kind: "rent", text: `−${p}% ${L.rent}` });
    else {
      const rows = rentRows(c).filter((r) => r.o);
      const best = Math.max(0, ...rows.map((r) => pct(r.p, r.o)), c.off ?? 0);
      if (best) out.push({ kind: "rent", text: `${L.upTo}−${best}% ${L.rent}` });
    }
  }
  return finishBuy(c, out, L, only);
}

function finishBuy(c: FleetCar, out: SaleChip[], L: { buy: string; upTo: string }, only?: "rent" | "buy") {
  if (only !== "rent" && hasBuy(c) && c.buyDisp !== "none" && c.buyDisp !== "old") {
    if (c.buyDisp === "upto" || c.buyDisp === "badge") {
      if (c.buyOff) out.push({ kind: "buy", text: `${c.buyDisp === "upto" ? L.upTo : ""}−${c.buyOff}% ${L.buy}` });
      return out;
    }
    const p = pct(c.buyPrice!, c.buyOld);
    if (p) out.push({ kind: "buy", text: `−${p}% ${L.buy}` });
  }
  return out;
}

/** Строки, которые сейчас на сайте без таблиц админки: из файла с учётом цены «от» из карточки (для начального заполнения таблиц) */
export function fileRowsFor(c: FleetCar, kind: "rent" | "buy"): PriceRow[] {
  return kind === "rent" ? scale(DATA[c.slug]?.rent, c.price, c.old) : scale(DATA[c.slug]?.buy, c.buyPrice, c.buyOld);
}
