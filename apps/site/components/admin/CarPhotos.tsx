"use client";
// Фото машины в карточке автопарка: фото в каталоге (тёмная и светлая версии), кадры галереи и добавленные фото.
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { GraphicSlot, graphicsOp, upload, type SlotProps } from "./GraphicSlot";

export interface Shot extends Omit<SlotProps, "canWrite" | "compact" | "extra"> { shot: string; hidden: boolean }
export interface Extra { id: string; thumb: string; alt?: string }

export function CarPhotos({ slug, main, shots, extras, canWrite }: { slug: string; main: Omit<SlotProps, "canWrite" | "compact">[]; shots: Shot[]; extras: Extra[]; canWrite: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [err, setErr] = useState("");
  async function op(body: Record<string, string>) {
    setErr("");
    const r = await graphicsOp({ slug, ...body });
    if (!r.ok) setErr(r.error || "Не получилось"); else router.refresh();
  }
  async function add(f: File) {
    setErr(""); setBusy(0);
    const fd = new FormData();
    fd.set("op", "extra"); fd.set("slug", slug); fd.set("file", f);
    const r = await upload(fd, setBusy);
    setBusy(null);
    if (!r.ok) setErr(r.error || "Не загружено"); else router.refresh();
  }
  return (
    <details className="pnl-carphotos">
      <summary>Фотографии <span className="pnl-muted">· в каталоге, галерея {shots.filter((s) => !s.hidden).length + extras.length} фото</span></summary>
      <div className="pnl-slots compact">
        {main.map((m) => <GraphicSlot key={m.k} {...m} compact canWrite={canWrite} />)}
        {shots.map((s) => (
          <div key={s.k} className={s.hidden ? "pnl-slot-hidden" : ""}>
            <GraphicSlot {...s} compact canWrite={canWrite && !s.hidden} label={`${s.label}${s.hidden ? " — убрано из галереи" : ""}`}
              extra={<button type="button" className="pnl-btn pnl-btn-sm" onClick={() => op({ op: "hide", shot: s.shot })}>Убрать</button>} />
            {s.hidden && canWrite && <button type="button" className="pnl-link-btn" onClick={() => op({ op: "show", shot: s.shot })}>Вернуть в галерею</button>}
          </div>
        ))}
        {extras.map((x, i) => (
          <div key={x.id} className="pnl-slot compact">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div className="pnl-slot-prev"><img src={x.thumb} alt="" loading="lazy" /></div>
            <div className="pnl-slot-body"><b>{x.alt || `Добавленное фото ${i + 1}`}</b><small className="pnl-slot-rec">1000 × 664 px, нарезано автоматически</small>
              {canWrite && <div className="pnl-slot-btns"><button type="button" className="pnl-btn pnl-btn-sm pnl-btn-warn" onClick={() => { if (confirm("Удалить это фото из галереи?")) void op({ op: "remove-extra", id: x.id }); }}>Удалить</button></div>}
            </div>
          </div>
        ))}
        {canWrite && (
          <button type="button" className="pnl-slot-add" disabled={busy !== null} onClick={() => input.current?.click()}>
            <b>{busy !== null ? `Загрузка ${busy}%` : "+ Добавить фото"}</b>
            <small>в галерею на странице модели · JPG, PNG, WebP от 1000 px в ширину, пропорции 3:2</small>
          </button>
        )}
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void add(f); }} />
      </div>
      {err && <p className="pnl-danger">{err}</p>}
    </details>
  );
}
