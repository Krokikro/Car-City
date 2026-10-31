// Правила для proxy.ts (выполняется перед каждым запросом): редиректы из админки, главный домен, строчные адреса,
// закрытие служебных доменов от индексации. Читаются из базы и кэшируются в памяти на 20 секунд.
import { dbEnabled, q } from "./db";
import { DEFAULT_SEO, mergeSeo, type SeoSettings } from "./site-settings";

export interface Rule { id: number; from: string; to: string; code: number; match: "exact" | "prefix" | "regex"; re?: RegExp }
interface State { seo: SeoSettings; exact: Map<string, Rule>; other: Rule[] }

let state: State = { seo: DEFAULT_SEO, exact: new Map(), other: [] };
let at = 0;
let inflight: Promise<void> | null = null;
const hits = new Map<number, number>();

async function load() {
  const [set, rows] = await Promise.all([
    q<{ value: unknown }>("SELECT value FROM settings WHERE key='seo'"),
    q<{ id: string; from_path: string; to_path: string; code: number; match: string }>("SELECT id, from_path, to_path, code, match FROM redirects WHERE active ORDER BY id"),
  ]);
  const exact = new Map<string, Rule>();
  const other: Rule[] = [];
  for (const r of rows) {
    const rule: Rule = { id: Number(r.id), from: r.from_path, to: r.to_path, code: r.code, match: r.match === "prefix" || r.match === "regex" ? r.match : "exact" };
    if (rule.match === "exact") exact.set(normFrom(rule.from), rule);
    else if (rule.match === "regex") { try { rule.re = new RegExp(rule.from, "i"); other.push(rule); } catch { /* кривое выражение пропускаем */ } }
    else other.push(rule);
  }
  state = { seo: mergeSeo(set[0]?.value), exact, other };
}

/** Путь для сравнения: без завершающего слеша, в нижнем регистре, с декодированной кириллицей */
export function normFrom(p: string) {
  let s = p.trim();
  try { s = decodeURI(s); } catch { /* как есть */ }
  if (/^https?:\/\//i.test(s)) { try { const u = new URL(s); s = u.pathname + u.search; } catch { /* */ } }
  if (s.length > 1) s = s.replace(/\/+$/, "");
  return s.toLowerCase();
}

export async function rules(): Promise<State> {
  if (!dbEnabled() || process.env.NEXT_PHASE === "phase-production-build") return state;
  if (Date.now() - at > 20_000 && !inflight) {
    inflight = load().catch((e) => console.error("edge-rules:", e instanceof Error ? e.message : e)).finally(() => { at = Date.now(); inflight = null; });
    if (at === 0) await inflight; // первый запрос ждёт загрузку
  }
  return state;
}

/** Найти редирект для адреса. Возвращает правило и итоговый адрес. */
export function findRedirect(s: State, path: string, search: string): { rule: Rule; to: string } | null {
  const key = normFrom(path);
  const withQ = search ? normFrom(path + search) : "";
  const r = (withQ && s.exact.get(withQ)) || s.exact.get(key);
  if (r) return { rule: r, to: r.to };
  for (const rule of s.other) {
    if (rule.match === "prefix") {
      const pre = normFrom(rule.from);
      if (key === pre || key.startsWith(pre.endsWith("/") ? pre : pre + "/")) {
        const rest = key.slice(pre.length);
        return { rule, to: rule.to.endsWith("*") ? rule.to.slice(0, -1) + rest.replace(/^\//, "") : rule.to };
      }
    } else if (rule.re) {
      const m = (path + search).match(rule.re) || key.match(rule.re);
      if (m) return { rule, to: rule.to.replace(/\$(\d)/g, (_, i) => m[Number(i)] ?? "") };
    }
  }
  return null;
}

export function countHit(id: number) {
  hits.set(id, (hits.get(id) ?? 0) + 1);
}
// раз в 30 секунд — счётчики срабатываний в базу (одним запросом на правило)
const flush = async () => {
  if (!hits.size || !dbEnabled()) return;
  const batch = [...hits];
  hits.clear();
  for (const [id, n] of batch) await q("UPDATE redirects SET hits = hits + $2, last_hit = now() WHERE id=$1", [id, n]).catch(() => {});
};
if (typeof setInterval !== "undefined") { const t = setInterval(flush, 30_000); (t as { unref?: () => void }).unref?.(); }
