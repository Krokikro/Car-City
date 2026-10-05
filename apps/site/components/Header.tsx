"use client";

import { useEffect, useState } from "react";
import { publishedLocales } from "@car-city/i18n";
import { Logo } from "./Logo";
import { company } from "@/lib/content";

const nav = [
  { href: "/#avtopark", label: "Автопарк" },
  { href: "/vykup", label: "Выкуп" },
  { href: "/usloviya", label: "Условия" },
  { href: "/o-nas", label: "О нас" },
  { href: "/reviews", label: "Отзывы" },
  { href: "/contact", label: "Контакты" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(scrollY > 24);
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("menu-open", open);
  }, [open]);

  const tel = company.phones[0];
  return (
    <header className="site-header" data-scrolled={scrolled || undefined}>
      <a href="/" className="brand" aria-label="Car City, на главную">
        <Logo size={40} />
      </a>
      <nav aria-label="Основное меню" className="nav">
        {nav.map((item) => (
          <a key={item.href} href={item.href} className="nav-link">
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
        <a href={`tel:${tel.replace(/[^\d+]/g, "")}`} className="header-tel mono-num">{tel}</a>
        <a href="#zayavka" className="btn btn-glass btn-sm header-cta">Оставить заявку</a>
        <button className="burger" aria-label="Меню" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span /><span />
        </button>
      </div>
      <div className="mobile-menu" hidden={!open}>
        <nav aria-label="Меню">
          {nav.map((item, i) => (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)} style={{ ["--i" as string]: i }}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="mobile-menu-foot">
          {company.phones.map((p) => (
            <a key={p} href={`tel:${p.replace(/[^\d+]/g, "")}`} className="mono-num">{p}</a>
          ))}
        </div>
      </div>
    </header>
  );
}
