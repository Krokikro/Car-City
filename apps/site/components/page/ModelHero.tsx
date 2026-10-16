import type { Btn } from "@/lib/blocks";
import { Crumbs, Buttons } from "./PageParts";
import { ModelStage } from "./ModelStage";
import { href, type Lang } from "@/lib/i18n";
import { ui } from "@/lib/ui";
import type { Panels } from "@/lib/model-panels";

// значки к строкам «Деталей»: по названию характеристики
const DETAIL_ICONS: [RegExp, string][] = [
  [/двигат|engine|қозғалт|кыймылдаткыч|dvigatel/i, "M4 10h2V8h3V6h6v2h2l2 3h1v6h-1l-2 2H9l-2-2H6v-3H4z"],
  [/короб|кпп|gear|transm|беріл|uzat/i, "M6 5v14M12 5v14M18 5v7H6"],
  [/год|year|жыл|yil/i, "M5 5h14v15H5zM5 10h14M9 3v4M15 3v4"],
  [/расход|fuel|отын|күйүүчү|yoqilg/i, "M6 20V5a1 1 0 011-1h7a1 1 0 011 1v15M4 20h13M15 9h2l2 2v6a1.5 1.5 0 01-3 0v-3h-2M8 8h5"],
  [/привод|drive|жетек|айдоо|uzatma|privod/i, "M12 3a9 9 0 100 18 9 9 0 000-18zM12 9a3 3 0 100 6 3 3 0 000-6zM12 3v6M12 15v6M3 12h6M15 12h6"],
  [/график|schedule|кесте|график|jadval/i, "M12 8v4l3 2M12 21a9 9 0 100-18 9 9 0 000 18z"],
  [/класс|class|сынып|класс|sinf/i, "M12 3l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.3l6-.8z"],
];
const DetailIco = ({ k }: { k: string }) => {
  const d = DETAIL_ICONS.find(([re]) => re.test(k))?.[1] ?? "M5 12l4 4 10-10";
  return <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
};

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
                {p.panels.details.map(([k, v]) => <div key={k}><dt><DetailIco k={k} />{k}</dt><dd>{v}</dd></div>)}
              </dl>
            </section>
          )}
        </div>
      )}
    </section>
  );
}
