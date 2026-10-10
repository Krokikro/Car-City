"use client";

import { useEffect, useRef } from "react";
import { preload } from "react-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { asset } from "@/lib/i18n";
import type { HomeText } from "@/lib/home-text";

gsap.registerPlugin(ScrollTrigger);

// Первый экран: видео парка на весь экран. При скролле кадр сжимается в карточку со скруглением,
// заголовок уезжает вверх, сквозь кадр проезжает огромная надпись CAR CITY.
// Анимируем только transform и opacity — без перерисовки видео.
export function HeroVideo({ t }: { t: HomeText["hero"] }) {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  preload(asset("/video/hero-poster.webp"), { as: "image", fetchPriority: "high" });

  useEffect(() => {
    const el = root.current!;
    const v = video.current!;
    const basic = document.documentElement.dataset.gfx === "basic";
    // экономим трафик и батарею: видео играет, только пока первый экран виден
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.05 });
    io.observe(el);
    if (basic) return () => io.disconnect();

    // вступление (шторка, строки заголовка) идёт на CSS с первой отрисовки и не ждёт загрузки скриптов
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 720px)", () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: true } });
        tl.to(".hv-frame", { scale: 0.84, borderRadius: 40, ease: "none" }, 0)
          .to(".hv-video", { scale: 1.12, ease: "none" }, 0)
          .to(".hv-copy", { yPercent: -40, opacity: 0, ease: "none" }, 0)
          .to(".hv-stats", { y: 60, opacity: 0, ease: "none" }, 0)
          .fromTo(".hv-giant", { xPercent: 30 }, { xPercent: -55, ease: "none" }, 0)
          .to(".hv-giant", { opacity: 1, duration: 0.2 }, 0.1);
      });
      mm.add("(max-width: 719px)", () => {
        // на телефоне кадр 16:9 целиком, без обрезки; при скролле лёгкий параллакс
        gsap.to(".hv-video", { yPercent: 8, scale: 1.04, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true } });
      });
    }, el);
    return () => {
      io.disconnect();
      ctx.revert();
    };
  }, []);

  return (
    <section ref={root} className="hv" aria-labelledby="hero-title">
      <div className="hv-pin">
        <div className="hv-frame" style={{ ["--poster" as string]: `url(${asset("/video/hero-poster.webp")})` }}>
          <div className="hv-fill" aria-hidden="true" />
          <video ref={video} className="hv-video" muted loop playsInline autoPlay preload="metadata" poster={asset("/video/hero-poster.webp")} aria-hidden="true">
            <source src={asset("/video/hero-854.mp4")} type="video/mp4" media="(max-width: 720px)" />
            <source src={asset("/video/hero-1280.mp4")} type="video/mp4" media="(max-width: 1680px)" />
            <source src={asset("/video/hero-1920.mp4")} type="video/mp4" />
          </video>
          <div className="hv-shade" aria-hidden="true" />
          <div className="hv-curtain" aria-hidden="true" />
        </div>
        <p className="hv-giant" aria-hidden="true">CAR CITY</p>
        <div className="hv-copy wrap">
          <p className="mono hv-eyebrow" data-hv-fade><span className="dot" /> {t.eyebrow}</p>
          <h1 id="hero-title" className="hv-title">
            {t.lines.map((l, i) => (
              <span key={i} className="line"><span data-hv-line style={{ ["--i" as string]: i }} className={i === t.lines.length - 1 ? "accent" : undefined}>{l}</span></span>
            ))}
          </h1>
          <p className="hv-sub" data-hv-fade>{t.sub}</p>
          <ul className="hero-bullets" data-hv-fade>
            {t.bullets.map((b) => <li key={b}>{b}</li>)}
          </ul>
          <div className="row" data-hv-fade>
            <a href="#zayavka" className="btn btn-primary btn-lg" data-magnetic>{t.book}</a>
            <a href="#avtopark" className="btn btn-glass btn-lg" data-magnetic>{t.pick}</a>
          </div>
        </div>
        <div className="hv-stats wrap" data-hv-fade>
          <dl>
            {t.stats.map((s) => <div key={s.k}><dt className="mono">{s.k}</dt><dd>{s.v}</dd></div>)}
          </dl>
          <span className="hv-scroll mono" aria-hidden="true">{t.scroll}<i /></span>
        </div>
      </div>
    </section>
  );
}
