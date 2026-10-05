"use client";

import { useMemo, useState } from "react";

import type { Review } from "@/lib/blocks";

const SRC: Record<string, string> = { "Яндекс.Карты": "Яндекс Карты", "2GIS": "2GIS", Flamp: "Flamp", Yell: "Yell" };

/** Стена отзывов: 42 отзыва со страницы /reviews, фильтр по площадке */
export function ReviewsWall({ items }: { items: Review[] }) {
  const sources = useMemo(() => [...new Set(items.map((r) => r.source))], [items]);
  const [src, setSrc] = useState<string | null>(null);
  const list = src ? items.filter((r) => r.source === src) : items;
  return (
    <section className="section rwall" aria-label="Отзывы водителей">
      <div className="wrap">
        <div className="rwall-filters" role="tablist" aria-label="Площадка">
          <button type="button" role="tab" className="pill" aria-selected={!src} onClick={() => setSrc(null)}>Все<span className="pill-count">{items.length}</span></button>
          {sources.map((s) => (
            <button key={s} type="button" role="tab" className="pill" aria-selected={src === s} onClick={() => setSrc(s)}>
              {SRC[s] ?? s}<span className="pill-count">{items.filter((r) => r.source === s).length}</span>
            </button>
          ))}
        </div>
        <div className="rwall-grid" key={src ?? "all"}>
          {list.map((r, i) => (
            <figure key={r.name + r.date} className="rwall-card" style={{ ["--i" as string]: Math.min(i, 12) }}>
              <div className="rwall-top">
                <span className="rwall-ava" aria-hidden="true">{r.name.trim()[0]}</span>
                <div>
                  <figcaption>{r.name}</figcaption>
                  <p className="mono">{r.date}</p>
                </div>
                <span className="rwall-src mono">{SRC[r.source] ?? r.source}</span>
              </div>
              <p className="rwall-stars" aria-label="Оценка 5 из 5">★★★★★</p>
              <blockquote>{r.text}</blockquote>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
