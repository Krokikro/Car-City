import type { Doc } from "@/lib/docs";
import { localHref, type Parsed } from "@/lib/blocks";
import { Crumbs } from "./PageParts";
import { asset, href, type Lang } from "@/lib/i18n";
import { company } from "@/lib/content";
import { ui } from "@/lib/ui";
import { GenImage, hasGen } from "../GenImage";

const words = (s: string) => s.replace(/[#*\[\]()!|>-]/g, " ").split(/\s+/).filter(Boolean).length;

// E-E-A-T: кто пишет, кто проверяет и почему этому можно доверять. Только реальные данные компании (lib/content).
// Автор-эксперт с именем появится, когда владелец даст имя и должность: тогда заполнить EXPERT.
const EXPERT: { name: string; role: string } | null = null;
const E = {
  ru: {
    by: "Автор", team: "Редакция Car City", checked: "Проверено", checkedBy: "специалистами по аренде и выкупу Car City",
    published: "Опубликовано", read: "Время чтения",
    aboutT: "Об авторе", about: (y: number) => `Car City — таксопарк в Москве, ${y} лет работаем с водителями такси: сдаём машины в аренду и продаём в выкуп, подключаем к агрегаторам. Статьи пишем по собственному опыту работы парка: реальные условия, цены и требования, с которыми водители сталкиваются каждый день.`,
    facts: [["авто в парке", "fleet"], ["водителей арендовали", "renters"], ["выкупили авто", "boughtOut"]] as const,
    rating: "5,0 на Яндекс Картах, 2GIS, Flamp и Yell", aboutLink: "О компании", reviewsLink: "Отзывы водителей",
    note: "Информация актуальна на дату публикации. Цены, условия аренды и выкупа, требования агрегаторов могут меняться — точные условия на сегодня подскажет менеджер.",
    ctaT: "Остались вопросы?", ctaX: "Ответим и подберём машину под ваш график — в день обращения.", cta: "Получить консультацию",
    more: "Читайте также",
  },
  en: {
    by: "Author", team: "Car City editorial team", checked: "Reviewed", checkedBy: "by Car City rental and rent-to-own specialists",
    published: "Published", read: "Reading time",
    aboutT: "About the author", about: (y: number) => `Car City is a taxi fleet in Moscow. For ${y} years we have worked with taxi drivers: we rent out cars, sell them on a rent-to-own basis and connect drivers to ride-hailing apps. Our articles are based on the fleet's own experience: real terms, prices and requirements drivers face every day.`,
    facts: [["cars in the fleet", "fleet"], ["drivers have rented", "renters"], ["cars bought out", "boughtOut"]] as const,
    rating: "5.0 on Yandex Maps, 2GIS, Flamp and Yell", aboutLink: "About us", reviewsLink: "Driver reviews",
    note: "The information is current as of the publication date. Prices, rental and rent-to-own terms and ride-hailing requirements may change — a manager will confirm today's terms.",
    ctaT: "Still have questions?", ctaX: "We will answer and pick a car for your schedule — the same day.", cta: "Get advice",
    more: "Read also",
  },
};
type ArticleCard = { path: string; h1: string; date?: string };

export function ArticleView({ doc, p, lang = "ru", related = [] }: { doc: Doc; p: Parsed; lang?: Lang; related?: ArticleCard[] }) {
  const t = ui(lang);
  const e = lang === "en" ? E.en : E.ru;
  const slug = doc.path.split("/").pop() ?? "";
  const cover = hasGen("news", slug);
  // своя обложка есть — убираем из текста старую картинку с car-city.pro (первую в статье)
  const intro = cover ? p.intro.html.replace(/<p>\s*<img[^>]*>\s*<\/p>|<img[^>]*>/, "") : p.intro.html;
  const html = [intro, ...p.blocks.map((b) => (b.t === "section" ? `<h2 id="${slugify(b.title)}">${b.title}</h2>${b.html}` : b.t === "faq" ? `<h2>${b.title || t.faq}</h2>${b.items.map((q) => `<h3>${q.q}</h3>${q.a}`).join("")}` : ""))].join("");
  const toc = p.blocks.filter((b) => b.t === "section" && b.title).map((b) => (b as { title: string }).title);
  const min = Math.max(1, Math.round(words(doc.body) / 180));
  const iso = doc.date?.split(".").reverse().join("-");
  const url = `${company.domain}${href(doc.path, lang)}`;
  const org = { "@type": "Organization", "@id": `${company.domain}/#org`, name: company.name, legalName: company.legalName, url: company.domain, logo: { "@type": "ImageObject", url: `${company.domain}/brand/emblem-192.png` } };
  const faqs = p.blocks.flatMap((b) => (b.t === "faq" ? b.items : []));
  const strip = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: doc.h1,
      description: doc.description,
      inLanguage: doc.lang,
      datePublished: iso,
      dateModified: iso,
      author: EXPERT ? { "@type": "Person", name: EXPERT.name, jobTitle: EXPERT.role, worksFor: org } : org,
      publisher: org,
      ...(cover ? { image: `${company.domain}/news/${slug}-1200.webp` } : {}),
      mainEntityOfPage: url,
      wordCount: words(doc.body),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t.home, item: `${company.domain}${href("/", lang)}` },
        { "@type": "ListItem", position: 2, name: t.news, item: `${company.domain}${href("/novosti", lang)}` },
        { "@type": "ListItem", position: 3, name: doc.h1, item: url },
      ],
    },
    ...(faqs.length
      ? [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((q) => ({ "@type": "Question", name: strip(q.q), acceptedAnswer: { "@type": "Answer", text: strip(q.a) } })) }]
      : []),
  ];
  const byline = (
    <div className="art-byline">
      <span className="art-avatar" aria-hidden="true"><img src={asset("/brand/emblem-96.png")} alt="" width={44} height={44} /></span>
      <dl>
        <div><dt>{e.by}</dt><dd>{EXPERT ? `${EXPERT.name}, ${EXPERT.role}` : e.team}</dd></div>
        <div><dt>{e.checked}</dt><dd>{e.checkedBy}</dd></div>
        {doc.date && <div><dt>{e.published}</dt><dd><time dateTime={iso}>{doc.date}</time></dd></div>}
        <div><dt>{e.read}</dt><dd>{min} {t.readMin}</dd></div>
      </dl>
    </div>
  );
  return (
    <article className="art">
      <header className="art-hero">
        <div className="art-hero-bg" aria-hidden="true" />
        <div className="wrap-narrow">
          <Crumbs items={[t.home, t.news, doc.h1]} path={doc.path} lang={lang} />
          <h1 className="display art-h1" data-split>{doc.h1}</h1>
          {byline}
        </div>
        {cover && <GenImage kind="news" id={slug} className="art-cover" sizes="(max-width: 900px) 100vw, 900px" priority alt={doc.h1} />}
        <div className="art-progress" aria-hidden="true"><i /></div>
      </header>
      <div className="wrap art-grid">
        {toc.length > 2 && (
          <nav className="art-toc mono" aria-label={t.toc}>
            <p>{t.toc}</p>
            <ol>{toc.map((t) => <li key={t}><a href={`#${slugify(t)}`}>{t}</a></li>)}</ol>
          </nav>
        )}
        <div className="art-main">
          <div className="prose art-body" dangerouslySetInnerHTML={{ __html: html }} />
          <p className="art-note"><span aria-hidden="true">i</span>{e.note}</p>
          <aside className="art-author" aria-label={e.aboutT}>
            <div className="art-author-head">
              <span className="art-avatar big" aria-hidden="true"><img src={asset("/brand/emblem-96.png")} alt="" width={56} height={56} /></span>
              <div>
                <p className="art-author-k mono">{e.aboutT}</p>
                <p className="art-author-n">{EXPERT ? EXPERT.name : e.team}</p>
                <p className="art-author-r">{company.legalName} · {e.rating}</p>
              </div>
            </div>
            <p>{e.about(company.years)}</p>
            <ul className="art-author-facts">
              {e.facts.map(([l, k]) => <li key={k}><b>{company[k]}</b><span>{l}</span></li>)}
            </ul>
            <p className="art-author-links">
              <a href={href("/o-nas", lang)}>{e.aboutLink} →</a>
              <a href={href("/reviews", lang)}>{e.reviewsLink} →</a>
            </p>
          </aside>
          <div className="art-cta">
            <div>
              <p className="art-cta-t">{e.ctaT}</p>
              <p>{e.ctaX}</p>
            </div>
            <a href="#zayavka" className="btn btn-primary" data-lead="rent">{e.cta}</a>
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <section className="wrap art-more" aria-labelledby="art-more-t">
          <h2 id="art-more-t" className="display">{e.more}</h2>
          <div className="art-more-grid">
            {related.map((a) => {
              const s = a.path.split("/").pop() ?? "";
              return (
                <a key={a.path} href={href(a.path, lang)} className="art-more-card">
                  {hasGen("news", s) && <GenImage kind="news" id={s} className="art-more-img" sizes="(max-width: 700px) 100vw, 33vw" />}
                  {a.date && <time className="mono">{a.date}</time>}
                  <span className="art-more-h">{a.h1}</span>
                </a>
              );
            })}
          </div>
        </section>
      )}
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
            <GenImage kind="news" id={c.href.split("/").pop() ?? ""} className="news-img" sizes="(max-width: 700px) 100vw, 33vw" />
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
