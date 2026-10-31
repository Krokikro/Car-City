import Link from "next/link";
import { Shell } from "@/components/admin/Shell";
import { requireUser } from "@/lib/admin/auth";
import { can } from "@/lib/admin/roles";
import { getSeo } from "@/lib/admin/store";
import { refreshOverlay } from "@/lib/admin/overlay";
import { allDocs } from "@/lib/docs";
import { LANGS, type Lang } from "@/lib/i18n";
import { buildMeta, langPath, seoOf } from "@/lib/seo";
import { defaultRobots } from "@/lib/hosts";
import { FREQS, PAGE_TYPE_NAMES, pageType, type PageType } from "@/lib/site-settings";
import { homeMeta } from "@/lib/meta";
import { saveSeoAction } from "../actions-site";
import { LIM } from "@/lib/admin/limits";

export const dynamic = "force-dynamic";
export const metadata = { title: "SEO" };

const TABS = [
  ["general", "Основное"], ["pages", "Страницы"], ["templates", "Шаблоны"], ["counters", "Счётчики и верификация"], ["robots", "robots.txt"], ["sitemap", "Sitemap"],
] as const;
const LANG_NAMES: Record<string, string> = { ru: "Русский", en: "English", ky: "Кыргызча", kk: "Қазақша", uz: "O‘zbekcha" };

