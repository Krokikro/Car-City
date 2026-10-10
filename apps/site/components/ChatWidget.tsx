"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { company } from "@/lib/content";
import { splitLang } from "@/lib/i18n";
import { SocialIcon } from "./SocialIcons";

// Онлайн-чат. Когда в настройках задан загрузчик виджета Битрикс24 (NEXT_PUBLIC_B24_WIDGET_URL — ссылка вида
// https://cdn-ru.bitrix24.ru/bXXXX/crm/site_button/loader_N_xxxx.js из «Открытые линии → Виджет на сайт»),
// грузим его — он сам рисует кнопку и чат с операторами. Пока его нет, показываем свою кнопку:
// быстрые вопросы и переход в мессенджеры, где отвечают те же менеджеры.
const B24 = process.env.NEXT_PUBLIC_B24_WIDGET_URL;

const T = {
  ru: { open: "Онлайн-чат", title: "Car City на связи", status: "Менеджеры отвечают с 9:00 до 21:00", hi: "Здравствуйте! Подскажем по аренде, выкупу и условиям. Где удобнее продолжить?", quick: ["Хочу арендовать авто", "Интересует выкуп", "Какие документы нужны?"], write: "Написать в мессенджер", call: "Позвонить", lead: "Оставить заявку", close: "Закрыть чат" },
  en: { open: "Live chat", title: "Car City is online", status: "Managers reply 9:00–21:00", hi: "Hi! We’ll help with rent, rent-to-own and terms. Where would you like to continue?", quick: ["I want to rent a car", "Rent-to-own", "What documents do I need?"], write: "Message us", call: "Call", lead: "Leave a request", close: "Close chat" },
};

export function ChatWidget() {
  const { lang } = splitLang(usePathname() || "/");
  const t = T[lang as keyof typeof T] ?? T.ru;
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!B24) { const id = setTimeout(() => setReady(true), 1200); return () => clearTimeout(id); }
    // виджет Битрикс24 грузим, когда страница уже отрисовалась и браузер свободен
    const load = () => {
      if (document.getElementById("b24-loader")) return;
      const s = document.createElement("script");
      s.id = "b24-loader";
      s.async = true;
      s.src = `${B24}?${(Date.now() / 60000) | 0}`;
      document.body.appendChild(s);
    };
    const idle = (window as unknown as { requestIdleCallback?: (f: () => void) => number }).requestIdleCallback;
    const h = idle ? idle(load) : window.setTimeout(load, 2500);
    return () => { if (!idle) clearTimeout(h); };
  }, []);

  if (B24) return null;
  const tel = company.phones[0];
  const text = encodeURIComponent(pick ?? t.quick[0]);
  return (
    <div className={`chat${open ? " is-open" : ""}${ready ? " is-ready" : ""}`}>
      {open && (
        <div className="chat-panel" role="dialog" aria-label={t.open}>
          <div className="chat-head">
            <span className="chat-ava" aria-hidden="true">CC</span>
            <div>
              <b>{t.title}</b>
              <span className="chat-status"><i />{t.status}</span>
            </div>
            <button type="button" className="chat-x" aria-label={t.close} onClick={() => setOpen(false)}>×</button>
          </div>
          <div className="chat-body">
            <p className="chat-msg">{t.hi}</p>
            <div className="chat-quick">
              {t.quick.map((q) => (
                <button key={q} type="button" aria-pressed={pick === q} onClick={() => setPick(q)}>{q}</button>
              ))}
            </div>
            {pick && <p className="chat-msg chat-me">{pick}</p>}
          </div>
          <div className="chat-foot">
            <p className="mono">{t.write}</p>
            <div className="chat-msgrs">
              <a href={`${company.whatsapp}${company.whatsapp.includes("?") ? "&" : "?"}text=${text}`} target="_blank" rel="noopener"><SocialIcon kind="whatsapp" size={36} />WhatsApp</a>
              <a href={company.telegram} target="_blank" rel="noopener"><SocialIcon kind="telegram" size={36} />Telegram</a>
              <a href={company.max} target="_blank" rel="noopener"><SocialIcon kind="max" size={36} />MAX</a>
            </div>
            <div className="chat-actions">
              <a className="btn btn-ghost btn-sm" href={`tel:${tel.replace(/[^\d+]/g, "")}`}>{t.call}</a>
              <a className="btn btn-primary btn-sm" href="#zayavka" onClick={() => setOpen(false)}>{t.lead}</a>
            </div>
          </div>
        </div>
      )}
      <button type="button" className="chat-btn" aria-expanded={open} aria-label={t.open} onClick={() => setOpen(!open)}>
        {open ? (
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z" fill="currentColor" /><circle cx="9" cy="9.5" r="1.2" fill="#111" /><circle cx="12" cy="9.5" r="1.2" fill="#111" /><circle cx="15" cy="9.5" r="1.2" fill="#111" /></svg>
        )}
        {!open && <span className="chat-dot" aria-hidden="true" />}
      </button>
    </div>
  );
}
