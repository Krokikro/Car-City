"use client";
// Окно со ссылкой на Telegram-бота Car City (правка 06.11.2026).
// Появляется через 25 секунд или после прокрутки половины страницы; закрыли — не показываем 7 дней.
// Ссылка — в админке (Тексты сайта → Контакты → «Ссылка на Telegram-бота»); пока она пустая, окна нет.
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { company } from "@/lib/content";
import { splitLang } from "@/lib/i18n";
import { SocialIcon } from "./SocialIcons";

const KEY = "cc-tgbot-closed";
const WEEK = 7 * 24 * 3600 * 1000;
const T: Record<string, { title: string; text: string; btn: string; close: string }> = {
  ru: { title: "Наш бот в Telegram", text: "Подберёт машину, рассчитает аренду или выкуп и запишет в офис — в любое время суток.", btn: "Открыть бота", close: "Закрыть" },
  en: { title: "Our Telegram bot", text: "Picks a car, calculates rent or rent-to-own and books an office visit — any time of day.", btn: "Open the bot", close: "Close" },
};

export function TgBotPromo() {
  const path = usePathname() || "/";
  const { lang } = splitLang(path);
  const t = T[lang] ?? T.ru;
  const link = company.telegramBot;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!link || path.startsWith("/admin") || path.startsWith("/spasibo")) return;
    try { const at = Number(localStorage.getItem(KEY) || 0); if (Date.now() - at < WEEK) return; } catch {}
    let done = false;
    const show = () => { if (!done) { done = true; setOpen(true); cleanup(); } };
    const onScroll = () => { const h = document.documentElement; if (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight) > 0.5) show(); };
    const timer = window.setTimeout(show, 25000);
    window.addEventListener("scroll", onScroll, { passive: true });
    const cleanup = () => { window.clearTimeout(timer); window.removeEventListener("scroll", onScroll); };
    return cleanup;
  }, [link, path]);

  if (!open || !link) return null;
  const close = () => { setOpen(false); try { localStorage.setItem(KEY, String(Date.now())); } catch {} };
  return (
    <aside className="tgbot" role="dialog" aria-label={t.title}>
      <button type="button" className="tgbot-x" aria-label={t.close} onClick={close}>×</button>
      <span className="tgbot-ico" aria-hidden="true"><SocialIcon kind="telegram" size={40} /></span>
      <div className="tgbot-copy">
        <b>{t.title}</b>
        <p>{t.text}</p>
        <a className="btn btn-primary btn-sm" href={link} target="_blank" rel="noopener" onClick={close}>{t.btn} <span className="arrow">→</span></a>
      </div>
    </aside>
  );
}
