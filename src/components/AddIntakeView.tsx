"use client";

import { useEffect, useState } from "react";
import IntakeForm from "@/components/IntakeForm";
import PresetButtons from "@/components/PresetButtons";
import { formatMg } from "@/lib/intake/labels";
import { addIntake, removeIntake } from "@/lib/intake/store";
import type { Intake, NewIntake } from "@/lib/intake/types";
import styles from "./AddIntakeView.module.css";

const TOAST_MS = 5000;

export default function AddIntakeView() {
  const [lastAdded, setLastAdded] = useState<Intake | null>(null);

  useEffect(() => {
    if (!lastAdded) return;
    const timer = setTimeout(() => setLastAdded(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [lastAdded]);

  function add(input: NewIntake) {
    setLastAdded(addIntake(input));
  }

  function undo() {
    if (lastAdded) removeIntake(lastAdded.id);
    setLastAdded(null);
  }

  return (
    <>
      <h1 className={styles.title}>Lisa</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Kiirvalik</h2>
        <PresetButtons
          onPick={(preset) =>
            add({
              substance: preset.substance,
              amountMg: preset.amountMg,
              label: preset.label,
              takenAt: new Date().toISOString(),
            })
          }
        />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Käsitsi</h2>
        <IntakeForm onSubmit={(intake) => add({ ...intake, takenAt: intake.takenAt.toISOString() })} />
      </section>

      <div role="status" aria-live="polite">
        {lastAdded && (
          <div className={styles.toast}>
            <span>
              Lisatud: {lastAdded.label}, {formatMg(lastAdded.amountMg)}
            </span>
            <button type="button" className={styles.undo} onClick={undo}>
              Võta tagasi
            </button>
          </div>
        )}
      </div>
    </>
  );
}
