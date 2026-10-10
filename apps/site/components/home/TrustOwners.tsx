"use client";

import { useEffect, useRef, useState } from "react";
import { asset, type Lang } from "@/lib/i18n";

type Owner = { name: string; car: string; photo?: number; story?: string };

const L: Record<Lang, { title: (n: string) => string; story: (n: string, c: string) => string; cta: string; close: string; more: string }> = {
  ru: {
    title: (n) => `${n} выкупил(а) авто`,
    story: (n, c) => `${n} уже выкупил у нас ${c}. Как и у каждого нашего клиента, на машину был отдельный договор выкупа, а в работе — отпуск 14 дней в год, комиссия парка 3% и возможность работать в любом парке.`,
    cta: "Хочу так же — выкупить авто",
    close: "Закрыть",
    more: "Открыть историю",
  },
  en: {
    title: (n) => `${n} bought a car`,
    story: (n, c) => `${n} has already bought a ${c} from us. Like every client, there was a separate buyout contract for the car, 14 days of vacation a year, a 3% fleet fee and the freedom to work in any fleet.`,
    cta: "I want the same — buy a car",
    close: "Close",
    more: "Open story",
  },
  ky: {
    title: (n) => `${n} унааны сатып алды`,
    story: (n, c) => `${n} бизден ${c} унаасын сатып алды. Ар бир кардарыбыздай, унаага өзүнчө келишим түзүлдү, жылына 14 күн эс алуу жана парктын 3% комиссиясы бар.`,
    cta: "Мен да ушундай — унаа сатып алгым келет",
    close: "Жабуу",
    more: "Окуяны ачуу",
  },
  kk: {
    title: (n) => `${n} көлікті сатып алды`,
    story: (n, c) => `${n} бізден ${c} көлігін сатып алды. Әр клиентіміз сияқты, көлікке жеке келісімшарт жасалды, жылына 14 күн демалыс және парктің 3% комиссиясы бар.`,
    cta: "Мен де осылай — көлік сатып алғым келеді",
    close: "Жабу",
    more: "Әңгімені ашу",
  },
  uz: {
    title: (n) => `${n} avtomobil sotib oldi`,
    story: (n, c) => `${n} bizdan ${c} avtomobilini sotib oldi. Har bir mijozimiz kabi, mashinaga alohida shartnoma tuzildi, yiliga 14 kun ta’til va parkning 3% komissiyasi bor.`,
    cta: "Men ham shunday — avtomobil sotib olmoqchiman",
    close: "Yopish",
    more: "Hikoyani ochish",
  },
};

/** Бегущая строка «Нам доверяют»: клик по выкупнику открывает фото и короткую историю */
export function TrustOwners({ owners, lang, label }: { owners: Owner[]; lang: Lang; label: string }) {
  const [cur, setCur] = useState<Owner | null>(null);
  const t = L[lang] ?? L.ru;
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
      {cur && (
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
        </div>
      )}
    </>
  );
}
