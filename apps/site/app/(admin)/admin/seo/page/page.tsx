import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/admin/Shell";
import { requireUser } from "@/lib/admin/auth";
import { can } from "@/lib/admin/roles";
import { getPageSeo } from "@/lib/admin/store";
import { refreshOverlay } from "@/lib/admin/overlay";
import { getDoc } from "@/lib/docs";
import { isLang, type Lang } from "@/lib/i18n";
import { buildMeta, langPath } from "@/lib/seo";
import { FREQS, pageType, PAGE_TYPE_NAMES } from "@/lib/site-settings";
import { homeMeta } from "@/lib/meta";
import { baseline } from "@/lib/admin/migration";
import { savePageSeoAction } from "../../actions-site";
import { LIM } from "@/lib/admin/limits";

export const dynamic = "force-dynamic";
export const metadata = { title: "SEO страницы" };

export default async function PageSeoEdit({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string; lang?: string; path?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser({ section: "seo" });
  const write = can(user, "seo", "write");
  const lang: Lang = isLang(sp.lang) ? sp.lang : "ru";
  const path = sp.path || "/";
  const ov = await refreshOverlay();
  const doc = path === "/" ? null : getDoc(path, lang, ov);
  if (path !== "/" && !doc) notFound();
  const h = homeMeta(lang);
  const base = doc ? { title: doc.title, description: doc.description ?? "", h1: doc.h1, kind: doc.kind } : { title: String((h.title as { absolute: string }).absolute), description: String(h.description), h1: "", kind: "page" };
  const ps = await getPageSeo(lang, doc?.path ?? "/");
  const m = buildMeta({ ov, lang, path: doc?.path ?? "/", ...base });
  const finalTitle = String((m.title as { absolute: string }).absolute);
  const old = lang === "ru" ? baseline()?.pages.find((p) => p.path.toLowerCase() === (doc?.path ?? "/").toLowerCase() && p.status === 200) : undefined;
  const self = langPath(doc?.path ?? "/", lang);
  const type = pageType(self, base.kind);
  return (
    <Shell user={user} active="seo" title={`SEO: ${base.h1 || "Главная"}`} sub={`${self} · ${PAGE_TYPE_NAMES[type]}`} flash={sp}
      actions={<><Link className="pnl-btn" href={`/admin/seo?tab=pages&lang=${lang}`}>← Все страницы</Link>{doc && (can(user, "pages", "read") || can(user, "articles", "read")) && <Link className="pnl-btn" href={`/admin/content/edit?lang=${lang}&path=${encodeURIComponent(doc.path)}`}>Текст страницы</Link>}<a className="pnl-btn" href={self} target="_blank" rel="noreferrer">Открыть ↗</a></>}>
      <form action={savePageSeoAction} className="pnl-form">
        <input type="hidden" name="lang" value={lang} />
        <input type="hidden" name="path" value={doc?.path ?? "/"} />
        <fieldset disabled={!write} className="pnl-plain">
          <section className="pnl-card">
            <h2>В выдаче</h2>
            <div className="pnl-serp"><span className="pnl-serp-url">car-city.pro{self === "/" ? "" : self}</span><b>{finalTitle}</b><p>{String(m.description ?? "")}</p></div>
            <p className="pnl-muted">Пустые поля — значение из текста страницы: title «{base.title}», description «{base.description || "—"}».</p>
            <label>Title<input name="title" defaultValue={ps.title ?? ""} placeholder={base.title} maxLength={LIM.title} data-warn={LIM.titleWarn} /><small>До ~60–70 символов видно в выдаче</small></label>
            <label>Description<textarea name="description" rows={3} defaultValue={ps.description ?? ""} placeholder={base.description} maxLength={LIM.description} data-warn={LIM.descriptionWarn} /><small>До ~160 символов</small></label>
            <label>Keywords<input name="keywords" maxLength={LIM.keywords} defaultValue={ps.keywords ?? ""} /><small>Яндекс и Google почти не учитывают; можно оставить пустым</small></label>
            {old && (
              <div className="pnl-old">
                <b>На старом car-city.pro:</b>
                <p>title: {old.title || "—"}</p>
                <p>description: {old.description || "—"}</p>
                {old.h1 && <p>H1: {old.h1}</p>}
              </div>
            )}
          </section>
          <section className="pnl-card">
            <h2>Индексация</h2>
            <label>Canonical<input name="canonical" maxLength={LIM.canonical} defaultValue={ps.canonical ?? ""} placeholder={self} /><small>Пусто — адрес самой страницы. Заполняйте, только если эта страница — дубль другой.</small></label>
            <label className="pnl-check"><input type="checkbox" name="noindex" defaultChecked={ps.noindex} /> noindex — не показывать в поиске</label>
            <label className="pnl-check"><input type="checkbox" name="nofollow" defaultChecked={ps.nofollow} /> nofollow — не переходить по ссылкам</label>
            <label className="pnl-check"><input type="checkbox" name="noHreflang" defaultChecked={ps.noHreflang} /> Без hreflang-ссылок на переводы</label>
          </section>
          <section className="pnl-card">
            <h2>Sitemap</h2>
            <label className="pnl-check"><input type="checkbox" name="sitemapExclude" defaultChecked={ps.sitemapExclude} /> Не включать в sitemap.xml</label>
            <div className="pnl-tools-row">
              <label>Приоритет<input name="priority" defaultValue={ps.priority ?? ""} placeholder={String(ov.seo.sitemap.priority[type])} inputMode="decimal" className="pnl-num" /></label>
              <label>Частота<select name="changefreq" defaultValue={ps.changefreq ?? ""}><option value="">как у типа ({ov.seo.sitemap.changefreq[type]})</option>{FREQS.map((x) => <option key={x}>{x}</option>)}</select></label>
            </div>
          </section>
          <section className="pnl-card">
            <h2>Соцсети (Open Graph)</h2>
            <label>Заголовок<input name="ogTitle" maxLength={LIM.ogTitle} defaultValue={ps.ogTitle ?? ""} placeholder={finalTitle} /></label>
            <label>Описание<textarea name="ogDescription" rows={2} maxLength={LIM.ogDescription} defaultValue={ps.ogDescription ?? ""} /></label>
            <label>Картинка<input name="ogImage" maxLength={LIM.ogImage} defaultValue={ps.ogImage ?? ""} placeholder={ov.seo.ogImage} /><small>Путь на сайте или адрес картинки из медиатеки (/media/…)</small></label>
          </section>
          <section className="pnl-card">
            <h2>Микроразметка</h2>
            <p className="pnl-muted">Своя разметка schema.org (JSON-LD) в дополнение к автоматической: например, FAQPage, Product, Offer, Event.</p>
            <label>JSON-LD<textarea name="jsonLd" rows={8} maxLength={LIM.jsonLd} defaultValue={ps.jsonLd ?? ""} className="pnl-mono" placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  "mainEntity": []\n}'} /></label>
            {write && <button className="pnl-btn pnl-btn-main" type="submit">Сохранить</button>}
          </section>
        </fieldset>
      </form>
    </Shell>
  );
}
