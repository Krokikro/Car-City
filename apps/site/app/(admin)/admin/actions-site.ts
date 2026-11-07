"use server";
// Действия разделов: роли и права, настройки сайта (тема), SEO, редиректы и 404, переезд.
// В каждом — проверка входа и права на сервере.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { q, q1 } from "@/lib/db";
import { audit, requireCan } from "@/lib/admin/auth";
import { isLevel, isScope, roleIdOk, SECTIONS, type Perms } from "@/lib/admin/roles";
import { getPageSeo, getSeo, getSite, setPageSeo, setSetting } from "@/lib/admin/store";
import { bust, cleanPath, isLangId } from "@/lib/admin/pages";
import { FREQS, PAGE_TYPE_NAMES, type Freq, type PageSeo, type PageType, type SeoSettings } from "@/lib/site-settings";
import { LANGS, type Lang } from "@/lib/i18n";
import { baseline, liveCheck, oldUrls, quickCheck } from "@/lib/admin/migration";
import { normFrom } from "@/lib/edge-rules";
import { themeForced } from "@/lib/theme";

import { LIM, lenError } from "@/lib/admin/limits";
const f = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const on = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "1";
function go(path: string, kind: "e" | "ok" | null = null, msg = ""): never {
  if (!kind) redirect(path);
  const [base, hash] = path.split("#");
  redirect(`${base}${base.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(msg)}${hash ? "#" + hash : ""}`);
}

// ───────────── роли и права ─────────────

export async function saveRolesAction(fd: FormData) {
  const u = await requireCan("roles", "write");
  const ids = String(fd.get("ids") ?? "").split(",").filter(Boolean);
  if (ids.some((id) => [...f(fd, `${id}:name`)].length > LIM.roleName)) go("/admin/roles", "e", `Название роли — не больше ${LIM.roleName} символов`);
  for (const id of ids) {
    if (id === "admin") continue; // права администратора не меняются
    const perms = Object.fromEntries(SECTIONS.map((s) => { const v = f(fd, `${id}:${s}`); return [s, isLevel(v) ? v : "none"]; })) as Perms;
    const scope = f(fd, `${id}:scope`);
    const name = f(fd, `${id}:name`).slice(0, 60);
    const before = await q1<{ perms: unknown; name: string; lead_scope: string }>("SELECT perms, name, lead_scope FROM roles WHERE id=$1", [id]);
    if (!before) continue;
    const changed = JSON.stringify(before.perms) !== JSON.stringify(perms) || before.name !== name || before.lead_scope !== scope;
    if (!changed) continue;
    await q("UPDATE roles SET perms=$2, name=$3, lead_scope=$4, updated_at=now() WHERE id=$1", [id, JSON.stringify(perms), name || before.name, isScope(scope) ? scope : "all"]);
    // права меняются сразу: сотрудники с этой ролью перезаходят
    await q("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE role=$1)", [id]);
    await audit(u, "Изменены права роли", "role", id, before, { name, perms, lead_scope: scope });
  }
  go("/admin/roles", "ok", "Права сохранены. Сотрудникам с изменёнными ролями нужно войти заново.");
}

export async function createRoleAction(fd: FormData) {
  const u = await requireCan("roles", "write");
  const id = f(fd, "id").toLowerCase();
  { const le = lenError(fd, { name: ["Название роли", LIM.roleName] }); if (le) go("/admin/roles", "e", le); }
  const name = f(fd, "name").slice(0, 60);
  if (!roleIdOk(id)) go("/admin/roles", "e", "Код роли: латиница, цифры, дефис, от 2 символов (например, editor)");
  if (!name) go("/admin/roles", "e", "Укажите название роли");
  const from = f(fd, "copy");
  const src = from ? await q1<{ perms: unknown; lead_scope: string }>("SELECT perms, lead_scope FROM roles WHERE id=$1", [from]) : undefined;
  const r = await q1("INSERT INTO roles (id, name, perms, lead_scope) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING id", [id, name, JSON.stringify(src?.perms ?? { dashboard: "read" }), src?.lead_scope ?? "all"]);
  if (!r) go("/admin/roles", "e", "Роль с таким кодом уже есть");
  await audit(u, "Создана роль", "role", id, undefined, { name, copy: from || null });
  go(`/admin/roles#role-${id}`, "ok", `Роль «${name}» создана. Настройте её права.`);
}

