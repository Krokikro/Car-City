import { Header } from "@/components/Header";
import { HtmlLang } from "@/components/HtmlLang";
import { Hero } from "@/components/hero/Hero";
import { Fleet } from "@/components/home/Fleet";
import { Benefits } from "@/components/home/Benefits";
import { Trust } from "@/components/home/Trust";
import { Promo } from "@/components/home/Promo";
import { Steps } from "@/components/home/Steps";
import { Calculator } from "@/components/home/Calculator";
import { Media } from "@/components/home/Media";
import { WhyUs } from "@/components/home/WhyUs";
import { SeoText } from "@/components/home/SeoText";
import { Reviews } from "@/components/home/Reviews";
import { FaqHome } from "@/components/home/FaqHome";
import { FinalCta } from "@/components/home/FinalCta";
import { Footer } from "@/components/Footer";
import { StickyCta } from "@/components/StickyCta";
import { company, offices } from "@/lib/content";
import type { Lang } from "@/lib/i18n";
import { ui } from "@/lib/ui";


const orgLd = {
  "@context": "https://schema.org",
  "@type": "AutoRental",
  name: company.name,
  legalName: company.legalName,
  url: company.domain,
  email: company.email,
  telephone: company.phones,
  aggregateRating: { "@type": "AggregateRating", ratingValue: "5.0", bestRating: "5", ratingCount: "4" },
  address: offices.map((o) => ({ "@type": "PostalAddress", addressLocality: "Москва", streetAddress: o.address, addressCountry: "RU" })),
};

export function HomePage({ lang = "ru" }: { lang?: Lang }) {
  return (
    <>
      <HtmlLang lang={lang} />
      <a className="skip" href="#main">{ui(lang).skip}</a>
      <Header />
      <main id="main">
        <Hero />
        <Fleet lang={lang} />
        <Benefits />
        <Trust lang={lang} />
        <Promo />
        <Steps />
        <Calculator />
        <Media />
        <WhyUs />
        <SeoText />
        <Reviews lang={lang} />
        <FaqHome />
        <FinalCta lang={lang} />
      </main>
      <Footer lang={lang} />
      <StickyCta lang={lang} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
    </>
  );
}
