import { seo } from "@/lib/home";

export function SeoText() {
  return (
    <section className="section seo" data-surface="light" aria-labelledby="seo-title">
      <div className="wrap seo-grid">
        <div className="seo-lead">
          <p className="mono eyebrow">О таксопарке</p>
          <h2 id="seo-title" className="display" data-split>Аренда авто под такси в Москве</h2>
          {seo.intro.map((p) => <p key={p.slice(0, 20)} className="lead">{p}</p>)}
        </div>
        <div className="seo-body">
          <h3>{seo.whyTitle}</h3>
          <p>{seo.whyLead}</p>
          <ul className="seo-list" data-reveal-stagger>
            {seo.why.map(([b, t]) => (
              <li key={b}><strong>{b}</strong> {t}</li>
            ))}
          </ul>
          <p>{seo.whyOutro}</p>
          <h3>{seo.fleetTitle}</h3>
          {seo.fleet.map((p) => <p key={p.slice(0, 20)}>{p}</p>)}
        </div>
      </div>
    </section>
  );
}
