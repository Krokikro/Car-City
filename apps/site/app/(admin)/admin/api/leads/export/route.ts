import { NextResponse } from "next/server";
import { audit, requireUser } from "@/lib/admin/auth";
import { EXPORT_COLS, backfillLeads, exportRow, leadReport, listLeads, periodRange, reportSheets, type LeadFilter } from "@/lib/admin/leads";
import { csv, xlsx } from "@/lib/admin/xlsx";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Выгрузка заявок (kind=list) или отчёта (kind=report) за период с фильтрами: CSV, Excel или JSON.
export async function GET(req: Request) {
  const user = await requireUser({ section: "leads" });
  const sp = Object.fromEntries(new URL(req.url).searchParams) as LeadFilter & { format?: string; kind?: string };
  const format = ["csv", "xlsx", "json"].includes(sp.format ?? "") ? sp.format! : "xlsx";
  await backfillLeads(500).catch(() => 0);
  const range = sp.period && sp.period !== "custom" ? periodRange(sp.period) : { from: sp.from, to: sp.to };
  const title = range.from || range.to ? `${range.from ?? "…"} — ${range.to ?? "…"}` : "всё время";
  const stamp = (range.from || range.to ? `${range.from ?? ""}_${range.to ?? ""}` : "vse").replace(/[^\d_a-z-]/g, "");
  let body: BodyInit;
  let type: string;
  let name: string;
  if (sp.kind === "report") {
    const r = await leadReport(user, sp);
    const sheets = reportSheets(r, title);
    name = `otchet-zayavki-${stamp}`;
    if (format === "json") { body = JSON.stringify({ period: title, ...r }, null, 2); type = "application/json"; }
    else if (format === "csv") { body = csv(sheets.flatMap((s) => [[s.name], ...s.rows, []])); type = "text/csv; charset=utf-8"; }
    else { body = Buffer.from(xlsx(sheets)); type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"; }
  } else {
    const { rows } = await listLeads(user, sp, 20000, 0);
    name = `zayavki-${stamp}`;
    if (format === "json") { body = JSON.stringify(rows.map((r) => ({ ...r.data, status: r.status, reason: r.reason, comment: r.comment, assignee: r.assignee_name })), null, 2); type = "application/json"; }
    else {
      const table = [EXPORT_COLS, ...rows.map(exportRow)];
      if (format === "csv") { body = csv(table); type = "text/csv; charset=utf-8"; }
      else { body = Buffer.from(xlsx([{ name: "Заявки", rows: table }])); type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"; }
    }
  }
  await audit(user, sp.kind === "report" ? "Выгружен отчёт по заявкам" : "Выгружены заявки", "lead", format, undefined, { period: title });
  return new NextResponse(body, { headers: { "content-type": type, "content-disposition": `attachment; filename="${name}.${format}"`, "cache-control": "no-store" } });
}
