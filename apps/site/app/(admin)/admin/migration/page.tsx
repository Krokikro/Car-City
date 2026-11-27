import Link from "next/link";
import { Shell } from "@/components/admin/Shell";
import { requireUser } from "@/lib/admin/auth";
import { can } from "@/lib/admin/roles";
import { baseline, lastLive, quickCheck, type Verdict } from "@/lib/admin/migration";
import { getSeo } from "@/lib/admin/store";
import { fmt } from "@/lib/admin/format";
import { q1 } from "@/lib/db";
import { adoptOldMetaAction, fixMissingAction, runLiveCheckAction } from "../actions-site";

export const dynamic = "force-dynamic";
export const maxDuration = 120;
export const metadata = { title: "Переезд сайта" };

const V: Record<Verdict, [string, string]> = {
  ok: ["Открывается по тому же адресу", "st-issued"],
  redirect: ["Перенаправляется (301)", "st-qual"],
  missing: ["Страницы нет — нужен редирект", "st-lost"],
  gone: ["Удалена (410)", "st-call"],
  loop: ["Петля редиректов", "st-lost"],
};

export default async function Migration({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string; f?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser({ section: "migration" });
  const write = can(user, "migration", "write");
  const seoWrite = can(user, "seo", "write") && write;
  const redWrite = can(user, "redirects", "write");
  const b = baseline();
  const checks = await quickCheck();
  const live = await lastLive();
  const seo = await getSeo();
  const nf = await q1<{ n: string }>("SELECT count(*) n FROM not_found WHERE NOT ignored AND last_at > now() - interval '7 days'");
  const count = (v: Verdict) => checks.filter((c) => c.verdict === v).length;
  const diffT = checks.filter((c) => c.titleSame === false).length;
  const diffD = checks.filter((c) => c.descSame === false).length;
  const list = checks.filter((c) => !sp.f || (sp.f === "bad" ? c.verdict === "missing" || c.verdict === "loop" : sp.f === "meta" ? c.titleSame === false || c.descSame === false : c.verdict === sp.f));
  const liveBad = [...live.values()].filter((x) => x.result.finalStatus !== 200).length;
  const lastAt = [...live.values()].map((x) => x.at).sort().pop();

  const checklist: [boolean | null, string, string][] = [
    [count("missing") === 0 && count("loop") === 0, "Все старые адреса открываются или перенаправлены", `пропало: ${count("missing")}, петель: ${count("loop")}`],
    [diffT === 0, "Title совпадают со старым сайтом", diffT ? `отличаются: ${diffT} — можно вернуть старые одной кнопкой` : "совпадают"],
    [diffD === 0, "Description совпадают со старым сайтом", diffD ? `отличаются: ${diffD}` : "совпадают"],
    [seo.canonicalOrigin === "https://car-city.pro", "Основной адрес — https://car-city.pro", seo.canonicalOrigin],
    [seo.indexHosts.includes("car-city.pro"), "car-city.pro разрешён к индексации", seo.indexHosts.join(", ")],
    [!seo.noindexAll, "Сайт не закрыт от индексации целиком", seo.noindexAll ? "закрыт — снимите галочку в SEO → Основное" : "открыт"],
    [Boolean(seo.yandexVerification && seo.googleVerification), "Коды Яндекс.Вебмастера и Google Search Console", "перенесены со старого сайта"],
    [seo.metrikaId === "96752669", "Тот же счётчик Метрики (96752669)", seo.metrikaId || "не задан"],
    [seo.lowercaseRedirect && seo.wwwRedirect, "Заглавные → строчные и www → без www", seo.lowercaseRedirect && seo.wwwRedirect ? "включено" : "проверьте SEO → Основное"],
    [null, "Файлы старого сайта по тем же адресам", `${b?.files.length ?? 0} PDF и ${b?.images.length ?? 0} картинок из image_sitemap.xml лежат по старым путям`],
    [live.size ? liveBad === 0 : null, "Живая проверка адресов", live.size ? `${live.size} проверено, ${liveBad} с ошибкой · ${lastAt ? fmt(lastAt, true) : ""}` : "ещё не запускалась"],
  ];

  return (
    <Shell user={user} active="migration" title="Переезд с car-city.pro" sub={b ? `Снимок старого сайта: ${b.pages.length} адресов, ${fmt(b.takenAt, true)}` : "Снимка старого сайта нет"} flash={sp}
      actions={write ? <form action={runLiveCheckAction}><button className="pnl-btn pnl-btn-main" type="submit" title="Запросить каждый старый адрес у нового сайта, как это сделает робот">Проверить все адреса</button></form> : undefined}>
      {!b && <p className="pnl-msg pnl-err">Нет файла content/seo/baseline.json. Снимите его: <code>node scripts/seo-baseline.mjs</code></p>}
      <div className="pnl-stats">
        <Link href="/admin/migration?f=ok" className="pnl-stat"><b>{count("ok")}</b><span>открываются как раньше</span></Link>
        <Link href="/admin/migration?f=redirect" className="pnl-stat"><b>{count("redirect")}</b><span>перенаправлены</span></Link>
        <Link href="/admin/migration?f=bad" className="pnl-stat"><b className={count("missing") ? "warn" : ""}>{count("missing") + count("loop")}</b><span>потеряны</span></Link>
        <Link href="/admin/migration?f=meta" className="pnl-stat"><b>{diffT + diffD}</b><span>отличий в title/description</span></Link>
        {can(user, "redirects", "read") && <Link href="/admin/redirects?tab=404" className="pnl-stat"><b>{nf?.n ?? 0}</b><span>адресов 404 за неделю</span></Link>}
      </div>

      <section className="pnl-card">
        <h2>Готовность к переезду</h2>
        <ul className="pnl-checklist">
          {checklist.map(([ok, t, d]) => <li key={t} className={ok === null ? "info" : ok ? "ok" : "bad"}><b>{t}</b><span>{d}</span></li>)}
        </ul>
        {seoWrite && (diffT > 0 || diffD > 0) && (
          <form action={adoptOldMetaAction} className="pnl-tools-row">
            <input type="hidden" name="what" value="both" />
            <button className="pnl-btn pnl-btn-main" type="submit">Вернуть старые title и description везде, где отличаются</button>
            <span className="pnl-muted">Сниппеты в выдаче останутся прежними. Потом их можно менять по одной странице в SEO.</span>
          </form>
        )}
      </section>

      <details className="pnl-card">
        <summary>День переезда: что сделать по шагам</summary>
        <ol className="pnl-steps">
          <li>Проверить здесь, что потерянных адресов 0, нажать «Проверить все адреса» — ошибок 0.</li>
          <li>В Railway в сервисе Car-City добавить домены car-city.pro и www.car-city.pro (Settings → Networking → Custom Domain), записать выданные DNS-записи.</li>
          <li>У регистратора домена заменить A/CNAME-записи на записи Railway. TTL заранее снизить до 300 секунд, чтобы переключение заняло минуты.</li>
          <li>Дождаться сертификата HTTPS в Railway (зелёная галочка у домена), открыть https://car-city.pro и https://www.car-city.pro — второй должен перенаправить на первый.</li>
          <li>Открыть /robots.txt и /sitemap.xml на car-city.pro — robots.txt не должен запрещать сайт целиком.</li>
          <li>Яндекс.Вебмастер: «Индексирование → Переобход страниц» — отправить главную и разделы; «Файлы Sitemap» — sitemap.xml и image_sitemap.xml. Права уже подтверждены перенесённым кодом.</li>
          <li>Google Search Console: отправить sitemap.xml, проверить главную через «Проверку URL».</li>
          <li>Метрика: в счётчике 96752669 проверить, что визиты идут (после согласия на cookie).</li>
          <li>Первые 2–3 недели раз в день смотреть «Редиректы и 404» и закрывать новые 404 редиректами; в Вебмастере — «Страницы в поиске» и «Исключённые».</li>
          <li>Старый хостинг не отключать ещё месяц: при проблеме DNS можно вернуть за минуты.</li>
        </ol>
      </details>

      <div className="pnl-table-wrap">
        <table className="pnl-table pnl-mig">
          <thead><tr><th>Старый адрес</th><th>На новом сайте</th><th>Title / description: было → стало</th><th>Живая проверка</th></tr></thead>
          <tbody>
            {list.map((c) => {
              const l = live.get(c.path);
              const [vt, vc] = V[c.verdict];
              return (
                <tr key={c.path} id={encodeURIComponent(c.path)}>
                  <td><code>{c.path}</code><br /><span className="pnl-muted">было: {c.old.status}{c.old.inSitemap ? " · в sitemap" : ""}</span></td>
                  <td>
                    <em className={`st ${vc}`}>{vt}</em>
                    {c.hops.length > 0 && <><br /><span className="pnl-muted">→ {c.hops.join(" → ")}</span></>}
                    {c.verdict === "missing" && redWrite && (
                      <form action={fixMissingAction} className="pnl-inline">
                        <input type="hidden" name="from" value={c.path} />
                        <input name="to" placeholder="/куда-вести" required className="pnl-inline-l" />
                        <button className="pnl-btn pnl-btn-sm pnl-btn-main" type="submit">301</button>
                      </form>
                    )}
                  </td>
                  <td className="pnl-meta-cmp">
                    {c.titleSame !== undefined ? (
                      <>
                        <span className={c.titleSame ? "same" : "diff"}><b>T:</b> {c.titleSame ? c.newTitle : <>{c.old.title} <i>→</i> {c.newTitle}</>}</span>
                        <span className={c.descSame ? "same" : "diff"}><b>D:</b> {c.descSame ? (c.newDescription || "—").slice(0, 140) : <>{(c.old.description || "—").slice(0, 120)} <i>→</i> {(c.newDescription || "—").slice(0, 120)}</>}</span>
                        {seoWrite && (c.titleSame === false || c.descSame === false) && (
                          <form action={adoptOldMetaAction}><input type="hidden" name="path" value={c.path} /><input type="hidden" name="what" value="both" /><button className="pnl-btn pnl-btn-sm" type="submit">Вернуть как было</button></form>
                        )}
                      </>
                    ) : <span className="pnl-muted">—</span>}
                  </td>
                  <td>
                    {l ? (
                      <>
                        <em className={`st ${l.result.finalStatus === 200 ? "st-issued" : "st-lost"}`}>{l.result.status}{l.result.status !== l.result.finalStatus ? ` → ${l.result.finalStatus}` : ""}</em>
                        {l.result.final && l.result.final !== c.path && <><br /><span className="pnl-muted">{l.result.final}</span></>}
                        {(l.result.robots?.includes("noindex") || l.result.xRobots?.includes("noindex")) && <><br /><em className="st st-call" title="На служебном адресе это нормально; на car-city.pro — нет">noindex{l.result.xRobots ? " (заголовок)" : ""}</em></>}
                        <br /><span className="pnl-muted">{l.result.ms} мс</span>
                      </>
                    ) : <span className="pnl-muted">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
