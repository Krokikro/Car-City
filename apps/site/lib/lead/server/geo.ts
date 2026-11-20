// Город и страна по IP для заявок и чатов. База — DB-IP IP to City Lite (бесплатная, лицензия CC BY 4.0,
// коммерческое использование разрешено, обновляется раз в месяц). Файл ~130 МБ скачивается в фоне при первом
// обращении во временную папку и держится в памяти, пока нужен; через час без запросов память освобождается.
// Пока база не готова, lookup возвращает null — город дозаполнится позже (см. fillGeo в админке).

import { createWriteStream, existsSync, readFileSync, statSync } from "node:fs";
import { mkdir, rename } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import { Reader, type CityResponse } from "mmdb-lib";

export interface Geo { country?: string; region?: string; city?: string; code?: string }

type CityRec = CityResponse;

const DIR = join(process.env.GEO_DIR || tmpdir(), "cc-geo");
const FILE = join(DIR, "dbip-city-lite.mmdb");
const g = globalThis as typeof globalThis & { __ccGeo?: { reader?: Reader<CityRec>; loading?: Promise<void>; used: number; timer?: NodeJS.Timeout; failedAt?: number } };
const st = (g.__ccGeo ??= { used: 0 });

// Русские названия частых городов (в бесплатной базе города только на английском)
const RU: Record<string, string> = {
  Moscow: "Москва", "Saint Petersburg": "Санкт-Петербург", "St Petersburg": "Санкт-Петербург", Khimki: "Химки", Mytishchi: "Мытищи", Balashikha: "Балашиха", Podolsk: "Подольск",
  Krasnogorsk: "Красногорск", Lyubertsy: "Люберцы", Odintsovo: "Одинцово", Zelenograd: "Зеленоград", Dolgoprudnyy: "Долгопрудный", Reutov: "Реутов", Korolev: "Королёв",
  Lobnya: "Лобня", Domodedovo: "Домодедово", Vidnoye: "Видное", Kotelniki: "Котельники", Shchelkovo: "Щёлково", Pushkino: "Пушкино", Elektrostal: "Электросталь",
  Kazan: "Казань", Novosibirsk: "Новосибирск", Yekaterinburg: "Екатеринбург", "Nizhniy Novgorod": "Нижний Новгород", "Nizhny Novgorod": "Нижний Новгород", Samara: "Самара",
  "Rostov-on-Don": "Ростов-на-Дону", Krasnodar: "Краснодар", Voronezh: "Воронеж", Ufa: "Уфа", Perm: "Пермь", Volgograd: "Волгоград", Tula: "Тула", Tver: "Тверь", Kaluga: "Калуга",
  Ryazan: "Рязань", Yaroslavl: "Ярославль", Vladimir: "Владимир", Chelyabinsk: "Челябинск", Omsk: "Омск", Krasnoyarsk: "Красноярск", Saratov: "Саратов", Tyumen: "Тюмень",
  Bishkek: "Бишкек", Osh: "Ош", "Jalal-Abad": "Джалал-Абад", Karakol: "Каракол", Tokmok: "Токмок",
  Almaty: "Алматы", Astana: "Астана", Shymkent: "Шымкент", Karaganda: "Караганда", Aktobe: "Актобе", Taraz: "Тараз",
  Tashkent: "Ташкент", Samarkand: "Самарканд", Namangan: "Наманган", Andijan: "Андижан", Fergana: "Фергана", Bukhara: "Бухара",
  Dushanbe: "Душанбе", Khujand: "Худжанд", Baku: "Баку", Yerevan: "Ереван", Minsk: "Минск", Tbilisi: "Тбилиси", Ashgabat: "Ашхабад",
};
const ruName = (en?: string) => (en ? RU[en] ?? RU[en.replace(/\s*\(.*\)$/, "")] ?? en.replace(/\s*\(.*\)$/, "") : undefined);

function month(offset = 0) {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - offset);
  return d.toISOString().slice(0, 7);
}

async function download() {
  await mkdir(DIR, { recursive: true });
  // База за текущий месяц появляется не в первый день — пробуем текущий и два предыдущих
  for (const m of [month(0), month(1), month(2)]) {
    const res = await fetch(`https://download.db-ip.com/free/dbip-city-lite-${m}.mmdb.gz`, { signal: AbortSignal.timeout(120_000) }).catch(() => null);
    if (!res?.ok || !res.body) continue;
    const part = FILE + ".part";
    await pipeline(Readable.fromWeb(res.body as never), createGunzip(), createWriteStream(part));
    await rename(part, FILE);
    return;
  }
  throw new Error("geo: база DB-IP недоступна");
}

function load() {
  if (st.reader) return Promise.resolve();
  if (st.failedAt && Date.now() - st.failedAt < 30 * 60_000) return Promise.resolve();
  st.loading ??= (async () => {
    // файл старше 40 дней — обновляем
    const fresh = existsSync(FILE) && Date.now() - statSync(FILE).mtimeMs < 40 * 86_400_000;
    if (!fresh) await download();
    st.reader = new Reader<CityRec>(readFileSync(FILE));
  })()
    .catch((e) => { st.failedAt = Date.now(); console.error(String(e?.message ?? e)); })
    .finally(() => { st.loading = undefined; });
  return st.loading;
}

function touch() {
  st.used = Date.now();
  if (st.timer) return;
  st.timer = setInterval(() => {
    if (Date.now() - st.used > 60 * 60_000) {
      st.reader = undefined; // освобождаем ~130 МБ, файл остаётся на диске
      clearInterval(st.timer);
      st.timer = undefined;
    }
  }, 10 * 60_000);
  st.timer.unref?.();
}

const PRIVATE = /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fc|fd|fe80|unknown$)/i;

/** Город по IP. wait — сколько ждать загрузки базы (мс); без ожидания вернёт null, если база ещё не загружена. */
export async function geoLookup(ip: string | undefined, wait = 0): Promise<Geo | null> {
  if (!ip || PRIVATE.test(ip)) return null;
  touch();
  if (!st.reader) {
    const p = load();
    if (wait > 0) await Promise.race([p, new Promise((r) => setTimeout(r, wait))]);
  }
  if (!st.reader) return null;
  try {
    const r = st.reader.get(ip.replace(/^::ffff:/, ""));
    if (!r) return {};
    return {
      country: (r.country?.names as Record<string, string> | undefined)?.ru ?? r.country?.names?.en,
      code: r.country?.iso_code,
      region: ruName(r.subdivisions?.[0]?.names?.en),
      city: ruName(r.city?.names?.en),
    };
  } catch {
    return null;
  }
}

/** Начать загрузку базы заранее (при старте сервера), чтобы первая заявка уже получила город */
export function warmGeo() { if (!st.reader) void load(); }

export const geoLine = (g?: Geo | null) => (g ? [g.city, g.region && g.region !== g.city ? g.region : "", g.country].filter(Boolean).join(", ") : "");
