import { redirect } from "next/navigation";
import { AuthCard } from "@/components/admin/AuthCard";
import { setupAction } from "../actions";
import { dbEnabled, q1 } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Первый запуск" };

export default async function Setup({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const sp = await searchParams;
  if (!dbEnabled() || !process.env.ADMIN_SETUP_TOKEN) redirect("/admin/login");
  if (Number((await q1<{ n: string }>("SELECT count(*) n FROM users"))!.n) > 0) redirect("/admin/login");
  return (
    <AuthCard title="Первый запуск" sub="Создайте администратора. Код первого запуска лежит в Railway: сервис сайта → Variables → ADMIN_SETUP_TOKEN." flash={sp}>
      <form action={setupAction} className="ad-form" autoComplete="off">
        <label>Код первого запуска<input name="token" type="password" required autoFocus /></label>
        <label>Ваше имя<input name="name" required /></label>
        <label>Почта<input name="email" type="email" autoComplete="username" required /></label>
        <label>Пароль<input name="password" type="password" autoComplete="new-password" minLength={10} required /><small>От 10 символов, буквы и цифры</small></label>
        <label>Пароль ещё раз<input name="password2" type="password" autoComplete="new-password" minLength={10} required /></label>
        <button className="ad-btn ad-btn-main" type="submit">Создать администратора</button>
      </form>
    </AuthCard>
  );
}
