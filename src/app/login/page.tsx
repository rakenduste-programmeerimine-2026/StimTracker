import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "./login.module.css";

export const metadata: Metadata = { title: "Logi sisse · StimTracker" };

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <div className={styles.top}>
        <ThemeToggle />
      </div>
      <div className={styles.intro}>
        <div className={styles.levels} aria-hidden="true">
          <span />
          <span />
        </div>
        <h1 className={styles.title}>StimTracker</h1>
        <p className={styles.lead}>Vaata, kui palju kofeiini ja nikotiini on sinus praegu.</p>
      </div>
      <LoginForm />
    </main>
  );
}
