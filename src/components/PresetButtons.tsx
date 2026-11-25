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
        <section
          key={substance}
          className={`${styles.group} ${styles[substance]}`}
          aria-labelledby={`presets-${substance}`}
        >
          <h3 id={`presets-${substance}`} className={styles.heading}>
            {SUBSTANCE_LABEL[substance]}
          </h3>
          <div className={styles.grid}>
            {PRESETS.filter((preset) => preset.substance === substance).map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={styles.button}
                onClick={() => onPick(preset)}
                aria-label={`Lisa ${preset.label}, ${preset.amountMg} mg`}
              >
                <span className={styles.label}>{preset.label}</span>
                <span className={styles.size}>{preset.size}</span>
                <span className={styles.amount}>
                  {preset.amountMg}
                  <span className={styles.unit}>mg</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
