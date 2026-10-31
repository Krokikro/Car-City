"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { fleet as baseFleet, fleetClasses, popularOf, type FleetCar } from "@/lib/fleet";
import { saleChips, hasRent, hasBuy } from "@/lib/prices";
import { SaleChips } from "../SaleChips";
import type { CarClass } from "@/lib/content";
import { CarArt } from "../CarArt";
import { asset, href, type Lang } from "@/lib/i18n";
import type { HomeText } from "@/lib/home-text";

const MORE: Record<string, { all: string; less: string; popular: string; popularShort: string; allCls: string; models: string }> = {
  ru: { all: "Смотреть весь автопарк", less: "Свернуть", popular: "Популярные модели из каждого класса", popularShort: "Популярные", allCls: "Все", models: "моделей" },
  en: { all: "See the whole fleet", less: "Show less", popular: "Popular models from every class", popularShort: "Popular", allCls: "All", models: "models" },
};

function Price({ label, price, old, t }: { label?: string; price: number; old?: number; t: HomeText["fleet"] }) {
  return (
    <p className="ft-pr">
      {label && <span className="ft-pl">{label}</span>}
      <span className="ft-pv">
        <span className="ft-main"><span className="ft-from">{t.from}</span> <b>{price.toLocaleString("ru-RU")}&nbsp;₽</b></span>
        <span className="ft-sub">
          {old && old > price && <s className="ft-old">{old.toLocaleString("ru-RU")}&nbsp;₽</s>}
          <span className="ft-per">{t.perDay}</span>
        </span>
      </span>
    </p>
  );
}

/** Плитка машины — как на странице выкупа: фото целиком, класс, заметные характеристики, цена, две кнопки */
export function FleetTile({ m, t, lang, i = 0, priority = false }: { m: FleetCar; t: HomeText["fleet"]; lang: Lang; i?: number; priority?: boolean }) {
  const rent = hasRent(m), buy = hasBuy(m);
  const link = href(rent ? m.rent : m.buy, lang);
  const chips = saleChips(m, lang);
  const sale = false && chips.length > 0;
  // доступна только аренда или только выкуп: цена одна и без подписи, кнопка тоже одна
  const single = !(rent && buy);
  return (
    <article className={`ft${sale ? " has-sale" : ""}`} style={{ ["--i" as string]: i }}>
      <a className="ft-media" href={link} aria-label={m.name}>
        <CarArt slug={m.slug} name={m.name} priority={priority} lit sizes="(max-width: 640px) 92vw, (max-width: 1100px) 46vw, 340px" />
        <span className={`ft-cls ft-cls-${m.cls}`}>{t.classes[m.cls] ?? m.cls}</span>
        <SaleChips chips={chips} />
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
        <div className="ft-prices">
          {single ? <Price price={rent ? m.price : (m.buyPrice ?? m.price)} old={rent ? m.old : m.buyOld} t={t} /> : (
            <>
              <Price label={t.priceRent} price={m.price} old={m.old} t={t} />
              <Price label={t.priceBuy} price={m.buyPrice ?? m.price} old={m.buyOld} t={t} />
            </>
          )}
        </div>
        {sale && <SaleChips chips={chips} mobile />}
        <div className="ft-actions">
          {/* акцент — на выкупе: жёлтая «Выкупить», «Арендовать» второстепенная */}
          {rent && <a className={`btn ${buy ? "btn-ghost" : "btn-primary"} btn-sm`} href={href(m.rent, lang)}>{t.rent}</a>}
          {buy && <a className="btn btn-primary btn-sm" href={href(m.buy, lang)}>{t.buy}</a>}
        </div>
      </div>
    </article>
  );
}

type PromoText = { orderTitle: string; orderText: string; orderBtn: string; friendTitle: [string, string, string]; friendText: string; friendNote: string; friendBtn: string; copied: string; shareText: string; upTo: string };
const PROMO: Record<string, PromoText> = {
  ru: {
    orderTitle: "Не устраивает авто из наличия?", orderText: "Приобретём автомобиль на заказ под ваши пожелания", orderBtn: "Выкупить",
    friendTitle: ["Получай ", "бонус", " за каждого друга"], friendText: "Количество выплат на одного человека не ограничено", friendNote: "*действует на аренду и выкуп",
    friendBtn: "Поделиться ссылкой", copied: "Ссылка скопирована", shareText: "Car City — аренда и выкуп авто для такси в Москве", upTo: "до",
  },
  en: {
    orderTitle: "Nothing suitable in stock?", orderText: "We will buy a car to order for your needs", orderBtn: "Buy out",
    friendTitle: ["Get a ", "bonus", " for every friend"], friendText: "No limit on the number of payouts per person", friendNote: "*valid for rental and rent-to-own",
    friendBtn: "Share the link", copied: "Link copied", shareText: "Car City — taxi car rental and rent-to-own in Moscow", upTo: "up to",
  },
};

