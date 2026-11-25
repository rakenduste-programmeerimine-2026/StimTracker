import type { Metadata } from "next";
import SettingsView from "@/components/SettingsView";

export const metadata: Metadata = { title: "Seaded · StimTracker" };

export default function SettingsPage() {
  return <SettingsView />;
}
