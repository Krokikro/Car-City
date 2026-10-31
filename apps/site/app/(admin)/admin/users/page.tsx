import Link from "next/link";
import { cookies } from "next/headers";
import { Shell } from "@/components/admin/Shell";
import { CopyButton } from "@/components/admin/MediaUploader";
import { requireUser } from "@/lib/admin/auth";
import { can } from "@/lib/admin/roles";
import { listRoles } from "@/lib/admin/store";
import { q } from "@/lib/db";
import { fmt } from "@/lib/admin/format";
import { createUserAction, reinviteAction, reset2faAction, resetPasswordAction, setRoleAction, toggleActiveAction, updateUserAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Пользователи" };

export default async function Users({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string; link?: string; for?: string; pw?: string; edit?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser({ section: "users" });
  const write = can(user, "users", "write");
  const isAdmin = user.role === "admin";
  const list = await q<{ id: string; login: string | null; email: string | null; name: string; role: string; active: boolean; totp_on: boolean; pass_hash: string | null; must_change: boolean; last_login: string | null; invite_until: string | null; created_at: string }>(
    "SELECT id::text, login, email, name, role, active, totp_on, pass_hash, must_change, last_login, invite_until, created_at FROM users ORDER BY active DESC, created_at",
  );
  const roles = await listRoles();
  const roleName = new Map(roles.map((r) => [r.id, r.name]));
  const assignable = roles.filter((r) => isAdmin || r.id !== "admin");
  let shown: { login: string; pw: string } | null = null;
  if (sp.pw && write) { try { shown = JSON.parse((await cookies()).get("cc_newpw")?.value ?? "null"); } catch { shown = null; } }
  return (
    <Shell user={user} active="users" title="Пользователи" sub="У каждого сотрудника свой логин и пароль. Доступ отключают, а не удаляют: история действий сохраняется." flash={sp}
      actions={can(user, "roles", "read") ? <Link className="ad-btn" href="/admin/roles">Роли и права →</Link> : undefined}>
      {shown && (
        <section className="ad-card ad-invite">
          <h2>Пароль для {shown.login}</h2>
          <p>Передайте логин и пароль сотруднику лично или в мессенджере. Пароль виден 2 минуты; при первом входе сотрудник сменит его на свой.</p>
          <p className="ad-linkbox"><code>Логин: {shown.login}</code> <code>Пароль: {shown.pw}</code> <CopyButton text={`Админка Car City\nЛогин: ${shown.login}\nПароль: ${shown.pw}`} label="Копировать" /></p>
        </section>
      )}
      {sp.link && sp.link.startsWith("http") && (
        <section className="ad-card ad-invite">
          <h2>Ссылка для {sp.for}</h2>
          <p>По ссылке сотрудник сам задаст пароль. Действует 72 часа и срабатывает один раз.</p>
          <p className="ad-linkbox"><code>{sp.link}</code> <CopyButton text={sp.link} label="Копировать ссылку" /></p>
        </section>
      )}
      {write && (
        <section className="ad-card">
          <h2>Добавить сотрудника</h2>
          <form action={createUserAction} className="ad-form ad-user-form" autoComplete="off">
            <label>Имя<input name="name" placeholder="Иван Петров" /></label>
            <label>Логин<input name="login" required pattern="[A-Za-z0-9._@\-]{3,60}" placeholder="ivan.petrov" autoCapitalize="none" spellCheck={false} /><small>Латиница, цифры, точка, дефис</small></label>
            <label>Почта <span className="ad-muted">(необязательно)</span><input name="email" type="email" placeholder="ivan@car-city.pro" /></label>
            <label>Роль<select name="role" defaultValue="manager">{assignable.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
            <label>Пароль<input name="password" type="text" minLength={10} placeholder="пусто — придумаем сами" autoComplete="new-password" /><small>От 10 символов, буквы и цифры</small></label>
            <label className="ad-check"><input type="checkbox" name="must_change" defaultChecked /> Попросить сменить пароль при первом входе</label>
            <button className="ad-btn ad-btn-main" type="submit">Создать</button>
          </form>
        </section>
      )}
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead><tr><th>Сотрудник</th><th>Роль</th><th>Состояние</th><th>Последний вход</th><th></th></tr></thead>
          <tbody>
            {list.map((u) => {
              const mine = u.id === user.id;
              const locked = u.role === "admin" && !isAdmin;
              const editing = sp.edit === u.id;
              const login = u.login || u.email || "";
              return (
                <tr key={u.id} className={u.active ? "" : "is-off"} id={`u-${u.id}`}>
                  <td>
                    {editing && write && !locked ? (
                      <form action={updateUserAction} className="ad-form ad-user-edit">
                        <input type="hidden" name="id" value={u.id} />
                        <input name="name" defaultValue={u.name} aria-label="Имя" placeholder="Имя" />
                        <input name="login" defaultValue={login} aria-label="Логин" required />
                        <input name="email" type="email" defaultValue={u.email ?? ""} aria-label="Почта" placeholder="почта (необязательно)" />
                        <span className="ad-tools-row"><button className="ad-btn ad-btn-sm ad-btn-main" type="submit">Сохранить</button><Link className="ad-btn ad-btn-sm" href="/admin/users">Отмена</Link></span>
                      </form>
                    ) : (
                      <><b>{u.name}</b><br /><code>{login}</code>{u.email && u.email !== login && <span className="ad-muted"> · {u.email}</span>}</>
                    )}
                  </td>
                  <td>
                    {mine || locked || !write ? roleName.get(u.role) ?? u.role : (
                      <form action={setRoleAction} className="ad-inline">
                        <input type="hidden" name="id" value={u.id} />
                        <select name="role" defaultValue={u.role} aria-label="Роль">{assignable.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
                        <button className="ad-btn ad-btn-sm" type="submit">Сменить</button>
                      </form>
                    )}
                    {!roleName.has(u.role) && <em className="st st-lost">роль удалена</em>}
                  </td>
                  <td>
                    {!u.active ? <em className="st st-lost">Отключён</em>
                      : !u.pass_hash ? <em className="st st-call">Ждёт пароль{u.invite_until ? ` до ${fmt(u.invite_until)}` : ""}</em>
                      : u.must_change ? <em className="st st-call">Временный пароль</em>
                      : u.totp_on ? <em className="st st-issued">Активен · 2FA</em>
                      : <em className="st st-new">Активен</em>}
                  </td>
                  <td className="ad-muted">{u.last_login ? fmt(u.last_login) : "не входил"}</td>
                  <td className="ad-actions-cell">
                    {!mine && !locked && write && (
                      <>
                        {!editing && <Link className="ad-btn ad-btn-sm" href={`/admin/users?edit=${u.id}#u-${u.id}`}>Изменить</Link>}
                        <form action={resetPasswordAction}><input type="hidden" name="id" value={u.id} /><button className="ad-btn ad-btn-sm" type="submit" title="Сгенерировать новый пароль и закрыть все сеансы">Новый пароль</button></form>
                        <form action={reinviteAction}><input type="hidden" name="id" value={u.id} /><button className="ad-btn ad-btn-sm" type="submit" title="Ссылка, по которой сотрудник сам задаст пароль">Ссылка</button></form>
                        {u.totp_on && <form action={reset2faAction}><input type="hidden" name="id" value={u.id} /><button className="ad-btn ad-btn-sm" type="submit">Сбросить 2FA</button></form>}
                        <form action={toggleActiveAction}><input type="hidden" name="id" value={u.id} /><button className={`ad-btn ad-btn-sm${u.active ? " ad-btn-warn" : " ad-btn-main"}`} type="submit">{u.active ? "Отключить" : "Включить"}</button></form>
                      </>
                    )}
                    {mine && <span className="ad-muted">это вы</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="ad-muted">Отключённый сотрудник сразу выходит со всех устройств и не может войти. Включить доступ обратно можно в любой момент.</p>
    </Shell>
  );
}
