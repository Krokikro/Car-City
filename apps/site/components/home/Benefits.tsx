import { benefits } from "@/lib/home";
import { Icon } from "./Icon";

export function Benefits() {
  return (
    <section className="section benefits" aria-labelledby="benefits-title">
      <div className="wrap">
        <div className="section-head">
          <p className="mono eyebrow">Преимущества</p>
          <h2 id="benefits-title" className="display" data-split>Почему с нами выгодно?</h2>
        </div>
        <ul className="bento" data-reveal-stagger>
          {benefits.map((b, i) => (
            <li key={b.text} className={`bento-cell b${i}`}>
              <span className="bento-n mono">{String(i + 1).padStart(2, "0")}</span>
              <Icon name={b.icon} />
              <p>{b.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
