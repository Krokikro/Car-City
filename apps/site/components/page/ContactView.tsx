import { company, offices } from "@/lib/content";
import { place } from "@/lib/ui-terms";
import type { Lang } from "@/lib/i18n";
import { SocialRow } from "../SocialIcons";

// Контакты: офисы карточками (адрес, метро, режим работы, маршрут), под ними телефон, почта и мессенджеры.
// Адрес, часы и дни работы берутся из админки (Тексты → Контакты → Офис N), здесь — только значки метро по порядку офисов.
const METRO_LIST = [
  ["Проспект Вернадского", "Мичуринский проспект"],
  ["Митино"],
  ["Кунцевская"],
  ["Ховрино", "Грачёвская"],
];

// Значки линий метро: номер линии в круге её цвета, как на схемах и указателях в метро
const LINES: Record<string, [string, string]> = {
  "1": ["#E42313", "#fff"], "3": ["#0072BA", "#fff"], "4": ["#1EBCEF", "#fff"], "8": ["#FFCD1C", "#1a1a1a"], "11": ["#88CDCF", "#1a1a1a"], "2": ["#4FB04F", "#fff"], "D3": ["#E95B0C", "#fff"],
};
const STATION: Record<string, string[]> = {
  "Проспект Вернадского": ["1", "11"], "Мичуринский проспект": ["8", "11"], "Митино": ["3"], "Кунцевская": ["3", "4", "11"], "Ховрино": ["2"], "Грачёвская": ["D3"],
};

const T = {
  ru: { offices: "Адреса офисов:", hours: "Режим работы:", route: "Маршрут", call: "Позвонить", write: "Написать", mail: "Почта", phone: "Телефон", open: "Открыто каждый день" },
  en: { offices: "Office addresses:", hours: "Opening hours:", route: "Directions", call: "Call", write: "Message us", mail: "Email", phone: "Phone", open: "Open every day" },
  ky: { offices: "Кеңселердин даректери:", hours: "Иш убактысы:", route: "Маршрут", call: "Чалуу", write: "Жазуу", mail: "Почта", phone: "Телефон", open: "Күн сайын иштейт" },
  kk: { offices: "Кеңселердің мекенжайлары:", hours: "Жұмыс уақыты:", route: "Бағыт", call: "Қоңырау шалу", write: "Жазу", mail: "Пошта", phone: "Телефон", open: "Күн сайын ашық" },
  uz: { offices: "Ofislar manzillari:", hours: "Ish vaqti:", route: "Yo‘nalish", call: "Qo‘ng‘iroq qilish", write: "Yozish", mail: "Pochta", phone: "Telefon", open: "Har kuni ochiq" },
};
const METRO: Record<string, string> = { ru: "м.", en: "metro", ky: "метро", kk: "метро", uz: "metro" };

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
          {offices.map((of, i) => {
            const o = { addr: `г. Москва, ${of.address}`, metro: METRO_LIST[i] ?? of.metro.split(/,\s*/), hours: of.hours, days: of.days ?? "", map: `Москва, ${of.address}` };
            return (
            <article key={of.address + i} className="ct-card">
              <span className="ct-n mono">0{i + 1}</span>
              <h3>{place(lang, o.addr)}</h3>
              <ul className="ct-metro">
                {o.metro.map((m) => (
                  <li key={m}>
                    <span className="ct-lines" aria-hidden="true">
                      {(STATION[m] ?? []).map((l) => <i key={l} style={{ background: LINES[l][0], color: LINES[l][1] }}>{l}</i>)}
                    </span>
                    {m === "Грачёвская" ? (lang === "en" || lang === "uz" ? "MCD-D3" : "МЦД-D3") : METRO[lang] ?? "м."} {place(lang, m)}
                  </li>
                ))}
              </ul>
              <div className="ct-hours">
                <span className="mono">{t.hours}</span>
                <p><b>{place(lang, o.hours)}</b> <span>{place(lang, o.days)}</span></p>
                {o.days === "пн-вс" && <em>{t.open}</em>}
              </div>
              <div className="ct-actions">
                <a className="btn btn-primary btn-sm" href={`https://yandex.ru/maps/?text=${encodeURIComponent(o.map)}`} target="_blank" rel="noopener">{t.route} <span className="arrow">→</span></a>
                <a className="btn btn-ghost btn-sm" href={`tel:${tel.replace(/[^\d+]/g, "")}`}>{t.call}</a>
              </div>
            </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
