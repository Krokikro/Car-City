import { company } from "@/lib/content";
import type { Lang } from "@/lib/i18n";
import { ui } from "@/lib/ui";

// Только на телефоне: звонок и заявка всегда под пальцем.
export function StickyCta({ lang = "ru" }: { lang?: Lang }) {
  const t = ui(lang);
  const tel = company.phones[0].replace(/[^\d+]/g, "");
  return (
    <div className="sticky-cta" role="region" aria-label={t.quick}>
      <a className="btn btn-ghost" href={`tel:${tel}`}>{t.call}</a>
      <a className="btn btn-primary" href="#zayavka">{t.request}</a>
    </div>
  );
}
