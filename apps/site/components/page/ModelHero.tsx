import type { Btn } from "@/lib/blocks";
import { Crumbs, Buttons } from "./PageParts";
import { ModelStage } from "./ModelStage";
import { href, type Lang } from "@/lib/i18n";
import { ui } from "@/lib/ui";
import type { Panels } from "@/lib/model-panels";

export function ModelHero(p: {
  h1: string; name: string; slug: string; cls?: string; mode?: "arenda" | "vykup"; twin?: string; path: string;
  crumbs: string[]; specs: string[]; price?: string; btns: Btn[]; gallery: string[]; lang?: Lang; panels?: Panels;
}) {
  const lang = p.lang ?? "ru";
  const t = ui(lang);
  const priceNum = p.price?.match(/(\d[\d\s]*\d|\d)/)?.[1].replace(/\s/g, "");
  const priceTail = p.price?.replace(/^[^\d]*[\d\s]+/, "").trim();
  return (
    <section className="mdl-hero" aria-labelledby="pg-h1">
      <div className="mdl-glow" aria-hidden="true" />
      <div className="wrap mdl-grid">
        <div className="mdl-copy">
          <Crumbs items={p.crumbs} path={p.path} lang={lang} />
          <div className="mdl-switch" role="tablist" aria-label={t.mode}>
            {(["arenda", "vykup"] as const).map((m) => {
              const on = p.mode === m;
              const to = on || !p.twin ? undefined : href(p.twin, lang);
              const label = m === "arenda" ? t.rent : t.buy;
              return to ? <a key={m} href={to} role="tab" aria-selected="false">{label}</a> : <span key={m} role="tab" aria-selected={on} aria-disabled={!on}>{label}</span>;
            })}
          </div>
          <p className="mono eyebrow">{p.cls ? t.cls[p.cls] ?? p.cls : "Car City"}</p>
          <h1 id="pg-h1" className="display mdl-h1" data-split>{p.h1}</h1>
          {p.specs.length > 0 && !p.panels?.details.length && (
            <ul className="mdl-specs" data-reveal-stagger>
              {p.specs.map((s) => <li key={s}>{s}</li>)}
            </ul>
          )}
          {p.price && (
            <p className="mdl-price" data-reveal>
              {t.from && <span className="mono">{t.from}</span>}
              {priceNum ? <b data-count={priceNum} data-suffix=" ₽">{Number(priceNum).toLocaleString("ru-RU")} ₽</b> : <b>{p.price}</b>}
              {priceTail && <small>{priceTail.replace(/^₽\s*/, "")}</small>}
            </p>
          )}
          <Buttons btns={p.btns} />
        </div>
        <ModelStage name={p.name} slug={p.slug} />
      </div>
      {p.panels && (p.panels.price || p.panels.details.length > 0) && (
        <div className="wrap mdl-panels" data-reveal-stagger>
          {p.panels.price && (
            <section className="mp mp-price" aria-label="Цена">
              <p className="mp-title mono">{p.mode === "vykup" ? "Условия выкупа" : "Цена аренды"}</p>
              <table>
                <thead><tr>{p.panels.price.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {p.panels.price.rows.map((r, i) => (
                    <tr key={i}>{r.map((c, j) => (j === 0 ? <th key={j} scope="row" dangerouslySetInnerHTML={{ __html: c }} /> : <td key={j} dangerouslySetInnerHTML={{ __html: c }} />))}</tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
          {p.panels.details.length > 0 && (
            <section className="mp mp-details" aria-label="Детали">
              <p className="mp-title mono">Детали</p>
              <dl>
                {p.panels.details.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
              </dl>
            </section>
          )}
        </div>
      )}
    </section>
  );
}
