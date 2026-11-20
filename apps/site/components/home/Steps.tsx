"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { asset, splitLang } from "@/lib/i18n";
import type { HomeText } from "@/lib/home-text";
import { patched } from "@/lib/texts";
import { BUY_TEXT, FINALE, METER } from "@/lib/text-defaults";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// Подписи дороги «3/5 шагов» и таксометра правятся в админке (Тексты → Главная → Дорога шагов)


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

type Road = { w: number; h: number; d: string; stops: readonly (readonly [number, number])[] };

// Дорога для выкупа: шесть остановок. Строим волну через точки со сглаженными стыками.
function waveRoad(w: number, h: number, pts: [number, number][], startY: number, endX: number): Road {
  let d = `M -40 ${startY}`;
  let [px, py] = [-40, startY];
  pts.forEach(([x, y]) => {
    const k = (x - px) / 2.3;
    d += ` C ${px + k} ${py} ${x - k} ${y} ${x} ${y}`;
    [px, py] = [x, y];
  });
  d += ` L ${endX} ${py}`;
  return { w, h, d, stops: pts };
}
function snakeRoad(h: number, n: number): Road {
  const step = h / n;
  const ys = Array.from({ length: n }, (_, i) => step * (i + 0.5));
  let d = `M 50 -20 C 50 ${ys[0] * 0.3} 80 ${ys[0] * 0.55} 55 ${ys[0]}`;
  for (let i = 1; i < n; i++) {
    const a = ys[i - 1], b = ys[i], dy = b - a;
    d += ` C ${i % 2 ? 30 : 80} ${a + dy * 0.28} ${i % 2 ? 80 : 30} ${a + dy * 0.72} 55 ${b}`;
  }
  d += ` L 55 ${h + 20}`;
  return { w: 100, h, d, stops: ys.map((y) => [55, y] as const) };
}
const BUY_ROADS = {
  wide: waveRoad(1200, 520, [[150, 230], [345, 335], [540, 205], [735, 335], [930, 205], [1075, 320]], 300, 1240),
  narrow: snakeRoad(1500, 6),
};

// Выкуп — дорога длиннее: после проверки СБ ещё два шага.




/** Таксометр вместо последней таблички: на нём «Свободно», когда подъезжает машина, загорается «В пути» и бежит счётчик */
function Meter({ lang }: { lang: string }) {
  const m = stepsX(lang);
  return (
    <span className="mt" aria-hidden="true">
      <span className="mt-top"><i className="mt-lamp" /><b>TAXI</b></span>
      <span className="mt-screen">
        <span className="mt-state"><span className="mt-free">{m.free}</span><span className="mt-busy">{m.busy}</span></span>
        <span className="mt-digits"><span className="mt-num" /><small>₽</small></span>
      </span>
      <span className="mt-keys"><i /><i /><i /></span>
    </span>
  );
}

