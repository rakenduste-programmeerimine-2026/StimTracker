import type { Metadata } from "next";
import HistoryView from "@/components/HistoryView";

export const metadata: Metadata = { title: "Ajalugu · StimTracker" };

export default function HistoryPage() {
  return <HistoryView />;
}
