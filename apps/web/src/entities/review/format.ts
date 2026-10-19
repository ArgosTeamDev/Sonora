import { LISTENING_FORMATS, type ListeningFormat, type Review } from "@project/shared";

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
