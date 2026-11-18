import { href, type Lang } from "@/lib/i18n";
import { TrustOwners } from "./TrustOwners";
import { ruHome, type HomeText } from "@/lib/home-text";
import { company } from "@/lib/content";

export function Trust({ lang = "ru", t: trust = ruHome.trust, buy = false }: { lang?: Lang; t?: HomeText["trust"]; buy?: boolean }) {
  // На странице выкупа счётчик «арендовали авто» не нужен: остаётся только «выкупили»
  const stats = buy ? trust.stats.slice(1) : trust.stats;
  return (
    <section className="section trust" aria-labelledby="trust-title">
      <div className="wrap">
        <h2 id="trust-title" className="display trust-title">{trust.title.replace(/:\s*$/, "")}</h2>
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
        <div className="trust-btns">
          {company.telegramChannel && trust.ctaTg && (
            <a href={company.telegramChannel} className="btn btn-lg btn-tg" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M21.94 4.3 18.7 19.56c-.24 1.08-.88 1.35-1.78.84l-4.93-3.63-2.38 2.29c-.26.26-.48.48-.99.48l.35-5.02 9.14-8.26c.4-.35-.09-.55-.62-.2L6.2 13.17l-4.86-1.52c-1.06-.33-1.08-1.06.22-1.57L20.55 2.8c.88-.33 1.65.2 1.39 1.5z" /></svg>
              {trust.ctaTg}
            </a>
          )}
          <a href={href("/vykup", lang)} className="btn btn-primary btn-lg" data-magnetic data-lead="buyout">{trust.ctaText} <span className="arrow">→</span></a>
        </div>
      </div>
    </section>
  );
}
