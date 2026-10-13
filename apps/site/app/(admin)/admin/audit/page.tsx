import Link from "next/link";
import { Shell } from "@/components/admin/Shell";
import { requireUser } from "@/lib/admin/auth";
import { q } from "@/lib/db";
import { fmt } from "@/lib/admin/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Журнал действий" };

const ENT: Record<string, string> = { page: "Страница", car: "Автомобиль", lead: "Заявка", user: "Пользователь", media: "Файл" };

export default async function Audit({ searchParams }: { searchParams: Promise<{ q?: string; entity?: string; page?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser({ section: "audit" });
  const params: unknown[] = [];
  const where: string[] = ["TRUE"];
  if (sp.entity) { params.push(sp.entity); where.push(`entity = $${params.length}`); }
  if (sp.q) { params.push(`%${sp.q}%`); where.push(`(action ILIKE $${params.length} OR user_email ILIKE $${params.length} OR entity_id ILIKE $${params.length})`); }
  const page = Math.max(1, Number(sp.page) || 1);
  const SIZE = 100;
  const rows = await q<{ id: string; at: string; user_email: string | null; role: string | null; action: string; entity: string | null; entity_id: string | null; before: unknown; after: unknown; ip: string | null }>(
    `SELECT id::text, at, user_email, role, action, entity, entity_id, before, after, ip FROM audit WHERE ${where.join(" AND ")} ORDER BY at DESC LIMIT ${SIZE + 1} OFFSET ${(page - 1) * SIZE}`, params,
  );
  const more = rows.length > SIZE;
  const short = (v: unknown) => { const s = JSON.stringify(v, null, 1) ?? ""; return s.length > 1500 ? s.slice(0, 1500) + "…" : s; };
  const qs = (n: number) => `?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(sp.entity ? { entity: sp.entity } : {}), page: String(n) })}`;
  return (
    <Shell user={user} active="audit" title="Журнал действий" sub="Кто, что и когда менял. Записи нельзя править или удалять." >
      <form className="ad-filter" action="/admin/audit">
        <input name="q" placeholder="Действие, почта или объект" defaultValue={sp.q} />
        <select name="entity" defaultValue={sp.entity ?? ""}><option value="">Все объекты</option>{Object.entries(ENT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <button className="ad-btn" type="submit">Найти</button>
      </form>
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead><tr><th>Когда</th><th>Кто</th><th>Действие</th><th>Объект</th><th>IP</th></tr></thead>
          <tbody>
            {rows.slice(0, SIZE).map((a) => (
              <tr key={a.id}>
                <td>{fmt(a.at, true)}</td>
                <td>{a.user_email ?? "—"}{a.role ? <span className="ad-muted"> · {a.role}</span> : null}</td>
                <td>
                  <b>{a.action}</b>
                  {(a.before != null || a.after != null) && (
                    <details><summary>что изменилось</summary>
                      {a.before != null && <pre>{"Было: " + short(a.before)}</pre>}
                      {a.after != null && <pre>{"Стало: " + short(a.after)}</pre>}
                    </details>
                  )}
                </td>
                <td>{a.entity ? `${ENT[a.entity] ?? a.entity}` : ""}{a.entity_id ? <> <code>{a.entity_id.slice(0, 60)}</code></> : null}</td>
                <td className="ad-muted">{a.ip}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="ad-muted">Записей нет</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="ad-pager">{page > 1 && <Link href={qs(page - 1)}>← Новее</Link>}{more && <Link href={qs(page + 1)}>Старее →</Link>}</p>
    </Shell>
  );
}
