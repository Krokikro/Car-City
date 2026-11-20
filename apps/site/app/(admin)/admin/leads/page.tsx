import Link from "next/link";
import { Shell } from "@/components/admin/Shell";
import { requireUser } from "@/lib/admin/auth";
import { LEAD_STATUSES, LEAD_STATUS_NAME } from "@/lib/admin/roles";
import { q } from "@/lib/db";
import { fmt } from "@/lib/admin/format";
import { LANG_NAMES, ORIGIN_NAMES, PERIODS, backfillLeads, listLeads, type LeadFilter } from "@/lib/admin/leads";
import { MODE_LABELS } from "@/lib/lead/types";
import { SOURCE_GROUPS } from "@/lib/lead/source";

export const dynamic = "force-dynamic";
export const metadata = { title: "Заявки" };

type SP = LeadFilter & { e?: string; ok?: string; page?: string };

export default async function Leads({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const user = await requireUser({ section: "leads" });
  await backfillLeads(200).catch(() => 0);
  const page = Math.max(1, Number(sp.page) || 1);
  const SIZE = 50;
  const f: LeadFilter = { ...sp, period: sp.period ?? (sp.from || sp.to ? "custom" : "all") };
  if (f.period === "all") { f.period = undefined; }
  const { total, rows } = await listLeads(user, f, SIZE, (page - 1) * SIZE);
  const channels = (await q<{ channel: string }>("SELECT DISTINCT channel FROM leads WHERE channel IS NOT NULL ORDER BY 1")).map((r) => r.channel);
  const cities = (await q<{ city: string }>("SELECT city FROM leads WHERE city IS NOT NULL GROUP BY 1 ORDER BY count(*) DESC LIMIT 40")).map((r) => r.city);
  const keep = Object.fromEntries(Object.entries(sp).filter(([k, v]) => v && !["e", "ok", "page"].includes(k))) as Record<string, string>;
  const qs = (o: Record<string, string | undefined>) => "?" + new URLSearchParams(Object.entries({ ...keep, ...o }).filter(([, v]) => v) as [string, string][]).toString();
  const exp = (format: string, kind = "list") => `/admin/api/leads/export${qs({ format, kind })}`;
  const per = sp.period ?? (sp.from || sp.to ? "custom" : "all");

  return (
    <Shell user={user} active="leads" title="Заявки" sub={`По фильтру: ${total}`} flash={sp}
      actions={<>
        <Link className="pnl-btn" href={`/admin/leads/report${qs({ page: undefined })}`}>Отчёт</Link>
        <details className="pnl-menu"><summary className="pnl-btn">Скачать ▾</summary>
          <div><a href={exp("xlsx")}>Excel (.xlsx)</a><a href={exp("csv")}>CSV для Excel</a><a href={exp("json")}>JSON</a></div>
        </details>
      </>}>
      <div className="pnl-tabs pnl-tabs-line">
        <Link href={qs({ status: undefined, page: undefined })} className={!sp.status ? "on" : ""}>Все</Link>
        {LEAD_STATUSES.map((s) => <Link key={s.id} href={qs({ status: s.id, page: undefined })} className={sp.status === s.id ? "on" : ""}>{s.name}</Link>)}
      </div>
      <form className="pnl-card pnl-filters" action="/admin/leads">
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <label>Период<select name="period" defaultValue={per}>{PERIODS.map(([k, n]) => <option key={k} value={k}>{n}</option>)}<option value="custom">Свои даты</option></select></label>
        <label>С<input type="date" name="from" defaultValue={sp.from} /></label>
        <label>По<input type="date" name="to" defaultValue={sp.to} /></label>
        <label>Группа источников<select name="group" defaultValue={sp.group ?? ""}><option value="">Все</option>{SOURCE_GROUPS.map((g) => <option key={g}>{g}</option>)}</select></label>
        <label>Источник<select name="channel" defaultValue={sp.channel ?? ""}><option value="">Все</option>{channels.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Откуда<select name="origin" defaultValue={sp.origin ?? ""}><option value="">Все</option>{Object.entries(ORIGIN_NAMES).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
        <label>Версия сайта<select name="lang" defaultValue={sp.lang ?? ""}><option value="">Все</option>{Object.entries(LANG_NAMES).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
        <label>Город<select name="city" defaultValue={sp.city ?? ""}><option value="">Все</option>{cities.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="pnl-grow">Поиск<input name="q" placeholder="Имя, телефон, номер, комментарий" defaultValue={sp.q} maxLength={100} /></label>
        <label className="pnl-check"><input type="checkbox" name="mine" value="1" defaultChecked={Boolean(sp.mine)} /> Только мои</label>
        <div className="pnl-filter-btns"><button className="pnl-btn pnl-btn-main" type="submit">Показать</button><Link className="pnl-btn" href="/admin/leads">Сбросить</Link></div>
      </form>
      <div className="pnl-table-wrap">
        <table className="pnl-table">
          <thead><tr><th>Когда</th><th>Клиент</th><th>Что хотел</th><th>Источник</th><th>Город · версия</th><th>Статус</th><th>Ответственный</th></tr></thead>
          <tbody>
            {rows.map((l) => {
              const a = l.data.attr;
              return (
                <tr key={l.id}>
                  <td className="pnl-nowrap">{fmt(l.at)}<br /><span className="pnl-muted">№ {l.id}</span></td>
                  <td><Link href={`/admin/leads/${l.id}`}><b>{l.data.name || "Без имени"}</b></Link><br /><span className="pnl-muted">{l.data.phone || ORIGIN_NAMES[l.origin]}</span></td>
                  <td>{[l.data.extra?.model, l.data.extra?.mode ? MODE_LABELS[l.data.extra.mode] ?? l.data.extra.mode : "", l.data.extra?.cls].filter(Boolean).join(", ") || (l.data.extra?.message ? <span className="pnl-muted">«{l.data.extra.message.slice(0, 60)}»</span> : "—")}<br /><span className="pnl-muted">{ORIGIN_NAMES[l.origin] ?? l.origin}</span></td>
                  <td><b>{l.channel ?? "—"}</b>{a?.campaign && <><br /><span className="pnl-muted">{a.campaign}</span></>}{a?.term && <><br /><span className="pnl-muted">«{a.term}»</span></>}</td>
                  <td>{l.city ?? <span className="pnl-muted">—</span>}<br /><span className="pnl-muted">{LANG_NAMES[l.lang ?? "ru"] ?? l.lang}</span></td>
                  <td><em className={`st st-${l.status}`}>{LEAD_STATUS_NAME[l.status]}</em></td>
                  <td>{l.assignee_name ?? <span className="pnl-muted">не назначен</span>}</td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={7} className="pnl-muted">Заявок по фильтру нет. Здесь появляются обращения из форм и чата на сайте и из мессенджеров.</td></tr>}
          </tbody>
        </table>
      </div>
      {total > SIZE && (
        <p className="pnl-pager">
          {page > 1 && <Link href={qs({ page: String(page - 1) })}>← Новее</Link>}
          <span>{(page - 1) * SIZE + 1}–{Math.min(page * SIZE, total)} из {total}</span>
          {page * SIZE < total && <Link href={qs({ page: String(page + 1) })}>Старее →</Link>}
        </p>
      )}
    </Shell>
  );
}
