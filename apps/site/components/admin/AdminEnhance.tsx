"use client";
// Для всех полей админки с ограничением длины (maxlength) показывает счётчик «N / max» (сколько введено / сколько можно),
// чтобы было видно, сколько символов ещё можно ввести. Кнопки [data-reset] возвращают исходный текст поля.
import { useEffect } from "react";

const len = (s: string) => [...s].length;

function attach(el: HTMLInputElement | HTMLTextAreaElement) {
  if (el.dataset.cc || el.type === "hidden" || el.type === "password" || el.maxLength <= 0) return;
  el.dataset.cc = "1";
  const max = el.maxLength;
  const warn = Number(el.dataset.warn) || 0;
  // место под счётчик рядом с названием поля (data-cc-for), иначе — строка под полем
  const slot = el.name ? document.querySelector<HTMLElement>(`[data-cc-for="${CSS.escape(el.name)}"]`) : null;
  const out = slot ?? document.createElement("small");
  out.classList.add("pnl-cc");
  out.setAttribute("aria-live", "polite");
  if (warn) out.title = `Рекомендуется до ${warn} символов — столько видно в поисковой выдаче`;
  const upd = () => {
    const n = len(el.value);
    out.textContent = `${n} / ${max}`;
    out.classList.toggle("pnl-cc-warn", (warn > 0 && n > warn) || n >= max * 0.9);
    out.classList.toggle("pnl-cc-max", n >= max);
  };
  el.addEventListener("input", upd);
  if (!slot) el.insertAdjacentElement("afterend", out);
  upd();
}

export function AdminEnhance() {
  useEffect(() => {
    const scan = (root: ParentNode) => root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input[maxlength], textarea[maxlength]").forEach(attach);
    scan(document);
    const mo = new MutationObserver(() => scan(document));
    mo.observe(document.body, { childList: true, subtree: true });
    const onClick = (e: MouseEvent) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-reset]");
      if (!b) return;
      const f = b.form?.elements.namedItem(b.dataset.reset!) as HTMLInputElement | null;
      if (!f) return;
      f.value = f.dataset.default ?? "";
      f.dispatchEvent(new Event("input", { bubbles: true }));
      f.focus();
    };
    document.addEventListener("click", onClick);
    return () => { mo.disconnect(); document.removeEventListener("click", onClick); };
  }, []);
  return null;
}
