// Страницы сайта в админке: черновик → публикация, история версий, откат, запланированная публикация.
import { revalidatePath } from "next/cache";
import { q, q1 } from "../db";
import { fileDocs } from "../docs";
import { LANGS, type Lang } from "../i18n";
import { refreshOverlay, type PageData } from "./overlay";

export interface PageRow {
  lang: string;
  path: string;
  published: PageData | null;
  draft: PageData | null;
  publish_at: string | null;
  updated_at: string;
  updated_by: string | null;
}

/** Обновить сайт сразу: перечитать опубликованное из базы и сбросить кэш страниц */
export async function bust() {
  await refreshOverlay(true);
  revalidatePath("/", "layout");
}

export async function rows(): Promise<PageRow[]> {
  return q<PageRow>("SELECT lang, path, published, draft, publish_at, updated_at, updated_by FROM pages");
}

export async function rowOf(lang: string, path: string) {
  return q1<PageRow>("SELECT lang, path, published, draft, publish_at, updated_at, updated_by FROM pages WHERE lang=$1 AND path=$2", [lang, path]);
}

/** Страница, какой она сейчас на сайте: правка из админки или файл */
export function fileData(lang: Lang, path: string): (PageData & { kind: string }) | null {
  const d = fileDocs(lang).get(path);
  return d ? { title: d.title, h1: d.h1, description: d.description, body: d.body, kind: d.kind } : null;
}

export const isLangId = (s: string): s is Lang => (LANGS as readonly string[]).includes(s);

/** Адрес вида /about/new-page: только латиница, цифры, дефис, слеш, подчёркивание и точка */
export function cleanPath(raw: string): string | null {
  let p = raw.trim().replace(/^https?:\/\/[^/]+/i, "").replace(/\/+$/g, "");
  if (!p.startsWith("/")) p = "/" + p;
  if (p === "/" || p.length > 160 || p.includes("//") || p.includes("..")) return null;
  if (!/^\/[A-Za-z0-9_\-./]+$/.test(p)) return null;
  // служебные адреса сайта
  if (/^\/(admin|api|media|_next|sitemap|spasibo|lab|ru|en|ky|kk|uz)(\/|$)/i.test(p)) return null;
  return p;
}

export function cleanData(d: Partial<PageData>): PageData {
  return {
    title: String(d.title ?? "").trim().slice(0, 300),
    h1: String(d.h1 ?? "").trim().slice(0, 300),
    description: String(d.description ?? "").trim().slice(0, 600) || undefined,
    body: String(d.body ?? "").replace(/\r\n/g, "\n"),
    hidden: d.hidden || undefined,
    kind: d.kind,
  };
}

export async function saveDraft(lang: string, path: string, data: PageData, by: string, publishAt: Date | null) {
  await q(
    `INSERT INTO pages (lang, path, draft, publish_at, updated_at, updated_by) VALUES ($1,$2,$3,$4,now(),$5)
     ON CONFLICT (lang, path) DO UPDATE SET draft=$3, publish_at=$4, updated_at=now(), updated_by=$5`,
    [lang, path, JSON.stringify(data), publishAt, by],
  );
}

export async function publishData(lang: string, path: string, data: PageData, by: string, note: string) {
  await q(
    `INSERT INTO pages (lang, path, published, draft, publish_at, updated_at, updated_by) VALUES ($1,$2,$3,NULL,NULL,now(),$4)
     ON CONFLICT (lang, path) DO UPDATE SET published=$3, draft=NULL, publish_at=NULL, updated_at=now(), updated_by=$4`,
    [lang, path, JSON.stringify(data), by],
  );
  await q("INSERT INTO page_versions (lang, path, data, note, by) VALUES ($1,$2,$3,$4,$5)", [lang, path, JSON.stringify(data), note, by]);
  // История не бесконечна: последние 50 версий страницы
  await q("DELETE FROM page_versions WHERE lang=$1 AND path=$2 AND id NOT IN (SELECT id FROM page_versions WHERE lang=$1 AND path=$2 ORDER BY id DESC LIMIT 50)", [lang, path]);
}

export async function discardDraft(lang: string, path: string) {
  await q("UPDATE pages SET draft=NULL, publish_at=NULL WHERE lang=$1 AND path=$2", [lang, path]);
  await q("DELETE FROM pages WHERE lang=$1 AND path=$2 AND published IS NULL AND draft IS NULL", [lang, path]);
}

/** Снять правки совсем: страница снова такая, как в файлах сайта */
export async function resetToFile(lang: string, path: string) {
  await q("DELETE FROM pages WHERE lang=$1 AND path=$2", [lang, path]);
}

export interface Version { id: string; at: string; by: string | null; note: string | null; data: PageData }
export async function versions(lang: string, path: string) {
  return q<Version>("SELECT id::text, at, by, note, data FROM page_versions WHERE lang=$1 AND path=$2 ORDER BY id DESC LIMIT 20", [lang, path]);
}
export async function version(id: string) {
  return q1<Version & { lang: string; path: string }>("SELECT id::text, lang, path, at, by, note, data FROM page_versions WHERE id=$1", [id]);
}

/** Для SERP-предпросмотра и счётчиков */
export const LIMITS = { title: 60, description: 160 };
