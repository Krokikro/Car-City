"use client";

// Цифры крутятся как одометр таксометра (PRD 3.4). Чистый DOM + CSS, без WebGL.
export function Odometer({ value }: { value: number }) {
  const text = Math.max(0, Math.round(value)).toLocaleString("ru-RU");
  return (
    <span className="odometer" role="img" aria-label={`${text} рублей`}>
      {Array.from(text).map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={i} className="odo-digit" aria-hidden="true">
            <span className="odo-strip" style={{ transform: `translateY(-${Number(ch) * 10}%)` }}>
              {"0123456789".split("").map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        ) : (
          <span key={i} className="odo-sep" aria-hidden="true">{ch === " " ? " " : ch}</span>
        ),
      )}
      <span className="odo-cur" aria-hidden="true">₽</span>
    </span>
  );
}
