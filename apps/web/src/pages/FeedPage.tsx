import { useState } from "react";
import type { JSX } from "react";
import { Link } from "react-router-dom";
import { useReviews } from "@/entities/review/api";
import { useFollowing, useUsers } from "@/entities/user/api";
import { useCurrentUser } from "@/entities/auth/api";
import { useAlbums, useAlbumsByIds } from "@/entities/album/api";
import { useRecentLists } from "@/entities/list/api";
import { AlbumOfTheMonth } from "@/entities/album/ui/AlbumOfTheMonth";
import { AlbumShelfItem } from "@/entities/album/ui/AlbumShelfItem";
import { ListCard } from "@/entities/list/ui/ListCard";
import { ReviewCard } from "@/entities/review/ui/ReviewCard";
import { RatingStars } from "@/entities/review/ui/RatingStars";
import { formatTag } from "@/entities/review/format";
import { AddToListDialog } from "@/features/add-to-list/AddToListDialog";
import { YearlyChallengeCard } from "@/features/yearly-goal/YearlyChallengeCard";
import { relativeTime } from "@/shared/lib/relative-time";

const FEATURED_COUNT = 5;
const REVIEWS_SHOWN = 4;
const ACTIVITY_SHOWN = 4;
const LISTS_SHOWN = 6;
const MOSAIC_COVERS = 4;

type ReviewSort = "recent" | "top";

function initials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

const focusRing =
  "outline-none rounded focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base";

