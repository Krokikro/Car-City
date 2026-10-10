import type { HomeText } from "@/lib/home-text";

export function WhyUs({ t: whyUs }: { t: HomeText["whyUs"] }) {
  return (
    <section className="section why" aria-labelledby="why-title">
      <div className="why-veil" aria-hidden="true" />
      <div className="wrap">
        <div className="section-head">
          <p className="mono eyebrow">Car City</p>
          <h2 id="why-title" className="display-xl" data-split>{whyUs.title}</h2>
        </div>
        <div className="why-grid" data-tilt-in>
          {whyUs.items.map((it) => (
            <article key={it.title} className="why-card">
              <p className="why-num">{it.num}<small>{it.unit}</small></p>
              <h3>{it.title}</h3>
              <p className="muted">{it.text}</p>
            </article>
          ))}
        </div>
        <a href="#zayavka" className="btn btn-primary btn-lg why-btn" data-magnetic>{whyUs.button} <span className="arrow">→</span></a>
      </div>
    </section>
  );
}
