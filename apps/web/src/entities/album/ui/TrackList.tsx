import type { JSX } from "react";
import type { Track } from "@project/shared";
import { usePlayer } from "@/shared/player/PlayerContext";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface";

function PlayIcon(): JSX.Element {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 4.5v15l13-7.5-13-7.5z" />
    </svg>
  );
}

function PauseIcon(): JSX.Element {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 4.5h4v15H6v-15zM14 4.5h4v15h-4v-15z" />
    </svg>
  );
}

export function formatDuration(ms: number | null): string {
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

// Titles and durations come from the catalog provider. Playback itself goes
// through the app-wide player (shared/player) so it keeps going — with real
// progress and volume controls — even after navigating away from this list;
// the section just says up front that it's a 30-second preview, not the full
// song.
export function TrackList({ tracks, albumId, albumTitle, artistName, coverUrl }: TrackListProps): JSX.Element | null {
  const { current, isPlaying, play, toggle } = usePlayer();

  if (tracks.length === 0) return null;

  const totalMs = tracks.reduce((sum, t) => sum + (t.durationMs ?? 0), 0);

  return (
    <section aria-label="Lista de canciones" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2 px-1">
        <p className="text-label font-normal normal-case tracking-normal text-text-muted">
          Vista previa de 30 segundos.
        </p>
        <span className="text-[11px] text-text-secondary">
          {tracks.length} pista{tracks.length === 1 ? "" : "s"}
          {totalMs > 0 && ` • ${formatDuration(totalMs)} total`}
        </span>
      </div>

      <ul className="flex flex-col gap-0.5 rounded-lg bg-bg-surface p-2">
        {tracks.map((track) => {
          const isCurrentTrack = current?.albumId === albumId && current?.track.trackNumber === track.trackNumber;
          const isActive = isCurrentTrack && isPlaying;

          const handleClick = (): void => {
            if (isCurrentTrack) toggle();
            else play({ track, albumId, albumTitle, artistName, coverUrl });
          };

          return (
            <li
              key={track.trackNumber}
              className={`flex items-center justify-between gap-3 rounded p-2.5 ${isCurrentTrack ? "bg-bg-raised" : ""}`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-4 shrink-0 text-center text-secondary font-semibold text-text-muted">
                  {track.trackNumber.toString().padStart(2, "0")}
                </span>
                <span
                  className={`min-w-0 truncate text-[14px] font-semibold ${
                    isCurrentTrack ? "text-accent" : "text-text-primary"
                  }`}
                >
                  {track.title}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2.5">
                <span className="text-label text-text-secondary">{formatDuration(track.durationMs)}</span>
                <button
                  type="button"
                  onClick={handleClick}
                  disabled={!track.previewUrl}
                  aria-label={isActive ? `Pausar ${track.title}` : `Reproducir vista previa de ${track.title}`}
                  aria-pressed={isActive}
                  className={`flex size-11 shrink-0 items-center justify-center rounded-full disabled:opacity-40 ${
                    isActive ? "bg-accent text-on-accent" : "bg-bg-hover text-text-secondary hover:text-text-primary"
                  } ${focusRing}`}
                >
                  {isActive ? <PauseIcon /> : <PlayIcon />}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
