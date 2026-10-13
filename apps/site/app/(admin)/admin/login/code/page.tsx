import { redirect } from "next/navigation";
import { AuthCard } from "@/components/admin/AuthCard";
import { codeAction, logoutAction } from "../../actions";
import { getSession } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Код подтверждения" };

export default async function Code({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const sp = await searchParams;
  const s = await getSession();
  if (!s) redirect("/admin/login");
  if (s.stage === "full") redirect("/admin");
  return (
    <AuthCard title="Код из приложения" sub="Откройте приложение-аутентификатор и введите шестизначный код для Car City." flash={sp}>
      <form action={codeAction} className="ad-form">
        <label>Код<input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} required autoFocus className="ad-code" /></label>
        <button className="ad-btn ad-btn-main" type="submit">Подтвердить</button>
      </form>
      <form action={logoutAction}><button className="ad-link" type="submit">Назад ко входу</button></form>
    </AuthCard>
  );
}
