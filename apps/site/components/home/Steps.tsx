"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { HomeText } from "@/lib/home-text";

gsap.registerPlugin(ScrollTrigger);

// «Как получить авто за 3 шага»: такси едет по дороге вслед за скроллом, шаги загораются по очереди.
export function Steps({ req: requirementsBlock, steps }: { req: HomeText["requirements"]; steps: HomeText["steps"] }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (document.documentElement.dataset.gfx === "basic") return;
    const el = root.current!;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: ".steps-road", start: "top 75%", end: "bottom 45%", scrub: 0.6 } });
      tl.fromTo(".road-car", { left: "0%" }, { left: "100%", ease: "none" }, 0);
      tl.fromTo(".road-fill", { scaleX: 0 }, { scaleX: 1, ease: "none" }, 0);
      gsap.utils.toArray<HTMLElement>(".step").forEach((s, i, all) => {
        tl.fromTo(s, { opacity: 0.25, y: 20 }, { opacity: 1, y: 0, duration: 0.15 }, (i / all.length) * 0.9);
        tl.call(() => s.classList.add("on"), [], (i / all.length) * 0.9 + 0.1);
      });
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <section ref={root} className="section steps-sec" aria-labelledby="req-title">
      <div className="wrap">
        <div className="req">
          <h2 id="req-title" className="h1" data-split>{requirementsBlock.title}</h2>
          <dl className="req-list" data-reveal-stagger>
            {requirementsBlock.items.map((r) => (
              <div key={r.k}>
                <dt className="mono">{r.k}:</dt>
                <dd>{r.v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="steps">
          <h2 className="display" data-split>{steps.title}</h2>
          <div className="steps-road" aria-hidden="true">
            <span className="road-line" />
            <span className="road-fill" />
            <span className="road-car">
              <svg viewBox="0 0 64 28"><path d="M4 20c0-3 2-5 5-6l10-2 8-7c2-1 4-2 6-2h14c3 0 5 1 7 3l6 6 2 1c2 1 3 3 3 5v2c0 1-1 2-2 2h-4a6 6 0 0 0-12 0H22a6 6 0 0 0-12 0H6c-1 0-2-1-2-2z" fill="#FFB700"/><rect x="26" y="15" width="16" height="3" fill="#0B0B0C"/><circle cx="16" cy="23" r="4.5" fill="#0B0B0C"/><circle cx="50" cy="23" r="4.5" fill="#0B0B0C"/></svg>
            </span>
          </div>
          <ol className="step-list">
            {steps.items.map((s, i) => (
              <li key={s} className="step">
                <span className="step-n">{i + 1}</span>
                <span className="step-t">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
