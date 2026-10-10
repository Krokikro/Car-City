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
  const [ok, setOk] = useState<Record<string, boolean>>({});
  const own = !!carImages[slug];
  const [cur, setCur] = useState(own ? -1 : 0);
  const pics = own ? SHOTS.map((s) => ({ ...s, big: asset(`/cars/${slug}-${s.key}-1000.webp`), thumb: asset(`/cars/${slug}-${s.key}-480.webp`) })) : [];
  const main = cur < 0 ? undefined : pics[cur]?.big;
  return (
    <div className="mdl-stage" data-reveal>
      <div className="mdl-ring" aria-hidden="true"><i /><i /><i /></div>
      <div className="mdl-podium" aria-hidden="true" />
      <div className={`mdl-visual ${main && ok[main] ? "has-photo" : own ? "own-photo" : ""}`}>
        <CarArt slug={slug} name={name} priority />
        {main && (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={main} className="mdl-photo" src={main} alt={`${name} — ${pics[cur].label.toLowerCase()}`} onLoad={() => setOk((o) => ({ ...o, [main]: true }))} onError={() => setOk((o) => ({ ...o, [main]: false }))} />
        )}
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
