import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Perks } from "@/components/Perks";
import { ModelsByClass } from "@/components/ModelsByClass";
import { Buyout } from "@/components/Buyout";
import { IncomeCalculator } from "@/components/IncomeCalculator";
import { Terms } from "@/components/Terms";
import { Offices } from "@/components/Offices";
import { Faq } from "@/components/Faq";
import { LeadForm } from "@/components/LeadForm";
import { Footer } from "@/components/Footer";
import { StickyCta } from "@/components/StickyCta";
import { company, offices } from "@/lib/content";

const orgLd = {
  "@context": "https://schema.org",
  "@type": "AutoRental",
  name: company.name,
  legalName: company.legalName,
  url: company.domain,
  email: company.email,
  telephone: company.phones,
  address: offices.map((o) => ({ "@type": "PostalAddress", addressLocality: "Москва", streetAddress: o.address, addressCountry: "RU" })),
};

export default function Home() {
  return (
    <>
      <a className="skip" href="#main">К содержанию</a>
      <Header />
      <main id="main">
        <Hero />
        <Perks />
        <ModelsByClass />
        <Buyout />
        <IncomeCalculator />
        <Terms />
        <Offices />
        <Faq />
        <LeadForm />
      </main>
      <Footer />
      <StickyCta />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
    </>
  );
}
