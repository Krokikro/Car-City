import Link from "next/link";
import { Shell } from "@/components/admin/Shell";
import { requireUser } from "@/lib/admin/auth";
import { can, LEAD_STATUS_NAME } from "@/lib/admin/roles";
import { q, q1 } from "@/lib/db";
import { leadScope } from "@/lib/admin/scope";
import { fmt } from "@/lib/admin/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Обзор" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string; denied?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const sc = leadScope(user);
  const canLeads = can(user, "leads", "read");
  const stat = canLeads
    ? await q1<{ fresh: string; week: string; today: string; mine: string }>(
        `SELECT count(*) FILTER (WHERE status='new') fresh, count(*) FILTER (WHERE at > now() - interval '7 days') week,
                count(*) FILTER (WHERE at > date_trunc('day', now())) today, count(*) FILTER (WHERE assignee::text=$${sc.params.length + 1} AND status NOT IN ('issued','lost')) mine
           FROM leads WHERE ${sc.sql}`, [...sc.params, user.id])
    : undefined;
  const recent = canLeads ? await q<{ id: string; at: string; data: { name: string; phone: string; source: string; extra?: Record<string, string> }; status: string }>(`SELECT id, at, data, status FROM leads WHERE ${sc.sql} ORDER BY at DESC LIMIT 6`, sc.params) : [];
  const canContent = can(user, "pages", "read") || can(user, "articles", "read");
  const drafts = canContent ? await q1<{ n: string; sched: string }>("SELECT count(*) FILTER (WHERE draft IS NOT NULL) n, count(*) FILTER (WHERE publish_at IS NOT NULL) sched FROM pages") : undefined;
  const seoStat = can(user, "redirects", "read") || can(user, "seo", "read")
    ? await q1<{ nf: string; nf_new: string; rd: string; seo: string }>("SELECT (SELECT count(*) FROM not_found WHERE NOT ignored) nf, (SELECT count(*) FROM not_found WHERE NOT ignored AND last_at > now() - interval '1 day') nf_new, (SELECT count(*) FROM redirects WHERE active) rd, (SELECT count(*) FROM seo_pages) seo")
    : undefined;
  const log = can(user, "audit", "read") ? await q<{ at: string; user_email: string | null; action: string; entity_id: string | null }>("SELECT at, user_email, action, entity_id FROM audit ORDER BY at DESC LIMIT 8") : [];

  return (
    <Shell user={user} active="dashboard" title={`Здравствуйте, ${user.name?.split(" ")[0] || "коллега"}`} sub={user.roleName} flash={{ e: sp.e || (sp.denied ? "Этот раздел вам недоступен" : undefined), ok: sp.ok }}>
      {stat && (
        <div className="pnl-stats">
          <Link href="/admin/leads?status=new" className="pnl-stat"><b>{stat.fresh}</b><span>новых заявок</span></Link>
          <Link href="/admin/leads" className="pnl-stat"><b>{stat.today}</b><span>заявок сегодня</span></Link>
          <Link href="/admin/leads" className="pnl-stat"><b>{stat.week}</b><span>за 7 дней</span></Link>
          {user.leadScope !== "all" && <Link href="/admin/leads?mine=1" className="pnl-stat"><b>{stat.mine}</b><span>в работе у вас</span></Link>}
          {drafts && <Link href="/admin/content?st=draft&kind=all" className="pnl-stat"><b>{drafts.n}</b><span>черновиков{Number(drafts.sched) ? `, ${drafts.sched} по расписанию` : ""}</span></Link>}
        </div>
      )}
      {!stat && (drafts || seoStat) && (
        <div className="pnl-stats">
          {drafts && <Link href="/admin/content?st=draft&kind=all" className="pnl-stat"><b>{drafts.n}</b><span>черновиков{Number(drafts.sched) ? `, ${drafts.sched} по расписанию` : ""}</span></Link>}
          {seoStat && <Link href="/admin/redirects?tab=404" className="pnl-stat"><b>{seoStat.nf}</b><span>адресов с ошибкой 404{Number(seoStat.nf_new) ? `, ${seoStat.nf_new} за сутки` : ""}</span></Link>}
          {seoStat && <Link href="/admin/redirects" className="pnl-stat"><b>{seoStat.rd}</b><span>редиректов работает</span></Link>}
          {seoStat && <Link href="/admin/seo?tab=pages" className="pnl-stat"><b>{seoStat.seo}</b><span>страниц с ручным SEO</span></Link>}
        </div>
      )}
      <section className="pnl-card">
        <h2>С чего начать</h2>
        <div className="pnl-start">
          {can(user, "pages", "read") && <Link href="/admin/content?kind=page"><b>Страницы</b><span>Тексты страниц сайта: правьте H1 и текст, публикуйте сразу или по расписанию</span></Link>}
          {can(user, "articles", "read") && <Link href="/admin/content?kind=article"><b>Статьи и блог</b><span>Новые статьи и правка старых: черновик, публикация, история версий</span></Link>}
          {can(user, "seo", "read") && <Link href="/admin/seo"><b>SEO</b><span>Title, description, canonical, robots.txt, sitemap, микроразметка, счётчики и верификация</span></Link>}
          {can(user, "migration", "read") && <Link href="/admin/migration"><b>Переезд со старого сайта</b><span>Все адреса car-city.pro: что открывается, что перенаправлено, что потерялось</span></Link>}
          {can(user, "catalog", "read") && <Link href="/admin/catalog"><b>Автопарк</b><span>Цены, классы и плашки машин. Изменения видны на главной и в калькуляторе</span></Link>}
          {can(user, "media", "read") && <Link href="/admin/media"><b>Медиатека</b><span>Загрузите картинки и вставляйте их в тексты страниц</span></Link>}
          {canLeads && <Link href="/admin/leads"><b>Заявки</b><span>Все обращения с форм сайта: статус, ответственный, комментарий</span></Link>}
          {can(user, "settings", "read") && <Link href="/admin/settings"><b>Тема сайта</b><span>Какую версию видят посетители: тёмную или светлую</span></Link>}
          {can(user, "users", "read") && <Link href="/admin/users"><b>Сотрудники</b><span>Логины и пароли сотрудников, включение и отключение доступа</span></Link>}
          {can(user, "roles", "read") && <Link href="/admin/roles"><b>Роли и права</b><span>Что доступно каждой роли — по каждому разделу</span></Link>}
        </div>
      </section>
      <div className="pnl-cols">
        {canLeads && (
          <section className="pnl-card">
            <h2>Последние заявки</h2>
            {recent.length === 0 ? <p className="pnl-muted">Заявок пока нет. Как только кто-то оставит их на сайте, они появятся здесь.</p> : (
              <ul className="pnl-list">
                {recent.map((l) => (
                  <li key={l.id}><Link href={`/admin/leads/${l.id}`}><b>{l.data.name}</b> <span>{l.data.phone}</span></Link><em className={`st st-${l.status}`}>{LEAD_STATUS_NAME[l.status]}</em><time>{fmt(l.at)}</time></li>
                ))}
              </ul>
            )}
          </section>
        )}
        {log.length > 0 && (
          <section className="pnl-card">
            <h2>Что менялось</h2>
            <ul className="pnl-list">
              {log.map((a, i) => <li key={i}><span><b>{a.action}</b> {a.entity_id && <code>{a.entity_id}</code>}</span><em>{a.user_email ?? "—"}</em><time>{fmt(a.at)}</time></li>)}
            </ul>
            <p><Link href="/admin/audit">Весь журнал →</Link></p>
          </section>
        )}
      </div>
    </Shell>
  );
}
