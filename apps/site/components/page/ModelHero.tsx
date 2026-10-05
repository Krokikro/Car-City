import type { Btn } from "@/lib/blocks";
import { Crumbs, Buttons } from "./PageParts";
import { ModelStage } from "./ModelStage";
import { href, type Lang } from "@/lib/i18n";
import { ui } from "@/lib/ui";

export function ModelHero(p: {
  h1: string; name: string; slug: string; cls?: string; mode?: "arenda" | "vykup"; twin?: string; path: string;
  crumbs: string[]; specs: string[]; price?: string; btns: Btn[]; gallery: string[]; lang?: Lang;
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
          {p.specs.length > 0 && (
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
        <ModelStage name={p.name} slug={p.slug} gallery={p.gallery} />
      </div>
    </section>
  );
}
