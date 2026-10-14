import type { MetadataRoute } from "next";
import { LIGHT } from "@/lib/theme";

export default function robots(): MetadataRoute.Robots {
  // светлая копия для опроса закрыта от поисковиков целиком
  if (LIGHT) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }], sitemap: "https://car-city.pro/sitemap.xml" };
}
