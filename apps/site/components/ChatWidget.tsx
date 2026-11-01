"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { company } from "@/lib/content";
import { splitLang } from "@/lib/i18n";
import { SocialIcon } from "./SocialIcons";
import { formatPhone, normalizePhone } from "@/lib/lead/phone";
import { getTouches } from "@/lib/lead/attribution";
import { GOALS, getYmClientId, reachGoal } from "@/lib/lead/metrika";

// Онлайн-чат. Когда в настройках задан загрузчик виджета Битрикс24 (NEXT_PUBLIC_B24_WIDGET_URL — ссылка вида
// https://cdn-ru.bitrix24.ru/bXXXX/crm/site_button/loader_N_xxxx.js из «Открытые линии → Виджет на сайт»),
// грузим его — он сам рисует кнопку и чат с операторами. Пока его нет, показываем свою кнопку:
// быстрые вопросы и переход в мессенджеры, где отвечают те же менеджеры.
const B24 = process.env.NEXT_PUBLIC_B24_WIDGET_URL;

const T = {
  ru: { open: "Онлайн-чат", title: "Car City на связи", status: "Менеджеры отвечают с 9:00 до 21:00", hi: "Здравствуйте! Подскажем по аренде, выкупу и условиям. Где удобнее продолжить?", quick: ["Хочу арендовать авто", "Интересует выкуп", "Какие документы нужны?"], write: "Написать в мессенджер", call: "Позвонить", lead: "Оставить заявку", close: "Закрыть чат", ph: "Напишите сообщение…", send: "Отправить", ask: "Менеджер ответит здесь. Оставьте телефон, если удобнее, чтобы перезвонили.", leave: "Оставить телефон для звонка", later: "Не сейчас", name: "Имя", phone: "Телефон", consent: "Согласен на обработку персональных данных", go: "Отправить менеджеру", sending: "Отправляем…", done: "Спасибо! Менеджер свяжется с вами. Можно писать сюда — ответим в этом чате.", err: "Не получилось отправить. Позвоните нам или напишите в мессенджер.", phoneErr: "Проверьте номер телефона", back: "Сообщение отправлено менеджеру. Что-то добавите?" },
  en: { open: "Live chat", title: "Car City is online", status: "Managers reply 9:00–21:00", hi: "Hi! We’ll help with rent, rent-to-own and terms. Where would you like to continue?", quick: ["I want to rent a car", "Rent-to-own", "What documents do I need?"], write: "Message us", call: "Call", lead: "Leave a request", close: "Close chat", ph: "Write a message…", send: "Send", ask: "A manager will reply here. Leave your phone if you prefer a call back.", leave: "Leave a phone for a call back", later: "Not now", name: "Name", phone: "Phone", consent: "I agree to personal data processing", go: "Send to manager", sending: "Sending…", done: "Thanks! A manager will contact you. You can keep writing here.", err: "Could not send. Please call us or use a messenger.", phoneErr: "Check the phone number", back: "Your message was sent to a manager. Anything to add?" },
};

type Msg = { id?: number; me: boolean; text: string; pending?: boolean; failed?: boolean };

