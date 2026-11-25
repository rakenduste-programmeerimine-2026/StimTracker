"use client";

import { dismissIntakeError, useIntakes } from "@/lib/intake/store";
import styles from "./IntakeErrorBanner.module.css";

// Shows a failed add or delete. A failed load is shown on the page itself.
export default function IntakeErrorBanner() {
  const { status, error } = useIntakes();
  if (!error || status === "error") return null;

  return (
    <div className={styles.banner} role="alert">
      <p>{error}</p>
      <button type="button" onClick={dismissIntakeError}>
        Sulge
      </button>
    </div>
  );
}
