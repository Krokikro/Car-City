"use client";
// Статья: просмотры, «Поделиться» и комментарии читателей (E-E-A-T, правка 06.11.2026).
import { useEffect, useRef, useState } from "react";

type L = "ru" | "en";
const T = {
  ru: {
    views: "Просмотры", share: "Поделиться", copy: "Скопировать ссылку", copied: "Ссылка скопирована",
    cT: "Комментарии", empty: "Пока нет комментариев — будьте первым.", name: "Ваше имя", text: "Комментарий",
    send: "Отправить", sending: "Отправляем…", done: "Спасибо! Комментарий появится после проверки модератором.",
    err: "Не получилось отправить. Попробуйте ещё раз чуть позже.", errName: "Укажите имя", errText: "Напишите комментарий", rule: "Комментарии публикуются после проверки. Не оставляйте в тексте телефон и личные данные.",
  },
  en: {
    views: "Views", share: "Share", copy: "Copy link", copied: "Link copied",
    cT: "Comments", empty: "No comments yet — be the first.", name: "Your name", text: "Comment",
    send: "Send", sending: "Sending…", done: "Thank you! Your comment will appear after moderation.",
    err: "Could not send. Please try again later.", errName: "Enter your name", errText: "Write a comment", rule: "Comments are published after moderation. Please do not include phone numbers or personal data.",
  },
};
const tr = (lang: string) => T[(lang === "en" ? "en" : "ru") as L];

/** Счётчик просмотров: +1 один раз за сессию браузера, потом показывает текущее число */
export function ArticleViews({ path, lang }: { path: string; lang: string }) {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    const key = `cc-view:${path}`;
    let seen = false;
    try { seen = sessionStorage.getItem(key) === "1"; sessionStorage.setItem(key, "1"); } catch {}
    const req = seen
      ? fetch(`/api/article?path=${encodeURIComponent(path)}`)
      : fetch("/api/article", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ op: "view", path }) });
    req.then((r) => r.json()).then((j: { views?: number | null }) => { if (typeof j.views === "number" && j.views > 0) setN(j.views); }).catch(() => {});
  }, [path]);
  if (n === null) return null;
  return <div><dt>{tr(lang).views}</dt><dd>{n.toLocaleString("ru-RU")}</dd></div>;
}

const ICONS: Record<string, string> = {
  telegram: "M21.5 4.5 2.9 11.7c-1.3.5-1.3 1.2-.2 1.6l4.8 1.5 1.8 5.6c.2.6.1.9.8.9.5 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.7c.3-1.3-.5-1.9-1.5-1.4zM8.6 14.4l9.6-6c.5-.3.9-.1.5.2l-8.2 7.4-.3 3.4z",
  whatsapp: "M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3zm4.9 12.6c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .1-3.2-.8-2.7-1.1-4.4-3.9-4.5-4-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.4l.8 2c.1.2.1.4 0 .5l-.4.6-.3.4c-.1.1-.3.3-.1.6.2.3.8 1.4 1.8 2.2 1.2 1.1 2.2 1.4 2.5 1.6.3.1.5.1.7-.1l.9-1.1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z",
  vk: "M3 7.5c.1 5.4 3 9 7.9 9h.3v-3.1c1.8.2 3.1 1.5 3.7 3.1h2.6a7.6 7.6 0 0 0-3.9-4.9c1.3-.8 3.1-2.6 3.5-4.1h-2.4c-.5 1.7-2 3.3-3.5 3.5V7.5H8.8v6c-1.5-.4-3.4-2.1-3.5-6z",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
};

