import type { Metadata } from "next";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import { refreshOverlay, draftOverlay } from "@/lib/admin/overlay";
import { allDocs, getDoc, twinOf, articles, type Doc } from "@/lib/docs";
import { parseDoc, parseReviews } from "@/lib/blocks";
import { siteReviews } from "@/lib/reviews";
import { ReviewsWall } from "@/components/page/ReviewsWall";
import { fleet } from "@/lib/fleet";
import { carImages } from "@/lib/car-images";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StickyCta } from "@/components/StickyCta";
import { HtmlLang } from "@/components/HtmlLang";
import { FinalCta } from "@/components/home/FinalCta";
import { Steps, Requirements } from "@/components/home/Steps";
import { VykupBenefits, VykupConditions, savingsHtml } from "@/components/page/VykupParts";
import { BenefitsView, FleetNotes, PriceTable } from "@/components/page/ClassParts";
import { TariffCards } from "@/components/page/TariffCards";
import { Reviews } from "@/components/home/Reviews";
import { tariffsOf } from "@/lib/terms";
import { homeText } from "@/lib/home-text";
import { Calculator } from "@/components/home/Calculator";
import { Trust } from "@/components/home/Trust";
import { HomePage } from "@/components/home/HomePage";
import { GiftCta, isGift } from "@/components/page/GiftCta";
import { PageHero, CarCards, Section, Faq, type HeroStat } from "@/components/page/PageParts";
import { ModelHero } from "@/components/page/ModelHero";
import { modelPanels } from "@/lib/model-panels";
import { ArticleView, NewsGrid } from "@/components/page/Articles";
import { SitemapView } from "@/components/page/SitemapView";
import { ContactView } from "@/components/page/ContactView";
import { AboutView } from "@/components/page/AboutView";
import { TermsView } from "@/components/page/TermsView";
import { termsOf } from "@/lib/terms";
import { LANGS, isLang, type Lang } from "@/lib/i18n";
import { alternates, homeMeta } from "@/lib/meta";
import { ui } from "@/lib/ui";

// Содержимое можно менять из админки: новые адреса собираются по первому заходу, готовые страницы обновляются после публикации
export const dynamicParams = true;
export const revalidate = 300;

async function overlayNow() {
  return (await draftMode()).isEnabled ? draftOverlay() : refreshOverlay();
}

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
  const doc = getDoc(path, lang, await overlayNow());
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
  // на страницах аренды не показываем машины, которые есть только под выкуп
  const withPhoto = fleet.filter((f) => carImages[f.slug] && (f.rent || doc.path.startsWith("/vykup")));
  const cls = CLASS_OF.find(([re]) => re.test(doc.path))?.[1];
  const brand = doc.path.match(/^\/(kia|chery)-/)?.[1];
  const pick = brand ? withPhoto.filter((f) => f.slug.startsWith(brand)) : cls ? withPhoto.filter((f) => f.cls === cls) : doc.path === "/vykup" ? withPhoto : [];
  return pick.map((f) => ({ slug: f.slug, name: f.name }));
}

// Видео в шапке страниц классов и выкупа (сгенерированы в Higgsfield, public/classes)
const VIDEO_OF: [RegExp, string][] = [
  [/^\/vykup\/ekonom/, "ekonom"], [/^\/vykup\/komfort-pl/, "komfort-plus"], [/^\/vykup\/komfort/, "komfort"], [/^\/vykup\/?$/, "vykup"],
  [/^\/ekonom/, "ekonom"], [/^\/kia-/, "ekonom"], [/^\/komfortplus/, "komfort-plus"], [/^\/komfort/, "komfort"], [/^\/chery-/, "komfort"],
  [/^\/gruzov/, "gruzovoy"], [/^\/arenda-taksi-ip/, "komfort-plus"],
];
const STAT_T: Record<string, { models: string; from: string; pre: string; day: string; fast: string; fastV: string; fastU: string; gift: string; giftV: string; giftU: string; rest: string; restV: string; restU: string }> = {
  ru: { models: "Моделей", from: "Цена", pre: "от", day: "₽ в сутки", fast: "Выдача", fastV: "В день", fastU: "заявки", gift: "Первый день", giftV: "0 ₽", giftU: "бесплатно", rest: "Отпуск", restV: "14 дней", restU: "в году" },
  en: { models: "Models", from: "Price", pre: "from", day: "₽ / day", fast: "Pick-up", fastV: "Same day", fastU: "as you apply", gift: "First day", giftV: "Free", giftU: "on rent", rest: "Vacation", restV: "14 days", restU: "a year" },
};
function heroStats(doc: Doc, cars: { slug: string }[], lang: Lang): HeroStat[] {
  if (!cars.length) return [];
  const t = STAT_T[lang] ?? STAT_T.ru;
  const buy = doc.path.startsWith("/vykup");
  const prices = cars.map((c) => { const f = fleet.find((x) => x.slug === c.slug); return (buy ? f?.buyPrice : f?.price) ?? 0; }).filter(Boolean);
  const min = prices.length ? Math.min(...prices) : 0;
  return [
    { k: t.models, v: String(cars.length), i: "car" },
    ...(min ? [{ k: t.from, pre: t.pre, v: min.toLocaleString("ru-RU"), u: t.day, i: "tag" as const }] : []),
    { k: t.fast, v: t.fastV, u: t.fastU, i: "bolt" },
    buy ? { k: t.rest, v: t.restV, u: t.restU, i: "sun" } : { k: t.gift, v: t.giftV, u: t.giftU, i: "gift" },
  ];
}

