import type { SaleChip } from "@/lib/prices";

// Плашки скидки на карточке: каждая подписана — «−10% аренда», «−15% выкуп» или своя надпись («Супер-скидка»).
// mobile — строкой под ценой (на узких экранах плашки поверх фото закрывают машину).
export function SaleChips({ chips, mobile = false }: { chips: SaleChip[]; mobile?: boolean }) {
  if (!chips.length) return null;
  return (
    <span className={mobile ? "ft-sales-m" : "ft-sales"}>
      {chips.map((c) => (
        <span key={c.text} className={`${mobile ? "ft-sale-m" : "ft-sale"} sale-${c.kind}`}><i aria-hidden="true">%</i>{c.text}</span>
      ))}
    </span>
  );
}
