import { notFound } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/admin/Shell";
import { PageEditor } from "@/components/admin/PageEditor";
import { requireUser } from "@/lib/admin/auth";
import { can, sectionOfKind } from "@/lib/admin/roles";
import { redirect } from "next/navigation";
import { cleanPath, fileData, isLangId, rowOf, versions } from "@/lib/admin/pages";
import { fmt, localInput } from "@/lib/admin/format";
import { pageToolAction } from "../../actions";
import { GraphicSlot } from "@/components/admin/GraphicSlot";
import { getSetting } from "@/lib/admin/store";
import { families, recommend } from "@/lib/media/families";

export const dynamic = "force-dynamic";
export const metadata = { title: "Редактор страницы" };

export default async function Edit({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string; lang?: string; path?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const lang = sp.lang ?? "ru";
  const path = cleanPath(sp.path ?? "");
  if (!isLangId(lang) || !path) notFound();
  const row = await rowOf(lang, path);
  const file = fileData(lang, path);
  // перевода ещё нет: за основу берём русский текст
  const base = file ?? (lang !== "ru" ? fileData("ru", path) : null);
  const cur = row?.draft ?? row?.published ?? base;
  if (!cur) notFound();
  const kind = (file ?? base)?.kind ?? ("kind" in cur && cur.kind ? cur.kind : "page");
  const sec = sectionOfKind(kind);
  if (!can(user, sec, "read")) redirect("/admin?denied=1");
  const write = can(user, sec, "write");
  const seoWrite = can(user, "seo", "write") || kind === "article";
  const vers = await versions(lang, path);
  const state = row?.publish_at ? `Запланировано на ${fmt(row.publish_at, true)} (МСК)` : row?.draft ? "Есть неопубликованный черновик" : row?.published?.hidden ? "Снята с публикации" : row?.published ? "Опубликована с правками" : file ? "Как в исходном тексте сайта" : "Перевода нет, показан русский текст";
  const siteHref = lang === "ru" ? path : `/${lang}${path}`;
  // Обложка статьи — прямо в редакторе (правка 06.11): те же места, что в «Графика сайта → Обложки статей»
  const slug = path.split("/").pop() ?? "";
  const covers = kind === "article" ? families().filter((f) => f.kind === "image" && (f.key === `/news/${slug}` || f.key === `/news-light/${slug}`)) : [];
  const coverWrite = can(user, "media", "write");
  const assets = covers.length ? (((await getSetting<Record<string, string>>("assets")) ?? {}) as Record<string, string>) : {};

  return (
    <Shell user={user} active={sec} title={cur.h1 || path} sub={`${path} · ${state}`} flash={sp}
      back={[`/admin/content?lang=${lang}&kind=${kind}`, kind === "article" ? "Статьи и блог" : "Страницы"]}
      actions={<>
        {can(user, "seo", "read") && <Link className="pnl-btn" href={`/admin/seo/page?lang=${lang}&path=${encodeURIComponent(path)}`}>SEO</Link>}
        <a className="pnl-btn" href={siteHref} target="_blank" rel="noreferrer">Посмотреть на сайте ↗</a>
        {write && <>
          <span className="pnl-sep" aria-hidden="true" />
          <button className="pnl-btn" type="submit" form="ed-form" name="intent" value="draft" title="Ctrl/⌘+S">Сохранить черновик</button>
          <button className="pnl-btn pnl-btn-main" type="submit" form="ed-form" name="intent" value="publish">Опубликовать</button>
        </>}
      </>}>
      <PageEditor
        lang={lang} path={path} kind={kind} readOnly={!write} seoReadOnly={!seoWrite}
        initial={{ title: cur.title, h1: cur.h1, description: cur.description ?? "", body: cur.body }}
        hasDraft={Boolean(row?.draft)} publishAt={localInput(row?.publish_at)} hidden={Boolean(row?.published?.hidden && !row?.draft)}
        previewTo={siteHref}
      />
      {kind === "article" && (
        <section className="pnl-card">
          <h2>Обложка статьи</h2>
          {covers.length === 0 ? (
            <p className="pnl-muted">У этой статьи пока нет своей обложки — на сайте показывается первая картинка из текста. Обложку можно добавить в разделе «Графика сайта».</p>
          ) : (
            <div className="pnl-slots">
              {covers.map((f) => {
                const prevVar = f.variants.find((v) => v.fmt === "webp" && (v.w ?? 0) <= 700) ?? f.variants.find((v) => v.fmt !== "avif") ?? f.variants[0];
                return (
                  <GraphicSlot key={f.key} k={f.key} kind={f.kind} label={f.key.startsWith("/news-light/") ? "Светлая версия сайта" : "Тёмная версия сайта"} rec={recommend(f)}
                    preview={assets[prevVar.path] ?? prevVar.path} replaced={f.variants.some((v) => assets[v.path])} canWrite={coverWrite}
                    accept={f.svg ? "image/svg+xml,.svg" : "image/jpeg,image/png,image/webp,image/avif"} compact />
                );
              })}
            </div>
          )}
        </section>
      )}
      {write && (
        <details className="pnl-card">
          <summary>Версии и сброс</summary>
          <div className="pnl-tools-row">
            {row?.draft && <form action={pageToolAction}><input type="hidden" name="lang" value={lang} /><input type="hidden" name="path" value={path} /><input type="hidden" name="act" value="discard" /><input type="hidden" name="kind" value={kind} /><button className="pnl-btn" type="submit">Отбросить черновик</button></form>}
            {row && file && <form action={pageToolAction}><input type="hidden" name="lang" value={lang} /><input type="hidden" name="path" value={path} /><input type="hidden" name="act" value="reset" /><input type="hidden" name="kind" value={kind} /><button className="pnl-btn pnl-btn-warn" type="submit">Вернуть исходный текст сайта</button></form>}
          </div>
          <h3>История публикаций</h3>
          {vers.length === 0 ? <p className="pnl-muted">Публикаций из админки пока не было.</p> : (
            <ul className="pnl-list">
              {vers.map((v) => (
                <li key={v.id}>
                  <span><b>{fmt(v.at, true)}</b> · {v.by ?? "—"} · {v.note ?? ""}<br /><span className="pnl-muted">{v.data.h1}</span></span>
                  <form action={pageToolAction}><input type="hidden" name="lang" value={lang} /><input type="hidden" name="path" value={path} /><input type="hidden" name="act" value="rollback" /><input type="hidden" name="kind" value={kind} /><input type="hidden" name="version" value={v.id} /><button className="pnl-btn" type="submit">В черновик</button></form>
                </li>
              ))}
            </ul>
          )}
        </details>
      )}
    </Shell>
  );
}
