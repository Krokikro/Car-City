// Правки из админки поверх файлов сайта. Опубликованное лежит в памяти процесса и обновляется из базы раз в несколько секунд
// и сразу после публикации. Сайт читает контент синхронно (lib/docs.ts), поэтому страницы перед рендером вызывают refreshOverlay().
// Черновики в общую память не попадают: предпросмотр берёт их отдельным вызовом draftOverlay().
import { dbEnabled, q } from "../db";
import { fleet, type FleetCar } from "../fleet";
import { DEFAULT_SEO, DEFAULT_SITE, mergeSeo, mergeSite, type PageSeo, type SeoSettings, type SiteSettings } from "../site-settings";
import { setSiteTheme } from "../theme";
import { setTexts, type TextsData } from "../texts";

export interface PageData {
  title: string;
  h1: string;
  description?: string;
  body: string;
  /** страница снята с публикации (адрес отдаёт 404) */
  hidden?: boolean;
  /** для новой страницы; у существующей берётся из файла */
  kind?: "page" | "model" | "article";
}
export type FleetPatch = Partial<Pick<FleetCar, "name" | "price" | "badge" | "engine" | "gearbox" | "cls" | "old" | "off" | "buyPrice" | "buyOld">> & { hidden?: boolean; /** место на главной; 0 — не показывать на главной */ featured?: number };

export interface Overlay {
  /** растёт при каждой загрузке, по нему кэшируется собранный список страниц */
  version: number;
  cacheable: boolean;
  pages: Map<string, PageData>;
  /** настройки сайта (тема) и SEO из админки */
  site: SiteSettings;
  seo: SeoSettings;
  /** SEO отдельных страниц: ключ lang|path (path в нижнем регистре) */
  seoPages: Map<string, PageSeo>;
  /** когда страницу меняли в админке — для lastmod в sitemap */
  updated: Map<string, string>;
}

const EMPTY: Overlay = { version: 0, cacheable: true, pages: new Map(), site: DEFAULT_SITE, seo: DEFAULT_SEO, seoPages: new Map(), updated: new Map() };
let cur: Overlay = EMPTY;
let loadedAt = 0;
let inflight: Promise<Overlay> | null = null;
const TTL = 10_000;

export const BASE_FLEET: FleetCar[] = fleet.map((c) => ({ ...c }));
export const pageKey = (lang: string, path: string) => `${lang}|${path}`;
export const splitKey = (k: string) => { const i = k.indexOf("|"); return [k.slice(0, i), k.slice(i + 1)] as const; };

// Идёт сборка (next build): базы там нет, обращаться не будем
const building = () => process.env.NEXT_PHASE === "phase-production-build";

function applyFleet(rows: { slug: string; data: FleetPatch }[]) {
  const patches = new Map(rows.map((r) => [r.slug, r.data]));
  const next: FleetCar[] = [];
  for (const base of BASE_FLEET) {
    const p = patches.get(base.slug);
    if (p?.hidden) continue;
    const car: FleetCar = { ...base };
    if (p) {
      if (p.name) car.name = p.name;
      if (typeof p.price === "number") car.price = p.price > 0 ? p.price : 0;
      if (p.engine !== undefined) car.engine = p.engine || undefined;
      if (p.gearbox !== undefined) car.gearbox = p.gearbox || undefined;
      if (p.cls) car.cls = p.cls;
      if (p.badge !== undefined) car.badge = p.badge || undefined;
      if (p.old !== undefined) car.old = p.old > 0 ? p.old : undefined;
      if (p.off !== undefined) car.off = p.off > 0 ? p.off : undefined;
      if (p.buyPrice !== undefined) car.buyPrice = p.buyPrice > 0 ? p.buyPrice : undefined;
      if (p.buyOld !== undefined) car.buyOld = p.buyOld > 0 ? p.buyOld : undefined;
      if (p.featured !== undefined) car.featured = p.featured > 0 ? p.featured : undefined;
    }
    next.push(car);
  }
  // fleet — общий массив, его импортируют многие модули; меняем на месте
  fleet.length = 0;
  fleet.push(...next);
}

