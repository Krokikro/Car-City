"use client";
// Переписка в разделе «Чаты»: подгружает новые сообщения раз в 4 секунды, отправляет ответ менеджера.
import { useEffect, useRef, useState } from "react";

interface Msg { id: string; at: string; dir: "in" | "out" | "sys"; text: string; author: string | null; error: string | null }
const T = new Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Moscow", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export function ChatThread({ id, initial, canWrite, channel }: { id: string; initial: Msg[]; canWrite: boolean; channel: string }) {
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const last = useRef(initial.length ? Number(initial[initial.length - 1].id) : 0);

  useEffect(() => { box.current?.scrollTo({ top: 1e7 }); }, [msgs.length]);
  useEffect(() => {
    const tick = async () => {
      if (document.hidden) return;
      try {
        const r = await fetch(`/admin/api/chats/${id}?after=${last.current}`, { cache: "no-store" });
        const j = (await r.json()) as { messages?: Msg[] };
        const fresh = (j.messages ?? []).filter((m) => Number(m.id) > last.current);
        if (fresh.length) { last.current = Number(fresh[fresh.length - 1].id); setMsgs((m) => [...m, ...fresh]); }
      } catch { /* сеть */ }
    };
    const t = window.setInterval(tick, 4000);
    return () => window.clearInterval(t);
  }, [id]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const v = text.trim();
    if (!v || busy) return;
    setBusy(true); setErr("");
    try {
      const r = await fetch(`/admin/api/chats/${id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: v }) });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string | null };
      if (!r.ok || !j.ok) throw new Error(j.error || "Не отправлено");
      if (j.error) setErr(`Сохранено, но не доставлено: ${j.error}`);
      setText("");
      const g = await fetch(`/admin/api/chats/${id}?after=${last.current}`, { cache: "no-store" }).then((x) => x.json() as Promise<{ messages?: Msg[] }>);
      const fresh = (g.messages ?? []).filter((m) => Number(m.id) > last.current);
      if (fresh.length) { last.current = Number(fresh[fresh.length - 1].id); setMsgs((m) => [...m, ...fresh]); }
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Не отправлено");
    } finally { setBusy(false); }
  }

  return (
    <div className="pnl-thread">
      <div className="pnl-thread-msgs" ref={box}>
        {msgs.length === 0 && <p className="pnl-muted">Сообщений пока нет.</p>}
        {msgs.map((m) => m.dir === "sys" ? (
          <p key={m.id} className="pnl-msg-sys">{m.text} · {T.format(new Date(m.at))}</p>
        ) : (
          <div key={m.id} className={`pnl-bubble ${m.dir === "out" ? "out" : "in"}${m.error ? " err" : ""}`}>
            <p>{m.text}</p>
            <small>{m.dir === "out" ? (m.author || "Менеджер") + " · " : ""}{T.format(new Date(m.at))}{m.error ? ` · не доставлено: ${m.error}` : ""}</small>
          </div>
        ))}
      </div>
      {canWrite && (
        <form className="pnl-thread-form" onSubmit={send}>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={channel === "site" ? "Ответ появится у клиента в чате на сайте" : "Ответ уйдёт клиенту в мессенджер"} rows={3} maxLength={4000}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); (e.currentTarget.form as HTMLFormElement).requestSubmit(); } }} />
          <div className="pnl-thread-bar">
            {err ? <span className="pnl-danger">{err}</span> : <span className="pnl-muted">Enter — отправить, Shift+Enter — новая строка</span>}
            <button className="pnl-btn pnl-btn-main" type="submit" disabled={busy || !text.trim()}>{busy ? "Отправляем…" : "Отправить"}</button>
          </div>
        </form>
      )}
    </div>
  );
}