function eyebrowOf(doc: Doc, lang: Lang) {
  const t = ui(lang);
  if (doc.path.startsWith("/vykup")) return t.buy;
  if (doc.path.startsWith("/novosti")) return t.news;
  return "Car City";
}

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { lang, path } = resolve((await params).slug);
  const ov = await overlayNow();
  if (path === "/") return <HomePage lang={lang} />;
  if (path === "/sitemap")
    return (
      <>
        <HtmlLang lang={lang} />
        <Header />
        <SitemapView lang={lang} ov={ov} />
        <Footer lang={lang} />
      </>
    );
  const doc = getDoc(path, lang, ov);
  if (!doc) notFound();
  const twin = twinOf(doc, lang, ov)?.path;
  const isModel = doc.kind === "model";
  const p = parseDoc(doc.body, { twin, model: isModel, lang });
  const car = isModel ? fleet.find((f) => [f.rent, f.buy].some((x) => x?.toLowerCase() === doc.path.toLowerCase())) : undefined;
  const name = car?.name ?? p.crumbs[p.crumbs.length - 1] ?? doc.h1;

  // у ленты новостей и стены отзывов вступление — это сам список, его рисуют отдельные компоненты
  const list = doc.path === "/novosti" || doc.path === "/reviews";
  const contact = doc.path === "/contact";
  const about = doc.path === "/o-nas";
  const terms = doc.path === "/usloviya" ? termsOf(p) : undefined;
  const own = contact || about || !!terms;
  const classVideo = doc.kind !== "article" && !isModel ? VIDEO_OF.find(([re]) => re.test(doc.path))?.[1] : undefined;
  let n = 0;
  // страница выкупа: выгоды, условия и тарифы — крупными карточками (тексты те же)
  const vykup = doc.path === "/vykup";
  let si = 0;
  const buyPage = doc.path.startsWith("/vykup");
  const ipPage = doc.path === "/arenda-taksi-ip";
  const truckPage = /^\/gruzov/.test(doc.path);
  const classPage = !!classVideo && !isModel && !vykup;
  let reqDone = false;
  const steps = <Steps steps={homeText(lang).steps} variant={buyPage ? "buy" : "rent"} vehicle={/^\/gruzov/.test(doc.path) ? "truck" : "taxi"} />;
  return (
    <>
      <HtmlLang lang={doc.lang} />
      <Header />
      <main id="main" className={`pg pg-${doc.kind}${doc.path.startsWith("/vykup") ? " pg-vykup" : ""}`}>
        {lang !== "ru" && doc.lang === "ru" && <p className="wrap pg-untranslated mono">{ui(lang).notTranslated}</p>}
        {doc.kind === "article" ? (
          <ArticleView doc={doc} p={p} lang={lang} />
        ) : isModel ? (
          <ModelHero h1={doc.h1} name={name} slug={car?.slug ?? ""} cls={doc.cls} mode={doc.mode} twin={twin} path={doc.path} crumbs={p.crumbs} specs={p.intro.specs} price={p.intro.price} btns={p.intro.btns} gallery={doc.gallery} lang={lang} panels={modelPanels(p, car, doc.cls ? ui(lang).cls[doc.cls] ?? undefined : undefined)} />
        ) : (
          <PageHero eyebrow={eyebrowOf(doc, lang)} h1={doc.h1} crumbs={p.crumbs} path={doc.path} paras={list || own ? [] : p.intro.paras} btns={p.intro.btns} introHtml={list || own ? "" : p.intro.html} cars={heroCars(doc)} lang={lang} video={classVideo} stats={heroStats(doc, heroCars(doc), lang)} />
        )}
        {doc.path === "/novosti" && <NewsGrid src={doc.body} list={articles(lang, ov)} lang={lang} />}
        {doc.path === "/reviews" && <ReviewsWall items={await siteReviews(parseReviews(doc.body))} lang={lang} />}
        {contact && <ContactView lang={lang} />}
        {about && <AboutView p={p} lang={lang} />}
        {terms && <TermsView terms={terms} lang={lang} />}
        {doc.kind !== "article" && !own &&
          p.blocks.map((b, i) => {
            if (b.t === "cards")
              return (
                <Fragment key={i}>
                  <CarCards groups={b.groups} lang={lang} />
                  {/* «Аренда такси для ИП»: требования к водителям сразу под машинами */}
                  {ipPage && !reqDone && (reqDone = true) && <Requirements req={homeText(lang).requirements} />}
                </Fragment>
              );
            if (b.t === "calculator") return <Calculator key={i} />;
            if (b.t === "trust")
              return (
                <Fragment key={i}>
                  <Trust lang={lang} buy={buyPage} />
                  {vykup && steps}
                </Fragment>
              );
            if (b.t === "faq") return <Faq key={i} b={b} lang={lang} />;
            if (doc.path === "/novosti") return null;
            if (vykup) {
              const k = si++;
              const tiles = /class="tiles"/.test(b.html);
              if (k === 0 && tiles) return <VykupBenefits key={i} b={b} n={n++} lang={lang} />;
              if (k === 1 && tiles && /<h3/.test(b.html)) return <VykupConditions key={i} b={b} n={n++} />;
              if (k === 3) return <Section key={i} b={b} n={n++} center />;
              if (k === 4) return <Section key={i} b={{ ...b, html: savingsHtml(b.html) }} n={n++} extra="vk-save" />;
              // «У нас доступны разные тарифы»: блок убран, тарифы уже есть в начале страницы
              if (/pill-row/.test(b.html)) return null;
            }
            if (isGift(b)) return <GiftCta key={i} b={b} lang={lang} />;
            // страницы классов, выкупа и ИП: блоки с тем же текстом, но крупнее и нагляднее
            if (classPage) {
              const t = b.title;
              if (/(^|\s)(Ваша выгода при выкупе|Your (savings|benefits))/i.test(t) && /class="tiles"/.test(b.html)) return <VykupBenefits key={i} b={b} n={n++} lang={lang} />;
              if (/^(Условия выкупа|Buy-?out (terms|conditions))/i.test(t) && /<h3/.test(b.html)) return <VykupConditions key={i} b={b} n={n++} />;
              if (/<table/.test(b.html)) {
                const place = !reqDone && !buyPage && !ipPage;
                if (place) reqDone = true;
                return (
                  <Fragment key={i}>
                    <PriceTable b={b} n={n++} lang={lang} />
                    {place && <Requirements req={homeText(lang).requirements} />}
                  </Fragment>
                );
              }
              if (/class="tiles"/.test(b.html) && /<a href="[^"]+">/.test(b.html) && /(Парк авто|Автопарк|fleet)/i.test(t)) return <FleetNotes key={i} b={b} n={n++} lang={lang} />;
              if (/pill-row/.test(b.html)) {
                const tariffs = tariffsOf(b.html);
                return tariffs.length && !truckPage ? <TariffCards key={i} terms={{ title: b.title, tariffs, btn: b.btns?.[0] }} lang={lang} /> : null;
              }
              if (/^(Отзывы|Reviews|Пікірлер|Пикирлер|Fikrlar)$/i.test(t)) return <Reviews key={i} lang={lang} t={homeText(lang).reviews} />;
              if (/(Почему с нами выгодно|Почему аренда с выкупом|Преимущества аренды (авто )?с выкупом|Преимущества грузового|Начни зарабатывать|Why (it pays|rent)|Benefits of|Advantages of)/i.test(t) && !/<table|class="qgrid"/.test(b.html))
                return <BenefitsView key={i} b={b} n={n++} lang={lang} cta={!/Почему с нами выгодно\?/.test(t)} />;
            }
            return <Section key={i} b={b} n={n++} />;
          })}
        {classVideo && !vykup && steps}
        {classVideo && !buyPage && !reqDone && <Requirements req={homeText(lang).requirements} />}
        {(p.final || isModel) && <FinalCta lang={lang} />}
      </main>
      <Footer lang={lang} />
      <StickyCta lang={lang} />
    </>
  );
}
