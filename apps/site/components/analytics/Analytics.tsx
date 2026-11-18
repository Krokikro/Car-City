"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { captureTouch } from "@/lib/lead/attribution";
import { getConsent, onConsent } from "@/lib/lead/consent";
import { ymId } from "@/lib/lead/metrika";

// Источник визита и Яндекс Метрика (PRD 7.2, 8.3, 14.4).
// Метки входа запоминаются всегда (это необходимые данные заявки, в cookie не пишутся).
// Метрика с вебвизором стартует только после согласия на аналитику и после первой отрисовки.
export function Analytics() {
  const pathname = usePathname();
  const [on, setOn] = useState(false);
  const prevUrl = useRef<string | null>(null);
  // номер сайта (только цифры) и номер, который выдал колтрекинг Mango
  const mango = useRef<{ to?: string; text?: string }>({});

  const [ga, setGa] = useState<{ ga?: string; gtm?: string; mango?: string }>({});
  useEffect(() => {
    captureTouch();
    const YM_ID = ymId();
    const d = document.documentElement.dataset;
    const gaId = d.ga || "", gtmId = d.gtm || "", mangoId = d.mango || "";
    if (!YM_ID && !gaId && !gtmId && !mangoId) return;
    const enable = () => {
      if (gaId || gtmId || mangoId) setGa({ ga: gaId || undefined, gtm: gtmId || undefined, mango: mangoId || undefined });
      // Метрика подключается кодом в <head> (app/(site)/layout.tsx) для всех посетителей, без ожидания согласия
      prevUrl.current = location.href;
      setOn(true);
    };
    if (getConsent()?.analytics) enable();
    return onConsent((c) => {
      if (c.analytics) enable();
    });
  }, []);

  // Переходы внутри сайта без перезагрузки — отдельный просмотр в Метрике
  useEffect(() => {
    if (!window.ym) return;
    const url = location.href;
    if (prevUrl.current && prevUrl.current !== url) window.ym(ymId(), "hit", url, { referer: prevUrl.current, title: document.title });
    prevUrl.current = url;
  }, [pathname]);

  // Колтрекинг Mango подменяет номер только в тексте при загрузке. Здесь подмена доводится до всех ссылок tel:
  // (кнопки «Позвонить» без номера в тексте) и повторяется после переходов по сайту без перезагрузки.
  useEffect(() => {
    if (!on || !ga.mango) return;
    const digits = (s: string | null | undefined) => (s ?? "").replace(/\D/g, "");
    // номер сайта берём из разметки (data-tel), а подменный — из первой ссылки, где Mango уже поменял номер
    const base = digits(document.documentElement.dataset.tel);
    const sync = () => {
      if (base.length < 10) return;
      const links = [...document.querySelectorAll<HTMLAnchorElement>('a[href^="tel:"]')];
      if (!mango.current.to) {
        const sw = links.find((a) => { const h = digits(a.getAttribute("href")); return h.length >= 10 && h !== base && digits(a.textContent) === h; });
        if (sw) mango.current = { to: sw.getAttribute("href") ?? undefined, text: sw.textContent?.trim() };
      }
      const { to, text } = mango.current;
      if (!to) return;
      for (const a of links) {
        if (digits(a.getAttribute("href")) !== base) continue;
        a.setAttribute("href", to);
        if (text && digits(a.textContent) === base) a.textContent = text;
      }
    };
    const timers = [300, 1000, 2000, 4000, 7000, 12000, 20000].map((ms) => window.setTimeout(sync, ms));
    return () => timers.forEach(clearTimeout);
  }, [on, ga.mango, pathname]);

  if (!on) return null;
  return (
    <>
      {/* Google Analytics и Tag Manager — тоже только после согласия на аналитику (номера — в админке, SEO → Счётчики) */}
      {ga.ga && <Script id="ga-tag" src={`https://www.googletagmanager.com/gtag/js?id=${ga.ga}`} strategy="lazyOnload" />}
      {ga.ga && <Script id="ga-init" strategy="lazyOnload">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config',${JSON.stringify(ga.ga)});`}</Script>}
      {/* Mango Office: динамический колтрекинг — подменяет телефон на сайте на номер из пула (виджет со старого сайта) */}
      {ga.mango && <Script id="mango-ct" src={`https://widgets.mango-office.ru/site/${ga.mango}`} strategy="afterInteractive" />}
      {ga.gtm && <Script id="gtm-init" strategy="lazyOnload">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${JSON.stringify(ga.gtm)});`}</Script>}
    </>
  );
}
