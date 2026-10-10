import { href, type Lang } from "@/lib/i18n";
import { TrustOwners } from "./TrustOwners";
import { ruHome, type HomeText } from "@/lib/home-text";

export function Trust({ lang = "ru", t: trust = ruHome.trust, buy = false }: { lang?: Lang; t?: HomeText["trust"]; buy?: boolean }) {
  // На странице выкупа счётчик «арендовали авто» не нужен: остаётся только «выкупили»
  const stats = buy ? trust.stats.slice(1) : trust.stats;
  return (
    <section className="section trust" aria-labelledby="trust-title">
      <div className="wrap">
        <h2 id="trust-title" className="mono eyebrow">{trust.title}</h2>
        <div className={`trust-stats${buy ? " one" : ""}`}>
          {stats.map((s) => (
            <div key={s.label} className="trust-stat" data-reveal>
              <span className="trust-num"><span data-count={s.value} data-suffix={s.suffix}>{s.value.toLocaleString("ru-RU")}{s.suffix}</span></span>
              <span className="trust-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
      <TrustOwners owners={trust.owners as never} lang={lang} label={trust.ctaTitle} />
      <div className="wrap trust-cta" data-reveal>
        <p className="h1">{trust.ctaTitle}</p>
        <a href={href("/vykup", lang)} className="btn btn-primary btn-lg" data-magnetic data-lead="buyout">{trust.ctaText} <span className="arrow">→</span></a>
      </div>
    </section>
  );
}
