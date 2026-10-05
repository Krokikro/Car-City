import { company, offices } from "@/lib/content";
import { Logo } from "./Logo";

const cols = [
  { title: "Аренда", links: [["Эконом", "/ekonom/"], ["Комфорт", "/komfort/"], ["Комфорт плюс", "/komfortplus/"], ["Грузовой", "/gruzovoy/"], ["Аренда такси для ИП", "/arenda-taksi-ip/"]] },
  { title: "Выкуп", links: [["Аренда с правом выкупа", "/vykup/"], ["Выкуп эконом", "/vykup/ekonom/"], ["Выкуп комфорт", "/vykup/komfort/"], ["Выкуп комфорт+", "/vykup/komfort-plyus/"]] },
  { title: "Компания", links: [["Условия", "/usloviya/"], ["О нас", "/o-nas/"], ["Отзывы", "/reviews/"], ["Новости", "/novosti/"], ["Контакты", "/contact/"]] },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-top">
        <div className="footer-brand">
          <Logo size={56} />
          <p className="muted">{company.group}. {company.legalName}</p>
          <div className="footer-phones">
            {company.phones.map((p) => (
              <a key={p} href={`tel:${p.replace(/[^\d+]/g, "")}`} className="mono-num">{p}</a>
            ))}
            <a href={`mailto:${company.email}`}>{company.email}</a>
          </div>
          <div className="footer-msg">
            <a href={company.telegram} target="_blank" rel="noopener">Telegram</a>
            <a href={company.whatsapp} target="_blank" rel="noopener">WhatsApp</a>
            <a href={company.max} target="_blank" rel="noopener">MAX</a>
            <a href={company.youtube} target="_blank" rel="noopener">YouTube</a>
          </div>
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title} className="footer-col">
            <p className="mono">{c.title}</p>
            {c.links.map(([l, h]) => <a key={h} href={h}>{l}</a>)}
          </nav>
        ))}
        <div className="footer-col footer-offices">
          <p className="mono">Офисы</p>
          {offices.map((o) => (
            <p key={o.name}><span>м. {o.metro}</span><br /><span className="muted small">{o.address}, {o.hours}</span></p>
          ))}
        </div>
      </div>
      <div className="footer-giant" aria-hidden="true">
        <span>CAR CITY</span>
      </div>
      <div className="wrap footer-bottom">
        <span className="muted small">© {new Date().getFullYear()} {company.legalName}</span>
        <a href={company.privacyUrl} className="muted small">Политика конфиденциальности</a>
        <a href="/sitemap" className="muted small">Карта сайта</a>
      </div>
      <div className="checker-strip" aria-hidden="true" />
    </footer>
  );
}
