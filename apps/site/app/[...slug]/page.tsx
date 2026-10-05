import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allDocs, getDoc, twinOf, articles, type Doc } from "@/lib/docs";
import { parseDoc, parseReviews } from "@/lib/blocks";
import { ReviewsWall } from "@/components/page/ReviewsWall";
import { fleet } from "@/lib/fleet";
import { carImages } from "@/lib/car-images";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StickyCta } from "@/components/StickyCta";
import { HtmlLang } from "@/components/HtmlLang";
import { FinalCta } from "@/components/home/FinalCta";
import { Calculator } from "@/components/home/Calculator";
import { Trust } from "@/components/home/Trust";
import { HomePage } from "@/components/home/HomePage";
import { PageHero, CarCards, Section, Faq } from "@/components/page/PageParts";
import { ModelHero } from "@/components/page/ModelHero";
import { ArticleView, NewsGrid } from "@/components/page/Articles";
import { SitemapView } from "@/components/page/SitemapView";
import { LANGS, isLang, type Lang } from "@/lib/i18n";
import { alternates, homeMeta } from "@/lib/meta";
import { ui } from "@/lib/ui";

export const dynamicParams = false;

// Русские страницы — по адресам старого сайта, переводы — те же адреса под /en, /ky, /kk, /uz
export function generateStaticParams() {
  const out: { slug: string[] }[] = [];
  for (const lang of LANGS) {
    const pre = lang === "ru" ? [] : [lang];
    if (lang !== "ru") out.push({ slug: [lang] }, { slug: [lang, "sitemap"] });
    for (const p of allDocs(lang).keys()) if (p !== "/") out.push({ slug: [...pre, ...p.split("/").filter(Boolean)] });
  }
  return out;
}

function resolve(slug: string[]): { lang: Lang; path: string } {
  const seg = slug.map((s) => decodeURIComponent(s));
  const lang = isLang(seg[0]) && seg[0] !== "ru" ? (seg.shift() as Lang) : "ru";
  return { lang, path: "/" + seg.join("/") };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { lang, path } = resolve((await params).slug);
  if (path === "/") return homeMeta(lang);
  if (path === "/sitemap") return { title: ui(lang).sitemap, alternates: alternates(path, lang) };
  const doc = getDoc(path, lang);
  if (!doc) return {};
  const alt = alternates(doc.path, lang);
  return {
    title: { absolute: doc.title },
    description: doc.description,
    alternates: alt,
    openGraph: { title: doc.title, description: doc.description, url: alt.canonical, type: doc.kind === "article" ? "article" : "website" },
  };
}

// Какие машины показать в шапке раздела: по классу из адреса или по марке из заголовка
const CLASS_OF: [RegExp, string][] = [[/komfort-?pl/, "komfort-plus"], [/komfort/, "komfort"], [/ekonom/, "ekonom"], [/gruzov/, "gruzovoy"]];
function heroCars(doc: Doc) {
  const withPhoto = fleet.filter((f) => carImages[f.slug]);
  const cls = CLASS_OF.find(([re]) => re.test(doc.path))?.[1];
  const brand = doc.path.match(/^\/(kia|chery)-/)?.[1];
  const pick = brand ? withPhoto.filter((f) => f.slug.startsWith(brand)) : cls ? withPhoto.filter((f) => f.cls === cls) : doc.path === "/vykup" ? withPhoto : [];
  return pick.map((f) => ({ slug: f.slug, name: f.name }));
}

function eyebrowOf(doc: Doc, lang: Lang) {
  const t = ui(lang);
  if (doc.path.startsWith("/vykup")) return t.buy;
  if (doc.path.startsWith("/novosti")) return t.news;
  return "Car City";
}

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { lang, path } = resolve((await params).slug);
  if (path === "/") return <HomePage lang={lang} />;
  if (path === "/sitemap")
    return (
      <>
        <HtmlLang lang={lang} />
        <Header />
        <SitemapView lang={lang} />
        <Footer lang={lang} />
      </>
    );
  const doc = getDoc(path, lang);
  if (!doc) notFound();
  const twin = twinOf(doc, lang)?.path;
  const isModel = doc.kind === "model";
  const p = parseDoc(doc.body, { twin, model: isModel, lang });
  const car = isModel ? fleet.find((f) => [f.rent, f.buy].some((x) => x?.toLowerCase() === doc.path.toLowerCase())) : undefined;
  const name = car?.name ?? p.crumbs[p.crumbs.length - 1] ?? doc.h1;

  // у ленты новостей и стены отзывов вступление — это сам список, его рисуют отдельные компоненты
  const list = doc.path === "/novosti" || doc.path === "/reviews";
  let n = 0;
  return (
    <>
      <HtmlLang lang={doc.lang} />
      <Header />
      <main id="main" className={`pg pg-${doc.kind}`}>
        {lang !== "ru" && doc.lang === "ru" && <p className="wrap pg-untranslated mono">{ui(lang).notTranslated}</p>}
        {doc.kind === "article" ? (
          <ArticleView doc={doc} p={p} lang={lang} />
        ) : isModel ? (
          <ModelHero h1={doc.h1} name={name} slug={car?.slug ?? ""} cls={doc.cls} mode={doc.mode} twin={twin} path={doc.path} crumbs={p.crumbs} specs={p.intro.specs} price={p.intro.price} btns={p.intro.btns} gallery={doc.gallery} lang={lang} />
        ) : (
          <PageHero eyebrow={eyebrowOf(doc, lang)} h1={doc.h1} crumbs={p.crumbs} path={doc.path} paras={list ? [] : p.intro.paras} btns={p.intro.btns} introHtml={list ? "" : p.intro.html} cars={heroCars(doc)} lang={lang} />
        )}
        {doc.path === "/novosti" && <NewsGrid src={doc.body} list={articles(lang)} lang={lang} />}
        {doc.path === "/reviews" && <ReviewsWall items={parseReviews(doc.body)} lang={lang} />}
        {doc.kind !== "article" &&
          p.blocks.map((b, i) => {
            if (b.t === "cards") return <CarCards key={i} groups={b.groups} lang={lang} />;
            if (b.t === "calculator") return <Calculator key={i} />;
            if (b.t === "trust") return <Trust key={i} lang={lang} />;
            if (b.t === "faq") return <Faq key={i} b={b} lang={lang} />;
            if (doc.path === "/novosti") return null;
            return <Section key={i} b={b} n={n++} />;
          })}
        {(p.final || isModel) && <FinalCta lang={lang} />}
      </main>
      <Footer lang={lang} />
      <StickyCta lang={lang} />
    </>
  );
}