export function ChatWidget() {
  const { lang } = splitLang(usePathname() || "/");
  const t = T[lang as keyof typeof T] ?? T.ru;
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  // переписка с менеджером: сообщения уходят сразу в раздел «Чаты» админки, ответы приходят сюда
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [hasChat, setHasChat] = useState(false);
  const [contact, setContact] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [phase, setPhase] = useState<"idle" | "sending">("idle");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState("");
  const lastId = useRef(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => { bodyRef.current?.scrollTo({ top: 1e5, behavior: "smooth" }); }, [msgs, askOpen]);

  // новые сообщения с сервера (ответы менеджера и свои — с другой страницы)
  async function pull() {
    try {
      const r = await fetch(`/api/chat?after=${lastId.current}`, { cache: "no-store" });
      const j = (await r.json()) as { messages?: { id: number; me: boolean; text: string }[]; contact?: boolean };
      if (j.contact) setContact(true);
      const fresh = (j.messages ?? []).filter((m) => m.id > lastId.current);
      if (!fresh.length) return;
      setHasChat(true);
      lastId.current = fresh[fresh.length - 1].id;
      setMsgs((cur) => {
        const known = new Set(cur.map((m) => m.id).filter(Boolean));
        const add = fresh.filter((m) => !known.has(m.id));
        // свои отправленные (без id) заменяем серверными
        const pendingMine = cur.filter((m) => !m.id && m.me);
        const kept = cur.filter((m) => m.id || !m.me || !add.some((a) => a.me && a.text === m.text));
        return pendingMine.length ? [...kept, ...add] : [...cur, ...add];
      });
      if (!openRef.current) setUnread((u) => u + fresh.filter((m) => !m.me).length);
    } catch { /* сеть — попробуем позже */ }
  }
  // история при загрузке страницы и опрос: пока чат открыт — каждые 4 с, закрыт — раз в 30 с
  useEffect(() => { void pull(); }, []);
  useEffect(() => {
    if (!hasChat && !open) return;
    const id = window.setInterval(() => { if (!document.hidden) void pull(); }, open ? 4000 : 30000);
    return () => window.clearInterval(id);
  }, [open, hasChat]);
  useEffect(() => { if (open) setUnread(0); }, [open]);

  async function say(text: string) {
    const v = text.trim().slice(0, 2000);
    if (!v || phase === "sending") return;
    setDraft("");
    setMsgs((m) => [...m, { me: true, text: v, pending: true }]);
    setPhase("sending");
    try {
      const body = { text: v, page: location.href.slice(0, 300), lang: lang || "ru", ...getTouches(), ym_client_id: await getYmClientId() };
      const r = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; id?: number; contact?: boolean };
      if (!r.ok || !j.ok) throw new Error("send");
      if (!hasChat) reachGoal(GOALS.lead, { form: "chat" });
      setHasChat(true);
      if (j.contact) setContact(true);
      setMsgs((m) => m.map((x) => (x.pending && x.text === v ? { me: true, text: v, id: j.id } : x)));
      if (j.id && j.id > lastId.current) lastId.current = j.id;
      if (!j.contact && !contact) setAskOpen(true);
    } catch {
      setMsgs((m) => m.map((x) => (x.pending && x.text === v ? { ...x, pending: false, failed: true } : x)));
    } finally {
      setPhase("idle");
    }
  }

  async function sendContact() {
    const normalized = normalizePhone(phone);
    if (!normalized) { setErr(t.phoneErr); return; }
    setErr("");
    setPhase("sending");
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, phone: normalized, consent: agree }) });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean };
      if (!r.ok || !j.ok) throw new Error("send");
      setContact(true);
      setAskOpen(false);
      setMsgs((m) => [...m, { me: false, text: t.done }]);
    } catch {
      setErr(t.err);
    } finally {
      setPhase("idle");
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
                <button key={q} type="button" aria-pressed={pick === q} onClick={() => { setPick(q); void say(q); }}>{q}</button>
              ))}
            </div>
            {msgs.map((m, i) => <p key={m.id ?? `p${i}`} className={`chat-msg${m.me ? " chat-me" : ""}${m.pending ? " is-pending" : ""}${m.failed ? " is-failed" : ""}`}>{m.text}{m.failed && <small> — {t.err}</small>}</p>)}
            {hasChat && !contact && !askOpen && <button type="button" className="chat-link" onClick={() => setAskOpen(true)}>{t.leave}</button>}
            {askOpen && !contact && (
              <form className="chat-form" onSubmit={(e) => { e.preventDefault(); void sendContact(); }}>
                <p className="chat-msg">{t.ask}</p>
                <input name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.name} autoComplete="given-name" maxLength={60} />
                <input name="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder={t.phone} required maxLength={20} />
                <label className="chat-agree"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} required /><span>{t.consent}</span></label>
                {err && <p className="chat-err" role="alert">{err}</p>}
                <div className="chat-form-btns"><button type="submit" className="btn btn-primary btn-sm" disabled={phase === "sending"}>{t.go}</button><button type="button" className="btn btn-ghost btn-sm" onClick={() => setAskOpen(false)}>{t.later}</button></div>
              </form>
            )}
          </div>
          <div className="chat-foot">
            <form className="chat-input" onSubmit={(e) => { e.preventDefault(); void say(draft); }}>
              <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t.ph} maxLength={2000} aria-label={t.ph} />
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
        {!open && (unread > 0 ? <span className="chat-dot chat-count" aria-label={`${unread}`}>{unread}</span> : <span className="chat-dot" aria-hidden="true" />)}
      </button>
    </div>
  );
}
