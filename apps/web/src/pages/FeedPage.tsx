import type { JSX } from "react";
import { Link } from "react-router-dom";
import { useReviews } from "@/entities/review/api";
import { useFollowing, useUsers } from "@/entities/user/api";
import { useCurrentUser } from "@/entities/auth/api";
import { useAlbums, useAlbumsByIds } from "@/entities/album/api";
import { AlbumCard } from "@/entities/album/ui/AlbumCard";
import { ReviewCard } from "@/entities/review/ui/ReviewCard";

function initials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

const focusRing =
  "outline-none rounded focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-deep";

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `hace ${days}d`;
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `hace ${hours}h`;
  const minutes = Math.max(1, Math.floor(ms / 60_000));
  return `hace ${minutes}m`;
}

export function FeedPage(): JSX.Element {
  const { data: currentUser } = useCurrentUser();
  const { data: following } = useFollowing(currentUser?.username ?? "");
  const { data: albums, isLoading: albumsLoading, isError: albumsError } = useAlbums({});
  const { data: reviews, isLoading: reviewsLoading, isError: reviewsError } = useReviews();
  const { data: users } = useUsers();

  // A review can point at any album found via search, not just the ones in
  // the curated/chart browse list above — resolve reviews' albums
  // separately so "Reseñas recientes" and "Actividad en vivo" don't show
  // "Álbum desconocido" for something outside that browse set.
  const reviewAlbumIds = [...new Set((reviews ?? []).map((r) => r.albumId))];
  const { data: reviewAlbums } = useAlbumsByIds(reviewAlbumIds);

  const usersById = new Map((users ?? []).map((u) => [u.id, u]));
  const albumsById = new Map((reviewAlbums ?? []).map((a) => [a.id, a]));

  // Real release date now that the catalog comes live from iTunes, instead
  // of an arbitrary "added to Sonora" timestamp — "recent releases" means
  // what it says.
  const featured = [...(albums ?? [])]
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
    .slice(0, 6);

  const recentReviews = [...(reviews ?? [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  const followingIds = new Set((following ?? []).map((u) => u.id));
  const activity = [...(reviews ?? [])]
    .filter((r) => followingIds.has(r.userId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const genreCounts = new Map<string, number>();
  for (const review of reviews ?? []) {
    const album = albumsById.get(review.albumId);
    if (!album) continue;
    for (const genre of album.genres) {
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
    }
  }
  const trendingGenres = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="relative">
      {/* Ambient glow, same treatment as the Figma home frames. Purely
          decorative, so it's pointer-events-none and sits behind content. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 overflow-hidden">
        <div className="absolute left-1/4 right-[45%] top-[-128px] h-96 rounded-full bg-accent-strong/10 blur-3xl" />
        <div className="absolute right-10 top-48 size-80 rounded-full bg-accent-cta/10 blur-3xl" />
      </div>

      <div className="flex flex-col gap-8 px-4 pb-8 pt-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-page-title text-text-primary md:text-page-title-lg">
            {currentUser ? `Hola de nuevo, ${currentUser.name}` : "Hola"}
          </h1>
          <p className="text-body text-text-secondary">
            Lo que está escuchando la comunidad, y lo que acaba de llegar.
          </p>
        </header>

        <div className="flex flex-col gap-8 md:flex-row md:items-start">
          {/* Main column */}
          <div className="flex min-w-0 flex-1 flex-col gap-8">
            <section aria-label="Lanzamientos destacados" className="flex flex-col gap-3">
              <h2 className="text-section-title text-text-primary">Lanzamientos destacados</h2>
              {albumsLoading && <p className="text-body text-text-secondary">Cargando…</p>}
              {albumsError && (
                <p role="alert" className="text-body text-text-secondary">
                  No se pudieron cargar los álbumes.
                </p>
              )}
              {featured.length > 0 && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
                  {featured.map((album) => (
                    <AlbumCard key={album.id} album={album} variant="grid" />
                  ))}
                </div>
              )}
            </section>

            <section aria-label="Reseñas recientes de la comunidad" className="flex flex-col gap-3">
              <h2 className="text-section-title text-text-primary">Reseñas recientes de la comunidad</h2>
              {reviewsLoading && <p className="text-body text-text-secondary">Cargando…</p>}
              {reviewsError && (
                <p role="alert" className="text-body text-text-secondary">
                  No se pudo cargar el feed.
                </p>
              )}
              {reviews && reviews.length === 0 && (
                <p className="text-body text-text-secondary">Todavía no hay actividad.</p>
              )}
              {recentReviews.length > 0 && (
                <div className="flex flex-col gap-4">
                  {recentReviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      author={usersById.get(review.userId)}
                      album={albumsById.get(review.albumId)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar: deliberately lighter than the review cards — no border,
              a step darker than bg-surface — so it reads as chrome around
              the primary content, not another card in the same stack. */}
          <aside className="flex w-full flex-col gap-6 md:w-72 md:shrink-0">
            <section
              aria-label="Actividad en vivo"
              className="flex flex-col gap-3 rounded bg-bg-deep p-4"
            >
              <h2 className="text-section-title text-text-primary">Actividad en vivo</h2>
              <p className="text-label text-text-muted">Gente que seguís</p>
              {activity.length === 0 && (
                <p className="text-secondary text-text-secondary">
                  {(following ?? []).length === 0
                    ? "Seguí a alguien desde su perfil para ver su actividad acá."
                    : "Todavía no hay actividad reciente."}
                </p>
              )}
              {activity.length > 0 && (
                <ul className="flex flex-col gap-3">
                  {activity.map((review) => {
                    const author = usersById.get(review.userId);
                    const album = albumsById.get(review.albumId);
                    return (
                      <li key={review.id} className="flex items-start gap-2">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-strong text-label text-text-primary">
                          {author ? initials(author.username) : "?"}
                        </span>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <p className="text-secondary text-text-secondary">
                            <Link
                              to={`/u/${author?.username ?? ""}`}
                              className={`font-semibold text-text-primary ${focusRing}`}
                            >
                              {author?.username ?? "Desconocido"}
                            </Link>{" "}
                            calificó{" "}
                            <Link to={`/albums/${review.albumId}`} className={`text-accent ${focusRing}`}>
                              {album?.title ?? "un álbum"}
                            </Link>
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="rounded-sm bg-bg-hover px-1.5 py-0.5 text-label text-text-primary">
                              {review.rating.toFixed(1)}★
                            </span>
                            <span className="text-label text-text-muted">
                              {timeAgo(review.createdAt.toString())}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section
              aria-label="Tendencias"
              className="flex flex-col gap-3 rounded bg-bg-deep p-4"
            >
              <h2 className="text-section-title text-text-primary">Tendencias</h2>
              <p className="text-label text-text-muted">Por actividad de reseñas</p>
              {trendingGenres.length === 0 && (
                <p className="text-secondary text-text-secondary">Todavía no hay nada calificado.</p>
              )}
              {trendingGenres.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {trendingGenres.map(([genre, count]) => (
                    <li key={genre} className="flex items-center justify-between gap-2">
                      <span className="text-secondary uppercase text-text-secondary">{genre}</span>
                      <span className="text-label text-text-muted">
                        {count} reseña{count === 1 ? "" : "s"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
