import { company, offices } from "@/lib/content";
import { href, type Lang } from "@/lib/i18n";
import { ui } from "@/lib/ui";
import { Logo } from "./Logo";

export function Footer({ lang = "ru" }: { lang?: Lang }) {
  const t = ui(lang);
  const f = t.footer;
  const cols = [
    { title: f.rent, links: [[t.cls.ekonom, "/ekonom"], [t.cls.komfort, "/komfort"], [t.cls.komfortplus, "/komfortplus"], [t.cls.gruzovoy, "/gruzovoy"], [f.rentIp, "/arenda-taksi-ip"]] },
    { title: f.buy, links: [[f.rto, "/vykup"], [f.buyEkonom, "/vykup/ekonom"], [f.buyKomfort, "/vykup/komfort"], [f.buyKomfortPlus, "/vykup/komfort-plyus"]] },
    { title: f.company, links: [[t.nav.usloviya, "/usloviya"], [t.nav.onas, "/o-nas"], [t.nav.reviews, "/reviews"], [t.nav.news, "/novosti"], [t.nav.contact, "/contact"]] },
  ];
  return (
    <footer className="site-footer">
      <div className="wrap footer-top">
        <div className="footer-brand">
          <Logo size={56} />
          <p className="muted">{f.group}. {company.legalName}</p>
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
            {c.links.map(([l, h]) => <a key={h} href={href(h, lang)}>{l}</a>)}
          </nav>
        ))}
        <div className="footer-col footer-offices">
          <p className="mono">{f.offices}</p>
          {offices.map((o) => (
            <p key={o.name}><span>{f.metro} {o.metro}</span><br /><span className="muted small">{o.address}, {o.hours}</span></p>
          ))}
        </div>
      </div>
      <div className="footer-giant" aria-hidden="true">
        <span>CAR CITY</span>
      </div>
      <div className="wrap footer-bottom">
        <span className="muted small">© {new Date().getFullYear()} {company.legalName}</span>
        <a href={company.privacyUrl} className="muted small">{f.privacy}</a>
        <a href={href("/sitemap", lang)} className="muted small">{f.sitemap}</a>
      </div>
      <div className="checker-strip" aria-hidden="true" />
    </footer>
  );
}
