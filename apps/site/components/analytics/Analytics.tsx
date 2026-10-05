"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { captureTouch } from "@/lib/lead/attribution";
import { getConsent, onConsent } from "@/lib/lead/consent";
import { YM_ID } from "@/lib/lead/metrika";

// Источник визита и Яндекс Метрика (PRD 7.2, 8.3, 14.4).
// Метки входа запоминаются всегда (это необходимые данные заявки, в cookie не пишутся).
// Метрика с вебвизором стартует только после согласия на аналитику и после первой отрисовки.
export function Analytics() {
  const pathname = usePathname();
  const [on, setOn] = useState(false);
  const prevUrl = useRef<string | null>(null);

  useEffect(() => {
    captureTouch();
    if (!YM_ID) return;
    const enable = () => {
      if (!window.ym) {
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
    if (prevUrl.current && prevUrl.current !== url) window.ym(YM_ID, "hit", url, { referer: prevUrl.current, title: document.title });
    prevUrl.current = url;
  }, [pathname, on]);

  if (!on) return null;
  return <Script id="ym-tag" src="https://mc.yandex.ru/metrika/tag.js" strategy="lazyOnload" />;
}
