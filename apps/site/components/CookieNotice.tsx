"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { company } from "@/lib/content";
import { splitLang } from "@/lib/i18n";
import { cookieNoticeI18n } from "@/lib/lead/i18n";
import { getConsent, onOpenCookieSettings, setConsent } from "@/lib/lead/consent";

/** Тексты баннера. Русские по умолчанию; формулировки сверить с юристом (PRD 8.2). */
export interface CookieNoticeText {
  title: string;
  text: string;
  policy: string;
  acceptAll: string;
  necessaryOnly: string;
  settings: string;
  save: string;
  necessary: string;
  necessaryNote: string;
  analytics: string;
  analyticsNote: string;
  marketing: string;
  marketingNote: string;
}

export const cookieNoticeRu: CookieNoticeText = {
  title: "Мы используем cookie",
  text: "Необходимые cookie нужны для работы сайта. Аналитику и рекламные cookie включим только с вашего согласия.",
  policy: "Политика обработки данных",
  acceptAll: "Принять все",
  necessaryOnly: "Только необходимые",
  settings: "Настроить",
  save: "Сохранить выбор",
  necessary: "Необходимые",
  necessaryNote: "Работа сайта и форм. Всегда включены.",
  analytics: "Аналитика",
  analyticsNote: "Яндекс Метрика с вебвизором: как пользуются сайтом.",
  marketing: "Маркетинг",
  marketingNote: "Показ нашей рекламы тем, кто уже был на сайте.",
};

// Cookie-баннер с тремя категориями (PRD 8.2, 14.4). До выбора работают только необходимые.
// Открыть заново: openCookieSettings() из lib/lead/consent.
export function CookieNotice({ t: tp, policyUrl = company.privacyUrl }: { t?: Partial<CookieNoticeText>; policyUrl?: string }) {
  const lang = splitLang(usePathname() || "/").lang;
  const t: CookieNoticeText = { ...(cookieNoticeI18n[lang] ?? cookieNoticeRu), ...tp };
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const c = getConsent();
    if (!c) setOpen(true);
    return onOpenCookieSettings(() => {
      const cur = getConsent();
      setAnalytics(Boolean(cur?.analytics));
      setMarketing(Boolean(cur?.marketing));
      setDetails(true);
      setOpen(true);
    });
  }, []);

  if (!open) return null;

  const choose = (a: boolean, m: boolean) => {
    setConsent({ analytics: a, marketing: m });
    setOpen(false);
    setDetails(false);
  };

  return (
    <section className="cookie" role="region" aria-label={t.title}>
      <p className="cookie-title">{t.title}</p>
      <p className="cookie-text">
        {t.text}{" "}
        <a href={policyUrl} target="_blank" rel="noopener">
          {t.policy}
        </a>
      </p>
      {details && (
        <div className="cookie-cats">
          <label className="consent">
            <input type="checkbox" checked disabled />
            <span>
              <b>{t.necessary}</b> — {t.necessaryNote}
            </span>
          </label>
          <label className="consent">
            <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
            <span>
              <b>{t.analytics}</b> — {t.analyticsNote}
            </span>
          </label>
          <label className="consent">
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
            <span>
              <b>{t.marketing}</b> — {t.marketingNote}
            </span>
          </label>
        </div>
      )}
      <div className="cookie-actions">
        {details ? (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => choose(analytics, marketing)}>
            {t.save}
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => choose(true, true)}>
              {t.acceptAll}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => choose(false, false)}>
              {t.necessaryOnly}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDetails(true)}>
              {t.settings}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
