"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { fleet, fleetClasses } from "@/lib/fleet";
import type { CarClass } from "@/lib/content";
import { CarArt } from "../CarArt";
import { href, type Lang } from "@/lib/i18n";
import type { HomeText } from "@/lib/home-text";

gsap.registerPlugin(ScrollTrigger);

// Где на фото фары (в % кадра) — при наведении они загораются. Для машин без фото фары не рисуем.
const LIGHTS: Record<string, [number, number][]> = {
  "volkswagen-polo-1.6": [[15, 52], [33, 50]],
  "kia-rio-1.6": [[11, 62], [39, 58]],
  "kia-rio-1.4": [[10, 62], [37, 59]],
  "skoda-rapid-1.6": [[17, 64], [45, 62]],
  "moskvich-3": [[10, 67], [42, 67]],
  "belgee-x50": [[25, 63], [44, 60]],
  "geely-emgrand": [[11, 66], [40, 63]],
  "chery-tiggo-4-pro": [[10, 57], [39, 53]],
  "omoda-s-5": [[6, 63], [33, 57]],
  "chery-tiggo-4": [[5, 57], [29, 55]],
};

// Автопарк: на компьютере секция закрепляется, и вертикальный скролл везёт ленту машин вбок.
// На телефоне — обычная лента со свайпом. Порядок классов и машин — как на car-city.pro.
export function FleetShow({ t, lang }: { t: HomeText["fleet"]; lang: Lang }) {
  const [active, setActive] = useState<CarClass>("komfort");
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const ind = useRef<HTMLSpanElement>(null);
  const list = fleet.filter((m) => m.cls === active);

  useLayoutEffect(() => {
    const tab = tabs.current?.querySelector<HTMLElement>(`[aria-selected="true"]`);
    if (tab && ind.current) {
      ind.current.style.width = `${tab.offsetWidth}px`;
      ind.current.style.transform = `translateX(${tab.offsetLeft}px)`;
    }
  }, [active]);

  useEffect(() => {
    if (document.documentElement.dataset.gfx === "basic") return;
    const el = root.current!;
    const tr = track.current!;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 900px)", () => {
        const dist = () => Math.max(0, tr.scrollWidth - innerWidth + 48);
        const tween = gsap.to(tr, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: { trigger: el, start: "top top", end: () => `+=${dist()}`, pin: true, scrub: 0.9, invalidateOnRefresh: true, anticipatePin: 1 },
        });
        // машины слегка доворачиваются, пока едут через кадр
        gsap.utils.toArray<HTMLElement>(".fc-photo", tr).forEach((ph) => {
          gsap.fromTo(ph, { xPercent: 8, scale: 1.08 }, { xPercent: -8, scale: 1, ease: "none", scrollTrigger: { trigger: ph, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
        });
      });
      gsap.from(".fc", { y: 80, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: el, start: "top 70%" } });
    }, el);
    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => ctx.revert();
  }, [active]);

  return (
    <section ref={root} className="fs" id="avtopark" aria-labelledby="fleet-title">
      <div className="fs-in">
        <div className="wrap fs-head">
          <div>
            <p className="mono eyebrow">{t.eyebrow} · {fleet.length} {t.models}</p>
            <h2 id="fleet-title" className="display">{t.title}</h2>
          </div>
          <div className="tabs-wrap">
            <div className="tabs" role="tablist" aria-label={t.classLabel} ref={tabs}>
              <span className="tabs-ind" ref={ind} aria-hidden="true" />
              {fleetClasses.map((c) => (
                <button key={c.id} role="tab" type="button" id={`tab-${c.id}`} aria-selected={c.id === active} aria-controls="fleet-panel" className="tab" onClick={() => setActive(c.id)}>
                  {t.classes[c.id] ?? c.name}
                  <sup>{fleet.filter((m) => m.cls === c.id).length}</sup>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div id="fleet-panel" role="tabpanel" aria-labelledby={`tab-${active}`} className="fs-track" ref={track} key={active}>
          {list.map((m, i) => (
            <article key={m.slug} className="fc" style={{ ["--i" as string]: i }}>
              <a className="fc-media" href={href(m.rent ?? m.buy, lang)} aria-label={m.name}>
                <span className="fc-num mono" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <div className="fc-photo">
                  <CarArt slug={m.slug} name={m.name} priority={i < 2} sizes="(max-width: 900px) 86vw, 46vw" />
                  {LIGHTS[m.slug]?.map(([x, y], k) => <i key={k} className="fc-light" style={{ left: `${x}%`, top: `${y}%` }} aria-hidden="true" />)}
                  <span className="fc-beam" aria-hidden="true" />
                </div>
              </a>
              <div className="fc-info">
                <h3>{m.name}</h3>
                <dl className="fc-specs">
                  {m.engine && <div><dt>{t.engine}</dt><dd>{m.engine}</dd></div>}
                  {m.gearbox && <div><dt>{t.gearbox}</dt><dd>{m.gearbox === "Автомат" ? t.auto : m.gearbox}</dd></div>}
                </dl>
                <p className="fc-price">{t.from && <span>{t.from}</span>} <b>{m.price.toLocaleString("ru-RU")} ₽</b><small>{t.perDay}</small></p>
                <div className="fc-actions">
                  {m.rent && <a className="btn btn-primary btn-sm" href={href(m.rent, lang)}>{t.rent}</a>}
                  {m.buy && <a className="btn btn-ghost btn-sm" href={href(m.buy, lang)}>{t.buy}</a>}
                </div>
              </div>
            </article>
          ))}
          <div className="fs-end" aria-hidden="true">
            <p className="mono">{t.hint}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
