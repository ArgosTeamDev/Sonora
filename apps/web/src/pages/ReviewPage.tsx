import type { JSX } from "react";
import { Link, useParams } from "react-router-dom";
import { useReview } from "@/entities/review/api";
import { useAlbum } from "@/entities/album/api";
import { useUsers } from "@/entities/user/api";
import { RatingStars } from "@/entities/review/ui/RatingStars";

export function ReviewPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { data: review, isLoading, isError } = useReview(id ?? "");
  const { data: album } = useAlbum(review?.albumId ?? "");
  const { data: users } = useUsers();

  if (isLoading) {
    return <p className="px-4 pt-8 text-body text-text-secondary">Cargando reseña…</p>;
  }
  if (isError || !review) {
    return (
      <p role="alert" className="px-4 pt-8 text-body text-text-secondary">
        Reseña no encontrada.
      </p>
    );
  }

  const author = users?.find((u) => u.id === review.userId);
  const focusRing =
    "outline-none rounded focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base";

  return (
    <article className="flex flex-col gap-4 px-4 pt-8">
      <div>
        <h1 className="text-page-title text-text-primary">
          {album ? (
            <Link to={`/albums/${album.id}`} className={focusRing}>
              {album.title} — {album.artist.name}
            </Link>
          ) : (
            "Reseña"
          )}
        </h1>
        <p className="text-secondary text-text-muted">
          Por{" "}
          {author ? (
            <Link to={`/u/${author.username}`} className={`text-accent ${focusRing}`}>
              {author.username}
            </Link>
          ) : (
            "usuario desconocido"
          )}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <RatingStars value={review.rating} readOnly label="Calificación" size="lg" />
        {review.isRelisten && (
          <span className="rounded-full bg-bg-raised px-2 py-0.5 text-label text-text-secondary">
            Reescucha
          </span>
        )}
      </div>

      {review.text && <p className="text-body text-text-secondary">{review.text}</p>}

      <p className="text-secondary text-text-muted">
        Escuchado el {new Date(review.listenedAt).toLocaleDateString("es")}
      </p>
    </article>
  );
}