function ListAddIcon(): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h11M4 12h8M4 17h8M18 12v6M15 15h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: JSX.Element;
}): JSX.Element {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="flex flex-col">
        <h2 className="flex items-center gap-2 text-section-title-lg font-bold text-text-primary">
          <span className="hidden size-1.5 rounded-full bg-accent-strong lg:block" aria-hidden="true" />
          {title}
        </h2>
        {subtitle && <p className="text-secondary text-text-secondary">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function FeedPage(): JSX.Element {
  const { data: currentUser } = useCurrentUser();
  const { data: following } = useFollowing(currentUser?.username ?? "");
  const { data: albums, isLoading: albumsLoading, isError: albumsError } = useAlbums({});
  const { data: reviews, isLoading: reviewsLoading, isError: reviewsError } = useReviews();
  const { data: users } = useUsers();
  const { data: recentLists } = useRecentLists(LISTS_SHOWN);

  const [reviewSort, setReviewSort] = useState<ReviewSort>("recent");
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);

  // A review or a list can point at any album found via search, not just the
  // ones in the curated/chart browse list — resolve those albums by id so
  // nothing shows up as "Álbum desconocido".
  const reviewAlbumIds = [...new Set((reviews ?? []).map((r) => r.albumId))];
  const { data: reviewAlbums } = useAlbumsByIds(reviewAlbumIds);

  const lists = recentLists ?? [];
  const listAlbumIds = [...new Set(lists.flatMap((l) => l.albumIds.slice(0, MOSAIC_COVERS)))];
  const { data: listAlbums } = useAlbumsByIds(listAlbumIds);

  const usersById = new Map((users ?? []).map((u) => [u.id, u]));
  const albumsById = new Map(
    [...(albums ?? []), ...(reviewAlbums ?? []), ...(listAlbums ?? [])].map((a) => [a.id, a]),
  );

  // Real release date now that the catalog comes live, instead of an
  // arbitrary "added to Sonora" timestamp — "recent releases" means what it says.
  const featured = [...(albums ?? [])]
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
    .slice(0, FEATURED_COUNT);

  // The flagged album of the month, else the best-rated one as an honest stand-in.
  const flagged = (albums ?? []).find((a) => a.isAlbumOfTheMonth) ?? null;
  const heroAlbum =
    flagged ??
    [...(albums ?? [])]
      .filter((a) => a.averageRating !== null)
      .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))[0] ??
    null;

  const communityReviews = [...(reviews ?? [])]
    .sort((a, b) =>
      reviewSort === "top"
        ? b.rating - a.rating || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, REVIEWS_SHOWN);

  const followingIds = new Set((following ?? []).map((u) => u.id));
  const activity = [...(reviews ?? [])]
    .filter((r) => followingIds.has(r.userId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, ACTIVITY_SHOWN);

  const currentYear = new Date().getFullYear();
  const myListensThisYear = currentUser
    ? (reviews ?? []).filter(
        (r) => r.userId === currentUser.id && new Date(r.listenedAt).getFullYear() === currentYear,
      ).length
    : 0;

  const genreCounts = new Map<string, number>();
  for (const review of reviews ?? []) {
    const album = albumsById.get(review.albumId);
    if (!album) continue;
    for (const genre of album.genres) {
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
    }
  }
  const trendingGenres = [...genreCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  const listButton = currentUser && heroAlbum && (
    <button
      type="button"
      onClick={() => setIsListDialogOpen(true)}
      aria-label="Añadir a una lista"
      className={`flex min-h-11 items-center justify-center gap-2 rounded bg-bg-hover px-3 text-secondary font-semibold text-text-primary hover:bg-bg-raised ${focusRing}`}
    >
      <ListAddIcon />
      <span className="hidden lg:inline">Añadir a lista</span>
    </button>
  );

  return (
    <div className="relative">
      {/* Ambient glow, same treatment as the Figma home frames. Purely
          decorative, so it's pointer-events-none and sits behind content. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 overflow-hidden">
        <div className="absolute left-1/4 right-[45%] top-[-128px] h-96 rounded-full bg-accent-strong/10 blur-3xl" />
        <div className="absolute right-10 top-48 size-80 rounded-full bg-accent-cta/10 blur-3xl" />
      </div>

      <div className="flex flex-col gap-8 px-4 pb-8 pt-4 lg:px-6 lg:pt-6">
        <h1 className="sr-only">{currentUser ? `Hola de nuevo, ${currentUser.name}` : "Inicio"}</h1>

        {albumsLoading && <p className="text-body text-text-secondary">Cargando…</p>}
        {albumsError && (
          <p role="alert" className="text-body text-text-secondary">
            No se pudieron cargar los álbumes.
          </p>
        )}
        {heroAlbum && (
          <AlbumOfTheMonth
            album={heroAlbum}
            label={flagged ? "Álbum del mes" : "Destacado"}
            secondaryAction={listButton || undefined}
          />
        )}

        {/* One column on a phone (ordered to match the mobile design), main +
            sidebar on desktop. The two wrappers are `contents` on a phone so
            their children can be interleaved with `order`. */}
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-x-8">
          <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-10">
            <section aria-label="Lanzamientos destacados" className="order-2 flex flex-col gap-3">
              <SectionHeader
                title="Lanzamientos destacados"
                subtitle="Discos recién llegados"
                action={
                  <Link
                    to="/explore"
                    className={`inline-flex min-h-11 items-center text-secondary font-semibold text-accent ${focusRing}`}
                  >
                    Ver todos ›
                  </Link>
                }
              />
              {featured.length > 0 && (
                <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
                  {featured.map((album) => (
                    <li key={album.id} className="w-36 shrink-0 snap-start lg:w-auto">
                      <AlbumShelfItem album={album} size="md" />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-label="Reseñas de la comunidad" className="order-4 flex flex-col gap-3">
              <SectionHeader
                title="Reseñas de la comunidad"
                subtitle="Críticas con perspectiva autoral"
                action={
                  <div role="group" aria-label="Ordenar reseñas" className="flex gap-1 rounded bg-bg-surface p-1">
                    {(
                      [
                        ["recent", "Recientes"],
                        ["top", "Mejor valoradas"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setReviewSort(id)}
                        aria-pressed={reviewSort === id}
                        className={`min-h-9 rounded-md px-2.5 text-label motion-safe:transition-colors ${focusRing} ${
                          reviewSort === id ? "bg-bg-hover text-text-primary" : "text-text-muted hover:text-text-primary"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                }
              />
              {reviewsLoading && <p className="text-body text-text-secondary">Cargando…</p>}
              {reviewsError && (
                <p role="alert" className="text-body text-text-secondary">
                  No se pudo cargar el feed.
                </p>
              )}
              {reviews && reviews.length === 0 && (
                <p className="text-body text-text-secondary">Todavía no hay actividad.</p>
              )}
              {communityReviews.length > 0 && (
                <div className="flex flex-col gap-4">
                  {communityReviews.map((review) => (
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

            {lists.length > 0 && (
              <section aria-label="Listas de la comunidad" className="order-5 flex flex-col gap-3">
                <SectionHeader title="Listas curadas" subtitle="Selecciones temáticas de la comunidad" />
                <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0">
                  {lists.map((list) => (
                    <li key={list.id} className="snap-start lg:contents">
                      <ListCard
                        list={list}
                        albumsById={albumsById}
                        ownerUsername={usersById.get(list.userId)?.username ?? null}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="contents lg:sticky lg:top-6 lg:flex lg:flex-col lg:gap-6">
            {currentUser && (
              <div className="order-1 lg:order-2">
                <YearlyChallengeCard done={myListensThisYear} />
              </div>
            )}

            <section
              aria-label="Actividad de tu círculo"
              className="order-3 flex flex-col gap-3 lg:order-1 lg:rounded-lg lg:bg-bg-surface lg:p-4"
            >
              <SectionHeader title="Actividad de tu círculo" subtitle="Gente que seguís" />
              {activity.length === 0 && (
                <p className="text-secondary text-text-secondary">
                  {(following ?? []).length === 0
                    ? "Seguí a alguien desde su perfil para ver su actividad acá."
                    : "Todavía no hay actividad reciente."}
                </p>
              )}
              {activity.length > 0 && (
                <ul className="flex flex-col gap-2 lg:gap-4">
                  {activity.map((review) => {
                    const author = usersById.get(review.userId);
                    const album = albumsById.get(review.albumId);
                    const tag = formatTag(review);
                    return (
                      <li key={review.id} className="flex items-start gap-3 rounded-lg bg-bg-surface p-3 lg:bg-transparent lg:p-0">
                        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-accent-strong text-label text-text-primary">
                          {author?.avatarUrl ? (
                            <img src={author.avatarUrl} alt="" className="h-full w-full object-cover" />
                          ) : author ? (
                            initials(author.username)
                          ) : (
                            "?"
                          )}
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <p className="text-secondary text-text-secondary">
                            <Link
                              to={`/u/${author?.username ?? ""}`}
                              className={`font-semibold text-text-primary ${focusRing}`}
                            >
                              {author?.name ?? "Desconocido"}
                            </Link>{" "}
                            <span className="text-text-muted">• escuchó</span>{" "}
                            <Link to={`/albums/${review.albumId}`} className={`font-semibold text-accent ${focusRing}`}>
                              {album?.title ?? "un álbum"}
                            </Link>
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <RatingStars value={review.rating} readOnly label="Calificación" />
                            {tag && (
                              <span className="rounded-sm bg-bg-hover px-2 py-0.5 text-[10px] uppercase text-accent">
                                {tag}
                              </span>
                            )}
                            <span className="text-label font-normal normal-case tracking-normal text-text-muted">
                              {relativeTime(review.createdAt)}
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
              className="order-6 flex flex-col gap-3 rounded-lg bg-bg-surface p-4 lg:order-3"
            >
              <h2 className="text-section-title-lg text-text-primary">Tendencias de la semana</h2>
              <p className="text-secondary text-text-secondary">Géneros con más actividad de reseñas.</p>
              {trendingGenres.length === 0 && (
                <p className="text-secondary text-text-secondary">Todavía no hay nada calificado.</p>
              )}
              {trendingGenres.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {trendingGenres.map(([genre, count]) => (
                    <li
                      key={genre}
                      className="flex items-center gap-1.5 rounded bg-bg-hover px-3 py-1.5 text-secondary text-text-primary"
                    >
                      {genre}
                      <span className="font-semibold text-accent">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </div>

      {isListDialogOpen && currentUser && heroAlbum && (
        <AddToListDialog
          username={currentUser.username}
          albumId={heroAlbum.id}
          albumTitle={heroAlbum.title}
          onClose={() => setIsListDialogOpen(false)}
        />
      )}
    </div>
  );
}
