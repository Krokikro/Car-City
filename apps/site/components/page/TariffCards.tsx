"use client";

import { useEffect, useRef } from "react";
import type { Terms } from "@/lib/terms";
import { href, type Lang } from "@/lib/i18n";
import { CarArt } from "../CarArt";

// Крупные карточки тарифов («У нас доступны разные тарифы»): на странице «Условия» и на страницах классов.
// Фары включаются по-настоящему — слой света собран по лампам именно этой машины (как в карточках парка).

const T = {
  ru: { from: "от", day: "₽/сутки", models: "моделей", more: "Смотреть машины" },
  en: { from: "from", day: "₽/day", models: "models", more: "See the cars" },
};

export function TariffCards({ terms, lang = "ru", className = "" }: { terms: Pick<Terms, "title" | "tariffs" | "btn">; lang?: Lang; className?: string }) {
  const t = T[lang as keyof typeof T] ?? T.ru;
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current!;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });
    el.querySelectorAll(".tf-card, .tf-cta").forEach((c) => io.observe(c));
    // поворот за курсором и блик — только мышью и только на полной графике
    const fine = matchMedia("(pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine) return () => io.disconnect();
    const offs = Array.from(el.querySelectorAll<HTMLElement>("[data-fx]")).map((c) => {
      let raf = 0;
      const move = (e: PointerEvent) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const r = c.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width;
          const y = (e.clientY - r.top) / r.height;
          c.style.setProperty("--mx", `${x * 100}%`);
          c.style.setProperty("--my", `${y * 100}%`);
          if (document.documentElement.dataset.gfx !== "basic") {
            c.style.setProperty("--rx", `${(0.5 - y) * 7}deg`);
            c.style.setProperty("--ry", `${(x - 0.5) * 9}deg`);
          }
        });
      };
      const leave = () => { cancelAnimationFrame(raf); c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); };
      c.addEventListener("pointermove", move);
      c.addEventListener("pointerleave", leave);
      return () => { c.removeEventListener("pointermove", move); c.removeEventListener("pointerleave", leave); };
    });
    return () => { io.disconnect(); offs.forEach((f) => f()); };
  }, []);

  if (!terms.tariffs.length) return null;
  return (
    <section className={`section tf ${className}`} aria-labelledby="tf-h" ref={root}>
      <div className="tf-band" aria-hidden="true"><div data-skew /></div>
      <div className="wrap">
        <h2 className="display tf-title" id="tf-h" data-split>{terms.title}</h2>
        <div className="tf-grid">
          {terms.tariffs.map((c, i) => (
            <a key={c.href} href={href(c.href, lang)} className={`tf-card tf-${c.cls}`} data-fx style={{ ["--i" as string]: i }}>
              <div className="tm-glow" aria-hidden="true" />
              <div className="tf-speed" aria-hidden="true"><i /><i /><i /><i /><i /></div>
              <div className="tf-head">
                <span className="tf-k mono">0{i + 1}</span>
                <span className="tf-count mono">{c.count} {t.models}</span>
              </div>
              <b className="tf-name">{c.label}</b>
              {c.car && (
                <div className="tf-car">
                  <CarArt slug={c.car.slug} name={c.car.name} lit sizes="(max-width: 860px) 90vw, 420px" />
                </div>
              )}
              <div className="tf-foot">
                {c.from > 0 && (
                  <p className="tf-price"><span>{t.from}</span> <b>{c.from.toLocaleString("ru-RU")}</b> <span>{t.day}</span></p>
                )}
                <span className="tf-go"><span className="tf-go-l">{t.more}</span><span className="tf-arrow" aria-hidden="true">→</span></span>
              </div>
            </a>
          ))}
        </div>
        {terms.btn && (
          <div className="tf-cta">
            <a className="btn btn-primary tf-btn" href={href(terms.btn.href, lang)} data-magnetic>
              <span>{terms.btn.label}</span> <span className="arrow">→</span>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
