import type { HomeText } from "@/lib/home-text";
import { LeadForm } from "../LeadForm";

export function Promo({ t: promo }: { t: HomeText["promo"] }) {
  return (
    <section className="section promo" aria-labelledby="promo-title">
      <div className="wrap">
        <div className="promo-card" data-reveal>
          <div className="promo-flag" aria-hidden="true" />
          <div className="promo-copy">
            <p className="mono eyebrow">{promo.eyebrow}</p>
            <h2 id="promo-title" className="display">{promo.title}</h2>
            <p className="lead">{promo.text}</p>
          </div>
          <LeadForm button={promo.button} source="promo" />
        </div>
      </div>
    </section>
  );
}
