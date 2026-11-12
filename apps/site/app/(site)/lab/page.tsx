import { Hero } from "@/components/hero/Hero";
import { Header } from "@/components/Header";
export const metadata = { robots: { index: false } };
export default function Lab() {
  return (<><Header /><main><Hero /><div style={{ height: "150vh" }} /></main></>);
}
