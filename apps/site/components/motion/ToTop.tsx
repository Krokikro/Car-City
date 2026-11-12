"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { splitLang } from "@/lib/i18n";

const LABEL: Record<string, string> = { ru: "Наверх", en: "Back to top", ky: "Өйдө", kk: "Жоғары", uz: "Tepaga" };

// Кнопка «наверх» на всех страницах: появляется после первого экрана.
export function ToTop() {
  const [show, setShow] = useState(false);
  const { lang } = splitLang(usePathname() || "/");
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setShow(scrollY > Math.max(600, innerHeight * 0.8)));
    };
    on();
    addEventListener("scroll", on, { passive: true });
    return () => { removeEventListener("scroll", on); cancelAnimationFrame(raf); };
  }, []);
  return (
    <button
      type="button"
      className={`to-top${show ? " is-on" : ""}`}
      aria-label={LABEL[lang] ?? LABEL.ru}
      title={LABEL[lang] ?? LABEL.ru}
      tabIndex={show ? 0 : -1}
      onClick={() => scrollTo({ top: 0, behavior: "smooth" })}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  );
}
