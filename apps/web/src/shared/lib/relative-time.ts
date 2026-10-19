const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// "Hace 5 min", "Hace 3h", "Hace 2d", "Hace 1 sem"; older than a month falls
// back to an absolute date, where "Hace 14 sem" stops being useful.
export function relativeTime(date: Date | string, now: number = Date.now()): string {
  const diff = Math.max(0, now - new Date(date).getTime());
  if (diff < HOUR) return `Hace ${Math.max(1, Math.floor(diff / MINUTE))} min`;
  if (diff < DAY) return `Hace ${Math.floor(diff / HOUR)}h`;
  if (diff < 7 * DAY) return `Hace ${Math.floor(diff / DAY)}d`;
  if (diff < 30 * DAY) return `Hace ${Math.floor(diff / (7 * DAY))} sem`;
  return new Date(date).toLocaleDateString("es", { month: "short", day: "numeric", year: "numeric" });
}
