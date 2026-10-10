"use client";

import { useState } from "react";

type Car = { slug: string; name: string; cls: string; img?: boolean };

// Машины на главной: список по порядку со стрелками, убрать и добавить. Отправляется скрытым полем order.
export function HomeFleetOrder({ all, initial, action, canWrite }: { all: Car[]; initial: string[]; action: (fd: FormData) => void | Promise<void>; canWrite: boolean }) {
  const [list, setList] = useState<string[]>(initial);
  const byS = new Map(all.map((c) => [c.slug, c]));
  const rest = all.filter((c) => !list.includes(c.slug));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const n = list.slice();
    [n[i], n[j]] = [n[j], n[i]];
    setList(n);
  };
  return (
    <form action={action} className="ad-card" id="home">
      <h2 style={{ margin: "0 0 4px" }}>Машины на главной</h2>
      <p className="ad-muted" style={{ margin: "0 0 12px" }}>Эти машины видны сразу, остальные открываются по кнопке «Смотреть весь автопарк». Порядок — как в списке: двигайте стрелками, убирайте и добавляйте.</p>
      <input type="hidden" name="order" value={list.join(",")} />
      <ol className="ad-home-list">
        {list.map((s, i) => {
          const c = byS.get(s);
          if (!c) return null;
          return (
            <li key={s}>
              <span className="ad-home-n">{i + 1}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/cars/${s}-640.webp`} alt="" width={64} height={48} loading="lazy" />
              <b>{c.name}</b>
              <span className="ad-muted">{c.cls}</span>
              {canWrite && (
                <span className="ad-home-btns">
                  <button type="button" className="ad-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Выше">↑</button>
                  <button type="button" className="ad-btn" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Ниже">↓</button>
                  <button type="button" className="ad-btn" onClick={() => setList(list.filter((x) => x !== s))} aria-label="Убрать с главной">✕</button>
                </span>
              )}
            </li>
          );
        })}
        {!list.length && <li className="ad-muted">Пусто — на главной покажется набор по умолчанию.</li>}
      </ol>
      {canWrite && (
        <div className="ad-home-add">
          <select id="ad-home-add" defaultValue="" onChange={(e) => { if (e.target.value) { setList([...list, e.target.value]); e.target.value = ""; } }}>
            <option value="">+ Добавить машину на главную…</option>
            {rest.map((c) => <option key={c.slug} value={c.slug}>{c.name} · {c.cls}</option>)}
          </select>
          <button className="ad-btn ad-btn-main" type="submit">Сохранить порядок</button>
        </div>
      )}
    </form>
  );
}
