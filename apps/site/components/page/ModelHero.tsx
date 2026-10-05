import type { Btn } from "@/lib/blocks";
import { Crumbs, Buttons } from "./PageParts";
import { ModelStage } from "./ModelStage";

const CLS: Record<string, string> = {
  ekonom: "Эконом", komfort: "Комфорт", "komfort-plyus": "Комфорт+", biznes: "Бизнес", gruzovoy: "Грузовой", dostavka: "Доставка",
};

export function ModelHero(p: {
  h1: string; name: string; slug: string; cls?: string; mode?: "arenda" | "vykup"; twin?: string; path: string;
  crumbs: string[]; specs: string[]; price?: string; btns: Btn[]; gallery: string[];
}) {
  const priceNum = p.price?.match(/от\s*([\d\s]+)/)?.[1].replace(/\s/g, "");
  const priceTail = p.price?.replace(/^от\s*[\d\s]+/, "").trim();
  return (
    <section className="mdl-hero" aria-labelledby="pg-h1">
      <div className="mdl-glow" aria-hidden="true" />
      <div className="wrap mdl-grid">
        <div className="mdl-copy">
          <Crumbs items={p.crumbs} path={p.path} />
          <div className="mdl-switch" role="tablist" aria-label="Формат">
            {(["arenda", "vykup"] as const).map((m) => {
              const on = p.mode === m;
              const href = on ? undefined : p.twin;
              const label = m === "arenda" ? "Аренда" : "Выкуп";
              return href ? <a key={m} href={href} role="tab" aria-selected="false">{label}</a> : <span key={m} role="tab" aria-selected={on} aria-disabled={!on}>{label}</span>;
            })}
          </div>
          <p className="mono eyebrow">{p.cls ? CLS[p.cls] ?? p.cls : "Car City"}</p>
          <h1 id="pg-h1" className="display mdl-h1" data-split>{p.h1}</h1>
          {p.specs.length > 0 && (
            <ul className="mdl-specs" data-reveal-stagger>
              {p.specs.map((s) => <li key={s}>{s}</li>)}
            </ul>
          )}
          {p.price && (
            <p className="mdl-price" data-reveal>
              <span className="mono">от</span>
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
