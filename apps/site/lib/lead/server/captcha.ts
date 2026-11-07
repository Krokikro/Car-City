// Серверная проверка токена Яндекс SmartCaptcha. Без SMARTCAPTCHA_SERVER_KEY капча выключена.

export const captchaEnabled = () => Boolean(process.env.SMARTCAPTCHA_SERVER_KEY);

/**
 * true — токен принят. Если сервис капчи недоступен, пропускаем заявку (так советует Яндекс):
 * упавшая интеграция не должна ломать приём заявок (PRD 11).
 */
export async function verifyCaptcha(token: string, ip: string): Promise<{ ok: boolean; degraded?: boolean }> {
  const secret = process.env.SMARTCAPTCHA_SERVER_KEY;
  if (!secret) return { ok: true };
  if (!token) return { ok: false };
  try {
    const res = await fetch("https://smartcaptcha.yandexcloud.net/validate", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, token, ip }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { ok: true, degraded: true };
    const json = (await res.json()) as { status?: string };
    return { ok: json.status === "ok" };
  } catch {
    return { ok: true, degraded: true };
  }
}
