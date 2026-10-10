import Link from "next/link";
import { Shell } from "@/components/admin/Shell";
import { requireUser } from "@/lib/admin/auth";
import { can } from "@/lib/admin/roles";
import { q } from "@/lib/db";
import { getDoc } from "@/lib/docs";
import { parseReviews } from "@/lib/blocks";
import { reviewKey, SOURCES, SOURCE_URL } from "@/lib/reviews";
import { addReviewAction, reviewAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Отзывы" };

interface Row { id: string; key: string; source: string; name: string; date_text: string; text: string; url: string; status: string; origin: string; created_at: string }

function Card({ r, children }: { r: { source: string; name: string; date: string; text: string; url?: string; badge?: string }; children: React.ReactNode }) {
  return (
    <article className="ad-rev">
      <header>
        <b>{r.name}</b>
        <span className="ad-muted">{r.source}{r.date ? ` · ${r.date}` : ""}{r.badge ? ` · ${r.badge}` : ""}</span>
        {r.url && <a className="ad-link" href={r.url} target="_blank" rel="noreferrer">открыть на источнике ↗</a>}
      </header>
      <p>{r.text}</p>
      <div className="ad-row">{children}</div>
    </article>
  );
}

const Btn = ({ op, id, k, main, warn, children, extra }: { op: string; id?: string; k?: string; main?: boolean; warn?: boolean; children: React.ReactNode; extra?: Record<string, string> }) => (
  <form action={reviewAction} className="ad-inline-form">
    <input type="hidden" name="op" value={op} />
    {id && <input type="hidden" name="id" value={id} />}
    {k && <input type="hidden" name="key" value={k} />}
    {extra && Object.entries(extra).map(([n, v]) => <input key={n} type="hidden" name={n} value={v} />)}
    <button className={`ad-btn ad-btn-sm${main ? " ad-btn-main" : ""}${warn ? " ad-btn-warn" : ""}`} type="submit">{children}</button>
  </form>
);

export default async function Reviews({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string; tab?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser({ section: "reviews" });
  const write = can(user.role, "reviews", "write");
  const rows = await q<Row>("SELECT id::text, key, source, name, date_text, text, url, status, origin, created_at FROM reviews ORDER BY COALESCE(published_at, created_at) DESC, id DESC");
  const file = parseReviews(getDoc("/reviews", "ru")?.body ?? "");
  const hiddenKeys = new Set(rows.filter((r) => r.status === "hidden").map((r) => r.key));
  const fresh = rows.filter((r) => r.status === "new");
  const pub = rows.filter((r) => r.status === "published");
  const ign = rows.filter((r) => r.status === "ignored");
  const hid = rows.filter((r) => r.status === "hidden");
  const tab = sp.tab === "site" || sp.tab === "off" || sp.tab === "add" ? sp.tab : "new";
  const tabs: [string, string][] = [["new", `Новые (${fresh.length})`], ["site", `На сайте (${pub.length + file.length - hiddenKeys.size})`], ["off", `Скрытые и игнор (${ign.length + hid.length})`], ["add", "Добавить отзыв"]];

  return (
    <Shell user={user} active="reviews" title="Отзывы" sub="Новые отзывы из Яндекс.Карт, 2ГИС, Flamp и Yell приходят сюда. Нажмите «Опубликовать» — отзыв появится на сайте первым в своём источнике. «Игнорировать» — на сайте его не будет." flash={sp}>
      <div className="ad-tools"><div className="ad-tabs">{tabs.map(([id, name]) => <Link key={id} href={`/admin/reviews?tab=${id}`} className={tab === id ? "on" : ""}>{name}</Link>)}</div></div>

      {tab === "new" && (
        <>
          {!fresh.length && <p className="ad-card ad-muted">Новых отзывов нет. Когда в одном из источников появится отзыв, он будет здесь с кнопками «Опубликовать» и «Игнорировать». Если отзыв нужно добавить вручную — вкладка «Добавить отзыв».</p>}
          {fresh.map((r) => (
            <Card key={r.id} r={{ source: r.source, name: r.name, date: r.date_text, text: r.text, url: r.url || SOURCE_URL[r.source] }}>
              {write && <><Btn op="publish" id={r.id} main>Опубликовать на сайте</Btn><Btn op="ignore" id={r.id}>Игнорировать</Btn></>}
            </Card>
          ))}
          <details className="ad-card">
            <summary>Как отзывы попадают в этот список</summary>
            <p className="ad-muted">У Яндекс.Карт, 2ГИС, Flamp и Yell нет открытого доступа к чужим отзывам без договора, поэтому сайт сам их не читает. Есть два способа: добавлять отзыв вручную (вкладка «Добавить отзыв»), либо подключить сборщик — сервис вроде Make/n8n или скрипт, который раз в несколько часов шлёт новые отзывы на адрес <code>POST /api/reviews/ingest</code> с заголовком <code>Authorization: Bearer &lt;токен&gt;</code> и телом <code>{`{"reviews":[{"source":"Яндекс.Карты","name":"…","date":"…","text":"…","url":"…"}]}`}</code>. Токен задаётся переменной окружения <code>REVIEWS_INGEST_TOKEN</code>; повторы отсекаются сами.</p>
          </details>
        </>
      )}

      {tab === "site" && (
        <>
          <h2 className="ad-h2">Добавлены через админку ({pub.length})</h2>
          {!pub.length && <p className="ad-muted">Пока нет.</p>}
          {pub.map((r) => (
            <Card key={r.id} r={{ source: r.source, name: r.name, date: r.date_text, text: r.text, url: r.url || SOURCE_URL[r.source] }}>
              {write && <Btn op="unpublish" id={r.id} warn>Снять с сайта</Btn>}
            </Card>
          ))}
          <h2 className="ad-h2">Из первоначальных отзывов сайта ({file.length - hiddenKeys.size})</h2>
          {file.filter((r) => !hiddenKeys.has(reviewKey(r))).map((r) => (
            <Card key={reviewKey(r)} r={r}>
              {write && <Btn op="hide" k={reviewKey(r)} warn extra={{ name: r.name, date: r.date, source: r.source, text: r.text, url: r.url ?? "" }}>Скрыть с сайта</Btn>}
            </Card>
          ))}
        </>
      )}

      {tab === "off" && (
        <>
          {!ign.length && !hid.length && <p className="ad-card ad-muted">Пусто.</p>}
          {ign.map((r) => (
            <Card key={r.id} r={{ source: r.source, name: r.name, date: r.date_text, text: r.text, url: r.url || SOURCE_URL[r.source], badge: "игнор" }}>
              {write && <><Btn op="publish" id={r.id} main>Опубликовать</Btn><Btn op="restore" id={r.id}>Вернуть в «Новые»</Btn></>}
            </Card>
          ))}
          {hid.map((r) => (
            <Card key={r.id} r={{ source: r.source, name: r.name, date: r.date_text, text: r.text, url: r.url || SOURCE_URL[r.source], badge: "скрыт с сайта" }}>
              {write && <Btn op="show" k={r.key} main>Вернуть на сайт</Btn>}
            </Card>
          ))}
        </>
      )}

      {tab === "add" && (
        <form action={addReviewAction} className="ad-card ad-form">
          <fieldset disabled={!write}>
            <label>Источник
              <select name="source" required>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select>
            </label>
            <label>Имя автора<input name="name" required maxLength={120} /></label>
            <label>Дата, как в источнике<input name="date" placeholder="например, 5 октября 2026" maxLength={60} /></label>
            <label>Текст отзыва<textarea name="text" rows={5} required maxLength={5000} /></label>
            <label>Ссылка на этот отзыв в источнике<input name="url" type="url" placeholder="https://… (если пусто, откроется страница отзывов источника)" /></label>
            <label className="ad-check"><input type="checkbox" name="publish" value="1" defaultChecked /> Сразу показать на сайте</label>
            <div><button className="ad-btn ad-btn-main" type="submit">Добавить</button></div>
          </fieldset>
        </form>
      )}
    </Shell>
  );
}
