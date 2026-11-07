import { redirect } from "next/navigation";
import { Shell } from "@/components/admin/Shell";
import { requireUser } from "@/lib/admin/auth";
import { can } from "@/lib/admin/roles";
import { LANGS } from "@/lib/i18n";
import { createPageAction } from "../../actions";
import { LIM } from "@/lib/admin/limits";

export const dynamic = "force-dynamic";
export const metadata = { title: "Новая страница" };

export default async function NewPage({ searchParams }: { searchParams: Promise<{ e?: string; kind?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const pages = can(user, "pages", "write"), articles = can(user, "articles", "write");
  if (!pages && !articles) redirect("/admin?denied=1");
  const article = sp.kind === "article" || !pages;
  return (
    <Shell user={user} active={article ? "articles" : "pages"} title={article ? "Новая статья" : "Новая страница"} sub="Создаётся как черновик, на сайте появится после публикации" flash={sp}>
      <section className="pnl-card">
        <form action={createPageAction} className="pnl-form pnl-narrow">
          <label>Заголовок H1<input name="h1" required maxLength={LIM.h1} /></label>
          <label>Адрес страницы<input name="path" maxLength={LIM.pagePath} placeholder={article ? "/novosti/kak-vybrat-avto" : "/akcii/osen"} required pattern="[A-Za-z0-9_\-./]+" defaultValue={article ? "/novosti/" : ""} /><small>Латиница в нижнем регистре, цифры, дефис и слеш. Без домена. Статьи — в /novosti/.</small></label>
          <label>Тип<select name="kind" defaultValue={article ? "article" : "page"}>{pages && <option value="page">Страница</option>}{articles && <option value="article">Статья в «Новостях»</option>}</select></label>
          <label>Язык<select name="lang">{LANGS.map((l) => <option key={l} value={l}>{l}</option>)}</select></label>
          <button className="pnl-btn pnl-btn-main" type="submit">Создать черновик</button>
        </form>
      </section>
    </Shell>
  );
}
