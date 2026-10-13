// Вход в админку: пароль → код из приложения (2FA) → сессия. Сессия — случайный токен в cookie, в базе лежит только его хэш.
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { dbEnabled, q, q1 } from "../db";
import { sha256, token, verifyPassword } from "./crypto";
import { can, isRole, type Role, type Section } from "./roles";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  totpOn: boolean;
  totpSecret: string | null;
}
export interface Session { user: AdminUser; stage: "pw" | "full"; hash: string }

const COOKIE = "cc_admin";
const FULL_MS = 12 * 3600_000;
const PW_MS = 10 * 60_000;
export const twoFaRequired = () => process.env.ADMIN_2FA !== "off";

export async function ipOf() {
  const h = await headers();
  return (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "—";
}

export async function startSession(userId: string, stage: "pw" | "full") {
  const t = token();
  const h = await headers();
  await q("INSERT INTO sessions (token_hash, user_id, stage, expires_at, ip, ua) VALUES ($1,$2,$3,$4,$5,$6)", [
    sha256(t), userId, stage, new Date(Date.now() + (stage === "full" ? FULL_MS : PW_MS)), await ipOf(), (h.get("user-agent") || "").slice(0, 200),
  ]);
  (await cookies()).set(COOKIE, t, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: Math.floor((stage === "full" ? FULL_MS : PW_MS) / 1000),
  });
}

export async function endSession() {
  const jar = await cookies();
  const t = jar.get(COOKIE)?.value;
  if (t) await q("DELETE FROM sessions WHERE token_hash=$1", [sha256(t)]).catch(() => {});
  jar.delete({ name: COOKIE, path: "/admin" });
}

export async function getSession(): Promise<Session | null> {
  if (!dbEnabled()) return null;
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return null;
  const hash = sha256(t);
  const r = await q1<{ stage: string; id: string; email: string; name: string; role: string; totp_on: boolean; totp_secret: string | null }>(
    `SELECT s.stage, u.id, u.email, u.name, u.role, u.totp_on, u.totp_secret
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash=$1 AND s.expires_at > now() AND u.active`,
    [hash],
  );
  if (!r || !isRole(r.role)) return null;
  return { hash, stage: r.stage === "full" ? "full" : "pw", user: { id: r.id, email: r.email, name: r.name, role: r.role, totpOn: r.totp_on, totpSecret: r.totp_secret } };
}

/**
 * Страница или действие только для вошедших. section/need — право из таблицы ролей.
 * Без права — на дашборд (для страниц) или ошибка (для действий через need).
 */
export async function requireUser(opts: { section?: Section; need?: "read" | "write"; allowNoTotp?: boolean } = {}) {
  const s = await getSession();
  if (!s || s.stage !== "full") redirect("/admin/login");
  if (!s.user.totpOn && twoFaRequired() && !opts.allowNoTotp) redirect("/admin/security?enroll=1");
  if (opts.section && !can(s.user.role, opts.section, opts.need ?? "read")) redirect("/admin?denied=1");
  return s.user;
}

/** Для server actions: без права — исключение, а не редирект, чтобы действие точно не выполнилось */
export async function requireCan(section: Section, need: "read" | "write" = "write") {
  const s = await getSession();
  if (!s || s.stage !== "full") throw new Error("Нужно войти");
  if (!s.user.totpOn && twoFaRequired()) throw new Error("Сначала включите 2FA");
  if (!can(s.user.role, section, need)) throw new Error("Недостаточно прав");
  return s.user;
}

// Защита от перебора: не больше 8 неудачных попыток за 15 минут на адрес почты и на IP
export async function loginBlocked(email: string) {
  const ip = await ipOf();
  const r = await q<{ n: string }>("SELECT count(*) n FROM login_attempts WHERE key = ANY($1) AND at > now() - interval '15 minutes' GROUP BY key", [[`e:${email}`, `i:${ip}`]]);
  return r.some((x) => Number(x.n) >= 8);
}
export async function loginFailed(email: string) {
  const ip = await ipOf();
  await q("INSERT INTO login_attempts (key) VALUES ($1), ($2)", [`e:${email}`, `i:${ip}`]);
}
export async function loginOk(email: string, userId: string) {
  await q("DELETE FROM login_attempts WHERE key=$1", [`e:${email}`]);
  await q("UPDATE users SET last_login=now() WHERE id=$1", [userId]);
  await q("DELETE FROM sessions WHERE expires_at < now()").catch(() => {});
}

export async function checkPassword(email: string, password: string) {
  const u = await q1<{ id: string; pass_hash: string | null; active: boolean }>("SELECT id, pass_hash, active FROM users WHERE lower(email)=lower($1)", [email.trim()]);
  const ok = verifyPassword(password, u?.pass_hash);
  return ok && u?.active ? u.id : null;
}

export async function audit(user: Pick<AdminUser, "id" | "email" | "role"> | null, action: string, entity?: string, entityId?: string, before?: unknown, after?: unknown) {
  await q("INSERT INTO audit (user_id, user_email, role, action, entity, entity_id, before, after, ip) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)", [
    user?.id ?? null, user?.email ?? null, user?.role ?? null, action, entity ?? null, entityId ?? null,
    before === undefined ? null : JSON.stringify(before), after === undefined ? null : JSON.stringify(after), await ipOf(),
  ]).catch((e) => console.error("audit:", e.message));
}
