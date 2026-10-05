"use client";

import { useId, useState } from "react";
import { classes, incomeAssumptions as a, minRent, type CarClass } from "@/lib/content";
import { Odometer } from "./Odometer";

const DAYS = [5, 6, 7];

export function IncomeCalculator() {
  const id = useId();
  const [cls, setCls] = useState<CarClass>("komfort");
  const [days, setDays] = useState(6);
  const [hours, setHours] = useState(10);

  const perWeek = (hours * a.revenuePerHour[cls] * (1 - a.parkCommission) - hours * a.fuelPerHour) * days - minRent(cls) * 7;

  return (
    <section className="section" id="kalkulyator" aria-labelledby={`${id}-t`}>
      <div className="wrap split">
        <div className="head">
          <p className="mono">Калькулятор дохода</p>
          <h2 id={`${id}-t`} className="display">Сколько останется за неделю</h2>
          <p className="muted">После аренды самой доступной машины класса, комиссии парка 4% и топлива.</p>
        </div>
        <form className="calc" onSubmit={(e) => e.preventDefault()}>
          <label className="field">
            <span className="mono">Класс</span>
            <select id={`${id}-cls`} value={cls} onChange={(e) => setCls(e.target.value as CarClass)}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <fieldset className="field">
            <legend className="mono">Дней в неделю</legend>
            <div className="seg">
              {DAYS.map((d) => (
                <button key={d} type="button" className="pill" aria-pressed={d === days} onClick={() => setDays(d)}>
                  {d}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="field">
            <span className="mono">Часов в смене: {hours}</span>
            <input id={`${id}-h`} type="range" min={6} max={14} step={1} value={hours} onChange={(e) => setHours(Number(e.target.value))} />
          </label>
          <div className="calc-result" aria-live="polite">
            <span className="mono">Останется за неделю</span>
            <Odometer value={perWeek} />
          </div>
          <p className="demo-note">Аренда и комиссия — с действующего сайта. Выручка в час и топливо — допущения, их зададут в админке.</p>
        </form>
      </div>
    </section>
  );
}
