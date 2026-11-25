import type { Metadata } from "next";
import AddIntakeView from "@/components/AddIntakeView";

export const metadata: Metadata = { title: "Lisa · StimTracker" };

export default function AddPage() {
  return <AddIntakeView />;
}
