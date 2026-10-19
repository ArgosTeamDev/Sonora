import type { Track } from "@project/shared";
import { slugify } from "@/shared/text/slugify";
import type { AlbumWithArtist } from "@/modules/album/domain/album.repository";
import type { MbReleaseGroup, MbTrack } from "./musicbrainz-client";

export const MB_ID_PREFIX = "mb-";

const ALBUM_LIKE_TYPES = new Set(["album", "ep", "single"]);

export function isAlbumLike(group: MbReleaseGroup): boolean {
  return ALBUM_LIKE_TYPES.has((group["primary-type"] ?? "").toLowerCase());
}

// first-release-date can be "2018", "2018-05" or "2018-05-04".
function parseReleaseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const [year, month = "1", day = "1"] = value.split("-");
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return Number.isNaN(date.getTime()) ? null : date;
}

// The release to read a tracklist from: an official one if there is any.
export function pickRelease(group: MbReleaseGroup): string | null {
  const releases = group.releases ?? [];
  return (releases.find((r) => r.status === "Official") ?? releases[0])?.id ?? null;
}

export function toMusicBrainzAlbum(
  group: MbReleaseGroup,
  options: { tracks?: MbTrack[]; coverUrl: string | null },
): AlbumWithArtist | null {
  const releaseDate = parseReleaseDate(group["first-release-date"]);
  const credit = group["artist-credit"]?.[0];
  if (!releaseDate || !credit) return null;

  const tracks: Track[] = (options.tracks ?? []).map((t, index) => ({
    trackNumber: index + 1,
    title: t.title,
    durationMs: t.length && t.length > 0 ? t.length : null,
    previewUrl: null, // MusicBrainz has no audio
  }));

  const type = (group["primary-type"] ?? "").toLowerCase();
  const topTags = [...(group.tags ?? [])].sort((a, b) => b.count - a.count).slice(0, 2);

  return {
    id: `${MB_ID_PREFIX}${group.id}`,
    title: group.title,
    year: releaseDate.getUTCFullYear(),
    releaseDate,
    coverUrl: options.coverUrl,
    genres: topTags.map((t) => t.name.toLowerCase()),
    tracks,
    isSingle: type === "single" || type === "ep",
    isAlbumOfTheMonth: false,
    editorialNote: null,
    artist: {
      id: `${MB_ID_PREFIX}${credit.artist.id}`,
      name: credit.name,
      slug: slugify(credit.name) || `artist-${credit.artist.id}`,
    },
  };
}
