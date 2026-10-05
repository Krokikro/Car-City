"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { fleet, fleetClasses } from "@/lib/fleet";
import type { CarClass } from "@/lib/content";
import { rub } from "@/lib/format";
import { CarArt } from "../CarArt";

// Автопарк: вкладки классов с бегущей подложкой, горизонтальная лента карточек с перетаскиванием,
// наклон карточки за курсором и блик. Порядок вкладок и карточек — как на car-city.pro.
export function Fleet() {
  const [active, setActive] = useState<CarClass>("komfort");
  const tabs = useRef<HTMLDivElement>(null);
  const ind = useRef<HTMLSpanElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const list = fleet.filter((m) => m.cls === active);

  useLayoutEffect(() => {
    const t = tabs.current?.querySelector<HTMLElement>(`[aria-selected="true"]`);
    if (t && ind.current) {
      ind.current.style.width = `${t.offsetWidth}px`;
      ind.current.style.transform = `translateX(${t.offsetLeft}px)`;
    }
    track.current?.scrollTo({ left: 0, behavior: "smooth" });
  }, [active]);

  // перетаскивание мышью
  useEffect(() => {
    const el = track.current!;
    let down = false, x0 = 0, s0 = 0, moved = false;
    const d = (e: PointerEvent) => { if (e.pointerType !== "mouse") return; down = true; moved = false; x0 = e.clientX; s0 = el.scrollLeft; el.classList.add("dragging"); };
    const m = (e: PointerEvent) => { if (!down) return; const dx = e.clientX - x0; if (Math.abs(dx) > 4) moved = true; el.scrollLeft = s0 - dx; };
    const u = () => { down = false; el.classList.remove("dragging"); };
    const c = (e: MouseEvent) => { if (moved) { e.preventDefault(); e.stopPropagation(); } };
    el.addEventListener("pointerdown", d); addEventListener("pointermove", m); addEventListener("pointerup", u); el.addEventListener("click", c, true);
    return () => { el.removeEventListener("pointerdown", d); removeEventListener("pointermove", m); removeEventListener("pointerup", u); el.removeEventListener("click", c, true); };
  }, []);

  const tilt = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = e.currentTarget, r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - y) * 8}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 10}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  };
  const untilt = (e: React.PointerEvent<HTMLElement>) => {
    e.currentTarget.style.setProperty("--rx", "0deg");
    e.currentTarget.style.setProperty("--ry", "0deg");
  };

  return (
    <section className="section fleet" id="avtopark" aria-labelledby="fleet-title">
      <div className="wrap">
        <div className="fleet-head">
          <div className="section-head">
            <p className="mono eyebrow">Автопарк · {fleet.length} моделей</p>
            <h2 id="fleet-title" className="display" data-split>Подобрать автомобиль</h2>
          </div>
          <div className="tabs-wrap">
            <div className="tabs" role="tablist" aria-label="Класс автомобиля" ref={tabs}>
              <span className="tabs-ind" ref={ind} aria-hidden="true" />
              {fleetClasses.map((c) => (
                <button key={c.id} role="tab" type="button" id={`tab-${c.id}`} aria-selected={c.id === active} aria-controls="fleet-panel" className="tab" onClick={() => setActive(c.id)}>
                  {c.name}
                  <sup>{fleet.filter((m) => m.cls === c.id).length}</sup>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div id="fleet-panel" role="tabpanel" aria-labelledby={`tab-${active}`} className="fleet-track" ref={track} key={active}>
        {list.map((m, i) => (
          <article key={m.slug} className="car-card" style={{ ["--i" as string]: i }} onPointerMove={tilt} onPointerLeave={untilt}>
            <div className="car-card-in">
              {m.badge && <span className="car-badge">{m.badge}</span>}
              <div className="car-visual">
                <span className="car-floor" aria-hidden="true" />
                <CarArt slug={m.slug} name={m.name} priority={i < 2} />
              </div>
              <div className="car-info">
                <h3>{m.name}</h3>
                {(m.engine || m.gearbox) && (
                  <dl className="car-specs">
                    {m.engine && <div><dt>Объем двигателя:</dt><dd>{m.engine}</dd></div>}
                    {m.gearbox && <div><dt>Коробка:</dt><dd>{m.gearbox}</dd></div>}
                  </dl>
                )}
                <p className="car-price"><span>от</span> {rub(m.price)}<small>/сутки</small></p>
                <div className="car-actions">
                  {m.rent && <a className="btn btn-primary btn-sm" href={m.rent}>Арендовать</a>}
                  {m.buy && <a className="btn btn-ghost btn-sm" href={m.buy}>Выкупить</a>}
                </div>
              </div>
              <span className="car-glare" aria-hidden="true" />
            </div>
          </article>
        ))}
        <div className="fleet-end" aria-hidden="true" />
      </div>
    </section>
  );
}
