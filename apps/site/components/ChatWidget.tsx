"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { company } from "@/lib/content";
import { splitLang } from "@/lib/i18n";
import { SocialIcon } from "./SocialIcons";
import { formatPhone, normalizePhone } from "@/lib/lead/phone";
import { getTouches } from "@/lib/lead/attribution";
import { GOALS, getYmClientId, reachGoal } from "@/lib/lead/metrika";
import type { LeadRequest } from "@/lib/lead/types";

// Онлайн-чат. Когда в настройках задан загрузчик виджета Битрикс24 (NEXT_PUBLIC_B24_WIDGET_URL — ссылка вида
// https://cdn-ru.bitrix24.ru/bXXXX/crm/site_button/loader_N_xxxx.js из «Открытые линии → Виджет на сайт»),
// грузим его — он сам рисует кнопку и чат с операторами. Пока его нет, показываем свою кнопку:
// быстрые вопросы и переход в мессенджеры, где отвечают те же менеджеры.
const B24 = process.env.NEXT_PUBLIC_B24_WIDGET_URL;

const T = {
  ru: { open: "Онлайн-чат", title: "Car City на связи", status: "Менеджеры отвечают с 9:00 до 21:00", hi: "Здравствуйте! Подскажем по аренде, выкупу и условиям. Где удобнее продолжить?", quick: ["Хочу арендовать авто", "Интересует выкуп", "Какие документы нужны?"], write: "Написать в мессенджер", call: "Позвонить", lead: "Оставить заявку", close: "Закрыть чат", ph: "Напишите сообщение…", send: "Отправить", ask: "Спасибо! Чтобы менеджер ответил вам, оставьте имя и телефон.", name: "Имя", phone: "Телефон", consent: "Согласен на обработку персональных данных", go: "Отправить менеджеру", sending: "Отправляем…", done: "Приняли! Менеджер свяжется с вами по этому номеру. Можно написать ещё, мы всё увидим.", err: "Не получилось отправить. Позвоните нам или напишите в мессенджер.", phoneErr: "Проверьте номер телефона", back: "Сообщение отправлено менеджеру. Что-то добавите?" },
  en: { open: "Live chat", title: "Car City is online", status: "Managers reply 9:00–21:00", hi: "Hi! We’ll help with rent, rent-to-own and terms. Where would you like to continue?", quick: ["I want to rent a car", "Rent-to-own", "What documents do I need?"], write: "Message us", call: "Call", lead: "Leave a request", close: "Close chat", ph: "Write a message…", send: "Send", ask: "Thanks! Leave your name and phone so a manager can reply.", name: "Name", phone: "Phone", consent: "I agree to personal data processing", go: "Send to manager", sending: "Sending…", done: "Received! A manager will contact you on this number. Feel free to write more.", err: "Could not send. Please call us or use a messenger.", phoneErr: "Check the phone number", back: "Your message was sent to a manager. Anything to add?" },
};

export function ChatWidget() {
  const { lang } = splitLang(usePathname() || "/");
  const t = T[lang as keyof typeof T] ?? T.ru;
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  // свои сообщения: пока интеграция с Битрикс и ИИ-агентом не запущена, текст уходит менеджеру как заявка
  const [msgs, setMsgs] = useState<{ me: boolean; text: string }[]>([]);
  const [draft, setDraft] = useState("");
  const [phase, setPhase] = useState<"chat" | "ask" | "sending" | "sent">("chat");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState("");
  const startedAt = useRef(0);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (open && !startedAt.current) startedAt.current = Date.now(); }, [open]);
  useEffect(() => { bodyRef.current?.scrollTo({ top: 1e5, behavior: "smooth" }); }, [msgs, phase]);

  function say(text: string) {
    const v = text.trim();
    if (!v) return;
    const reply = phase === "chat" ? [{ me: false, text: t.ask }] : phase === "sent" ? [{ me: false, text: t.back }] : [];
    setMsgs((m) => [...m, { me: true, text: v.slice(0, 600) }, ...reply]);
    setDraft("");
    if (phase === "chat") setPhase("ask");
    if (phase === "sent") void deliver(v, true);
  }

  async function deliver(text: string, again = false) {
    const normalized = normalizePhone(phone);
    if (!normalized) { setErr(t.phoneErr); return; }
    setErr("");
    if (!again) setPhase("sending");
    const all = again ? text : msgs.filter((m) => m.me).map((m) => m.text).join("\n");
    const body: LeadRequest = {
      name, phone: normalized, consent: agree, source: "chat",
      fill_ms: Math.max(3100, Date.now() - startedAt.current),
      page: location.href.slice(0, 300), lang: lang || "ru",
      extra: { message: all.slice(0, 600) },
      ...getTouches(),
      ym_client_id: await getYmClientId(),
      screen: `${screen.width}x${screen.height}`,
    };
    try {
      const res = await fetch("/api/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (!res.ok || !json.ok) throw new Error("send");
      reachGoal(GOALS.lead, { form: "chat" });
      if (!again) { setMsgs((m) => [...m, { me: false, text: t.done }]); setPhase("sent"); }
    } catch {
      setMsgs((m) => [...m, { me: false, text: t.err }]);
      setPhase(again ? "sent" : "ask");
    }
  }

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
          <div className="chat-body" ref={bodyRef}>
            <p className="chat-msg">{t.hi}</p>
            <div className="chat-quick">
              {t.quick.map((q) => (
                <button key={q} type="button" aria-pressed={pick === q} onClick={() => { setPick(q); say(q); }}>{q}</button>
              ))}
            </div>
            {msgs.map((m, i) => <p key={i} className={`chat-msg${m.me ? " chat-me" : ""}`}>{m.text}</p>)}
            {phase === "ask" && (
              <form className="chat-form" onSubmit={(e) => { e.preventDefault(); void deliver(""); }}>
                <input name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.name} autoComplete="given-name" required minLength={2} maxLength={60} />
                <input name="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder={t.phone} required maxLength={20} />
                <label className="chat-agree"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} required /><span>{t.consent}</span></label>
                {err && <p className="chat-err" role="alert">{err}</p>}
                <button type="submit" className="btn btn-primary btn-sm">{t.go}</button>
              </form>
            )}
            {phase === "sending" && <p className="chat-msg chat-typing">{t.sending}</p>}
          </div>
          <div className="chat-foot">
            <form className="chat-input" onSubmit={(e) => { e.preventDefault(); say(draft); }}>
              <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t.ph} maxLength={600} aria-label={t.ph} disabled={phase === "sending"} />
              <button type="submit" aria-label={t.send} disabled={!draft.trim() || phase === "sending"}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12 20 4l-5 16-3-6.5z" fill="currentColor" /></svg>
              </button>
            </form>
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
