import { Header } from "@/components/Header";
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

export const metadata = {
  title: { absolute: "Аренда авто для работы в такси в Москве без залога" },
  description: "Дарим первый день аренды бесплатно, новые автомобили без залога, гибкий формат аренды, возможность выкупа.",
  alternates: { canonical: "/" },
};

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

export default function Home() {
  return (
    <>
      <a className="skip" href="#main">К содержанию</a>
      <Header />
      <main id="main">
        <Hero />
        <Fleet />
        <Benefits />
        <Trust />
        <Promo />
        <Steps />
        <Calculator />
        <Media />
        <WhyUs />
        <SeoText />
        <Reviews />
        <FaqHome />
        <FinalCta />
      </main>
      <Footer />
      <StickyCta />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
    </>
  );
}
