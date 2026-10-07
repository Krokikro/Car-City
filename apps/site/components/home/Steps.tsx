"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { asset, splitLang } from "@/lib/i18n";
import type { HomeText } from "@/lib/home-text";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

const FINALE: Record<string, string> = {
  ru: "Отправляйтесь в путь",
  en: "Hit the road",
  ky: "Жолго чыгыңыз",
  kk: "Жолға шығыңыз",
  uz: "Yo‘lga chiqing",
};

// Извилистая дорога. На компьютере — волной слева направо, таблички шагов попеременно над и под дорогой.
// На телефоне — змейкой сверху вниз по левому краю, таблички справа.
const ROADS = {
  wide: {
    w: 1200, h: 520,
    d: "M -40 300 C 80 300 140 200 260 200 C 400 200 420 340 560 340 C 700 340 720 180 860 180 C 980 180 940 320 1040 320 L 1240 320",
    stops: [[260, 200], [560, 340], [860, 180], [1040, 320]],
  },
  narrow: {
    w: 100, h: 1000,
    d: "M 50 -20 C 50 40 80 70 55 125 C 30 205 80 295 55 375 C 30 455 80 545 55 625 C 30 705 80 795 55 875 L 55 1020",
    stops: [[55, 125], [55, 375], [55, 625], [55, 875]],
  },
} as const;

function Flag() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M5 21V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 4h14l-3 4.5 3 4.5H5z" fill="currentColor" opacity=".25" />
      <path d="M5 4h4.7v3H5zM14.4 4H19l-1.3 2-.4.9h-2.9zM9.7 7h4.7v3H9.7zM5 10h4.7v3H5zM14.4 10h2.9l1.7 3h-4.6z" fill="currentColor" />
    </svg>
  );
}

// «Как получить авто за 3 шага»: настоящая машина (вид сверху) едет по извилистой дороге от таблички к табличке.
// Каждый шаг — большая шашка такси с надписью; загорается, когда к ней подъезжает машина. Четвёртая — «в путь».
export function Steps({ req: requirementsBlock, steps }: { req: HomeText["requirements"]; steps: HomeText["steps"] }) {
  const root = useRef<HTMLElement>(null);
  const { lang } = splitLang(usePathname() || "/");
  const items = [...steps.items, FINALE[lang] ?? FINALE.ru];

  useEffect(() => {
    const el = root.current!;
    const basic = document.documentElement.dataset.gfx === "basic";
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      const build = (kind: keyof typeof ROADS) => {
        const R = ROADS[kind];
        const box = el.querySelector<HTMLElement>(`.road-${kind}`)!;
        const path = box.querySelector<SVGPathElement>(".road-path")!;
        const fill = box.querySelector<SVGPathElement>(".road-fill")!;
        const car = box.querySelector<HTMLElement>(".road-car")!;
        const plates = Array.from(el.querySelectorAll<HTMLElement>(".stp"));
        const len = path.getTotalLength();
        const near = (x: number, y: number) => {
          let best = 0, bd = Infinity;
          for (let l = 0; l <= len; l += len / 600) {
            const p = path.getPointAtLength(l);
            const dd = (p.x - x) ** 2 + (p.y - y) ** 2;
            if (dd < bd) { bd = dd; best = l; }
          }
          return best / len;
        };
        const stopsAt = R.stops.map(([x, y]) => near(x, y));
        const b = stopsAt[stopsAt.length - 1];
        fill.style.strokeDasharray = `${len}`;
        const state = { p: basic ? b : 0 };
        const apply = () => {
          fill.style.strokeDashoffset = `${len * (1 - state.p)}`;
          plates.forEach((pl, i) => pl.classList.toggle("on", state.p >= stopsAt[i] - 0.015));
          gsap.set(car, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5], autoRotate: true, start: 0, end: Math.max(0.0001, state.p) } });
        };
        apply();
        if (basic) return;
        gsap.to(state, {
          p: b,
          ease: "none",
          scrollTrigger: { trigger: box, start: "top 80%", end: "bottom 45%", scrub: 0.9, invalidateOnRefresh: true },
          onUpdate: apply,
        });
      };
      mm.add("(min-width: 900px)", () => build("wide"));
      mm.add("(max-width: 899px)", () => build("narrow"));
    }, el);
    return () => ctx.revert();
  }, []);

  const road = (k: keyof typeof ROADS) => (
    <div className={`road road-${k}`} aria-hidden="true">
      <svg viewBox={`0 0 ${ROADS[k].w} ${ROADS[k].h}`} preserveAspectRatio="none">
        <path className="road-bed" d={ROADS[k].d} vectorEffect="non-scaling-stroke" />
        <path className="road-dash" d={ROADS[k].d} vectorEffect="non-scaling-stroke" />
        <path className="road-fill" d={ROADS[k].d} />
        <path className="road-path" d={ROADS[k].d} />
      </svg>
      <span className="road-car">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("/steps/taxi-top.webp")} alt="" width={520} height={236} loading="lazy" decoding="async" />
      </span>
    </div>
  );

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
        <div className="stp-wrap">
          <h2 className="display stp-title" data-split>{steps.title}</h2>
          <div className="stp-board">
            {road("wide")}
            {road("narrow")}
            <ol className="stp-list">
              {items.map((s, i) => {
                const [x, y] = ROADS.wide.stops[i];
                const above = i % 2 === 0;
                return (
                  <li key={s} className={`stp${above ? " stp-up" : " stp-down"}${i === items.length - 1 ? " stp-finish" : ""}`}
                    style={{ ["--x" as string]: `${(x / ROADS.wide.w) * 100}%`, ["--y" as string]: `${((y + (above ? -36 : 36)) / ROADS.wide.h) * 100}%` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="stp-sign" src={asset("/steps/roof-sign.webp")} alt="" width={900} height={368} loading="lazy" decoding="async" />
                    <span className="stp-panel">
                      <span className="stp-n">{i === items.length - 1 ? <Flag /> : i + 1}</span>
                      <span className="stp-t">{s}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
