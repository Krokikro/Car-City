import { HomePage } from "@/components/home/HomePage";
import { homeMeta } from "@/lib/meta";

export const metadata = homeMeta("ru");

export default function Home() {
  return <HomePage lang="ru" />;
}
