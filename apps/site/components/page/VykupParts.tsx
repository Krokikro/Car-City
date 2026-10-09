import type { Block, Card } from "@/lib/blocks";
import { CarArt } from "../CarArt";
import type { Lang } from "@/lib/i18n";

type Sec = Extract<Block, { t: "section" }>;

// Страница выкупа: те же тексты, что и на car-city.pro, но выгоды, условия и тарифы показаны крупными карточками.

const NB = " ";
/** Неразрывные пробелы: числа не рвутся по тысячам, предлоги не остаются в конце строки. */
export function nb(s: string) {
  return s
    .replace(/(\d)\s(?=\d{3}(?!\d))/g, `$1${NB}`)
    .replace(/(\d)\s(?=(?:₽|руб|р\.|л\b|лет|года|дн|%|мин|час|мес))/g, `$1${NB}`)
    .replace(/(^|[\s>(«])([вкосу]|на|по|от|до|за|из|во|со|об|не|ни|и|а|но)\s(?=[^\s<])/gi, `$1$2${NB}`);
}
const items = (html: string) => [...html.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1].trim());
const paras = (html: string) => [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1].trim());
const text = (html: string) => html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
/** Цифры в тексте — крупнее: «3%», «14 дней», «от 1 года». */
function hot(s: string) {
  return nb(s).replace(/(\d+(?:[.,]\d+)?(?: |\s)?(?:%|дн\S*|лет|года|мес\S*))/g, '<b class="vk-hot">$1</b>');
}

