import { requirements, terms } from "@/lib/content";

export function Terms() {
  return (
    <section className="section" data-surface="light" id="usloviya" aria-labelledby="terms-title">
      <div className="wrap split">
        <div className="head">
          <p className="mono">Условия</p>
          <h2 id="terms-title" className="display">Кого берём и на каких условиях</h2>
          <ul className="checks">
            {requirements.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
        <dl className="terms">
          {terms.map((t) => (
            <div key={t.label} className="term">
              <dt className="muted">{t.label}</dt>
              <dd className="mono-num">{t.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
