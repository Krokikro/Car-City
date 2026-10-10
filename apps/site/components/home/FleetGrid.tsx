"use client";

import { useState } from "react";
import { fleet as baseFleet, fleetClasses, popularOf, saleLabel, type FleetCar } from "@/lib/fleet";
import type { CarClass } from "@/lib/content";
import { CarArt } from "../CarArt";
import { href, type Lang } from "@/lib/i18n";
import type { HomeText } from "@/lib/home-text";

const MORE: Record<string, { all: string; less: string; popular: string; allCls: string; models: string }> = {
  ru: { all: "Смотреть весь автопарк", less: "Свернуть", popular: "Популярные модели из каждого класса", allCls: "Все", models: "моделей" },
  en: { all: "See the whole fleet", less: "Show less", popular: "Popular models from every class", allCls: "All", models: "models" },
};

/** Плитка машины — как на странице выкупа: фото целиком, класс, заметные характеристики, цена, две кнопки */
export function FleetTile({ m, t, lang, i = 0, priority = false }: { m: FleetCar; t: HomeText["fleet"]; lang: Lang; i?: number; priority?: boolean }) {
  const link = href(m.rent ?? m.buy, lang);
  const sale = saleLabel(m);
  return (
    <article className={`ft${sale ? " has-sale" : ""}`} style={{ ["--i" as string]: i }}>
      <a className="ft-media" href={link} aria-label={m.name}>
        <CarArt slug={m.slug} name={m.name} priority={priority} lit sizes="(max-width: 640px) 92vw, (max-width: 1100px) 46vw, 340px" />
        <span className="ft-cls">{t.classes[m.cls] ?? m.cls}</span>
        {sale && <span className="ft-sale" title={sale}><i aria-hidden="true">%</i>{sale}</span>}
      </a>
      <div className="ft-info">
        <h3><a href={link}>{m.name}</a></h3>
        {(m.engine || m.gearbox) && (
          <ul className="ft-specs" aria-label="Характеристики">
            {m.engine && (
              <li title={t.engine}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h2V8h3V6h6v2h2l2 3h1v6h-1l-2 2H9l-2-2H6v-3H4z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
                {m.engine}
              </li>
            )}
            {m.gearbox && (
              <li title={t.gearbox}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5v14M12 5v14M18 5v7H6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><circle cx="6" cy="5" r="1.6" fill="currentColor" /><circle cx="12" cy="5" r="1.6" fill="currentColor" /><circle cx="18" cy="5" r="1.6" fill="currentColor" /></svg>
                {m.gearbox === "Автомат" ? t.auto : m.gearbox}
              </li>
            )}
          </ul>
        )}
        <p className="ft-price">
          {t.from && <span className="ft-from">{t.from}</span>}
          <b>{m.price.toLocaleString("ru-RU")}&nbsp;₽</b>
          {m.old && m.old > m.price && <s className="ft-old">{m.old.toLocaleString("ru-RU")}&nbsp;₽</s>}
          <span className="ft-per">{t.perDay}</span>
        </p>
        <div className="ft-actions">
          {m.rent && <a className="btn btn-primary btn-sm" href={href(m.rent, lang)}>{t.rent}</a>}
          {m.buy && <a className="btn btn-ghost btn-sm" href={href(m.buy, lang)}>{t.buy}</a>}
        </div>
      </div>
    </article>
  );
}

// Автопарк на главной: сначала по две популярные модели из каждого класса, по кнопке — весь парк с фильтром классов.
export function FleetGrid({ t, lang, cars }: { t: HomeText["fleet"]; lang: Lang; cars?: FleetCar[] }) {
  const fleet = cars ?? baseFleet;
  const m = MORE[lang] ?? MORE.ru;
  const [open, setOpen] = useState(false);
  const [cls, setCls] = useState<CarClass | "all">("all");
  const popular = popularOf(fleet);
  const popularSlugs = new Set(popular.map((f) => f.slug));
  const rest = fleet.filter((f) => !popularSlugs.has(f.slug) && (cls === "all" || f.cls === cls));
  const shown = open ? (cls === "all" ? [...popular, ...rest] : fleet.filter((f) => f.cls === cls)) : popular;

  return (
    <section className="section fg" id="avtopark" aria-labelledby="fleet-title">
      <div className="wrap">
        <div className="fg-head">
          <div>
            <p className="mono eyebrow">{t.eyebrow} · {fleet.length} {m.models}</p>
            <h2 id="fleet-title" className="display" data-split>{t.title}</h2>
          </div>
          <p className="fg-sub">{open ? null : m.popular}</p>
        </div>
        {open && (
          <div className="fg-filter" role="group" aria-label={t.classLabel}>
            {[{ id: "all" as const, name: m.allCls }, ...fleetClasses.map((c) => ({ id: c.id, name: t.classes[c.id] ?? c.name }))].map((c) => (
              <button key={c.id} type="button" className="pill" aria-pressed={cls === c.id} onClick={() => setCls(c.id)}>
                {c.name}
                <span className="pill-count">{c.id === "all" ? fleet.length : fleet.filter((f) => f.cls === c.id).length}</span>
              </button>
            ))}
          </div>
        )}
        <div className="ft-grid" key={`${open}-${cls}`}>
          {shown.map((car, i) => <FleetTile key={car.slug} m={car} t={t} lang={lang} i={i} priority={i < 4} />)}
          {!open && (
            <button type="button" className="ft ft-more" onClick={() => setOpen(true)} style={{ ["--i" as string]: shown.length }}>
              <span className="ft-more-n">{fleet.length}</span>
              <span className="ft-more-t">{m.all}</span>
              <span className="ft-more-arrow" aria-hidden="true">→</span>
            </button>
          )}
        </div>
        {open && (
          <div className="fg-foot">
            <button type="button" className="btn btn-ghost" onClick={() => { setOpen(false); setCls("all"); document.getElementById("avtopark")?.scrollIntoView({ behavior: "smooth" }); }}>{m.less}</button>
          </div>
        )}
      </div>
    </section>
  );
}