async function promoteScheduled() {
  const rows = await q<{ lang: string; path: string; published: PageData }>(
    "UPDATE pages SET published = draft, draft = NULL, publish_at = NULL, updated_at = now(), updated_by = 'по расписанию' WHERE publish_at IS NOT NULL AND publish_at <= now() AND draft IS NOT NULL RETURNING lang, path, published",
  );
  for (const r of rows) {
    await q("INSERT INTO page_versions (lang, path, data, note, by) VALUES ($1,$2,$3,'Публикация по расписанию','по расписанию')", [r.lang, r.path, JSON.stringify(r.published)]);
    await q("INSERT INTO audit (action, entity, entity_id) VALUES ('Публикация по расписанию','page',$1)", [`${r.lang}${r.path}`]);
  }
}

async function load(): Promise<Overlay> {
  await promoteScheduled();
  const pages = new Map<string, PageData>();
  const updated = new Map<string, string>();
  for (const r of await q<{ lang: string; path: string; published: PageData; updated_at: string }>("SELECT lang, path, published, updated_at FROM pages WHERE published IS NOT NULL")) {
    pages.set(pageKey(r.lang, r.path), r.published);
    updated.set(pageKey(r.lang, r.path.toLowerCase()), new Date(r.updated_at).toISOString());
  }
  applyFleet(await q<{ slug: string; data: FleetPatch }>("SELECT slug, data FROM fleet_overrides"));
  const set = new Map((await q<{ key: string; value: unknown }>("SELECT key, value FROM settings WHERE key IN ('site','seo')")).map((r) => [r.key, r.value]));
  const site = mergeSite(set.get("site"));
  const seo = mergeSeo(set.get("seo"));
  setSiteTheme(site.theme, site.variant);
  const seoPages = new Map<string, PageSeo>();
  for (const r of await q<{ lang: string; path: string; data: PageSeo; updated_at: string }>("SELECT lang, path, data, updated_at FROM seo_pages")) {
    const k = pageKey(r.lang, r.path.toLowerCase());
    seoPages.set(k, r.data);
    const t = new Date(r.updated_at).toISOString();
    if (!updated.has(k) || updated.get(k)! < t) updated.set(k, t);
  }
  // тексты сайта (главная, интерфейс, контакты, форма) — опубликованные правки
  const texts: TextsData = {};
  for (const r of await q<{ bundle: string; lang: string; published: Record<string, string> }>("SELECT bundle, lang, published FROM texts WHERE published IS NOT NULL")) {
    (texts[r.bundle] ??= {})[r.lang] = r.published;
  }
  setTexts(texts);
  return { version: cur.version + 1, cacheable: true, pages, site, seo, seoPages, updated };
}

export function published(): Overlay {
  return cur;
}

export async function refreshOverlay(force = false): Promise<Overlay> {
  if (!dbEnabled() || building()) return cur;
  if (!force && Date.now() - loadedAt < TTL) return cur;
  if (!inflight) {
    inflight = load()
      .then((o) => { cur = o; return o; })
      .catch((e) => { console.error("overlay:", e instanceof Error ? e.message : e); return cur; })
      .finally(() => { loadedAt = Date.now(); inflight = null; });
  }
  return inflight;
}

/** Для предпросмотра: черновики поверх опубликованного. В общую память не кладём. */
export async function draftOverlay(): Promise<Overlay> {
  const base = await refreshOverlay();
  if (!dbEnabled()) return base;
  const pages = new Map(base.pages);
  try {
    for (const r of await q<{ lang: string; path: string; draft: PageData }>("SELECT lang, path, draft FROM pages WHERE draft IS NOT NULL")) pages.set(pageKey(r.lang, r.path), r.draft);
  } catch (e) {
    console.error("draftOverlay:", e instanceof Error ? e.message : e);
  }
  return { ...base, cacheable: false, pages };
}

/** SEO отдельной страницы из админки */
export const pageSeo = (ov: Overlay, lang: string, path: string): PageSeo => ov.seoPages.get(pageKey(lang, path.toLowerCase())) ?? {};
