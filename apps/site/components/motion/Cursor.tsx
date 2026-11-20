"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

// Курсор-фара: точка и мягкое жёлтое пятно, растёт над ссылками. Только мышь, не basic.
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!matchMedia("(pointer: fine)").matches || document.documentElement.dataset.gfx === "basic") return;
    document.documentElement.classList.add("has-cursor");
    const dx = gsap.quickTo(dot.current, "x", { duration: 0.12 }), dy = gsap.quickTo(dot.current, "y", { duration: 0.12 });
    const gx = gsap.quickTo(glow.current, "x", { duration: 0.6, ease: "power3" }), gy = gsap.quickTo(glow.current, "y", { duration: 0.6, ease: "power3" });
    const move = (e: PointerEvent) => {
      dx(e.clientX); dy(e.clientY); gx(e.clientX); gy(e.clientY);
      const hot = (e.target as HTMLElement).closest("a, button, [role=tab], summary, input, select, label");
      document.documentElement.classList.toggle("cursor-hot", !!hot);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);
  return (
    <>
      <div ref={glow} className="cursor-glow" aria-hidden="true" />
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
