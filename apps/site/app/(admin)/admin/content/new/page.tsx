import { Shell } from "@/components/admin/Shell";
import { requireUser } from "@/lib/admin/auth";
import { LANGS } from "@/lib/i18n";
import { createPageAction } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Новая страница" };

export default async function NewPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser({ section: "content", need: "write" });
  return (
    <Shell user={user} active="content" title="Новая страница" sub="Создаётся как черновик, на сайте появится после публикации" flash={sp}>
      <section className="ad-card">
        <form action={createPageAction} className="ad-form ad-narrow">
          <label>Адрес страницы<input name="path" placeholder="/akcii/osen" required pattern="[A-Za-z0-9_\-./]+" /><small>Латиница, цифры, дефис и слеш. Без домена.</small></label>
          <label>Заголовок H1<input name="h1" required /></label>
          <label>Тип<select name="kind"><option value="page">Страница</option><option value="article">Статья в «Новостях»</option></select></label>
          <label>Язык<select name="lang">{LANGS.map((l) => <option key={l} value={l}>{l}</option>)}</select></label>
          <button className="ad-btn ad-btn-main" type="submit">Создать черновик</button>
        </form>
      </section>
    </Shell>
  );
}
