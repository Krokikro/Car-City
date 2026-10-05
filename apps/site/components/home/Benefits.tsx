import type { HomeText } from "@/lib/home-text";
import { Icon } from "./Icon";

// Преимущества стопкой: каждая карточка прилипает чуть ниже предыдущей и накрывает её (CSS sticky, без JS).
export function Benefits({ t }: { t: HomeText["benefits"] }) {
  return (
    <section className="section stack-sec" aria-labelledby="benefits-title">
      <div className="wrap stack-grid">
        <div className="stack-head">
          <p className="mono eyebrow">{t.eyebrow}</p>
          <h2 id="benefits-title" className="display" data-split>{t.title}</h2>
        </div>
        <ol className="stack">
          {t.items.map((b, i) => (
            <li key={b.text} className="stack-card" style={{ ["--i" as string]: i }}>
              <span className="stack-n">{String(i + 1).padStart(2, "0")}</span>
              <Icon name={b.icon} />
              <p>{b.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
