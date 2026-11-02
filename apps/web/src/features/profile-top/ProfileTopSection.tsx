import { useState } from "react";
import type { JSX } from "react";
import { PROFILE_TOP_SIZE, type AlbumWithStats } from "@project/shared";
import { useAlbumsByIds } from "@/entities/album/api";
import { useProfileTop, useSaveProfileTop } from "@/entities/profile-top/api";
import { AlbumShelfItem } from "@/entities/album/ui/AlbumShelfItem";
import { Button } from "@/shared/ui/Button";

const focusRing =
  "outline-none rounded focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base";

interface ProfileTopSectionProps {
  username: string;
  isOwnProfile: boolean;
  // Albums the owner can pick from (the ones they reviewed or favorited).
  candidates: AlbumWithStats[];
}

// The four albums pinned on a profile. Visitors only see the shelf; the owner
// can fill the four slots from the albums they already have on the profile.
export function ProfileTopSection({ username, isOwnProfile, candidates }: ProfileTopSectionProps): JSX.Element | null {
  const { data: topIds } = useProfileTop(username);
  const { data: topAlbums } = useAlbumsByIds(topIds ?? []);
  const save = useSaveProfileTop(username);
  const [draft, setDraft] = useState<string[] | null>(null);

  const albumsById = new Map((topAlbums ?? []).map((a) => [a.id, a]));
  const pinned = (topIds ?? []).map((id) => albumsById.get(id)).filter((a): a is AlbumWithStats => Boolean(a));
  const isEditing = draft !== null;

  if (!isOwnProfile && pinned.length === 0) return null;

  const startEditing = (): void => {
    const slots = Array.from({ length: PROFILE_TOP_SIZE }, (_, i) => topIds?.[i] ?? "");
    setDraft(slots);
  };

  const setSlot = (index: number, albumId: string): void => {
    setDraft((current) => (current ?? []).map((value, i) => (i === index ? albumId : value)));
  };

  const handleSave = (): void => {
    const albumIds = (draft ?? []).filter(Boolean);
    save.mutate(albumIds, { onSuccess: () => setDraft(null) });
  };

  // A pinned album that is no longer on the profile still has to appear as an
  // option so it can be kept, and is told apart from the empty slot.
  const optionsFor = (index: number): AlbumWithStats[] => {
    const taken = new Set((draft ?? []).filter((id, i) => i !== index && id));
    const known = new Map(candidates.map((a) => [a.id, a]));
    for (const album of pinned) known.set(album.id, album);
    return [...known.values()].filter((a) => !taken.has(a.id));
  };

  return (
    <section aria-label="Top 4" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-section-title-lg text-text-primary">Top 4</h2>
        {isOwnProfile && !isEditing && (
          <button
            type="button"
            onClick={startEditing}
            className={`min-h-11 px-1 text-secondary font-semibold text-accent ${focusRing}`}
          >
            {pinned.length > 0 ? "Editar" : "Elegir"}
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-3 rounded-lg bg-bg-surface p-4">
          {draft.map((albumId, index) => (
            <label key={index} className="flex flex-col gap-1.5">
              <span className="text-label uppercase text-text-muted">Posición {index + 1}</span>
              <select
                value={albumId}
                onChange={(e) => setSlot(index, e.target.value)}
                className={`min-h-11 rounded bg-bg-raised px-3 text-body text-text-primary ${focusRing}`}
              >
                <option value="">Vacío</option>
                {optionsFor(index).map((album) => (
                  <option key={album.id} value={album.id}>
                    {album.title} — {album.artist.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
          {candidates.length === 0 && pinned.length === 0 && (
            <p className="text-secondary text-text-muted">
              Reseña o marca como favorito algún álbum para poder fijarlo aquí.
            </p>
          )}
          {save.isError && (
            <p role="alert" className="text-secondary text-danger">
              No se pudo guardar tu Top 4.
            </p>
          )}
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={save.isPending} className="flex-1">
              Guardar
            </Button>
            <Button variant="secondary" onClick={() => setDraft(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : pinned.length > 0 ? (
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {pinned.map((album) => (
            <AlbumShelfItem key={album.id} album={album} />
          ))}
        </div>
      ) : (
        <p className="text-body text-text-secondary">Fijá los cuatro álbumes que mejor te representan.</p>
      )}
    </section>
  );
}
