import { ChatsView } from "../view";
export const dynamic = "force-dynamic";
export const metadata = { title: "Чат" };
export default async function Chat({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  return <ChatsView id={(await params).id} sp={await searchParams} />;
}
