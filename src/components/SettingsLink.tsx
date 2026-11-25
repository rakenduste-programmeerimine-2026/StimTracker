import Link from "next/link";
import styles from "./ThemeToggle.module.css";

export default function SettingsLink() {
  return (
    <Link href="/settings" className={styles.toggle} aria-label="Seaded">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
        <circle cx="16" cy="6" r="2" />
        <circle cx="10" cy="12" r="2" />
        <circle cx="18" cy="18" r="2" />
      </svg>
    </Link>
  );
}
