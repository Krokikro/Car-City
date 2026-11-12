import type { HomeText } from "@/lib/home-text";
import { LeadForm } from "../LeadForm";

// Второй блок с заявкой на главной — короткий: подарок первого дня, только имя и телефон.
// Полная форма с выбором мессенджера есть в калькуляторе и в конце страницы.
export function Promo({ t: promo }: { t: HomeText["promo"] }) {
  return (
    <section className="section promo promo-short" aria-labelledby="promo-title">
      <div className="wrap">
        <div className="promo-card" data-reveal>
          <div className="promo-flag" aria-hidden="true" />
          <div className="promo-copy">
            <span className="promo-gift" aria-hidden="true">
              <svg viewBox="0 0 48 48" width="40" height="40">
                <rect x="7" y="18" width="34" height="9" rx="2.5" fill="currentColor" opacity=".9" />
                <rect x="10" y="27" width="28" height="15" rx="2.5" fill="currentColor" opacity=".55" />
                <rect x="21.5" y="18" width="5" height="24" fill="#0B0B0C" opacity=".85" />
                <path d="M24 18c-3-6-11-9-12-4-1 4 7 4 12 4zm0 0c3-6 11-9 12-4 1 4-7 4-12 4z" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" />
              </svg>
            </span>
            <h2 id="promo-title" className="display">{promo.title}</h2>
            <p className="lead">{promo.text}</p>
          </div>
          <LeadForm button={promo.button} source="promo" compact askMessenger={false} askMarketing={false} />
        </div>
      </div>
    </section>
  );
}
