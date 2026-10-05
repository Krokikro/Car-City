import type { Doc } from "@/lib/docs";
import { localHref, type Parsed } from "@/lib/blocks";
import { Crumbs } from "./PageParts";
import { href, type Lang } from "@/lib/i18n";
import { ui } from "@/lib/ui";

const words = (s: string) => s.replace(/[#*\[\]()!|>-]/g, " ").split(/\s+/).filter(Boolean).length;

export function ArticleView({ doc, p, lang = "ru" }: { doc: Doc; p: Parsed; lang?: Lang }) {
  const t = ui(lang);
  const html = [p.intro.html, ...p.blocks.map((b) => (b.t === "section" ? `<h2 id="${slugify(b.title)}">${b.title}</h2>${b.html}` : b.t === "faq" ? `<h2>${b.title || t.faq}</h2>${b.items.map((q) => `<h3>${q.q}</h3>${q.a}`).join("")}` : ""))].join("");
  const toc = p.blocks.filter((b) => b.t === "section" && b.title).map((b) => (b as { title: string }).title);
  const min = Math.max(1, Math.round(words(doc.body) / 180));
  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: doc.h1,
    datePublished: doc.date?.split(".").reverse().join("-"),
    publisher: { "@type": "Organization", name: "Car City" },
    mainEntityOfPage: `https://car-city.pro${doc.path}`,
  };
  return (
    <article className="art">
      <header className="art-hero">
        <div className="art-hero-bg" aria-hidden="true" />
        <div className="wrap-narrow">
          <Crumbs items={[t.home, t.news, doc.h1]} path={doc.path} lang={lang} />
          <p className="mono eyebrow">{[doc.date, `${min} ${t.readMin}`].filter(Boolean).join(" · ")}</p>
          <h1 className="display art-h1" data-split>{doc.h1}</h1>
        </div>
        <div className="art-progress" aria-hidden="true"><i /></div>
      </header>
      <div className="wrap art-grid">
        {toc.length > 2 && (
          <nav className="art-toc mono" aria-label={t.toc}>
            <p>{t.toc}</p>
            <ol>{toc.map((t) => <li key={t}><a href={`#${slugify(t)}`}>{t}</a></li>)}</ol>
          </nav>
        )}
        <div className="prose art-body" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </article>
  );
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 60);
}

/** Лента статей: порядок, даты и анонсы — со страницы /novosti старого сайта */
export function NewsGrid({ src, list, lang = "ru" }: { src: string; list: (Doc & { date?: string })[]; lang?: Lang }) {
  const cards = [...src.matchAll(/^### \[([^\]]+)\]\(([^)]+)\)\s*\n+(\d{2}\.\d{2}\.\d{4})?\s*\n*([^\n#][^\n]*)?/gm)].map((m) => ({
    title: m[1], href: localHref(m[2]), date: m[3], text: m[4],
  }));
  const have = new Set(list.map((a) => a.path.toLowerCase()));
  return (
    <section className="section news" aria-label={ui(lang).articles}>
      <div className="wrap news-grid" data-reveal-stagger>
        {cards.map((c, i) => (
          <a key={c.href} href={href(c.href, lang)} className={`news-card ${i === 0 ? "big" : ""}`} data-ready={have.has(c.href.toLowerCase())}>
            <span className="news-n mono">{String(i + 1).padStart(2, "0")}</span>
            {c.date && <time className="mono">{c.date}</time>}
            <h2>{c.title}</h2>
            {c.text && <p className="muted">{c.text}</p>}
            <span className="news-go" aria-hidden="true">→</span>
          </a>
        ))}
      </div>
    </section>
  );
}