/** Промо-карточки внутри каталога: «авто под заказ» и «бонус за друга» (реальные программы Car City) */
function PromoTile({ kind, lang, i }: { kind: "order" | "friend"; lang: Lang; i: number }) {
  const p = PROMO[lang] ?? PROMO.ru;
  const [copied, setCopied] = useState(false);
  if (kind === "order")
    return (
      <article className="ft ft-promo ft-promo-order" style={{ ["--i" as string]: i }}>
        <div className="ft-promo-media" aria-hidden="true"><img src={asset("/promo/order-car.webp")} alt="" loading="lazy" /></div>
        <div className="ft-promo-body">
          <h3>{p.orderTitle}</h3>
          <p>{p.orderText}</p>
          <a className="btn btn-primary btn-sm" href="#zayavka" data-lead="buyout">{p.orderBtn}</a>
        </div>
      </article>
    );
  async function share() {
    const url = window.location.origin + href("/", lang);
    try {
      if (navigator.share) { await navigator.share({ title: "Car City", text: p.shareText, url }); return; }
      await navigator.clipboard.writeText(url);
      setCopied(true); setTimeout(() => setCopied(false), 2400);
    } catch { /* пользователь закрыл окно «Поделиться» */ }
  }
  return (
    <article className="ft ft-promo ft-promo-friend" style={{ ["--i" as string]: i }}>
      <div className="ft-promo-bg" aria-hidden="true"><img src={asset("/promo/friend-bonus.webp")} alt="" loading="lazy" /></div>
      <div className="ft-promo-body">
        <h3>{p.friendTitle[0]}<em>{p.friendTitle[1]}</em>{p.friendTitle[2]}<sup>*</sup></h3>
        <p>{p.friendText}</p>
        <p className="ft-promo-sum"><small>{p.upTo}</small>15&nbsp;000&nbsp;₽</p>
        <p className="ft-promo-note">{p.friendNote}</p>
        <button type="button" className="btn btn-primary btn-sm" onClick={share}>{copied ? p.copied : p.friendBtn}</button>
      </div>
    </article>
  );
}

type View = "popular" | "all" | CarClass;

// Автопарк на главной: фильтр классов виден сразу. «Популярные» — по две модели из каждого класса,
// класс — только его машины, «Все» — весь парк по порядку классов. Между машинами — две промо-карточки.
export function FleetGrid({ t, lang, cars }: { t: HomeText["fleet"]; lang: Lang; cars?: FleetCar[] }) {
  const fleet = cars ?? baseFleet;
  const m = MORE[lang] ?? MORE.ru;
  const [view, setView] = useState<View>("popular");
  const sec = useRef<HTMLElement>(null);
  // Когда автопарк раскрывается или сворачивается, высота страницы меняется: блоки ниже, которые прикрепляются
  // к экрану при прокрутке («3 шага»), должны пересчитать своё место, иначе они наезжают на машины.
  useEffect(() => {
    const el = sec.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let t: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => ScrollTrigger.refresh(), 120); });
    ro.observe(el);
    return () => { clearTimeout(t); ro.disconnect(); };
  }, []);
  const popular = popularOf(fleet);
  const order = (a: FleetCar, b: FleetCar) => fleetClasses.findIndex((c) => c.id === a.cls) - fleetClasses.findIndex((c) => c.id === b.cls);
  const shown = view === "popular" ? popular : view === "all" ? [...fleet].sort(order) : fleet.filter((f) => f.cls === view);
  const classes = fleetClasses.filter((c) => fleet.some((f) => f.cls === c.id));
  const pills: { id: View; name: string; n?: number }[] = [
    { id: "popular", name: m.popularShort },
    ...classes.map((c) => ({ id: c.id as View, name: t.classes[c.id] ?? c.name, n: fleet.filter((f) => f.cls === c.id).length })),
    { id: "all", name: m.allCls, n: fleet.length },
  ];
  // промо-карточки: после 4-й машины и ближе к концу; в отдельном классе — одна, «под заказ», в конце
  const items: ({ car: FleetCar } | { promo: "order" | "friend" })[] = shown.map((car) => ({ car }));
  if (view === "popular" || view === "all") {
    items.splice(Math.min(4, items.length), 0, { promo: "order" });
    items.splice(Math.min(9, items.length), 0, { promo: "friend" });
  } else items.push({ promo: "order" });

  return (
    <section ref={sec} className="section fg" id="avtopark" aria-labelledby="fleet-title">
      <div className="wrap">
        <div className="fg-head">
          <div>
            <h2 id="fleet-title" className="display" data-split>{t.title}</h2>
          </div>
        </div>
        <div className="fg-filter" role="group" aria-label={t.classLabel}>
          {pills.map((c) => (
            <button key={c.id} type="button" className="pill" aria-pressed={view === c.id} onClick={() => setView(c.id)}>
              {c.name}
              {c.n !== undefined && <span className="pill-count">{c.n}</span>}
            </button>
          ))}
        </div>
        <div className="ft-grid" key={view}>
          {items.map((it, i) => "car" in it
            ? <FleetTile key={it.car.slug} m={it.car} t={t} lang={lang} i={i} priority={i < 4} />
            : <PromoTile key={it.promo} kind={it.promo} lang={lang} i={i} />)}
          {view === "popular" && (
            <button type="button" className="ft ft-more" onClick={() => setView("all")} style={{ ["--i" as string]: items.length }}>
              <span className="ft-more-n">{fleet.length}</span>
              <span className="ft-more-t">{m.all}</span>
              <span className="ft-more-arrow" aria-hidden="true">→</span>
            </button>
          )}
        </div>
        {view === "all" && (
          <div className="fg-foot">
            <button type="button" className="btn btn-ghost" onClick={() => { setView("popular"); document.getElementById("avtopark")?.scrollIntoView({ behavior: "smooth" }); }}>{m.less}</button>
          </div>
        )}
      </div>
    </section>
  );
}
