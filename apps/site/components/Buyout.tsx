import { buyout, buyoutSteps } from "@/lib/content";

// Уровни light/basic: вертикальная шкала шагов. На уровне full сюда встанет скролл-сцена «путь к выкупу» (PRD 3.4).
export function Buyout() {
  return (
    <section className="section" id="vykup" aria-labelledby="buyout-title">
      <div className="wrap split">
        <div className="head">
          <p className="mono">Выкуп</p>
          <h2 id="buyout-title" className="display">Своя машина без банка</h2>
          <p className="lead">Срок {buyout.term}. Цена выкупа зависит от срока, менеджер посчитает её под вашу модель.</p>
          <ul className="checks">
            {buyout.perks.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <a className="btn btn-ghost" href="#zayavka">Узнать цену выкупа</a>
        </div>
        <ol className="road">
          {buyoutSteps.map((s, i) => (
            <li key={s.title} className="road-step">
              <span className="road-n mono">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3>{s.title}</h3>
                <p className="muted">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
