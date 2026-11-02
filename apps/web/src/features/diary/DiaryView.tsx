import { useState } from "react";
import type { JSX } from "react";
import { Link } from "react-router-dom";
import type { AlbumWithStats, Review } from "@project/shared";
import { RatingStars } from "@/entities/review/ui/RatingStars";
import { formatTag } from "@/entities/review/format";

const focusRing =
  "outline-none rounded focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base";

interface DiaryViewProps {
  reviews: Review[];
  albumsById: Map<string, AlbumWithStats>;
}

interface MonthGroup {
  key: string;
  label: string;
  entries: Review[];
}

function chip(active: boolean): string {
  return `min-h-9 shrink-0 rounded-xl px-3 text-label motion-safe:transition-colors ${focusRing} ${
    active ? "bg-accent-strong text-on-accent" : "bg-bg-surface text-text-secondary hover:bg-bg-raised"
  }`;
}

// Listening log in the Letterboxd mold: pick a year, optionally narrow to a
// tag, and read it month by month, newest first, with the day on the left.
export function DiaryView({ reviews, albumsById }: DiaryViewProps): JSX.Element {
  const years = [...new Set(reviews.map((r) => new Date(r.listenedAt).getFullYear()))].sort((a, b) => b - a);
  const [pickedYear, setPickedYear] = useState<number | null>(null);
  const [pickedTag, setPickedTag] = useState<string | null>(null);

  // The picked year can vanish (its last entry deleted): fall back to the newest.
  const year = pickedYear !== null && years.includes(pickedYear) ? pickedYear : (years[0] ?? new Date().getFullYear());
  const inYear = reviews.filter((r) => new Date(r.listenedAt).getFullYear() === year);

  const tagCounts = new Map<string, number>();
  for (const review of inYear) {
    for (const tag of review.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }
  const tags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);
  const activeTag = pickedTag !== null && tagCounts.has(pickedTag) ? pickedTag : null;

  const entries = inYear
    .filter((r) => (activeTag ? r.tags.includes(activeTag) : true))
    .sort((a, b) => new Date(b.listenedAt).getTime() - new Date(a.listenedAt).getTime());

  const months: MonthGroup[] = [];
  for (const review of entries) {
    const date = new Date(review.listenedAt);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const last = months[months.length - 1];
    if (last && last.key === key) {
      last.entries.push(review);
    } else {
      months.push({ key, label: date.toLocaleDateString("es", { month: "long" }), entries: [review] });
    }
  }

  if (reviews.length === 0) {
    return <p className="text-body text-text-secondary">Todavía no hay entradas en el diario.</p>;
  }

  return (
    <section aria-label="Diario" className="flex flex-col gap-4">
      <div role="group" aria-label="Año del diario" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {years.map((y) => (
          <button key={y} type="button" onClick={() => setPickedYear(y)} aria-pressed={y === year} className={chip(y === year)}>
            {y}
          </button>
        ))}
      </div>

      {tags.length > 0 && (
        <div role="group" aria-label="Filtrar por etiqueta" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <button type="button" onClick={() => setPickedTag(null)} aria-pressed={activeTag === null} className={chip(activeTag === null)}>
            Todas
          </button>
          {tags.map(([tag, count]) => (
            <button
              key={tag}
              type="button"
              onClick={() => setPickedTag(tag === activeTag ? null : tag)}
              aria-pressed={tag === activeTag}
              className={chip(tag === activeTag)}
            >
              #{tag} <span className="opacity-70">{count}</span>
            </button>
          ))}
        </div>
      )}

      <p className="text-secondary text-text-muted">
        <span className="font-semibold text-text-primary">{entries.length}</span>{" "}
        {entries.length === 1 ? "álbum" : "álbumes"} en {year}
        {activeTag ? ` con #${activeTag}` : ""}
      </p>

      <div className="flex flex-col gap-6">
        {months.map((month) => (
          <div key={month.key} className="flex flex-col gap-2">
            <h3 className="text-label font-bold capitalize text-accent">{month.label}</h3>
            <ul className="flex flex-col divide-y divide-border/40 rounded-lg bg-bg-surface">
              {month.entries.map((review) => {
                const album = albumsById.get(review.albumId);
                if (!album) return null;
                const tag = formatTag(review);
                return (
                  <li key={review.id}>
                    <Link to={`/albums/${album.id}`} className={`flex items-center gap-3 p-3 ${focusRing}`}>
                      <span className="w-7 shrink-0 text-center text-section-title-lg font-bold text-text-muted">
                        {new Date(review.listenedAt).getDate()}
                      </span>
                      <span className="size-12 shrink-0 overflow-hidden rounded bg-bg-hover">
                        {album.coverUrl && <img src={album.coverUrl} alt="" className="h-full w-full object-cover" />}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-body font-semibold text-text-primary">{album.title}</span>
                        <span className="truncate text-secondary text-text-secondary">
                          {album.artist.name} · {album.year}
                        </span>
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <RatingStars value={review.rating} readOnly label="Calificación" />
                          {review.isRelisten && (
                            <span className="rounded-sm bg-bg-hover px-1.5 py-0.5 text-[10px] uppercase text-text-secondary">
                              Reescucha
                            </span>
                          )}
                          {tag && (
                            <span className="rounded-sm bg-bg-hover px-1.5 py-0.5 text-[10px] uppercase text-accent">
                              {tag}
                            </span>
                          )}
                          {review.tags.map((t) => (
                            <span key={t} className="text-[11px] text-text-muted">
                              #{t}
                            </span>
                          ))}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
