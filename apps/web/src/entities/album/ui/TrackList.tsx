import type { JSX } from "react";
import type { Track } from "@project/shared";
import { usePlayer } from "@/shared/player/PlayerContext";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface";

function PlayIcon(): JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 4.5v15l13-7.5-13-7.5z" />
    </svg>
  );
}

function PauseIcon(): JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 4.5h4v15H6v-15zM14 4.5h4v15h-4v-15z" />
    </svg>
  );
}

function formatDuration(ms: number | null): string {
  if (ms === null) return "";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

interface TrackListProps {
  tracks: Track[];
  albumId: string;
  albumTitle: string;
  artistName: string;
  coverUrl: string | null;
}

// Titles and durations come from the iTunes Search API (see
// scripts/fetch-tracks.mjs), fetched once and stored on the album. Playback
// itself goes through the app-wide player (shared/player) so it keeps
// going — with real progress and volume controls — even after navigating
// away from this list; the section just says up front that it's a
// 30-second preview, not the full song.
export function TrackList({ tracks, albumId, albumTitle, artistName, coverUrl }: TrackListProps): JSX.Element | null {
  const { current, isPlaying, play, toggle } = usePlayer();

  if (tracks.length === 0) return null;

  const totalMs = tracks.reduce((sum, t) => sum + (t.durationMs ?? 0), 0);

  return (
    <section
      aria-label="Lista de canciones"
      className="flex flex-col gap-1 rounded-lg border border-border bg-bg-surface p-4"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-section-title text-text-primary">Lista de canciones</h2>
        <span className="text-label text-text-muted">
          {tracks.length} pista{tracks.length === 1 ? "" : "s"} · {formatDuration(totalMs)}
        </span>
      </div>
      <p className="pb-2 text-label text-text-muted">Vista previa de 30 segundos, vía iTunes.</p>

      <ul className="flex flex-col divide-y divide-border">
        {tracks.map((track) => {
          const isCurrentTrack = current?.albumId === albumId && current?.track.trackNumber === track.trackNumber;
          const isActive = isCurrentTrack && isPlaying;

          const handleClick = (): void => {
            if (isCurrentTrack) toggle();
            else play({ track, albumId, albumTitle, artistName, coverUrl });
          };

          return (
            <li key={track.trackNumber} className="flex items-center gap-3 py-1.5">
              <button
                type="button"
                onClick={handleClick}
                disabled={!track.previewUrl}
                aria-label={isActive ? `Pausar ${track.title}` : `Reproducir vista previa de ${track.title}`}
                aria-pressed={isActive}
                className={`flex size-9 shrink-0 items-center justify-center rounded-full disabled:opacity-40 ${
                  isActive ? "bg-accent text-on-accent" : "bg-bg-raised text-text-secondary hover:bg-bg-hover"
                } ${focusRing}`}
              >
                {isActive ? <PauseIcon /> : <PlayIcon />}
              </button>
              <span className="w-5 shrink-0 text-right text-label text-text-muted">{track.trackNumber}</span>
              <span
                className={`min-w-0 flex-1 truncate text-body ${
                  isCurrentTrack ? "font-semibold text-accent" : "text-text-primary"
                }`}
              >
                {track.title}
              </span>
              <span className="shrink-0 text-label text-text-muted">{formatDuration(track.durationMs)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