export async function deleteRoleAction(fd: FormData) {
  const u = await requireCan("roles", "write");
  const id = f(fd, "id");
  const r = await q1<{ system: boolean; name: string }>("SELECT system, name FROM roles WHERE id=$1", [id]);
  if (!r) go("/admin/roles", "e", "Роль не найдена");
  if (r!.system || id === "admin") go("/admin/roles", "e", "Основные роли удалить нельзя, можно изменить их права");
  const n = Number((await q1<{ n: string }>("SELECT count(*) n FROM users WHERE role=$1", [id]))!.n);
  if (n > 0) go("/admin/roles", "e", `У роли есть сотрудники (${n}). Сначала назначьте им другую роль.`);
  await q("DELETE FROM roles WHERE id=$1", [id]);
  await audit(u, "Удалена роль", "role", id, { name: r!.name });
  go("/admin/roles", "ok", "Роль удалена");
}

// ───────────── тема сайта ─────────────

export async function setThemeAction(fd: FormData) {
  const u = await requireCan("settings", "write");
  if (themeForced()) go("/admin/settings", "e", "На этой копии сайта тема закреплена при сборке (переменная NEXT_PUBLIC_THEME)");
  const before = await getSite();
  const theme = f(fd, "theme") === "light" ? "light" : f(fd, "theme") === "dark" ? "dark" : before.theme === "dark" ? "light" : "dark";
  const v = f(fd, "variant");
  const variant = v === "A" || v === "B" || v === "M" ? v : before.variant;
  await setSetting("site", { theme, variant }, u.login);
  await bust();
  await audit(u, theme === "light" ? "Включена светлая версия сайта" : "Включена тёмная версия сайта", "settings", "theme", before, { theme, variant });
  const back = f(fd, "back") || "/admin/settings";
  go(back.startsWith("/admin") ? back : "/admin/settings", "ok", `На сайте ${theme === "light" ? "светлая" : "тёмная"} версия. Страницы обновятся в течение минуты.`);
}

// ───────────── SEO: общие настройки ─────────────

const lines = (s: string) => s.split(/[\n,]/).map((x) => x.trim()).filter(Boolean);
const num = (s: string, d: number, lo = 0, hi = 1) => { const n = Number(s.replace(",", ".")); return Number.isFinite(n) && n >= lo && n <= hi ? n : d; };
const freq = (s: string, d: Freq): Freq => ((FREQS as string[]).includes(s) ? (s as Freq) : d);

