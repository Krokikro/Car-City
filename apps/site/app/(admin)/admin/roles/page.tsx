import Link from "next/link";
import { Shell } from "@/components/admin/Shell";
import { requireUser } from "@/lib/admin/auth";
import { can, LEVEL_NAMES, SCOPE_NAMES, SECTION_HINTS, SECTION_NAMES, SECTIONS, type Level, type LeadScope } from "@/lib/admin/roles";
import { listRoles } from "@/lib/admin/store";
import { createRoleAction, deleteRoleAction, saveRolesAction } from "../actions-site";
import { LIM } from "@/lib/admin/limits";

export const dynamic = "force-dynamic";
export const metadata = { title: "Роли и права" };

const LEVELS: Level[] = ["none", "read", "write"];

export default async function Roles({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser({ section: "roles" });
  const write = can(user, "roles", "write");
  const roles = await listRoles();
  const editable = roles.filter((r) => r.id !== "admin");
  return (
    <Shell user={user} active="roles" title="Роли и права" sub="Для каждой роли — доступ к каждому разделу: нет доступа, просмотр или полный. Права проверяются на сервере при каждом действии."
      flash={sp} actions={can(user, "users", "read") ? <Link className="pnl-btn" href="/admin/users">Пользователи →</Link> : undefined}>
      <form action={saveRolesAction}>
        <input type="hidden" name="ids" value={editable.map((r) => r.id).join(",")} />
        <fieldset disabled={!write} className="pnl-plain">
          <div className="pnl-table-wrap">
            <table className="pnl-table pnl-matrix pnl-perm">
              <thead>
                <tr>
                  <th>Раздел</th>
                  {roles.map((r) => (
                    <th key={r.id} id={`role-${r.id}`}>
                      {r.id === "admin" ? <b>{r.name}</b> : <input name={`${r.id}:name`} maxLength={LIM.roleName} defaultValue={r.name} aria-label="Название роли" className="pnl-role-name" />}
                      <small className="pnl-muted">{r.id} · {r.users} чел.</small>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SECTIONS.map((s) => (
                  <tr key={s}>
                    <td><b>{SECTION_NAMES[s]}</b>{SECTION_HINTS[s] && <><br /><span className="pnl-muted">{SECTION_HINTS[s]}</span></>}</td>
                    {roles.map((r) => (
                      <td key={r.id} className={`lv-${r.perms[s]}`}>
                        {r.id === "admin" ? LEVEL_NAMES.write : (
                          <select name={`${r.id}:${s}`} defaultValue={r.perms[s]} aria-label={`${r.name}: ${SECTION_NAMES[s]}`} className={`pnl-lv lv-${r.perms[s]}`}>
                            {LEVELS.map((l) => <option key={l} value={l}>{LEVEL_NAMES[l]}</option>)}
                          </select>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td><b>Какие заявки видит</b><br /><span className="pnl-muted">если есть доступ к заявкам</span></td>
                  {roles.map((r) => (
                    <td key={r.id}>
                      {r.id === "admin" ? SCOPE_NAMES.all : (
                        <select name={`${r.id}:scope`} defaultValue={r.leadScope} aria-label={`${r.name}: заявки`}>
                          {(Object.keys(SCOPE_NAMES) as LeadScope[]).map((k) => <option key={k} value={k}>{SCOPE_NAMES[k]}</option>)}
                        </select>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          {write && <p className="pnl-tools-row"><button className="pnl-btn pnl-btn-main" type="submit">Сохранить права</button><span className="pnl-muted">Администратор всегда имеет полный доступ. После сохранения сотрудники с изменёнными ролями входят заново.</span></p>}
        </fieldset>
      </form>

      {write && (
        <div className="pnl-cols">
          <section className="pnl-card">
            <h2>Новая роль</h2>
            <form action={createRoleAction} className="pnl-form pnl-narrow">
              <label>Название<input name="name" required maxLength={LIM.roleName} placeholder="Например, Редактор" /></label>
              <label>Код<input name="id" required maxLength={LIM.roleId} pattern="[a-z][a-z0-9_\-]{1,30}" placeholder="editor" /><small>Латиница, для системы</small></label>
              <label>Взять права у роли<select name="copy" defaultValue=""><option value="">— с нуля —</option>{editable.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
              <button className="pnl-btn pnl-btn-main" type="submit">Создать роль</button>
            </form>
          </section>
          <section className="pnl-card">
            <h2>Удалить роль</h2>
            <p className="pnl-muted">Удалить можно добавленную роль без сотрудников. Основные роли (менеджер, SEO-специалист, маркетолог, копирайтер) можно только перенастроить.</p>
            <ul className="pnl-list">
              {editable.filter((r) => !r.system).map((r) => (
                <li key={r.id}>
                  <span><b>{r.name}</b> <code>{r.id}</code> · {r.users} чел.</span>
                  <form action={deleteRoleAction}><input type="hidden" name="id" value={r.id} /><button className="pnl-btn pnl-btn-sm pnl-btn-warn" type="submit" disabled={r.users > 0}>Удалить</button></form>
                </li>
              ))}
              {editable.every((r) => r.system) && <li className="pnl-muted">Добавленных ролей нет</li>}
            </ul>
          </section>
        </div>
      )}
    </Shell>
  );
}
