import Link from "next/link";
import { Shell } from "@/components/admin/Shell";
import { GraphicSlot } from "@/components/admin/GraphicSlot";
import { requireUser } from "@/lib/admin/auth";
import { can } from "@/lib/admin/roles";
import { getSetting } from "@/lib/admin/store";
import { families, GROUP_ORDER, recommend } from "@/lib/media/families";
import { s3Enabled } from "@/lib/media/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Графика сайта" };

const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} МБ` : `${Math.round(n / 1024)} КБ`);

export default async function Graphics({ searchParams }: { searchParams: Promise<{ q?: string; only?: string; g?: string; e?: string; ok?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser({ section: "media" });
  const write = can(user, "media", "write");
  const assets = ((await getSetting<Record<string, string>>("assets")) ?? {}) as Record<string, string>;
  const q = (sp.q ?? "").trim().toLowerCase();
  const list = families().filter((f) => (!q || f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q)) && (!sp.only || f.variants.some((v) => assets[v.path])));
  const groups = GROUP_ORDER.map((g) => [g, list.filter((f) => f.group === g)] as const).filter(([, l]) => l.length);
  const replacedN = families().filter((f) => f.variants.some((v) => assets[v.path])).length;

  return (
    <Shell user={user} active="graphics" title="Графика сайта" sub="Все картинки и видео сайта. У каждого места указан нужный размер и формат: замена нарезается во всех размерах автоматически, поэтому вёрстка не ломается." flash={sp}
      actions={<a className="pnl-btn" href="/" target="_blank" rel="noreferrer">Посмотреть сайт ↗</a>}>
      <form className="pnl-card pnl-filters" action="/admin/graphics">
        <label className="pnl-grow">Поиск<input name="q" defaultValue={sp.q} placeholder="Например: Belgee, видео, команда" maxLength={60} /></label>
        <label className="pnl-check"><input type="checkbox" name="only" value="1" defaultChecked={Boolean(sp.only)} /> Только заменённые ({replacedN})</label>
        <div className="pnl-filter-btns"><button className="pnl-btn pnl-btn-main" type="submit">Показать</button>{(sp.q || sp.only) && <Link className="pnl-btn" href="/admin/graphics">Сбросить</Link>}</div>
      </form>
      {!s3Enabled() && <p className="pnl-msg pnl-warn">Хранилище файлов (бакет) не подключено — замены сохраняются в базе. Для видео подключите бакет Railway.</p>}
      {groups.map(([g, fams]) => (
        <details key={g} className="pnl-card pnl-tgroup" open={Boolean(q || sp.only) || groups.length === 1}>
          <summary><b>{g}</b> <span className="pnl-muted">{fams.length} мест{fams.some((f) => f.variants.some((v) => assets[v.path])) ? ` · заменено ${fams.filter((f) => f.variants.some((v) => assets[v.path])).length}` : ""}</span></summary>
          <div className="pnl-slots">
            {fams.map((f) => {
              const small = [...f.variants].sort((a, b) => (a.w ?? 0) - (b.w ?? 0))[f.kind === "video" ? 0 : 0];
              const prevVar = f.variants.find((v) => v.fmt === "webp" && (v.w ?? 0) <= 700) ?? f.variants.find((v) => v.fmt !== "avif") ?? small;
              const replaced = f.variants.some((v) => assets[v.path]);
              return (
                <GraphicSlot key={`${f.key}|${f.kind}`} k={f.key} kind={f.kind} label={f.label} rec={recommend(f)} preview={assets[prevVar.path] ?? prevVar.path} replaced={replaced} canWrite={write}
                  accept={f.kind === "video" ? "video/mp4,video/webm" : f.svg ? "image/svg+xml,.svg" : "image/jpeg,image/png,image/webp,image/avif"}
                  info={`Сейчас: ${f.variants.length > 1 ? `${f.variants.length} варианта (${[...new Set(f.variants.map((v) => `${v.w}px`))].join(", ")}; ${f.formats.join(", ")})` : `${f.formats[0]}, ${kb(f.variants[0].bytes)}`} · ${f.key.split("/").slice(0, 2).join("/")}/…`} />
              );
            })}
          </div>
        </details>
      ))}
      {groups.length === 0 && <p className="pnl-muted">Ничего не найдено.</p>}
    </Shell>
  );
}
