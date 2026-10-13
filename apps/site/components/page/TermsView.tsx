"use client";

import { useEffect, useRef } from "react";
import type { Terms } from "@/lib/terms";
import { href, type Lang } from "@/lib/i18n";
import { CarArt } from "../CarArt";

// «Условия»: пять условий большими плитками (bento) и крупные карточки тарифов.
// Тексты пунктов — дословно со старого сайта; цифры, флаги и документы — их же содержимое, разложенное в картинку.
// Плитки поворачиваются за курсором, под курсором — блик; внутренние анимации запускаются при появлении на экране.

const T = {
  ru: { from: "от", day: "₽/сутки", models: "моделей", more: "Смотреть машины" },
  en: { from: "from", day: "₽/day", models: "models", more: "See the cars" },
};

// флаги стран в порядке перечисления на сайте: РФ, РБ, Кыргызстан, Казахстан, Южная Осетия, Абхазия
const FLAGS = ["ru", "by", "kg", "kz", "os", "ab"];

const num = (s: string) => Number(s.match(/\d+/)?.[0] ?? 0);
// «от 3-х лет» → «лет», «3 years or more» → «years»
const unitAfter = (s: string) => s.match(/\d+(?:-[а-яё]+)?\s+([^\s,.]+)/i)?.[1] ?? "";

function DocIcon({ i }: { i: number }) {
  const p = [
    // права
    <><rect x="3" y="6" width="26" height="18" rx="3" /><circle cx="11" cy="14" r="3.2" /><path d="M6.5 21c1-2.6 2.6-3.6 4.5-3.6s3.5 1 4.5 3.6M18 11h7M18 15h7M18 19h4" /></>,
    // паспорт
    <><rect x="7" y="3" width="18" height="26" rx="2.5" /><circle cx="16" cy="13" r="4.5" /><path d="M11.5 13h9M16 8.5c-1.6 1.4-1.6 7.6 0 9M16 8.5c1.6 1.4 1.6 7.6 0 9M11 23h10" /></>,
    // КИС «АРТ»
    <><path d="M8 3h11l6 6v20H8z" /><path d="M19 3v6h6M12 16l3 3 6-6M12 24h9" /></>,
    // справка
    <><path d="M7 3h18v22l-3-2-3 2-3-2-3 2-3-2-3 2z" /><path d="M11 9h10M11 13h10M11 17h6" /></>,
  ][i % 4];
  return <svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{p}</svg>;
}

