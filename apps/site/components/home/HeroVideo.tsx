"use client";

import { useEffect, useRef } from "react";
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

  useEffect(() => {
    const el = root.current!;
    const v = video.current!;
    const basic = document.documentElement.dataset.gfx === "basic";
    // экономим трафик и батарею: видео играет, только пока первый экран виден
    const io = new IntersectionObserver(([e]) => (e.isIntersecting && !basic ? v.play().catch(() => {}) : v.pause()), { threshold: 0.05 });
    io.observe(el);
    if (basic) return () => io.disconnect();

    const ctx = gsap.context(() => {
      const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
      intro
        .fromTo(".hv-curtain", { scaleY: 1 }, { scaleY: 0, duration: 1.2, ease: "expo.inOut" })
        .from(".hv-frame", { scale: 1.18, duration: 2.2 }, 0.2)
        .from("[data-hv-line]", { yPercent: 115, rotate: 3, duration: 1.3, stagger: 0.09 }, 0.55)
        .from("[data-hv-fade]", { opacity: 0, y: 26, duration: 1, stagger: 0.07 }, 0.9);

      const mm = gsap.matchMedia();
      mm.add("(min-width: 720px)", () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 0.8 } });
        tl.to(".hv-frame", { scale: 0.84, borderRadius: 40, ease: "none" }, 0)
          .to(".hv-video", { scale: 1.12, ease: "none" }, 0)
          .to(".hv-copy", { yPercent: -40, opacity: 0, ease: "none" }, 0)
          .to(".hv-stats", { y: 60, opacity: 0, ease: "none" }, 0)
          .fromTo(".hv-giant", { xPercent: 30 }, { xPercent: -55, ease: "none" }, 0)
          .to(".hv-giant", { opacity: 1, duration: 0.2 }, 0.1);
      });
      mm.add("(max-width: 719px)", () => {
        gsap.to(".hv-frame", { scale: 0.92, borderRadius: 28, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 0.6 } });
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
        <div className="hv-frame">
          <video ref={video} className="hv-video" muted loop playsInline preload="metadata" poster={asset("/video/hero-poster.webp")} aria-hidden="true">
            <source src={asset("/video/hero-960.mp4")} type="video/mp4" media="(max-width: 720px)" />
            <source src={asset("/video/hero-1600.mp4")} type="video/mp4" />
          </video>
          <div className="hv-shade" aria-hidden="true" />
          <div className="hv-curtain" aria-hidden="true" />
        </div>
        <p className="hv-giant" aria-hidden="true">CAR CITY</p>
        <div className="hv-copy wrap">
          <p className="mono hv-eyebrow" data-hv-fade><span className="dot" /> {t.eyebrow}</p>
          <h1 id="hero-title" className="hv-title">
            {t.lines.map((l, i) => (
              <span key={i} className="line"><span data-hv-line className={i === t.lines.length - 1 ? "accent" : undefined}>{l}</span></span>
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
