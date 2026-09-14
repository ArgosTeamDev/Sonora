import { useState } from "react";
import type { JSX } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useFollowers, useFollowing, useUser } from "@/entities/user/api";
import { useCurrentUser } from "@/entities/auth/api";
import { AlbumCard } from "@/entities/album/ui/AlbumCard";
import { useAlbumsByIds } from "@/entities/album/api";
import { useReviews } from "@/entities/review/api";
import { ReviewRow } from "@/entities/review/ui/ReviewRow";
import { useFavorites } from "@/entities/favorite/api";
import { useFollowUser } from "@/features/follow-user/useFollowUser";
import { useEditProfile } from "@/features/edit-profile/useEditProfile";
import { useDeleteReview } from "@/features/delete-review/useDeleteReview";
import { FavoriteAlbumCard } from "@/features/favorite-album/FavoriteAlbumCard";
import { FavoriteReviewRow } from "@/features/favorite-album/FavoriteReviewRow";
import { useLogout } from "@/features/auth/useAuthMutations";
import { FollowListDialog } from "@/entities/user/ui/FollowListDialog";
import { Button } from "@/shared/ui/Button";

const HISTOGRAM_STARS = [5, 4, 3, 2, 1] as const;

const focusRing =
  "outline-none rounded focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base";

function initials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

function SearchIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

