import { publishedLocales } from "@car-city/i18n";

const nav = [
  { href: "#arenda", label: "Аренда" },
  { href: "#vykup", label: "Выкуп" },
  { href: "#usloviya", label: "Условия" },
  { href: "#ofisy", label: "Офисы" },
];

export function Header() {
  return (
    <header className="site-header">
      <a href="/" className="brand" aria-label="Car City, на главную">
        <span className="brand-mark" aria-hidden="true" />
        <span className="brand-word">Car City</span>
      </a>
      <nav aria-label="Основное меню" className="nav">
        {nav.map((item) => (
          <a key={item.href} href={item.href} className="pill">
            {item.label}
          </a>
        ))}
      </nav>
      <div className="header-actions">
        {publishedLocales.length > 1 && (
          <label className="lang">
            <span className="visually-hidden">Язык</span>
            <select defaultValue="ru">
              {publishedLocales.map((l) => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
          </label>
        )}
        <a href="#zayavka" className="btn btn-ghost btn-sm header-cta">Оставить заявку</a>
      </div>
    </header>
  );
}
