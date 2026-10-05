import { perks } from "@/lib/content";

export function Perks() {
  return (
    <section className="perks wrap" aria-label="Коротко об условиях">
      {perks.map((p) => (
        <div key={p.k} className="perk">
          <span className="perk-k">{p.k}</span>
          <span className="muted">{p.v}</span>
        </div>
      ))}
    </section>
  );
}
