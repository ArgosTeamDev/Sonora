import { useEffect, useState } from "react";
import type { FormEvent, JSX } from "react";
import { useLists } from "@/entities/list/api";
import { Button } from "@/shared/ui/Button";
import { useListMutations } from "./useListMutations";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface";

interface AddToListDialogProps {
  username: string;
  albumId: string;
  albumTitle: string;
  onClose: () => void;
}

export function AddToListDialog({ username, albumId, albumTitle, onClose }: AddToListDialogProps): JSX.Element {
  const { data: lists, isLoading } = useLists(username);
  const { create, toggleAlbum } = useListMutations(username);
  const [name, setName] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleCreate = (event: FormEvent): void => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    // Creating from here means "put this album in a new list" — add it right away.
    create.mutate(
      { name: trimmed },
      {
        onSuccess: (list) => {
          setName("");
          toggleAlbum.mutate({ list, albumId });
        },
      },
    );
  };

  const hasError = create.isError || toggleAlbum.isError;

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="fixed inset-0 z-20 bg-bg-deep/80 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Agregar ${albumTitle} a una lista`}
        className="fixed inset-x-0 bottom-0 z-30 flex max-h-[80dvh] flex-col gap-3 rounded-t-lg border-t border-border bg-bg-surface p-4 pb-[calc(16px+env(safe-area-inset-bottom))] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-96 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-section-title text-text-primary">Añadir a lista</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className={`flex min-h-11 min-w-11 items-center justify-center rounded text-text-muted ${focusRing}`}
          >
            ✕
          </button>
        </div>

        {isLoading && <p className="text-body text-text-secondary">Cargando listas…</p>}
        {!isLoading && (lists ?? []).length === 0 && (
          <p className="text-body text-text-secondary">Todavía no tenés listas. Creá la primera acá abajo.</p>
        )}
        {(lists ?? []).length > 0 && (
          <ul className="flex flex-col overflow-y-auto">
            {(lists ?? []).map((list) => {
              const isIn = list.albumIds.includes(albumId);
              return (
                <li key={list.id}>
                  <button
                    type="button"
                    onClick={() => toggleAlbum.mutate({ list, albumId })}
                    disabled={toggleAlbum.isPending}
                    aria-pressed={isIn}
                    className={`flex min-h-11 w-full items-center justify-between gap-3 rounded px-2 py-2 text-left hover:bg-bg-raised disabled:opacity-50 ${focusRing}`}
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-secondary font-semibold text-text-primary">{list.name}</span>
                      <span className="text-label text-text-muted">
                        {list.albumIds.length} álbum{list.albumIds.length === 1 ? "" : "es"}
                      </span>
                    </span>
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-secondary ${
                        isIn ? "bg-accent text-on-accent" : "border border-border text-transparent"
                      }`}
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <form onSubmit={handleCreate} className="flex gap-2 pt-1">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Nombre de la nueva lista</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder="Nueva lista…"
              className={`min-h-11 w-full rounded bg-bg-raised px-3 text-body text-text-primary ${focusRing}`}
            />
          </label>
          <Button type="submit" disabled={create.isPending || name.trim().length === 0}>
            Crear
          </Button>
        </form>
        {hasError && (
          <p role="alert" className="text-secondary text-danger">
            No se pudo guardar. Intentá de nuevo.
          </p>
        )}
      </div>
    </>
  );
}