export async function saveSeoAction(fd: FormData) {
  const u = await requireCan("seo", "write");
  const tab = f(fd, "tab");
  const cur = await getSeo();
  const next: SeoSettings = structuredClone(cur);
  const back = `/admin/seo?tab=${tab}`;
  { const le = lenError(fd, { canonicalOrigin: ["Основной адрес", LIM.origin], indexHosts: ["Домены", LIM.hosts], siteName: ["Название сайта", LIM.siteName], titleTemplate: ["Шаблон title", LIM.titleTemplate], defaultDescription: ["Description по умолчанию", LIM.description], ogImage: ["Картинка", LIM.ogImage], yandexVerification: ["Яндекс", LIM.verification], googleVerification: ["Google", LIM.verification], bingVerification: ["Bing", LIM.verification], mailruVerification: ["Mail.ru", LIM.verification], metrikaId: ["Метрика", LIM.counterId], gaId: ["GA4", LIM.counterId], gtmId: ["GTM", LIM.counterId], headHtml: ["Код в head", LIM.headHtml], robotsTxt: ["robots.txt", LIM.robotsTxt], exclude: ["Исключить адреса", LIM.sitemapExclude] }); if (le) go(back, "e", le); }
  for (const k of [...fd.keys()]) { const v = String(fd.get(k) ?? ""); if ((k.startsWith("t:") && [...v].length > LIM.tplTitle) || (k.startsWith("d:") && [...v].length > LIM.tplDescription)) go(back, "e", `Шаблон слишком длинный: title до ${LIM.tplTitle}, description до ${LIM.tplDescription} символов`); }
  if (tab === "general") {
    const origin = f(fd, "canonicalOrigin").replace(/\/+$/, "");
    if (!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/i.test(origin)) go(back, "e", "Основной адрес: https://домен без слеша в конце");
    next.canonicalOrigin = origin;
    next.indexHosts = lines(f(fd, "indexHosts")).map((h) => h.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, ""));
    if (!next.indexHosts.length) go(back, "e", "Укажите хотя бы один домен для индексации");
    next.wwwRedirect = on(fd, "wwwRedirect");
    next.lowercaseRedirect = on(fd, "lowercaseRedirect");
    next.noindexAll = on(fd, "noindexAll");
    next.hreflang = on(fd, "hreflang");
    next.orgLd = on(fd, "orgLd");
    next.siteName = f(fd, "siteName").slice(0, 80) || "Car City";
    next.titleTemplate = f(fd, "titleTemplate").slice(0, 120);
    if (next.titleTemplate && !next.titleTemplate.includes("%s")) go(back, "e", "В шаблоне title нужен %s — место для заголовка страницы");
    next.defaultDescription = f(fd, "defaultDescription").slice(0, 400);
    next.ogImage = f(fd, "ogImage").slice(0, 500);
    next.twitterCard = f(fd, "twitterCard") === "summary" ? "summary" : "summary_large_image";
  } else if (tab === "templates") {
    const t: SeoSettings["templates"] = {};
    for (const k of Object.keys(PAGE_TYPE_NAMES) as PageType[]) {
      const title = f(fd, `t:${k}`).slice(0, 200), description = f(fd, `d:${k}`).slice(0, 400);
      if (title || description) t[k] = { title: title || undefined, description: description || undefined };
    }
    next.templates = t;
  } else if (tab === "counters") {
    next.yandexVerification = f(fd, "yandexVerification").slice(0, 100);
    next.googleVerification = f(fd, "googleVerification").slice(0, 100);
    next.bingVerification = f(fd, "bingVerification").slice(0, 100);
    next.mailruVerification = f(fd, "mailruVerification").slice(0, 100);
    const ym = f(fd, "metrikaId");
    if (ym && !/^\d{5,12}$/.test(ym)) go(back, "e", "Номер счётчика Метрики — только цифры");
    next.metrikaId = ym;
    const ga = f(fd, "gaId");
    if (ga && !/^(G|UA)-[A-Z0-9-]+$/i.test(ga)) go(back, "e", "Google Analytics: номер вида G-XXXXXXX");
    next.gaId = ga.toUpperCase();
    const gtm = f(fd, "gtmId");
    if (gtm && !/^GTM-[A-Z0-9]+$/i.test(gtm)) go(back, "e", "Tag Manager: номер вида GTM-XXXXXX");
    next.gtmId = gtm.toUpperCase();
    // свой код в <head> — только администратор: это исполняемый код на всех страницах
    if (u.role === "admin") next.headHtml = String(fd.get("headHtml") ?? "").slice(0, 8000);
  } else if (tab === "robots") {
    next.robotsTxt = String(fd.get("robotsTxt") ?? "").replace(/\r/g, "").slice(0, 10000);
    if (on(fd, "reset")) next.robotsTxt = "";
  } else if (tab === "sitemap") {
    next.sitemap.langs = LANGS.filter((l) => on(fd, `lang:${l}`)) as Lang[];
    if (!next.sitemap.langs.includes("ru")) next.sitemap.langs.unshift("ru");
    next.sitemap.exclude = lines(f(fd, "exclude")).map((x) => (x.startsWith("/") ? x : "/" + x)).slice(0, 300);
    next.sitemap.images = on(fd, "images");
    for (const k of Object.keys(PAGE_TYPE_NAMES) as PageType[]) {
      next.sitemap.priority[k] = num(f(fd, `p:${k}`), cur.sitemap.priority[k]);
      next.sitemap.changefreq[k] = freq(f(fd, `c:${k}`), cur.sitemap.changefreq[k]);
    }
  } else go("/admin/seo", "e", "Неизвестный раздел");
  await setSetting("seo", next, u.login);
  await bust();
  await audit(u, `SEO: изменены настройки (${tab})`, "seo", tab, cur, next);
  go(back, "ok", "Сохранено, сайт уже использует новые настройки");
}

// ───────────── SEO отдельной страницы ─────────────

