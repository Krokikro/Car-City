"use client";

import { useState } from "react";
import { CarArt } from "../CarArt";

// Сцена модели: подиум со световым кольцом. Пока своих фото нет, показываем галерею со старого сайта,
// а если она не загрузилась — аккуратный силуэт.
export function ModelStage({ name, slug, gallery }: { name: string; slug: string; gallery: string[] }) {
  const [ok, setOk] = useState<Record<string, boolean>>({});
  const [cur, setCur] = useState(0);
  const pics = gallery.filter((g) => ok[g] !== false);
  const main = pics[cur] ?? pics[0];
  return (
    <div className="mdl-stage" data-reveal>
      <div className="mdl-ring" aria-hidden="true"><i /><i /><i /></div>
      <div className="mdl-podium" aria-hidden="true" />
      <div className={`mdl-visual ${main && ok[main] ? "has-photo" : ""}`}>
        <CarArt slug={slug} name={name} priority />
        {main && (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={main} className="mdl-photo" src={main} alt={name} onLoad={() => setOk((o) => ({ ...o, [main]: true }))} onError={() => setOk((o) => ({ ...o, [main]: false }))} />
        )}
      </div>
      {pics.length > 1 && Object.values(ok).some(Boolean) && (
        <div className="mdl-thumbs" role="tablist" aria-label="Фото">
          {pics.map((g, i) => (
            <button key={g} type="button" role="tab" aria-selected={g === main} onClick={() => setCur(i)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g} alt="" loading="lazy" onLoad={() => setOk((o) => ({ ...o, [g]: true }))} onError={() => setOk((o) => ({ ...o, [g]: false }))} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
