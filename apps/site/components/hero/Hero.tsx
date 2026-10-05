"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { HighwayScene } from "./highway-scene";
import { company } from "@/lib/content";
import { heroBullets } from "@/lib/home";

gsap.registerPlugin(ScrollTrigger);

// Герой: живая 3D-сцена ночной трассы под заголовком. На уровне basic — постер без WebGL.
export function Hero() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = root.current!;
    const level = document.documentElement.dataset.gfx;
    let scene: HighwayScene | null = null;
    let disposed = false;
    const ctx = gsap.context(() => {
      gsap.from("[data-hero-line]", { yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.08, delay: 0.1 });
      gsap.from("[data-hero-fade]", { opacity: 0, y: 24, duration: 1, ease: "power3.out", stagger: 0.08, delay: 0.5 });
      gsap.to("[data-hero-copy]", {
        yPercent: -18,
        opacity: 0.0,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true },
      });
    }, el);

    if (level === "full" || level === "light") {
      import("./highway-scene").then(({ createHighwayScene }) => {
        if (disposed || !canvas.current) return;
        try {
          scene = createHighwayScene(canvas.current, level, () => setReady(true));
        } catch {
          return; // нет WebGL — остаётся постер
        }
        ScrollTrigger.create({ trigger: el, start: "top top", end: "bottom top", onUpdate: (st) => scene?.setScroll(st.progress) });
        const io = new IntersectionObserver(([e]) => scene?.setActive(e.isIntersecting), { threshold: 0 });
        io.observe(el);
        const onMove = (e: PointerEvent) => scene?.setPointer((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
        const down = () => scene?.boost(true);
        const up = () => scene?.boost(false);
        window.addEventListener("pointermove", onMove, { passive: true });
        el.addEventListener("pointerdown", down);
        window.addEventListener("pointerup", up);
        cleanup = () => {
          io.disconnect();
          window.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerdown", down);
          window.removeEventListener("pointerup", up);
        };
      });
    }
    let cleanup = () => {};
    return () => {
      disposed = true;
      cleanup();
      ctx.revert();
      scene?.dispose();
    };
  }, []);

  return (
    <section ref={root} className="hero3d" aria-labelledby="hero-title" data-ready={ready || undefined}>
      <div className="hero3d-poster" aria-hidden="true" />
      <canvas ref={canvas} className="hero3d-canvas" aria-hidden="true" />
      <div className="hero3d-shade" aria-hidden="true" />
      <div className="hero3d-copy wrap" data-hero-copy>
        <p className="mono hero3d-eyebrow" data-hero-fade>
          <span className="dot" /> Таксопарк в Москве · {company.fleet} авто
        </p>
        <h1 id="hero-title" className="hero3d-title">
          <span className="line"><span data-hero-line>Аренда авто</span></span>
          <span className="line"><span data-hero-line>для работы в&nbsp;такси</span></span>
          <span className="line"><span data-hero-line className="accent">с&nbsp;выкупом в&nbsp;Москве</span></span>
        </h1>
        <p className="hero3d-sub" data-hero-fade>
          Начни зарабатывать уже сегодня от&nbsp;<span className="mono-num">170&nbsp;000</span>&nbsp;рублей
        </p>
        <ul className="hero-bullets" data-hero-fade>
          {heroBullets.map((b) => <li key={b}>{b}</li>)}
        </ul>
        <div className="row" data-hero-fade>
          <a href="#zayavka" className="btn btn-primary btn-lg" data-magnetic>Забронировать авто</a>
          <a href="#avtopark" className="btn btn-glass btn-lg" data-magnetic>Подобрать автомобиль</a>
        </div>
        <div className="hero-badges" data-hero-fade aria-label="Условия">
          <span className="hero-badge"><b>Без депозита</b></span>
          <span className="hero-badge"><b>1-ый день</b> 0₽</span>
        </div>
      </div>
      <div className="hero3d-bottom wrap" data-hero-fade>
        <dl className="hero-stats">
          <div><dt className="mono">Авто в парке</dt><dd>{company.fleet}</dd></div>
          <div><dt className="mono">Водителей</dt><dd>{company.renters}</dd></div>
          <div><dt className="mono">Выкупили авто</dt><dd>{company.boughtOut}</dd></div>
          <div><dt className="mono">Комиссия</dt><dd>4%</dd></div>
        </dl>
        <p className="mono hero-hint" aria-hidden="true">Зажмите, чтобы разогнаться</p>
      </div>
    </section>
  );
}
