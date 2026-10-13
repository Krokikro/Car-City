import type { Block } from "@/lib/blocks";
import { fleet } from "@/lib/fleet";
import { href, type Lang } from "@/lib/i18n";
import { CarArt } from "../CarArt";
import { nb } from "./VykupParts";

type Sec = Extract<Block, { t: "section" }>;

// Блоки страниц классов и выкупа: те же тексты, что на car-city.pro, но разложены крупными карточками.

const strip = (h: string) => h.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();

function Head({ n, title }: { n: number; title: string }) {
  return (
    <header className="vk-head">
      <p className="mono eyebrow">{String(n + 1).padStart(2, "0")}</p>
      <h2 className="display" data-split>{title}</h2>
    </header>
  );
}

// контурные значки
const ICONS = [
  "M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6zM9 12l2.2 2.2L15.5 10", // щит
  "M4 5h16v11H9l-5 4zM8 9h8M8 12h5", // чат
  "M14.5 6.5l3 3M4 20l1-4L16 5l3 3L8 19zM13 8l3 3", // инструмент
  "M12 21s-8-4.8-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 6.2-8 11-8 11z", // сердце
  "M12 8v4l3 2M12 21a9 9 0 100-18 9 9 0 000 18z", // часы
  "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6", // договор
  "M5 5h14v15H5zM5 10h14M9 3v4M15 3v4", // календарь
  "M12 3l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.3l6-.8z", // звезда
];
const Ico = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

/** «Заголовок. Описание» → [заголовок, описание]; без точки — только описание */
function split(t: string): [string, string] {
  const plain = t.replace(/<[^>]+>/g, "");
  const m = plain.match(/^(.{6,80}?[.:!])\s+(\S[\s\S]+)$/);
  if (!m) return ["", t];
  const head = m[1].replace(/[.:]$/, "");
  const i = t.indexOf(m[1]);
  const rest = i === 0 ? t.slice(m[1].length).trim() : m[2];
  return [head, rest];
}

type Node = { k: "p"; html: string } | { k: "list"; items: string[] };
function nodes(html: string): Node[] {
  const out: Node[] = [];
  for (const m of html.matchAll(/<p(?: [^>]*)?>([\s\S]*?)<\/p>|<(?:ul|ol)[^>]*>([\s\S]*?)<\/(?:ul|ol)>/g)) {
    if (m[1] !== undefined) {
      if (/class="btn|@@/.test(m[0])) continue;
      out.push({ k: "p", html: m[1].trim() });
    } else out.push({ k: "list", items: [...m[2].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) => x[1].trim()) });
  }
  return out;
}

/**
 * Блок преимуществ: вводный абзац, затем карточки (номер, заголовок, пояснение), короткие пункты галочками
 * и заключительный абзац с кнопкой. Подходит и для «Почему с нами выгодно», и для «Преимуществ аренды с выкупом».
 */
export function BenefitsView({ b, n, lang = "ru", cta = true }: { b: Sec; n: number; lang?: Lang; cta?: boolean }) {
  const list = nodes(b.html);
  const firstList = list.findIndex((x) => x.k === "list");
  const lastList = list.map((x) => x.k).lastIndexOf("list");
  const lead = list.slice(0, firstList < 0 ? list.length : firstList).filter((x) => x.k === "p") as { k: "p"; html: string }[];
  const tail = firstList < 0 ? [] : (list.slice(lastList + 1) as { k: "p"; html: string }[]);
  const mid = firstList < 0 ? [] : list.slice(firstList, lastList + 1);
  const btn = lang === "ru" ? "Оставить заявку" : "Leave a request";
  let card = 0;
  return (
    <section className="section bn-sec">
      <div className="wrap">
        <Head n={n} title={b.title} />
        {lead.map((p, i) => <p key={i} className="bn-lead" dangerouslySetInnerHTML={{ __html: nb(p.html) }} />)}
        {mid.map((x, i) => {
          if (x.k === "p") return <p key={i} className="bn-lead bn-sub" dangerouslySetInnerHTML={{ __html: nb(x.html) }} />;
          const parts = x.items.map(split);
          const titled = parts.filter(([h]) => h).length >= Math.ceil(parts.length / 2);
          return (
            <ul key={i} className={`bn-grid${titled ? "" : " bn-short"}`} data-reveal-stagger>
              {parts.map(([h, d], j) => {
                const c = card++;
                return titled ? (
                  <li key={j} className="bn-card">
                    <span className="bn-n" aria-hidden="true">{String(j + 1).padStart(2, "0")}</span>
                    <span className="bn-ico"><Ico d={ICONS[c % ICONS.length]} /></span>
                    {h && <b className="bn-h" dangerouslySetInnerHTML={{ __html: nb(h) }} />}
                    <span className="bn-d" dangerouslySetInnerHTML={{ __html: nb(d) }} />
                  </li>
                ) : (
                  <li key={j} className="bn-card">
                    <span className="bn-ico"><Ico d={ICONS[c % ICONS.length]} /></span>
                    <span className="bn-d" dangerouslySetInnerHTML={{ __html: nb(h ? `${h}. ${d}` : d) }} />
                  </li>
                );
              })}
            </ul>
          );
        })}
        {tail.length === 0 && cta && <p className="bn-cta"><a className="btn btn-primary btn-lg" href="#zayavka">{btn} <span className="arrow">→</span></a></p>}
        {tail.length > 0 && (
          <div className="bn-outro">
            <div>{tail.map((p, i) => <p key={i} dangerouslySetInnerHTML={{ __html: nb(p.html) }} />)}</div>
            {cta && <a className="btn btn-primary btn-lg" href="#zayavka">{btn} <span className="arrow">→</span></a>}
          </div>
        )}
      </div>
    </section>
  );
}

