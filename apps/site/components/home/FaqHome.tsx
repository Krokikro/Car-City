import type { HomeText } from "@/lib/home-text";
import { marked } from "marked";

export function FaqHome({ t }: { t: HomeText["faq"] }) {
  const faqHome = t.items;
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqHome.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a.join("\n").replace(/\*\*/g, "") } })),
  };
  return (
    <section className="section faq-sec" id="faq" aria-labelledby="faq-title">
      <div className="wrap split">
        <div className="sticky">
          <p className="mono eyebrow">FAQ</p>
          <h2 id="faq-title" className="display" data-split>{t.title}</h2>
        </div>
        <div className="faq">
          {faqHome.map((f, i) => (
            <details key={f.q}>
              <summary><span>{f.q}</span><i aria-hidden="true" /></summary>
              <div className="faq-a" dangerouslySetInnerHTML={{ __html: f.a.map((p) => marked.parse(p, { async: false }) as string).join("") }} />
            </details>
          ))}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </section>
  );
}
