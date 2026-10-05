"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { company } from "@/lib/content";
import { LANGS, LANG_NAMES, LANG_SHORT, href, splitLang } from "@/lib/i18n";
import { ui } from "@/lib/ui";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { lang, path } = splitLang(usePathname() || "/");
  const t = ui(lang);
  const nav = [
    { href: "/#avtopark", label: t.nav.fleet },
    { href: "/vykup", label: t.nav.vykup },
    { href: "/usloviya", label: t.nav.usloviya },
    { href: "/o-nas", label: t.nav.onas },
    { href: "/reviews", label: t.nav.reviews },
    { href: "/contact", label: t.nav.contact },
  ];
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
      <a href={href("/", lang)} className="brand" aria-label={t.toHome}>
        <Logo size={40} />
      </a>
      <nav aria-label={t.mainMenu} className="nav">
        {nav.map((item) => (
          <a key={item.href} href={href(item.href, lang)} className="nav-link">
            {item.label}
          </a>
        ))}
      </nav>
      <div className="header-actions">
        <details className="lang">
          <summary aria-label={t.language}>{LANG_SHORT[lang]}</summary>
          <ul>
            {LANGS.map((l) => (
              <li key={l}>
                <a href={href(path, l)} hrefLang={l} lang={l} aria-current={l === lang ? "true" : undefined}>
                  <b>{LANG_SHORT[l]}</b> {LANG_NAMES[l]}
                </a>
              </li>
            ))}
          </ul>
        </details>
        <a href={`tel:${tel.replace(/[^\d+]/g, "")}`} className="header-tel mono-num">{tel}</a>
        <a href="#zayavka" className="btn btn-glass btn-sm header-cta">{t.lead}</a>
        <button className="burger" aria-label={t.menu} aria-expanded={open} onClick={() => setOpen(!open)}>
          <span /><span />
        </button>
      </div>
      <div className="mobile-menu" hidden={!open}>
        <nav aria-label={t.menu}>
          {nav.map((item, i) => (
            <a key={item.href} href={href(item.href, lang)} onClick={() => setOpen(false)} style={{ ["--i" as string]: i }}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="mobile-langs">
          {LANGS.map((l) => (
            <a key={l} href={href(path, l)} hrefLang={l} aria-current={l === lang ? "true" : undefined}>{LANG_SHORT[l]}</a>
          ))}
        </div>
        <div className="mobile-menu-foot">
          {company.phones.map((p) => (
            <a key={p} href={`tel:${p.replace(/[^\d+]/g, "")}`} className="mono-num">{p}</a>
          ))}
        </div>
      </div>
    </header>
  );
}
