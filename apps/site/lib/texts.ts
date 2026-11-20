// Тексты сайта, которые правят в админке (раздел «Тексты»): главная, подписи интерфейса, контакты, форма заявки.
// Исходные тексты лежат в коде (lib/home-text.ts, lib/ui.ts, lib/content.ts …), правки из админки — в базе
// как список «путь поля → текст» и накладываются поверх при отрисовке.
// Сервер получает правки из базы (overlay → setTexts) и хранит их в globalThis: серверные компоненты
// и серверная отрисовка клиентских — разные копии модулей в одном процессе. Браузер берёт те же правки
// из <script id="cc-texts"> в <head>, поэтому сервер и браузер рисуют одинаково.

export type Patch = Record<string, string>;
export type TextsData = Record<string, Record<string, Patch>>;
interface State { v: number; data: TextsData }

const g = globalThis as typeof globalThis & { __ccTexts?: State };
let client: State | null = null;

function state(): State {
  if (typeof document !== "undefined") {
    if (!client) {
      try { client = { v: 1, data: JSON.parse(document.getElementById("cc-texts")?.textContent || "{}") }; } catch { client = { v: 1, data: {} }; }
    }
    return client;
  }
  return g.__ccTexts ?? { v: 0, data: {} };
}

/** Сервер: новые опубликованные правки из базы */
export function setTexts(data: TextsData) {
  const prev = g.__ccTexts;
  if (prev && JSON.stringify(prev.data) === JSON.stringify(data)) return;
  g.__ccTexts = { v: (prev?.v ?? 0) + 1, data };
}
/** Для <script id="cc-texts">: только то, что реально изменено */
export const textsJson = () => JSON.stringify(state().data).replace(/</g, "\\u003c");

const cache = new Map<string, { v: number; base: unknown; out: unknown }>();

/** Записать значение по пути вида "hero.lines.0" (объекты и массивы) */
export function setPath(obj: unknown, path: string, value: string) {
  const keys = path.split(".");
  let cur = obj as Record<string, unknown>;
  for (let i = 0; i < keys.length - 1; i++) {
    const next = cur?.[keys[i]];
    if (next === null || typeof next !== "object") return;
    cur = next as Record<string, unknown>;
  }
  const last = keys[keys.length - 1];
  if (cur && typeof cur[last] === "string") cur[last] = value;
}
export function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);
}

/** Исходные тексты с правками из админки. Без правок — тот же объект. */
export function patched<T>(bundle: string, lang: string, base: T): T {
  const st = state();
  const patch = st.data[bundle]?.[lang];
  if (!patch || !Object.keys(patch).length) return base;
  const key = `${bundle}|${lang}`;
  const hit = cache.get(key);
  if (hit && hit.v === st.v && hit.base === base) return hit.out as T;
  const out = structuredClone(base);
  for (const [p, val] of Object.entries(patch)) setPath(out, p, val);
  cache.set(key, { v: st.v, base, out });
  return out;
}

/** Объект, поля которого всегда отдают текущие тексты (для констант вроде company, которые читают напрямую) */
export function live<T extends object>(get: () => T): T {
  return new Proxy({} as T, {
    get: (_, k) => Reflect.get(get(), k),
    has: (_, k) => Reflect.has(get(), k),
    ownKeys: () => Reflect.ownKeys(get()),
    getOwnPropertyDescriptor: (_, k) => { const d = Reflect.getOwnPropertyDescriptor(get(), k); return d ? { ...d, configurable: true } : undefined; },
  });
}
