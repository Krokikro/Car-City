"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { splitLang, type Lang } from "@/lib/i18n";
import { LeadForm } from "./LeadForm";
import { patched } from "@/lib/texts";
import { LEAD_MODAL } from "@/lib/text-defaults";

// Всплывающая форма заявки. Любая кнопка со ссылкой #zayavka (или с data-lead="rent|buyout")
// открывает её поверх страницы, ничего не прокручивая. Тип заявки — по странице и по тексту кнопки.
type Kind = "rent" | "buyout";

const BUY_RE = /выкуп|buyout|sotib|сатып|buy\b/i;

export function LeadModal() {
  const pathname = usePathname() || "/";
  const { lang, path } = splitLang(pathname);
  const [open, setOpen] = useState<null | { kind: Kind; from: string }>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const t = patched("modal", lang, LEAD_MODAL[lang] ?? LEAD_MODAL.ru);

  const close = useCallback(() => {
    setOpen(null);
    lastFocus.current?.focus?.();
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const el = (e.target as HTMLElement).closest<HTMLElement>('a[href="#zayavka"], a[href$="/#zayavka"], [data-lead]');
      if (!el) return;
      // кнопка внутри самого открытого окна ничего не открывает
      if (el.closest(".lead-modal")) return;
      e.preventDefault();
      const forced = el.dataset.lead as Kind | undefined;
      const label = (el.textContent || "") + " " + (el.getAttribute("aria-label") || "");
      const kind: Kind = forced === "buyout" || forced === "rent" ? forced : /^\/vykup/.test(path) || BUY_RE.test(label) ? "buyout" : "rent";
      lastFocus.current = el;
      setOpen({ kind, from: label.trim().slice(0, 60) });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [path]);

  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab" && boxRef.current) {
        const f = boxRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([type=hidden]):not([tabindex="-1"]),select,textarea');
        if (!f.length) return;
        const a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    const timer = setTimeout(() => boxRef.current?.querySelector<HTMLInputElement>('input[name="name"]')?.focus(), 60);
    return () => {
      document.documentElement.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      clearTimeout(timer);
    };
  }, [open, close]);

  // при переходе на другую страницу окно закрываем
  useEffect(() => setOpen(null), [pathname]);

  if (!open) return null;
  const c = t[open.kind];
  return (
    <div className="lead-modal" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="lead-modal-box" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title" ref={boxRef}>
        <button type="button" className="lead-modal-x" aria-label={t.close} onClick={close}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        <h2 id="lead-modal-title" className="h2">{c.title}</h2>
        <p className="muted lead-modal-text">{c.text}</p>
        <LeadForm source={`popup-${open.kind}`} lang={lang} button={t.button} extra={{ type: open.kind, button: open.from }} />
      </div>
    </div>
  );
}
