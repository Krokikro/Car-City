import { marked } from "marked";
import type { Block, Btn, Card, Fig } from "@/lib/blocks";
import { CarArt } from "../CarArt";
import { ShaderBackdrop } from "../motion/ShaderBackdrop";

const RENT: Record<string, string> = {
  "/klassyi-avtomobilej": "/",
  "/klassyi-avtomobilej/ekonom": "/ekonom",
  "/klassyi-avtomobilej/komfort": "/komfort",
  "/klassyi-avtomobilej/komfort-plyus": "/komfortplus",
  "/klassyi-avtomobilej/gruzovoy": "/gruzovoy",
  // отдельных страниц этих классов выкупа на старом сайте нет — ведём в общий каталог
  "/vykup/biznes": "/vykup",
  "/vykup/dostavka": "/vykup",
  "/vykup/gruzovoy": "/vykup",
};

const crumbHref = (i: number, n: number, path: string) => {
  if (i === 0) return "/";
  // на старом сайте промежуточные крошки ведут на разделы; восстанавливаем их по адресу страницы
  const seg = path.split("/").filter(Boolean);
  const depth = Math.max(1, seg.length - (n - 1 - i));
  const href = "/" + seg.slice(0, depth).join("/");
  // разделы аренды на старом сайте живут по коротким адресам: /komfort, /komfortplus …
  return RENT[href] ?? href;
};

export function Crumbs({ items, path }: { items: string[]; path: string }) {
  if (!items.length) return null;
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((name, i) => ({ "@type": "ListItem", position: i + 1, name, item: `https://car-city.pro${crumbHref(i, items.length, path)}` })),
  };
  return (
    <nav className="crumbs mono" aria-label="Хлебные крошки">
      {items.map((c, i) => (
        <span key={i}>
          {i < items.length - 1 ? <a href={crumbHref(i, items.length, path)}>{c}</a> : <span aria-current="page">{c}</span>}
          {i < items.length - 1 && <i aria-hidden="true">/</i>}
        </span>
      ))}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </nav>
  );
}

export function Buttons({ btns, size = "btn-lg" }: { btns: Btn[]; size?: string }) {
  if (!btns.length) return null;
  return (
    <div className="pg-btns">
      {btns.map((b, i) => (
        <a key={i} href={b.href} className={`btn ${size} ${i === 0 ? "btn-primary" : "btn-glass"}`} data-magnetic>
          {b.label} <span className="arrow">→</span>
        </a>
      ))}
    </div>
  );
}

export function PageHero({ eyebrow, h1, crumbs, path, paras, btns, introHtml }: { eyebrow: string; h1: string; crumbs: string[]; path: string; paras: string[]; btns: Btn[]; introHtml: string }) {
  const rich = /<(ul|ol|table|h3|figure)/.test(introHtml);
  return (
    <>
      <section className="pg-hero" aria-labelledby="pg-h1">
        <ShaderBackdrop />
        <div className="pg-hero-veil" aria-hidden="true" />
        <div className="pg-hero-checker" aria-hidden="true" />
        <div className="wrap pg-hero-in">
          <Crumbs items={crumbs} path={path} />
          <p className="mono eyebrow">{eyebrow}</p>
          <h1 id="pg-h1" className="display-xl" data-split>{h1}</h1>
          {!rich && paras.slice(0, 2).map((p, i) => <p key={i} className="lead" data-reveal dangerouslySetInnerHTML={{ __html: marked.parseInline(p, { async: false }) as string }} />)}
          <Buttons btns={btns} />
        </div>
      </section>
      {(rich || paras.length > 2) && (
        <section className="section pg-sec">
          <div className="wrap-narrow prose" dangerouslySetInnerHTML={{ __html: introHtml }} />
        </section>
      )}
    </>
  );
}

export function CarCards({ groups }: { groups: Extract<Block, { t: "cards" }>["groups"] }) {
  return (
    <section className="section pg-cards" aria-label="Автомобили">
      <div className="wrap">
        {groups.length > 1 && (
          <nav className="pg-chips" aria-label="Классы">
            {groups.map((g, i) => g.label && <a key={i} className="pill" href={`#cls-${i}`}>{g.label}<span className="pill-count">{g.cards.length}</span></a>)}
          </nav>
        )}
        {groups.map((g, gi) => (
          <div key={gi} className="pg-group" id={`cls-${gi}`}>
            {g.label && <h2 className="display pg-group-title" data-split>{g.label}</h2>}
            <div className="car-grid" data-reveal-stagger>
              {g.cards.map((c) => <CarTile key={c.btn?.href ?? c.name} c={c} />)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CarTile({ c }: { c: Card }) {
  return (
    <article className="car-card static">
      <a className="car-card-in" href={c.btn?.href}>
        <div className="car-visual">
          <span className="car-floor" aria-hidden="true" />
          <CarArt slug={c.slug ?? ""} name={c.name} />
        </div>
        <div className="car-info">
          <h3>{c.name}</h3>
          {c.specs.length > 0 && (
            <dl className="car-specs">
              {c.specs.map(([k, v]) => <div key={k}><dt>{k}:</dt><dd>{v}</dd></div>)}
            </dl>
          )}
          {c.price && <p className="car-price">{c.price}</p>}
          {c.btn && <span className="btn btn-primary btn-sm">{c.btn.label} <span className="arrow">→</span></span>}
        </div>
        <span className="car-glare" aria-hidden="true" />
      </a>
    </article>
  );
}

export function Figs({ figs }: { figs: Fig[] }) {
  if (!figs.length) return null;
  return (
    <div className="pg-figs" data-reveal-stagger>
      {figs.map((f, i) => (
        <figure key={i} className="pg-fig">
          <div className="pg-fig-img">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.src} alt={f.caption} loading="lazy" decoding="async" />
          </div>
          <figcaption>{f.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}

export function Section({ b, n }: { b: Extract<Block, { t: "section" }>; n: number }) {
  const wide = /class="(tbl|tiles)"/.test(b.html) || b.figs.length > 0;
  return (
    <section className={`section pg-sec ${n % 2 ? "alt" : ""}`}>
      <div className={`wrap ${wide ? "pg-wide" : "split"}`}>
        <div className={wide ? "section-head" : "sticky"}>
          <p className="mono eyebrow">{String(n + 1).padStart(2, "0")}</p>
          {b.title && <h2 className="display" data-split>{b.title}</h2>}
        </div>
        <div>
          <div className="prose" dangerouslySetInnerHTML={{ __html: b.html }} />
          <Figs figs={b.figs} />
        </div>
      </div>
    </section>
  );
}

export function Faq({ b }: { b: Extract<Block, { t: "faq" }> }) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: b.items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() } })),
  };
  return (
    <section className="section faq-sec">
      <div className="wrap split">
        <div className="sticky">
          <p className="mono eyebrow">FAQ</p>
          <h2 className="display" data-split>{b.title || "Частые вопросы"}</h2>
        </div>
        <div className="faq">
          {b.items.map((f, i) => (
            <details key={f.q} open={i === 0}>
              <summary><span>{f.q}</span><i aria-hidden="true" /></summary>
              <div className="faq-a" dangerouslySetInnerHTML={{ __html: f.a }} />
            </details>
          ))}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </section>
  );
}
