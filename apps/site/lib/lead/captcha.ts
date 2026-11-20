// Яндекс SmartCaptcha в невидимом режиме (PRD 8.1, 14.3). Скрипт грузится только когда сервер
// попросил капчу (подозрительная отправка) и только если задан NEXT_PUBLIC_SMARTCAPTCHA_KEY.
// Только для браузера.

interface SmartCaptchaParams {
  sitekey: string;
  invisible?: boolean;
  hl?: string;
  shieldPosition?: "top-left" | "center-left" | "bottom-left" | "top-right" | "center-right" | "bottom-right";
  callback?: (token: string) => void;
}

interface SmartCaptcha {
  render(container: HTMLElement, params: SmartCaptchaParams): number;
  execute(id?: number): void;
  destroy(id?: number): void;
  subscribe(id: number, event: string, cb: () => void): () => void;
}

declare global {
  interface Window {
    smartCaptcha?: SmartCaptcha;
    __ccCaptchaReady?: () => void;
  }
}

export const CAPTCHA_KEY = process.env.NEXT_PUBLIC_SMARTCAPTCHA_KEY || "";
const SRC = "https://smartcaptcha.yandexcloud.net/captcha.js?render=onload&onload=__ccCaptchaReady";
// Языки интерфейса капчи; кыргызского нет — показываем русский
const HL = new Set(["ru", "en", "kk", "uz"]);

let loading: Promise<SmartCaptcha> | null = null;

function load(): Promise<SmartCaptcha> {
  if (window.smartCaptcha) return Promise.resolve(window.smartCaptcha);
  loading ??= new Promise<SmartCaptcha>((resolve, reject) => {
    const t = setTimeout(() => fail(new Error("captcha timeout")), 8000);
    function fail(e: Error) {
      clearTimeout(t);
      loading = null;
      reject(e);
    }
    window.__ccCaptchaReady = () => {
      clearTimeout(t);
      if (window.smartCaptcha) resolve(window.smartCaptcha);
      else fail(new Error("captcha missing"));
    };
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.onerror = () => fail(new Error("captcha load"));
    document.head.appendChild(s);
  });
  return loading;
}

/** Показывает невидимую капчу (задание — только если Яндекс сочтёт нужным) и возвращает токен. */
export async function solveCaptcha(container: HTMLElement, lang = "ru"): Promise<string> {
  const sc = await load();
  return new Promise<string>((resolve, reject) => {
    const box = document.createElement("div");
    container.appendChild(box);
    let id = -1;
    let settled = false;
    const done = (fn: () => void) => {
      if (settled) return;
      settled = true;
      try {
        sc.destroy(id);
      } catch {}
      box.remove();
      fn();
    };
    id = sc.render(box, {
      sitekey: CAPTCHA_KEY,
      invisible: true,
      hl: HL.has(lang) ? lang : "ru",
      shieldPosition: "bottom-left",
      callback: (token) => done(() => resolve(token)),
    });
    // Окно задания закрывается и после успеха — ждём токен чуть дольше, прежде чем считать отказом
    sc.subscribe(id, "challenge-hidden", () => setTimeout(() => done(() => reject(new Error("captcha closed"))), 800));
    sc.subscribe(id, "network-error", () => done(() => reject(new Error("captcha network"))));
    sc.execute(id);
  });
}
