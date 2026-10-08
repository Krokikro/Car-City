import { q } from "../db";
import { BASE_FLEET, type FleetPatch } from "./overlay";

export { BASE_FLEET };
export async function patches() {
  const r = await q<{ slug: string; data: FleetPatch }>("SELECT slug, data FROM fleet_overrides");
  return new Map(r.map((x) => [x.slug, x.data]));
}
export async function savePatch(slug: string, data: FleetPatch, by: string) {
  const base = BASE_FLEET.find((c) => c.slug === slug);
  if (!base) throw new Error("Нет такой машины");
  // Хранится только то, что отличается от файла
  const diff: FleetPatch = {};
  if (data.name && data.name !== base.name) diff.name = data.name;
  if (data.price && data.price !== base.price) diff.price = data.price;
  if (data.cls && data.cls !== base.cls) diff.cls = data.cls;
  if ((data.engine ?? "") !== (base.engine ?? "")) diff.engine = data.engine ?? "";
  if ((data.gearbox ?? "") !== (base.gearbox ?? "")) diff.gearbox = data.gearbox ?? "";
  if ((data.badge ?? "") !== (base.badge ?? "")) diff.badge = data.badge ?? "";
  if (data.hidden) diff.hidden = true;
  if (!Object.keys(diff).length) {
    await q("DELETE FROM fleet_overrides WHERE slug=$1", [slug]);
    return diff;
  }
  await q("INSERT INTO fleet_overrides (slug, data, updated_at, updated_by) VALUES ($1,$2,now(),$3) ON CONFLICT (slug) DO UPDATE SET data=$2, updated_at=now(), updated_by=$3", [slug, JSON.stringify(diff), by]);
  return diff;
}
