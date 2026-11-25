import BottomNav from "@/components/BottomNav";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "./AppShell.module.css";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <span className={styles.brand}>StimTracker</span>
          <ThemeToggle />
        </div>
      </header>
      <main className={styles.main}>{children}</main>
      <BottomNav />
    </>
  );
}