/** Требования к водителям: отдельный блок (на главной идёт сразу после дороги) */
export function Requirements({ req }: { req: HomeText["requirements"] }) {
  return (
    <section className="section req-sec" aria-labelledby="req-title">
      <div className="wrap">
        <div className="req">
          <h2 id="req-title" className="h1" data-split>{req.title}</h2>
          <dl className="req-list" data-reveal-stagger>
            {req.items.map((r) => (
              <div key={r.k}>
                <dt className="mono">{r.k}:</dt>
                <dd>{r.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

// «Как получить авто за 3 шага»: настоящая машина (вид сверху) едет по извилистой дороге от таблички к табличке.
// Каждый шаг — большая шашка такси с надписью; загорается, когда к ней подъезжает машина. Четвёртая — «в путь».
export function Steps({ steps, variant = "rent", vehicle = "taxi" }: { steps: HomeText["steps"]; variant?: "rent" | "buy"; vehicle?: "taxi" | "truck" }) {
  const root = useRef<HTMLElement>(null);
  const { lang } = splitLang(usePathname() || "/");
  const buy = variant === "buy";
  const sx = stepsX(lang);
  const bt = { title: sx.buyTitle, extra: sx.buyExtra };
  const base = buy ? [...steps.items.slice(0, 2), ...bt.extra, ...steps.items.slice(2)] : steps.items;
  const items = [...base, sx.finish];
  const roads = buy ? BUY_ROADS : ROADS;

  useEffect(() => {
    const el = root.current!;
    const basic = document.documentElement.dataset.gfx === "basic";
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      const build = (kind: keyof typeof ROADS) => {
        const R = roads[kind];
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
        // Компьютер: блок «прилипает» к экрану, машина едет от прокрутки, дальше страница листается сама.
        // Телефон: дорога длиннее экрана — машина едет, пока блок проезжает мимо.
        const wrap = el.querySelector<HTMLElement>(".stp-wrap")!;
        const pin = kind === "wide";
        gsap.to(state, {
          p: b,
          ease: "none",
          scrollTrigger: pin
            ? {
                trigger: wrap,
                start: () => (wrap.offsetHeight < innerHeight - 110 ? "center center+=30" : "top 96px"),
                end: () => `+=${Math.round(innerHeight * 1.25)}`,
                pin: true,
                pinSpacing: true,
                anticipatePin: 1,
                scrub: 0.35,
                invalidateOnRefresh: true,
              }
            : { trigger: box, start: "top 80%", end: "bottom 45%", scrub: 0.6, invalidateOnRefresh: true },
          onUpdate: apply,
        });
      };
      mm.add("(min-width: 900px)", () => build("wide"));
      mm.add("(max-width: 899px)", () => build("narrow"));
    }, el);
    return () => ctx.revert();
  }, [buy]);

  const road = (k: keyof typeof ROADS) => (
    <div className={`road road-${k}`} aria-hidden="true">
      <svg viewBox={`0 0 ${roads[k].w} ${roads[k].h}`} preserveAspectRatio="none">
        <path className="road-bed" d={roads[k].d} vectorEffect="non-scaling-stroke" />
        <path className="road-dash" d={roads[k].d} vectorEffect="non-scaling-stroke" />
        <path className="road-fill" d={roads[k].d} />
        <path className="road-path" d={roads[k].d} />
      </svg>
      <span className="road-car">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(vehicle === "truck" ? "/steps/truck-top.webp" : "/steps/taxi-top.webp")} alt="" width={520} height={236} loading="lazy" decoding="async" />
      </span>
    </div>
  );

  return (
    <section ref={root} className="section steps-sec" aria-labelledby="stp-title">
      <div className="wrap">
        <div className="stp-wrap">
          <h2 id="stp-title" className="display stp-title" data-split>{buy ? bt.title : steps.title}</h2>
          <div className={`stp-board${buy ? " stp-buy" : ""}`}>
            {road("wide")}
            {road("narrow")}
            <ol className="stp-list">
              {items.map((s, i) => {
                const [x, y] = roads.wide.stops[i];
                const above = i % 2 === 0;
                return (
                  <li key={s} className={`stp${above ? " stp-up" : " stp-down"}${i === items.length - 1 ? " stp-finish" : ""}`}
                    style={{ ["--x" as string]: `${(x / roads.wide.w) * 100}%`, ["--y" as string]: `${((y + (above ? -36 : 36)) / roads.wide.h) * 100}%` }}>
                    {i === items.length - 1 ? (
                      <>
                        <Meter lang={lang} />
                        <span className="stp-cap">{s}</span>
                      </>
                    ) : (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img className="stp-sign" src={asset("/steps/roof-sign.webp")} alt="" width={900} height={368} loading="lazy" decoding="async" />
                        <span className="stp-panel">
                          <span className="stp-n">{i + 1}</span>
                          <span className="stp-t">{s}</span>
                        </span>
                      </>
                    )}
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

export type StepsX = { finish: string; buyTitle: string; buyExtra: [string, string]; free: string; busy: string };
/** Подписи дороги на языке lang с правками из админки */
export function stepsX(lang: string): StepsX {
  const bt = BUY_TEXT[lang] ?? BUY_TEXT.ru, m = METER[lang] ?? METER.ru;
  return patched("steps-x", lang, { finish: FINALE[lang] ?? FINALE.ru, buyTitle: bt.title, buyExtra: [...bt.extra] as [string, string], free: m.free, busy: m.busy });
}
