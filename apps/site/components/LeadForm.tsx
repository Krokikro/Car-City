"use client";

import { useState } from "react";
import { company } from "@/lib/content";

type State = "idle" | "sending" | "done" | "error";

// Заявка: имя, телефон, отдельное согласие на обработку данных (152-ФЗ, по умолчанию не отмечено).
// Скрытое поле company_site — ловушка для ботов.
export function LeadForm() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Не получилось отправить");
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не получилось отправить");
      setState("error");
    }
  }

  return (
    <section className="section lead-section" id="zayavka" aria-labelledby="lead-title">
      <div className="wrap split">
        <div className="head">
          <p className="mono">Заявка</p>
          <h2 id="lead-title" className="display">Перезвоним и подберём машину</h2>
          <p className="lead">Или позвоните сами:</p>
          <p className="phones">
            {company.phones.map((p) => (
              <a key={p} href={`tel:${p.replace(/[^\d+]/g, "")}`} className="mono-num">{p}</a>
            ))}
          </p>
        </div>
        {state === "done" ? (
          <div className="lead-done" role="status">
            <h3>Заявка принята</h3>
            <p className="muted">Менеджер перезвонит в рабочее время офиса.</p>
          </div>
        ) : (
          <form className="lead-form" onSubmit={onSubmit} noValidate={false}>
            <label className="field">
              <span className="mono">Имя</span>
              <input name="name" autoComplete="given-name" required minLength={2} maxLength={60} />
            </label>
            <label className="field">
              <span className="mono">Телефон</span>
              <input name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="+7 900 000-00-00" pattern="[+\d\s()\-]{10,20}" />
            </label>
            <label className="hp" aria-hidden="true">
              Сайт компании
              <input name="company_site" tabIndex={-1} autoComplete="off" />
            </label>
            <label className="consent">
              <input type="checkbox" name="consent" required />
              <span>
                Согласен на обработку персональных данных по{" "}
                <a href={company.privacyUrl} target="_blank" rel="noopener">политике конфиденциальности</a>
              </span>
            </label>
            <button className="btn btn-primary" type="submit" disabled={state === "sending"}>
              {state === "sending" ? "Отправляем…" : "Жду звонка"}
            </button>
            {state === "error" && <p className="form-error" role="alert">{error}</p>}
          </form>
        )}
      </div>
    </section>
  );
}
