import QRCode from "qrcode";
import { Shell } from "@/components/admin/Shell";
import { requireUser, twoFaRequired } from "@/lib/admin/auth";
import { totpUri } from "@/lib/admin/crypto";
import { unseal } from "@/lib/admin/crypto";
import { changePasswordAction, enrollConfirmAction, enrollStartAction, signOutAllAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Безопасность" };

export default async function Security({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string; enroll?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser({ allowNoTotp: true });
  let qr = "";
  let secret = "";
  if (user.totpSecret && !user.totpOn) {
    secret = unseal(user.totpSecret);
    qr = await QRCode.toDataURL(totpUri(secret, user.email), { margin: 1, width: 220 });
  }
  return (
    <Shell user={user} active="security" title="Безопасность" sub={user.email} flash={sp}>
      <section className="ad-card">
        <h2>Двухфакторная защита</h2>
        {user.totpOn ? (
          <p>Включена. При каждом входе нужен код из приложения-аутентификатора.</p>
        ) : (
          <>
            {twoFaRequired() && <p className="ad-msg ad-err">Чтобы пользоваться админкой, подключите 2FA: так доступ не получат, даже если пароль утечёт.</p>}
            {!secret ? (
              <form action={enrollStartAction}>
                <p>Понадобится приложение вроде Google Authenticator, Яндекс Ключ или 2FAS.</p>
                <button className="ad-btn ad-btn-main" type="submit">Подключить</button>
              </form>
            ) : (
              <div className="ad-enroll">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} width={220} height={220} alt="QR-код для приложения-аутентификатора" />
                <div>
                  <ol>
                    <li>Откройте приложение и добавьте аккаунт, отсканировав код.</li>
                    <li>Если сканировать нечем, введите ключ вручную: <code className="ad-key">{secret.match(/.{1,4}/g)?.join(" ")}</code></li>
                    <li>Введите шесть цифр из приложения.</li>
                  </ol>
                  <form action={enrollConfirmAction} className="ad-inline">
                    <input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} required className="ad-code" aria-label="Код из приложения" />
                    <button className="ad-btn ad-btn-main" type="submit">Включить</button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </section>
      <section className="ad-card">
        <h2>Пароль</h2>
        <form action={changePasswordAction} className="ad-form ad-narrow" autoComplete="off">
          <label>Текущий пароль<input name="old" type="password" autoComplete="current-password" required /></label>
          <label>Новый пароль<input name="password" type="password" autoComplete="new-password" minLength={10} required /><small>От 10 символов, буквы и цифры</small></label>
          <label>Новый пароль ещё раз<input name="password2" type="password" autoComplete="new-password" minLength={10} required /></label>
          <button className="ad-btn" type="submit">Сменить пароль</button>
        </form>
      </section>
      <section className="ad-card">
        <h2>Сеансы</h2>
        <p>Если потеряли телефон или вошли на чужом компьютере, завершите все сеансы.</p>
        <form action={signOutAllAction}><button className="ad-btn" type="submit">Выйти на всех устройствах</button></form>
      </section>
    </Shell>
  );
}