export async function savePageSeoAction(fd: FormData) {
  const u = await requireCan("seo", "write");
  const lang = f(fd, "lang");
  const path = cleanPath(f(fd, "path")) ?? (f(fd, "path") === "/" ? "/" : null);
  if (!isLangId(lang) || !path) go("/admin/seo?tab=pages", "e", "Неверный адрес страницы");
  const back = `/admin/seo/page?lang=${lang}&path=${encodeURIComponent(path!)}`;
  { const le = lenError(fd, { title: ["Title", LIM.title], description: ["Description", LIM.description], keywords: ["Keywords", LIM.keywords], canonical: ["Canonical", LIM.canonical], ogTitle: ["OG заголовок", LIM.ogTitle], ogDescription: ["OG описание", LIM.ogDescription], ogImage: ["OG картинка", LIM.ogImage], jsonLd: ["JSON-LD", LIM.jsonLd] }); if (le) go(back, "e", le); }
  const jsonLd = String(fd.get("jsonLd") ?? "").trim();
  if (jsonLd) { try { JSON.parse(jsonLd); } catch { go(back, "e", "Микроразметка: это не корректный JSON"); } }
  const pr = f(fd, "priority");
  const data: PageSeo = {
    title: f(fd, "title").slice(0, LIM.title),
    description: f(fd, "description").slice(0, LIM.description),
    keywords: f(fd, "keywords").slice(0, 300),
    canonical: f(fd, "canonical").slice(0, 500),
    noindex: on(fd, "noindex"),
    nofollow: on(fd, "nofollow"),
    ogTitle: f(fd, "ogTitle").slice(0, 300),
    ogDescription: f(fd, "ogDescription").slice(0, 600),
    ogImage: f(fd, "ogImage").slice(0, 500),
    sitemapExclude: on(fd, "sitemapExclude"),
    priority: pr ? num(pr, 0.5) : undefined,
    changefreq: f(fd, "changefreq") ? freq(f(fd, "changefreq"), "monthly") : undefined,
    jsonLd: jsonLd.slice(0, 20000),
    noHreflang: on(fd, "noHreflang"),
  };
  if (data.canonical && !/^(https?:\/\/|\/)/.test(data.canonical)) go(back, "e", "Canonical: полный адрес или путь, начинающийся с /");
  const before = await getPageSeo(lang, path!);
  await setPageSeo(lang, path!, data, u.login);
  await bust();
  await audit(u, "SEO страницы изменено", "seo_page", `${lang}${path}`, before, data);
  go(back, "ok", "Сохранено");
}

// ───────────── редиректы и 404 ─────────────

const CODES = [301, 302, 307, 308, 410];

