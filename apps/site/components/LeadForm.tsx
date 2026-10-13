"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { company } from "@/lib/content";
import { SocialIcon } from "@/components/SocialIcons";
import { isLang, splitLang } from "@/lib/i18n";
import { leadFormI18n } from "@/lib/lead/i18n";
import { formatPhone, normalizePhone, phoneDigits } from "@/lib/lead/phone";
import { getTouches } from "@/lib/lead/attribution";
import { GOALS, getYmClientId, reachGoal } from "@/lib/lead/metrika";
import { CAPTCHA_KEY, solveCaptcha } from "@/lib/lead/captcha";
import { MESSENGERS, type LeadErrorCode, type LeadRequest, type Messenger } from "@/lib/lead/types";

type State = "idle" | "sending" | "done" | "error";

/** Тексты формы. Русские по умолчанию; языковые версии передают свой словарь. */
export interface LeadFormText {
  name: string;
  phone: string;
  messenger: string;
  messengers: Record<Messenger, string>;
  consentPrefix: string;
  consentLink: string;
  marketing: string;
  submit: string;
  sending: string;
  doneTitle: string;
  doneText: string;
  doneWrite: string;
  demoNote: string;
  errors: Record<LeadErrorCode | "network", string>;
}

export const leadFormRu: LeadFormText = {
  name: "Имя",
  phone: "Телефон",
  messenger: "Как удобнее связаться",
  messengers: { call: "Звонок", telegram: "Telegram", whatsapp: "WhatsApp", max: "MAX" },
  consentPrefix: "Даю согласие на",
  consentLink: "обработку персональных данных",
  marketing: "Согласен получать предложения и на передачу телефона в рекламные сервисы",
  submit: "Перезвоните мне",
  sending: "Отправляем…",
  doneTitle: "Заявка принята",
  doneText: "Менеджер свяжется с вами в течение 1 минуты в рабочее время офиса.",
  doneWrite: "Или напишите нам сами:",
  demoNote: "Демо-версия сайта: заявка никуда не отправлена.",
  errors: {
    format: "Не получилось отправить, обновите страницу",
    name: "Укажите имя",
    phone: "Проверьте номер телефона",
    consent: "Нужно согласие на обработку персональных данных",
    too_fast: "Форма отправлена слишком быстро, попробуйте ещё раз",
    rate: "Слишком много заявок. Попробуйте позже или позвоните нам",
    captcha: "Не прошли проверку на робота, попробуйте ещё раз",
    captcha_required: "Нужна проверка на робота, попробуйте ещё раз",
    origin: "Не получилось отправить, обновите страницу",
    delivery: `Не получилось отправить заявку. Позвоните нам: ${company.phones[0]}`,
    network: "Нет связи с сервером. Проверьте интернет и попробуйте ещё раз",
  },
};

type Text = Partial<Omit<LeadFormText, "errors" | "messengers">> & { errors?: Partial<LeadFormText["errors"]>; messengers?: Partial<LeadFormText["messengers"]> };

interface Props {
  /** Текст кнопки (перекрывает t.submit) */
  button?: string;
  /** Какая форма: final, promo, calculator, model… */
  source?: string;
  compact?: boolean;
  /** Контекст заявки: модель, тип (rent/buyout), офис, результат калькулятора */
  extra?: Record<string, string | number | undefined>;
  t?: Text;
  /** Язык страницы; по умолчанию берётся из <html lang> */
  lang?: string;
  /** Выбор мессенджера для связи (PRD 8.1) */
  askMessenger?: boolean;
  /** Отдельная галочка на рекламу (PRD 8.2) */
  askMarketing?: boolean;
  /** Ссылка на текст согласия на обработку ПДн */
  consentUrl?: string;
}

// Статичное превью без сервера (GitHub Pages): форма не ходит в API и сразу показывает успех
const DEMO = process.env.NEXT_PUBLIC_STATIC_DEMO === "1";

class LeadError extends Error {
  constructor(public code: LeadErrorCode | "network", message?: string) {
    super(message || code);
  }
}

