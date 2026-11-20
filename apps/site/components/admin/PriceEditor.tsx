"use client";
// Таблица цен аренды или выкупа: модели × графики (сроки). У строки — цена в сутки, старая цена или скидка в %
// (одно пересчитывается из другого), у выкупа — первоначальный взнос. У модели — формат показа скидки.
import { useMemo, useState } from "react";

export interface Row { k: string; p: number; o?: number; dep?: number }
export interface Model { slug: string; name: string; cls: string; clsName: string; rows: Row[]; disp: string; custom: boolean; file: Row[] }

const DISP: [string, string][] = [["auto", "Старая цена + плашка «−N%»"], ["old", "Только зачёркнутая старая цена"], ["badge", "Только плашка «−N%»"], ["upto", "Плашка «до −N%»"], ["none", "Не показывать скидку"]];
const r10 = (n: number) => Math.round(n / 10) * 10;
const pct = (p: number, o?: number) => (o && o > p && p > 0 ? Math.round((1 - p / o) * 100) : 0);
const num = (v: string) => { const n = Math.round(Number(v.replace(/\s/g, "").replace(",", "."))); return Number.isFinite(n) && n > 0 ? n : 0; };

export function PriceEditor({ kind, models, suggest, formId, canWrite }: { kind: "rent" | "buy"; models: Model[]; suggest: string[]; formId: string; canWrite: boolean }) {
  const [data, setData] = useState(models);
  const [cls, setCls] = useState("");
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const classes = useMemo(() => [...new Map(models.map((m) => [m.cls, m.clsName])).entries()], [models]);
  const buy = kind === "buy";

  const upd = (slug: string, fn: (m: Model) => Model) => {
    setData((d) => d.map((m) => (m.slug === slug ? fn(m) : m)));
    setDirty((s) => new Set(s).add(slug));
  };
  const setRow = (slug: string, i: number, patch: Partial<Row>) => upd(slug, (m) => ({ ...m, rows: m.rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) }));

  const payload = JSON.stringify(data.filter((m) => dirty.has(m.slug)).map((m) => ({ slug: m.slug, disp: m.disp, rows: m.rows.filter((r) => r.k.trim() || r.p) })));
  const shown = data.filter((m) => !cls || m.cls === cls);

  return (
    <div className="pnl-prices">
      <input type="hidden" name="kind" value={kind} form={formId} />
      <input type="hidden" name="json" value={payload} form={formId} />
      <div className="pnl-prices-bar">
        <label>Класс<select value={cls} onChange={(e) => setCls(e.target.value)}><option value="">Все классы</option>{classes.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
        <span className="pnl-muted">{dirty.size ? <b className="pnl-dirty">Изменено моделей: {dirty.size} — нажмите «Сохранить цены»</b> : "Цена в сутки, ₽. Скидку можно ввести процентом или старой ценой — второе посчитается само."}</span>
      </div>
      <datalist id={`sched-${kind}`}>{suggest.map((s) => <option key={s} value={s} />)}</datalist>
      <div className="pnl-table-wrap">
        <table className="pnl-table pnl-price-table">
          <thead>
            <tr><th>Модель</th><th>{buy ? "Срок выкупа / график" : "График работы / срок"}</th><th>Цена в сутки</th><th>Скидка, %</th><th>Старая цена</th>{buy && <th>Первонач. взнос</th>}<th /></tr>
          </thead>
          {shown.map((m) => (
            <tbody key={m.slug} className={dirty.has(m.slug) ? "is-dirty" : ""}>
              {(m.rows.length ? m.rows : [null]).map((r, i) => (
                <tr key={i}>
                  {i === 0 && (
                    <td rowSpan={Math.max(1, m.rows.length) + 1} className="pnl-price-model">
                      <b>{m.name}</b><span className="pnl-muted">{m.clsName}{m.custom ? " · из админки" : " · как в файле"}</span>
                      <label>Показ скидки<select value={m.disp} disabled={!canWrite} onChange={(e) => upd(m.slug, (x) => ({ ...x, disp: e.target.value }))}>{DISP.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
                    </td>
                  )}
                  {r ? (
                    <>
                      <td><input data-nocc list={`sched-${kind}`} value={r.k} maxLength={20} disabled={!canWrite} onChange={(e) => setRow(m.slug, i, { k: e.target.value })} placeholder={buy ? "2 года" : "6/1"} aria-label="График" /></td>
                      <td><input inputMode="numeric" value={r.p || ""} disabled={!canWrite} onChange={(e) => setRow(m.slug, i, { p: num(e.target.value) })} aria-label="Цена в сутки" /></td>
                      <td><input inputMode="numeric" value={pct(r.p, r.o) || ""} disabled={!canWrite} placeholder="0" onChange={(e) => { const d = Math.min(90, num(e.target.value)); setRow(m.slug, i, { o: d && r.p ? r10(r.p / (1 - d / 100)) : undefined }); }} aria-label="Скидка, %" /></td>
                      <td><input inputMode="numeric" value={r.o || ""} disabled={!canWrite} placeholder="—" onChange={(e) => setRow(m.slug, i, { o: num(e.target.value) || undefined })} aria-label="Старая цена" className={r.o && r.o <= r.p ? "pnl-bad" : ""} /></td>
                      {buy && <td><input inputMode="numeric" value={r.dep ?? ""} disabled={!canWrite} placeholder="0" onChange={(e) => setRow(m.slug, i, { dep: num(e.target.value) })} aria-label="Первоначальный взнос" /></td>}
                      <td>{canWrite && <button type="button" className="pnl-icon-btn" title="Удалить строку" aria-label="Удалить строку" onClick={() => upd(m.slug, (x) => ({ ...x, rows: x.rows.filter((_, j) => j !== i) }))}>×</button>}</td>
                    </>
                  ) : (
                    <td colSpan={buy ? 6 : 5} className="pnl-muted">{buy ? "Выкупа нет — машина не показывается на страницах выкупа" : "Аренды нет — у машины не будет цены и кнопки «Арендовать»"}</td>
                  )}
                </tr>
              ))}
              {canWrite && (
                <tr className="pnl-price-add"><td colSpan={buy ? 6 : 5}>
                  <button type="button" className="pnl-link-btn" onClick={() => upd(m.slug, (x) => ({ ...x, rows: [...x.rows, { k: "", p: x.rows[x.rows.length - 1]?.p ?? 0, dep: buy ? x.rows[0]?.dep ?? 0 : undefined }] }))}>+ строка</button>
                  {m.custom && <button type="button" className="pnl-link-btn" onClick={() => upd(m.slug, (x) => ({ ...x, rows: x.file.map((r) => ({ ...r })), disp: "auto" }))}>вернуть цены из файла</button>}
                </td></tr>
              )}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}
