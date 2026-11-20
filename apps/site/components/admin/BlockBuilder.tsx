"use client";
// Конструктор блоков страницы (правки SEO-подрядчика 12.11.2026): контент-менеджер сам собирает страницу —
// добавляет готовые блоки, меняет их порядок, скрывает и выбирает оформление. Работает поверх того же текста
// страницы (Markdown): каждый раздел «## Заголовок» — блок, настройки лежат строкой <!-- block … --> под заголовком.
import { useMemo, useState } from "react";

type Style = "" | "accent" | "card" | "center" | "narrow" | "dark";
const STYLES: [Style, string][] = [["", "Обычное"], ["accent", "Акцентный фон"], ["card", "Карточка с рамкой"], ["center", "Текст по центру"], ["narrow", "Узкая колонка"], ["dark", "Тёмная плашка"]];

interface Blk { title: string; hidden: boolean; style: Style; rest: string }

const META = /^[ \t]*<!--\s*block\b([^>]*?)-->[ \t]*\n?/;

function parse(body: string): { intro: string; blocks: Blk[] } {
  const parts = body.split(/^## /m);
  const intro = parts.shift() ?? "";
  const blocks = parts.map((ch) => {
    const nl = ch.indexOf("\n");
    const title = nl < 0 ? ch : ch.slice(0, nl);
    let rest = nl < 0 ? "" : ch.slice(nl + 1);
    const m = rest.match(META);
    let hidden = false;
    let style: Style = "";
    if (m) {
      hidden = /\bhidden\b/.test(m[1]);
      style = (m[1].match(/style=([a-z]+)/)?.[1] ?? "") as Style;
      rest = rest.slice(m[0].length);
    }
    return { title, hidden, style, rest };
  });
  return { intro, blocks };
}

function serialize(intro: string, blocks: Blk[]): string {
  return intro + blocks.map((b) => {
    const meta = b.hidden || b.style ? `<!-- block${b.hidden ? " hidden" : ""}${b.style ? ` style=${b.style}` : ""} -->\n` : "";
    const rest = b.rest.endsWith("\n") || !b.rest ? b.rest : b.rest + "\n";
    return `## ${b.title}\n${meta}${rest}`;
  }).join("");
}

// Готовые блоки: что вставляется в текст страницы
const LIBRARY: { id: string; name: string; hint: string; md: (t: string) => Blk }[] = [
  { id: "text", name: "Текст", hint: "Заголовок и абзацы", md: () => ({ title: "Новый раздел", hidden: false, style: "", rest: "\nТекст раздела.\n\n" }) },
  { id: "list", name: "Список преимуществ", hint: "Пункты списком — на сайте плитками", md: () => ({ title: "Почему с нами выгодно?", hidden: false, style: "", rest: "\n- Первое преимущество\n- Второе преимущество\n- Третье преимущество\n\n" }) },
  { id: "faq", name: "Вопросы и ответы", hint: "Раскрывающиеся вопросы + разметка FAQ для поисковиков", md: () => ({ title: "Частые вопросы", hidden: false, style: "", rest: "\n### Первый вопрос?\nОтвет на вопрос.\n\n### Второй вопрос?\nОтвет на вопрос.\n\n" }) },
  { id: "cta", name: "Призыв с кнопкой", hint: "Короткий текст и кнопка «Оставить заявку»", md: () => ({ title: "Не нашли то, что искали?", hidden: false, style: "accent", rest: "\nНапишите нам — подберём машину под ваши задачи.\n\n[Кнопка: Оставить заявку]\n\n" }) },
  { id: "table", name: "Таблица", hint: "Цены, сравнение, характеристики", md: () => ({ title: "Таблица", hidden: false, style: "", rest: "\n| Колонка 1 | Колонка 2 |\n|---|---|\n| Значение | Значение |\n\n" }) },
  { id: "video", name: "Видео", hint: "Ссылка на YouTube, Rutube или VK Видео", md: () => ({ title: "Видео", hidden: false, style: "", rest: "[[video:https://www.youtube.com/watch?v=]]\n\n" }) },
  { id: "calc", name: "Калькулятор заработка", hint: "Тот же, что на главной", md: () => ({ title: "Рассчитайте свой заработок", hidden: false, style: "", rest: "[КАЛЬКУЛЯТОР]\n\n" }) },
  { id: "trust", name: "Нам доверяют", hint: "Цифры и водители, которые выкупили авто", md: () => ({ title: "Нам доверяют", hidden: false, style: "", rest: "[[trust]]\n\n" }) },
  { id: "reviews", name: "Отзывы", hint: "Отзывы с Яндекс Карт, 2GIS и др.", md: () => ({ title: "Отзывы", hidden: false, style: "", rest: "[[reviews]]\n\n" }) },
  { id: "steps", name: "Шаги «как получить авто»", hint: "Дорога из 3 шагов", md: () => ({ title: "Как получить авто", hidden: false, style: "", rest: "[[steps]]\n\n" }) },
  { id: "reqs", name: "Требования к водителю", hint: "Гражданство, возраст, стаж, документы", md: () => ({ title: "Требования к водителю", hidden: false, style: "", rest: "[[reqs]]\n\n" }) },
  { id: "form", name: "Форма заявки", hint: "Блок с формой, как внизу страниц", md: () => ({ title: "Оставить заявку", hidden: false, style: "", rest: "[[form]]\n\n" }) },
];

const READY: Record<string, string> = { "[[trust]]": "Нам доверяют", "[[reviews]]": "Отзывы", "[[steps]]": "Шаги", "[[reqs]]": "Требования к водителю", "[[form]]": "Форма заявки", "[КАЛЬКУЛЯТОР]": "Калькулятор заработка" };
const kindOf = (b: Blk) => {
  const t = b.rest.trim();
  if (READY[t]) return READY[t];
  if (/^\[\[video:/.test(t)) return "Видео";
  if (/^\[КАЛЬКУЛЯТОР/.test(t)) return "Калькулятор заработка";
  if (/^### /m.test(b.rest) && /вопрос|question|суроо|сұрақ|savol/i.test(b.title)) return "Вопросы и ответы";
  if (/^\|/m.test(b.rest)) return "Таблица";
  if (/^- /m.test(b.rest)) return "Список";
  if (/\[Кнопка:/.test(b.rest)) return "С кнопкой";
  return "Текст";
};

export function BlockBuilder({ body, onChange, readOnly }: { body: string; onChange: (body: string) => void; readOnly: boolean }) {
  const { intro, blocks } = useMemo(() => parse(body), [body]);
  const [open, setOpen] = useState<number | null>(null);
  const [adding, setAdding] = useState<number | null>(null); // позиция вставки
  const commit = (next: Blk[]) => onChange(serialize(intro, next));
  const upd = (i: number, patch: Partial<Blk>) => commit(blocks.map((b, k) => (k === i ? { ...b, ...patch } : b)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
    setOpen(open === i ? j : open === j ? i : open);
  };
  const del = (i: number) => { if (confirm(`Удалить блок «${blocks[i].title}»? Пока страница не опубликована, это можно отменить, закрыв её без сохранения.`)) { commit(blocks.filter((_, k) => k !== i)); setOpen(null); } };
  const dup = (i: number) => commit([...blocks.slice(0, i + 1), { ...blocks[i], title: blocks[i].title + " (копия)" }, ...blocks.slice(i + 1)]);
  const add = (pos: number, id: string) => {
    const lib = LIBRARY.find((l) => l.id === id)!;
    commit([...blocks.slice(0, pos), lib.md(""), ...blocks.slice(pos)]);
    setAdding(null);
    setOpen(pos);
  };

  const Adder = ({ pos }: { pos: number }) =>
    readOnly ? null : adding === pos ? (
      <div className="pnl-bb-lib" role="menu" aria-label="Выберите блок">
        {LIBRARY.map((l) => (
          <button key={l.id} type="button" role="menuitem" onClick={() => add(pos, l.id)}><b>{l.name}</b><small>{l.hint}</small></button>
        ))}
        <button type="button" className="pnl-link-btn" onClick={() => setAdding(null)}>Отмена</button>
      </div>
    ) : (
      <button type="button" className="pnl-bb-add" onClick={() => setAdding(pos)}>+ Добавить блок</button>
    );

  return (
    <div className="pnl-bb">
      <p className="pnl-muted">Каждый раздел страницы — отдельный блок. Меняйте порядок стрелками, скрывайте блоки (они останутся в тексте, но не будут видны на сайте), выбирайте оформление и добавляйте готовые блоки. Шапка страницы, автопарк и футер собираются автоматически.</p>
      <div className="pnl-bb-intro"><b>Первый экран</b> <span className="pnl-muted">— заголовок H1 и вступление (правится в режиме «Текст»)</span></div>
      <Adder pos={0} />
      {blocks.map((b, i) => (
        <div key={i}>
          <article className={`pnl-bb-item${b.hidden ? " is-hidden" : ""}${open === i ? " is-open" : ""}`}>
            <header>
              <span className="pnl-bb-n mono">{String(i + 1).padStart(2, "0")}</span>
              <input className="pnl-bb-title" value={b.title} onChange={(e) => upd(i, { title: e.target.value.replace(/\n/g, " ") })} readOnly={readOnly} aria-label="Заголовок блока" />
              <span className="pnl-bb-kind">{kindOf(b)}</span>
              <div className="pnl-bb-tools">
                <button type="button" onClick={() => move(i, -1)} disabled={readOnly || i === 0} title="Выше" aria-label="Переместить выше">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={readOnly || i === blocks.length - 1} title="Ниже" aria-label="Переместить ниже">↓</button>
                <button type="button" onClick={() => upd(i, { hidden: !b.hidden })} disabled={readOnly} title={b.hidden ? "Показать на сайте" : "Скрыть с сайта"}>{b.hidden ? "Показать" : "Скрыть"}</button>
                <button type="button" onClick={() => dup(i)} disabled={readOnly} title="Копия блока">⧉</button>
                <button type="button" onClick={() => del(i)} disabled={readOnly} title="Удалить блок" className="pnl-bb-del">✕</button>
                <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>{open === i ? "Свернуть" : "Изменить"}</button>
              </div>
            </header>
            {open === i && (
              <div className="pnl-bb-body">
                <label>Оформление
                  <select value={b.style} onChange={(e) => upd(i, { style: e.target.value as Style })} disabled={readOnly}>
                    {STYLES.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
                  </select>
                </label>
                {/^\[\[video:/.test(b.rest.trim()) ? (
                  <label>Ссылка на видео (YouTube, Rutube, VK Видео)
                    <input value={b.rest.trim().replace(/^\[\[video:|\]\]$/g, "")} onChange={(e) => upd(i, { rest: `[[video:${e.target.value.trim()}]]\n\n` })} readOnly={readOnly} placeholder="https://www.youtube.com/watch?v=…" />
                  </label>
                ) : READY[b.rest.trim()] || /^\[КАЛЬКУЛЯТОР/.test(b.rest.trim()) ? (
                  <p className="pnl-muted">Готовый блок: содержимое берётся из общих настроек сайта (Тексты сайта). Здесь меняются заголовок, место и оформление.</p>
                ) : (
                  <label>Содержимое (Markdown: абзацы, «- » список, «### » подзаголовок или вопрос, [Кнопка: Текст])
                    <textarea rows={Math.min(18, Math.max(5, b.rest.split("\n").length + 1))} value={b.rest} onChange={(e) => upd(i, { rest: e.target.value })} readOnly={readOnly} className="pnl-mono" />
                  </label>
                )}
              </div>
            )}
          </article>
          <Adder pos={i + 1} />
        </div>
      ))}
    </div>
  );
}
