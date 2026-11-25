"use client";

import Link from "next/link";
import SubstanceCard from "@/components/SubstanceCard";
import { useNow } from "@/lib/hooks/useNow";
import { useIntakes } from "@/lib/intake/store";
import { summarizeToday } from "@/lib/intake/today";
import type { Intake } from "@/lib/intake/types";
import styles from "./TodayView.module.css";

type Props = {
  // Injected in tests; the page uses the live store and clock.
  intakes?: readonly Intake[];
  now?: Date;
};

export default function TodayView(props: Props) {
  const storeIntakes = useIntakes();
  const liveNow = useNow();
  const intakes = props.intakes ?? storeIntakes;
  const now = props.now ?? liveNow;

  // Until the clock is known on the client, render only the heading so the
  // server HTML and the first client render are identical.
  if (!now) {
    return <h1 className={styles.title}>Täna</h1>;
  }

  const summaries = summarizeToday(intakes, now);
  const nothingToday = summaries.every((s) => s.count === 0);

  return (
    <>
      <h1 className={styles.title}>Täna</h1>
      <p className={styles.date}>
        {now.toLocaleDateString("et-EE", { weekday: "long", day: "numeric", month: "long" })}
      </p>

      <div className={styles.gauges}>
        {summaries.map((summary) => (
          <SubstanceCard key={summary.substance} summary={summary} />
        ))}
      </div>

      {nothingToday && (
        <div className={styles.empty}>
          <p>Täna pole veel midagi lisatud.</p>
          <Link href="/add" className={styles.cta}>
            Lisa esimene
          </Link>
        </div>
      )}

      <p className={styles.note}>
        Kehas oleva koguse hinnang põhineb keskmistel poolestusaegadel (kofeiin 5 h, nikotiin 2 h). See on
        ligikaudne ja ei ole meditsiiniline nõuanne.
      </p>
    </>
  );
}