/** «Парк авто …»: карточки с фото машины, названием, описанием и ссылкой на страницу модели */
export function FleetNotes({ b, n, lang = "ru" }: { b: Sec; n: number; lang?: Lang }) {
  const intro = [...b.html.matchAll(/<p(?: [^>]*)?>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
  const items = [...b.html.matchAll(/<li>\s*<a href="([^"]+)">([\s\S]*?)<\/a>\s*([\s\S]*?)<\/li>/g)].map((m) => {
    const last = m[1].split("/").filter(Boolean).pop()?.toLowerCase() ?? "";
    const car = fleet.find((f) => [f.rent, f.buy].some((u) => u?.split("/").pop()?.toLowerCase() === last));
    return { href: m[1], name: strip(m[2]).replace(/[.:]$/, ""), text: strip(m[3]), car };
  });
  if (!items.length) return null;
  return (
    <section className="section fn-sec">
      <div className="wrap">
        <Head n={n} title={b.title} />
        {intro[0] && <p className="bn-lead" dangerouslySetInnerHTML={{ __html: nb(intro[0]) }} />}
        <ul className="fn-grid" data-reveal-stagger>
          {items.map((it) => (
            <li key={it.href} className="fn-card">
              <a href={href(it.href, lang)} className="fn-link">
                <span className="fn-photo">{it.car ? <CarArt slug={it.car.slug} name={it.name} lit sizes="(max-width: 700px) 86vw, 420px" /> : null}</span>
                <b className="fn-name">{it.name}</b>
                <span className="fn-text">{it.text}</span>
                <span className="fn-go">{lang === "ru" ? "Смотреть" : "Details"} <i aria-hidden="true">→</i></span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Таблица цен: крупно, цены акцентным цветом, самая выгодная в столбце отмечена */
export function PriceTable({ b, n, lang = "ru" }: { b: Sec; n: number; lang?: Lang }) {
  const intro = [...b.html.matchAll(/<p(?: [^>]*)?>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
  const head = [...(b.html.match(/<thead>([\s\S]*?)<\/thead>/)?.[1] ?? "").matchAll(/<th>([\s\S]*?)<\/th>/g)].map((m) => strip(m[1]));
  const rows = [...(b.html.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1] ?? "").matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((m) => [...m[1].matchAll(/<td>([\s\S]*?)<\/td>/g)].map((c) => strip(c[1])));
  if (!head.length || !rows.length) return null;
  const val = (s: string) => Number(s.replace(/[^\d]/g, "")) || 0;
  const min = head.map((_, c) => (c === 0 ? 0 : Math.min(...rows.map((r) => val(r[c] ?? "")).filter(Boolean))));
  return (
    <section className="section pt-sec">
      <div className="wrap">
        <Head n={n} title={b.title} />
        {intro[0] && <p className="bn-lead" dangerouslySetInnerHTML={{ __html: nb(intro[0]) }} />}
        <div className="pt-wrap" role="region" aria-label={b.title} tabIndex={0}>
          <table className="pt">
            <thead><tr>{head.map((h, i) => <th key={i} scope="col">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j} className={val(c) === min[j] ? "is-min" : ""}><b>{nb(c.replace(/\s*₽/, "").trim())}</b><span> ₽</span></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
