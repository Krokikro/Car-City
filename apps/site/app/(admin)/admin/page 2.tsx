import Link from "next/link";
import { Shell } from "@/components/admin/Shell";
import { requireUser } from "@/lib/admin/auth";
import { can, LEAD_STATUS_NAME, ROLE_NAMES } from "@/lib/admin/roles";
import { q, q1 } from "@/lib/db";
import { leadScope } from "@/lib/admin/scope";
import { fmt } from "@/lib/admin/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Обзор" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string; denied?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const sc = leadScope(user);
  const canLeads = can(user.role, "leads", "read");
  const stat = canLeads
    ? await q1<{ fresh: string; week: string; today: string; mine: string }>(
        `SELECT count(*) FILTER (WHERE status='new') fresh, count(*) FILTER (WHERE at > now() - interval '7 days') week,
                count(*) FILTER (WHERE at > date_trunc('day', now())) today, count(*) FILTER (WHERE assignee::text=$${sc.params.length + 1} AND status NOT IN ('issued','lost')) mine
           FROM leads WHERE ${sc.sql}`, [...sc.params, user.id])
    : undefined;
  const recent = canLeads ? await q<{ id: string; at: string; data: { name: string; phone: string; source: string; extra?: Record<string, string> }; status: string }>(`SELECT id, at, data, status FROM leads WHERE ${sc.sql} ORDER BY at DESC LIMIT 6`, sc.params) : [];
  const drafts = can(user.role, "content", "read") ? await q1<{ n: string; sched: string }>("SELECT count(*) FILTER (WHERE draft IS NOT NULL) n, count(*) FILTER (WHERE publish_at IS NOT NULL) sched FROM pages") : undefined;
  const log = can(user.role, "audit", "read") ? await q<{ at: string; user_email: string | null; action: string; entity_id: string | null }>("SELECT at, user_email, action, entity_id FROM audit ORDER BY at DESC LIMIT 8") : [];

  return (
    <Shell user={user} active="dashboard" title={`Здравствуйте, ${user.name?.split(" ")[0] || "коллега"}`} sub={ROLE_NAMES[user.role]} flash={{ e: sp.e || (sp.denied ? "Этот раздел вам недоступен" : undefined), ok: sp.ok }}>
      {stat && (
        <div className="ad-stats">
          <Link href="/admin/leads?status=new" className="ad-stat"><b>{stat.fresh}</b><span>новых заявок</span></Link>
          <Link href="/admin/leads" className="ad-stat"><b>{stat.today}</b><span>заявок сегодня</span></Link>
          <Link href="/admin/leads" className="ad-stat"><b>{stat.week}</b><span>за 7 дней</span></Link>
          {(user.role === "manager" || user.role === "callcenter") && <Link href="/admin/leads?mine=1" className="ad-stat"><b>{stat.mine}</b><span>в работе у вас</span></Link>}
          {drafts && <Link href="/admin/content" className="ad-stat"><b>{drafts.n}</b><span>черновиков{Number(drafts.sched) ? `, ${drafts.sched} по расписанию` : ""}</span></Link>}
        </div>
      )}
      <section className="ad-card">
        <h2>С чего начать</h2>
        <div className="ad-start">
          {can(user.role, "content", "read") && <Link href="/admin/content"><b>Тексты и SEO страниц</b><span>93 страницы сайта: правьте заголовки, описания и текст, публикуйте сразу или по расписанию</span></Link>}
          {can(user.role, "catalog", "read") && <Link href="/admin/catalog"><b>Автопарк</b><span>Цены, классы и плашки машин. Изменения видны на главной и в калькуляторе</span></Link>}
          {can(user.role, "media", "read") && <Link href="/admin/media"><b>Медиатека</b><span>Загрузите картинки и вставляйте их в тексты страниц</span></Link>}
          {canLeads && <Link href="/admin/leads"><b>Заявки</b><span>Все обращения с форм сайта: статус, ответственный, комментарий</span></Link>}
          {can(user.role, "users", "read") && <Link href="/admin/users"><b>Сотрудники</b><span>Добавьте коллег и выдайте роли</span></Link>}
        </div>
      </section>
      <div className="ad-cols">
        {canLeads && (
          <section className="ad-card">
            <h2>Последние заявки</h2>
            {recent.length === 0 ? <p className="ad-muted">Заявок пока нет. Как только кто-то оставит их на сайте, они появятся здесь.</p> : (
              <ul className="ad-list">
                {recent.map((l) => (
                  <li key={l.id}><Link href={`/admin/leads/${l.id}`}><b>{l.data.name}</b> <span>{l.data.phone}</span></Link><em className={`st st-${l.status}`}>{LEAD_STATUS_NAME[l.status]}</em><time>{fmt(l.at)}</time></li>
                ))}
              </ul>
            )}
          </section>
        )}
        {log.length > 0 && (
          <section className="ad-card">
            <h2>Что менялось</h2>
            <ul className="ad-list">
              {log.map((a, i) => <li key={i}><span><b>{a.action}</b> {a.entity_id && <code>{a.entity_id}</code>}</span><em>{a.user_email ?? "—"}</em><time>{fmt(a.at)}</time></li>)}
            </ul>
            <p><Link href="/admin/audit">Весь журнал →</Link></p>
          </section>
        )}
      </div>
    </Shell>
  );
}
