"use client";

import { useState } from "react";
import { CarArt } from "../CarArt";
import { carImages } from "@/lib/car-images";
import { orbits } from "@/lib/orbits";
import { realGallery } from "@/lib/gallery-real";
import { OrbitViewer } from "./OrbitViewer";

// Сцена модели: подиум со световым кольцом. Пока своих фото нет, показываем галерею со старого сайта,
// а если она не загрузилась — аккуратный силуэт.
export function ModelStage({ name, slug, gallery }: { name: string; slug: string; gallery: string[] }) {
  const [ok, setOk] = useState<Record<string, boolean>>({});
  const own = !!carImages[slug];
  // своё фото парка — главный кадр; фото со старого сайта идут следом миниатюрами
  const [cur, setCur] = useState(own ? -1 : 0);
  // только настоящие фото со старого сайта, без рендеров и сгенерированных картинок
  const pics = gallery.filter((g) => realGallery.has(g.replace(/^https?:\/\/(www\.)?car-city\.pro/, "")) && ok[g] !== false);
  const main = cur < 0 ? undefined : pics[cur] ?? (own ? undefined : pics[0]);
  const spin = cur < 0 && orbits.has(slug);
  return (
    <div className="mdl-stage" data-reveal>
      <div className="mdl-ring" aria-hidden="true"><i /><i /><i /></div>
      <div className="mdl-podium" aria-hidden="true" />
      <div className={`mdl-visual ${main && ok[main] ? "has-photo" : own ? "own-photo" : ""}${spin ? " has-orbit" : ""}`}>
        {spin ? <OrbitViewer slug={slug} name={name} /> : <CarArt slug={slug} name={name} priority />}
        {main && (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={main} className="mdl-photo" src={main} alt={name} onLoad={() => setOk((o) => ({ ...o, [main]: true }))} onError={() => setOk((o) => ({ ...o, [main]: false }))} />
        )}
      </div>
      {pics.length + (own ? 1 : 0) > 1 && (own || Object.values(ok).some(Boolean)) && (
        <div className="mdl-thumbs" role="tablist" aria-label="Фото">
          {own && (
            <button type="button" role="tab" aria-selected={cur < 0} onClick={() => setCur(-1)} className="mdl-thumb-own">
              <CarArt slug={slug} name="" sizes="92px" />
            </button>
          )}
          {pics.map((g, i) => (
            <button key={g} type="button" role="tab" aria-selected={cur >= 0 && g === main} onClick={() => setCur(i)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g} alt="" loading="lazy" onLoad={() => setOk((o) => ({ ...o, [g]: true }))} onError={() => setOk((o) => ({ ...o, [g]: false }))} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
