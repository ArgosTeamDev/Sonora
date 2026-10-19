import type { JSX } from "react";
import type { AlbumWithStats, ListeningFormat } from "@project/shared";
import { FORMAT_LABELS } from "@/entities/review/format";
import { formatDuration } from "./TrackList";

interface AlbumSpecsProps {
  album: AlbumWithStats;
  // How the community actually listened to it, most-used first.
  formatCounts: { format: ListeningFormat; count: number }[];
}

function Row({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-label uppercase text-text-muted">{label}</dt>
      <dd className="min-w-0 text-right text-secondary font-semibold text-text-primary">{value}</dd>
    </div>
  );
}

// Only what the catalog and the community reviews really tell us — no
// credits/mastering/pressing data exists, so none is shown.
export function AlbumSpecs({ album, formatCounts }: AlbumSpecsProps): JSX.Element {
  const totalMs = album.tracks.reduce((sum, t) => sum + (t.durationMs ?? 0), 0);
  const maxCount = Math.max(1, ...formatCounts.map((f) => f.count));
  return (
    <section aria-label="Ficha técnica" className="flex flex-col gap-4 rounded-lg bg-bg-surface p-4">
      <dl className="flex flex-col divide-y divide-border/40">
        <Row label="Artista" value={album.artist.name} />
        <Row label="Año" value={String(album.year)} />
        <Row label="Pistas" value={String(album.tracks.length)} />
        {totalMs > 0 && <Row label="Duración" value={formatDuration(totalMs)} />}
        {album.genres.length > 0 && <Row label="Géneros" value={album.genres.join(", ")} />}
      </dl>

      <div className="flex flex-col gap-2">
        <h3 className="text-label uppercase text-text-muted">Cómo lo escucha la comunidad</h3>
        {formatCounts.length === 0 ? (
          <p className="text-secondary text-text-secondary">Nadie indicó el formato todavía.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {formatCounts.map(({ format, count }) => (
              <li key={format} className="flex items-center gap-2">
                <span className="w-16 shrink-0 text-secondary text-text-secondary">{FORMAT_LABELS[format]}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-hover">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(count / maxCount) * 100}%` }} />
                </div>
                <span className="w-6 shrink-0 text-right text-label text-text-muted">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
