import type { Terms } from "@/lib/terms";
import type { Lang } from "@/lib/i18n";
import { TariffCards } from "./TariffCards";

// «Условия»: пять условий спокойным списком — слева название, справа суть; ниже карточки тарифов.
// Тексты пунктов — дословно со старого сайта; страны, документы и цифры — их же содержимое, разложенное по строкам.

// флаги стран в порядке перечисления на сайте: РФ, РБ, Кыргызстан, Казахстан, Южная Осетия, Абхазия, Азербайджан, Таджикистан, Узбекистан, Туркменистан
const FLAGS = ["ru", "by", "kg", "kz", "os", "ab", "az", "tj", "uz", "tm"];

const num = (s: string) => Number(s.match(/\d+/)?.[0] ?? 0);
// «от 3-х лет» → «лет», «3 years or more» → «years»
const unitAfter = (s: string) => s.match(/\d+(?:-[а-яё]+)?\s+([^\s,.]+)/i)?.[1] ?? "";

function DocIcon({ i }: { i: number }) {
  const p = [
    // права
    <><rect x="3" y="6" width="26" height="18" rx="3" /><circle cx="11" cy="14" r="3.2" /><path d="M6.5 21c1-2.6 2.6-3.6 4.5-3.6s3.5 1 4.5 3.6M18 11h7M18 15h7M18 19h4" /></>,
    // паспорт
    <><rect x="7" y="3" width="18" height="26" rx="2.5" /><circle cx="16" cy="13" r="4.5" /><path d="M11.5 13h9M16 8.5c-1.6 1.4-1.6 7.6 0 9M16 8.5c1.6 1.4 1.6 7.6 0 9M11 23h10" /></>,
    // КИС «АРТ»
    <><path d="M8 3h11l6 6v20H8z" /><path d="M19 3v6h6M12 16l3 3 6-6M12 24h9" /></>,
    // справка
    <><path d="M7 3h18v22l-3-2-3 2-3-2-3 2-3-2-3 2z" /><path d="M11 9h10M11 13h10M11 17h6" /></>,
  ][i % 4];
  return <svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{p}</svg>;
}

export function TermsView({ terms, lang = "ru" }: { terms: Terms; lang?: Lang }) {
  const [cit, exp, age, docs, ip] = terms.items;
  const countries = cit ? (cit.text.split(":")[1] ?? "").split(",").map((s) => s.trim()).filter(Boolean) : [];
  const docList = docs ? docs.text.split(/,\s*|\s+и\s+|\s+and\s+/i).map((s) => s.trim()).filter(Boolean) : [];
  const sides = ip ? ip.title.split(/\s+(?:или|or|же|yoki|немесе)\s+/i) : [];
  const expN = exp ? num(exp.text) : 0;
  const ageN = age ? num(age.text) : 0;
  const rows: { key: string; title: string; text?: string; body: React.ReactNode }[] = [];
  if (cit) rows.push({ key: "cit", title: cit.title, text: cit.text.split(":")[0].trim(), body: (
    <ul className="tm2-flags">
      {countries.map((c, i) => <li key={c}><i className={`flag flag-${FLAGS[i] ?? "x"}`} aria-hidden="true" />{c}</li>)}
    </ul>
  ) });
  if (exp) rows.push({ key: "exp", title: exp.title, body: <p className="tm2-num"><b>{expN}</b><sup>+</sup><span>{unitAfter(exp.text)}</span></p> });
  if (age) rows.push({ key: "age", title: age.title, body: <p className="tm2-num"><b>{ageN}</b><sup>+</sup></p> });
  if (docs) rows.push({ key: "docs", title: docs.title, body: (
    <ul className="tm2-docs">
      {docList.map((d, i) => (
        <li key={d}><DocIcon i={i} /><span>{d.charAt(0).toUpperCase() + d.slice(1)}</span></li>
      ))}
    </ul>
  ) });
  if (ip) rows.push({ key: "ip", title: ip.title, text: ip.text, body: sides.length === 2 ? <p className="tm2-sides">{sides.map((x) => <span key={x}>{x}</span>)}</p> : null });

  return (
    <div className="tm-root">
      <section className="section tm2" aria-label={terms.items.map((i) => i.title).join(", ")}>
        <div className="wrap">
          <ol className="tm2-list">
            {rows.map((r, i) => (
              <li key={r.key} className={`tm2-row tm2-row-${r.key}`}>
                <span className="tm2-n mono">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="tm2-h">{r.title}</h3>
                <div className="tm2-body">
                  {r.body}
                  {r.text && <p className="tm2-p">{r.text}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <TariffCards terms={terms} lang={lang} />
    </div>
  );
}
