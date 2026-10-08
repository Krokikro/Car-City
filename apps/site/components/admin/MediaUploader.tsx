"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function MediaUploader() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [over, setOver] = useState(false);

  async function send(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    setBusy(true);
    setMsg("");
    const fd = new FormData();
    list.forEach((f) => fd.append("file", f));
    try {
      const r = await fetch("/admin/api/upload", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) setMsg(j.error || "Не получилось загрузить");
      else setMsg(`Загружено: ${j.done.length}${j.failed.length ? `. Не принято: ${j.failed.join(", ")} (нужны JPG, PNG или WebP до 12 МБ)` : ""}`);
      router.refresh();
    } catch {
      setMsg("Нет связи с сервером");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div
      className={`ad-drop${over ? " over" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); send(e.dataTransfer.files); }}
    >
      <p><b>{busy ? "Загружаю…" : "Перетащите картинки сюда"}</b></p>
      <p className="ad-muted">JPG, PNG или WebP до 12 МБ. Мы сожмём их в WebP не шире 2400 px.</p>
      <button type="button" className="ad-btn ad-btn-main" disabled={busy} onClick={() => input.current?.click()}>Выбрать файлы</button>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={(e) => e.target.files && send(e.target.files)} />
      {msg && <p role="status">{msg}</p>}
    </div>
  );
}

export function CopyButton({ text, label = "Копировать адрес" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="ad-btn ad-btn-sm" onClick={async () => { try { await navigator.clipboard.writeText(text.startsWith("/") ? location.origin + text : text); setDone(true); setTimeout(() => setDone(false), 1500); } catch { prompt("Скопируйте адрес", text); } }}>
      {done ? "Скопировано" : label}
    </button>
  );
}
