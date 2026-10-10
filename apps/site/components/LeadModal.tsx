"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { splitLang, type Lang } from "@/lib/i18n";
import { LeadForm } from "./LeadForm";

// Всплывающая форма заявки. Любая кнопка со ссылкой #zayavka (или с data-lead="rent|buyout")
// открывает её поверх страницы, ничего не прокручивая. Тип заявки — по странице и по тексту кнопки.
type Kind = "rent" | "buyout";
const T: Record<Lang, Record<Kind, { title: string; text: string }> & { close: string; button: string }> = {
  ru: {
    rent: { title: "Заявка на аренду", text: "Оставьте телефон: менеджер перезвонит за минуту, подберёт машину и расскажет условия." },
    buyout: { title: "Заявка на выкуп", text: "Оставьте телефон: менеджер расскажет про выкуп, взнос и подберёт автомобиль." },
    close: "Закрыть",
    button: "Перезвоните мне",
  },
  en: {
    rent: { title: "Rental request", text: "Leave your phone: a manager will call back within a minute, pick a car and explain the terms." },
    buyout: { title: "Buyout request", text: "Leave your phone: a manager will explain the buyout, the first payment and help choose a car." },
    close: "Close",
    button: "Call me back",
  },
  ky: {
    rent: { title: "Ижарага өтүнмө", text: "Телефонуңузду калтырыңыз: менеджер бир мүнөттө чалып, унаа тандап, шарттарды түшүндүрөт." },
    buyout: { title: "Сатып алууга өтүнмө", text: "Телефонуңузду калтырыңыз: менеджер сатып алуу, баштапкы төлөм жөнүндө айтып, унаа тандайт." },
    close: "Жабуу",
    button: "Мага чалыңыз",
  },
  kk: {
    rent: { title: "Жалға алу өтінімі", text: "Телефоныңызды қалдырыңыз: менеджер бір минутта қоңырау шалып, көлік таңдап, шарттарды түсіндіреді." },
    buyout: { title: "Сатып алу өтінімі", text: "Телефоныңызды қалдырыңыз: менеджер сатып алу, алғашқы жарна туралы айтып, көлік таңдайды." },
    close: "Жабу",
    button: "Маған қоңырау шалыңыз",
  },
  uz: {
    rent: { title: "Ijara uchun ariza", text: "Telefon raqamingizni qoldiring: menejer bir daqiqada qo‘ng‘iroq qilib, mashina tanlaydi va shartlarni tushuntiradi." },
    buyout: { title: "Sotib olish uchun ariza", text: "Telefon raqamingizni qoldiring: menejer sotib olish, boshlang‘ich to‘lov haqida aytib, mashina tanlaydi." },
    close: "Yopish",
    button: "Menga qo‘ng‘iroq qiling",
  },
};

const BUY_RE = /выкуп|buyout|sotib|сатып|buy\b/i;

export function LeadModal() {
  const pathname = usePathname() || "/";
  const { lang, path } = splitLang(pathname);
  const [open, setOpen] = useState<null | { kind: Kind; from: string }>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const t = T[lang] ?? T.ru;

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
        <p className="mono eyebrow">{open.kind === "buyout" ? "Car City · выкуп" : "Car City · аренда"}</p>
        <h2 id="lead-modal-title" className="h2">{c.title}</h2>
        <p className="muted lead-modal-text">{c.text}</p>
        <LeadForm source={`popup-${open.kind}`} lang={lang} button={t.button} extra={{ type: open.kind, button: open.from }} />
      </div>
    </div>
  );
}