export function TermsView({ terms, lang = "ru" }: { terms: Terms; lang?: Lang }) {
  const t = T[lang as keyof typeof T] ?? T.ru;
  const root = useRef<HTMLDivElement>(null);
  const [cit, exp, age, docs, ip] = terms.items;

  useEffect(() => {
    const el = root.current!;
    // внутренние анимации плиток — при появлении на экране
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });
    el.querySelectorAll(".tm-card, .tf-card, .tf-cta").forEach((c) => io.observe(c));
    // поворот за курсором и блик — только мышью и только на полной графике
    const fine = matchMedia("(pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine) return () => io.disconnect();
    const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-fx]"));
    const offs = cards.map((c) => {
      let raf = 0;
      const move = (e: PointerEvent) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const r = c.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width;
          const y = (e.clientY - r.top) / r.height;
          c.style.setProperty("--mx", `${x * 100}%`);
          c.style.setProperty("--my", `${y * 100}%`);
          if (document.documentElement.dataset.gfx !== "basic") {
            c.style.setProperty("--rx", `${(0.5 - y) * 7}deg`);
            c.style.setProperty("--ry", `${(x - 0.5) * 9}deg`);
          }
        });
      };
      const leave = () => { cancelAnimationFrame(raf); c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); };
      c.addEventListener("pointermove", move);
      c.addEventListener("pointerleave", leave);
      return () => { c.removeEventListener("pointermove", move); c.removeEventListener("pointerleave", leave); };
    });
    return () => { io.disconnect(); offs.forEach((f) => f()); };
  }, []);

  const countries = cit ? (cit.text.split(":")[1] ?? "").split(",").map((s) => s.trim()).filter(Boolean) : [];
  const docList = docs ? docs.text.split(/,\s*|\s+и\s+|\s+and\s+/i).map((s) => s.trim()).filter(Boolean) : [];
  const sides = ip ? ip.title.split(/\s+(?:или|or|же|yoki|немесе)\s+/i) : [];
  const expN = exp ? num(exp.text) : 0;
  const ageN = age ? num(age.text) : 0;

  return (
    <div className="tm-root" ref={root}>
      <section className="section tm" aria-label={terms.items.map((i) => i.title).join(", ")}>
        <div className="wrap">
          <div className="tm-grid">
            {cit && (
              <article className="tm-card tm-cit" data-fx>
                <div className="tm-glow" aria-hidden="true" />
                <svg className="tm-globe" viewBox="0 0 200 200" aria-hidden="true">
                  <circle cx="100" cy="100" r="96" />
                  <g className="tm-globe-spin">
                    {[18, 40, 62, 84].map((rx) => <ellipse key={rx} cx="100" cy="100" rx={rx} ry="96" />)}
                  </g>
                  {[-60, -30, 0, 30, 60].map((y) => <ellipse key={y} cx="100" cy={100 + y} rx={Math.sqrt(96 * 96 - y * y)} ry={Math.max(4, 14 - Math.abs(y) / 6)} />)}
                  {countries.map((c, i) => {
                    const [x, y] = [[78, 52], [62, 66], [128, 104], [112, 84], [70, 112], [56, 98]][i % 6];
                    return <g key={c} className="tm-pin" style={{ ["--i" as string]: i }}><circle className="tm-pin-wave" cx={x} cy={y} r="3" /><circle className="tm-pin-dot" cx={x} cy={y} r="2.6" /></g>;
                  })}
                </svg>
                <span className="tm-n mono">01</span>
                <div className="tm-big">
                  <b className="tm-num" data-count={countries.length}>{countries.length}</b>
                  <h3 className="tm-h">{cit.title}</h3>
                </div>
                <ul className="tm-flags">
                  {countries.map((c, i) => (
                    <li key={c} style={{ ["--i" as string]: i }}><i className={`flag flag-${FLAGS[i] ?? "x"}`} aria-hidden="true" />{c}</li>
                  ))}
                </ul>
                <p className="tm-p">{cit.text}</p>
              </article>
            )}
            {exp && (
              <article className="tm-card tm-exp" data-fx>
                <div className="tm-glow" aria-hidden="true" />
                <span className="tm-n mono">02</span>
                <div className="tm-big">
                  <b className="tm-num"><span data-count={expN}>{expN}</span><sup>+</sup></b>
                  <span className="tm-unit">{unitAfter(exp.text)}</span>
                </div>
                <h3 className="tm-h">{exp.title}</h3>
                <div className="tm-years" aria-hidden="true">
                  {Array.from({ length: Math.max(1, Math.min(expN, 6)) }, (_, i) => <i key={i} style={{ ["--i" as string]: i }} />)}
                  <svg className="tm-years-car" viewBox="0 0 40 20"><path d="M3 14c0-2 1-3 3-3.5l5-1 5-5h10c2 0 3 .8 4 2l3 3.5 3 .8c1 .3 1.5 1 1.5 2V15H3z" /><circle cx="11" cy="15.5" r="3" /><circle cx="30" cy="15.5" r="3" /></svg>
                </div>
                <p className="tm-p">{exp.text}</p>
              </article>
            )}
            {age && (
              <article className="tm-card tm-age" data-fx>
                <div className="tm-glow" aria-hidden="true" />
                <span className="tm-n mono">03</span>
                <div className="tm-ring">
                  <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" pathLength="100" /><circle className="tm-ring-on" cx="60" cy="60" r="52" pathLength="100" /></svg>
                  <b className="tm-age-n"><span data-count={ageN}>{ageN}</span><sup>+</sup></b>
                </div>
                <h3 className="tm-h">{age.title}</h3>
                <p className="tm-p">{age.text}</p>
              </article>
            )}
            {docs && (
              <article className="tm-card tm-docs" data-fx>
                <div className="tm-glow" aria-hidden="true" />
                <span className="tm-n mono">04</span>
                <h3 className="tm-h">{docs.title}</h3>
                <ul className="tm-doclist">
                  {docList.map((d, i) => (
                    <li key={d} style={{ ["--i" as string]: i, ["--n" as string]: docList.length }}>
                      <DocIcon i={i} />
                      <span>{d}</span>
                      <svg className="tm-check" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10.5l4 4 8-9" /></svg>
                    </li>
                  ))}
                </ul>
                <p className="tm-p sr-only">{docs.text}</p>
              </article>
            )}
            {ip && (
              <article className="tm-card tm-ip" data-fx>
                <div className="tm-glow" aria-hidden="true" />
                <span className="tm-n mono">05</span>
                <h3 className="tm-h">{ip.title}</h3>
                {sides.length === 2 && (
                  <div className="tm-switch" aria-hidden="true">
                    <span>{sides[0]}</span>
                    <span>{sides[1]}</span>
                    <i />
                  </div>
                )}
                <p className="tm-p">{ip.text}</p>
              </article>
            )}
          </div>
        </div>
      </section>

      {terms.tariffs.length > 0 && (
        <section className="section tf" aria-labelledby="tf-h">
          <div className="tf-band" aria-hidden="true"><div data-skew /></div>
          <div className="wrap">
            <h2 className="display tf-title" id="tf-h" data-split>{terms.title}</h2>
            <div className="tf-grid">
              {terms.tariffs.map((c, i) => (
                <a key={c.href} href={href(c.href, lang)} className={`tf-card tf-${c.cls}`} data-fx style={{ ["--i" as string]: i }}>
                  <div className="tm-glow" aria-hidden="true" />
                  <div className="tf-speed" aria-hidden="true"><i /><i /><i /><i /><i /></div>
                  <div className="tf-head">
                    <span className="tf-k mono">0{i + 1}</span>
                    <span className="tf-count mono">{c.count} {t.models}</span>
                  </div>
                  <b className="tf-name">{c.label}</b>
                  {c.car && (
                    <div className="tf-car">
                      <CarArt slug={c.car.slug} name={c.car.name} sizes="(max-width: 860px) 90vw, 420px" />
                      <i className="tf-beam" aria-hidden="true" />
                    </div>
                  )}
                  <div className="tf-foot">
                    {c.from > 0 && (
                      <p className="tf-price"><span>{t.from}</span> <b>{c.from.toLocaleString("ru-RU")}</b> <span>{t.day}</span></p>
                    )}
                    <span className="tf-go"><span className="tf-go-l">{t.more}</span><span className="tf-arrow" aria-hidden="true">→</span></span>
                  </div>
                </a>
              ))}
            </div>
            {terms.btn && (
              <div className="tf-cta">
                <a className="btn btn-primary tf-btn" href={href(terms.btn.href, lang)} data-magnetic>
                  <span>{terms.btn.label}</span> <span className="arrow">→</span>
                </a>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