// Форма заявки (PRD 8.1). Работает и без JS: обычный POST на /api/lead.
// Защита: ловушка company_site, время заполнения, согласие отдельной неотмеченной галкой (152-ФЗ),
// капча — только если сервер счёл отправку подозрительной.
export function LeadForm({ button, source = "site", compact = false, extra, t: tp, lang, askMessenger = true, askMarketing = true, consentUrl = company.privacyUrl }: Props) {
  const pathLang = splitLang(usePathname() || "/").lang;
  const base = leadFormI18n[isLang(lang) ? lang : pathLang] ?? leadFormRu;
  const t: LeadFormText = { ...base, ...tp, errors: { ...base.errors, ...tp?.errors }, messengers: { ...base.messengers, ...tp?.messengers } };
  const id = useId();
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const startedAt = useRef(0);
  const tsRef = useRef<HTMLInputElement>(null);
  const captchaRef = useRef<HTMLDivElement>(null);
  const goalSent = useRef(false);
  const ctx = Object.entries(extra ?? {}).filter((e): e is [string, string | number] => e[1] !== undefined && e[1] !== "");

  useEffect(() => {
    startedAt.current = Date.now();
    if (tsRef.current) tsRef.current.value = String(startedAt.current);
  }, []);

  function onFocus() {
    if (goalSent.current) return;
    goalSent.current = true;
    reachGoal(GOALS.formStart, { form: source });
  }

  function onPhone(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value;
    // Стёрли скобку или дефис — стираем и цифру перед ним, иначе маска вернёт символ обратно
    const del = (e.nativeEvent as InputEvent).inputType?.startsWith("delete");
    if (del && phoneDigits(v) === phoneDigits(phone) && v.length < phone.length) v = v.replace(/\d(?=\D*$)/, "");
    setPhone(formatPhone(v));
  }

  async function send(body: LeadRequest): Promise<void> {
    let res: Response;
    try {
      res = await fetch("/api/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    } catch {
      throw new LeadError("network");
    }
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; code?: LeadErrorCode; error?: string };
    if (res.ok && json.ok) return;
    if (json.code === "captcha_required" && CAPTCHA_KEY && captchaRef.current && !body.captcha_token) {
      const token = await solveCaptcha(captchaRef.current, body.lang).catch(() => {
        throw new LeadError("captcha");
      });
      return send({ ...body, captcha_token: token });
    }
    throw new LeadError(json.code ?? "network", json.error);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const normalized = normalizePhone(phone);
    if (!normalized) {
      setError(t.errors.phone);
      setState("error");
      e.currentTarget.querySelector<HTMLInputElement>('input[name="phone"]')?.focus();
      return;
    }
    setState("sending");
    setError("");
    if (DEMO) {
      setState("done");
      return;
    }
    const pageLang = lang || document.documentElement.lang || "ru";
    const body: LeadRequest = {
      name: String(fd.get("name") ?? ""),
      phone: normalized,
      consent: fd.get("consent") === "on",
      marketing: fd.get("marketing") === "on",
      messenger: (fd.get("messenger") as Messenger | null) ?? undefined,
      company_site: String(fd.get("company_site") ?? ""),
      fill_ms: Date.now() - startedAt.current,
      source,
      page: location.href.slice(0, 300),
      lang: pageLang,
      extra: Object.fromEntries(ctx.map(([k, v]) => [k, String(v)])),
      ...getTouches(),
      ym_client_id: await getYmClientId(),
      screen: `${screen.width}x${screen.height}`,
    };
    try {
      await send(body);
      reachGoal(GOALS.lead, { form: source, ...body.extra });
      setState("done");
    } catch (err) {
      const code = err instanceof LeadError ? err.code : "network";
      setError(t.errors[code] || (err instanceof Error ? err.message : t.errors.network));
      setState("error");
    }
  }

  if (state === "done")
    return (
      <div className="lead-done" role="status">
        <span className="lead-done-ico" aria-hidden="true">✓</span>
        <p className="h3">{t.doneTitle}</p>
        <p className="muted">{t.doneText}</p>
        <p className="small muted">{t.doneWrite}</p>
        <div className="lead-done-msgr">
          <a className="pill" href={company.telegram} target="_blank" rel="noopener">Telegram</a>
          <a className="pill" href={company.whatsapp} target="_blank" rel="noopener">WhatsApp</a>
          <a className="pill" href={company.max} target="_blank" rel="noopener">MAX</a>
        </div>
        {DEMO && <p className="small muted">{t.demoNote}</p>}
      </div>
    );

  return (
    <form className={`lead-form${compact ? " compact" : ""}`} action="/api/lead" method="post" onSubmit={onSubmit} onFocus={onFocus}>
      <div className="lead-fields">
        <label className="field">
          <input id={`${id}-n`} name="name" autoComplete="given-name" required minLength={2} maxLength={60} placeholder=" " />
          <span>{t.name}</span>
        </label>
        <label className="field">
          <input
            id={`${id}-p`}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            placeholder=" "
            pattern="[+\d\s()\-]{10,20}"
            maxLength={20}
            value={phone}
            onChange={onPhone}
          />
          <span>{t.phone}</span>
        </label>
      </div>
      {askMessenger && (
        <fieldset className="lead-msgr">
          <legend className="small muted">{t.messenger}</legend>
          {MESSENGERS.map((m) => (
            <label key={m} className="lead-chip">
              <input type="radio" name="messenger" value={m} />
              <span className="pill">{m === "call" ? <span className="soc-ico soc-call" aria-hidden="true"><svg viewBox="0 0 24 24" width="12" height="12"><path d="M6.6 3.5h2.6l1.3 3.6-1.8 1.4a10 10 0 0 0 6.8 6.8l1.4-1.8 3.6 1.3v2.6c0 1-.8 1.8-1.8 1.8A15.6 15.6 0 0 1 4.8 5.3c0-1 .8-1.8 1.8-1.8z" fill="#111"/></svg></span> : <SocialIcon kind={m} size={20} />}{t.messengers[m]}</span>
            </label>
          ))}
        </fieldset>
      )}
      <label className="hp" aria-hidden="true">
        Сайт компании
        <input name="company_site" tabIndex={-1} autoComplete="off" />
      </label>
      <input type="hidden" name="ts" ref={tsRef} />
      <input type="hidden" name="source" value={source} />
      {lang && <input type="hidden" name="lang" value={lang} />}
      {ctx.map(([k, v]) => (
        <input key={k} type="hidden" name={`x_${k}`} value={String(v)} />
      ))}
      <label className="consent">
        <input type="checkbox" name="consent" required />
        <span>
          {t.consentPrefix}{" "}
          <a href={consentUrl} target="_blank" rel="noopener">
            {t.consentLink}
          </a>
        </span>
      </label>
      {askMarketing && (
        <label className="consent">
          <input type="checkbox" name="marketing" />
          <span>{t.marketing}</span>
        </label>
      )}
      <div ref={captchaRef} className="lead-captcha" />
      <button className="btn btn-primary btn-lg" type="submit" disabled={state === "sending"} data-magnetic>
        {state === "sending" ? t.sending : button || t.submit}
      </button>
      {state === "error" && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
