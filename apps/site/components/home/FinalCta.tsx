import type { Lang } from "@/lib/i18n";
import { ui } from "@/lib/ui";
import { LeadForm } from "../LeadForm";

export function FinalCta({ lang = "ru" }: { lang?: Lang }) {
  const t = ui(lang);
  return (
    <section className="section final" id="zayavka" aria-labelledby="final-title">
      <div className="final-checker" aria-hidden="true" />
      <div className="wrap final-grid">
        <div>
          <p className="mono eyebrow">{t.finalEyebrow}</p>
          <h2 id="final-title" className="display-xl" data-split>{t.finalTitle}</h2>
          <p className="lead">{t.finalText}</p>
        </div>
        <div className="final-form" data-reveal>
          <LeadForm button={t.finalButton} source="final" />
        </div>
      </div>
    </section>
  );
}
