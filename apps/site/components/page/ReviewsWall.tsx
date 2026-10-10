"use client";

import { useMemo, useState } from "react";

import type { Review } from "@/lib/blocks";
import type { Lang } from "@/lib/i18n";
import { SOURCE_URL } from "@/lib/reviews-src";
import { ui } from "@/lib/ui";

const SRC: Record<string, string> = { "Яндекс.Карты": "Яндекс Карты", "2GIS": "2GIS", Flamp: "Flamp", Yell: "Yell" };
const FIRST = 6;

const T: Record<Lang, { more: (n: number) => string; less: string; all: (s: string) => string; open: string; on: string }> = {
  ru: { more: (n) => `Показать все отзывы (${n})`, less: "Свернуть", all: (s) => `Смотреть все на ${s}`, open: "Открыть на источнике", on: "Смотреть на" },
  en: { more: (n) => `Show all reviews (${n})`, less: "Collapse", all: (s) => `See all on ${s}`, open: "Open at the source", on: "See on" },
  ky: { more: (n) => `Бардык пикирлерди көрсөтүү (${n})`, less: "Жыйноо", all: (s) => `${s} боюнча баарын көрүү`, open: "Булагында ачуу", on: "Көрүү:" },
  kk: { more: (n) => `Барлық пікірді көрсету (${n})`, less: "Жинау", all: (s) => `${s} бойынша барлығын көру`, open: "Көзінде ашу", on: "Көру:" },
  uz: { more: (n) => `Barcha sharhlarni ko‘rsatish (${n})`, less: "Yig‘ish", all: (s) => `${s} da barchasini ko‘rish`, open: "Manbada ochish", on: "Ko‘rish:" },
};

/** Стена отзывов: фильтр по площадке, свёрнута до первых карточек; каждая карточка ведёт на отзыв в источнике */
export function ReviewsWall({ items, lang = "ru" }: { items: Review[]; lang?: Lang }) {
  const t = ui(lang);
  const x = T[lang] ?? T.ru;
  const sources = useMemo(() => [...new Set(items.map((r) => r.source))], [items]);
  const [src, setSrc] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const list = src ? items.filter((r) => r.source === src) : items;
  const shown = open ? list : list.slice(0, FIRST);
  const folded = list.length > FIRST;
  const pick = (s: string | null) => { setSrc(s); setOpen(false); };
  return (
    <section className="section rwall" aria-label={t.reviewsLabel}>
      <div className="wrap">
        <div className="rwall-filters" role="tablist" aria-label={t.source}>
          <button type="button" role="tab" className="pill" aria-selected={!src} onClick={() => pick(null)}>{t.reviewsAll}<span className="pill-count">{items.length}</span></button>
          {sources.map((s) => (
            <button key={s} type="button" role="tab" className="pill" aria-selected={src === s} onClick={() => pick(s)}>
              {SRC[s] ?? s}<span className="pill-count">{items.filter((r) => r.source === s).length}</span>
            </button>
          ))}
        </div>
        <div className={`rwall-grid${folded && !open ? " is-folded" : ""}`} key={src ?? "all"}>
          {shown.map((r, i) => {
            const url = r.url || SOURCE_URL[r.source];
            return (
              <figure key={r.source + r.name + r.date + i} className="rwall-card" style={{ ["--i" as string]: Math.min(i, 12) }}>
                <div className="rwall-top">
                  <span className="rwall-ava" aria-hidden="true">{r.name.trim()[0]}</span>
                  <div>
                    <figcaption>{r.name}</figcaption>
                    <p className="mono">{r.date}</p>
                  </div>
                  <span className="rwall-src mono">{SRC[r.source] ?? r.source}</span>
                </div>
                <p className="rwall-stars" aria-label={t.stars}>★★★★★</p>
                <blockquote>{r.text}</blockquote>
                {url && <a className="rwall-open mono" href={url} target="_blank" rel="noopener noreferrer" aria-label={`${x.open}: ${r.name}`}>{x.open} ↗</a>}
              </figure>
            );
          })}
        </div>
        <div className="rwall-more">
          {folded && (
            <button type="button" className="btn btn-glass btn-lg" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? x.less : x.more(list.length)}</button>
          )}
          {src && SOURCE_URL[src] && (
            <a className="btn btn-primary btn-lg" href={SOURCE_URL[src]} target="_blank" rel="noopener noreferrer">{x.all(SRC[src] ?? src)} <span className="arrow">→</span></a>
          )}
        </div>
        {!src && (
          <p className="rwall-srcs mono">
            {x.on}{" "}
            {sources.filter((s) => SOURCE_URL[s]).map((s) => <a key={s} href={SOURCE_URL[s]} target="_blank" rel="noopener noreferrer">{SRC[s] ?? s} ↗</a>)}
          </p>
        )}
      </div>
    </section>
  );
}
