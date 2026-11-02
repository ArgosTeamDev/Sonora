import { LISTENING_FORMATS, MAX_REVIEW_TAGS, type ListeningFormat, type Review } from "@project/shared";

export { LISTENING_FORMATS };

export const FORMAT_LABELS: Record<ListeningFormat, string> = {
  vinyl: "Vinilo",
  cassette: "Cassette",
  cd: "CD",
  digital: "Digital",
  "hi-res": "Hi-Res",
};

// "VINILO 180G", "CASSETTE CHROME", or just "CD" — null when the review has no format.
export function formatTag(review: Pick<Review, "format" | "formatDetail">): string | null {
  if (!review.format) return null;
  const label = FORMAT_LABELS[review.format];
  return review.formatDetail ? `${label} ${review.formatDetail}` : label;
}

// <input type="date"> speaks local "YYYY-MM-DD", never UTC.
export function toDateInputValue(date: Date | string): string {
  const d = new Date(date);
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Noon, so the calendar day survives any timezone shift on the way to the API.
export function fromDateInputValue(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

// "road trip, Domingo" -> ["road trip", "domingo"]: trimmed, lowercase, unique, capped.
export function parseTags(text: string): string[] {
  const tags = text
    .split(",")
    .map((t) => t.trim().toLowerCase().slice(0, 24))
    .filter(Boolean);
  return [...new Set(tags)].slice(0, MAX_REVIEW_TAGS);
}
