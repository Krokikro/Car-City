import { fleet, saleLabel } from "@/lib/fleet";
import type { ReactNode } from "react";
import { marked } from "marked";
import type { Block, Btn, Card, Fig } from "@/lib/blocks";
import { CarArt } from "../CarArt";
import { GenImage, pageKey } from "../GenImage";
import { asset, href, type Lang } from "@/lib/i18n";
import { ui } from "@/lib/ui";

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

export function Crumbs({ items, path, lang = "ru" }: { items: string[]; path: string; lang?: Lang }) {
  if (!items.length) return null;
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((name, i) => ({ "@type": "ListItem", position: i + 1, name, item: `https://car-city.pro${crumbHref(i, items.length, path)}` })),
  };
  return (
    <nav className="crumbs mono" aria-label={ui(lang).crumbs}>
      {items.map((c, i) => (
        <span key={i}>
          {i < items.length - 1 ? <a href={href(crumbHref(i, items.length, path), lang)}>{c}</a> : <span aria-current="page">{c}</span>}
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

// Визуал первого экрана внутренних страниц: у разделов с машинами — веер фото этих машин,
// у остальных — кадр из видео парка с медленным наездом камеры.
export type HeroStat = { k: string; v: string; pre?: string; u?: string; i?: "car" | "tag" | "bolt" | "gift" | "sun" };

const STAT_ICON: Record<NonNullable<HeroStat["i"]>, ReactNode> = {
  car: <path d="M5 16l1.6-5A2 2 0 0 1 8.5 9.6h7a2 2 0 0 1 1.9 1.4L19 16M4 16h16v3h-2.5v-1.5h-11V19H4zM8 13h.01M16 13h.01" />,
  tag: <path d="M3 12V4h8l10 10-8 8zM7.5 8.5h.01" />,
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  gift: <path d="M4 11h16v9H4zM3 7.5h18V11H3zM12 7.5V20M12 7.5C9.500 7.500 8 6.500 8 5.200 8 4 9 3.500 10 3.800c1.200.4 2 2 2 3.700zm0 0c2.500 0 4-1 4-2.300C16 4 15 3.500 14 3.800c-1.200.4-2 2-2 3.700z" />,
  sun: <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.500 1.500M17.500 17.500 19 19M5 19l1.500-1.500M17.500 6.500 19 5" />,
};

function StatTiles({ stats, strip }: { stats: HeroStat[]; strip?: boolean }) {
  return (
    <dl className={`pg-stats${strip ? " pg-stats-big" : ""}`}>
      {stats.map((x) => (
        <div key={x.k}>
          {x.i && <svg className="pg-stat-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{STAT_ICON[x.i]}</svg>}
          <dt className="mono">{x.k}</dt>
          <dd>{x.pre && <small>{x.pre}</small>}<b>{x.v}</b>{x.u && <small>{x.u}</small>}</dd>
        </div>
      ))}
    </dl>
  );
}

export function PageHero({ eyebrow, h1, crumbs, path, paras, btns, introHtml, cars = [], lang = "ru", video, stats = [] }: { eyebrow: string; h1: string; crumbs: string[]; path: string; paras: string[]; btns: Btn[]; introHtml: string; cars?: { slug: string; name: string }[]; lang?: Lang; video?: string; stats?: HeroStat[] }) {
  const rich = /<(ul|ol|table|h3|figure)/.test(introHtml);
  return (
    <>
      <section className={`pg-hero${video ? " pg-hero-video" : cars.length ? " pg-hero-cars" : ""}`} aria-labelledby="pg-h1">
        <div className="pg-hero-bg" aria-hidden="true">
          {video ? (
            // атрибут muted должен быть в самом HTML: React на сервере его не выводит, и браузер не запускает видео до гидрации — отсюда «картинка вместо видео» первые секунды
            <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: `<video class="pg-hero-vid" src="${asset(`/classes/${video}.mp4`)}?v=4" poster="${asset(`/classes/${video}.webp`)}?v=4" autoplay muted loop playsinline preload="auto"></video>` }} />
          ) : (
            !cars.length && <GenImage kind="pages" id={pageKey(path)} className="pg-hero-photo" priority />
          )}
          <i /><i /><i />
        </div>
        {!video && cars.length > 0 && (
          <div className="pg-fan" aria-hidden="true">
            {cars.slice(0, 3).map((c, i) => (
              <div key={c.slug} className="pg-fan-card" style={{ ["--i" as string]: i }}>
                <CarArt slug={c.slug} name={c.name} priority={i === 0} sizes="(max-width: 900px) 70vw, 34vw" />
              </div>
            ))}
          </div>
        )}
        <div className="pg-hero-veil" aria-hidden="true" />
        <div className="pg-hero-checker" aria-hidden="true" />
        <div className="wrap pg-hero-in">
          <Crumbs items={crumbs} path={path} lang={lang} />
          <p className="mono eyebrow">{eyebrow}</p>
          <h1 id="pg-h1" className="display-xl" data-split>{h1}</h1>
          {!rich && paras.slice(0, 2).map((p, i) => <p key={i} className="lead" data-reveal dangerouslySetInnerHTML={{ __html: marked.parseInline(p, { async: false }) as string }} />)}
          <Buttons btns={btns} />
          {stats.length > 0 && <StatTiles stats={stats} strip={!!video} />}
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

export function CarCards({ groups, lang = "ru" }: { groups: Extract<Block, { t: "cards" }>["groups"]; lang?: Lang }) {
  const t = ui(lang);
  return (
    <section className="section pg-cards" aria-label={t.cars}>
      <div className="wrap">
        {groups.length > 1 && (
          <nav className="pg-chips" aria-label={t.classes}>
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
  const car = c.slug ? fleet.find((f) => f.slug === c.slug) : undefined;
  const sale = car ? saleLabel(car) : undefined;
  return (
    <article className={`car-card static${sale ? " has-sale" : ""}`}>
      <a className="car-card-in" href={c.btn?.href}>
        <div className="car-visual">
          <span className="car-floor" aria-hidden="true" />
          <CarArt slug={c.slug ?? ""} name={c.name} lit />
          {sale && <span className="ft-sale"><i aria-hidden="true">%</i>{sale}</span>}
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

export function Figs({ figs, to }: { figs: Fig[]; to?: string }) {
  if (!figs.length) return null;
  return (
    <div className={`pg-figs${figs.every((f) => f.src.startsWith("/team/")) ? " pg-team" : ""}`} data-reveal-stagger>
      {figs.map((f, i) => {
        const m = f.caption.match(/^\*\*(.+?)\*\*\s*[—–-]?\s*(.*)$/);
        const plain = f.caption.replace(/\*\*/g, "");
        return (
        <figure key={i} className="pg-fig">
          {(() => {
            const inner = (
              <>
                <div className="pg-fig-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.src.startsWith("/") ? asset(f.src) : f.src} alt={plain} loading="lazy" decoding="async" />
                </div>
                <figcaption>{m ? <><strong>{m[1]}</strong>{m[2]}</> : plain}</figcaption>
              </>
            );
            return to ? <a className="pg-fig-link" href={to}>{inner}</a> : inner;
          })()}
        </figure>
        );
      })}
    </div>
  );
}

export function Section({ b, n, center = false, extra = "" }: { b: Extract<Block, { t: "section" }>; n: number; center?: boolean; extra?: string }) {
  const wide = /class="(tbl|tiles)"/.test(b.html) || b.figs.length > 0;
  return (
    <section className={`section pg-sec ${n % 2 ? "alt" : ""} ${extra}`}>
      <div className={`wrap ${wide ? "pg-wide" : "split"}${center ? " pg-center" : ""}`}>
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

export function Faq({ b, lang = "ru" }: { b: Extract<Block, { t: "faq" }>; lang?: Lang }) {
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
          <h2 className="display" data-split>{b.title || ui(lang).faq}</h2>
        </div>
        <div className="faq">
          {b.items.map((f, i) => (
            <details key={f.q}>
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
