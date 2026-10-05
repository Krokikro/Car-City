"use client";

import { useState } from "react";
import { ruHome, type HomeText } from "@/lib/home-text";
import { fleet } from "@/lib/fleet";
import { incomeAssumptions as a, type CarClass } from "@/lib/content";
import { Odometer } from "../Odometer";
import { LeadForm } from "../LeadForm";

const CLASSES: CarClass[] = ["ekonom", "komfort", "komfort-plus"];
const minRent = (c: CarClass) => Math.min(...fleet.filter((m) => m.cls === c).map((m) => m.price));

export function Calculator({ t = ruHome.calculator, classes = ruHome.fleet.classes }: { t?: HomeText["calculator"]; classes?: Record<string, string> }) {
  const [cls, setCls] = useState<CarClass>("ekonom");
  const [days, setDays] = useState(6);
  const [hours, setHours] = useState(10);
  // Месяц = 30 дней: рабочие дни по выбранному графику, аренда за все 30 дней (мин. срок аренды 30 дней).
  const workDays = (days / 7) * 30;
  const month = (hours * a.revenuePerHour[cls] * (1 - a.parkCommission) - hours * a.fuelPerHour) * workDays - minRent(cls) * 30;
  const name = classes[cls].toLowerCase();

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
              <div className="seg">
                {CLASSES.map((c) => (
                  <button key={c} type="button" className="pill" aria-pressed={c === cls} onClick={() => setCls(c)}>{classes[c]}</button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend><span className="q-n">2.</span> {t.q2}</legend>
              <div className="seg seg-num">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <button key={d} type="button" className="pill" aria-pressed={d === days} onClick={() => setDays(d)}>{d}</button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend><span className="q-n">3.</span> {t.q3}</legend>
              <div className="seg seg-num">
                {[6, 7, 8, 9, 10, 11, 12].map((h) => (
                  <button key={h} type="button" className="pill" aria-pressed={h === hours} onClick={() => setHours(h)}>{h}</button>
                ))}
              </div>
            </fieldset>
          </form>
          <div className="calc-out">
            <div className="calc-result" aria-live="polite">
              <p className="mono">{t.resultPrefix} {name}</p>
              <Odometer value={Math.max(0, month)} />
              <p className="muted">{t.resultSuffix}</p>
              <p className="small muted">{t.note}</p>
              <p className="demo-note">{t.demo}</p>
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
