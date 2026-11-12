"use client";
// Одно место графики на сайте: превью, рекомендованный размер и формат, загрузка замены с прогрессом, возврат исходной.
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export interface SlotProps {
  k: string; kind: "image" | "video"; label: string; rec: string; preview: string; replaced: boolean; accept: string; canWrite: boolean;
  info?: string; compact?: boolean; extra?: React.ReactNode;
}

export function upload(body: FormData, onProgress: (p: number) => void): Promise<{ ok: boolean; error?: string; notes?: string[] }> {
  return new Promise((resolve) => {
    const x = new XMLHttpRequest();
    x.open("POST", "/admin/api/graphics");
    x.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    x.onload = () => { try { resolve(JSON.parse(x.responseText)); } catch { resolve({ ok: false, error: `Ошибка сервера (${x.status})` }); } };
    x.onerror = () => resolve({ ok: false, error: "Нет связи с сервером" });
    x.send(body);
  });
}
export async function graphicsOp(body: Record<string, string>) {
  const r = await fetch("/admin/api/graphics", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return (await r.json().catch(() => ({ ok: false, error: "Ошибка сервера" }))) as { ok: boolean; error?: string };
}

export function GraphicSlot(p: SlotProps) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ t: "ok" | "e"; s: string } | null>(null);
  async function pick(f: File) {
    setMsg(null); setBusy(0);
    const fd = new FormData();
    fd.set("op", "replace"); fd.set("key", p.k); fd.set("kind", p.kind); fd.set("file", f);
    const r = await upload(fd, setBusy);
    setBusy(null);
    if (!r.ok) setMsg({ t: "e", s: r.error || "Не загружено" });
    else { setMsg({ t: "ok", s: ["Заменено, уже на сайте", ...(r.notes ?? [])].join(". ") }); router.refresh(); }
  }
  async function reset() {
    if (!confirm("Вернуть исходную картинку из файлов сайта?")) return;
    setBusy(0);
    const r = await graphicsOp({ op: "reset", key: p.k, kind: p.kind });
    setBusy(null);
    if (!r.ok) setMsg({ t: "e", s: r.error || "Не получилось" }); else { setMsg({ t: "ok", s: "Возвращена исходная" }); router.refresh(); }
  }
  return (
    <div className={`pnl-slot${p.compact ? " compact" : ""}${p.replaced ? " is-replaced" : ""}`}>
      <div className="pnl-slot-prev">
        {p.kind === "video"
          ? <video src={p.preview} muted playsInline preload="metadata" controls />
          // eslint-disable-next-line @next/next/no-img-element
          : <img src={p.preview} alt="" loading="lazy" decoding="async" />}
        {p.replaced && <em className="st st-issued">заменено</em>}
      </div>
      <div className="pnl-slot-body">
        <b>{p.label}</b>
        <small className="pnl-slot-rec">{p.rec}</small>
        {p.info && <small className="pnl-muted">{p.info}</small>}
        {msg && <small className={msg.t === "e" ? "pnl-danger" : "pnl-ok-text"}>{msg.s}</small>}
        {busy !== null && <span className="pnl-progress"><i style={{ width: `${busy}%` }} /></span>}
        {p.canWrite && (
          <div className="pnl-slot-btns">
            <input ref={input} type="file" accept={p.accept} hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void pick(f); }} />
            <button type="button" className="pnl-btn pnl-btn-sm" disabled={busy !== null} onClick={() => input.current?.click()}>{busy !== null ? `Загрузка ${busy}%` : "Заменить"}</button>
            {p.replaced && <button type="button" className="pnl-btn pnl-btn-sm" disabled={busy !== null} onClick={reset}>Вернуть исходную</button>}
            {p.extra}
          </div>
        )}
      </div>
    </div>
  );
}
