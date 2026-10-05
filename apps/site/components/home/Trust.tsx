import { href, type Lang } from "@/lib/i18n";
import { ruHome, type HomeText } from "@/lib/home-text";

export function Trust({ lang = "ru", t: trust = ruHome.trust }: { lang?: Lang; t?: HomeText["trust"] }) {
  const row = [...trust.owners, ...trust.owners];
  return (
    <section className="section trust" aria-labelledby="trust-title">
      <div className="wrap">
        <h2 id="trust-title" className="mono eyebrow">{trust.title}</h2>
        <div className="trust-stats">
          {trust.stats.map((s) => (
            <div key={s.label} className="trust-stat" data-reveal>
              <span className="trust-num"><span data-count={s.value} data-suffix={s.suffix}>{s.value.toLocaleString("ru-RU")}{s.suffix}</span></span>
              <span className="trust-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="owners" aria-label={trust.ctaTitle}>
        <div className="owners-row">
          {row.map((o, i) => (
            <figure key={i} className="owner" aria-hidden={i >= trust.owners.length || undefined}>
              <span className="owner-ph" aria-hidden="true">{o.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
              <figcaption><strong>{o.name}</strong><span>{o.car}</span></figcaption>
            </figure>
          ))}
        </div>
      </div>
      <div className="wrap trust-cta" data-reveal>
        <p className="h1">{trust.ctaTitle}</p>
        <a href={href("/vykup", lang)} className="btn btn-primary btn-lg" data-magnetic>{trust.ctaText} <span className="arrow">→</span></a>
      </div>
    </section>
  );
}
