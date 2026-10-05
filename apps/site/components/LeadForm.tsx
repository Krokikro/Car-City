"use client";

import { useId, useState } from "react";
import { company } from "@/lib/content";

type State = "idle" | "sending" | "done" | "error";

// Форма заявки. Согласие на обработку данных отдельной галкой (152-ФЗ), по умолчанию не отмечена.
// company_site — ловушка для ботов.
export function LeadForm({ button = "Перезвоните мне", source = "site", compact = false }: { button?: string; source?: string; compact?: boolean }) {
  const id = useId();
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = { ...Object.fromEntries(new FormData(e.currentTarget)), source };
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

  if (state === "done")
    return (
      <div className="lead-done" role="status">
        <span className="lead-done-ico" aria-hidden="true">✓</span>
        <p className="h3">Заявка принята</p>
        <p className="muted">Менеджер свяжется с вами в течение 1 минуты в рабочее время офиса.</p>
      </div>
    );

  return (
    <form className={`lead-form${compact ? " compact" : ""}`} onSubmit={onSubmit}>
      <div className="lead-fields">
        <label className="field">
          <input id={`${id}-n`} name="name" autoComplete="given-name" required minLength={2} maxLength={60} placeholder=" " />
          <span>Имя</span>
        </label>
        <label className="field">
          <input id={`${id}-p`} name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder=" " pattern="[+\d\s()\-]{10,20}" />
          <span>Телефон</span>
        </label>
      </div>
      <label className="hp" aria-hidden="true">
        Сайт компании
        <input name="company_site" tabIndex={-1} autoComplete="off" />
      </label>
      <label className="consent">
        <input type="checkbox" name="consent" required />
        <span>
          Даю согласие на <a href={company.privacyUrl} target="_blank" rel="noopener">обработку персональных данных</a>
        </span>
      </label>
      <button className="btn btn-primary btn-lg" type="submit" disabled={state === "sending"} data-magnetic>
        {state === "sending" ? "Отправляем…" : button}
      </button>
      {state === "error" && <p className="form-error" role="alert">{error}</p>}
    </form>
  );
}
