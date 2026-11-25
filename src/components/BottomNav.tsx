"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./BottomNav.module.css";

export const NAV_ITEMS = [
  { href: "/", label: "Täna" },
  { href: "/add", label: "Lisa" },
  { href: "/history", label: "Ajalugu" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Peamenüü">
      <ul className={styles.list}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href} className={styles.item}>
              <Link
                href={item.href}
                className={active ? `${styles.link} ${styles.active}` : styles.link}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