export default async function Seo({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string; tab?: string; lang?: string; q?: string; f?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser({ section: "seo" });
  const write = can(user, "seo", "write");
  const tab = TABS.some(([k]) => k === sp.tab) ? sp.tab! : "general";
  const s = await getSeo();
  const Tabs = (
    <div className="ad-tabs">{TABS.map(([k, n]) => <Link key={k} href={`/admin/seo?tab=${k}`} className={k === tab ? "on" : ""}>{n}</Link>)}</div>
  );
  const Save = write ? <button className="ad-btn ad-btn-main" type="submit">Сохранить</button> : null;

  let body: React.ReactNode = null;
  if (tab === "general") {
    body = (
      <form action={saveSeoAction} className="ad-form">
        <input type="hidden" name="tab" value="general" />
        <fieldset disabled={!write} className="ad-plain">
          <section className="ad-card">
            <h2>Домен и индексация</h2>
            <label>Основной адрес сайта<input name="canonicalOrigin" maxLength={LIM.origin} defaultValue={s.canonicalOrigin} required /><small>На него указывают canonical, sitemap, hreflang и Open Graph. Для переезда — https://car-city.pro, как у старого сайта.</small></label>
            <label>Домены, которые можно индексировать<textarea name="indexHosts" rows={2} maxLength={LIM.hosts} defaultValue={s.indexHosts.join("\n")} /><small>По одному в строке. На всех остальных адресах (служебные адреса Railway, копии под опрос) сайт закрыт от поисковиков: noindex и запрет в robots.txt — чтобы не было дублей.</small></label>
            <label className="ad-check"><input type="checkbox" name="wwwRedirect" defaultChecked={s.wwwRedirect} /> www.car-city.pro → car-city.pro (301)</label>
            <label className="ad-check"><input type="checkbox" name="lowercaseRedirect" defaultChecked={s.lowercaseRedirect} /> Адреса с заглавными буквами → строчные (301), как делал старый сайт</label>
            <label className="ad-check"><input type="checkbox" name="hreflang" defaultChecked={s.hreflang} /> hreflang-ссылки на переводы (en, ky, kk, uz)</label>
            <label className="ad-check"><input type="checkbox" name="orgLd" defaultChecked={s.orgLd} /> Микроразметка организации на главной</label>
            <label className="ad-check ad-danger"><input type="checkbox" name="noindexAll" defaultChecked={s.noindexAll} /> Закрыть весь сайт от индексации (только на время работ!)</label>
          </section>
          <section className="ad-card">
            <h2>Заголовки и описания по умолчанию</h2>
            <label>Название сайта<input name="siteName" maxLength={LIM.siteName} defaultValue={s.siteName} /><small>Для Open Graph и шаблона title</small></label>
            <label>Шаблон title<input name="titleTemplate" maxLength={LIM.titleTemplate} defaultValue={s.titleTemplate} placeholder="%s — Car City" /><small>Пусто — title как в тексте страницы (так сейчас: заголовки перенесены со старого сайта без изменений). %s — заголовок страницы. Не применяется к title, заданным вручную.</small></label>
            <label>Description по умолчанию<textarea name="defaultDescription" rows={2} maxLength={LIM.description} data-warn={LIM.descriptionWarn} defaultValue={s.defaultDescription} /><small>Для страниц без своего описания</small></label>
            <label>Картинка для соцсетей по умолчанию<input name="ogImage" maxLength={LIM.ogImage} defaultValue={s.ogImage} /><small>Путь (/video/hero-poster.webp) или адрес картинки из медиатеки</small></label>
            <label>Карточка Twitter/X<select name="twitterCard" defaultValue={s.twitterCard}><option value="summary_large_image">Большая картинка</option><option value="summary">Маленькая</option></select></label>
            {Save}
          </section>
        </fieldset>
      </form>
    );
  } else if (tab === "templates") {
    body = (
      <form action={saveSeoAction} className="ad-form">
        <input type="hidden" name="tab" value="templates" />
        <fieldset disabled={!write} className="ad-plain">
          <section className="ad-card">
            <h2>Шаблоны по типу страницы</h2>
            <p className="ad-muted">Применяются к страницам без title/description, заданных вручную. Пусто — используется текст страницы (для переезда так надёжнее: заголовки совпадают со старым сайтом). Подстановки: <code>{"{title}"}</code> исходный title, <code>{"{h1}"}</code>, <code>{"{name}"}</code> модель, <code>{"{price}"}</code> цена «от» в сутки.</p>
            {(Object.keys(PAGE_TYPE_NAMES) as PageType[]).map((k) => (
              <div key={k} className="ad-tpl">
                <h3>{PAGE_TYPE_NAMES[k]}</h3>
                <label>Title<input name={`t:${k}`} maxLength={LIM.tplTitle} defaultValue={s.templates[k]?.title ?? ""} placeholder={k === "model" ? "{name} в аренду под такси от {price} ₽/сутки — Car City" : ""} /></label>
                <label>Description<input name={`d:${k}`} maxLength={LIM.tplDescription} defaultValue={s.templates[k]?.description ?? ""} /></label>
              </div>
            ))}
            {Save}
          </section>
        </fieldset>
      </form>
    );
  } else if (tab === "counters") {
    body = (
      <form action={saveSeoAction} className="ad-form">
        <input type="hidden" name="tab" value="counters" />
        <fieldset disabled={!write} className="ad-plain">
          <section className="ad-card">
            <h2>Подтверждение прав (верификация)</h2>
            <p className="ad-muted">Коды перенесены со старого car-city.pro: Яндекс.Вебмастер и Google Search Console продолжат считать сайт подтверждённым после переезда.</p>
            <label>Яндекс (yandex-verification)<input name="yandexVerification" maxLength={LIM.verification} defaultValue={s.yandexVerification} /></label>
            <label>Google (google-site-verification)<input name="googleVerification" maxLength={LIM.verification} defaultValue={s.googleVerification} /></label>
            <label>Bing (msvalidate.01)<input name="bingVerification" maxLength={LIM.verification} defaultValue={s.bingVerification} /></label>
            <label>Mail.ru (pmail-verification)<input name="mailruVerification" maxLength={LIM.verification} defaultValue={s.mailruVerification} /></label>
          </section>
          <section className="ad-card">
            <h2>Счётчики</h2>
            <p className="ad-muted">Включаются только после согласия посетителя на аналитику (баннер cookie). Номер Метрики — тот же, что на старом сайте: история посещений и цели сохранятся.</p>
            <label>Яндекс Метрика, номер счётчика<input name="metrikaId" maxLength={LIM.counterId} defaultValue={s.metrikaId} inputMode="numeric" /></label>
            <label>Google Analytics 4<input name="gaId" maxLength={LIM.counterId} defaultValue={s.gaId} placeholder="G-XXXXXXX" /></label>
            <label>Google Tag Manager<input name="gtmId" maxLength={LIM.counterId} defaultValue={s.gtmId} placeholder="GTM-XXXXXX" /></label>
          </section>
          <section className="ad-card">
            <h2>Свой код в &lt;head&gt;</h2>
            <p className="ad-muted">Мета-теги, ссылки и скрипты на всех страницах (пиксели, чаты, проверка прав другими сервисами).{user.role !== "admin" && " Менять может только администратор."}</p>
            <label>Код<textarea name="headHtml" rows={6} maxLength={LIM.headHtml} defaultValue={s.headHtml} disabled={user.role !== "admin"} className="ad-mono" placeholder={'<meta name="..." content="..." />'} /></label>
            {Save}
          </section>
        </fieldset>
      </form>
    );
  } else if (tab === "robots") {
    body = (
      <form action={saveSeoAction} className="ad-form">
        <input type="hidden" name="tab" value="robots" />
        <fieldset disabled={!write} className="ad-plain">
          <section className="ad-card">
            <h2>robots.txt</h2>
            <p className="ad-muted">Пусто — собирается автоматически (ниже). На служебных адресах Railway сайт всегда закрыт целиком, независимо от этого текста. <a href="/robots.txt" target="_blank" rel="noreferrer">Открыть robots.txt ↗</a></p>
            <label>Свой текст<textarea name="robotsTxt" rows={14} maxLength={LIM.robotsTxt} defaultValue={s.robotsTxt} className="ad-mono" placeholder="Пусто — автоматически" /></label>
            <details><summary>Автоматический вариант</summary><pre className="ad-pre">{defaultRobots(s)}</pre></details>
            {write && <p className="ad-tools-row">{Save}<label className="ad-check"><input type="checkbox" name="reset" /> Вернуть автоматический</label></p>}
          </section>
        </fieldset>
      </form>
    );
  } else if (tab === "sitemap") {
    body = (
      <form action={saveSeoAction} className="ad-form">
        <input type="hidden" name="tab" value="sitemap" />
        <fieldset disabled={!write} className="ad-plain">
          <section className="ad-card">
            <h2>Sitemap</h2>
            <p className="ad-muted">Адреса те же, что на старом сайте: <a href="/sitemap.xml" target="_blank" rel="noreferrer">/sitemap.xml ↗</a> и <a href="/image_sitemap.xml" target="_blank" rel="noreferrer">/image_sitemap.xml ↗</a>. Страницы с noindex, своим canonical на другой адрес или исключённые вручную в карту не попадают.</p>
            <p><b>Языки</b></p>
            <div className="ad-tools-row">{LANGS.map((l) => <label key={l} className="ad-check"><input type="checkbox" name={`lang:${l}`} defaultChecked={s.sitemap.langs.includes(l)} disabled={l === "ru"} /> {LANG_NAMES[l]}</label>)}</div>
            <label className="ad-check"><input type="checkbox" name="images" defaultChecked={s.sitemap.images} /> Карта картинок (image_sitemap.xml)</label>
            <label>Исключить адреса<textarea name="exclude" rows={4} maxLength={LIM.sitemapExclude} defaultValue={s.sitemap.exclude.join("\n")} className="ad-mono" /><small>По одному в строке, можно маской: /novosti/*</small></label>
            <table className="ad-table">
              <thead><tr><th>Тип страниц</th><th>Приоритет</th><th>Частота изменения</th></tr></thead>
              <tbody>
                {(Object.keys(PAGE_TYPE_NAMES) as PageType[]).map((k) => (
                  <tr key={k}>
                    <td>{PAGE_TYPE_NAMES[k]}</td>
                    <td><input name={`p:${k}`} defaultValue={s.sitemap.priority[k]} inputMode="decimal" className="ad-num" /></td>
                    <td><select name={`c:${k}`} defaultValue={s.sitemap.changefreq[k]}>{FREQS.map((x) => <option key={x}>{x}</option>)}</select></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {Save}
          </section>
        </fieldset>
      </form>
    );
  } else {
    // страницы: итоговые title/description, длины, дубли, noindex — и переход к ручной настройке
    const lang: Lang = (LANGS as readonly string[]).includes(sp.lang ?? "") ? (sp.lang as Lang) : "ru";
    const ov = await refreshOverlay();
    const docs = allDocs(lang, ov);
    const h = homeMeta(lang);
    const rows = [
      { path: "/", kind: "page", title: String((h.title as { absolute: string }).absolute), description: String(h.description), h1: "" },
      ...[...docs.values()].filter((d) => lang === "ru" || d.lang === lang).map((d) => ({ path: d.path, kind: d.kind, title: d.title, description: d.description ?? "", h1: d.h1 })),
    ].map((d) => {
      const m = buildMeta({ ov, lang, path: d.path, title: d.title, description: d.description, h1: d.h1, kind: d.kind });
      const ps = seoOf(ov, lang, d.path);
      return { ...d, type: pageType(d.path.toLowerCase(), d.kind), t: String((m.title as { absolute: string }).absolute), ds: String(m.description ?? ""), manual: Object.keys(ps).length > 0, noindex: Boolean(ps.noindex || s.noindexAll), canonical: ps.canonical };
    });
    const dupT = new Map<string, number>(), dupD = new Map<string, number>();
    rows.forEach((r) => { dupT.set(r.t, (dupT.get(r.t) ?? 0) + 1); dupD.set(r.ds, (dupD.get(r.ds) ?? 0) + 1); });
    const problems = (r: (typeof rows)[number]) => [
      r.t.length > 70 && "title длинный",
      r.t.length < 20 && "title короткий",
      !r.ds && "нет description",
      r.ds.length > 170 && "description длинный",
      (dupT.get(r.t) ?? 0) > 1 && "дубль title",
      r.ds && (dupD.get(r.ds) ?? 0) > 1 && "дубль description",
    ].filter(Boolean) as string[];
    const qq = (sp.q ?? "").toLowerCase();
    const list = rows.filter((r) => (!qq || `${r.path} ${r.t}`.toLowerCase().includes(qq)) && (sp.f !== "bad" || problems(r).length) && (sp.f !== "manual" || r.manual));
    const bad = rows.filter((r) => problems(r).length).length;
    body = (
      <>
        <div className="ad-tools">
          <div className="ad-tabs">{LANGS.map((l) => <Link key={l} href={`/admin/seo?tab=pages&lang=${l}`} className={l === lang ? "on" : ""}>{LANG_NAMES[l]}</Link>)}</div>
          <form className="ad-filter" action="/admin/seo">
            <input type="hidden" name="tab" value="pages" /><input type="hidden" name="lang" value={lang} />
            <input name="q" placeholder="Адрес или title" defaultValue={sp.q} />
            <select name="f" defaultValue={sp.f ?? ""}><option value="">Все ({rows.length})</option><option value="bad">С замечаниями ({bad})</option><option value="manual">С ручными настройками</option></select>
            <button className="ad-btn" type="submit">Показать</button>
          </form>
        </div>
        <div className="ad-table-wrap">
          <table className="ad-table ad-seo-table">
            <thead><tr><th>Адрес</th><th>Title и description на сайте</th><th>Замечания</th><th></th></tr></thead>
            <tbody>
              {list.map((r) => {
                const pr = problems(r);
                return (
                  <tr key={r.path}>
                    <td><code>{langPath(r.path, lang)}</code><br /><span className="ad-muted">{PAGE_TYPE_NAMES[r.type]}</span>{r.manual && <> · <em className="st st-qual">ручное SEO</em></>}{r.noindex && <> · <em className="st st-lost">noindex</em></>}</td>
                    <td><b>{r.t}</b> <span className={r.t.length > 70 ? "warn" : "ad-muted"}>({r.t.length})</span><br /><span className="ad-muted">{r.ds || "—"} ({r.ds.length})</span></td>
                    <td>{pr.map((p) => <em key={p} className="st st-call">{p}</em>)}</td>
                    <td><Link className="ad-btn ad-btn-sm" href={`/admin/seo/page?lang=${lang}&path=${encodeURIComponent(r.path)}`}>{write ? "Настроить" : "Открыть"}</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  return (
    <Shell user={user} active="seo" title="SEO" sub="Всё для поисковиков: мета-теги, индексация, robots.txt, sitemap, счётчики. Изменения действуют сразу." flash={sp}>
      {Tabs}
      {body}
    </Shell>
  );
}
