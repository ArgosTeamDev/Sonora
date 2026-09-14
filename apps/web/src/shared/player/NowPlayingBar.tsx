import type { JSX } from "react";
import { usePlayer } from "./PlayerContext";

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

function VolumeIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
      <path
        d="M16.5 8.5a5 5 0 0 1 0 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon(): JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 5l14 14M19 5 5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Persistent player bar: mounted once in RootLayout (see PlayerProvider),
// so it keeps playing and stays visible across page navigation, not just
// while a TrackList happens to be on screen.
export function NowPlayingBar(): JSX.Element | null {
  const { current, isPlaying, currentTime, duration, volume, toggle, seek, setVolume, close } = usePlayer();

  if (!current) return null;

  const track = (
    <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:w-52 sm:flex-none">
      <div className="size-10 shrink-0 overflow-hidden rounded border border-border/60 bg-bg-hover">
        {current.coverUrl && <img src={current.coverUrl} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-secondary font-semibold text-text-primary">{current.track.title}</span>
        <span className="truncate text-label text-text-muted">
          {current.artistName} · {current.albumTitle}
        </span>
      </div>
    </div>
  );

  const playButton = (
    <button
      type="button"
      onClick={toggle}
      aria-label={isPlaying ? "Pausar" : "Reproducir"}
      className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent hover:bg-accent-strong ${focusRing}`}
    >
      {isPlaying ? <PauseIcon /> : <PlayIcon />}
    </button>
  );

  const progress = (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <span className="w-9 shrink-0 text-right text-label text-text-muted">{formatTime(currentTime)}</span>
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={Math.min(currentTime, duration || 0)}
        onChange={(e) => seek(Number(e.target.value))}
        aria-label="Progreso de la reproducción"
        className={`h-9 w-full accent-accent ${focusRing}`}
      />
      <span className="w-9 shrink-0 text-label text-text-muted">{formatTime(duration)}</span>
    </div>
  );

  const volumeControl = (
    <div className="flex flex-1 items-center gap-1.5 text-text-muted sm:w-24 sm:flex-none">
      <VolumeIcon />
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
        aria-label="Volumen"
        className={`h-9 w-full accent-accent ${focusRing}`}
      />
    </div>
  );

  const closeButton = (
    <button
      type="button"
      onClick={close}
      aria-label="Cerrar reproductor"
      className={`flex size-9 shrink-0 items-center justify-center rounded text-text-muted hover:text-text-primary ${focusRing}`}
    >
      <CloseIcon />
    </button>
  );

  return (
    <div
      role="region"
      aria-label="Reproductor"
      className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 border-t border-border bg-bg-surface px-3 py-2 shadow-[0_-8px_16px_-12px_rgba(0,0,0,0.5)] md:bottom-0"
    >
      {/* Phone width can't fit cover+progress+volume+close on one line
          without everything losing its touch target, so mobile gets its own
          stacked layout instead of hiding controls (volume included) to
          squeeze into a single row. */}
      <div className="flex flex-col gap-2 sm:hidden">
        <div className="flex items-center gap-2.5">
          {track}
          {closeButton}
        </div>
        <div className="flex items-center gap-2">
          {playButton}
          {progress}
        </div>
        {volumeControl}
      </div>

      <div className="hidden items-center gap-3 sm:flex">
        {track}
        {playButton}
        {progress}
        {volumeControl}
        {closeButton}
      </div>
    </div>
  );
}
