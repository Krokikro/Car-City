"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { splitLang } from "@/lib/i18n";

const LABEL: Record<string, string> = { ru: "Листать вправо", en: "Scroll right", ky: "Оңго сүрүңүз", kk: "Оңға жылжытыңыз", uz: "O‘ngga suring" };

// Подсказка для лент, которые листаются вбок: мигающая стрелка у правого края.
// Находит все горизонтально прокручиваемые блоки сама; пропадает, когда ленту пролистали.
export function ScrollHints() {
  const path = usePathname();
  useEffect(() => {
    const { lang } = splitLang(path || "/");
    const made: { el: HTMLElement; btn: HTMLButtonElement; ro: ResizeObserver; off: () => void }[] = [];
    const done = new WeakSet<HTMLElement>();

    const attach = (el: HTMLElement) => {
      if (done.has(el) || !el.parentElement) return;
      done.add(el);
      const host = el.parentElement;
      if (getComputedStyle(host).position === "static") host.style.position = "relative";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sh-arrow";
      btn.setAttribute("aria-label", LABEL[lang] ?? LABEL.ru);
      btn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      host.appendChild(btn);
      let dismissed = false;
      const place = () => {
        const can = el.scrollWidth - el.clientWidth > 8;
        const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
        btn.hidden = dismissed || !can || atEnd;
        btn.style.left = `${el.offsetLeft + el.offsetWidth - 56}px`;
        btn.style.top = `${el.offsetTop + Math.min(el.offsetHeight / 2, 170) - 22}px`;
      };
      const onScroll = () => { if (el.scrollLeft > 24) dismissed = true; place(); };
      const onClick = () => { dismissed = true; el.scrollBy({ left: Math.round(el.clientWidth * 0.8), behavior: "smooth" }); place(); };
      el.addEventListener("scroll", onScroll, { passive: true });
      btn.addEventListener("click", onClick);
      const ro = new ResizeObserver(place);
      ro.observe(el);
      place();
      made.push({ el, btn, ro, off: () => { el.removeEventListener("scroll", onScroll); btn.removeEventListener("click", onClick); } });
    };

    const scan = () => {
      document.querySelectorAll<HTMLElement>("main :is(div, ul, nav, ol, section)").forEach((el) => {
        if (done.has(el) || el.classList.contains("sh-skip") || el.closest("[data-no-hint]")) return;
        const ox = getComputedStyle(el).overflowX;
        if ((ox === "auto" || ox === "scroll") && el.scrollWidth - el.clientWidth > 8 && el.clientWidth > 200) attach(el);
      });
    };
    const t1 = setTimeout(scan, 600);
    const t2 = setTimeout(scan, 2500);
    const onResize = () => scan();
    addEventListener("resize", onResize);
    return () => {
      clearTimeout(t1); clearTimeout(t2);
      removeEventListener("resize", onResize);
      made.forEach((m) => { m.ro.disconnect(); m.off(); m.btn.remove(); });
    };
  }, [path]);
  return null;
}
