import { company } from "@/lib/content";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div>
          <a href="/" className="brand" aria-label="Car City, на главную">
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-word">Car City</span>
          </a>
          <p className="muted small">{company.group}. {company.legalName}</p>
        </div>
        <div className="footer-contacts">
          {company.phones.map((p) => (
            <a key={p} href={`tel:${p.replace(/[^\d+]/g, "")}`} className="mono-num">{p}</a>
          ))}
          <a href={`mailto:${company.email}`}>{company.email}</a>
        </div>
        <nav aria-label="Документы" className="footer-links">
          <a href={company.privacyUrl}>Политика конфиденциальности</a>
          <a href="/sitemap.xml">Карта сайта</a>
        </nav>
      </div>
      <div className="checker-strip" aria-hidden="true" />
    </footer>
  );
}
