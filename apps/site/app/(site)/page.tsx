import { draftMode } from "next/headers";
import { refreshOverlay, draftOverlay } from "@/lib/admin/overlay";
import { HomePage } from "@/components/home/HomePage";
import { homeMeta } from "@/lib/meta";

export const metadata = homeMeta("ru");

export const revalidate = 300;

export default async function Home() {
  await ((await draftMode()).isEnabled ? draftOverlay() : refreshOverlay());
  return <HomePage lang="ru" />;
}
