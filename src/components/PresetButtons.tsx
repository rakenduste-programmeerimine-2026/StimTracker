"use client";

import { PRESETS, type Preset } from "@/lib/intake/presets";
import { SUBSTANCES } from "@/lib/intake/substances";
import { SUBSTANCE_LABEL } from "@/lib/intake/labels";
import styles from "./PresetButtons.module.css";

type Props = {
  onPick: (preset: Preset) => void;
};

export default function PresetButtons({ onPick }: Props) {
  return (
    <div>
      {SUBSTANCES.map((substance) => (
        <section key={substance} className={styles.group} aria-labelledby={`presets-${substance}`}>
          <h3 id={`presets-${substance}`} className={styles.heading}>
            {SUBSTANCE_LABEL[substance]}
          </h3>
          <div className={styles.grid}>
            {PRESETS.filter((preset) => preset.substance === substance).map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`${styles.button} ${styles[substance]}`}
                onClick={() => onPick(preset)}
                aria-label={`Lisa ${preset.label}, ${preset.amountMg} mg`}
              >
                <span className={styles.label}>{preset.label}</span>
                <span className={styles.meta}>
                  {preset.amountMg} mg · {preset.size}
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
