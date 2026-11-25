import { signOut } from "@/app/login/actions";
import styles from "./ThemeToggle.module.css";

// Logs out through the server action, which clears the session cookie and
// opens /login.
export default function SignOutButton() {
  return (
    <form action={signOut}>
      <button type="submit" className={styles.toggle} aria-label="Logi välja">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      </button>
    </form>
  );
}
