const STORAGE_KEY = "bible-in-a-year-last-day";

export function getLastVisitedDay(): number {
  if (typeof window === "undefined") return 1;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const day = parseInt(stored, 10);
      if (day >= 1 && day <= 365) return day;
    }
  } catch {}
  return 1;
}

export function setLastVisitedDay(day: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, String(day));
  } catch {}
}
