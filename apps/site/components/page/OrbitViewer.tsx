"use client";

import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/i18n";

// Облёт машины камерой. По умолчанию камера медленно и бесконечно кружит вокруг машины.
// Пока страницу листают — облёт на паузе. Потянуть мышью или пальцем — повернуть машину вручную;
// отпустить — ракурс остаётся на месте, кнопка «Облёт» запускает вращение снова.
export function OrbitViewer({ slug, name }: { slug: string; name: string }) {
  const box = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const [auto, setAuto] = useState(true);
  const [drag, setDrag] = useState(false);
  const autoRef = useRef(true);
  autoRef.current = auto;

  useEffect(() => {
    const v = vid.current!;
    v.playbackRate = 0.75;
    let visible = false;
    let scrollT: ReturnType<typeof setTimeout> | undefined;
    const tryPlay = () => { if (autoRef.current && visible && !document.hidden) v.play().catch(() => {}); };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) tryPlay(); else v.pause(); }, { threshold: 0.25 });
    io.observe(box.current!);
    // листают страницу — облёт стоит; через секунду тишины продолжается
    const onScroll = () => {
      if (!autoRef.current) return;
      v.pause();
      clearTimeout(scrollT);
      scrollT = setTimeout(tryPlay, 900);
    };
    addEventListener("scroll", onScroll, { passive: true });
    return () => { io.disconnect(); removeEventListener("scroll", onScroll); clearTimeout(scrollT); };
  }, []);

  useEffect(() => {
    const v = vid.current!;
    if (auto) { v.playbackRate = 0.75; v.play().catch(() => {}); } else v.pause();
  }, [auto]);

  // ручное вращение: ширина кадра = полный оборот
  const start = useRef<{ x: number; t: number } | null>(null);
  const seek = (frac: number) => {
    const v = vid.current!;
    if (!v.duration) return;
    const f = ((frac % 1) + 1) % 1;
    v.currentTime = f * (v.duration - 0.05);
  };
  const onDown = (e: React.PointerEvent) => {
    const v = vid.current!;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setAuto(false);
    setDrag(true);
    start.current = { x: e.clientX, t: v.duration ? v.currentTime / v.duration : 0 };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!start.current || !box.current) return;
    const w = box.current.clientWidth;
    // тянем вправо — камера идёт вправо вокруг машины
    seek(start.current.t - (e.clientX - start.current.x) / (w * 1.15));
  };
  const onUp = () => { start.current = null; setDrag(false); };

  return (
    <div className={`orbit${drag ? " is-drag" : ""}${auto ? " is-auto" : ""}`} ref={box}>
      <video
        ref={vid}
        className="orbit-video"
        src={asset(`/orbit/${slug}.mp4`)}
        poster={asset(`/orbit/${slug}.webp`)}
        muted
        loop
        playsInline
        autoPlay
        preload="auto"
        aria-label={`${name}: облёт 360°`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
      <div className="orbit-ui">
        <span className="orbit-badge mono"><i aria-hidden="true" />360°</span>
        <span className="orbit-hint">{auto ? "Потяните, чтобы повернуть" : "Ракурс зафиксирован"}</span>
        <button type="button" className="orbit-btn" onClick={() => setAuto(!auto)} aria-pressed={auto}>
          {auto ? (
            <><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h3v14H8zM13 5h3v14h-3z" fill="currentColor" /></svg>Стоп</>
          ) : (
            <><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>Облёт</>
          )}
        </button>
      </div>
    </div>
  );
}
