import { company } from "@/lib/content";

// Только на телефоне: звонок и заявка всегда под пальцем.
export function StickyCta() {
  const tel = company.phones[0].replace(/[^\d+]/g, "");
  return (
    <div className="sticky-cta" role="region" aria-label="Быстрая связь">
      <a className="btn btn-ghost" href={`tel:${tel}`}>Позвонить</a>
      <a className="btn btn-primary" href="#zayavka">Заявка</a>
    </div>
  );
}
