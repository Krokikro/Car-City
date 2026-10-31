import type { SaleChip } from "@/lib/prices";

// Плашки скидки на карточке: каждая подписана — «−10% аренда», «−15% выкуп» или своя надпись («Супер-скидка»).
// mobile — строкой под ценой (на узких экранах плашки поверх фото закрывают машину).
// 31.10: плашки скидок на сайте не показываем (правка маркетолога) — скидка видна зачёркнутой старой ценой.
const SHOW = false;

export function SaleChips({ chips, mobile = false }: { chips: SaleChip[]; mobile?: boolean }) {
  if (!SHOW || !chips.length) return null;
  return (
    <span className={mobile ? "ft-sales-m" : "ft-sales"}>
      {chips.map((c) => (
        <span key={c.text} className={`${mobile ? "ft-sale-m" : "ft-sale"} sale-${c.kind}`}><i aria-hidden="true">%</i>{c.text}</span>
      ))}
    </span>
  );
}
