import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/admin/Shell";
import { requireUser } from "@/lib/admin/auth";
import { can, LEAD_STATUSES, LOST_REASONS } from "@/lib/admin/roles";
import { q, q1 } from "@/lib/db";
import { fmt } from "@/lib/admin/format";
import { updateLeadAction } from "../../actions";
import { leadScope } from "@/lib/admin/scope";
import { EXTRA_LABELS, MODE_LABELS, MESSENGER_LABELS, type Lead } from "@/lib/lead/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Заявка" };

export default async function LeadPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ e?: string; ok?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireUser({ section: "leads" });
  const sc = leadScope(user);
  const l = await q1<{ id: string; at: string; data: Lead; status: string; reason: string | null; assignee: string | null; comment: string; updated_at: string }>(
    `SELECT id, at, data, status, reason, assignee::text, comment, updated_at FROM leads WHERE id=$${sc.params.length + 1} AND ${sc.sql}`, [...sc.params, id],
  );
  if (!l) notFound();
  const write = can(user.role, "leads", "write");
  const staff = can(user.role, "leads", "write") && (user.role === "admin" || user.role === "commercial");
  const team = staff ? await q<{ id: string; name: string; role: string }>("SELECT id::text, name, role FROM users WHERE active AND role IN ('admin','commercial','manager','callcenter') ORDER BY name") : [];
  const d = l.data;
  const touch = (t?: Lead["first"]) => t ? [t.utm_source, t.utm_medium, t.utm_campaign, t.utm_term && `«${t.utm_term}»`, t.referrer && `с ${t.referrer}`].filter(Boolean).join(" / ") : "";
  const hist = await q<{ at: string; user_email: string | null; action: string }>("SELECT at, user_email, action FROM audit WHERE entity='lead' AND entity_id=$1 ORDER BY at DESC LIMIT 15", [id]);
  const tel = d.phone.replace(/[^\d+]/g, "");

  return (
    <Shell user={user} active="leads" title={d.name} sub={`Заявка № ${l.id} · ${fmt(l.at, true)}`} flash={sp} actions={<Link className="ad-btn" href="/admin/leads">← К заявкам</Link>}>
      <div className="ad-cols">
        <section className="ad-card">
          <h2>Клиент</h2>
          <dl className="ad-dl">
            <dt>Телефон</dt><dd><a href={`tel:${tel}`}>{d.phone}</a></dd>
            {d.messenger && <><dt>Как связаться</dt><dd>{MESSENGER_LABELS[d.messenger]}</dd></>}
            {Object.entries(d.extra ?? {}).map(([k, v]) => <><dt key={`k${k}`}>{EXTRA_LABELS[k] ?? k}</dt><dd key={`v${k}`}>{k === "mode" ? (MODE_LABELS[v] ?? v) : v}</dd></>)}
            <dt>Форма</dt><dd>{d.source}{d.lang ? ` · ${d.lang}` : ""} · {d.device}</dd>
            {d.page && <><dt>Страница</dt><dd>{d.page}</dd></>}
            {touch(d.first) && <><dt>Первый вход</dt><dd>{touch(d.first)}</dd></>}
            {touch(d.last) && touch(d.last) !== touch(d.first) && <><dt>Последний вход</dt><dd>{touch(d.last)}</dd></>}
            {d.flags?.length ? <><dt>Пометки</dt><dd>{d.flags.join(", ")}</dd></> : null}
            <dt>Согласие ПДн</dt><dd>да, ред. {d.consent?.version}{d.consent?.marketing ? ", реклама: да" : ""}</dd>
          </dl>
        </section>
        <section className="ad-card">
          <h2>Работа с заявкой</h2>
          <form action={updateLeadAction} className="ad-form">
            <input type="hidden" name="id" value={l.id} />
            <fieldset disabled={!write}>
              <label>Статус<select name="status" defaultValue={l.status}>{LEAD_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
              <label>Причина отказа (если «Отказ”)<select name="reason" defaultValue={l.reason ?? ""}><option value="">—</option>{LOST_REASONS.map((r) => <option key={r}>{r}</option>)}</select></label>
              <label>Ответственный
                {staff ? (
                  <select name="assignee" defaultValue={l.assignee ?? "none"}><option value="none">Не назначен</option>{team.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                ) : (
                  <select name="assignee" defaultValue={l.assignee ?? "none"}>
                    <option value="none">Не назначен</option>
                    <option value={user.id}>Я{l.assignee === user.id ? "" : " (взять себе)"}</option>
                    {l.assignee && l.assignee !== user.id && <option value={l.assignee}>Другой сотрудник</option>}
                  </select>
                )}
              </label>
              <label>Комментарий<textarea name="comment" rows={5} defaultValue={l.comment} maxLength={4000} /></label>
              {write && <button className="ad-btn ad-btn-main" type="submit">Сохранить</button>}
            </fieldset>
          </form>
        </section>
      </div>
      {hist.length > 0 && (
        <section className="ad-card">
          <h2>История</h2>
          <ul className="ad-list">{hist.map((h, i) => <li key={i}><span>{h.action}</span><em>{h.user_email ?? ""}</em><time>{fmt(h.at, true)}</time></li>)}</ul>
        </section>
      )}
    </Shell>
  );
}