/** Кнопки «Поделиться»: на телефоне — системное меню, плюс Telegram, WhatsApp, ВКонтакте и копирование ссылки */
export function ArticleShare({ url, title, lang }: { url: string; title: string; lang: string }) {
  const t = tr(lang);
  const [copied, setCopied] = useState(false);
  const [native, setNative] = useState(false);
  useEffect(() => { setNative(typeof navigator !== "undefined" && typeof navigator.share === "function"); }, []);
  const u = encodeURIComponent(url), tt = encodeURIComponent(title);
  const links: [string, string, string][] = [
    ["telegram", "Telegram", `https://t.me/share/url?url=${u}&text=${tt}`],
    ["whatsapp", "WhatsApp", `https://wa.me/?text=${tt}%20${u}`],
    ["vk", "ВКонтакте", `https://vk.com/share.php?url=${u}&title=${tt}`],
  ];
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch {}
  };
  return (
    <div className="art-share" role="group" aria-label={t.share}>
      <span className="mono">{t.share}</span>
      {native && (
        <button type="button" className="art-share-b" onClick={() => navigator.share({ title, url }).catch(() => {})} aria-label={t.share}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 14v5h14v-5" /></svg>
        </button>
      )}
      {links.map(([k, name, h]) => (
        <a key={k} className={`art-share-b is-${k}`} href={h} target="_blank" rel="noopener nofollow" aria-label={name} title={name}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d={ICONS[k]} /></svg>
        </a>
      ))}
      <button type="button" className="art-share-b" onClick={copy} aria-label={t.copy} title={t.copy}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d={ICONS.link} /></svg>
      </button>
      {copied && <span className="art-share-ok small" role="status">{t.copied}</span>}
    </div>
  );
}

export interface CommentItem { id: string; name: string; text: string; at: string }

/** Комментарии: опубликованные (с сервера) + форма; новый комментарий уходит на модерацию */
export function ArticleComments({ path, lang, items }: { path: string; lang: string; items: CommentItem[] }) {
  const t = tr(lang);
  const started = useRef(Date.now());
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = useState("");
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(lang === "en" ? "en-GB" : "ru-RU", { day: "numeric", month: "long", year: "numeric" });
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim(), text = String(fd.get("text") ?? "").trim();
    if (name.length < 2) { setErr(t.errName); setState("error"); return; }
    if (text.length < 5) { setErr(t.errText); setState("error"); return; }
    setState("sending"); setErr("");
    try {
      const r = await fetch("/api/article", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ op: "comment", path, lang, name, text, company_site: String(fd.get("company_site") ?? ""), fill_ms: Date.now() - started.current }) });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean };
      if (!r.ok || !j.ok) throw new Error();
      setState("done");
    } catch { setErr(t.err); setState("error"); }
  }
  return (
    <section className="art-comments" aria-labelledby="art-comments-t">
      <h2 id="art-comments-t" className="art-comments-t">{t.cT}{items.length > 0 && <span className="mono"> {items.length}</span>}</h2>
      {items.length === 0 ? <p className="muted">{t.empty}</p> : (
        <ol className="art-comments-list">
          {items.map((c) => (
            <li key={c.id}>
              <p className="art-comment-h"><b>{c.name}</b> <time className="mono" dateTime={c.at}>{fmt(c.at)}</time></p>
              <p className="art-comment-x">{c.text}</p>
            </li>
          ))}
        </ol>
      )}
      {state === "done" ? <p className="art-comments-ok" role="status">{t.done}</p> : (
        <form className="art-comments-form" onSubmit={onSubmit} noValidate>
          <label className="art-f"><span className="small muted">{t.name}</span><input name="name" maxLength={60} autoComplete="name" required /></label>
          <label className="art-f"><span className="small muted">{t.text}</span><textarea name="text" maxLength={2000} rows={4} required /></label>
          <label className="hp" aria-hidden="true">Website<input name="company_site" tabIndex={-1} autoComplete="off" /></label>
          <p className="small muted">{t.rule}</p>
          {state === "error" && err && <p className="art-comments-err small" role="alert">{err}</p>}
          <button className="btn btn-primary" type="submit" disabled={state === "sending"}>{state === "sending" ? t.sending : t.send}</button>
        </form>
      )}
    </section>
  );
}
