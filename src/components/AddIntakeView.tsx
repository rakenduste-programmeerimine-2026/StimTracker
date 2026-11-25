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
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!lastAdded) return;
    const timer = setTimeout(() => setLastAdded(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [lastAdded]);

  async function add(input: NewIntake) {
    const saved = await addIntake(input);
    // On failure the store shows an error banner instead.
    if (saved) setLastAdded(saved);
  }

  function undo() {
    if (lastAdded) void removeIntake(lastAdded.id);
    setLastAdded(null);
  }

  return (
    <>
      <h1 className={styles.title}>Lisa</h1>

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

      <div className={styles.more}>
        <button
          type="button"
          className={styles.moreButton}
          aria-expanded={showForm}
          aria-controls="manual-intake"
          onClick={() => setShowForm((open) => !open)}
        >
          Muu kogus või aeg
          <svg className={styles.chevron} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        {showForm && (
          <div id="manual-intake" className={styles.formWrap}>
            <IntakeForm onSubmit={(intake) => void add({ ...intake, takenAt: intake.takenAt.toISOString() })} />
          </div>
        )}
      </div>

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
