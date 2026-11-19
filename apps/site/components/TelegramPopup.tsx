"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { company } from "@/lib/content";
import { asset, splitLang } from "@/lib/i18n";
import { reachGoal } from "@/lib/lead/metrika";

// Поп-ап «Больше новостей — в нашем Telegram-канале» (правка 19.11.2026).
// Появляется через 15 секунд на сайте. Закрыли — не показываем 3 дня, перешли в канал — 30 дней.
// Не мешает заполнению формы: если человек печатает, ждём ещё. Ссылка на канал — админка, Контакты → Telegram-канал
// (пусто — поп-апа нет). Картинка с текстом на русском, поэтому только на русской версии сайта.
const KEY = "cc_tgpop";
const DELAY = 15_000;
const DAY = 86_400_000;

function blocked() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null") as { at: number; days: number } | null;
    return !!v && Date.now() - v.at < v.days * DAY;
  } catch { return false; }
}
function remember(days: number) {
  try { localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), days })); } catch { /* приватный режим */ }
}

export function TelegramPopup() {
  const { lang } = splitLang(usePathname() || "/");
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const url = company.telegramChannel;

  useEffect(() => {
    if (lang !== "ru" || !url || blocked()) return;
    let t: ReturnType<typeof setTimeout>;
    const tryOpen = () => {
      const a = document.activeElement;
      const busy = a instanceof HTMLInputElement || a instanceof HTMLTextAreaElement || a instanceof HTMLSelectElement || !!document.querySelector("dialog[open], .lead-modal.is-open, [aria-modal='true']");
      if (busy) { t = setTimeout(tryOpen, 10_000); return; }
      setOpen(true);
      reachGoal("tg_popup_show");
    };
    t = setTimeout(tryOpen, DELAY);
    return () => clearTimeout(t);
    // таймер один на визит: переходы по страницам его не сбрасывают
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() { setOpen(false); remember(3); }
  function go() { setOpen(false); remember(30); reachGoal("tg_popup_click"); }

  if (!open) return null;
  return (
    <div className="tgp" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="tgp-box" role="dialog" aria-modal="true" aria-label="Telegram-канал Car City">
        <a className="tgp-link" href={url} target="_blank" rel="noopener" onClick={go}>
          <picture>
            <source media="(max-width: 600px)" srcSet={asset("/promo/tg-popup-560.webp")} />
            <img src={asset("/promo/tg-popup-1000.webp")} alt="Больше новостей — в нашем Telegram-канале. Подписаться" width={999} height={1009} />
          </picture>
          {/* кнопка «Подписаться» на картинке — подсвечиваем, чтобы было видно, что она нажимается */}
          <span className="tgp-btn" aria-hidden="true" />
        </a>
        <button ref={closeRef} type="button" className="tgp-close" aria-label="Закрыть" onClick={close}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
        </button>
      </div>
    </div>
  );
}
