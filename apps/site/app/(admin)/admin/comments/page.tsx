import Link from "next/link";
import { Shell } from "@/components/admin/Shell";
import { requireUser } from "@/lib/admin/auth";
import { can } from "@/lib/admin/roles";
import { q } from "@/lib/db";
import { getDoc } from "@/lib/docs";
import { fmt } from "@/lib/admin/format";
import { commentAction } from "../actions-comments";

export const dynamic = "force-dynamic";
export const metadata = { title: "Комментарии" };

interface Row { id: string; path: string; lang: string; name: string; text: string; status: string; created_at: string; moderated_by: string | null }

const TABS: [string, string, string][] = [["new", "Новые", "new"], ["published", "Опубликованные", "published"], ["hidden", "Скрытые", "hidden"]];

const Btn = ({ id, op, tab, main, warn, children }: { id: string; op: string; tab: string; main?: boolean; warn?: boolean; children: React.ReactNode }) => (
  <form action={commentAction} className="pnl-inline-form">
    <input type="hidden" name="id" value={id} />
    <input type="hidden" name="op" value={op} />
    <input type="hidden" name="tab" value={tab} />
    <button className={`pnl-btn pnl-btn-sm${main ? " pnl-btn-main" : ""}${warn ? " pnl-btn-warn" : ""}`} type="submit">{children}</button>
  </form>
);

export default async function Comments({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string; tab?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser({ section: "articles" });
  const write = can(user, "articles", "write");
  const tab = TABS.some(([id]) => id === sp.tab) ? sp.tab! : "new";
  const counts = new Map((await q<{ status: string; n: string }>("SELECT status, count(*)::text AS n FROM article_comments GROUP BY status")).map((r) => [r.status, Number(r.n)]));
  const rows = await q<Row>("SELECT id::text, path, lang, name, text, status, created_at, moderated_by FROM article_comments WHERE status=$1 ORDER BY created_at DESC LIMIT 300", [tab]);

  return (
    <Shell user={user} active="comments" title="Комментарии к статьям" sub="Читатели оставляют комментарии под статьями. На сайте они появляются только после того, как вы нажмёте «Опубликовать»." flash={sp}>
      <div className="pnl-tools"><div className="pnl-tabs">{TABS.map(([id, name]) => <Link key={id} href={`/admin/comments?tab=${id}`} className={tab === id ? "on" : ""}>{name} ({counts.get(id) ?? 0})</Link>)}</div></div>
      {rows.length === 0 && <p className="pnl-muted">Здесь пока пусто.</p>}
      {rows.map((r) => {
        const doc = getDoc(r.path, "ru");
        const site = r.lang === "ru" ? r.path : `/${r.lang}${r.path}`;
        return (
          <article key={r.id} className="pnl-rev">
            <header>
              <b>{r.name}</b>
              <span className="pnl-muted">{fmt(r.created_at, true)} · {r.lang.toUpperCase()}{r.moderated_by ? ` · проверил ${r.moderated_by}` : ""}</span>
              <a className="pnl-link" href={site} target="_blank" rel="noreferrer">{doc?.h1 ?? r.path} ↗</a>
            </header>
            <p style={{ whiteSpace: "pre-line" }}>{r.text}</p>
            {write && (
              <div className="pnl-row">
                {r.status !== "published" && <Btn id={r.id} op="publish" tab={tab} main>Опубликовать</Btn>}
                {r.status !== "hidden" && <Btn id={r.id} op="hide" tab={tab}>Скрыть</Btn>}
                <Btn id={r.id} op="delete" tab={tab} warn>Удалить</Btn>
              </div>
            )}
          </article>
        );
      })}
    </Shell>
  );
}
