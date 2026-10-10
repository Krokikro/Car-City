"use client";

import { useState } from "react";
import { ruHome, type HomeText } from "@/lib/home-text";
import { fleet as baseFleet, type FleetCar } from "@/lib/fleet";
import { incomeAssumptions as a, type CarClass } from "@/lib/content";
import { carImages } from "@/lib/car-images";
import { CarArt } from "../CarArt";
import { Odometer } from "../Odometer";
import { LeadForm } from "../LeadForm";

const CLASSES: CarClass[] = ["ekonom", "komfort", "komfort-plus"];
const cheapest = (fleet: FleetCar[], c: CarClass) => {
  const list = fleet.filter((m) => m.cls === c);
  return list.reduce((best, m) => (m.price < best.price ? m : best), list[0]);
};
const rub = (n: number) => Math.round(n).toLocaleString("ru-RU").replace(/ /g, " ");

export function Calculator({ t = ruHome.calculator, classes = ruHome.fleet.classes, cars }: { t?: HomeText["calculator"]; classes?: Record<string, string>; cars?: FleetCar[] }) {
  const [cls, setCls] = useState<CarClass>("ekonom");
  const [days, setDays] = useState(6);
  const [hours, setHours] = useState(10);
  const fleet = cars ?? baseFleet;
  // Месяц = 30 дней: рабочие дни по выбранному графику, аренда за все 30 дней (мин. срок аренды 30 дней).
  const workDays = (days / 7) * 30;
  const gross = hours * a.revenuePerHour[cls] * workDays;
  const commission = gross * a.parkCommission;
  const fuel = hours * a.fuelPerHour * workDays;
  const rent = cheapest(fleet, cls).price * 30;
  const month = gross - commission - fuel - rent;
  const name = classes[cls].toLowerCase();
  const parts = [
    { k: "net", label: "Вам на руки", v: Math.max(0, month) },
    { k: "rent", label: "Аренда авто", v: rent },
    { k: "fuel", label: "Топливо", v: fuel },
    { k: "fee", label: `Комиссия парка ${Math.round(a.parkCommission * 100)}%`, v: commission },
  ];
  const total = parts.reduce((s, p) => s + p.v, 0) || 1;

  return (
    <section className="section calc-sec" id="kalkulyator" aria-labelledby="calc-title">
      <div className="wrap">
        <div className="section-head">
          <p className="mono eyebrow">{t.eyebrow}</p>
          <h2 id="calc-title" className="display" data-split>{t.title}</h2>
          <p className="lead">{t.text}</p>
        </div>
        <div className="calc-grid">
          <form className="calc" onSubmit={(e) => e.preventDefault()}>
            <fieldset>
              <legend><span className="q-n">1.</span> {t.q1}</legend>
              <div className="calc-cls" role="radiogroup" aria-label={t.q1}>
                {CLASSES.map((c) => {
                  const car = cheapest(fleet, c);
                  return (
                    <button key={c} type="button" role="radio" aria-checked={c === cls} className="calc-cls-btn" onClick={() => setCls(c)}>
                      <span className="calc-cls-img" aria-hidden="true">
                        {carImages[car.slug] ? <CarArt slug={car.slug} name={car.name} sizes="(max-width: 700px) 30vw, 200px" /> : null}
                      </span>
                      <b>{classes[c]}</b>
                      <small>от {rub(car.price)} ₽/сутки</small>
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <div className="calc-sliders">
              <fieldset>
                <legend><span className="q-n">2.</span> {t.q2}</legend>
                <div className="calc-val"><b>{days}</b><span>{days === 1 ? "день" : days < 5 ? "дня" : "дней"} в неделю</span></div>
                <input className="calc-range" type="range" min={1} max={7} step={1} value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label={t.q2} style={{ ["--p" as string]: `${((days - 1) / 6) * 100}%` }} />
                <div className="calc-ticks" aria-hidden="true">{[1, 2, 3, 4, 5, 6, 7].map((d) => <span key={d}>{d}</span>)}</div>
              </fieldset>
              <fieldset>
                <legend><span className="q-n">3.</span> {t.q3}</legend>
                <div className="calc-val"><b>{hours}</b><span>{hours < 5 ? "часа" : "часов"} в день</span></div>
                <input className="calc-range" type="range" min={6} max={12} step={1} value={hours} onChange={(e) => setHours(Number(e.target.value))} aria-label={t.q3} style={{ ["--p" as string]: `${((hours - 6) / 6) * 100}%` }} />
                <div className="calc-ticks" aria-hidden="true">{[6, 7, 8, 9, 10, 11, 12].map((h) => <span key={h}>{h}</span>)}</div>
              </fieldset>
            </div>
            <div className="calc-split" aria-live="polite">
              <p className="mono calc-split-t">Куда уходит выручка за месяц · {rub(gross)} ₽</p>
              <div className="calc-bar" aria-hidden="true">
                {parts.map((p) => <i key={p.k} className={`b-${p.k}`} style={{ flexGrow: Math.max(p.v, 0) / total }} />)}
              </div>
              <ul className="calc-legend">
                {parts.map((p) => <li key={p.k}><i className={`b-${p.k}`} aria-hidden="true" /><span>{p.label}</span><b>{rub(p.v)} ₽</b></li>)}
              </ul>
            </div>
          </form>
          <div className="calc-out">
            <div className="calc-result" aria-live="polite">
              <p className="mono">{t.resultPrefix} {name}</p>
              <Odometer value={Math.max(0, month)} />
              <p className="muted">{t.resultSuffix}</p>
              <p className="small muted">{t.note}</p>
              <p className="demo-note">Расчёт ориентировочный: реальный заработок зависит от спроса и вашего графика.</p>
            </div>
            <div className="calc-form">
              <p className="h3">{t.formTitle}</p>
              <p className="muted small">{t.formText}</p>
              <LeadForm button={t.formButton} source="calculator" compact />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
