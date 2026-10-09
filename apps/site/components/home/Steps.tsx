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
const BUY_TEXT: Record<string, { title: string; extra: [string, string] }> = {
  ru: { title: "Как получить авто под выкуп за 5 шагов?", extra: ["Выбираете автомобиль", "Вносите первый взнос"] },
  en: { title: "How to get a car on rent-to-own in 5 steps?", extra: ["Choose a car", "Pay the first instalment"] },
  ky: { title: "Сатып алуу менен унааны 5 кадамда кантип алса болот?", extra: ["Унааны тандайсыз", "Биринчи төлөмдү төлөйсүз"] },
  kk: { title: "Сатып алумен көлікті 5 қадамда қалай алуға болады?", extra: ["Көлікті таңдайсыз", "Алғашқы жарнаны төлейсіз"] },
  uz: { title: "Sotib olish bilan avtomobilni 5 qadamda qanday olish mumkin?", extra: ["Avtomobilni tanlaysiz", "Birinchi to‘lovni qilasiz"] },
};

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
export function Steps({ req: requirementsBlock, steps, variant = "rent" }: { req: HomeText["requirements"]; steps: HomeText["steps"]; variant?: "rent" | "buy" }) {
  const root = useRef<HTMLElement>(null);
  const { lang } = splitLang(usePathname() || "/");
  const buy = variant === "buy";
  const bt = BUY_TEXT[lang] ?? BUY_TEXT.ru;
  const base = buy ? [...steps.items.slice(0, 2), ...bt.extra, ...steps.items.slice(2)] : steps.items;
  const items = [...base, FINALE[lang] ?? FINALE.ru];
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
          <h2 className="display stp-title" data-split>{buy ? bt.title : steps.title}</h2>
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
