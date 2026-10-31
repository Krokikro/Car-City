// Чтение и запись ролей, настроек сайта и SEO для админки.
import { q, q1 } from "../db";
import { normPerms, isScope, type LeadScope, type Perms } from "./roles";
import { mergeSeo, mergeSite, type PageSeo, type SeoSettings, type SiteSettings } from "../site-settings";

export interface RoleRow { id: string; name: string; perms: Perms; leadScope: LeadScope; system: boolean; users: number }

export async function listRoles(): Promise<RoleRow[]> {
  const rows = await q<{ id: string; name: string; perms: unknown; lead_scope: string; system: boolean; users: string }>(
    "SELECT r.id, r.name, r.perms, r.lead_scope, r.system, (SELECT count(*) FROM users u WHERE u.role = r.id AND u.active) AS users FROM roles r ORDER BY (r.id='admin') DESC, r.system DESC, r.created_at",
  );
  return rows.map((r) => ({ id: r.id, name: r.name, perms: normPerms(r.id, r.perms), leadScope: isScope(r.lead_scope) ? r.lead_scope : "all", system: r.system, users: Number(r.users) }));
}

export async function getSetting<T>(key: string): Promise<T | undefined> {
  return (await q1<{ value: T }>("SELECT value FROM settings WHERE key=$1", [key]))?.value;
}
export async function setSetting(key: string, value: unknown, by: string) {
  await q("INSERT INTO settings (key, value, updated_at, updated_by) VALUES ($1,$2,now(),$3) ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=now(), updated_by=$3", [key, JSON.stringify(value), by]);
}
export async function getSeo(): Promise<SeoSettings> { return mergeSeo(await getSetting("seo")); }
export async function getSite(): Promise<SiteSettings> { return mergeSite(await getSetting("site")); }

export async function getPageSeo(lang: string, path: string): Promise<PageSeo> {
  return (await q1<{ data: PageSeo }>("SELECT data FROM seo_pages WHERE lang=$1 AND lower(path)=lower($2)", [lang, path]))?.data ?? {};
}
export async function allPageSeo(): Promise<Map<string, PageSeo>> {
  const rows = await q<{ lang: string; path: string; data: PageSeo }>("SELECT lang, path, data FROM seo_pages");
  return new Map(rows.map((r) => [`${r.lang}|${r.path.toLowerCase()}`, r.data]));
}
/** Пустые поля не храним: страница берёт значения из текста и общих настроек */
export async function setPageSeo(lang: string, path: string, data: PageSeo, by: string) {
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== "" && v !== undefined && v !== null && v !== false)) as PageSeo;
  if (!Object.keys(clean).length) {
    await q("DELETE FROM seo_pages WHERE lang=$1 AND lower(path)=lower($2)", [lang, path]);
    return;
  }
  await q("DELETE FROM seo_pages WHERE lang=$1 AND lower(path)=lower($2) AND path<>$2", [lang, path.toLowerCase()]);
  await q("INSERT INTO seo_pages (lang, path, data, updated_at, updated_by) VALUES ($1,$2,$3,now(),$4) ON CONFLICT (lang, path) DO UPDATE SET data=$3, updated_at=now(), updated_by=$4", [lang, path.toLowerCase(), JSON.stringify(clean), by]);
}
