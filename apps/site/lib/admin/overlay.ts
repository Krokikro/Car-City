// Правки из админки поверх файлов сайта. Опубликованное лежит в памяти процесса и обновляется из базы раз в несколько секунд
// и сразу после публикации. Сайт читает контент синхронно (lib/docs.ts), поэтому страницы перед рендером вызывают refreshOverlay().
// Черновики в общую память не попадают: предпросмотр берёт их отдельным вызовом draftOverlay().
import { dbEnabled, q } from "../db";
import { fleet, type FleetCar } from "../fleet";

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
export type FleetPatch = Partial<Pick<FleetCar, "name" | "price" | "badge" | "engine" | "gearbox" | "cls">> & { hidden?: boolean };

export interface Overlay {
  /** растёт при каждой загрузке, по нему кэшируется собранный список страниц */
  version: number;
  cacheable: boolean;
  pages: Map<string, PageData>;
}

const EMPTY: Overlay = { version: 0, cacheable: true, pages: new Map() };
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
      if (typeof p.price === "number" && p.price > 0) car.price = p.price;
      if (p.engine !== undefined) car.engine = p.engine || undefined;
      if (p.gearbox !== undefined) car.gearbox = p.gearbox || undefined;
      if (p.cls) car.cls = p.cls;
      if (p.badge !== undefined) car.badge = p.badge || undefined;
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
  for (const r of await q<{ lang: string; path: string; published: PageData }>("SELECT lang, path, published FROM pages WHERE published IS NOT NULL")) pages.set(pageKey(r.lang, r.path), r.published);
  applyFleet(await q<{ slug: string; data: FleetPatch }>("SELECT slug, data FROM fleet_overrides"));
  return { version: cur.version + 1, cacheable: true, pages };
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
  return { version: base.version, cacheable: false, pages };
}
