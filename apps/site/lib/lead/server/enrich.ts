// Автозаполнение заявки на сервере: язык версии сайта, город по IP, источник (канал, кампания, ключевая фраза).
import { LANGS } from "@/lib/i18n";
import { attribute } from "../source";
import type { Lead } from "../types";
import { geoLookup } from "./geo";

/** Язык версии сайта по адресу страницы: /en/..., /ky/... или русский */
export function langOfPage(page?: string): string {
  try {
    const p = page ? new URL(page, "https://car-city.pro").pathname : "/";
    const first = p.split("/")[1];
    return (LANGS as readonly string[]).includes(first) ? first : "ru";
  } catch { return "ru"; }
}

export async function enrichLead(lead: Lead): Promise<Lead> {
  lead.lang = lead.lang && (LANGS as readonly string[]).includes(lead.lang) ? lead.lang : langOfPage(lead.page);
  lead.attr = attribute(lead.first, lead.last);
  // базу городов ждём не дольше 1,5 с, чтобы не задерживать ответ; если не успели — город дозаполнится в админке
  lead.geo = (await geoLookup(lead.ip, 1500)) ?? undefined;
  lead.origin ??= lead.source === "chat" ? "chat" : "form";
  return lead;
}
