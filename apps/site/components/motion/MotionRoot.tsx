"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

// Единый слой движения для всех страниц. Разметка объявляет эффекты атрибутами:
//   data-reveal            — появление снизу при входе в экран
//   data-reveal-stagger    — дети появляются по очереди
//   data-split             — заголовок раскрывается по словам
//   data-parallax="0.2"    — параллакс со скоростью
//   data-count="1400"      — счётчик от нуля
//   data-magnetic          — кнопка тянется к курсору
// На уровне basic и при prefers-reduced-motion ничего не анимируется.
export function MotionRoot() {
  const path = usePathname();

  useEffect(() => {
    const gfx = document.documentElement.dataset.gfx;
    if (gfx === "basic") return;

    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    // якорные ссылки — плавно через Lenis
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute("href")!;
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -80, duration: 1.4 });
      history.replaceState(null, "", id);
    };
    document.addEventListener("click", onClick);

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
        if (el.dataset.splitDone) return;
        el.dataset.splitDone = "1";
        const words = el.textContent!.trim().split(/\s+/);
        el.setAttribute("aria-label", el.textContent!.trim());
        el.innerHTML = words.map((w) => `<span class="sw" aria-hidden="true"><span>${w}</span></span>`).join(" ");
        gsap.from(el.querySelectorAll(".sw > span"), {
          yPercent: 110,
          rotate: 4,
          duration: 1,
          ease: "expo.out",
          stagger: 0.05,
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
      });
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, { y: 48, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
      });
      gsap.utils.toArray<HTMLElement>("[data-reveal-stagger]").forEach((el) => {
        gsap.from(el.children, { y: 40, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: el, start: "top 85%" } });
      });
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        const k = Number(el.dataset.parallax) || 0.2;
        gsap.to(el, { yPercent: -100 * k, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
      });
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const to = Number(el.dataset.count);
        const suffix = el.dataset.suffix ?? "";
        const obj = { v: 0 };
        gsap.to(obj, {
          v: to,
          duration: 2,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 90%" },
          onUpdate: () => (el.textContent = Math.round(obj.v).toLocaleString("ru-RU") + suffix),
        });
      });
    });

    // магнитные кнопки
    const fine = matchMedia("(pointer: fine)").matches;
    const mags = fine ? Array.from(document.querySelectorAll<HTMLElement>("[data-magnetic]")) : [];
    const offs = mags.map((m) => {
      const xTo = gsap.quickTo(m, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const yTo = gsap.quickTo(m, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const move = (e: PointerEvent) => {
        const r = m.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.3);
        yTo((e.clientY - r.top - r.height / 2) * 0.4);
      };
      const leave = () => (xTo(0), yTo(0));
      m.addEventListener("pointermove", move);
      m.addEventListener("pointerleave", leave);
      return () => (m.removeEventListener("pointermove", move), m.removeEventListener("pointerleave", leave));
    });

    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      offs.forEach((f) => f());
      ctx.revert();
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [path]);

  return null;
}
