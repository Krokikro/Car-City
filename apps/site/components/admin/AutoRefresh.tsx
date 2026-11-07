"use client";
// Тихо обновляет данные страницы (серверные компоненты) раз в N секунд, пока вкладка открыта.
import { useRouter } from "next/navigation";
import { useEffect } from "react";
export function AutoRefresh({ seconds = 20 }: { seconds?: number }) {
  const r = useRouter();
  useEffect(() => {
    const t = window.setInterval(() => { if (!document.hidden && !document.activeElement?.closest("form")) r.refresh(); }, seconds * 1000);
    return () => window.clearInterval(t);
  }, [r, seconds]);
  return null;
}
