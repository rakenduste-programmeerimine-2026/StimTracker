import { formatAmount, formatMg, SUBSTANCE_LABEL } from "@/lib/intake/labels";
import type { SubstanceSummary } from "@/lib/intake/today";
import styles from "./SubstanceCard.module.css";

// A tall level that drains as the substance leaves the body: full right
// after a dose, half-way after one half-life.
export default function SubstanceCard({ summary }: { summary: SubstanceSummary }) {
  const { substance, count, takenMg, remainingMg, remainingShare } = summary;
  const name = SUBSTANCE_LABEL[substance];
  const percent = remainingShare === null ? 0 : Math.round(remainingShare * 100);
  // Text that sits on top of the solid level switches to the contrast colour.
  const gaugeClass = [styles.gauge, percent >= 72 && styles.readingOnFill, percent >= 14 && styles.nameOnFill]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={`${styles.card} ${styles[substance]}`} aria-labelledby={`card-${substance}`}>
      <div
        className={gaugeClass}
        role="meter"
        aria-label={`${name}: tänasest kogusest kehas`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${percent}%`}
      >
        {percent > 0 && <div className={styles.fill} style={{ height: `${percent}%` }} />}
        <div className={styles.reading}>
          <span className={styles.value}>
            {formatAmount(remainingMg)}
            <span className={styles.unit}>mg</span>
          </span>
          <span className={styles.caption}>{count === 0 ? "Täna pole veel lisatud." : "praegu kehas"}</span>
        </div>
        <h2 id={`card-${substance}`} className={styles.name}>
          {name}
        </h2>
      </div>
      {count > 0 && (
        <dl className={styles.facts}>
          <div>
            <dt>Täna kokku</dt>
            <dd>{formatMg(takenMg)}</dd>
          </div>
          <div>
            <dt>Kehas veel</dt>
            <dd>{percent}%</dd>
          </div>
          <div>
            <dt>Kordi</dt>
            <dd>{count === 1 ? "1 kord" : `${count} korda`}</dd>
          </div>
        </dl>
      )}
    </article>
  );
}
