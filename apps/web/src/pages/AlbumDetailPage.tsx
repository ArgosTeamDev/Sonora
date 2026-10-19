import { useEffect, useState } from "react";
import type { JSX } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { ListeningFormat } from "@project/shared";
import { useAlbum, useAlbums } from "@/entities/album/api";
import { useReviews } from "@/entities/review/api";
import { useUsers } from "@/entities/user/api";
import { useCurrentUser } from "@/entities/auth/api";
import { RatingStars } from "@/entities/review/ui/RatingStars";
import { CommunityReviewCard } from "@/entities/review/ui/CommunityReviewCard";
import { FORMAT_LABELS, LISTENING_FORMATS, formatTag } from "@/entities/review/format";
import { AlbumCard } from "@/entities/album/ui/AlbumCard";
import { AlbumSpecs } from "@/entities/album/ui/AlbumSpecs";
import { TrackList } from "@/entities/album/ui/TrackList";
import { useFavorites } from "@/entities/favorite/api";
import { useRateAlbum } from "@/features/rate-album/useRateAlbum";
import { useDeleteReview } from "@/features/delete-review/useDeleteReview";
import { useFavoriteAlbum } from "@/features/favorite-album/useFavoriteAlbum";
import { AddToListDialog } from "@/features/add-to-list/AddToListDialog";
import { HttpError } from "@/shared/api/http";
import { Button } from "@/shared/ui/Button";

const focusRing =
  "outline-none rounded focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base";

const HISTOGRAM_STARS = [5, 4, 3, 2, 1] as const;
// Collapsed community list: two cards on a phone, four on desktop.
const REVIEWS_COLLAPSED_MOBILE = 2;
const REVIEWS_COLLAPSED_DESKTOP = 4;
const SIMILAR_ALBUMS = 4;

type AlbumTab = "tracks" | "specs";

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

