import { company } from "@/lib/content";
import type { Lang } from "@/lib/i18n";
import { SocialRow } from "../SocialIcons";

// Контакты: три офиса карточками (адрес, метро, режим работы, маршрут), под ними телефон, почта и мессенджеры.
// Тексты адресов и режима — как на car-city.pro.
const OFFICES = [
  { addr: "г. Москва, ул. Удальцова, д. 36", metro: ["Проспект Вернадского", "Мичуринский проспект"], hours: "с 9:00 до 21:00", days: "пн-вс", map: "Москва, ул. Удальцова, 36" },
  { addr: "г. Москва, 1‑й Митинский переулок, 15с3", metro: ["Митино"], hours: "с 10:00 до 19:00", days: "пн-пт", map: "Москва, 1-й Митинский переулок, 15с3" },
  { addr: "г. Москва, ул. Витебская, д.11", metro: ["Кунцевская"], hours: "с 10:00 до 19:00", days: "пн-вс", map: "Москва, ул. Витебская, 11" },
];

// Значки линий метро: номер линии в круге её цвета, как на схемах и указателях в метро
const LINES: Record<string, [string, string]> = {
  "1": ["#E42313", "#fff"], "3": ["#0072BA", "#fff"], "4": ["#1EBCEF", "#fff"], "8": ["#FFCD1C", "#1a1a1a"], "11": ["#88CDCF", "#1a1a1a"],
};
const STATION: Record<string, string[]> = {
  "Проспект Вернадского": ["1", "11"], "Мичуринский проспект": ["8", "11"], "Митино": ["3"], "Кунцевская": ["3", "4", "11"],
};

const T = {
  ru: { offices: "Адреса офисов:", hours: "Режим работы:", route: "Маршрут", call: "Позвонить", write: "Написать", mail: "Почта", phone: "Телефон", open: "Открыто каждый день" },
  en: { offices: "Office addresses:", hours: "Opening hours:", route: "Directions", call: "Call", write: "Message us", mail: "Email", phone: "Phone", open: "Open every day" },
};

export function ContactView({ lang = "ru" }: { lang?: Lang }) {
  const t = T[lang as keyof typeof T] ?? T.ru;
  const tel = company.phones[0];
  return (
    <section className="section ct" aria-label={t.offices}>
      <div className="wrap">
        <div className="ct-top" data-reveal-stagger>
          <a className="ct-line ct-phone" href={`tel:${tel.replace(/[^\d+]/g, "")}`}>
            <span className="mono">{t.phone}</span>
            <b className="mono-num">{tel}</b>
          </a>
          <a className="ct-line" href={`mailto:${company.email}`}>
            <span className="mono">{t.mail}</span>
            <b>{company.email}</b>
          </a>
          <div className="ct-line">
            <span className="mono">{t.write}</span>
            <SocialRow size={46} only={["telegram", "whatsapp", "max"]} />
          </div>
        </div>
        <h2 className="h1 ct-title" data-split>{t.offices}</h2>
        <div className="ct-grid" data-tilt-in>
          {OFFICES.map((o, i) => (
            <article key={o.addr} className="ct-card">
              <span className="ct-n mono">0{i + 1}</span>
              <h3>{o.addr}</h3>
              <ul className="ct-metro">
                {o.metro.map((m) => (
                  <li key={m}>
                    <span className="ct-lines" aria-hidden="true">
                      {(STATION[m] ?? []).map((l) => <i key={l} style={{ background: LINES[l][0], color: LINES[l][1] }}>{l}</i>)}
                    </span>
                    м. {m}
                  </li>
                ))}
              </ul>
              <div className="ct-hours">
                <span className="mono">{t.hours}</span>
                <p><b>{o.hours}</b> <span>{o.days}</span></p>
                {o.days === "пн-вс" && <em>{t.open}</em>}
              </div>
              <div className="ct-actions">
                <a className="btn btn-primary btn-sm" href={`https://yandex.ru/maps/?text=${encodeURIComponent(o.map)}`} target="_blank" rel="noopener">{t.route} <span className="arrow">→</span></a>
                <a className="btn btn-ghost btn-sm" href={`tel:${tel.replace(/[^\d+]/g, "")}`}>{t.call}</a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
