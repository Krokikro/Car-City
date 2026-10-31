import Link from "next/link";
import { Shell } from "@/components/admin/Shell";
import { requireUser } from "@/lib/admin/auth";
import { can } from "@/lib/admin/roles";
import { q } from "@/lib/db";
import { fmt } from "@/lib/admin/format";
import { importRedirectsAction, notFoundToolAction, redirectToolAction, saveRedirectAction } from "../actions-site";
import { LIM } from "@/lib/admin/limits";

export const dynamic = "force-dynamic";
export const metadata = { title: "Редиректы и 404" };

const MATCH: Record<string, string> = { exact: "Точный адрес", prefix: "Раздел целиком", regex: "Регулярное выражение" };

export default async function Redirects({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string; tab?: string; q?: string; edit?: string; from?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser({ section: "redirects" });
  const write = can(user, "redirects", "write");
  const tab = sp.tab === "404" ? "404" : sp.tab === "import" ? "import" : "list";
  const rows = await q<{ id: string; from_path: string; to_path: string; code: number; match: string; active: boolean; note: string; hits: number; last_hit: string | null; created_at: string; created_by: string | null }>(
    "SELECT id::text, from_path, to_path, code, match, active, note, hits, last_hit, created_at, created_by FROM redirects ORDER BY active DESC, created_at DESC",
  );
  const nf = await q<{ path: string; hits: number; first_at: string; last_at: string; referer: string | null }>("SELECT path, hits, first_at, last_at, referer FROM not_found WHERE NOT ignored ORDER BY hits DESC, last_at DESC LIMIT 300");
  const edit = rows.find((r) => r.id === sp.edit);
  // цепочки: цель одного редиректа — источник другого
  const froms = new Set(rows.filter((r) => r.active && r.match === "exact").map((r) => r.from_path.toLowerCase().replace(/\/+$/, "")));
  const qq = (sp.q ?? "").toLowerCase();
  const list = rows.filter((r) => !qq || `${r.from_path} ${r.to_path} ${r.note}`.toLowerCase().includes(qq));

  const Form = ({ r, from }: { r?: (typeof rows)[number]; from?: string }) => (
    <form action={saveRedirectAction} className="pnl-form pnl-redirect-form">
      {r && <input type="hidden" name="id" value={r.id} />}
      <input type="hidden" name="back" value={tab === "404" ? "/admin/redirects?tab=404" : "/admin/redirects"} />
      <label>Откуда<input name="from" maxLength={LIM.redirectPath} defaultValue={r?.from_path ?? from ?? ""} required placeholder="/staryj-adres" /></label>
      <label>Куда<input name="to" maxLength={LIM.redirectPath} defaultValue={r?.to_path ?? ""} placeholder="/novyj-adres или https://…" /></label>
      <label>Код<select name="code" defaultValue={r?.code ?? 301}><option value={301}>301 — навсегда</option><option value={302}>302 — временно</option><option value={410}>410 — удалено навсегда</option><option value={308}>308</option><option value={307}>307</option></select></label>
      <label>Тип<select name="match" defaultValue={r?.match ?? "exact"}>{Object.entries(MATCH).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
      <label>Заметка<input name="note" maxLength={LIM.redirectNote} defaultValue={r?.note ?? ""} placeholder="зачем" /></label>
      <button className="pnl-btn pnl-btn-main" type="submit">{r ? "Сохранить" : "Добавить"}</button>
      {r && <Link className="pnl-btn" href="/admin/redirects">Отмена</Link>}
    </form>
  );

  return (
    <Shell user={user} active="redirects" title="Редиректы и 404" sub="Перенаправления адресов и журнал несуществующих страниц. Работают сразу, без пересборки сайта." flash={sp}>
      <div className="pnl-tabs">
        <Link href="/admin/redirects" className={tab === "list" ? "on" : ""}>Редиректы ({rows.filter((r) => r.active).length})</Link>
        <Link href="/admin/redirects?tab=404" className={tab === "404" ? "on" : ""}>Журнал 404 ({nf.length})</Link>
        {write && <Link href="/admin/redirects?tab=import" className={tab === "import" ? "on" : ""}>Массовый ввод</Link>}
      </div>
      {tab === "list" && (
        <>
          {write && (
            <section className="pnl-card">
              <h2>{edit ? "Изменить редирект" : "Новый редирект"}</h2>
              <Form r={edit} from={sp.from} />
              <p className="pnl-muted">«Раздел целиком»: /old-section → /new ведёт всё, что начинается с /old-section/. Чтобы сохранить хвост адреса, поставьте * в конце цели: /new/*. Цепочки редиректов склеиваются автоматически.</p>
            </section>
          )}
          <form className="pnl-filter" action="/admin/redirects"><input name="q" placeholder="Поиск по адресу или заметке" defaultValue={sp.q} /><button className="pnl-btn" type="submit">Найти</button></form>
          <div className="pnl-table-wrap">
            <table className="pnl-table">
              <thead><tr><th>Откуда</th><th>Куда</th><th>Код</th><th>Срабатываний</th><th>Заметка</th><th></th></tr></thead>
              <tbody>
                {list.map((r) => {
                  const chain = r.match === "exact" && froms.has(r.to_path.toLowerCase().replace(/\/+$/, ""));
                  return (
                    <tr key={r.id} className={r.active ? "" : "is-off"}>
                      <td><code>{r.from_path}</code>{r.match !== "exact" && <><br /><span className="pnl-muted">{MATCH[r.match]}</span></>}</td>
                      <td>{r.code === 410 ? <span className="pnl-muted">— удалено</span> : <code>{r.to_path}</code>}{chain && <><br /><em className="st st-call">цепочка</em></>}</td>
                      <td>{r.code}</td>
                      <td>{r.hits}{r.last_hit && <><br /><span className="pnl-muted">{fmt(r.last_hit)}</span></>}</td>
                      <td className="pnl-muted">{r.note}{r.created_by ? ` · ${r.created_by}` : ""}</td>
                      <td className="pnl-actions-cell">
                        {write && (
                          <>
                            <Link className="pnl-btn pnl-btn-sm" href={`/admin/redirects?edit=${r.id}`}>Изменить</Link>
                            <form action={redirectToolAction}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="op" value="toggle" /><button className="pnl-btn pnl-btn-sm" type="submit">{r.active ? "Выключить" : "Включить"}</button></form>
                            <form action={redirectToolAction}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="op" value="delete" /><button className="pnl-btn pnl-btn-sm pnl-btn-warn" type="submit">Удалить</button></form>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {list.length === 0 && <tr><td colSpan={6} className="pnl-muted">Редиректов нет</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
      {tab === "404" && (
        <>
          <p className="pnl-muted">Адреса, которые открывали, а страницы нет. После переезда сюда попадут старые адреса, которые мы не учли, — для каждого можно сразу сделать редирект. Сканеры уязвимостей (.php, .env и т. п.) не записываются.</p>
          {sp.from && write && <section className="pnl-card"><h2>Редирект для {sp.from}</h2><Form from={sp.from} /></section>}
          <div className="pnl-table-wrap">
            <table className="pnl-table">
              <thead><tr><th>Адрес</th><th>Раз</th><th>Последний раз</th><th>Откуда пришли</th><th></th></tr></thead>
              <tbody>
                {nf.map((r) => (
                  <tr key={r.path}>
                    <td><code>{r.path}</code></td>
                    <td>{r.hits}</td>
                    <td className="pnl-muted">{fmt(r.last_at)}</td>
                    <td className="pnl-muted pnl-ellipsis">{r.referer || "—"}</td>
                    <td className="pnl-actions-cell">
                      {write && (
                        <>
                          <Link className="pnl-btn pnl-btn-sm pnl-btn-main" href={`/admin/redirects?tab=404&from=${encodeURIComponent(r.path)}`}>Сделать редирект</Link>
                          <form action={notFoundToolAction}><input type="hidden" name="op" value="ignore" /><input type="hidden" name="path" value={r.path} /><button className="pnl-btn pnl-btn-sm" type="submit">Скрыть</button></form>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {nf.length === 0 && <tr><td colSpan={5} className="pnl-muted">Ошибок 404 нет</td></tr>}
              </tbody>
            </table>
          </div>
          {write && nf.length > 0 && <form action={notFoundToolAction}><input type="hidden" name="op" value="clear" /><button className="pnl-btn" type="submit">Убрать скрытые и старше 30 дней</button></form>}
        </>
      )}
      {tab === "import" && write && (
        <section className="pnl-card">
          <h2>Массовый ввод</h2>
          <p className="pnl-muted">По строке на редирект: <code>откуда куда [код]</code>. Разделитель — пробел, табуляция, «;» или «,». Можно вставить столбцы из Excel. Строки с # — комментарии.</p>
          <form action={importRedirectsAction} className="pnl-form">
            <textarea name="csv" rows={14} className="pnl-mono" placeholder={"/old-page /new-page\n/akcii/leto /akcii 301\n/udalennaya-stranica - 410"} />
            <button className="pnl-btn pnl-btn-main" type="submit">Добавить</button>
          </form>
        </section>
      )}
    </Shell>
  );
}
