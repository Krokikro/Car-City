"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { asset, type Lang } from "@/lib/i18n";
import { patched } from "@/lib/texts";
import { OWNERS_X } from "@/lib/text-defaults";

type Owner = { name: string; car: string; photo?: number; story?: string };

// Тексты окна истории выкупщика; {name} — имя, {car} — машина. Правятся в админке (Тексты → Главная).


/** Бегущая строка «Нам доверяют»: клик по выкупнику открывает фото и короткую историю */
export function TrustOwners({ owners, lang, label }: { owners: Owner[]; lang: Lang; label: string }) {
  const [cur, setCur] = useState<Owner | null>(null);
  const t0 = patched("owners-x", lang, OWNERS_X[lang] ?? OWNERS_X.ru);
  const fill = (s: string, o: Owner) => s.replace(/\{name\}/g, o.name).replace(/\{car\}/g, o.car);
  const t = { ...t0, title: (n: string) => fill(t0.title, { name: n, car: "" }), story: (n: string, c: string) => fill(t0.story, { name: n, car: c }) };
  const row = [...owners, ...owners];
  const last = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!cur) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setCur(null); };
    document.addEventListener("keydown", onKey);
    return () => { document.documentElement.style.overflow = prev; document.removeEventListener("keydown", onKey); last.current?.focus(); };
  }, [cur]);

  return (
    <>
      <div className="owners" aria-label={label}>
        <div className="owners-row">
          {row.map((o, i) => (
            <button
              key={i}
              type="button"
              className="owner"
              aria-hidden={i >= owners.length || undefined}
              tabIndex={i >= owners.length ? -1 : 0}
              aria-label={`${o.name}, ${o.car}. ${t.more}`}
              onClick={(e) => { last.current = e.currentTarget; setCur(o); }}
            >
              {o.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="owner-ph owner-img" src={asset(`/owners/${o.photo}.webp`)} alt="" width={96} height={96} loading="lazy" decoding="async" />
              ) : (
                <span className="owner-ph" aria-hidden="true">{o.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
              )}
              <span className="owner-cap"><strong>{o.name}</strong><span>{o.car}</span></span>
            </button>
          ))}
        </div>
      </div>
      {cur && typeof document !== "undefined" && createPortal(
        <div className="lead-modal" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setCur(null); }}>
          <div className="lead-modal-box owner-modal" role="dialog" aria-modal="true" aria-labelledby="owner-title">
            <button type="button" className="lead-modal-x" aria-label={t.close} onClick={() => setCur(null)}>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
            {cur.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="owner-modal-ph" src={asset(`/owners/${cur.photo}.webp`)} alt={cur.name} width={500} height={500} decoding="async" />
            )}
            <p className="mono eyebrow">{cur.car}</p>
            <h2 id="owner-title" className="h2">{t.title(cur.name)}</h2>
            <p className="muted lead-modal-text">{cur.story || t.story(cur.name, cur.car)}</p>
            <button type="button" className="btn btn-primary btn-lg" data-lead="buyout" onClick={() => setCur(null)}>{t.cta}</button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
