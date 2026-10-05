import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allDocs, getDoc, twinOf, articles, type Doc } from "@/lib/docs";
import { parseDoc, parseReviews } from "@/lib/blocks";
import { ReviewsWall } from "@/components/page/ReviewsWall";
import { fleet } from "@/lib/fleet";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StickyCta } from "@/components/StickyCta";
import { FinalCta } from "@/components/home/FinalCta";
import { Calculator } from "@/components/home/Calculator";
import { Trust } from "@/components/home/Trust";
import { PageHero, CarCards, Section, Faq } from "@/components/page/PageParts";
import { ModelHero } from "@/components/page/ModelHero";
import { ArticleView, NewsGrid } from "@/components/page/Articles";

export const dynamicParams = false;

export function generateStaticParams() {
  return [...allDocs().keys()].filter((p) => p !== "/").map((p) => ({ slug: p.split("/").filter(Boolean) }));
}

const pathOf = (slug: string[]) => "/" + slug.map((s) => decodeURIComponent(s)).join("/");

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const doc = getDoc(pathOf((await params).slug));
  if (!doc) return {};
  return {
    title: { absolute: doc.title },
    description: doc.description,
    alternates: { canonical: doc.path },
    openGraph: { title: doc.title, description: doc.description, url: doc.path, type: doc.kind === "article" ? "article" : "website" },
  };
}

function eyebrowOf(doc: Doc) {
  if (doc.path.startsWith("/vykup")) return "Выкуп";
  if (doc.path.startsWith("/novosti")) return "Новости";
  return "Car City";
}

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const doc = getDoc(pathOf((await params).slug));
  if (!doc) notFound();
  const twin = twinOf(doc)?.path;
  const isModel = doc.kind === "model";
  const p = parseDoc(doc.body, { twin, model: isModel });
  const car = isModel ? fleet.find((f) => [f.rent, f.buy].some((x) => x?.toLowerCase() === doc.path.toLowerCase())) : undefined;
  const name = p.crumbs[p.crumbs.length - 1] ?? car?.name ?? doc.h1;

  // у ленты новостей и стены отзывов вступление — это сам список, его рисуют отдельные компоненты
  const list = doc.path === "/novosti" || doc.path === "/reviews";
  let n = 0;
  return (
    <>
      <Header />
      <main id="main" className={`pg pg-${doc.kind}`}>
        {doc.kind === "article" ? (
          <ArticleView doc={doc} p={p} />
        ) : isModel ? (
          <ModelHero h1={doc.h1} name={name} slug={car?.slug ?? ""} cls={doc.cls} mode={doc.mode} twin={twin} path={doc.path} crumbs={p.crumbs} specs={p.intro.specs} price={p.intro.price} btns={p.intro.btns} gallery={doc.gallery} />
        ) : (
          <PageHero eyebrow={eyebrowOf(doc)} h1={doc.h1} crumbs={p.crumbs} path={doc.path} paras={list ? [] : p.intro.paras} btns={p.intro.btns} introHtml={list ? "" : p.intro.html} />
        )}
        {doc.path === "/novosti" && <NewsGrid src={doc.body} list={articles()} />}
        {doc.path === "/reviews" && <ReviewsWall items={parseReviews(doc.body)} />}
        {doc.kind !== "article" &&
          p.blocks.map((b, i) => {
            if (b.t === "cards") return <CarCards key={i} groups={b.groups} />;
            if (b.t === "calculator") return <Calculator key={i} />;
            if (b.t === "trust") return <Trust key={i} />;
            if (b.t === "faq") return <Faq key={i} b={b} />;
            if (doc.path === "/novosti") return null;
            return <Section key={i} b={b} n={n++} />;
          })}
        {(p.final || isModel) && <FinalCta />}
      </main>
      <Footer />
      <StickyCta />
    </>
  );
}
