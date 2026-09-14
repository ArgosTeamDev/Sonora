// Deterministic, so the same artist name always yields the same slug across
// requests — there's no stored artist record to look the slug up from
// anymore (see ItunesAlbumRepository).
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