function ListAddIcon(): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h11M4 12h8M4 17h8M18 12v6M15 15h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function StarGlyph({ size = 12 }: { size?: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
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
  const reviews = (allReviews ?? [])
    .filter((r) => r.albumId === albumId)
    .sort((a, b) => new Date(b.listenedAt).getTime() - new Date(a.listenedAt).getTime());
  const usersById = new Map((users ?? []).map((u) => [u.id, u]));
  const myReview = currentUser ? (reviews.find((r) => r.userId === currentUser.id) ?? null) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState("");
  const [isRelisten, setIsRelisten] = useState(false);
  const [format, setFormat] = useState<ListeningFormat | "">("");
  const [formatDetail, setFormatDetail] = useState("");
  const [hasSyncedDraft, setHasSyncedDraft] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [tab, setTab] = useState<AlbumTab>("tracks");
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);

  useEffect(() => {
    if (myReview && !hasSyncedDraft) {
      setText(myReview.text ?? "");
      setIsRelisten(myReview.isRelisten);
      setFormat(myReview.format ?? "");
      setFormatDetail(myReview.formatDetail ?? "");
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

  // "More like this": same first genre, best rated, minus the album itself.
  const firstGenre = album?.genres[0];
  const { data: similarCandidates } = useAlbums({ genre: firstGenre, sort: "rating" }, Boolean(firstGenre));
  const similarAlbums = (similarCandidates ?? []).filter((a) => a.id !== albumId).slice(0, SIMILAR_ALBUMS);

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
  const writtenCount = reviews.filter((r) => r.text).length;
  const relistenCount = reviews.filter((r) => r.isRelisten).length;

  // How the community listened, most-used first — feeds the cover badge and
  // the spec sheet.
  const formatCounts = LISTENING_FORMATS.map((f) => ({
    format: f,
    count: reviews.filter((r) => r.format === f).length,
  }))
    .filter((f) => f.count > 0)
    .sort((a, b) => b.count - a.count);
  const topFormatTag = formatCounts[0]
    ? (formatTag(reviews.find((r) => r.format === formatCounts[0]!.format)!) ?? null)
    : null;

  // Only claim acclaim when there's enough of a crowd behind it.
  const acclaim =
    averageRating !== null && totalReviews >= 3
      ? averageRating >= 4.5
        ? "Aclamación universal"
        : averageRating >= 4
          ? "Muy bien valorado"
          : null
      : null;

  const totalMs = album.tracks.reduce((sum, t) => sum + (t.durationMs ?? 0), 0);
  const metaLine = [
    String(album.year),
    album.tracks.length > 0
      ? `${album.tracks.length} pista${album.tracks.length === 1 ? "" : "s"}${
          totalMs > 0 ? `, ${Math.round(totalMs / 60000)} min` : ""
        }`
      : null,
  ].filter(Boolean);

  const reviewsToShow = showAllReviews ? reviews : reviews.slice(0, REVIEWS_COLLAPSED_DESKTOP);

  const handleRate = (rating: number): void => {
    rateAlbum.mutate(
      { rating },
      { onSuccess: () => setStatusMessage(`Calificaste ${album.title} con ${rating} de 5 estrellas.`) },
    );
  };

  const handleSaveReview = (): void => {
    rateAlbum.mutate(
      {
        rating: displayedRating,
        text: text || null,
        isRelisten,
        format: format || null,
        formatDetail: format ? formatDetail.trim() || null : null,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          setStatusMessage("Reseña guardada.");
        },
      },
    );
  };

  const resetDraft = (): void => {
    setText(myReview?.text ?? "");
    setIsRelisten(myReview?.isRelisten ?? false);
    setFormat(myReview?.format ?? "");
    setFormatDetail(myReview?.formatDetail ?? "");
  };

  const handleStartEdit = (): void => {
    resetDraft();
    setIsEditing(true);
  };

  const handleCancelEdit = (): void => {
    resetDraft();
    setIsEditing(false);
  };

  // "Registrar escucha": take the person to the review form, opening it
  // first if they already have a review.
  const handleLogListen = (): void => {
    if (myReview && !isEditing) handleStartEdit();
    window.requestAnimationFrame(() => {
      const section = document.getElementById("review-section");
      section?.scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById("review-text")?.focus({ preventScroll: true });
    });
  };

  const handleDelete = (): void => {
    if (!myReview) return;
    if (!window.confirm("¿Eliminar tu reseña de este álbum?")) return;
    deleteReview.mutate(myReview.id, {
      onSuccess: () => {
        setText("");
        setIsRelisten(false);
        setFormat("");
        setFormatDetail("");
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

  const secondaryAction = `flex size-11 items-center justify-center rounded bg-bg-hover text-text-secondary hover:text-text-primary disabled:opacity-50 ${focusRing}`;

  return (
    <article className="relative flex flex-col gap-8 overflow-x-clip px-4 pb-8 pt-2 lg:px-6">
      {/* Announces rating/save/delete/share outcomes to screen reader users,
          who otherwise get no confirmation that an optimistic update landed. */}
      <p role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </p>

      {/* Soft glow behind the sleeve. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 size-72 -translate-x-1/2 rounded-full bg-accent-cta/20 blur-3xl lg:left-[170px]"
      />

      <button
        type="button"
        onClick={() => navigate(-1)}
        className={`relative flex min-h-11 w-fit items-center gap-1.5 pr-2 text-secondary font-semibold text-text-secondary hover:text-text-primary lg:hidden ${focusRing}`}
      >
        <BackIcon />
        Volver
      </button>
      <nav aria-label="Ruta" className="relative hidden items-center gap-2 text-secondary text-text-muted lg:flex">
        <Link to="/explore" className={`hover:text-text-primary ${focusRing}`}>
          Explorar
        </Link>
        <span aria-hidden="true">›</span>
        <Link to={`/artists/${album.artist.slug}`} className={`hover:text-text-primary ${focusRing}`}>
          {album.artist.name}
        </Link>
        <span aria-hidden="true">›</span>
        <span className="text-text-primary" aria-current="page">
          {album.title} ({album.year})
        </span>
      </nav>

      {/* Hero: cover | title block | community stats. Stacked on a phone, in
          the order cover → title → your rating → community. */}
      <div className="relative -mt-4 flex flex-col gap-6 lg:mt-0 lg:grid lg:grid-cols-[280px_minmax(0,1fr)_320px] lg:items-start lg:gap-x-8">
        <div className="relative flex justify-center py-3 lg:col-start-1 lg:row-start-1 lg:justify-start lg:py-0">
          {/* The record peeking out of the sleeve (phones only; on desktop the
              title block sits right next to the cover). */}
          <div
            aria-hidden="true"
            className="absolute right-0 top-0 flex size-48 rotate-12 items-center justify-center rounded-full bg-bg-deep shadow-2xl lg:hidden"
          >
            <div className="flex size-36 items-center justify-center rounded-full bg-bg-hover/40">
              <div className="flex size-16 items-center justify-center rounded-full bg-accent-strong/20">
                <div className="size-4 rounded-full bg-bg-deep" />
              </div>
            </div>
          </div>
          <div className="relative size-56 shrink-0 overflow-hidden rounded-lg bg-bg-surface shadow-2xl lg:size-[280px]">
            {album.coverUrl ? (
              <img src={album.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center px-2 text-center text-label text-text-muted">
                Sin portada
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-bg-deep/80 via-bg-deep/0 to-white/5" />
            {topFormatTag && (
              <span className="absolute left-2.5 top-2.5 rounded-xl bg-bg-deep/85 px-2 py-0.5 text-[10px] uppercase tracking-[0.5px] text-accent backdrop-blur-sm">
                {topFormatTag}
              </span>
            )}
            {averageRating !== null && (
              <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-xl bg-bg-deep/90 px-2 py-1 text-label text-text-primary backdrop-blur-sm">
                <span className="text-accent">
                  <StarGlyph />
                </span>
                {averageRating.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        <div className="relative flex flex-col items-center gap-1 text-center lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:items-start lg:text-left">
          {acclaim && (
            <span className="mb-1 inline-flex items-center gap-1.5 rounded-xl bg-accent/10 px-2.5 py-0.5 text-label uppercase text-accent">
              <StarGlyph size={11} />
              {acclaim}
            </span>
          )}
          <h1 className="px-2 text-[26px] font-extrabold leading-8 tracking-[-0.65px] text-text-primary lg:px-0 lg:text-page-title-lg">
            {album.title}
          </h1>
          <Link
            to={`/artists/${album.artist.slug}`}
            className={`pt-1 text-section-title-lg text-accent hover:underline ${focusRing}`}
          >
            {album.artist.name}
          </Link>
          <p className="flex items-center gap-2 pt-1 text-secondary text-text-secondary">
            {metaLine.map((part, i) => (
              <span key={part} className="flex items-center gap-2">
                {i > 0 && (
                  <span className="text-border" aria-hidden="true">
                    •
                  </span>
                )}
                {part}
              </span>
            ))}
          </p>
          {album.genres.length > 0 && (
            <ul className="flex flex-wrap justify-center gap-1.5 pt-3 lg:justify-start">
              {album.genres.map((genre) => (
                <li
                  key={genre}
                  className="rounded-xl bg-bg-hover px-2.5 py-1 text-label uppercase text-text-secondary"
                >
                  {genre}
                </li>
              ))}
            </ul>
          )}
          {album.editorialNote && (
            <blockquote className="mt-4 rounded-lg border-l-2 border-accent bg-bg-surface/60 p-4 text-left text-body text-text-secondary">
              {album.editorialNote}
            </blockquote>
          )}
        </div>

        {/* Your rating + quick actions. */}
        <div className="relative flex flex-col gap-3 rounded-lg bg-bg-surface p-3 pt-5 lg:col-start-1 lg:row-start-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-label uppercase text-text-secondary">Tu calificación</span>
            <span className="text-secondary font-bold text-accent">
              {myReview ? `${myReview.rating.toFixed(1)} / 5` : "Sin calificar"}
            </span>
          </div>
          <div className="flex justify-center">
            <RatingStars
              value={myReview?.rating ?? 0}
              onChange={currentUser ? handleRate : undefined}
              label="Calificar este álbum"
              size="lg"
            />
          </div>
          {isStale && (
            <p role="alert" className="text-secondary text-danger">
              Esta reseña cambió en otro lado. Recargá para ver lo último.
            </p>
          )}
          {currentUser ? (
            <div className="grid grid-cols-5 gap-2">
              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={favoriteAlbum.isPending}
                aria-pressed={isFavorite}
                aria-label={isFavorite ? `Quitar ${album.title} de favoritos` : `Agregar ${album.title} a favoritos`}
                className={`${secondaryAction} w-full ${isFavorite ? "text-danger hover:text-danger" : ""}`}
              >
                <HeartIcon filled={isFavorite} />
              </button>
              <button
                type="button"
                onClick={() => setIsListDialogOpen(true)}
                aria-label="Añadir a una lista"
                className={`${secondaryAction} w-full`}
              >
                <ListAddIcon />
              </button>
              <button
                type="button"
                onClick={handleLogListen}
                className={`col-span-3 flex min-h-11 items-center justify-center gap-1.5 rounded bg-accent-strong px-3 text-secondary font-semibold text-on-accent shadow-md hover:brightness-110 ${focusRing}`}
              >
                {myReview ? "Editar mi reseña" : "Registrar escucha"}
              </button>
            </div>
          ) : (
            <p className="px-1 text-center text-secondary text-text-muted">
              <Link to="/login" className={`text-accent ${focusRing}`}>
                Iniciá sesión
              </Link>{" "}
              para calificar y registrar tus escuchas.
            </p>
          )}
        </div>

        {/* Community numbers. */}
        <section
          aria-label="Actividad de la comunidad"
          className="relative flex flex-col gap-3 rounded-lg bg-bg-surface p-4 lg:col-start-3 lg:row-span-2 lg:row-start-1"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-label uppercase text-text-secondary">Actividad de la comunidad</h2>
            <button
              type="button"
              onClick={handleShare}
              aria-label="Compartir álbum"
              className={`flex size-11 -my-2 -mr-2 items-center justify-center rounded text-text-secondary hover:text-text-primary ${focusRing}`}
            >
              <ShareIcon />
            </button>
          </div>

          {averageRating === null ? (
            <p className="text-body text-text-secondary">Nadie calificó este álbum todavía.</p>
          ) : (
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-4 pt-1 lg:grid-cols-1">
              <div className="flex flex-col">
                <span className="text-4xl font-extrabold leading-9 tracking-[-0.9px] text-text-primary">
                  {averageRating.toFixed(1)}
                </span>
                <div className="pt-1">
                  <RatingStars value={averageRating} readOnly label="Promedio" />
                </div>
                <span className="pt-1 text-[11px] text-text-secondary">
                  {totalReviews} voto{totalReviews === 1 ? "" : "s"}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                {histogram.map(({ star, count }) => (
                  <div key={star} className="flex items-center gap-1.5">
                    <span className="w-4 shrink-0 text-right text-[10px] text-text-secondary">{star}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-hover">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${(count / maxHistogramCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-1.5 lg:flex-row">
                <div className="flex flex-1 flex-col items-center rounded bg-bg-hover px-2 py-1.5">
                  <span className="text-[15px] text-text-primary">{writtenCount}</span>
                  <span className="text-[9px] uppercase text-text-secondary">Reseñas</span>
                </div>
                <div className="flex flex-1 flex-col items-center rounded bg-bg-hover px-2 py-1.5">
                  <span className="text-[15px] text-text-primary">{relistenCount}</span>
                  <span className="text-[9px] uppercase text-text-secondary">Reescuchas</span>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Tracks | spec sheet. A segmented switch on a phone, side by side on
          desktop. */}
      <div className="relative flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-x-8">
        <div
          role="group"
          aria-label="Contenido del álbum"
          className="flex gap-1 rounded bg-bg-surface p-1 lg:hidden"
        >
          {(
            [
              ["tracks", "Canciones"],
              ["specs", "Ficha técnica"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={`min-h-11 flex-1 rounded-md px-3 text-secondary font-semibold motion-safe:transition-colors ${focusRing} ${
                tab === id ? "bg-accent text-on-accent shadow-sm" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={tab === "tracks" ? "flex flex-col gap-3" : "hidden flex-col gap-3 lg:flex"}>
          <h2 className="hidden text-section-title-lg text-text-primary lg:block">Lista de canciones</h2>
          {album.tracks.length > 0 ? (
            <TrackList
              tracks={album.tracks}
              albumId={album.id}
              albumTitle={album.title}
              artistName={album.artist.name}
              coverUrl={album.coverUrl}
            />
          ) : (
            <p className="text-body text-text-secondary">Este álbum no tiene lista de canciones disponible.</p>
          )}
        </div>

        <div className={tab === "specs" ? "flex flex-col gap-3" : "hidden flex-col gap-3 lg:flex"}>
          <h2 className="hidden text-section-title-lg text-text-primary lg:block">Ficha audiófila</h2>
          <AlbumSpecs album={album} formatCounts={formatCounts} />
        </div>
      </div>

      <section
        id="review-section"
        aria-label="Tu reseña"
        className="relative flex scroll-mt-20 flex-col gap-2 rounded-lg bg-bg-surface p-4"
      >
        {!showForm && myReview ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="text-label uppercase text-text-secondary">Tu reseña</span>
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
            <div className="flex flex-wrap gap-1.5">
              {myReview.isRelisten && (
                <span className="rounded-sm bg-bg-hover px-2 py-0.5 text-label uppercase text-text-secondary">
                  Reescucha
                </span>
              )}
              {formatTag(myReview) && (
                <span className="rounded-sm bg-bg-hover px-2 py-0.5 text-label uppercase text-accent">
                  {formatTag(myReview)}
                </span>
              )}
            </div>
            <p className="text-body text-text-secondary">
              {myReview.text || <span className="text-text-muted">Sin comentario.</span>}
            </p>
          </>
        ) : (
          <>
            <label htmlFor="review-text" className="text-label uppercase text-text-secondary">
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
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-label uppercase text-text-muted">Formato (opcional)</span>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as ListeningFormat | "")}
                  className={`min-h-11 rounded bg-bg-raised px-3 text-body text-text-primary ${focusRing}`}
                >
                  <option value="">Sin especificar</option>
                  {LISTENING_FORMATS.map((f) => (
                    <option key={f} value={f}>
                      {FORMAT_LABELS[f]}
                    </option>
                  ))}
                </select>
              </label>
              {format && (
                <label className="flex flex-1 flex-col gap-1.5">
                  <span className="text-label uppercase text-text-muted">Detalle (180g, 45 RPM…)</span>
                  <input
                    value={formatDetail}
                    onChange={(e) => setFormatDetail(e.target.value)}
                    maxLength={32}
                    className={`min-h-11 rounded bg-bg-raised px-3 text-body text-text-primary ${focusRing}`}
                  />
                </label>
              )}
            </div>
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

      <section aria-label="Reseñas de la comunidad" className="relative flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-section-title-lg font-bold text-text-primary">Reseñas de la comunidad</h2>
            <span className="rounded-xl bg-bg-hover px-2 py-0.5 text-label text-text-secondary">{totalReviews}</span>
          </div>
          {totalReviews > REVIEWS_COLLAPSED_MOBILE && (
            <button
              type="button"
              onClick={() => setShowAllReviews((v) => !v)}
              aria-expanded={showAllReviews}
              className={`min-h-11 px-1 text-secondary font-semibold text-accent ${
                totalReviews > REVIEWS_COLLAPSED_DESKTOP ? "" : "lg:hidden"
              } ${focusRing}`}
            >
              {showAllReviews ? "Ver menos" : "Ver todas"}
            </button>
          )}
        </div>
        {totalReviews === 0 && <p className="text-body text-text-secondary">Todavía no hay reseñas.</p>}
        {reviewsToShow.length > 0 && (
          <ul className="grid gap-3 lg:grid-cols-2">
            {reviewsToShow.map((review, index) => (
              <CommunityReviewCard
                key={review.id}
                review={review}
                author={usersById.get(review.userId)}
                className={!showAllReviews && index >= REVIEWS_COLLAPSED_MOBILE ? "hidden lg:flex" : "flex"}
              />
            ))}
          </ul>
        )}
      </section>

      {similarAlbums.length > 0 && (
        <section aria-label="Más como este álbum" className="relative flex flex-col gap-3">
          <div className="flex flex-col">
            <h2 className="text-section-title-lg font-bold text-text-primary">Si te fascina este álbum</h2>
            <p className="text-secondary text-text-muted">Más de {firstGenre}.</p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-4">
            {similarAlbums.map((similar) => (
              <AlbumCard key={similar.id} album={similar} variant="grid" />
            ))}
          </div>
        </section>
      )}

      {isListDialogOpen && currentUser && (
        <AddToListDialog
          username={currentUser.username}
          albumId={album.id}
          albumTitle={album.title}
          onClose={() => setIsListDialogOpen(false)}
        />
      )}
    </article>
  );
}
