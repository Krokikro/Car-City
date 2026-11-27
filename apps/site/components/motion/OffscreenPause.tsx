"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Экономим кадры: блоки за пределами экрана не крутят свои CSS-анимации, а фоновые видео в шапках
// играют только пока их видно. Иначе при прокрутке браузер перерисовывает десятки бегущих эффектов.
export function OffscreenPause() {
  const path = usePathname();
  useEffect(() => {
    const blocks = Array.from(document.querySelectorAll<HTMLElement>("main > section, main > div, footer"));
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => (e.target as HTMLElement).toggleAttribute("data-off", !e.isIntersecting)),
      { rootMargin: "150px 0px" },
    );
    blocks.forEach((b) => io.observe(b));
    const vids = Array.from(document.querySelectorAll<HTMLVideoElement>("video[autoplay]"));
    const vio = new IntersectionObserver(
      (es) => es.forEach((e) => { const v = e.target as HTMLVideoElement; if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }),
      { threshold: 0.02 },
    );
    vids.forEach((v) => vio.observe(v));
    return () => { io.disconnect(); vio.disconnect(); };
  }, [path]);
  return null;
}
