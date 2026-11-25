import BottomNav from "@/components/BottomNav";
import styles from "./AppShell.module.css";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerInner}>StimTracker</div>
      </header>
      <main className={styles.main}>{children}</main>
      <BottomNav />
    </>
  );
}
