import { useState } from "react";
import type { JSX } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useFollowers, useFollowing, useUser } from "@/entities/user/api";
import { useCurrentUser } from "@/entities/auth/api";
import { AlbumShelfItem } from "@/entities/album/ui/AlbumShelfItem";
import { useAlbumsByIds } from "@/entities/album/api";
import { useReviews } from "@/entities/review/api";
import { FORMAT_LABELS } from "@/entities/review/format";
import { useLists } from "@/entities/list/api";
import { ReviewRow } from "@/entities/review/ui/ReviewRow";
import { useFavorites } from "@/entities/favorite/api";
import { useFollowUser } from "@/features/follow-user/useFollowUser";
import { useEditProfile } from "@/features/edit-profile/useEditProfile";
import { useDeleteReview } from "@/features/delete-review/useDeleteReview";
import { FavoriteReviewRow } from "@/features/favorite-album/FavoriteReviewRow";
import { LogoutDialog } from "@/features/auth/LogoutDialog";
import { FollowListDialog, type FollowListTab } from "@/features/follow-user/FollowListDialog";
import { Button } from "@/shared/ui/Button";
import { PHYSICAL_FORMATS, type ListeningFormat, type Review, type User } from "@project/shared";

const HISTOGRAM_STARS = [5, 4, 3, 2, 1] as const;

const focusRing =
  "outline-none rounded focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base";

const EMPTY_USER: User = {
  id: "",
  username: "",
  name: "",
  bio: null,
  avatarUrl: null,
  location: null,
  badge: null,
  isProCurator: false,
  createdAt: new Date(),
  version: 1,
};

type ProfileTab = "diary" | "reviews" | "collection" | "stats";

const HABITS_WINDOW_DAYS = 30;
// Segment colors for the habits bar, most-listened format first.
const HABIT_COLORS = ["bg-accent", "bg-accent-strong", "bg-text-primary", "bg-accent-cta", "bg-text-muted"] as const;

interface HabitSegment {
  format: ListeningFormat;
  percent: number;
  details: string[];
}

// Share of the last 30 days' listens by format. Reviews without a format are
// left out of the denominator — they say nothing about how it was listened to.
function listeningHabits(reviews: Review[]): HabitSegment[] {
  const since = Date.now() - HABITS_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const recent = reviews.filter((r) => r.format && new Date(r.listenedAt).getTime() >= since);
  const byFormat = new Map<ListeningFormat, Review[]>();
  for (const review of recent) {
    const format = review.format as ListeningFormat;
    byFormat.set(format, [...(byFormat.get(format) ?? []), review]);
  }
  return [...byFormat.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([format, list]) => ({
      format,
      percent: Math.round((list.length / recent.length) * 100),
      details: [...new Set(list.map((r) => r.formatDetail?.toLowerCase()).filter((d): d is string => Boolean(d)))].slice(0, 2),
    }));
}

const iconButton = `flex size-11 shrink-0 items-center justify-center rounded bg-bg-raised text-text-secondary hover:bg-bg-hover hover:text-text-primary ${focusRing}`;

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

function HeartIcon(): JSX.Element {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 20.5s-7-4.35-9.5-8.8C.5 8.5 2 5 5.5 5c2 0 3.5 1.2 4.5 2.7C11 6.2 12.5 5 14.5 5 18 5 19.5 8.5 17.5 11.7 15 16.15 12 20.5 12 20.5z" />
    </svg>
  );
}

function StarIcon(): JSX.Element {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
    </svg>
  );
}

