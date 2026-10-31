import { draftMode } from "next/headers";
import { refreshOverlay, draftOverlay } from "@/lib/admin/overlay";
import { HomePage } from "@/components/home/HomePage";
import { homeMeta } from "@/lib/meta";
import { buildMeta } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const ov = await refreshOverlay();
  const h = homeMeta("ru");
  return buildMeta({ ov, lang: "ru", path: "/", title: String((h.title as { absolute: string }).absolute), description: String(h.description) });
}

export const revalidate = 300;

export default async function Home() {
  await ((await draftMode()).isEnabled ? draftOverlay() : refreshOverlay());
  return <HomePage lang="ru" />;
}
