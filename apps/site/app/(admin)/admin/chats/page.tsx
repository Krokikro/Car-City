import { ChatsView } from "./view";
export const dynamic = "force-dynamic";
export const metadata = { title: "Чаты" };
export default async function Chats({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  return <ChatsView sp={await searchParams} />;
}
