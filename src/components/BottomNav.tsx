"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./BottomNav.module.css";

export const NAV_ITEMS = [
  { href: "/", label: "Täna", icon: "today" },
  { href: "/add", label: "Lisa", icon: "add" },
  { href: "/history", label: "Ajalugu", icon: "history" },
] as const;

type Icon = (typeof NAV_ITEMS)[number]["icon"];

function NavIcon({ icon }: { icon: Icon }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (icon === "add") {
    return (
      <svg {...common} strokeWidth={2.6}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }
  if (icon === "history") {
    return (
      <svg {...common}>
        <path d="M8 6h12M8 12h12M8 18h12" />
        <circle cx="4" cy="6" r="1" fill="currentColor" />
        <circle cx="4" cy="12" r="1" fill="currentColor" />
        <circle cx="4" cy="18" r="1" fill="currentColor" />
      </svg>
    );
  }
  // Today: two levels, like the gauges on the page
  return (
    <svg {...common}>
      <rect x="4" y="3" width="6" height="18" rx="3" />
      <rect x="14" y="3" width="6" height="18" rx="3" />
      <path d="M4 14h6M14 10h6" />
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Peamenüü">
      <ul className={styles.list}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const isAdd = item.icon === "add";
          const className = [styles.link, isAdd && styles.add, active && styles.active].filter(Boolean).join(" ");
          return (
            <li key={item.href} className={styles.item}>
              <Link href={item.href} className={className} aria-current={active ? "page" : undefined}>
                <span className={styles.icon}>
                  <NavIcon icon={item.icon} />
                </span>
                <span className={styles.label}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
