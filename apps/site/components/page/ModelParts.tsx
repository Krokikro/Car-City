import type { Block } from "@/lib/blocks";
import { nb } from "./VykupParts";

type Sec = Extract<Block, { t: "section" }>;

// Текстовые блоки страницы модели (описание машины, комплектация, характеристики, условия) —
// те же тексты со старого сайта, но в подаче остального сайта: слева заголовок, справа текст,
// списки — аккуратными строками с галочками, характеристики — плитками, «Также доступен выкуп» — карточкой.

const strip = (h: string) => h.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

type Part =
  | { k: "p"; html: string }
  | { k: "h"; text: string }
  | { k: "list"; items: string[] }
  | { k: "btn"; html: string };

function parts(html: string): Part[] {
  const out: Part[] = [];
  const re = /<p class="btn-row">([\s\S]*?)<\/p>|<p(?: [^>]*)?>([\s\S]*?)<\/p>|<h[34][^>]*>([\s\S]*?)<\/h[34]>|<(?:ul|ol)[^>]*>([\s\S]*?)<\/(?:ul|ol)>/g;
  for (const m of html.matchAll(re)) {
    if (m[1] !== undefined) out.push({ k: "btn", html: m[1] });
    else if (m[2] !== undefined) { if (m[2].trim()) out.push({ k: "p", html: m[2].trim() }); }
    else if (m[3] !== undefined) out.push({ k: "h", text: strip(m[3]) });
    else if (m[4] !== undefined) out.push({ k: "list", items: [...m[4].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) => x[1].trim()) });
  }
  return out;
}

const TECH = /характеристик|параметр|technical|spec/i;
const TWIN = /^(Также доступен (выкуп|аренда)|Also available)/i;

const Check = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="var(--cc-signal)" /><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const Gear = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3.2" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" /></svg>
);

export function ModelText({ b, n }: { b: Sec; n: number }) {
  const all = parts(b.html);
  // «Также доступен выкуп» и всё после него (абзацы и кнопка) — отдельной карточкой
  const ti = all.findIndex((x) => x.k === "p" && TWIN.test(strip(x.html)));
  const body = ti < 0 ? all : all.slice(0, ti);
  const twin = ti < 0 ? [] : all.slice(ti);
  const leadIdx = body.findIndex((x) => x.k === "p");
  let tech = TECH.test(b.title);
  return (
    <section className="section mt-sec">
      <div className="wrap mt-grid">
        <div className="mt-head">
          <p className="mono eyebrow">{String(n + 1).padStart(2, "0")}</p>
          <h2 className="display" data-split>{b.title}</h2>
          {leadIdx === 0 && <p className="mt-lead" dangerouslySetInnerHTML={{ __html: nb((body[0] as { html: string }).html) }} />}
        </div>
        <div className="mt-body">
          {body.map((x, i) => {
            if (i === 0 && leadIdx === 0) return null;
            if (x.k === "h") { tech = TECH.test(x.text); return <h3 key={i} className="mt-h">{x.text}</h3>; }
            if (x.k === "p") return <p key={i} dangerouslySetInnerHTML={{ __html: nb(x.html) }} />;
            if (x.k === "btn") return <p key={i} className="btn-row" dangerouslySetInnerHTML={{ __html: x.html }} />;
            return tech ? (
              <ul key={i} className="mt-specs" data-reveal-stagger>
                {x.items.map((it, j) => <li key={j}><Gear /><span dangerouslySetInnerHTML={{ __html: nb(it) }} /></li>)}
              </ul>
            ) : (
              <ul key={i} className="mt-list" data-reveal-stagger>
                {x.items.map((it, j) => <li key={j}><Check /><span dangerouslySetInnerHTML={{ __html: nb(it) }} /></li>)}
              </ul>
            );
          })}
          {twin.length > 0 && (
            <div className="mt-twin" data-reveal>
              {twin.map((x, i) =>
                x.k === "btn" ? <p key={i} className="btn-row" dangerouslySetInnerHTML={{ __html: x.html.replace("btn-ghost", "btn-primary") }} />
                : x.k === "p" ? (i === 0 ? <b key={i} className="mt-twin-h" dangerouslySetInnerHTML={{ __html: x.html }} /> : <p key={i} dangerouslySetInnerHTML={{ __html: nb(x.html) }} />)
                : null,
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** «Не нашли то, что искали?» — короткий призыв одной карточкой */
export function ModelCta({ b }: { b: Sec }) {
  const all = parts(b.html);
  return (
    <section className="section mc-sec">
      <div className="wrap">
        <div className="mc-card" data-reveal>
          <h2 className="display">{b.title}</h2>
          <div className="mc-body">
            {all.map((x, i) => (x.k === "p" ? <p key={i} className={i === 0 ? "mc-lead" : undefined} dangerouslySetInnerHTML={{ __html: nb(x.html) }} /> : x.k === "btn" ? <p key={i} className="btn-row" dangerouslySetInnerHTML={{ __html: x.html }} /> : null))}
          </div>
        </div>
      </div>
    </section>
  );
}
