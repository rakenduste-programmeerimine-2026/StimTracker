import { formatAmount, formatMg, SUBSTANCE_LABEL } from "@/lib/intake/labels";
import type { SubstanceSummary } from "@/lib/intake/today";
import { limitStatus } from "@/lib/settings/limits";
import styles from "./SubstanceCard.module.css";

// A tall level that drains as the substance leaves the body: full right
// after a dose, half-way after one half-life.
type Props = {
  summary: SubstanceSummary;
  // Daily limit from the settings page, null for none.
  limitMg?: number | null;
};

export default function SubstanceCard({ summary, limitMg = null }: Props) {
  const { substance, count, takenMg, remainingMg, remainingShare } = summary;
  const name = SUBSTANCE_LABEL[substance];
  const limit = limitStatus(takenMg, limitMg);
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
      {limit.level !== "none" && limit.limitMg !== null && (
        <div className={`${styles.limit} ${styles[limit.level] ?? ""}`}>
          <div
            className={styles.limitBar}
            role="meter"
            aria-label={`${name}: päevalimiidist kasutatud`}
            aria-valuemin={0}
            aria-valuemax={limit.limitMg}
            aria-valuenow={Math.round(takenMg)}
            aria-valuetext={`${formatAmount(takenMg)} / ${formatMg(limit.limitMg)}`}
          >
            <span style={{ width: `${Math.min(1, limit.share ?? 0) * 100}%` }} />
          </div>
          <p className={styles.limitText}>
            <span>
              {formatAmount(takenMg)} / {formatMg(limit.limitMg)}
            </span>
            <strong>
              {limit.level === "over" ? `${formatMg(limit.overMg)} üle limiidi` : `${formatMg(limit.leftMg)} jäänud`}
            </strong>
          </p>
        </div>
      )}
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
