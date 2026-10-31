// Переезд со старого car-city.pro: снимок старого сайта (content/seo/baseline.json) против нового.
// Быстрая проверка считается без запросов: адрес → редиректы → страница; живая — настоящими запросами к сайту.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { getDoc } from "../docs";
import { findRedirect, rules, normFrom } from "../edge-rules";
import { buildMeta } from "../seo";
import { refreshOverlay } from "./overlay";
import { q } from "../db";

export interface OldPage { url: string; path: string; status: number; location?: string; title?: string; description?: string; h1?: string; canonical?: string; robots?: string; inSitemap?: boolean; words?: number }
export interface Baseline { origin: string; takenAt: string; head: Record<string, unknown>; robots: string; sitemap: string[]; images: string[]; files: { url: string; path: string; status: number }[]; pages: OldPage[] }

let cache: Baseline | null = null;
export function baseline(): Baseline | null {
  if (cache) return cache;
  const f = join(process.cwd(), "content", "seo", "baseline.json");
  if (!existsSync(f)) return null;
  cache = JSON.parse(readFileSync(f, "utf8"));
  return cache;
}

export type Verdict = "ok" | "redirect" | "missing" | "gone" | "loop";
export interface Check {
  path: string;
  old: OldPage;
  verdict: Verdict;
  /** куда ведёт (после редиректов) */
  target: string;
  hops: string[];
  newTitle?: string;
  newDescription?: string;
  newH1?: string;
  titleSame?: boolean;
  descSame?: boolean;
  h1Same?: boolean;
}

const norm = (s?: string) => (s ?? "").replace(/\s+/g, " ").replace(/[«»"]/g, '"').trim().toLowerCase();

/** Старые адреса, которые поисковики знают: отвечали 200, были в sitemap или перенаправляли */
export function oldUrls(b: Baseline) {
  return b.pages.filter((p) => p.status === 200 || p.status === 301 || p.inSitemap).filter((p) => !/\[|\*|%5B/.test(p.path));
}

export async function quickCheck(): Promise<Check[]> {
  const b = baseline();
  if (!b) return [];
  const ov = await refreshOverlay();
  const st = await rules();
  const out: Check[] = [];
  for (const p of oldUrls(b)) {
    let cur = p.path.split("?")[0] || "/";
    const hops: string[] = [];
    let verdict: Verdict = "ok";
    for (let i = 0; i < 6; i++) {
      const r = findRedirect(st, cur, "");
      if (r) {
        if (r.rule.code === 410) { verdict = "gone"; break; }
        const next = r.to.startsWith("http") ? new URL(r.to).pathname : r.to;
        if (normFrom(next) === normFrom(cur) || hops.includes(next)) { verdict = "loop"; break; }
        hops.push(next); cur = next; continue;
      }
      if (st.seo.lowercaseRedirect && cur !== cur.toLowerCase()) { hops.push(cur.toLowerCase()); cur = cur.toLowerCase(); continue; }
      break;
    }
    if (verdict === "ok" && hops.length) verdict = "redirect";
    const path = cur.replace(/\/+$/, "") || "/";
    const doc = path === "/" || path === "/sitemap" ? null : getDoc(path, "ru", ov);
    if (verdict !== "gone" && verdict !== "loop" && path !== "/" && path !== "/sitemap" && !doc) verdict = "missing";
    const c: Check = { path: p.path, old: p, verdict, target: path, hops };
    if (doc || path === "/") {
      const meta = doc
        ? buildMeta({ ov, lang: "ru", path: doc.path, title: doc.title, description: doc.description, h1: doc.h1, kind: doc.kind })
        : buildMeta({ ov, lang: "ru", path: "/", title: "Аренда авто для работы в такси в Москве без залога", description: "Дарим первый день аренды бесплатно, новые автомобили без залога, гибкий формат аренды, возможность выкупа. Эконом, Комфорт, Комфорт Плюс, Бизнес." });
      c.newTitle = String((meta.title as { absolute: string }).absolute);
      c.newDescription = String(meta.description ?? "");
      c.newH1 = doc?.h1;
      // сравниваем мета-теги только для той же страницы (тот же адрес или он же строчными), а не для редиректа на другую
      const samePage = path.toLowerCase() === (p.path.split("?")[0].replace(/\/+$/, "") || "/").toLowerCase();
      if (p.status === 200 && samePage) {
        c.titleSame = !p.title || norm(p.title) === norm(c.newTitle);
        c.descSame = !p.description || norm(p.description) === norm(c.newDescription);
        c.h1Same = !p.h1 || !c.newH1 || norm(p.h1) === norm(c.newH1);
      }
    }
    out.push(c);
  }
  return out;
}

export interface LiveResult { status: number; location?: string; final?: string; finalStatus?: number; title?: string; canonical?: string; robots?: string; xRobots?: string; ms: number; error?: string }

/** Живая проверка: запрос к самому сайту (как поисковый робот), до 5 переходов по редиректам */
export async function liveCheck(origin: string, path: string, asHost = "car-city.pro"): Promise<LiveResult> {
  const t0 = Date.now();
  try {
    let url = origin + path;
    let first: Response | null = null;
    let r: Response | null = null;
    for (let i = 0; i < 6; i++) {
      r = await fetch(url, { redirect: "manual", headers: { "user-agent": "Mozilla/5.0 (compatible; YandexBot/3.0; CarCityMigrationCheck)", "x-forwarded-host": asHost, "x-forwarded-proto": "https" }, signal: AbortSignal.timeout(15000), cache: "no-store" });
      if (!first) first = r;
      const loc = r.headers.get("location");
      // редиректы ведут на основной домен — продолжаем проверку на этом же сервере
      if (r.status >= 300 && r.status < 400 && loc) { const n = new URL(loc, url); url = origin + n.pathname + n.search; continue; }
      break;
    }
    const html = r && /html/.test(r.headers.get("content-type") || "") ? await r.text() : "";
    return {
      status: first!.status,
      location: first!.headers.get("location") || undefined,
      final: url.replace(origin, ""),
      finalStatus: r!.status,
      title: html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim(),
      canonical: html.match(/<link[^>]+rel="canonical"[^>]*href="([^"]+)"/i)?.[1],
      robots: html.match(/<meta[^>]+name="robots"[^>]*content="([^"]+)"/i)?.[1],
      xRobots: r!.headers.get("x-robots-tag") || undefined,
      ms: Date.now() - t0,
    };
  } catch (e) {
    return { status: 0, ms: Date.now() - t0, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function lastLive(): Promise<Map<string, { result: LiveResult; at: string }>> {
  const rows = await q<{ path: string; result: LiveResult; checked_at: string }>("SELECT path, result, checked_at FROM migration_checks");
  return new Map(rows.map((r) => [r.path, { result: r.result, at: r.checked_at }]));
}
