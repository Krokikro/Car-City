"use client";

import { useState } from "react";
import { youtube } from "@/lib/home";
import type { HomeText } from "@/lib/home-text";
import { company } from "@/lib/content";

// Мессенджеры и шортсы YouTube. Видео грузится только по клику (без трекеров до согласия).
export function Media({ t }: { t: HomeText["media"] }) {
  const [play, setPlay] = useState<string | null>(null);
  return (
    <section className="section media" aria-labelledby="media-title">
      <div className="wrap media-grid">
        <div className="media-copy">
          <p className="mono eyebrow">{t.eyebrow}</p>
          <h2 id="media-title" className="display" data-split>{t.title}</h2>
          <div className="messengers" data-reveal-stagger>
            <a href={company.telegram} target="_blank" rel="noopener" className="msg msg-tg"><span>Telegram</span><span className="mono-num">{company.messengerPhone}</span></a>
            <a href={company.whatsapp} target="_blank" rel="noopener" className="msg msg-wa"><span>WhatsApp</span><span className="mono-num">{company.messengerPhone}</span></a>
            <a href={company.max} target="_blank" rel="noopener" className="msg msg-max"><span>MAX</span><span className="mono-num">Car City</span></a>
          </div>
          <a href={company.youtube} target="_blank" rel="noopener" className="yt-link">
            <span className="yt-badge" aria-hidden="true">▶</span>
            <span>{t.youtube}</span>
          </a>
        </div>
        <div className="shorts" data-reveal-stagger>
          {youtube.shorts.map((id, i) => (
            <div key={id} className="short" style={{ ["--i" as string]: i }}>
              {play === id ? (
                <iframe src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1`} title={t.watch} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
              ) : (
                <button type="button" onClick={() => setPlay(id)} aria-label={t.watch}>
                  <img src={`https://i.ytimg.com/vi/${id}/oar2.jpg`} alt="" loading="lazy" onError={(e) => ((e.currentTarget as HTMLImageElement).src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`)} />
                  <span className="short-play" aria-hidden="true">▶</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
