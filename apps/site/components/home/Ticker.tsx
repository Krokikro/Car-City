// Жёлтая лента с шашечками: два встречных ряда условий. Чистый CSS, скорость растёт от скорости скролла (MotionRoot).
export function Ticker({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <section className="ticker" aria-label={items.join(", ")}>
      <div className="ticker-band" data-velocity>
        <div className="ticker-row">{row.map((s, i) => <span key={i}>{s}<i aria-hidden="true" /></span>)}</div>
      </div>
      <div className="ticker-band dark" data-velocity>
        <div className="ticker-row rev">{row.map((s, i) => <span key={i}>{s}<i aria-hidden="true" /></span>)}</div>
      </div>
    </section>
  );
}
