import AppShell from "@/components/AppShell";

// Pages for logged-in users: header, bottom navigation.
export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}