// Значки: контурные, в стиле сайта
const ICONS = [
  "M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6zM9 12l2.2 2.2L15.5 10", // ОСАГО — щит
  "M12 21s-8-4.8-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 6.2-8 11-8 11zM9 11h6M12 8v6", // болезнь/ДТП — сердце с крестом
  "M7 8h12l-3-3M17 16H5l3 3", // любой парк — обмен
  "M7.5 8.5a2 2 0 100-4 2 2 0 000 4zM16.5 19.5a2 2 0 100-4 2 2 0 000 4zM18 5L6 19", // комиссия — процент
  "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6", // договор
  "M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a2.5 2.5 0 100-5M17.5 14c2.5.3 4 2 4 4.5", // напарник
  "M5 5h14v15H5zM5 10h14M9 3v4M15 3v4M9 14h2M13 14h2", // отпуск — календарь
  "M4 5h16v11H9l-5 4zM8 9h8M8 12h5", // клуб — чат
];
const Ico = ({ d, size = 28 }: { d: string; size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

function Head({ n, title }: { n: number; title: string }) {
  return (
    <header className="vk-head">
      <p className="mono eyebrow">{String(n + 1).padStart(2, "0")}</p>
      <h2 className="display" data-split>{title}</h2>
    </header>
  );
}

/** «Ваша выгода при выкупе» — мозаика крупных карточек */
export function VykupBenefits({ b, n }: { b: Sec; n: number }) {
  const list = items(b.html);
  // ширина карточек в мозаике из четырёх колонок (в сумме по строкам — 4)
  const span = [2, 1, 1, 1, 2, 1, 2, 2];
  const accent = new Set([0, 3]);
  return (
    <section className="section vk-sec vk-ben">
      <div className="wrap">
        <Head n={n} title={b.title} />
        <ul className="vk-ben-grid" data-reveal-stagger>
          {list.map((t, i) => (
            <li key={i} className={`vk-bcard${accent.has(i) ? " is-accent" : ""}`} style={{ ["--span" as string]: list.length === 8 ? span[i] : 1 }}>
              <span className="vk-bico"><Ico d={ICONS[i % ICONS.length]} /></span>
              <span className="vk-btext" dangerouslySetInnerHTML={{ __html: hot(t) }} />
              <span className="vk-bnum" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** «Условия выкупа» — требования тремя крупными карточками и нумерованные условия */
export function VykupConditions({ b, n }: { b: Sec; n: number }) {
  const h3 = b.html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)?.[1] ?? "";
  const ps = paras(b.html);
  const pairs: [string, string][] = [];
  const note: string[] = [];
  for (const p of ps) {
    const t = text(p);
    const k = t.indexOf(":");
    if (k > 0 && k < 24) pairs.push([t.slice(0, k), t.slice(k + 1).trim()]);
    else note.push(t);
  }
  const terms = items(b.html);
  const reqIcons = [
    "M12 3v3M12 18v3M4.2 7.5l2.6 1.5M17.2 15l2.6 1.5M4.2 16.5L6.8 15M17.2 9l2.6-1.5M12 8a4 4 0 100 8 4 4 0 000-8z", // стаж
    "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4.4 3.6-7 8-7s8 2.6 8 7", // возраст
    "M4 5h16v14H4zM8 10a2 2 0 100-4 2 2 0 000 4zM5.5 16c.5-1.7 1.5-2.5 2.5-2.5s2 .8 2.5 2.5M13 9h5M13 13h5", // документы
  ];
  return (
    <section className="section vk-sec vk-cond">
      <div className="wrap">
        <Head n={n} title={b.title} />
        {pairs.length > 0 && (
          <div className="vk-req">
            {h3 && <h3 className="vk-req-title">{text(h3)}</h3>}
            <div className="vk-req-grid" data-reveal-stagger>
              {pairs.map(([k, v], i) => (
                <div key={k} className={`vk-rcard${i === pairs.length - 1 ? " is-wide" : ""}`}>
                  <span className="vk-rico"><Ico d={reqIcons[i % reqIcons.length]} size={26} /></span>
                  <p className="mono vk-rk">{k}</p>
                  <p className="vk-rv" dangerouslySetInnerHTML={{ __html: nb(v) }} />
                </div>
              ))}
            </div>
            {note.length > 0 && <p className="vk-note"><span aria-hidden="true">i</span>{note.join(" ")}</p>}
          </div>
        )}
        {terms.length > 0 && (
          <ol className="vk-terms" data-reveal-stagger>
            {terms.map((t, i) => (
              <li key={i}>
                <span className="vk-tn" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <span className="vk-tt" dangerouslySetInnerHTML={{ __html: hot(t) }} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

const TARIFF_CAR: Record<string, string> = { ekonom: "volkswagen-polo-1.6", komfort: "geely-emgrand", "komfort-plus": "haval-f7" };
const TARIFF_CTA: Record<string, string> = { ru: "Смотреть авто", en: "See cars", ky: "Унааларды көрүү", kk: "Көліктерді көру", uz: "Avtomobillarni ko‘rish" };
const classOf = (h: string) => (/komfort-?pl/i.test(h) ? "komfort-plus" : /komfort/i.test(h) ? "komfort" : /ekonom/i.test(h) ? "ekonom" : "");
const priceNum = (s?: string) => Number((s ?? "").replace(/[^\d]/g, "")) || Infinity;

/** «У нас доступны разные тарифы» — три тарифные карточки с машиной, ценой и составом класса */
export function VykupTariffs({ b, n, cards, lang }: { b: Sec; n: number; cards: Card[]; lang: Lang }) {
  const links = [...b.html.matchAll(/<a [^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map((m) => ({ href: m[1], label: m[2].trim() }));
  const tiers = links
    .map((l) => {
      const cls = classOf(l.href);
      const own = cards.filter((c) => classOf(c.btn?.href ?? "") === cls);
      const cheapest = own.slice().sort((a, c) => priceNum(a.price) - priceNum(c.price))[0];
      return { ...l, cls, own, price: cheapest?.price };
    })
    .filter((t) => t.cls);
  return (
    <section className="section vk-sec vk-tar">
      <div className="wrap">
        <Head n={n} title={b.title} />
        <div className="vk-tar-grid" data-reveal-stagger>
          {tiers.map((t, i) => (
            <a key={t.href} href={t.href} className={`vk-tier${i === 1 ? " is-mid" : ""}`}>
              <span className="vk-tier-media">
                <CarArt slug={TARIFF_CAR[t.cls]} name={t.label} sizes="(max-width: 720px) 92vw, 380px" />
                <span className="vk-tier-n mono">{String(i + 1).padStart(2, "0")}</span>
              </span>
              <span className="vk-tier-body">
                <span className="vk-tier-name">{t.label}</span>
                {t.price && <span className="vk-tier-price" dangerouslySetInnerHTML={{ __html: nb(t.price.replace(/(\d)(\d{3})(?!\d)/, "$1 $2")) }} />}
                <span className="vk-tier-cars">{t.own.slice(0, 5).map((c) => c.name).join(" · ")}</span>
                <span className="vk-tier-cta">{TARIFF_CTA[lang] ?? TARIFF_CTA.ru} <i aria-hidden="true">→</i></span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Экономия («На оклейке авто – 17 000 рублей»): подпись и крупная сумма, без разрыва числа */
export function savingsHtml(html: string) {
  return html.replace(/<ul class="tiles">([\s\S]*?)<\/ul>/g, (_, inner: string) => {
    const lis = (inner.match(/<li>[\s\S]*?<\/li>/g) ?? []).map((li) => {
      const t = li.replace(/^<li>|<\/li>$/g, "");
      const m = t.match(/^(.*?)\s[–—-]\s(.+)$/);
      if (!m) return `<li>${nb(t)}</li>`;
      return `<li><span class="vs-l">${nb(m[1])}</span><b class="vs-v">${nb(m[2])}</b></li>`;
    });
    return `<ul class="tiles tiles-save">${lis.join("")}</ul>`;
  });
}
