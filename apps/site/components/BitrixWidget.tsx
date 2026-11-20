"use client";

import { useEffect } from "react";

// Виджет Битрикс24 (открытые линии: чат на сайте, WhatsApp, Telegram) вместо нашего чата — правка 19.11.2026.
// Код из Битрикса: CRM → Сайт → Виджет. Внешний вид подогнан под сайт в app/styles/b24.css.
const LOADER = "https://cdn-ru.bitrix24.ru/b25805130/crm/site_button/loader_4_ezbmsv.js";

export function BitrixWidget() {
  useEffect(() => {
    if (document.querySelector(`script[data-b24-loader]`)) return;
    const s = document.createElement("script");
    s.async = true;
    s.src = `${LOADER}?${(Date.now() / 60000) | 0}`;
    s.dataset.b24Loader = "1";
    document.body.appendChild(s);
  }, []);
  return null;
}
