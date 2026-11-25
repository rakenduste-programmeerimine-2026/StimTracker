import type { Metadata, Viewport } from "next";
import AppShell from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "StimTracker",
  description: "Kofeiini ja nikotiini jälgija",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#14121f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="et">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
