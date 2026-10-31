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

  const [ga, setGa] = useState<{ ga?: string; gtm?: string }>({});
  useEffect(() => {
    captureTouch();
    const YM_ID = ymId();
    const d = document.documentElement.dataset;
    const gaId = d.ga || "", gtmId = d.gtm || "";
    if (!YM_ID && !gaId && !gtmId) return;
    const enable = () => {
      if (gaId || gtmId) setGa({ ga: gaId || undefined, gtm: gtmId || undefined });
      if (YM_ID && !window.ym) {
        // Очередь вызовов до загрузки tag.js — стандартная заглушка Метрики
        const ym = function (...args: unknown[]) {
          (ym.a = ym.a || []).push(args);
        } as NonNullable<Window["ym"]>;
        ym.l = Date.now();
        window.ym = ym;
        ym(YM_ID, "init", { ssr: true, webvisor: true, clickmap: true, accurateTrackBounce: true, trackLinks: true });
      }
      prevUrl.current = location.href;
      setOn(true);
    };
    if (getConsent()?.analytics) enable();
    return onConsent((c) => {
      if (c.analytics) enable();
      // Отозвали согласие — перезагружаем страницу, чтобы счётчик выгрузился
      else if (window.ym) location.reload();
    });
  }, []);

  // Переходы внутри сайта без перезагрузки — отдельный просмотр в Метрике
  useEffect(() => {
    if (!on || !window.ym) return;
    const url = location.href;
    if (prevUrl.current && prevUrl.current !== url) window.ym(ymId(), "hit", url, { referer: prevUrl.current, title: document.title });
    prevUrl.current = url;
  }, [pathname, on]);

  if (!on) return null;
  return (
    <>
      {ymId() > 0 && <Script id="ym-tag" src="https://mc.yandex.ru/metrika/tag.js" strategy="lazyOnload" />}
      {/* Google Analytics и Tag Manager — тоже только после согласия на аналитику (номера — в админке, SEO → Счётчики) */}
      {ga.ga && <Script id="ga-tag" src={`https://www.googletagmanager.com/gtag/js?id=${ga.ga}`} strategy="lazyOnload" />}
      {ga.ga && <Script id="ga-init" strategy="lazyOnload">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config',${JSON.stringify(ga.ga)});`}</Script>}
      {ga.gtm && <Script id="gtm-init" strategy="lazyOnload">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${JSON.stringify(ga.gtm)});`}</Script>}
    </>
  );
}
