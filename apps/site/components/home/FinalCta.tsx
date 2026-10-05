import { finalCta } from "@/lib/home";
import { LeadForm } from "../LeadForm";

export function FinalCta() {
  return (
    <section className="section final" id="zayavka" aria-labelledby="final-title">
      <div className="final-checker" aria-hidden="true" />
      <div className="wrap final-grid">
        <div>
          <p className="mono eyebrow">Заявка</p>
          <h2 id="final-title" className="display-xl" data-split>{finalCta.title}</h2>
          <p className="lead">{finalCta.text}</p>
        </div>
        <div className="final-form" data-reveal>
          <LeadForm button={finalCta.button} source="final" />
        </div>
      </div>
    </section>
  );
}
