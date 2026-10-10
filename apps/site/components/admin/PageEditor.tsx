"use client";

import { useEffect, useRef, useState } from "react";
import { savePageAction } from "@/app/(admin)/admin/actions";

const T_MAX = 60;
const D_MAX = 160;
interface Media { id: string; name: string; w: number | null; h: number | null }

export function PageEditor({ lang, path, kind, readOnly, initial, hasDraft, publishAt, hidden, previewTo }: {
  lang: string; path: string; kind: string; readOnly: boolean;
  initial: { title: string; h1: string; description: string; body: string };
  hasDraft: boolean; publishAt: string; hidden: boolean; previewTo: string;
}) {
  const [v, setV] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [dev, setDev] = useState<"m" | "t" | "d">("d");
  const [view, setView] = useState(false);
  const [tick, setTick] = useState(0);
  const [pick, setPick] = useState(false);
  const [media, setMedia] = useState<Media[] | null>(null);
  const ta = useRef<HTMLTextAreaElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setV((o) => ({ ...o, [k]: e.target.value })); setDirty(true); };

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  useEffect(() => {
    if (!pick || media) return;
    fetch("/admin/api/media").then((r) => r.json()).then((j) => setMedia(j.items ?? [])).catch(() => setMedia([]));
  }, [pick, media]);

  const edit = (fn: (sel: string) => { text: string; select?: [number, number] }) => {
    const el = ta.current!;
    const [a, b] = [el.selectionStart, el.selectionEnd];
    const r = fn(el.value.slice(a, b));
    el.setRangeText(r.text, a, b, "end");
    if (r.select) el.setSelectionRange(a + r.select[0], a + r.select[1]);
    setV((o) => ({ ...o, body: el.value }));
    setDirty(true);
    el.focus();
  };
  const wrap = (l: string, r: string, ph: string) => edit((s) => ({ text: `${l}${s || ph}${r}`, select: [l.length, l.length + (s || ph).length] }));
  const line = (p: string) => edit((s) => ({ text: (s || "Текст").split("\n").map((x) => p + x).join("\n") }));
  const link = () => edit((s) => ({ text: `[${s || "текст ссылки"}](https://)`, select: [s ? s.length + 3 : 13, s ? s.length + 11 : 21] }));
  const image = (m: Media) => { edit(() => ({ text: `![${m.name.replace(/\.[a-z0-9]+$/i, "")}](/media/${m.id})` })); setPick(false); };

  const onKey = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      const b = form.current?.querySelector<HTMLButtonElement>('button[value="draft"]');
      if (b && !readOnly) form.current?.requestSubmit(b);
    }
  };

  const tl = v.title.length;
  const dl = v.description.length;
  const url = `car-city.pro${lang === "ru" ? "" : "/" + lang}${path}`;
  const widths = { m: 390, t: 768, d: 0 };

  return (
    <div className={`ad-editor${view ? " with-view" : ""}`}>
      <form ref={form} action={savePageAction} onKeyDown={onKey} className="ad-form ad-ed-form">
        <input type="hidden" name="lang" value={lang} />
        <input type="hidden" name="path" value={path} />
        <input type="hidden" name="kind" value={kind} />
        <fieldset disabled={readOnly}>
          <section className="ad-card">
            <h2>Для поисковиков</h2>
            <label>Title (заголовок в выдаче)
              <input name="title" value={v.title} onChange={set("title")} required maxLength={300} />
              <small className={tl > T_MAX ? "warn" : ""}>{tl} из ~{T_MAX} символов. Длинный заголовок в выдаче обрежется.</small>
            </label>
            <label>Description (описание в выдаче)
              <textarea name="description" rows={3} value={v.description} onChange={set("description")} maxLength={600} />
              <small className={dl > D_MAX ? "warn" : ""}>{dl} из ~{D_MAX} символов.</small>
            </label>
            <div className="ad-serp" aria-label="Так страница выглядит в поиске">
              <span className="ad-serp-url">{url}</span>
              <b>{v.title ? (tl > T_MAX + 10 ? v.title.slice(0, T_MAX + 10) + "…" : v.title) : "Заголовок страницы"}</b>
              <p>{v.description ? (dl > D_MAX ? v.description.slice(0, D_MAX) + "…" : v.description) : "Описание страницы пока не заполнено."}</p>
            </div>
          </section>

          <section className="ad-card">
            <h2>Текст страницы</h2>
            <label>Заголовок H1<input name="h1" value={v.h1} onChange={set("h1")} required maxLength={300} /></label>
            <div className="ad-toolbar" role="toolbar" aria-label="Оформление текста">
              <button type="button" onClick={() => line("## ")} title="Заголовок раздела">H2</button>
              <button type="button" onClick={() => line("### ")} title="Подзаголовок">H3</button>
              <button type="button" onClick={() => wrap("**", "**", "жирный")} title="Жирный"><b>Ж</b></button>
              <button type="button" onClick={() => wrap("*", "*", "курсив")} title="Курсив"><i>К</i></button>
              <button type="button" onClick={() => line("- ")} title="Список">• Список</button>
              <button type="button" onClick={link} title="Ссылка">Ссылка</button>
              <button type="button" onClick={() => setPick(true)} title="Картинка из медиатеки">Картинка</button>
            </div>
            <textarea ref={ta} name="body" className="ad-body" rows={26} value={v.body} onChange={set("body")} spellCheck lang="ru" aria-label="Текст страницы в формате Markdown" />
            <small>Markdown: ## заголовок раздела, ### подзаголовок, **жирный**, [текст](адрес), ![описание](адрес картинки). Блоки вроде карточек, вопросов-ответов и кнопок собираются из этого текста автоматически, поэтому правьте слова, а структуру (порядок заголовков) меняйте осторожно. Ctrl/⌘+S — сохранить черновик.</small>
          </section>

          {!readOnly && (
            <section className="ad-card ad-publish">
              <h2>Публикация</h2>
              {hasDraft && <p className="ad-msg ad-warn">Есть неопубликованный черновик: он открыт выше. На сайте пока предыдущая версия.</p>}
              {hidden && <p className="ad-msg ad-warn">Страница снята с публикации. Нажмите «Опубликовать», чтобы вернуть её.</p>}
              <div className="ad-pub-row">
                <button className="ad-btn" type="submit" name="intent" value="draft">Сохранить черновик</button>
                <button className="ad-btn ad-btn-main" type="submit" name="intent" value="publish">Опубликовать сейчас</button>
              </div>
              <div className="ad-pub-row">
                <label className="ad-inline-l">Или опубликовать в
                  <input type="datetime-local" name="publish_at" defaultValue={publishAt} />
                  <small>по Москве</small>
                </label>
                <button className="ad-btn" type="submit" name="intent" value="schedule">Запланировать</button>
              </div>
              <div className="ad-pub-row">
                <button className="ad-btn ad-btn-warn" type="submit" name="intent" value="hide" onClick={(e) => { if (!confirm("Снять страницу с публикации? Адрес будет отдавать 404, поисковики со временем её уберут.")) e.preventDefault(); }}>Снять с публикации</button>
              </div>
            </section>
          )}
        </fieldset>
      </form>

      <aside className="ad-view">
        <div className="ad-view-bar">
          <b>Предпросмотр</b>
          <span className="ad-seg">
            {(["m", "t", "d"] as const).map((d) => <button key={d} type="button" className={dev === d ? "on" : ""} onClick={() => setDev(d)}>{d === "m" ? "Телефон" : d === "t" ? "Планшет" : "Компьютер"}</button>)}
          </span>
          {view ? <button type="button" className="ad-btn" onClick={() => setTick((t) => t + 1)}>Обновить</button> : null}
          <button type="button" className="ad-btn" onClick={() => setView((x) => !x)}>{view ? "Скрыть" : "Показать"}</button>
        </div>
        {view ? (
          <div className="ad-frame" style={{ maxWidth: widths[dev] || "100%" }}>
            <iframe key={tick} title="Предпросмотр страницы" src={`/admin/preview?to=${encodeURIComponent(previewTo)}`} />
          </div>
        ) : (
          <p className="ad-muted">Показывает сохранённый черновик (или опубликованную версию). Сначала сохраните черновик, затем обновите предпросмотр.</p>
        )}
      </aside>

      {pick && (
        <div className="ad-modal" role="dialog" aria-modal="true" aria-label="Медиатека" onClick={(e) => { if (e.target === e.currentTarget) setPick(false); }}>
          <div className="ad-modal-box">
            <div className="ad-modal-head"><b>Выберите картинку</b><button type="button" className="ad-btn" onClick={() => setPick(false)}>Закрыть</button></div>
            {!media ? <p className="ad-muted">Загрузка…</p> : media.length === 0 ? <p className="ad-muted">В медиатеке пусто. Загрузите файлы в разделе «Медиатека».</p> : (
              <ul className="ad-grid">
                {media.map((m) => (
                  <li key={m.id}><button type="button" onClick={() => image(m)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/media/${m.id}`} alt="" loading="lazy" /><span>{m.name}</span>
                  </button></li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