function cleanFrom(s: string) {
  let v = s.trim();
  if (/^https?:\/\//i.test(v)) { try { const u = new URL(v); v = u.pathname + u.search; } catch { return ""; } }
  return v.startsWith("/") ? v.slice(0, 500) : "";
}
function cleanTo(s: string) {
  const v = s.trim();
  if (!v) return "";
  if (/^https?:\/\/[^\s]+$/i.test(v)) return v.slice(0, 1000);
  return v.startsWith("/") ? v.slice(0, 1000) : "/" + v.slice(0, 999);
}

export async function saveRedirectAction(fd: FormData) {
  const u = await requireCan("redirects", "write");
  const id = f(fd, "id");
  { const le = lenError(fd, { from: ["Откуда", LIM.redirectPath], to: ["Куда", LIM.redirectPath], note: ["Заметка", LIM.redirectNote] }); if (le) go("/admin/redirects", "e", le); }
  const match = ["exact", "prefix", "regex"].includes(f(fd, "match")) ? f(fd, "match") : "exact";
  const from = match === "regex" ? f(fd, "from").slice(0, 500) : cleanFrom(f(fd, "from"));
  const code = CODES.includes(Number(f(fd, "code"))) ? Number(f(fd, "code")) : 301;
  const to = code === 410 ? "" : cleanTo(f(fd, "to"));
  const back = f(fd, "back") || "/admin/redirects";
  if (!from) go(back, "e", "Откуда: путь, начинающийся с / (или полный адрес старого сайта)");
  if (match === "regex") { try { new RegExp(from); } catch { go(back, "e", "Неверное регулярное выражение"); } }
  if (code !== 410 && !to) go(back, "e", "Куда: путь на сайте или полный адрес");
  if (match === "exact" && code !== 410 && normFrom(from) === normFrom(to)) go(back, "e", "Редирект на самого себя");
  // цепочки: если цель сама перенаправляет, сразу ведём на конечный адрес
  let final = to;
  for (let i = 0; i < 5 && final && !final.startsWith("http"); i++) {
    const r = await q1<{ to_path: string; code: number }>("SELECT to_path, code FROM redirects WHERE active AND match='exact' AND lower(from_path)=$1", [normFrom(final)]);
    if (!r || r.code === 410) break;
    final = r.to_path;
  }
  const note = f(fd, "note").slice(0, 300);
  if (id) {
    const before = await q1("SELECT from_path, to_path, code, match FROM redirects WHERE id=$1", [id]);
    await q("UPDATE redirects SET from_path=$2, to_path=$3, code=$4, match=$5, note=$6, active=true WHERE id=$1", [id, from, final, code, match, note]);
    await audit(u, "Редирект изменён", "redirect", from, before, { from, to: final, code, match });
  } else {
    const r = await q1("INSERT INTO redirects (from_path, to_path, code, match, note, created_by) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING id", [from, final, code, match, note, u.login]);
    if (!r) go(back, "e", "Для этого адреса редирект уже есть");
    // все, кто вёл на старый адрес, теперь ведут сразу на новый (без цепочек)
    if (match === "exact") await q("UPDATE redirects SET to_path=$2 WHERE match='exact' AND lower(to_path)=$1", [normFrom(from), final]);
    await q("UPDATE not_found SET ignored=true WHERE lower(path)=$1", [normFrom(from)]);
    await audit(u, "Редирект добавлен", "redirect", from, undefined, { from, to: final, code, match });
  }
  go(back, "ok", final !== to ? `Сохранено. Цель сама перенаправляла — ведём сразу на ${final}` : "Сохранено, редирект уже работает");
}

export async function redirectToolAction(fd: FormData) {
  const u = await requireCan("redirects", "write");
  const id = f(fd, "id");
  const op = f(fd, "op");
  const r = await q1<{ from_path: string; active: boolean }>("SELECT from_path, active FROM redirects WHERE id=$1", [id]);
  if (!r) go("/admin/redirects", "e", "Редирект не найден");
  if (op === "toggle") {
    await q("UPDATE redirects SET active = NOT active WHERE id=$1", [id]);
    await audit(u, r!.active ? "Редирект выключен" : "Редирект включён", "redirect", r!.from_path);
  } else if (op === "delete") {
    await q("DELETE FROM redirects WHERE id=$1", [id]);
    await audit(u, "Редирект удалён", "redirect", r!.from_path);
  }
  go("/admin/redirects", "ok", "Готово");
}

/** Массовый ввод: по строке «откуда куда [код]», разделитель — пробел, табуляция, ; или , */
export async function importRedirectsAction(fd: FormData) {
  const u = await requireCan("redirects", "write");
  const rows = String(fd.get("csv") ?? "").split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#")).slice(0, 2000);
  let ok = 0, bad = 0;
  for (const row of rows) {
    const [a, b, c] = row.split(/[\s;,]+/);
    const from = cleanFrom(a ?? ""), code = CODES.includes(Number(c)) ? Number(c) : 301, to = code === 410 ? "" : cleanTo(b ?? "");
    if (!from || (code !== 410 && !to) || normFrom(from) === normFrom(to)) { bad++; continue; }
    const r = await q1("INSERT INTO redirects (from_path, to_path, code, match, note, created_by) VALUES ($1,$2,$3,'exact','импорт',$4) ON CONFLICT DO NOTHING RETURNING id", [from, to, code, u.login]);
    if (r) ok++; else bad++;
  }
  await audit(u, "Импорт редиректов", "redirect", "import", undefined, { ok, bad });
  go("/admin/redirects", ok ? "ok" : "e", `Добавлено: ${ok}${bad ? `, пропущено (ошибки или уже есть): ${bad}` : ""}`);
}

export async function notFoundToolAction(fd: FormData) {
  const u = await requireCan("redirects", "write");
  const op = f(fd, "op");
  if (op === "ignore") await q("UPDATE not_found SET ignored=true WHERE path=$1", [f(fd, "path")]);
  else if (op === "clear") { await q("DELETE FROM not_found WHERE ignored OR last_at < now() - interval '30 days'"); await audit(u, "Журнал 404 очищен", "not_found", "clear"); }
  go("/admin/redirects?tab=404", "ok", "Готово");
}

// ───────────── переезд ─────────────

async function selfOrigin() {
  const port = process.env.PORT || "3000";
  // запросы к самому себе — напрямую на сервер, с заголовком основного домена (как придёт робот после переезда)
  return { base: `http://127.0.0.1:${port}`, host: (await headers()).get("host") || "" };
}

/** Живая проверка всех старых адресов: статус, редиректы, title, canonical, noindex */
export async function runLiveCheckAction() {
  const u = await requireCan("migration", "write");
  const b = baseline();
  if (!b) go("/admin/migration", "e", "Нет снимка старого сайта (content/seo/baseline.json)");
  const { base } = await selfOrigin();
  const asHost = (await getSeo()).indexHosts[0] || "car-city.pro";
  const list = oldUrls(b!).map((p) => p.path);
  let i = 0;
  const worker = async () => {
    while (i < list.length) {
      const path = list[i++];
      const r = await liveCheck(base, path, asHost);
      await q("INSERT INTO migration_checks (path, result, checked_at) VALUES ($1,$2,now()) ON CONFLICT (path) DO UPDATE SET result=$2, checked_at=now()", [path, JSON.stringify(r)]);
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  await audit(u, "Проверка адресов старого сайта", "migration", "live", undefined, { n: list.length });
  go("/admin/migration", "ok", `Проверено адресов: ${list.length}`);
}

/** Для страниц, где title/description отличаются от старого сайта, вернуть старые (сохраняет сниппеты в выдаче) */
export async function adoptOldMetaAction(fd: FormData) {
  const u = await requireCan("seo", "write");
  await requireCan("migration", "write");
  const only = f(fd, "path");
  const what = f(fd, "what"); // title | description | both
  // только та же страница (сравнение посчитано), не цель редиректа на другую страницу
  const checks = (await quickCheck()).filter((c) => c.old.status === 200 && (c.titleSame !== undefined) && (!only || c.path === only));
  let n = 0;
  for (const c of checks) {
    const cur = await getPageSeo("ru", c.target);
    const next = { ...cur };
    if ((what === "title" || what === "both") && c.old.title && !c.titleSame) next.title = c.old.title;
    if ((what === "description" || what === "both") && c.old.description && !c.descSame) next.description = c.old.description;
    if (JSON.stringify(next) !== JSON.stringify(cur)) { await setPageSeo("ru", c.target, next, u.login); n++; }
  }
  await bust();
  await audit(u, "Перенесены title/description старого сайта", "migration", only || "all", undefined, { n, what });
  go(only ? `/admin/migration#${encodeURIComponent(only)}` : "/admin/migration", "ok", n ? `Обновлено страниц: ${n}` : "Всё уже совпадает");
}

/** Для пропавших адресов — редирект на подходящую страницу одним нажатием */
export async function fixMissingAction(fd: FormData) {
  const u = await requireCan("redirects", "write");
  const from = cleanFrom(f(fd, "from"));
  const to = cleanTo(f(fd, "to"));
  if (!from || !to) go("/admin/migration", "e", "Укажите, куда вести");
  await q("INSERT INTO redirects (from_path, to_path, code, match, note, created_by) VALUES ($1,$2,301,'exact','переезд',$3) ON CONFLICT DO NOTHING", [from, to, u.login]);
  await audit(u, "Редирект для старого адреса", "redirect", from, undefined, { to });
  go("/admin/migration", "ok", `${from} → ${to}`);
}

// ───────────── тексты сайта (главная, интерфейс, контакты, форма) ─────────────

export async function saveTextsAction(fd: FormData) {
  const { screenOf, fieldsOf } = await import("@/lib/admin/text-bundles");
  const sc = screenOf(f(fd, "screen"));
  if (!sc) go("/admin", "e", "Неизвестный раздел текстов");
  const u = await requireCan(sc!.section, "write");
  const lang = f(fd, "lang");
  if (!sc!.langs.includes(lang as Lang)) go(`/admin/texts?s=${sc!.id}`, "e", "Неизвестный язык");
  const back = `/admin/texts?s=${sc!.id}&lang=${lang}`;
  const intent = f(fd, "intent");
  if (intent === "discard") {
    for (const b of sc!.bundles) await q("UPDATE texts SET draft=NULL WHERE bundle=$1 AND lang=$2", [b.id, lang]);
    await audit(u, "Черновик текстов отброшен", "texts", `${sc!.id}:${lang}`);
    go(back, "ok", "Черновик отброшен");
  }
  const tooLong: string[] = [];
  const patches = new Map<string, Record<string, string>>();
  for (const b of sc!.bundles) {
    const patch: Record<string, string> = {};
    for (const fl of fieldsOf(b)) {
      const raw = fd.get(`f:${b.id}:${fl.path}`);
      if (raw === null) continue;
      const v = String(raw).replace(/\r\n/g, "\n");
      const def = fl.def[lang] ?? fl.def.ru ?? "";
      if ([...v].length > fl.max) tooLong.push(`${fl.group} → ${fl.label}: ${[...v].length} из ${fl.max}`);
      if (!v.trim()) continue; // пустое поле — исходный текст
      if (v !== def) patch[fl.path] = v;
    }
    patches.set(b.id, patch);
  }
  if (tooLong.length) go(back, "e", `Слишком длинно (не сохранено): ${tooLong.slice(0, 5).join("; ")}`);
  for (const [bundle, patch] of patches) {
    const row = await q1<{ published: Record<string, string> | null }>("SELECT published FROM texts WHERE bundle=$1 AND lang=$2", [bundle, lang]);
    const same = JSON.stringify(patch) === JSON.stringify(row?.published ?? {});
    if (intent === "publish") {
      if (same) { await q("UPDATE texts SET draft=NULL WHERE bundle=$1 AND lang=$2", [bundle, lang]); continue; }
      await q("INSERT INTO texts (bundle, lang, published, draft, updated_at, updated_by) VALUES ($1,$2,$3,NULL,now(),$4) ON CONFLICT (bundle, lang) DO UPDATE SET published=$3, draft=NULL, updated_at=now(), updated_by=$4", [bundle, lang, JSON.stringify(patch), u.login]);
      await q("INSERT INTO text_versions (bundle, lang, data, note, by) VALUES ($1,$2,$3,'Публикация',$4)", [bundle, lang, JSON.stringify(patch), u.login]);
      await audit(u, "Тексты опубликованы", "texts", `${bundle}:${lang}`, row?.published ?? {}, patch);
    } else {
      await q("INSERT INTO texts (bundle, lang, draft, updated_at, updated_by) VALUES ($1,$2,$3,now(),$4) ON CONFLICT (bundle, lang) DO UPDATE SET draft=$3, updated_at=now(), updated_by=$4", [bundle, lang, JSON.stringify(patch), u.login]);
    }
  }
  if (intent === "publish") { await bust(); go(back, "ok", "Опубликовано, на сайте уже новые тексты"); }
  await audit(u, "Черновик текстов сохранён", "texts", `${sc!.id}:${lang}`);
  go(back, "ok", "Черновик сохранён. На сайте пока без изменений.");
}

export async function rollbackTextsAction(fd: FormData) {
  const { bundleOf, screenOf } = await import("@/lib/admin/text-bundles");
  const sc = screenOf(f(fd, "screen"));
  if (!sc) go("/admin", "e", "Неизвестный раздел текстов");
  const u = await requireCan(sc!.section, "write");
  const v = await q1<{ bundle: string; lang: string; data: Record<string, string> }>("SELECT bundle, lang, data FROM text_versions WHERE id=$1", [f(fd, "id")]);
  if (!v || !bundleOf(v.bundle) || !sc!.bundles.some((b) => b.id === v.bundle)) go(`/admin/texts?s=${sc!.id}`, "e", "Версия не найдена");
  await q("INSERT INTO texts (bundle, lang, draft, updated_at, updated_by) VALUES ($1,$2,$3,now(),$4) ON CONFLICT (bundle, lang) DO UPDATE SET draft=$3, updated_at=now(), updated_by=$4", [v!.bundle, v!.lang, JSON.stringify(v!.data), u.login]);
  await audit(u, "Версия текстов загружена в черновик", "texts", `${v!.bundle}:${v!.lang}`);
  go(`/admin/texts?s=${sc!.id}&lang=${v!.lang}`, "ok", "Старая версия загружена в черновик. Проверьте и опубликуйте.");
}
