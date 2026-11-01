import Link from "next/link";
import { Shell } from "@/components/admin/Shell";
import { requireUser } from "@/lib/admin/auth";
import { LEAD_STATUS_NAME } from "@/lib/admin/roles";
import { LANG_NAMES, ORIGIN_NAMES, PERIODS, backfillLeads, leadReport, periodRange, type Bucket, type LeadFilter } from "@/lib/admin/leads";

export const dynamic = "force-dynamic";
export const metadata = { title: "Отчёт по заявкам" };

const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 1000) / 10}%` : "—");

function Table({ title, rows, total, label, map }: { title: string; rows: Bucket[]; total: number; label: string; map?: (k: string) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <section className="pnl-card">
      <h2>{title}</h2>
      {rows.length === 0 ? <p className="pnl-muted">Нет данных за период.</p> : (
        <table className="pnl-table pnl-rep">
          <thead><tr><th>{label}</th><th>Заявок</th><th>Доля</th><th>Выдано</th><th>Конверсия</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td><span className="pnl-barcell"><i style={{ width: `${(r.n / max) * 100}%` }} /><span>{map ? map(r.key) : r.key}</span></span></td>
                <td><b>{r.n}</b></td><td>{pct(r.n, total)}</td><td>{r.won}</td><td>{pct(r.won, r.n)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default async function Report({ searchParams }: { searchParams: Promise<LeadFilter & { e?: string; ok?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser({ section: "leads" });
  await backfillLeads(300).catch(() => 0);
  const per = sp.period ?? (sp.from || sp.to ? "custom" : "30d");
  const f: LeadFilter = { ...sp, period: per === "all" ? undefined : per };
  const r = await leadReport(user, f);
  const range = per === "custom" ? { from: sp.from, to: sp.to } : periodRange(per);
  const title = range.from || range.to ? `${range.from ?? "…"} — ${range.to ?? "…"}` : "всё время";
  const keep = Object.fromEntries(Object.entries({ ...sp, period: per }).filter(([k, v]) => v && !["e", "ok"].includes(k))) as Record<string, string>;
  const qs = (o: Record<string, string>) => "?" + new URLSearchParams({ ...keep, ...o }).toString();
  const maxDay = Math.max(1, ...r.byDay.map((d) => d.n));

  return (
    <Shell user={user} active="leads" title="Отчёт по заявкам" sub={`Период: ${title}. Источник — по последнему значимому переходу.`} back={["/admin/leads", "Заявки"]} flash={sp}
      actions={<details className="pnl-menu"><summary className="pnl-btn pnl-btn-main">Скачать отчёт ▾</summary>
        <div><a href={`/admin/api/leads/export${qs({ kind: "report", format: "xlsx" })}`}>Excel (.xlsx), по листам</a><a href={`/admin/api/leads/export${qs({ kind: "report", format: "csv" })}`}>CSV</a><a href={`/admin/api/leads/export${qs({ kind: "report", format: "json" })}`}>JSON</a><a href={`/admin/api/leads/export${qs({ kind: "list", format: "xlsx" })}`}>Все заявки периода (.xlsx)</a></div>
      </details>}>
      <div className="pnl-tabs pnl-tabs-line">
        {PERIODS.map(([k, n]) => <Link key={k} href={`?period=${k}`} className={per === k ? "on" : ""}>{n}</Link>)}
      </div>
      <form className="pnl-card pnl-filters" action="/admin/leads/report">
        <input type="hidden" name="period" value="custom" />
        <label>С<input type="date" name="from" defaultValue={range.from} /></label>
        <label>По<input type="date" name="to" defaultValue={range.to} /></label>
        <div className="pnl-filter-btns"><button className="pnl-btn" type="submit">Показать за даты</button></div>
      </form>
      <div className="pnl-stats">
        <div className="pnl-stat"><b>{r.total}</b><span>заявок</span></div>
        <div className="pnl-stat"><b>{r.days ? Math.round((r.total / r.days) * 10) / 10 : 0}</b><span>в среднем в день</span></div>
        <div className="pnl-stat"><b>{r.won}</b><span>выдано · {pct(r.won, r.total)}</span></div>
        <div className="pnl-stat"><b>{r.inWork}</b><span>в работе</span></div>
        <div className="pnl-stat"><b>{r.lost}</b><span>отказ · {pct(r.lost, r.total)}</span></div>
      </div>
      {r.byDay.length > 0 && (
        <section className="pnl-card">
          <h2>По дням</h2>
          <div className="pnl-chart" role="img" aria-label="Заявки по дням">
            {r.byDay.map((d) => <span key={d.key} title={`${d.key}: ${d.n}`} style={{ height: `${(d.n / maxDay) * 100}%` }}><i>{d.n}</i></span>)}
          </div>
          <div className="pnl-chart-x"><span>{r.byDay[0].key}</span><span>{r.byDay[r.byDay.length - 1].key}</span></div>
        </section>
      )}
      <div className="pnl-cols">
        <Table title="Группы источников" rows={r.byGroup} total={r.total} label="Группа" />
        <Table title="Источники" rows={r.byChannel} total={r.total} label="Источник" />
        <Table title="Кампании" rows={r.byCampaign} total={r.total} label="Источник · кампания" />
        <Table title="Города" rows={r.byCity} total={r.total} label="Город" />
        <Table title="Версии сайта" rows={r.byLang} total={r.total} label="Язык" map={(k) => LANG_NAMES[k] ?? k} />
        <Table title="Откуда заявка" rows={r.byOrigin} total={r.total} label="Откуда" map={(k) => ORIGIN_NAMES[k] ?? k} />
        <Table title="Статусы" rows={r.byStatus} total={r.total} label="Статус" map={(k) => LEAD_STATUS_NAME[k] ?? k} />
        <Table title="Модели" rows={r.byModel} total={r.total} label="Модель" />
      </div>
    </Shell>
  );
}
