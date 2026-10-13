import Link from "next/link";
import { Shell } from "@/components/admin/Shell";
import { requireUser } from "@/lib/admin/auth";
import { LEAD_STATUSES, LEAD_STATUS_NAME } from "@/lib/admin/roles";
import { q } from "@/lib/db";
import { fmt } from "@/lib/admin/format";
import { leadScope } from "@/lib/admin/scope";

export const dynamic = "force-dynamic";
export const metadata = { title: "Заявки" };

interface Row { id: string; at: string; data: { name: string; phone: string; source: string; flags?: string[]; extra?: Record<string, string>; first?: { utm_source?: string; utm_campaign?: string } }; status: string; assignee: string | null; assignee_name: string | null }

export default async function Leads({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string; status?: string; q?: string; mine?: string; page?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser({ section: "leads" });
  const sc = leadScope(user);
  const params: unknown[] = [...sc.params];
  const where = [sc.sql];
  if (sp.status && LEAD_STATUSES.some((s) => s.id === sp.status)) { params.push(sp.status); where.push(`l.status = $${params.length}`); }
  if (sp.mine) { params.push(user.id); where.push(`l.assignee::text = $${params.length}`); }
  if (sp.q) { params.push(`%${sp.q.trim()}%`); where.push(`(l.data->>'name' ILIKE $${params.length} OR l.data->>'phone' ILIKE $${params.length} OR l.id ILIKE $${params.length})`); }
  const page = Math.max(1, Number(sp.page) || 1);
  const SIZE = 50;
  const w = where.join(" AND ").replace(/\bassignee\b/g, "l.assignee").replace(/l\.l\./g, "l.");
  const total = Number((await q<{ n: string }>(`SELECT count(*) n FROM leads l WHERE ${w}`, params))[0].n);
  const rows = await q<Row>(
    `SELECT l.id, l.at, l.data, l.status, l.assignee::text, u.name assignee_name FROM leads l LEFT JOIN users u ON u.id = l.assignee WHERE ${w} ORDER BY l.at DESC LIMIT ${SIZE} OFFSET ${(page - 1) * SIZE}`, params,
  );
  const qs = (o: Record<string, string | undefined>) => "?" + new URLSearchParams(Object.entries({ ...sp, e: undefined, ok: undefined, ...o }).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <Shell user={user} active="leads" title="Заявки" sub={user.role === "manager" ? "Заявки, назначенные на вас" : user.role === "callcenter" ? "Ваши и нераспределённые заявки" : `Всего по фильтру: ${total}`} flash={sp}>
      <div className="ad-tools">
        <div className="ad-tabs">
          <Link href={qs({ status: undefined })} className={!sp.status ? "on" : ""}>Все</Link>
          {LEAD_STATUSES.map((s) => <Link key={s.id} href={qs({ status: s.id, page: undefined })} className={sp.status === s.id ? "on" : ""}>{s.name}</Link>)}
        </div>
        <form className="ad-filter" action="/admin/leads">
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <input name="q" placeholder="Имя, телефон или номер" defaultValue={sp.q} />
          <label className="ad-check"><input type="checkbox" name="mine" value="1" defaultChecked={Boolean(sp.mine)} /> Только мои</label>
          <button className="ad-btn" type="submit">Найти</button>
        </form>
      </div>
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead><tr><th>Когда</th><th>Клиент</th><th>Что хотел</th><th>Откуда</th><th>Статус</th><th>Ответственный</th></tr></thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id}>
                <td>{fmt(l.at)}</td>
                <td><Link href={`/admin/leads/${l.id}`}><b>{l.data.name}</b></Link><br /><span className="ad-muted">{l.data.phone}</span></td>
                <td>{[l.data.extra?.model, l.data.extra?.mode === "buyout" ? "выкуп" : l.data.extra?.mode === "rent" ? "аренда" : "", l.data.extra?.cls].filter(Boolean).join(", ") || "—"}</td>
                <td>{l.data.first?.utm_source || l.data.source}</td>
                <td><em className={`st st-${l.status}`}>{LEAD_STATUS_NAME[l.status]}</em></td>
                <td>{l.assignee_name ?? <span className="ad-muted">не назначен</span>}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="ad-muted">Заявок нет. Здесь появятся обращения из форм на сайте.</td></tr>}
          </tbody>
        </table>
      </div>
      {total > SIZE && (
        <p className="ad-pager">
          {page > 1 && <Link href={qs({ page: String(page - 1) })}>← Новее</Link>}
          <span>{(page - 1) * SIZE + 1}–{Math.min(page * SIZE, total)} из {total}</span>
          {page * SIZE < total && <Link href={qs({ page: String(page + 1) })}>Старее →</Link>}
        </p>
      )}
    </Shell>
  );
}
