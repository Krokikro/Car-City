import { AuthCard } from "@/components/admin/AuthCard";
import { inviteAcceptAction } from "../../actions";
import { dbEnabled, q1 } from "@/lib/db";
import { sha256 } from "@/lib/admin/crypto";

export const dynamic = "force-dynamic";
export const metadata = { title: "Приглашение" };

export default async function Invite({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ e?: string }> }) {
  const { token } = await params;
  const sp = await searchParams;
  const u = dbEnabled() ? await q1<{ email: string; name: string; role: string }>("SELECT coalesce(u.login, u.email) AS email, u.name, coalesce(r.name, u.role) AS role FROM users u LEFT JOIN roles r ON r.id=u.role WHERE u.invite_hash=$1 AND u.invite_until > now() AND u.active", [sha256(token)]) : undefined;
  if (!u) return <AuthCard title="Ссылка не действует" sub="Она устарела или уже использована. Попросите администратора выдать новую." />;
  return (
    <AuthCard title="Добро пожаловать" sub={`${u.email} · ${u.role}. Придумайте пароль для входа.`} flash={sp}>
      <form action={inviteAcceptAction} className="ad-form" autoComplete="off">
        <input type="hidden" name="token" value={token} />
        <label>Пароль<input name="password" type="password" autoComplete="new-password" minLength={10} required autoFocus /><small>От 10 символов, буквы и цифры</small></label>
        <label>Пароль ещё раз<input name="password2" type="password" autoComplete="new-password" minLength={10} required /></label>
        <button className="ad-btn ad-btn-main" type="submit">Сохранить и войти</button>
      </form>
    </AuthCard>
  );
}
