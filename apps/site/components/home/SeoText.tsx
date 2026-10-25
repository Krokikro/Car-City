import type { HomeText } from "@/lib/home-text";
import { asset } from "@/lib/i18n";

// «О таксопарке»: слева заголовок и вступление, справа — преимущества плитками со значками
// и карточка «Найдите свой автомобиль» с фото парка. Тексты прежние (SEO), меняется только подача.
const ICONS = [
  "M12 8v4l3 2M12 21a9 9 0 100-18 9 9 0 000 18z", // часы — в день обращения
  "M20 12v8H4v-8M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z", // подарок
  "M5 16l1.6-5A2 2 0 018.5 9.6h7a2 2 0 011.9 1.4L19 16M4 16h16v3h-2.5v-1.5h-11V19H4z", // машина
  "M4 5h16v11H9l-5 4zM8 9h8M8 12h5", // поддержка
  "M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6zM9 12l2.2 2.2L15.5 10", // щит
  "M3 12h4l3-8 4 16 3-8h4", // доход
];

export function SeoText({ t: seo }: { t: HomeText["seo"] }) {
  return (
    <section className="section seo" data-surface="light" aria-labelledby="seo-title">
      <div className="wrap seo-grid">
        <div className="seo-lead">
          <p className="mono eyebrow">{seo.eyebrow}</p>
          <h2 id="seo-title" className="display" data-split>{seo.title}</h2>
          {seo.intro.map((p) => <p key={p.slice(0, 20)} className="lead">{p}</p>)}
        </div>
        <div className="seo-body">
          <div className="seo-why">
            <h3>{seo.whyTitle}</h3>
            <p>{seo.whyLead}</p>
          </div>
          <ul className="seo-cards" data-reveal-stagger>
            {seo.why.map(([b, x], i) => (
              <li key={b}>
                <span className="seo-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS[i % ICONS.length]} /></svg></span>
                <strong>{b.replace(/[.:]\s*$/, "")}</strong>
                <span>{x}</span>
              </li>
            ))}
          </ul>
          <p className="seo-outro">{seo.whyOutro}</p>
          <div className="seo-fleet" data-reveal>
            <div className="seo-fleet-img" style={{ backgroundImage: `url(${asset("/pages/about-fleet-960.webp")})` }} aria-hidden="true" />
            <div className="seo-fleet-txt">
              <h3>{seo.fleetTitle}</h3>
              {seo.fleet.map((p) => <p key={p.slice(0, 20)}>{p}</p>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