export function ProfilePage(): JSX.Element {
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();
  const { data: user, isLoading: userLoading, isError: userError } = useUser(username ?? "");
  // Same global list the rate/delete mutations patch (see MyReviewsPage),
  // filtered to this profile's user — so editing or deleting a review from
  // any other page is reflected here immediately too.
  const { data: allReviews, isLoading: reviewsLoading } = useReviews();
  const reviews = (allReviews ?? []).filter((r) => r.userId === user?.id);
  const { data: favoriteEntries } = useFavorites(username ?? "");
  // A review or a favorite can point at any album found via search, not
  // just a curated one — resolve exactly the ids these need instead of
  // relying on the browsable catalog.
  const { data: albums } = useAlbumsByIds([
    ...new Set([...reviews.map((r) => r.albumId), ...(favoriteEntries ?? []).map((f) => f.albumId)]),
  ]);
  const { data: currentUser } = useCurrentUser();
  const { data: myFollowing } = useFollowing(currentUser?.username ?? "");
  const { data: followers } = useFollowers(username ?? "");
  const { data: following } = useFollowing(username ?? "");
  const [statusMessage, setStatusMessage] = useState("");
  const [openList, setOpenList] = useState<"followers" | "following" | null>(null);

  const isOwnProfile = Boolean(currentUser && username === currentUser.username);
  const isFollowing = Boolean(user && myFollowing?.some((u) => u.id === user.id));
  const followUser = useFollowUser({
    followerUser: currentUser ?? { id: "", username: "", name: "", bio: null, avatarUrl: null, createdAt: new Date(), version: 1 },
    targetUser: user ?? { id: "", username: "", name: "", bio: null, avatarUrl: null, createdAt: new Date(), version: 1 },
  });
  const deleteReview = useDeleteReview();
  const editProfile = useEditProfile(username ?? "");
  const logout = useLogout();

  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftBio, setDraftBio] = useState("");
  const [draftAvatarUrl, setDraftAvatarUrl] = useState("");

  if (userLoading) {
    return <p className="px-4 pt-8 text-body text-text-secondary">Cargando perfil…</p>;
  }
  if (userError || !user) {
    return (
      <p role="alert" className="px-4 pt-8 text-body text-text-secondary">
        Usuario no encontrado.
      </p>
    );
  }

  const albumsById = new Map((albums ?? []).map((a) => [a.id, a]));
  const reviewedCount = reviews.length;
  const writtenCount = reviews.filter((r) => r.text).length;

  const reviewsByRecency = [...reviews].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // A real, user-picked list (the heart toggle on the album page), not a
  // computed "top rated" stand-in — most recently favorited first.
  const favorites = [...(favoriteEntries ?? [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((f) => albumsById.get(f.albumId))
    .filter((album): album is NonNullable<typeof album> => Boolean(album));
  const favoriteAlbumIds = new Set((favoriteEntries ?? []).map((f) => f.albumId));

  const totalReviews = reviews.length;
  const averageRating = totalReviews === 0 ? null : reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
  const histogram = HISTOGRAM_STARS.map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));
  const maxHistogramCount = Math.max(1, ...histogram.map((h) => h.count));

  const handleShare = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setStatusMessage("Enlace copiado.");
    } catch {
      setStatusMessage("No se pudo copiar el enlace.");
    }
  };

  const handleStartEdit = (): void => {
    setDraftName(user.name);
    setDraftBio(user.bio ?? "");
    setDraftAvatarUrl(user.avatarUrl ?? "");
    setIsEditing(true);
  };

  const handleSaveProfile = (): void => {
    editProfile.mutate(
      {
        version: user.version,
        name: draftName.trim(),
        bio: draftBio.trim() || null,
        avatarUrl: draftAvatarUrl.trim() || null,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          setStatusMessage("Perfil actualizado.");
        },
      },
    );
  };

  const handleLogout = (): void => {
    logout.mutate(undefined, { onSuccess: () => navigate("/") });
  };

  const handleDeleteReview = (reviewId: string, albumTitle: string): void => {
    if (!window.confirm(`¿Eliminar tu reseña de ${albumTitle}?`)) return;
    deleteReview.mutate(reviewId, {
      onSuccess: () => setStatusMessage("Reseña eliminada."),
    });
  };

  return (
    <article className="flex flex-col gap-6 px-4 pt-8">
      <p role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </p>

      <header className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-strong text-section-title-lg text-text-primary">
              {(isEditing ? draftAvatarUrl : user.avatarUrl) ? (
                <img
                  src={isEditing ? draftAvatarUrl : (user.avatarUrl as string)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                initials(user.username)
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {isEditing ? (
                <label className="flex flex-col gap-1">
                  <span className="sr-only">Nombre</span>
                  <input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className={`min-h-11 w-full rounded bg-bg-raised px-3 text-page-title text-text-primary ${focusRing}`}
                  />
                </label>
              ) : (
                <h1 className="text-page-title text-text-primary">{user.name}</h1>
              )}
              <p className="text-secondary text-accent">@{user.username}</p>
              <p className="text-label text-text-muted">
                Miembro desde {new Date(user.createdAt).getFullYear()}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {!isOwnProfile && currentUser && (
              <Button
                variant={isFollowing ? "secondary" : "primary"}
                onClick={() => followUser.mutate(!isFollowing)}
                disabled={followUser.isPending}
                aria-pressed={isFollowing}
              >
                {isFollowing ? "Siguiendo" : "Seguir"}
              </Button>
            )}
            {isOwnProfile && !isEditing && (
              <>
                <Button variant="secondary" onClick={handleStartEdit}>
                  Editar perfil
                </Button>
                <Button variant="ghost" onClick={handleLogout} disabled={logout.isPending}>
                  Cerrar sesión
                </Button>
              </>
            )}
            <Link
              to="/people"
              aria-label="Buscar perfiles"
              className={`flex size-11 shrink-0 items-center justify-center rounded bg-bg-raised text-text-secondary hover:bg-bg-hover hover:text-text-primary ${focusRing}`}
            >
              <SearchIcon />
            </Link>
            <button
              type="button"
              onClick={handleShare}
              aria-label="Compartir perfil"
              className={`flex size-11 shrink-0 items-center justify-center rounded bg-bg-raised text-text-secondary hover:bg-bg-hover hover:text-text-primary ${focusRing}`}
            >
              <ShareIcon />
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-label uppercase text-text-muted">Bio</span>
              <textarea
                value={draftBio}
                onChange={(e) => setDraftBio(e.target.value)}
                rows={2}
                maxLength={300}
                className={`min-h-16 rounded bg-bg-raised p-3 text-body text-text-primary ${focusRing}`}
                placeholder="Contá algo sobre vos"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-label uppercase text-text-muted">URL del avatar (opcional)</span>
              <input
                value={draftAvatarUrl}
                onChange={(e) => setDraftAvatarUrl(e.target.value)}
                placeholder="https://…"
                className={`min-h-11 rounded bg-bg-raised px-3 text-body text-text-primary ${focusRing}`}
              />
            </label>
            {editProfile.isError && (
              <p role="alert" className="text-secondary text-danger">
                No se pudo guardar. Revisá los datos e intentá de nuevo.
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleSaveProfile}
                disabled={editProfile.isPending || draftName.trim().length === 0}
              >
                Guardar
              </Button>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          user.bio && <p className="text-body text-text-secondary">{user.bio}</p>
        )}
      </header>

      {/* Bare numbers, no card: these are stats about the person above,
          not a piece of content in their own right. A hairline divider
          between them is enough structure. Followers/following come from
          the real Follow relation and open a list of who they actually
          are; there's no "curated lists" count since no Lists entity
          exists yet. */}
      <div className="flex divide-x divide-border">
        <div className="flex flex-1 flex-col gap-1 pr-4">
          <span className="text-3xl font-extrabold text-text-primary">{reviewedCount}</span>
          <span className="text-label uppercase text-text-muted">Álbumes</span>
        </div>
        <div className="flex flex-1 flex-col gap-1 px-4">
          <span className="text-3xl font-extrabold text-text-primary">{writtenCount}</span>
          <span className="text-label uppercase text-text-muted">Reseñas</span>
        </div>
        <button
          type="button"
          onClick={() => setOpenList("followers")}
          className={`flex flex-1 flex-col items-start gap-1 rounded px-4 text-left ${focusRing}`}
        >
          <span className="text-3xl font-extrabold text-text-primary">{followers?.length ?? 0}</span>
          <span className="text-label uppercase text-text-muted">Seguidores</span>
        </button>
        <button
          type="button"
          onClick={() => setOpenList("following")}
          className={`flex flex-1 flex-col items-start gap-1 rounded pl-4 text-left ${focusRing}`}
        >
          <span className="text-3xl font-extrabold text-text-primary">{following?.length ?? 0}</span>
          <span className="text-label uppercase text-text-muted">Siguiendo</span>
        </button>
      </div>

      {openList === "followers" && (
        <FollowListDialog title="Seguidores" users={followers ?? []} onClose={() => setOpenList(null)} />
      )}
      {openList === "following" && (
        <FollowListDialog title="Siguiendo" users={following ?? []} onClose={() => setOpenList(null)} />
      )}

      {(favorites.length > 0 || isOwnProfile) && (
        <section aria-label="Favoritos" className="flex flex-col gap-3">
          <h2 className="text-section-title text-text-primary">Favoritos</h2>
          {favorites.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
              {favorites.map((album) =>
                isOwnProfile && currentUser ? (
                  <FavoriteAlbumCard
                    key={album.id}
                    album={album}
                    variant="grid"
                    username={currentUser.username}
                    userId={currentUser.id}
                    isFavorite
                  />
                ) : (
                  <AlbumCard key={album.id} album={album} variant="grid" />
                ),
              )}
            </div>
          ) : (
            <p className="text-body text-text-secondary">
              Todavía no marcaste favoritos — tocá el corazón en cualquier álbum.
            </p>
          )}
        </section>
      )}

      {averageRating !== null && (
        <section
          aria-label="Distribución de calificaciones"
          className="flex flex-col gap-4 rounded-lg border border-border bg-bg-surface p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-section-title text-text-primary">Distribución de calificaciones</h2>
            <span className="text-secondary text-text-muted">
              Promedio <span className="font-semibold text-text-primary">{averageRating.toFixed(1)}</span>
            </span>
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
        </section>
      )}

      <section aria-label="Reseñas recientes" className="flex flex-col gap-3">
        <h2 className="text-section-title text-text-primary">Reseñas recientes</h2>
        {reviewsLoading && <p className="text-body text-text-secondary">Cargando reseñas…</p>}
        {reviews.length === 0 && (
          <p className="text-body text-text-secondary">Todavía no hay reseñas.</p>
        )}
        {reviewsByRecency.length > 0 && (
          <ul className="flex flex-col gap-3">
            {reviewsByRecency.map((review) => {
              const album = albumsById.get(review.albumId);
              if (!album) return null;
              if (isOwnProfile && currentUser) {
                return (
                  <FavoriteReviewRow
                    key={review.id}
                    review={review}
                    album={album}
                    username={currentUser.username}
                    userId={currentUser.id}
                    isFavorite={favoriteAlbumIds.has(album.id)}
                    onEdit={() => navigate(`/albums/${album.id}`)}
                    onDelete={() => handleDeleteReview(review.id, album.title)}
                    isDeleting={deleteReview.isPending}
                  />
                );
              }
              return <ReviewRow key={review.id} review={review} album={album} />;
            })}
          </ul>
        )}
      </section>
    </article>
  );
}
