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
import { LIM } from "@/lib/admin/limits";
import { LANG_NAMES, ORIGIN_NAMES, geoLine } from "@/lib/admin/leads";
import { attribute, sourceLine } from "@/lib/lead/source";

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
  const write = can(user, "leads", "write");
  const staff = can(user, "leads", "write") && (user.role === "admin" || user.role === "commercial");
  const team = staff ? await q<{ id: string; name: string; role: string }>("SELECT id::text, name, role FROM users WHERE active AND role IN ('admin','commercial','manager','callcenter') ORDER BY name") : [];
  const d = l.data;
  const attr = d.attr ?? attribute(d.first, d.last);
  const hist = await q<{ at: string; user_email: string | null; action: string }>("SELECT at, user_email, action FROM audit WHERE entity='lead' AND entity_id=$1 ORDER BY at DESC LIMIT 15", [id]);
  const tel = (d.phone ?? "").replace(/[^\d+]/g, "");

  return (
    <Shell user={user} active="leads" title={d.name || "Без имени"} sub={`Заявка № ${l.id} · ${fmt(l.at, true)}`} flash={sp} back={["/admin/leads", "Заявки"]}>
      <div className="pnl-cols">
        <section className="pnl-card">
          <h2>Клиент</h2>
          <dl className="pnl-dl">
            {d.phone ? <><dt>Телефон</dt><dd><a href={`tel:${tel}`}>{d.phone}</a></dd></> : null}
            {d.messenger && <><dt>Как связаться</dt><dd>{MESSENGER_LABELS[d.messenger]}</dd></>}
            {Object.entries(d.extra ?? {}).map(([k, v]) => <><dt key={`k${k}`}>{EXTRA_LABELS[k] ?? k}</dt><dd key={`v${k}`}>{k === "mode" ? (MODE_LABELS[v] ?? v) : v}</dd></>)}
            <dt>Откуда заявка</dt><dd>{ORIGIN_NAMES[d.origin ?? "form"]}{d.chatId && <> · <Link href={`/admin/chats/${d.chatId}`}>открыть чат →</Link></>}</dd>
            <dt>Версия сайта</dt><dd>{LANG_NAMES[d.lang ?? "ru"] ?? d.lang}</dd>
            <dt>Город</dt><dd>{geoLine(d.geo) || <span className="pnl-muted">не определён</span>}</dd>
            <dt>Устройство</dt><dd>{{ mobile: "телефон", tablet: "планшет", desktop: "компьютер" }[d.device] ?? d.device}{d.screen ? ` · ${d.screen}` : ""}</dd>
            <dt>Форма</dt><dd>{d.source}</dd>
            {d.page && <><dt>Страница заявки</dt><dd className="pnl-break">{d.page}</dd></>}
            {(d as Lead & { bitrixId?: number }).bitrixId ? <><dt>Битрикс24</dt><dd>лид № {(d as Lead & { bitrixId?: number }).bitrixId}</dd></> : null}
            {d.flags?.length ? <><dt>Пометки</dt><dd>{d.flags.join(", ")}</dd></> : null}
            <dt>Согласие ПДн</dt><dd>да, ред. {d.consent?.version}{d.consent?.marketing ? ", реклама: да" : ""}</dd>
          </dl>
        </section>
        <section className="pnl-card">
          <h2>Источник</h2>
          <dl className="pnl-dl">
            <dt>Канал</dt><dd><b>{attr.channel}</b> <span className="pnl-muted">· {attr.group}</span></dd>
            {attr.campaign && <><dt>Кампания</dt><dd>{attr.campaign}</dd></>}
            {attr.term && <><dt>Ключевая фраза</dt><dd>«{attr.term}»</dd></>}
            {attr.content && <><dt>Объявление</dt><dd>{attr.content}</dd></>}
            {attr.medium && <><dt>Тип трафика</dt><dd>{attr.medium}</dd></>}
            <dt>Первый вход</dt><dd>{sourceLine(attr.first)}{d.first?.at ? <span className="pnl-muted"> · {fmt(d.first.at, true)}</span> : null}</dd>
            <dt>Последний вход</dt><dd>{sourceLine(attr.last)}{d.last?.at ? <span className="pnl-muted"> · {fmt(d.last.at, true)}</span> : null}</dd>
            {d.first?.landing && <><dt>Страница входа</dt><dd className="pnl-break">{d.first.landing}</dd></>}
            {(d.first?.referrer || d.last?.referrer) && <><dt>Пришёл с</dt><dd className="pnl-break">{d.last?.referrer || d.first?.referrer}</dd></>}
            {(d.first?.yclid || d.last?.yclid) && <><dt>yclid</dt><dd className="pnl-break">{d.last?.yclid || d.first?.yclid}</dd></>}
            {d.ymClientId && <><dt>ClientID Метрики</dt><dd>{d.ymClientId}</dd></>}
          </dl>
          <p className="pnl-muted">Канал для отчётов — по последнему значимому переходу: прямой заход не перебивает рекламу или поиск, с которых человек пришёл раньше (до 90 дней).</p>
        </section>
        <section className="pnl-card">
          <h2>Работа с заявкой</h2>
          <form action={updateLeadAction} className="pnl-form">
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
              <label>Комментарий<textarea name="comment" rows={5} defaultValue={l.comment} maxLength={LIM.leadComment} /></label>
              {write && <button className="pnl-btn pnl-btn-main" type="submit">Сохранить</button>}
            </fieldset>
          </form>
        </section>
      </div>
      {hist.length > 0 && (
        <section className="pnl-card">
          <h2>История</h2>
          <ul className="pnl-list">{hist.map((h, i) => <li key={i}><span>{h.action}</span><em>{h.user_email ?? ""}</em><time>{fmt(h.at, true)}</time></li>)}</ul>
        </section>
      )}
    </Shell>
  );
}
