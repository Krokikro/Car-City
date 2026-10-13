import { Shell } from "@/components/admin/Shell";
import { CopyButton } from "@/components/admin/MediaUploader";
import { requireUser } from "@/lib/admin/auth";
import { can, LEVEL_NAMES, MATRIX_VIEW, ROLES, ROLE_NAMES, SECTIONS, SECTION_NAMES } from "@/lib/admin/roles";
import { q } from "@/lib/db";
import { fmt } from "@/lib/admin/format";
import { createUserAction, reinviteAction, reset2faAction, setRoleAction, toggleActiveAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Пользователи и роли" };

export default async function Users({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string; link?: string; for?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser({ section: "users" });
  const isAdmin = user.role === "admin";
  const list = await q<{ id: string; email: string; name: string; role: string; active: boolean; totp_on: boolean; pass_hash: string | null; last_login: string | null; invite_until: string | null }>(
    "SELECT id::text, email, name, role, active, totp_on, pass_hash, last_login, invite_until FROM users ORDER BY active DESC, created_at",
  );
  const roles = ROLES.filter((r) => isAdmin || r !== "admin");
  return (
    <Shell user={user} active="users" title="Пользователи и роли" sub="Доступ сотрудников. Пользователей не удаляют, а блокируют: история действий сохраняется." flash={sp}>
      {sp.link && sp.link.startsWith("http") && (
        <section className="ad-card ad-invite">
          <h2>Ссылка для {sp.for}</h2>
          <p>Отправьте её сотруднику любым удобным способом. Она действует 72 часа и сработает один раз. Позже эту ссылку увидеть уже нельзя.</p>
          <p className="ad-linkbox"><code>{sp.link}</code> <CopyButton text={sp.link} label="Копировать ссылку" /></p>
        </section>
      )}
      <section className="ad-card">
        <h2>Добавить сотрудника</h2>
        <form action={createUserAction} className="ad-inline-form">
          <input name="name" placeholder="Имя" aria-label="Имя" />
          <input name="email" type="email" placeholder="Почта" aria-label="Почта" required />
          <select name="role" aria-label="Роль" defaultValue="manager">{roles.map((r) => <option key={r} value={r}>{ROLE_NAMES[r]}</option>)}</select>
          <button className="ad-btn ad-btn-main" type="submit">Создать и получить ссылку</button>
        </form>
      </section>
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead><tr><th>Сотрудник</th><th>Роль</th><th>Защита</th><th>Последний вход</th><th></th></tr></thead>
          <tbody>
            {list.map((u) => {
              const mine = u.id === user.id;
              const locked = u.role === "admin" && !isAdmin;
              return (
                <tr key={u.id} className={u.active ? "" : "is-off"}>
                  <td><b>{u.name}</b><br /><span className="ad-muted">{u.email}</span></td>
                  <td>
                    {mine || locked ? ROLE_NAMES[u.role as keyof typeof ROLE_NAMES] : (
                      <form action={setRoleAction} className="ad-inline">
                        <input type="hidden" name="id" value={u.id} />
                        <select name="role" defaultValue={u.role} aria-label="Роль">{roles.map((r) => <option key={r} value={r}>{ROLE_NAMES[r]}</option>)}</select>
                        <button className="ad-btn ad-btn-sm" type="submit">Сменить</button>
                      </form>
                    )}
                  </td>
                  <td>
                    {!u.active ? <em className="st st-lost">Заблокирован</em> : !u.pass_hash ? <em className="st st-call">Ждёт приглашения{u.invite_until ? ` до ${fmt(u.invite_until)}` : ""}</em> : u.totp_on ? <em className="st st-issued">2FA включена</em> : <em className="st st-new">Без 2FA</em>}
                  </td>
                  <td className="ad-muted">{fmt(u.last_login)}</td>
                  <td className="ad-actions-cell">
                    {!mine && !locked && can(user.role, "users", "write") && (
                      <>
                        <form action={reinviteAction}><input type="hidden" name="id" value={u.id} /><button className="ad-btn ad-btn-sm" type="submit" title="Новая ссылка, чтобы задать пароль заново">Новая ссылка</button></form>
                        {u.totp_on && <form action={reset2faAction}><input type="hidden" name="id" value={u.id} /><button className="ad-btn ad-btn-sm" type="submit">Сбросить 2FA</button></form>}
                        <form action={toggleActiveAction}><input type="hidden" name="id" value={u.id} /><button className={`ad-btn ad-btn-sm${u.active ? " ad-btn-warn" : ""}`} type="submit">{u.active ? "Заблокировать" : "Разблокировать"}</button></form>
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
      <section className="ad-card">
        <h2>Что доступно ролям</h2>
        <div className="ad-table-wrap">
          <table className="ad-table ad-matrix">
            <thead><tr><th>Раздел</th>{ROLES.map((r) => <th key={r}>{ROLE_NAMES[r]}</th>)}</tr></thead>
            <tbody>
              {SECTIONS.map((s) => <tr key={s}><td>{SECTION_NAMES[s]}</td>{ROLES.map((r) => { const l = MATRIX_VIEW[r][s]; return <td key={r} className={`lv-${l}`}>{LEVEL_NAMES[l]}</td>; })}</tr>)}
            </tbody>
          </table>
        </div>
        <p className="ad-muted">Менеджер видит только свои заявки, колл-центр — свои и нераспределённые. Права проверяются на сервере при каждом действии.</p>
      </section>
    </Shell>
  );
}
