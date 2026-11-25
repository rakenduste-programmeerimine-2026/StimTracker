import { formatMg, SUBSTANCE_LABEL } from "@/lib/intake/labels";
import type { SubstanceSummary } from "@/lib/intake/today";
import styles from "./SubstanceCard.module.css";

export default function SubstanceCard({ summary }: { summary: SubstanceSummary }) {
  const { substance, count, takenMg, remainingMg, remainingShare } = summary;
  const name = SUBSTANCE_LABEL[substance];
  const percent = remainingShare === null ? 0 : Math.round(remainingShare * 100);

  return (
    <article className={`${styles.card} ${styles[substance]}`} aria-labelledby={`card-${substance}`}>
      <h2 id={`card-${substance}`} className={styles.title}>
        {name}
      </h2>
      {count === 0 ? (
        <p className={styles.empty}>Täna pole veel lisatud.</p>
      ) : (
        <>
          <dl className={styles.stats}>
            <div>
              <dt>Täna kokku</dt>
              <dd>{formatMg(takenMg)}</dd>
            </div>
            <div>
              <dt>Praegu kehas (~)</dt>
              <dd>{formatMg(remainingMg)}</dd>
            </div>
          </dl>
          <div
            className={styles.bar}
            role="meter"
            aria-label={`${name}: tänasest kogusest kehas`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-valuetext={`${percent}%`}
          >
            <div className={styles.fill} style={{ width: `${percent}%` }} />
          </div>
          <p className={styles.caption}>
            {percent}% tänasest kogusest on veel kehas · {count} {count === 1 ? "kord" : "korda"}
          </p>
        </>
      )}
    </article>
  );
}
