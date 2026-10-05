"use client";

import { useState } from "react";
import { classes, models, type CarClass } from "@/lib/content";
import { rub } from "@/lib/format";
import { CarImage } from "./CarImage";

export function ModelsByClass() {
  const [active, setActive] = useState<CarClass>("komfort");
  const list = models.filter((m) => m.cls === active);
  const current = classes.find((c) => c.id === active)!;

  return (
    <section className="section" id="arenda" aria-labelledby="classes-title">
      <div className="wrap">
        <div className="head">
          <p className="mono">Автопарк · {models.length} моделей</p>
          <h2 id="classes-title" className="display">Под какой тариф работаете?</h2>
        </div>
        <div className="tabs" role="tablist" aria-label="Класс такси">
          {classes.map((c) => (
            <button
              key={c.id}
              role="tab"
              type="button"
              id={`tab-${c.id}`}
              aria-selected={c.id === active}
              aria-controls="models-panel"
              className="pill"
              onClick={() => setActive(c.id)}
            >
              {c.name}
              <span className="pill-count">{models.filter((m) => m.cls === c.id).length}</span>
            </button>
          ))}
        </div>
        <div id="models-panel" role="tabpanel" aria-labelledby={`tab-${active}`} className="models">
          <p className="muted">{current.note}</p>
          <div className="cards">
            {list.map((m, i) => (
              <article key={m.slug} className="car-card">
                <div className="car-media">
                  <CarImage model={m} priority={i < 2} />
                </div>
                <div className="car-body">
                  <p className="mono">{current.name} · {m.engine}</p>
                  <h3>{m.name}</h3>
                  <p className="price">
                    от {rub(m.rentFrom)}<small> / сутки</small>
                  </p>
                  {m.buyoutFrom && <p className="muted small">Выкуп от {rub(m.buyoutFrom)} в сутки</p>}
                  <a className="btn btn-ghost btn-sm" href="#zayavka" data-model={m.slug}>Хочу эту</a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
