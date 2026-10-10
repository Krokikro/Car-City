"use server";
// Все действия админки. В каждом — проверка входа и права на сервере; кнопки в интерфейсе ничего не решают.
import { timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { q, q1 } from "@/lib/db";
import { dbEnabled } from "@/lib/db";
import {
  audit, checkPassword, endSession, getSession, loginBlocked, loginFailed, loginOk, requireCan, startSession, twoFaRequired,
  type AdminUser,
} from "@/lib/admin/auth";
import { hashPassword, newTotpSecret, passwordProblem, seal, sha256, token, unseal, verifyPassword, verifyTotp } from "@/lib/admin/crypto";
import { isRole, LEAD_STATUSES, LOST_REASONS, ROLES, can, type Role } from "@/lib/admin/roles";
import { bust, cleanData, cleanPath, discardDraft, fileData, isLangId, publishData, resetToFile, rowOf, saveDraft, version } from "@/lib/admin/pages";
import { savePatch } from "@/lib/admin/fleet";
import { leadScope } from "@/lib/admin/scope";
import { BASE_FLEET } from "@/lib/admin/overlay";
import { fleetClasses } from "@/lib/fleet";
import { draftMode } from "next/headers";
import { reviewKey } from "@/lib/reviews";

const f = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
function go(path: string, kind: "e" | "ok" | null = null, msg = ""): never {
  if (!kind) redirect(path);
  const [base, hash] = path.split("#");
  redirect(`${base}${base.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(msg)}${hash ? "#" + hash : ""}`);
}
const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length < 200;

// ───────────── вход ─────────────

export async function loginAction(fd: FormData) {
  if (!dbEnabled()) go("/admin/login", "e", "База данных не подключена");
  const email = f(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (await loginBlocked(email)) go("/admin/login", "e", "Слишком много попыток. Подождите 15 минут.");
  const id = await checkPassword(email, password);
  if (!id) {
    await loginFailed(email);
    await audit(null, "Неудачный вход", "user", email);
    go("/admin/login", "e", "Неверная почта или пароль");
  }
  const u = (await q1<{ totp_on: boolean }>("SELECT totp_on FROM users WHERE id=$1", [id]))!;
  if (u.totp_on) {
    await startSession(id, "pw");
    go("/admin/login/code");
  }
  await startSession(id, "full");
  await loginOk(email, id);
  await audit({ id, email, role: "admin" }, "Вход (без 2FA)", "user", email);
  go(twoFaRequired() ? "/admin/security?enroll=1" : "/admin");
}

export async function codeAction(fd: FormData) {
  const s = await getSession();
  if (!s || s.stage !== "pw" || !s.user.totpSecret) go("/admin/login");
  const u = s!.user;
  if (await loginBlocked(u.email)) go("/admin/login/code", "e", "Слишком много попыток. Подождите 15 минут.");
  let ok = false;
  try { ok = verifyTotp(unseal(u.totpSecret!), f(fd, "code")); } catch { ok = false; }
  if (!ok) {
    await loginFailed(u.email);
    await audit(u, "Неверный код 2FA", "user", u.email);
    go("/admin/login/code", "e", "Код не подошёл. Проверьте время на телефоне и попробуйте ещё раз.");
  }
  await q("DELETE FROM sessions WHERE token_hash=$1", [s!.hash]);
  await startSession(u.id, "full");
  await loginOk(u.email, u.id);
  await audit(u, "Вход", "user", u.email);
  go("/admin");
}

export async function logoutAction() {
  const s = await getSession();
  if (s) await audit(s.user, "Выход", "user", s.user.email);
  await endSession();
  (await draftMode()).disable();
  go("/admin/login");
}

export async function signOutAllAction() {
  const u = await requireCan("dashboard", "read");
  await q("DELETE FROM sessions WHERE user_id=$1", [u.id]);
  await audit(u, "Выход на всех устройствах", "user", u.email);
  go("/admin/login");
}

// ───────────── первый запуск и приглашения ─────────────

const safeEq = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export async function setupAction(fd: FormData) {
  const want = process.env.ADMIN_SETUP_TOKEN;
  if (!dbEnabled() || !want) go("/admin/login", "e", "Первый запуск не включён");
  const n = Number((await q1<{ n: string }>("SELECT count(*) n FROM users"))!.n);
  if (n > 0) go("/admin/login", "e", "Администратор уже создан");
  if (await loginBlocked("setup")) go("/admin/setup", "e", "Слишком много попыток. Подождите 15 минут.");
  if (!safeEq(f(fd, "token"), want!)) { await loginFailed("setup"); go("/admin/setup", "e", "Код первого запуска не подошёл"); }
  const email = f(fd, "email").toLowerCase();
  const pw = String(fd.get("password") ?? "");
  if (!emailOk(email)) go("/admin/setup", "e", "Проверьте адрес почты");
  if (pw !== String(fd.get("password2") ?? "")) go("/admin/setup", "e", "Пароли не совпадают");
  const bad = passwordProblem(pw);
  if (bad) go("/admin/setup", "e", bad);
  const row = await q1<{ id: string }>("INSERT INTO users (email, name, role, pass_hash) VALUES ($1,$2,'admin',$3) ON CONFLICT DO NOTHING RETURNING id", [email, f(fd, "name") || "Администратор", hashPassword(pw)]);
  if (!row) go("/admin/login", "e", "Администратор уже создан");
  await audit({ id: row!.id, email, role: "admin" }, "Создан первый администратор", "user", email);
  go("/admin/login", "ok", "Администратор создан. Войдите.");
}

export async function inviteAcceptAction(fd: FormData) {
  const t = f(fd, "token");
  const back = `/admin/invite/${encodeURIComponent(t)}`;
  const u = await q1<{ id: string; email: string; role: string }>("SELECT id, email, role FROM users WHERE invite_hash=$1 AND invite_until > now() AND active", [sha256(t)]);
  if (!u) go("/admin/login", "e", "Ссылка не действует. Попросите новую.");
  const pw = String(fd.get("password") ?? "");
  if (pw !== String(fd.get("password2") ?? "")) go(back, "e", "Пароли не совпадают");
  const bad = passwordProblem(pw);
  if (bad) go(back, "e", bad);
  await q("UPDATE users SET pass_hash=$2, invite_hash=NULL, invite_until=NULL, totp_on=false, totp_secret=NULL WHERE id=$1", [u!.id, hashPassword(pw)]);
  await audit({ id: u!.id, email: u!.email, role: isRole(u!.role) ? u!.role : "manager" }, "Принято приглашение, задан пароль", "user", u!.email);
  go("/admin/login", "ok", "Пароль задан. Войдите, затем подключите 2FA.");
}

// ───────────── безопасность: 2FA и пароль ─────────────

export async function enrollStartAction() {
  const s = await getSession();
  if (!s || s.stage !== "full") go("/admin/login");
  await q("UPDATE users SET totp_secret=$2, totp_on=false WHERE id=$1", [s!.user.id, seal(newTotpSecret())]);
  go("/admin/security?enroll=1");
}

export async function enrollConfirmAction(fd: FormData) {
  const s = await getSession();
  if (!s || s.stage !== "full") go("/admin/login");
  const u = s!.user;
  if (!u.totpSecret) go("/admin/security?enroll=1");
  let ok = false;
  try { ok = verifyTotp(unseal(u.totpSecret!), f(fd, "code")); } catch { ok = false; }
  if (!ok) go("/admin/security?enroll=1", "e", "Код не подошёл. Попробуйте ещё раз.");
  await q("UPDATE users SET totp_on=true WHERE id=$1", [u.id]);
  await audit(u, "Включена 2FA", "user", u.email);
  go("/admin", "ok", "Двухфакторная защита включена");
}

export async function changePasswordAction(fd: FormData) {
  const s = await getSession();
  if (!s || s.stage !== "full") go("/admin/login");
  const u = s!.user;
  const row = await q1<{ pass_hash: string }>("SELECT pass_hash FROM users WHERE id=$1", [u.id]);
  if (!verifyPassword(String(fd.get("old") ?? ""), row?.pass_hash)) go("/admin/security", "e", "Текущий пароль указан неверно");
  const pw = String(fd.get("password") ?? "");
  if (pw !== String(fd.get("password2") ?? "")) go("/admin/security", "e", "Новые пароли не совпадают");
  const bad = passwordProblem(pw);
  if (bad) go("/admin/security", "e", bad);
  await q("UPDATE users SET pass_hash=$2 WHERE id=$1", [u.id, hashPassword(pw)]);
  await q("DELETE FROM sessions WHERE user_id=$1 AND token_hash<>$2", [u.id, s!.hash]);
  await audit(u, "Пароль изменён", "user", u.email);
  go("/admin/security", "ok", "Пароль изменён, на других устройствах вы вышли");
}

// ───────────── страницы и SEO ─────────────

const when = (v: string) => {
  if (!v) return null;
  const d = new Date(`${v}:00+03:00`); // время московское
  return Number.isNaN(d.getTime()) ? null : d;
};

export async function savePageAction(fd: FormData) {
  const u = await requireCan("content", "write");
  const lang = f(fd, "lang");
  const path = f(fd, "path");
  if (!isLangId(lang) || !cleanPath(path)) go("/admin/content", "e", "Неверный адрес страницы");
  const here = `/admin/content/edit?lang=${lang}&path=${encodeURIComponent(path)}`;
  const intent = f(fd, "intent");
  const kind = f(fd, "kind");
  const data = cleanData({ title: f(fd, "title"), h1: f(fd, "h1"), description: f(fd, "description"), body: String(fd.get("body") ?? ""), kind: kind === "article" ? "article" : kind === "model" ? "model" : kind === "page" ? "page" : undefined });
  if (!data.title || !data.h1) go(here, "e", "Заполните заголовок страницы (title) и H1");
  const row = await rowOf(lang, path);
  const before = row?.published ?? fileData(lang, path) ?? null;

  if (intent === "draft") {
    await saveDraft(lang, path, data, u.email, null);
    await audit(u, "Черновик сохранён", "page", `${lang}${path}`);
    go(here, "ok", "Черновик сохранён. На сайте пока без изменений.");
  }
  if (intent === "schedule") {
    const at = when(f(fd, "publish_at"));
    if (!at || at.getTime() < Date.now() + 60_000) go(here, "e", "Укажите время публикации в будущем (московское)");
    await saveDraft(lang, path, data, u.email, at);
    await audit(u, "Публикация запланирована", "page", `${lang}${path}`, undefined, { at: at!.toISOString() });
    go(here, "ok", "Запланировано. Страница выйдет сама в указанное время.");
  }
  if (intent === "publish") {
    await publishData(lang, path, data, u.email, "Публикация");
    await bust();
    await audit(u, "Страница опубликована", "page", `${lang}${path}`, before, data);
    go(here, "ok", "Опубликовано, на сайте уже новая версия");
  }
  if (intent === "hide") {
    await publishData(lang, path, { ...data, hidden: true }, u.email, "Снята с публикации");
    await bust();
    await audit(u, "Страница снята с публикации", "page", `${lang}${path}`, before, undefined);
    go(here, "ok", "Страница снята с публикации, адрес отдаёт 404");
  }
  go(here, "e", "Неизвестное действие");
}

export async function pageToolAction(fd: FormData) {
  const u = await requireCan("content", "write");
  const lang = f(fd, "lang");
  const path = f(fd, "path");
  if (!isLangId(lang) || !cleanPath(path)) go("/admin/content", "e", "Неверный адрес страницы");
  const here = `/admin/content/edit?lang=${lang}&path=${encodeURIComponent(path)}`;
  const act = f(fd, "act");
  if (act === "discard") {
    await discardDraft(lang, path);
    await audit(u, "Черновик отброшен", "page", `${lang}${path}`);
    go(here, "ok", "Черновик отброшен");
  }
  if (act === "reset") {
    await resetToFile(lang, path);
    await bust();
    await audit(u, "Страница возвращена к исходному тексту", "page", `${lang}${path}`);
    go(here, "ok", "Страница снова такая, как была при запуске сайта");
  }
  if (act === "rollback") {
    const v = await version(f(fd, "version"));
    if (!v || v.lang !== lang || v.path !== path) go(here, "e", "Версия не найдена");
    await saveDraft(lang, path, v!.data, u.email, null);
    await audit(u, "Версия загружена в черновик", "page", `${lang}${path}`, undefined, { version: v!.id });
    go(here, "ok", "Старая версия загружена в черновик. Проверьте и опубликуйте.");
  }
  go(here, "e", "Неизвестное действие");
}

export async function createPageAction(fd: FormData) {
  const u = await requireCan("content", "write");
  const lang = f(fd, "lang");
  const path = cleanPath(f(fd, "path"));
  const kind = f(fd, "kind") === "article" ? "article" : "page";
  if (!isLangId(lang) || !path) go("/admin/content/new", "e", "Адрес: латиница, цифры и дефис, например /akcii/osen");
  if ((await rowOf(lang, path!)) || fileData(lang, path!)) go("/admin/content/new", "e", "Такая страница уже есть");
  const h1 = f(fd, "h1") || "Новая страница";
  await saveDraft(lang, path!, cleanData({ title: f(fd, "title") || h1, h1, body: `# ${h1}\n\n`, kind }), u.email, null);
  await audit(u, "Создана страница", "page", `${lang}${path}`);
  go(`/admin/content/edit?lang=${lang}&path=${encodeURIComponent(path!)}`, "ok", "Страница создана как черновик");
}

// ───────────── автопарк ─────────────

export async function saveCarAction(fd: FormData) {
  const u = await requireCan("catalog", "write");
  const slug = f(fd, "slug");
  const car = BASE_FLEET.find((c) => c.slug === slug);
  if (!car) go("/admin/catalog", "e", "Нет такой машины");
  const price = Math.round(Number(f(fd, "price")));
  if (!Number.isFinite(price) || price < 500 || price > 50000) go(`/admin/catalog#${slug}`, "e", "Цена в сутки — от 500 до 50 000 ₽");
  const cls = f(fd, "cls");
  if (!fleetClasses.some((c) => c.id === cls)) go(`/admin/catalog#${slug}`, "e", "Неизвестный класс");
  const old = Math.round(Number(f(fd, "old") || 0));
  if (old && (!Number.isFinite(old) || old <= price || old > 100000)) go(`/admin/catalog#${slug}`, "e", "Старая цена должна быть больше текущей");
  // скидка в процентах: либо введена вручную, либо считается по старой цене
  let off = Math.round(Number(f(fd, "off") || 0));
  if (old) off = Math.round((1 - price / old) * 100);
  if (!Number.isFinite(off) || off < 0 || off > 90) go(`/admin/catalog#${slug}`, "e", "Скидка — от 0 до 90%");
  const featured = Math.max(0, Math.round(Number(f(fd, "featured") || 0)));
  const before = await q1<{ data: unknown }>("SELECT data FROM fleet_overrides WHERE slug=$1", [slug]);
  const diff = await savePatch(slug, {
    name: f(fd, "name") || car!.name, price, cls: cls as never, engine: f(fd, "engine"), gearbox: f(fd, "gearbox"), badge: f(fd, "badge"), old, off, featured, hidden: fd.get("hidden") === "on",
  }, u.email);
  await bust();
  await audit(u, "Автомобиль изменён", "car", slug, before?.data ?? null, diff);
  go(`/admin/catalog#${slug}`, "ok", `${car!.name}: сохранено`);
}

// ───────────── медиатека ─────────────

export async function deleteMediaAction(fd: FormData) {
  const u = await requireCan("media", "write");
  const id = f(fd, "id");
  const m = await q1<{ name: string }>("DELETE FROM media WHERE id=$1 RETURNING name", [id]);
  if (m) await audit(u, "Файл удалён из медиатеки", "media", id, { name: m.name });
  go("/admin/media", "ok", "Файл удалён");
}

// ───────────── заявки ─────────────

export async function updateLeadAction(fd: FormData) {
  const u = await requireCan("leads", "write");
  const id = f(fd, "id");
  const here = `/admin/leads/${encodeURIComponent(id)}`;
  const sc = leadScope(u);
  const cur = await q1<{ status: string; reason: string | null; assignee: string | null; comment: string }>(
    `SELECT status, reason, assignee::text, comment FROM leads WHERE id=$${sc.params.length + 1} AND ${sc.sql}`, [...sc.params, id],
  );
  if (!cur) go("/admin/leads", "e", "Заявка не найдена или не ваша");
  const status = f(fd, "status");
  if (!LEAD_STATUSES.some((s) => s.id === status)) go(here, "e", "Неизвестный статус");
  const reason = status === "lost" ? f(fd, "reason") : "";
  if (status === "lost" && !LOST_REASONS.includes(reason)) go(here, "e", "Для отказа выберите причину");
  // назначение
  let assignee = cur!.assignee;
  const want = f(fd, "assignee");
  if (want !== "" && want !== (cur!.assignee ?? "none")) {
    if (can(u.role, "users", "write") || u.role === "commercial" || u.role === "admin") {
      if (want === "none") assignee = null;
      else {
        const t = await q1<{ id: string }>("SELECT id::text FROM users WHERE id::text=$1 AND active", [want]);
        if (!t) go(here, "e", "Сотрудник не найден");
        assignee = t!.id;
      }
    } else if (want === u.id && !cur!.assignee) assignee = u.id;
    else if (want === "none" && cur!.assignee === u.id) assignee = null;
    else go(here, "e", "Назначать заявки может коммерческий директор или администратор");
  }
  const comment = String(fd.get("comment") ?? "").slice(0, 4000);
  await q("UPDATE leads SET status=$2, reason=$3, assignee=$4, comment=$5, updated_at=now() WHERE id=$1", [id, status, reason || null, assignee, comment]);
  await audit(u, "Заявка обновлена", "lead", id, cur, { status, reason: reason || null, assignee, comment });
  go(here, "ok", "Сохранено");
}

// ───────────── пользователи ─────────────

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

async function target(actor: AdminUser, id: string) {
  const t = await q1<{ id: string; email: string; role: string; active: boolean }>("SELECT id::text, email, role, active FROM users WHERE id::text=$1", [id]);
  if (!t) go("/admin/users", "e", "Пользователь не найден");
  // Чужого администратора может менять только администратор
  if (t!.role === "admin" && actor.role !== "admin") go("/admin/users", "e", "Менять администраторов может только администратор");
  return t!;
}

export async function createUserAction(fd: FormData) {
  const u = await requireCan("users", "write");
  const email = f(fd, "email").toLowerCase();
  const role = f(fd, "role");
  if (!emailOk(email)) go("/admin/users", "e", "Проверьте адрес почты");
  if (!isRole(role)) go("/admin/users", "e", "Выберите роль");
  if (role === "admin" && u.role !== "admin") go("/admin/users", "e", "Администратора создаёт только администратор");
  const t = token(24);
  const row = await q1<{ id: string }>(
    "INSERT INTO users (email, name, role, invite_hash, invite_until) VALUES ($1,$2,$3,$4, now() + interval '72 hours') ON CONFLICT (email) DO NOTHING RETURNING id",
    [email, f(fd, "name") || email.split("@")[0], role, sha256(t)],
  );
  if (!row) go("/admin/users", "e", "Пользователь с такой почтой уже есть");
  await audit(u, "Создан пользователь", "user", email, undefined, { role });
  go(`/admin/users?link=${encodeURIComponent(`${await origin()}/admin/invite/${t}`)}&for=${encodeURIComponent(email)}`);
}

export async function reinviteAction(fd: FormData) {
  const u = await requireCan("users", "write");
  const t0 = await target(u, f(fd, "id"));
  const t = token(24);
  await q("UPDATE users SET invite_hash=$2, invite_until=now() + interval '72 hours' WHERE id::text=$1", [t0.id, sha256(t)]);
  await audit(u, "Выдана новая ссылка-приглашение", "user", t0.email);
  go(`/admin/users?link=${encodeURIComponent(`${await origin()}/admin/invite/${t}`)}&for=${encodeURIComponent(t0.email)}`);
}

export async function setRoleAction(fd: FormData) {
  const u = await requireCan("users", "write");
  const t = await target(u, f(fd, "id"));
  const role = f(fd, "role") as Role;
  if (!ROLES.includes(role)) go("/admin/users", "e", "Выберите роль");
  if (t.id === u.id) go("/admin/users", "e", "Свою роль менять нельзя");
  if (role === "admin" && u.role !== "admin") go("/admin/users", "e", "Администратора назначает только администратор");
  await q("UPDATE users SET role=$2 WHERE id::text=$1", [t.id, role]);
  await q("DELETE FROM sessions WHERE user_id::text=$1", [t.id]);
  await audit(u, "Изменена роль", "user", t.email, { role: t.role }, { role });
  go("/admin/users", "ok", `${t.email}: новая роль`);
}

export async function toggleActiveAction(fd: FormData) {
  const u = await requireCan("users", "write");
  const t = await target(u, f(fd, "id"));
  if (t.id === u.id) go("/admin/users", "e", "Себя заблокировать нельзя");
  const on = !t.active;
  if (!on && t.role === "admin") {
    const n = Number((await q1<{ n: string }>("SELECT count(*) n FROM users WHERE role='admin' AND active"))!.n);
    if (n <= 1) go("/admin/users", "e", "Это последний активный администратор");
  }
  await q("UPDATE users SET active=$2 WHERE id::text=$1", [t.id, on]);
  if (!on) await q("DELETE FROM sessions WHERE user_id::text=$1", [t.id]);
  await audit(u, on ? "Пользователь разблокирован" : "Пользователь заблокирован", "user", t.email);
  go("/admin/users", "ok", on ? "Доступ возвращён" : "Доступ закрыт. Записи и история сохранены.");
}

export async function reset2faAction(fd: FormData) {
  const u = await requireCan("users", "write");
  const t = await target(u, f(fd, "id"));
  await q("UPDATE users SET totp_on=false, totp_secret=NULL WHERE id::text=$1", [t.id]);
  await q("DELETE FROM sessions WHERE user_id::text=$1", [t.id]);
  await audit(u, "Сброшена 2FA", "user", t.email);
  go("/admin/users", "ok", "2FA сброшена, при следующем входе её нужно подключить заново");
}

/** Главная: какие машины показываются первыми и в каком порядке. Приходит список slug по порядку. */
export async function saveHomeFleetAction(fd: FormData) {
  const u = await requireCan("catalog", "write");
  const order = String(fd.get("order") ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  const known = new Set(BASE_FLEET.map((c) => c.slug));
  const slugs = order.filter((s, i) => known.has(s) && order.indexOf(s) === i);
  const before = await q<{ slug: string; data: Record<string, unknown> }>("SELECT slug, data FROM fleet_overrides");
  const cur = new Map(before.map((r) => [r.slug, r.data]));
  for (const c of BASE_FLEET) {
    const pos = slugs.indexOf(c.slug) + 1; // 0 — не на главной
    const o = (cur.get(c.slug) ?? {}) as Parameters<typeof savePatch>[1];
    await savePatch(c.slug, { ...c, ...o, featured: pos }, u.email);
  }
  await bust();
  await audit(u, "Порядок машин на главной изменён", "fleet", "home", null, { order: slugs });
  go("/admin/catalog#home", "ok", `На главной: ${slugs.length} машин`);
}

// ───────────── отзывы ─────────────

const REVIEW_SOURCES = ["Яндекс.Карты", "2GIS", "Flamp", "Yell"];
const cleanUrl = (s: string) => (/^https?:\/\/[^\s]+$/i.test(s) && s.length < 500 ? s : "");

async function reviewsBust() {
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/", "layout");
}

/** Кнопки у отзыва: publish / ignore / unpublish / restore (по id) и hide / show (по ключу — для отзывов из файла сайта) */
export async function reviewAction(fd: FormData) {
  const u = await requireCan("reviews", "write");
  const op = f(fd, "op");
  const id = f(fd, "id");
  const key = f(fd, "key");
  if (op === "hide") {
    const name = f(fd, "name").slice(0, 200), text = f(fd, "text").slice(0, 5000), source = f(fd, "source").slice(0, 60);
    if (!key || !text) go("/admin/reviews", "e", "Не хватает данных отзыва");
    await q("INSERT INTO reviews (key, source, name, date_text, text, url, status, origin, updated_by) VALUES ($1,$2,$3,$4,$5,$6,'hidden','file',$7) ON CONFLICT (key) DO UPDATE SET status='hidden', updated_by=$7", [key, source, name, f(fd, "date").slice(0, 60), text, cleanUrl(f(fd, "url")), u.email]);
    await audit(u, "Отзыв скрыт с сайта", "review", key);
  } else if (op === "show") {
    await q("DELETE FROM reviews WHERE key=$1 AND origin='file'", [key]);
    await audit(u, "Отзыв возвращён на сайт", "review", key);
  } else if (id && /^\d+$/.test(id)) {
    const st = op === "publish" ? "published" : op === "ignore" ? "ignored" : op === "unpublish" ? "ignored" : op === "restore" ? "new" : "";
    if (!st) go("/admin/reviews", "e", "Неизвестное действие");
    await q("UPDATE reviews SET status=$2, published_at=CASE WHEN $2='published' THEN now() ELSE published_at END, updated_by=$3 WHERE id=$1", [id, st, u.email]);
    await audit(u, `Отзыв: ${op}`, "review", id);
  } else if (op === "delete" && id) {
    go("/admin/reviews", "e", "Удаление не поддерживается: используйте «Игнорировать»");
  }
  await reviewsBust();
  go("/admin/reviews", "ok", op === "publish" ? "Отзыв опубликован: он первый в своём источнике" : "Готово");
}

/** Добавить отзыв руками (скопировать с Яндекса, 2ГИС и т.д.) — сразу на сайт или в очередь */
export async function addReviewAction(fd: FormData) {
  const u = await requireCan("reviews", "write");
  const source = f(fd, "source");
  const name = f(fd, "name").slice(0, 120);
  const text = f(fd, "text").slice(0, 5000);
  if (!REVIEW_SOURCES.includes(source) || !name || text.length < 3) go("/admin/reviews", "e", "Укажите источник, имя и текст отзыва");
  const date = f(fd, "date").slice(0, 60);
  const key = reviewKey({ source, name, date, text });
  const publish = f(fd, "publish") === "1";
  await q("INSERT INTO reviews (key, source, name, date_text, text, url, status, origin, published_at, updated_by) VALUES ($1,$2,$3,$4,$5,$6,$7,'manual',$8,$9) ON CONFLICT (key) DO NOTHING", [key, source, name, date, text, cleanUrl(f(fd, "url")), publish ? "published" : "new", publish ? new Date() : null, u.email]);
  await audit(u, publish ? "Отзыв добавлен и опубликован" : "Отзыв добавлен в очередь", "review", key);
  await reviewsBust();
  go("/admin/reviews", "ok", publish ? "Отзыв добавлен и показан на сайте" : "Отзыв добавлен в «Новые»");
}
