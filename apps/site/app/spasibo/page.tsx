import type { Metadata } from "next";
import { company } from "@/lib/content";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// Страница «Спасибо» (PRD 8.1): сюда приходит форма без JS после отправки.
// Форма с JS показывает то же самое на месте, без перехода.
export const metadata: Metadata = { title: "Заявка принята", robots: { index: false, follow: false }, alternates: { canonical: "/spasibo" } };

export default function Thanks() {
  return (
    <>
      <Header />
      <main id="main" className="pg">
        <section className="art-hero">
          <div className="art-hero-bg" aria-hidden="true" />
          <div className="wrap">
            <p className="mono eyebrow">Car City</p>
            <h1 className="display-xl">Заявка принята</h1>
          </div>
        </section>
        <section className="section pg-sec">
          <div className="wrap">
            <div className="lead-done" role="status">
              <span className="lead-done-ico" aria-hidden="true">✓</span>
              <p className="h3">Менеджер свяжется с вами в течение 1 минуты в рабочее время офиса.</p>
              <p className="small muted">Или напишите нам сами:</p>
              <div className="lead-done-msgr">
                <a className="pill" href={company.telegram} target="_blank" rel="noopener">Telegram</a>
                <a className="pill" href={company.whatsapp} target="_blank" rel="noopener">WhatsApp</a>
                <a className="pill" href={company.max} target="_blank" rel="noopener">MAX</a>
              </div>
              <a className="btn btn-ghost" href="/">На главную</a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
