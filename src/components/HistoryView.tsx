"use client";

import Link from "next/link";
import { useState } from "react";
import { useNow } from "@/lib/hooks/useNow";
import { formatMg, SUBSTANCE_LABEL } from "@/lib/intake/labels";
import { isPending, loadIntakes, removeIntake, useIntakes } from "@/lib/intake/store";
import { todaysIntakes } from "@/lib/intake/today";
import styles from "./HistoryView.module.css";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("et-EE", { hour: "2-digit", minute: "2-digit" });
}

type Props = {
  // Injected in tests so "now" is fixed.
  now?: Date;
};

export default function HistoryView(props: Props) {
  const { intakes, status, error } = useIntakes();
  const liveNow = useNow();
  const now = props.now ?? liveNow;
  // Id of the intake whose delete is waiting for confirmation.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (!now) {
    return <h1 className={styles.title}>Ajalugu</h1>;
  }

  const today = todaysIntakes(intakes, now);

  function confirmDelete(id: string) {
    void removeIntake(id);
    setConfirmingId(null);
  }

  return (
    <>
      <h1 className={styles.title}>Ajalugu</h1>

      {status === "error" ? (
        <div className={styles.loadError} role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => void loadIntakes()}>
            Proovi uuesti
          </button>
        </div>
      ) : status !== "ready" ? (
        <p className={styles.empty} role="status">
          Laen tänaseid kirjeid…
        </p>
      ) : today.length === 0 ? (
        <p className={styles.empty}>
          Täna pole veel midagi lisatud. <Link href="/add">Lisa</Link>
        </p>
      ) : (
        <ul className={styles.list} aria-label="Tänased kirjed">
          {today.map((intake) => {
            const description = `${intake.label}, ${formatMg(intake.amountMg)} kell ${formatTime(intake.takenAt)}`;
            return (
              <li
                key={intake.id}
                className={intake.substance === "nicotine" ? `${styles.item} ${styles.nicotineItem}` : styles.item}
              >
                <span className={styles.time}>{formatTime(intake.takenAt)}</span>
                <span className={styles.what}>
                  <span className={styles.label}>{intake.label}</span>
                  <span className={styles.amount}>
                    {formatMg(intake.amountMg)} {SUBSTANCE_LABEL[intake.substance].toLowerCase()}
                  </span>
                </span>
                <span className={styles.actions}>
                  {isPending(intake.id) ? (
                    <span className={styles.saving}>Salvestan…</span>
                  ) : confirmingId === intake.id ? (
                    <>
                      <button
                        type="button"
                        className={styles.confirm}
                        onClick={() => confirmDelete(intake.id)}
                        aria-label={`Kinnita: kustuta ${description}`}
                      >
                        Kustuta
                      </button>
                      <button type="button" className={styles.cancel} onClick={() => setConfirmingId(null)}>
                        Loobu
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className={styles.delete}
                      onClick={() => setConfirmingId(intake.id)}
                      aria-label={`Kustuta ${description}`}
                    >
                      Kustuta
                    </button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
