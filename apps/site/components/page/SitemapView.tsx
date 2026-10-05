import { allDocs, articles } from "@/lib/docs";
import { href, type Lang } from "@/lib/i18n";
import { ui } from "@/lib/ui";

export function SitemapView({ lang = "ru" }: { lang?: Lang }) {
  const t = ui(lang);
  const groups: [string, (p: string) => boolean][] = [
    [t.sections, (p) => !/^\/(vykup|klassyi-avtomobilej|novosti)\//.test(p)],
    [t.rent, (p) => p.startsWith("/klassyi-avtomobilej/")],
    [t.buy, (p) => p.startsWith("/vykup/")],
  ];
  const docs = [...allDocs(lang).values()].filter((d) => d.kind !== "article").sort((a, b) => a.path.localeCompare(b.path));
  return (
    <main id="main" className="pg">
      <section className="art-hero">
        <div className="art-hero-bg" aria-hidden="true" />
        <div className="wrap"><p className="mono eyebrow">Car City</p><h1 className="display-xl" data-split>{t.sitemap}</h1></div>
      </section>
      <section className="section pg-sec">
        <div className="wrap smap">
          {groups.map(([name, test], gi) => (
            <div key={name}>
              <h2 className="mono eyebrow">{name}</h2>
              <ul>
                {gi === 0 && <li><a href={href("/", lang)}>{t.home}</a></li>}
                {docs.filter((d) => test(d.path)).map((d) => <li key={d.path}><a href={href(d.path, lang)}>{d.h1}</a></li>)}
              </ul>
            </div>
          ))}
          <div>
            <h2 className="mono eyebrow">{t.news}</h2>
            <ul>{articles(lang).map((a) => <li key={a.path}><a href={href(a.path, lang)}>{a.h1}</a></li>)}</ul>
          </div>
        </div>
      </section>
    </main>
  );
}
