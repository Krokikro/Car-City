"use client";

import { useEffect, useRef } from "react";

// Быстрый переход по классам на страницах с каталогом: все классы видны сразу (переносятся в строки),
// текущий класс при прокрутке подсвечивается (по положению групп, без IntersectionObserver), нажатый — плавно прокручивается к своей группе.
export function ClassChips({ label, items }: { label: string; items: { id: string; name: string; n: number }[] }) {
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const links = [...(nav.current?.querySelectorAll<HTMLAnchorElement>("a.pill") ?? [])];
    const groups = items.map((x) => document.getElementById(x.id)).filter((g): g is HTMLElement => !!g);
    if (!groups.length) return;
    let raf = 0;
    // активный класс — последняя группа, верх которой уже выше 40% экрана; выше первой группы — ничего не подсвечено
    const update = () => {
      raf = 0;
      const line = window.innerHeight * 0.4;
      const last = groups[groups.length - 1];
      const past = last.getBoundingClientRect().bottom < 0;
      let cur: string | null = null;
      if (!past) for (const g of groups) if (g.getBoundingClientRect().top < line) cur = g.id;
      links.forEach((a) => (cur && a.getAttribute("href") === `#${cur}` ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [items]);
  return (
    <nav ref={nav} className="pg-chips pg-chips-wrap" aria-label={label}>
      {items.map((x) => (
        <a key={x.id} className="pill" href={`#${x.id}`}>{x.name}<span className="pill-count">{x.n}</span></a>
      ))}
    </nav>
  );
}
