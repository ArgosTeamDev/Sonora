import { useEffect, useState } from "react";
import type { JSX } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAlbum } from "@/entities/album/api";
import { useReviews } from "@/entities/review/api";
import { useUsers } from "@/entities/user/api";
import { useCurrentUser } from "@/entities/auth/api";
import { RatingStars } from "@/entities/review/ui/RatingStars";
import { TrackList } from "@/entities/album/ui/TrackList";
import { useFavorites } from "@/entities/favorite/api";
import { useRateAlbum } from "@/features/rate-album/useRateAlbum";
import { useDeleteReview } from "@/features/delete-review/useDeleteReview";
import { useFavoriteAlbum } from "@/features/favorite-album/useFavoriteAlbum";
import { HttpError } from "@/shared/api/http";
import { Button } from "@/shared/ui/Button";

const focusRing =
  "outline-none rounded focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base";

const HISTOGRAM_STARS = [5, 4, 3, 2, 1] as const;

function initials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

function BackIcon(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} aria-hidden="true">
      <path
        d="M12 20.5s-7-4.35-9.5-8.8C.5 8.5 2 5 5.5 5c2 0 3.5 1.2 4.5 2.7C11 6.2 12.5 5 14.5 5 18 5 19.5 8.5 17.5 11.7 15 16.15 12 20.5 12 20.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="18" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.2 10.7 15.8 6.3M8.2 13.3l7.6 4.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PencilIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20h4L18.5 9.5a2.121 2.121 0 0 0-3-3L5 17v3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AlbumDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const albumId = id ?? "";
  const navigate = useNavigate();

  const { data: album, isLoading, isError } = useAlbum(albumId);
  const { data: allReviews } = useReviews();
  const { data: users } = useUsers();
  const { data: currentUser } = useCurrentUser();

  // useReviews() is the single source of truth: the rate/delete mutations
  // patch this same cached list, so "my review" below and the widget above
  // always agree, and both update the instant a mutation resolves.
  const reviews = (allReviews ?? []).filter((r) => r.albumId === albumId);
  const usersById = new Map((users ?? []).map((u) => [u.id, u]));
  const myReview = currentUser ? (reviews.find((r) => r.userId === currentUser.id) ?? null) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState("");
  const [isRelisten, setIsRelisten] = useState(false);
  const [hasSyncedDraft, setHasSyncedDraft] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (myReview && !hasSyncedDraft) {
      setText(myReview.text ?? "");
      setIsRelisten(myReview.isRelisten);
      setHasSyncedDraft(true);
    }
  }, [myReview, hasSyncedDraft]);

  const rateAlbum = useRateAlbum({
    userId: currentUser?.id ?? "",
    albumId,
    existingReview: myReview,
  });
  const deleteReview = useDeleteReview();

  const { data: favorites } = useFavorites(currentUser?.username ?? "");
  const isFavorite = Boolean(favorites?.some((f) => f.albumId === albumId));
  const favoriteAlbum = useFavoriteAlbum({
    username: currentUser?.username ?? "",
    userId: currentUser?.id ?? "",
    albumId,
  });

  if (isLoading) {
    return <p className="px-4 pt-8 text-body text-text-secondary">Cargando álbum…</p>;
  }
  if (isError || !album) {
    return (
      <p role="alert" className="px-4 pt-8 text-body text-text-secondary">
        No se pudo cargar el álbum.
      </p>
    );
  }

  const isStale = rateAlbum.error instanceof HttpError && rateAlbum.error.status === 409;
  const displayedRating = myReview?.rating ?? 0.5;
  const showForm = !myReview || isEditing;

  const histogram = HISTOGRAM_STARS.map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));
  const maxHistogramCount = Math.max(1, ...histogram.map((h) => h.count));

  // Computed from the same `reviews` list as the histogram (not from
  // album.averageRating/totalReviews, a separate query the rating mutation
  // doesn't patch) so the big number, the stars and the bars all move
  // together the instant a rating lands, instead of the number lagging
  // behind a stale server-side aggregate.
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews === 0 ? null : reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

  const handleRate = (rating: number): void => {
    rateAlbum.mutate(
      { rating },
      { onSuccess: () => setStatusMessage(`Calificaste ${album.title} con ${rating} de 5 estrellas.`) },
    );
  };

  const handleSaveReview = (): void => {
    rateAlbum.mutate(
      { rating: displayedRating, text: text || null, isRelisten },
      {
        onSuccess: () => {
          setIsEditing(false);
          setStatusMessage("Reseña guardada.");
        },
      },
    );
  };

  const handleStartEdit = (): void => {
    if (myReview) {
      setText(myReview.text ?? "");
      setIsRelisten(myReview.isRelisten);
    }
    setIsEditing(true);
  };

  const handleCancelEdit = (): void => {
    if (myReview) {
      setText(myReview.text ?? "");
      setIsRelisten(myReview.isRelisten);
    }
    setIsEditing(false);
  };

  const handleDelete = (): void => {
    if (!myReview) return;
    if (!window.confirm("¿Eliminar tu reseña de este álbum?")) return;
    deleteReview.mutate(myReview.id, {
      onSuccess: () => {
        setText("");
        setIsRelisten(false);
        setHasSyncedDraft(false);
        setIsEditing(false);
        setStatusMessage("Reseña eliminada.");
      },
    });
  };

  const handleToggleFavorite = (): void => {
    const nextIsFavorite = !isFavorite;
    favoriteAlbum.mutate(nextIsFavorite, {
      onSuccess: () =>
        setStatusMessage(nextIsFavorite ? `${album.title} agregado a favoritos.` : `${album.title} quitado de favoritos.`),
    });
  };

  const handleShare = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setStatusMessage("Enlace copiado.");
    } catch {
      setStatusMessage("No se pudo copiar el enlace.");
    }
  };

  return (
    <article className="flex flex-col gap-6 px-4 pt-8">
      {/* Announces rating/save/delete/share outcomes to screen reader users,
          who otherwise get no confirmation that an optimistic update landed. */}
      <p role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </p>

      <button
        type="button"
        onClick={() => navigate(-1)}
        className={`flex min-h-11 w-fit items-center gap-1.5 rounded pr-2 text-secondary font-semibold text-text-secondary hover:text-text-primary ${focusRing}`}
      >
        <BackIcon />
        Volver
      </button>

      {/* Portada + info en una fila compacta, para que el control de
          calificar entre en el primer viewport en mobile. */}
      <div className="flex gap-4">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded border border-border/60 bg-bg-hover shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_6px_16px_-8px_rgba(0,0,0,0.6)]">
          {album.coverUrl ? (
            <img src={album.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center px-2 text-center text-label text-text-muted">
              Sin portada
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-section-title-lg text-text-primary">{album.title}</h1>
            {currentUser && (
              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={favoriteAlbum.isPending}
                aria-pressed={isFavorite}
                aria-label={isFavorite ? `Quitar ${album.title} de favoritos` : `Agregar ${album.title} a favoritos`}
                className={`flex size-11 shrink-0 items-center justify-center rounded-full disabled:opacity-50 ${focusRing} ${
                  isFavorite ? "text-danger" : "text-text-muted hover:text-text-primary"
                }`}
              >
                <HeartIcon filled={isFavorite} />
              </button>
            )}
          </div>
          <p className="text-secondary text-text-muted">
            <Link to={`/artists/${album.artist.slug}`} className={`text-accent ${focusRing}`}>
              {album.artist.name}
            </Link>{" "}
            · {album.year}
          </p>
          {album.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {album.genres.map((genre) => (
                <span
                  key={genre}
                  className="rounded-full bg-bg-hover px-2.5 py-0.5 text-label uppercase text-accent"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* La calificación es la interacción central de la app: la separamos
          del resto con más aire y estrellas grandes en vez de heredar el
          tamaño chico que usan las listas de solo lectura. */}
      <div className="flex flex-col gap-1 rounded-lg bg-bg-deep p-4">
        <span className="text-label uppercase text-text-muted">Tu calificación</span>
        <RatingStars
          value={displayedRating}
          onChange={currentUser ? handleRate : undefined}
          label="Calificar este álbum"
          size="lg"
        />
        {!currentUser && (
          <p className="text-secondary text-text-muted">
            <Link to="/login" className={`text-accent ${focusRing}`}>
              Iniciá sesión
            </Link>{" "}
            para calificar.
          </p>
        )}
      </div>

      {isStale && (
        <p role="alert" className="text-secondary text-danger">
          Esta reseña cambió en otro lado. Recargá para ver lo último.
        </p>
      )}

      <TrackList
        tracks={album.tracks}
        albumId={album.id}
        albumTitle={album.title}
        artistName={album.artist.name}
        coverUrl={album.coverUrl}
      />

      {/* Actividad de la comunidad: número grande + distribución real de
          estrellas, calculada de las reseñas que existen — nada inflado. */}
      <section
        aria-label="Actividad de la comunidad"
        className="flex flex-col gap-4 rounded-lg border border-border bg-bg-surface p-4"
      >
        <h2 className="text-section-title text-text-primary">Actividad de la comunidad</h2>

        {averageRating === null ? (
          <p className="text-body text-text-secondary">Nadie calificó este álbum todavía.</p>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <span className="text-page-title text-text-primary">{averageRating.toFixed(1)}</span>
              <div className="flex flex-col gap-1">
                <RatingStars value={averageRating} readOnly label="Promedio" />
                <span className="text-secondary text-text-muted">
                  {totalReviews} reseña{totalReviews === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              {histogram.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="w-6 shrink-0 text-right text-label text-text-muted">{star}★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-hover">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${(count / maxHistogramCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-4 shrink-0 text-label text-text-muted">{count}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <button
          type="button"
          onClick={handleShare}
          className={`flex min-h-11 w-fit items-center gap-2 rounded bg-bg-raised px-4 text-secondary font-semibold text-text-primary hover:bg-bg-hover ${focusRing}`}
        >
          <ShareIcon />
          Compartir
        </button>
      </section>

      <section aria-label="Tu reseña" className="flex flex-col gap-2 rounded-lg border border-border bg-bg-surface p-4">
        {!showForm && myReview ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="text-label uppercase text-text-muted">Tu reseña</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleStartEdit}
                  aria-label="Editar tu reseña"
                  className={`flex size-11 items-center justify-center rounded text-text-secondary hover:text-text-primary ${focusRing}`}
                >
                  <PencilIcon />
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteReview.isPending}
                  aria-label="Eliminar tu reseña"
                  className={`flex size-11 items-center justify-center rounded text-text-secondary hover:text-danger disabled:opacity-50 ${focusRing}`}
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
            {myReview.isRelisten && (
              <span className="w-fit rounded-full bg-bg-raised px-2 py-0.5 text-label text-text-secondary">
                Reescucha
              </span>
            )}
            <p className="text-body text-text-secondary">
              {myReview.text || <span className="text-text-muted">Sin comentario.</span>}
            </p>
          </>
        ) : (
          <>
            <label htmlFor="review-text" className="text-label uppercase text-text-muted">
              Tu reseña (opcional)
            </label>
            <textarea
              id="review-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className={`min-h-24 rounded bg-bg-raised p-3 text-body text-text-primary ${focusRing}`}
              placeholder="¿Qué te pareció?"
            />
            <label className="flex min-h-11 items-center gap-2 text-secondary text-text-secondary">
              <input
                type="checkbox"
                checked={isRelisten}
                onChange={(e) => setIsRelisten(e.target.checked)}
                className={focusRing}
              />
              Es una reescucha
            </label>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveReview}
                disabled={!currentUser || rateAlbum.isPending}
                className="flex-1"
              >
                Guardar reseña
              </Button>
              {myReview && (
                <Button variant="secondary" onClick={handleCancelEdit}>
                  Cancelar
                </Button>
              )}
            </div>
          </>
        )}
      </section>

      <section aria-label="Reseñas" className="flex flex-col gap-3">
        <h2 className="text-section-title text-text-primary">Reseñas</h2>
        {reviews.length === 0 && <p className="text-body text-text-secondary">Todavía no hay reseñas.</p>}
        {reviews.length > 0 && (
          <ul className="flex flex-col gap-3">
            {reviews.map((review) => {
              const author = usersById.get(review.userId);
              return (
                <li
                  key={review.id}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-bg-surface p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-strong text-label text-text-primary">
                        {author ? initials(author.username) : "?"}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-secondary font-semibold text-text-primary">
                          {author?.username ?? "Usuario desconocido"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-label text-text-muted">
                            {new Date(review.createdAt).toLocaleDateString("es", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          {review.isRelisten && (
                            <span className="rounded-full bg-bg-raised px-1.5 py-0.5 text-label text-text-secondary">
                              Reescucha
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <RatingStars value={review.rating} readOnly label="Calificación" />
                  </div>
                  {review.text && <p className="text-body text-text-secondary">{review.text}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </article>
  );
}
