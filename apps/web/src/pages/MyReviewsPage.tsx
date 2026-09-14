import { useState } from "react";
import type { JSX } from "react";
import { useNavigate } from "react-router-dom";
import { useReviews } from "@/entities/review/api";
import { useAlbumsByIds } from "@/entities/album/api";
import { useCurrentUser } from "@/entities/auth/api";
import { useDeleteReview } from "@/features/delete-review/useDeleteReview";
import { ReviewRow } from "@/entities/review/ui/ReviewRow";

type SortMode = "recent" | "rating";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "recent", label: "Más recientes" },
  { value: "rating", label: "Mejor calificadas" },
];

const focusRing =
  "outline-none rounded focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface";

export function MyReviewsPage(): JSX.Element {
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  // Same source of truth as the album detail page's rate/delete widgets: the
  // global reviews list. Reading from it here means a delete or edit made
  // from this page (or from an album page) is reflected everywhere at once,
  // instead of this list going stale behind a separate per-user cache.
  const { data: allReviews, isLoading, isError } = useReviews();
  const deleteReview = useDeleteReview();
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [statusMessage, setStatusMessage] = useState("");

  const myReviews = (allReviews ?? []).filter((r) => r.userId === currentUser?.id);
  // A review can point at any album found via search, not just a curated
  // one — resolve exactly the ids these reviews need instead of relying on
  // the browsable catalog.
  const { data: albums } = useAlbumsByIds([...new Set(myReviews.map((r) => r.albumId))]);

  if (isLoading) {
    return <p className="px-4 pt-8 text-body text-text-secondary">Cargando tus reseñas…</p>;
  }
  if (isError) {
    return (
      <p role="alert" className="px-4 pt-8 text-body text-text-secondary">
        No se pudieron cargar tus reseñas.
      </p>
    );
  }

  const albumsById = new Map((albums ?? []).map((a) => [a.id, a]));

  const sorted = [...myReviews].sort((a, b) =>
    sortMode === "rating"
      ? b.rating - a.rating
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const handleDelete = (reviewId: string, albumTitle: string): void => {
    if (!window.confirm(`¿Eliminar tu reseña de ${albumTitle}?`)) return;
    deleteReview.mutate(reviewId, {
      onSuccess: () => setStatusMessage("Reseña eliminada."),
    });
  };

  return (
    <section className="flex flex-col gap-6 px-4 pt-8">
      <p role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </p>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="text-page-title text-text-primary">Mis reseñas</h1>
          <p className="text-body text-text-secondary">
            {myReviews.length} álbum{myReviews.length === 1 ? "" : "es"} registrado
            {myReviews.length === 1 ? "" : "s"}
          </p>
        </div>
        {myReviews.length > 1 && (
          <label className="flex items-center gap-2">
            <span className="text-label uppercase text-text-muted">Ordenar</span>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className={`min-h-11 rounded bg-bg-raised px-3 text-secondary text-text-primary ${focusRing}`}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>

      {myReviews.length === 0 && (
        <p className="text-body text-text-secondary">Todavía no reseñaste nada.</p>
      )}

      {sorted.length > 0 && (
        <ul className="flex flex-col gap-3">
          {sorted.map((review) => {
            const album = albumsById.get(review.albumId);
            if (!album) return null;
            return (
              <ReviewRow
                key={review.id}
                review={review}
                album={album}
                onEdit={() => navigate(`/albums/${album.id}`)}
                onDelete={() => handleDelete(review.id, album.title)}
                isDeleting={deleteReview.isPending}
              />
            );
          })}
        </ul>
      )}
    </section>
  );
}
