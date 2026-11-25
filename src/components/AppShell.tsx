import BottomNav from "@/components/BottomNav";
import IntakeErrorBanner from "@/components/IntakeErrorBanner";
import SignOutButton from "@/components/SignOutButton";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "./AppShell.module.css";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <span className={styles.brand}>StimTracker</span>
          <div className={styles.actions}>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className={styles.main}>
        <IntakeErrorBanner />
        {children}
      </main>
      <BottomNav />
    </>
  );
}
