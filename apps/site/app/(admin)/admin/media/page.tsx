import { Shell } from "@/components/admin/Shell";
import { CopyButton, MediaUploader } from "@/components/admin/MediaUploader";
import { requireUser } from "@/lib/admin/auth";
import { can } from "@/lib/admin/roles";
import { q } from "@/lib/db";
import { fmt } from "@/lib/admin/format";
import { deleteMediaAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Медиатека" };

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser({ section: "media" });
  const write = can(user.role, "media", "write");
  const items = await q<{ id: string; name: string; w: number | null; h: number | null; size: number; at: string; by: string | null }>("SELECT id, name, w, h, size, at, by FROM media ORDER BY at DESC LIMIT 300");
  return (
    <Shell user={user} active="media" title="Медиатека" sub="Картинки для страниц. Вставляются в текст кнопкой «Картинка» в редакторе." flash={sp}>
      {write && <MediaUploader />}
      {items.length === 0 ? <p className="ad-muted">Пока ничего не загружено.</p> : (
        <ul className="ad-grid ad-grid-media">
          {items.map((m) => (
            <li key={m.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <a href={`/media/${m.id}`} target="_blank" rel="noreferrer"><img src={`/media/${m.id}`} alt={m.name} loading="lazy" /></a>
              <span title={m.name}>{m.name}</span>
              <small>{m.w}×{m.h} · {Math.round(m.size / 1024)} КБ · {fmt(m.at)}</small>
              <div className="ad-row">
                <CopyButton text={`/media/${m.id}`} />
                {write && <form action={deleteMediaAction}><input type="hidden" name="id" value={m.id} /><button className="ad-btn ad-btn-sm ad-btn-warn" type="submit">Удалить</button></form>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}
