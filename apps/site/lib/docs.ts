// Все страницы сайта, кроме главной, собираются из текстов, снятых с car-city.pro (content/*.md).
// Адрес страницы берётся из поля url как есть, с исходным регистром, чтобы не потерять SEO.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

export type DocKind = "page" | "model" | "article";

export interface Doc {
  kind: DocKind;
  /** путь без хоста и без завершающего слеша, например /vykup/komfort/moskvich-3 */
  path: string;
  title: string;
  h1: string;
  description?: string;
  date?: string;
  cls?: string;
  mode?: "arenda" | "vykup";
  body: string;
  /** фото модели из блока IMAGES («Галерея модели») */
  gallery: string[];
}

const ROOT = join(process.cwd(), "content");
const DIRS: Record<string, DocKind> = { pages: "page", models: "model", articles: "article" };

function parseFront(src: string) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/);
  const meta: Record<string, string> = {};
  if (!m) return { meta, body: src };
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i < 1) continue;
    let v = line.slice(i + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1).replace(/\\"/g, '"');
    meta[line.slice(0, i).trim()] = v;
  }
  return { meta, body: src.slice(m[0].length) };
}

export function toPath(url: string) {
  const p = decodeURI(url.replace(/^https?:\/\/(www\.)?car-city\.pro/, "")).replace(/\/+$/, "");
  return p || "/";
}

function splitGallery(body: string) {
  const i = body.search(/^## IMAGES\s*$/m);
  if (i < 0) return { body, gallery: [] as string[] };
  const tail = body.slice(i);
  const gal = tail.split(/Декоративные/)[0];
  const gallery = [...gal.matchAll(/https:\/\/car-city\.pro\/[^\s)]+/g)].map((x) => x[0]);
  return { body: body.slice(0, i), gallery };
}

let cache: Map<string, Doc> | null = null;

export function allDocs(): Map<string, Doc> {
  if (cache && process.env.NODE_ENV === "production") return cache;
  const map = new Map<string, Doc>();
  for (const [dir, kind] of Object.entries(DIRS)) {
    const d = join(ROOT, dir);
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d)) {
      if (!f.endsWith(".md") || f.startsWith("_") || f === "index.md") continue;
      const { meta, body: raw } = parseFront(readFileSync(join(d, f), "utf8"));
      if (!meta.url) continue;
      const { body, gallery } = splitGallery(raw);
      const path = toPath(meta.url);
      map.set(path, {
        kind,
        path,
        title: meta.title || meta.h1 || "",
        h1: meta.h1 || meta.title || "",
        description: meta.description,
        date: meta.date,
        cls: meta.class,
        mode: meta.mode === "vykup" ? "vykup" : meta.mode === "arenda" ? "arenda" : undefined,
        body,
        gallery,
      });
    }
  }
  cache = map;
  return map;
}

export function getDoc(path: string) {
  const all = allDocs();
  return all.get(path) ?? [...all.values()].find((d) => d.path.toLowerCase() === path.toLowerCase());
}

export function articles() {
  const idx = join(ROOT, "articles", "_index.json");
  const meta: { slug: string; date?: string }[] = existsSync(idx) ? JSON.parse(readFileSync(idx, "utf8")) : [];
  const dates = new Map(meta.map((m) => [m.slug, m.date]));
  return [...allDocs().values()]
    .filter((d) => d.kind === "article")
    .map((d) => ({ ...d, date: d.date ?? dates.get(d.path.split("/").pop()!) }));
}

/** Пара «аренда ↔ выкуп» для страницы модели */
export function twinOf(doc: Doc) {
  if (doc.kind !== "model") return undefined;
  const parts = doc.path.split("/");
  const slug = parts.pop()!.toLowerCase();
  const want = doc.mode === "arenda" ? "vykup" : "arenda";
  return [...allDocs().values()].find((d) => d.kind === "model" && d.mode === want && d.path.split("/").pop()!.toLowerCase() === slug);
}