function PinIcon(): JSX.Element {
  return (
    <svg width="11" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function Stat({ value, label }: { value: number; label: string }): JSX.Element {
  return (
    <>
      <span className="text-2xl font-bold leading-7 tracking-tight text-text-primary">{value}</span>
      <span className="pt-0.5 text-label uppercase text-text-secondary">{label}</span>
    </>
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
  const { data: myFollowers } = useFollowers(currentUser?.username ?? "");
  const { data: lists } = useLists(username ?? "");
  const [statusMessage, setStatusMessage] = useState("");
  const [openList, setOpenList] = useState<FollowListTab | null>(null);

  const isOwnProfile = Boolean(currentUser && username === currentUser.username);
  const isFollowing = Boolean(user && myFollowing?.some((u) => u.id === user.id));
  const followUser = useFollowUser({
    followerUser: currentUser ?? EMPTY_USER,
    targetUser: user ?? EMPTY_USER,
  });
  const deleteReview = useDeleteReview();
  const editProfile = useEditProfile(username ?? "");
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftBio, setDraftBio] = useState("");
  const [draftAvatarUrl, setDraftAvatarUrl] = useState("");
  const [draftLocation, setDraftLocation] = useState("");
  const [draftBadge, setDraftBadge] = useState("");
  const [tab, setTab] = useState<ProfileTab>("diary");

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

  // The diary is ordered by when it was listened to, not when it was logged.
  const reviewsByRecency = [...reviews].sort(
    (a, b) => new Date(b.listenedAt).getTime() - new Date(a.listenedAt).getTime(),
  );
  const currentYear = new Date().getFullYear();
  const tabReviews: Record<Exclude<ProfileTab, "stats">, Review[]> = {
    diary: reviewsByRecency.filter((r) => new Date(r.listenedAt).getFullYear() === currentYear),
    reviews: reviewsByRecency.filter((r) => r.text),
    collection: reviewsByRecency.filter((r) => r.format && PHYSICAL_FORMATS.includes(r.format)),
  };
  const visibleReviews = tab === "stats" ? [] : tabReviews[tab];
  const latestReviewDate = visibleReviews[0] ? new Date(visibleReviews[0].listenedAt) : null;
  const habits = listeningHabits(reviews);
  const loggedThisMonth = reviews.filter((r) => {
    const d = new Date(r.listenedAt);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

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

  const avatarSrc = isEditing ? draftAvatarUrl : user.avatarUrl;

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
    setDraftLocation(user.location ?? "");
    setDraftBadge(user.badge ?? "");
    setIsEditing(true);
  };

  const handleSaveProfile = (): void => {
    editProfile.mutate(
      {
        version: user.version,
        name: draftName.trim(),
        bio: draftBio.trim() || null,
        avatarUrl: draftAvatarUrl.trim() || null,
        location: draftLocation.trim() || null,
        badge: draftBadge.trim() || null,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          setStatusMessage("Perfil actualizado.");
        },
      },
    );
  };

  const handleDeleteReview = (reviewId: string, albumTitle: string): void => {
    if (!window.confirm(`¿Eliminar tu reseña de ${albumTitle}?`)) return;
    deleteReview.mutate(reviewId, {
      onSuccess: () => setStatusMessage("Reseña eliminada."),
    });
  };

  return (
    <article className="flex flex-col pb-8">
      <p role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </p>

      {/* Ambient banner: the avatar, blurred and dimmed, fading into the page
          background. Without an avatar it's just the surface color. */}
      <div className="relative h-36 w-full overflow-hidden bg-bg-surface">
        <div aria-hidden="true" className="absolute inset-0">
          {avatarSrc && (
            <img src={avatarSrc} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-xl" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/60 to-bg-base/0" />
        </div>
        {user.isProCurator && (
          <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-xl bg-bg-hover/90 px-2.5 py-1 text-label uppercase tracking-[0.66px] text-accent shadow-sm backdrop-blur-sm">
            <StarIcon />
            Pro curator
          </span>
        )}
      </div>

      <div className="-mt-12 flex flex-col gap-6 px-4">
        <header className="flex flex-col gap-2">
          <div className="flex items-end justify-between gap-4">
            <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-4 border-bg-base bg-accent-strong text-section-title-lg text-text-primary shadow-xl">
              {avatarSrc ? (
                <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(user.username)
              )}
            </div>
            {!isEditing && (
              <div className="flex shrink-0 items-center gap-2 pb-1">
                {isOwnProfile && (
                  <Button variant="secondary" onClick={handleStartEdit}>
                    Editar perfil
                  </Button>
                )}
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
                <Link to="/people" aria-label="Buscar perfiles" className={iconButton}>
                  <SearchIcon />
                </Link>
                <button type="button" onClick={handleShare} aria-label="Compartir perfil" className={iconButton}>
                  <ShareIcon />
                </button>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-0.5">
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
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[26px] font-bold leading-8 tracking-[-0.65px] text-text-primary">{user.name}</h1>
                {user.badge && (
                  <span className="rounded-xl bg-accent-cta/30 px-2 py-0.5 text-label uppercase text-accent">
                    {user.badge}
                  </span>
                )}
              </div>
            )}
            <p className="flex flex-wrap items-center gap-x-2 text-secondary">
              <span className="font-medium text-accent">@{user.username}</span>
              {!isOwnProfile && myFollowers?.some((u) => u.id === user.id) && (
                <span className="rounded-sm bg-bg-hover px-1.5 py-0.5 text-[10px] font-bold uppercase text-text-secondary">
                  Te sigue
                </span>
              )}
              {user.location && (
                <>
                  <span className="text-text-secondary" aria-hidden="true">
                    •
                  </span>
                  <span className="flex items-center gap-0.5 text-text-secondary">
                    <PinIcon />
                    {user.location}
                  </span>
                </>
              )}
            </p>
            <p className="flex flex-wrap items-center gap-x-2 text-label font-normal normal-case tracking-normal text-text-muted">
              <span>Miembro desde {new Date(user.createdAt).getFullYear()}</span>
              <span aria-hidden="true">•</span>
              <button
                type="button"
                onClick={() => setOpenList("following")}
                className={`inline-flex min-h-11 items-center text-text-secondary hover:text-text-primary ${focusRing}`}
              >
                <span className="font-semibold text-text-primary">{following?.length ?? 0}</span>&nbsp;siguiendo
              </button>
            </p>
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
                <span className="text-label uppercase text-text-muted">Ubicación (opcional)</span>
                <input
                  value={draftLocation}
                  onChange={(e) => setDraftLocation(e.target.value)}
                  maxLength={80}
                  placeholder="Barcelona / CDMX"
                  className={`min-h-11 rounded bg-bg-raised px-3 text-body text-text-primary ${focusRing}`}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-label uppercase text-text-muted">Insignia junto al nombre (opcional)</span>
                <input
                  value={draftBadge}
                  onChange={(e) => setDraftBadge(e.target.value)}
                  maxLength={24}
                  placeholder="45 RPM"
                  className={`min-h-11 rounded bg-bg-raised px-3 text-body text-text-primary ${focusRing}`}
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
            <>
              {user.bio && <p className="text-[14px] leading-[22px] text-text-secondary">{user.bio}</p>}
              {isOwnProfile && (
                <Button variant="secondary" onClick={() => setIsLogoutOpen(true)} className="self-start gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Cerrar sesión
                </Button>
              )}
            </>
          )}
        </header>

        {/* Followers come from the real Follow relation and open a list of who
            they actually are; following sits under the handle. */}
        <div className="flex gap-1 rounded-lg bg-bg-surface p-3">
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center py-1">
            <Stat value={reviewedCount} label="Álbumes" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center py-1">
            <Stat value={writtenCount} label="Reseñas" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center py-1">
            <Stat value={lists?.length ?? 0} label="Listas" />
          </div>
          <button
            type="button"
            onClick={() => setOpenList("followers")}
            className={`flex min-w-0 flex-1 flex-col items-center justify-center py-1 ${focusRing}`}
          >
            <Stat value={followers?.length ?? 0} label="Seguidores" />
          </button>
        </div>

        {openList && (
          <FollowListDialog username={user.username} initialTab={openList} onClose={() => setOpenList(null)} />
        )}

        {(favorites.length > 0 || isOwnProfile) && (
          <section aria-label="Favoritos" className="flex flex-col gap-3">
            <h2 className="flex items-center gap-1.5 text-section-title-lg text-text-primary">
              <span className="text-accent">
                <HeartIcon />
              </span>
              Favoritos
            </h2>
            {favorites.length > 0 ? (
              <div className="grid grid-cols-4 gap-2 sm:gap-4">
                {favorites.map((album) => (
                  <AlbumShelfItem key={album.id} album={album} />
                ))}
              </div>
            ) : (
              <p className="text-body text-text-secondary">
                Todavía no marcaste favoritos — tocá el corazón en cualquier álbum.
              </p>
            )}
          </section>
        )}

        {habits.length > 0 && (
          <section aria-label="Hábitos auditivos" className="flex flex-col gap-2 rounded-lg bg-bg-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-section-title-lg text-text-primary">Hábitos Auditivos</h2>
              <span className="shrink-0 rounded-xl bg-bg-raised px-2 py-0.5 text-label text-text-secondary">
                Últimos {HABITS_WINDOW_DAYS} días
              </span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-xl bg-bg-hover" role="img" aria-label={habits.map((h) => `${h.percent}% ${FORMAT_LABELS[h.format]}`).join(", ")}>
              {habits.map((h, i) => (
                <div key={h.format} className={`h-full ${HABIT_COLORS[i % HABIT_COLORS.length]}`} style={{ width: `${h.percent}%` }} />
              ))}
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
              {habits.map((h, i) => (
                <li key={h.format} className="flex items-center gap-1.5 text-label font-normal normal-case tracking-[0.66px]">
                  <span className={`size-2.5 shrink-0 rounded-xl ${HABIT_COLORS[i % HABIT_COLORS.length]}`} aria-hidden="true" />
                  <span className="font-semibold text-text-primary">
                    {h.percent}% {FORMAT_LABELS[h.format]}
                  </span>
                  {h.details.length > 0 && <span className="text-text-secondary">({h.details.join(" & ")})</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div role="group" aria-label="Secciones del perfil" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {(
            [
              ["diary", `Diario (${currentYear})`],
              ["reviews", "Reseñas"],
              ["collection", "Colección Física"],
              ["stats", "Estadísticas"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={`min-h-11 shrink-0 rounded-xl px-4 text-secondary font-semibold motion-safe:transition-colors ${focusRing} ${
                tab === id ? "bg-accent-strong text-on-accent" : "bg-bg-surface text-text-secondary hover:bg-bg-raised"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "stats" ? (
          averageRating !== null ? (
            <section
              aria-label="Distribución de calificaciones"
              className="flex flex-col gap-4 rounded-lg bg-bg-surface p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-section-title-lg text-text-primary">Distribución de calificaciones</h2>
                <span className="shrink-0 text-secondary text-text-muted">
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
          ) : (
            <p className="text-body text-text-secondary">Todavía no hay calificaciones para mostrar.</p>
          )
        ) : (
          <section aria-label="Bitácora reciente" className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-label uppercase text-text-secondary">Bitácora reciente</h2>
              {latestReviewDate && (
                <span className="text-secondary capitalize text-accent">
                  {latestReviewDate.toLocaleDateString("es", { month: "long", year: "numeric" })}
                </span>
              )}
            </div>
            {reviewsLoading && <p className="text-body text-text-secondary">Cargando reseñas…</p>}
            {!reviewsLoading && visibleReviews.length === 0 && (
              <p className="text-body text-text-secondary">
                {tab === "collection"
                  ? "Todavía no hay discos físicos (vinilo, cassette o CD) en la colección."
                  : tab === "reviews"
                    ? "Todavía no hay reseñas escritas."
                    : `Todavía no hay entradas en ${currentYear}.`}
              </p>
            )}
            {visibleReviews.length > 0 && (
              <ul className="flex flex-col gap-3">
                {visibleReviews.map((review) => {
                  const album = albumsById.get(review.albumId);
                  if (!album) return null;
                  if (isOwnProfile && currentUser) {
                    return (
                      <FavoriteReviewRow
                        key={review.id}
                        variant="log"
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
                  return <ReviewRow key={review.id} variant="log" review={review} album={album} />;
                })}
              </ul>
            )}
          </section>
        )}

        {isOwnProfile && loggedThisMonth > 0 && (
          <p className="rounded-lg bg-bg-hover/40 p-4 text-center text-secondary text-text-secondary">
            Has registrado <span className="font-semibold text-accent">{loggedThisMonth} {loggedThisMonth === 1 ? "álbum" : "álbumes"}</span>{" "}
            en lo que va de este mes. ¡Sigue así!
          </p>
        )}
      </div>
      {isLogoutOpen && <LogoutDialog onClose={() => setIsLogoutOpen(false)} />}
    </article>
  );
}
