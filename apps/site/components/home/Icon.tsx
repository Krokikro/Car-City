// Линейные иконки преимуществ: рисуются штрихом при появлении (класс .draw).
const P: Record<string, string> = {
  wash: "M8 30h32M12 30l3-9h18l3 9M14 36a2 2 0 1 0 4 0 2 2 0 1 0-4 0M30 36a2 2 0 1 0 4 0 2 2 0 1 0-4 0M18 12c0 3-3 3-3 6M24 8c0 3-3 3-3 6M30 12c0 3-3 3-3 6",
  book: "M8 12c6-3 11-3 16 1v26c-5-4-10-4-16-1zM40 12c-6-3-11-3-16 1v26c5-4 10-4 16-1z",
  gift: "M8 20h32v8H8zM11 28h26v12H11zM24 20v20M24 20c-4-8-12-8-10-2 1 2 6 2 10 2zM24 20c4-8 12-8 10-2-1 2-6 2-10 2z",
  wallet: "M8 16h30a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2zM8 16l22-7 3 7M32 25h8v6h-8a3 3 0 0 1 0-6z",
  support: "M10 26v-2a14 14 0 0 1 28 0v2M10 26h5v10h-5zM33 26h5v10h-5zM38 36c0 4-6 5-10 5",
  taxi: "M8 32v-6l4-9h24l4 9v6zM18 17l2-5h8l2 5M8 32v4h6v-4M34 32v4h6v-4M13 26h4M31 26h4",
  sleep: "M30 10a14 14 0 1 0 8 22 12 12 0 0 1-8-22zM30 12h6l-6 6h6",
  priority: "M8 36l10-10 7 7 15-15M30 18h10v10",
};

export function Icon({ name }: { name: string }) {
  return (
    <svg className="ico" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name]} pathLength={1} />
    </svg>
  );
}
