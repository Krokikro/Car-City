"use client";

import { useState } from "react";
import { CarArt } from "../CarArt";
import { carImages } from "@/lib/car-images";
import { asset } from "@/lib/i18n";

// Сцена модели: подиум со световым кольцом. Главный кадр — фото парка из каталога,
// следом три уличных фото той же машины: спереди, сзади и сбоку.
const SHOTS = [
  { key: "front", label: "Спереди" },
  { key: "rear", label: "Сзади" },
  { key: "side", label: "Сбоку" },
] as const;

export function ModelStage({ name, slug }: { name: string; slug: string }) {
  const own = !!carImages[slug];
  const [cur, setCur] = useState(-1); // -1 главное фото, 0..2 уличные
  const pics = own ? SHOTS.map((s) => ({ ...s, big: asset(`/cars/${slug}-${s.key}-1000.webp`), thumb: asset(`/cars/${slug}-${s.key}-480.webp`) })) : [];
  return (
    <div className="mdl-stage" data-reveal>
      <div className="mdl-ring" aria-hidden="true"><i /><i /><i /></div>
      <div className="mdl-podium" aria-hidden="true" />
      <div className={`mdl-visual ${own ? "own-photo" : ""}`}>
        <CarArt slug={slug} name={name} priority lit />
        {pics.map((g, i) => (
          // все три кадра лежат в разметке сразу, поэтому переключение мгновенное и без вспышки главного фото
          // eslint-disable-next-line @next/next/no-img-element
          <img key={g.key} className={`mdl-photo${cur === i ? " on" : ""}`} src={g.big} alt={`${name} — ${g.label.toLowerCase()}`} decoding="async" aria-hidden={cur !== i} />
        ))}
      </div>
      {own && (
        <div className="mdl-thumbs" role="tablist" aria-label="Фото">
          <button type="button" role="tab" aria-selected={cur < 0} aria-label="Главное фото" onClick={() => setCur(-1)} className="mdl-thumb-own">
            <CarArt slug={slug} name="" sizes="92px" />
          </button>
          {pics.map((g, i) => (
            <button key={g.key} type="button" role="tab" aria-selected={cur === i} aria-label={g.label} onClick={() => setCur(i)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.thumb} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
