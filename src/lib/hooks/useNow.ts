import { useEffect, useState } from "react";

// Current time that updates every `intervalMs`, so estimates stay fresh
// while the page is open. Starts as null on the server and on the first
// client render, so server and client HTML match.
export function useNow(intervalMs = 60_000): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
