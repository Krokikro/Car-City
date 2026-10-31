import { redirect } from "next/navigation";
import { AuthCard } from "@/components/admin/AuthCard";
import { loginAction } from "../actions";
import { dbEnabled, q1 } from "@/lib/db";
import { getSession } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Вход" };

export default async function Login({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string }> }) {
  const sp = await searchParams;
  if (!dbEnabled()) return <AuthCard title="Вход" flash={{ e: "База данных не подключена: добавьте переменную DATABASE_URL." }}><p className="au-sub">Пока её нет, сайт работает из файлов, а админка выключена.</p></AuthCard>;
  const s = await getSession();
  if (s?.stage === "full") redirect("/admin");
  const none = Number((await q1<{ n: string }>("SELECT count(*) n FROM users"))!.n) === 0;
  if (none && process.env.ADMIN_SETUP_TOKEN) redirect("/admin/setup");
  return (
    <AuthCard title="Вход" sub="Рабочее место Car City" flash={sp}>
      <form action={loginAction} className="ad-form">
        <label>Почта<input name="email" type="email" autoComplete="username" required autoFocus /></label>
        <label>Пароль<input name="password" type="password" autoComplete="current-password" required /></label>
        <button className="ad-btn ad-btn-main" type="submit">Войти</button>
      </form>
      {none && <p className="au-sub">Пользователей пока нет. Чтобы создать первого администратора, задайте в Railway переменную ADMIN_SETUP_TOKEN.</p>}
    </AuthCard>
  );
}
