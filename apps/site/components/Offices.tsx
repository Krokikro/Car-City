import { offices } from "@/lib/content";

export function Offices() {
  return (
    <section className="section" id="ofisy" aria-labelledby="offices-title">
      <div className="wrap">
        <div className="head">
          <p className="mono">Офисы · Москва</p>
          <h2 id="offices-title" className="display">Где забрать ключи</h2>
        </div>
        <div className="offices">
          {offices.map((o) => (
            <article key={o.name} className="office">
              <p className="mono">м. {o.metro}</p>
              <h3>{o.address}</h3>
              <p className="muted">{o.hours}</p>
              <a className="link" href={`https://yandex.ru/maps/?text=${encodeURIComponent("Москва, " + o.address)}`} target="_blank" rel="noopener">
                Маршрут в Яндекс Картах
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
