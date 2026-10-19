import { useEffect, useMemo, useState } from "react";
import type { JSX } from "react";
import { useSearchParams } from "react-router-dom";
import { type AlbumListFilters, useAlbums } from "@/entities/album/api";
import { AlbumCard } from "@/entities/album/ui/AlbumCard";
import { AlbumOfTheMonth } from "@/entities/album/ui/AlbumOfTheMonth";
import { AlbumShelfItem } from "@/entities/album/ui/AlbumShelfItem";
import { useReviews } from "@/entities/review/api";
import { Button } from "@/shared/ui/Button";

interface Decade {
  label: string;
  start: number;
  end: number;
}

// Covers the seed catalog's actual range (1959–2022), not just the design's
// 60s–20s — a real 1950s album would otherwise have no bucket to land in.
const DECADES: Decade[] = [
  { label: "50s", start: 1950, end: 1959 },
  { label: "60s", start: 1960, end: 1969 },
  { label: "70s", start: 1970, end: 1979 },
  { label: "80s", start: 1980, end: 1989 },
  { label: "90s", start: 1990, end: 1999 },
  { label: "00s", start: 2000, end: 2009 },
  { label: "10s", start: 2010, end: 2019 },
  { label: "20s", start: 2020, end: 2029 },
];

const SORT_OPTIONS: { value: NonNullable<AlbumListFilters["sort"]>; label: string }[] = [
  { value: "title", label: "Título" },
  { value: "rating", label: "Calificación" },
  { value: "year", label: "Año" },
];

const PAGE_SIZE = 12;

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base";

const selectClass = `min-h-11 rounded bg-bg-raised px-3 text-secondary text-text-primary ${focusRing}`;

// Page numbers to show: always first and last, a window around the current
// one, "…" for the gaps.
function pageWindow(current: number, total: number): (number | "gap")[] {
  const pages = new Set([1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | "gap")[] = [];
  sorted.forEach((page, i) => {
    if (i > 0 && page - sorted[i - 1]! > 1) result.push("gap");
    result.push(page);
  });
  return result;
}

export function ExplorePage(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "row">("grid");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const genre = searchParams.get("genre") ?? "";
  const decade = searchParams.get("decade") ?? "";
  const sort = (searchParams.get("sort") as AlbumListFilters["sort"]) ?? undefined;
  const query = searchParams.get("q") ?? "";
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);

  // The input updates instantly; the URL (and therefore the actual catalog
  // request) only follows after a short pause, so typing doesn't fire a
  // network call per keystroke.
  const [searchInput, setSearchInput] = useState(query);

  // Any filter change goes back to page 1; only paging itself keeps the page.
  const updateParam = (key: string, value: string): void => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    if (key !== "page") next.delete("page");
    setSearchParams(next);
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput !== query) updateParam("q", searchInput);
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const isSearching = query.trim().length > 0;

  // With a search query, this hits the catalog provider live for any album,
  // not just the curated catalog (see AlbumRepository.search on the backend).
  // Genre and decade still apply client-side either way, so the dropdown's own
  // option list keeps reflecting whatever's currently loaded.
  const { data: allAlbums, isLoading, isError } = useAlbums({ sort, q: query || undefined });
  const { data: reviews } = useReviews();

  // Álbum del mes: the album flagged as such, else whichever got the most
  // listens this calendar month. Only when browsing, not mid-search — it's a
  // spotlight, not a search result.
  const albumOfTheMonth = useMemo(() => {
    if (isSearching) return null;
    const albums = allAlbums ?? [];
    const flagged = albums.find((a) => a.isAlbumOfTheMonth);
    if (flagged) return flagged;
    const now = new Date();
    const counts = new Map<string, number>();
    for (const review of reviews ?? []) {
      const listened = new Date(review.listenedAt);
      if (listened.getFullYear() === now.getFullYear() && listened.getMonth() === now.getMonth()) {
        counts.set(review.albumId, (counts.get(review.albumId) ?? 0) + 1);
      }
    }
    return (
      albums
        .filter((a) => counts.has(a.id))
        .sort((a, b) => counts.get(b.id)! - counts.get(a.id)! || (b.averageRating ?? 0) - (a.averageRating ?? 0))[0] ??
      null
    );
  }, [allAlbums, reviews, isSearching]);

  const genres = useMemo(() => {
    const set = new Set<string>();
    for (const album of allAlbums ?? []) {
      for (const g of album.genres) set.add(g);
    }
    return [...set].sort();
  }, [allAlbums]);

  const selectedDecade = DECADES.find((d) => d.label === decade);

  // Singles/EPs dropped for now — just full albums. The month's spotlight sits
  // above, so it isn't repeated in the grid.
  const albums = (allAlbums ?? []).filter((album) => {
    if (album.isSingle) return false;
    if (album.id === albumOfTheMonth?.id) return false;
    if (genre && !album.genres.includes(genre)) return false;
    if (selectedDecade && (album.year < selectedDecade.start || album.year > selectedDecade.end)) {
      return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(albums.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageAlbums = albums.slice(pageStart, pageStart + PAGE_SIZE);

  const activeFilterCount = (genre ? 1 : 0) + (sort ? 1 : 0);

  useEffect(() => {
    if (!isFilterSheetOpen) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setIsFilterSheetOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFilterSheetOpen]);

  const goToPage = (next: number): void => {
    updateParam("page", next <= 1 ? "" : String(next));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 overflow-hidden">
        <div className="absolute left-1/4 right-[30%] top-[-128px] h-96 rounded-full bg-accent-strong/10 blur-3xl" />
      </div>

      <div className="flex flex-col gap-6 px-4 pb-8 pt-6 lg:gap-8 lg:px-6 lg:pt-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-2 text-label uppercase tracking-[1.1px] text-accent">
              <span className="size-1.5 rounded-full bg-accent-strong" aria-hidden="true" />
              Archivo maestro sonoro
            </p>
            <h1 className="text-page-title text-text-primary lg:text-[56px] lg:leading-[60px] lg:tracking-[-1.5px]">
              Álbumes
            </h1>
            <p className="max-w-xl text-body text-text-secondary lg:text-body-lg">
              {isSearching
                ? `Resultados para "${query}", buscando en todo el catálogo musical.`
                : "Explora la discografía organizada por géneros, décadas y recepción crítica colectiva."}
            </p>
          </div>
          {allAlbums && (
            <div className="flex w-fit items-center gap-3 rounded-lg bg-bg-surface/80 px-4 py-3">
              <span className="text-accent" aria-hidden="true">
                ◉
              </span>
              <div className="flex flex-col">
                <span className="text-2xl font-bold leading-7 text-text-primary">{allAlbums.length}</span>
                <span className="text-label uppercase text-text-secondary">
                  {isSearching ? "Resultados" : "Lanzamientos catalogados"}
                </span>
              </div>
            </div>
          )}
        </header>

        {albumOfTheMonth && <AlbumOfTheMonth album={albumOfTheMonth} label="Álbum del mes" />}

        <div className="flex flex-col gap-4 rounded-lg bg-bg-surface/70 p-4 lg:p-5">
          <label className="relative flex items-center">
            <span className="sr-only">Buscar álbum o artista</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 text-text-muted"
            >
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar cualquier álbum o artista…"
              className={`min-h-11 w-full rounded bg-bg-raised py-2 pl-10 pr-4 text-body text-text-primary placeholder:text-text-muted ${focusRing}`}
            />
          </label>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] lg:justify-between [&::-webkit-scrollbar]:hidden">
            <span className="shrink-0 pr-1 text-label uppercase text-text-muted">Época:</span>
            <div className="flex snap-x gap-1.5">
              <Button
                variant={decade === "" ? "chip-active" : "chip"}
                aria-pressed={decade === ""}
                onClick={() => updateParam("decade", "")}
                className="shrink-0 snap-start"
              >
                Todas
              </Button>
              {DECADES.map((d) => (
                <Button
                  key={d.label}
                  variant={decade === d.label ? "chip-active" : "chip"}
                  aria-pressed={decade === d.label}
                  onClick={() => updateParam("decade", decade === d.label ? "" : d.label)}
                  className="shrink-0 snap-start"
                >
                  {d.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setIsFilterSheetOpen(true)} className="md:hidden">
                Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </Button>

              {/* Desktop gets genre + sort inline instead of behind the sheet —
                  there's room for them next to the toolbar, so no need to hide
                  controls that fit. */}
              <label className="hidden items-center gap-2 md:flex">
                <span className="sr-only">Género</span>
                <select value={genre} onChange={(e) => updateParam("genre", e.target.value)} className={selectClass}>
                  <option value="">Todos los géneros</option>
                  {genres.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>

              <label className="hidden items-center gap-2 md:flex">
                <span className="sr-only">Ordenar por</span>
                <select
                  value={sort ?? "title"}
                  onChange={(e) => updateParam("sort", e.target.value === "title" ? "" : e.target.value)}
                  className={selectClass}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      Ordenar: {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <p className="text-label uppercase text-text-muted">
                <span className="text-text-primary">{albums.length}</span> {albums.length === 1 ? "álbum" : "álbumes"}
              </p>
              <div className="flex items-center gap-1 rounded bg-bg-raised p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  aria-pressed={viewMode === "grid"}
                  aria-label="Vista de cuadrícula"
                  className={`flex size-11 items-center justify-center rounded-sm ${focusRing} ${
                    viewMode === "grid" ? "bg-accent text-on-accent" : "text-text-secondary"
                  }`}
                >
                  ▦
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("row")}
                  aria-pressed={viewMode === "row"}
                  aria-label="Vista de lista"
                  className={`flex size-11 items-center justify-center rounded-sm ${focusRing} ${
                    viewMode === "row" ? "bg-accent text-on-accent" : "text-text-secondary"
                  }`}
                >
                  ☰
                </button>
              </div>
            </div>
          </div>
        </div>

        {isLoading && <p className="text-body text-text-secondary">Cargando álbumes…</p>}
        {isError && (
          <p role="alert" className="text-body text-text-secondary">
            No se pudieron cargar los álbumes.
          </p>
        )}
        {allAlbums && albums.length === 0 && (
          <p className="text-body text-text-secondary">Ningún álbum coincide con estos filtros.</p>
        )}

        {pageAlbums.length > 0 &&
          (viewMode === "grid" ? (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 sm:gap-y-8 lg:grid-cols-6 lg:gap-x-6">
              {pageAlbums.map((album) => (
                <li key={album.id} className="min-w-0">
                  <AlbumShelfItem album={album} size="lg" />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col gap-4">
              {pageAlbums.map((album) => (
                <AlbumCard key={album.id} album={album} variant="row" />
              ))}
            </div>
          ))}

        {albums.length > 0 && (
          <nav
            aria-label="Paginación"
            className="flex flex-col items-center gap-3 border-t border-border/40 pt-5 sm:flex-row sm:justify-between"
          >
            <p className="text-secondary text-text-muted">
              Mostrando{" "}
              <span className="text-text-primary">
                {pageStart + 1}–{pageStart + pageAlbums.length}
              </span>{" "}
              de {albums.length} obras
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="chip"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Página anterior"
                >
                  ‹
                </Button>
                {pageWindow(currentPage, totalPages).map((item, i) =>
                  item === "gap" ? (
                    <span key={`gap-${i}`} className="px-1 text-text-muted" aria-hidden="true">
                      …
                    </span>
                  ) : (
                    <Button
                      key={item}
                      variant={item === currentPage ? "chip-active" : "chip"}
                      onClick={() => goToPage(item)}
                      aria-current={item === currentPage ? "page" : undefined}
                      aria-label={`Página ${item}`}
                    >
                      {item}
                    </Button>
                  ),
                )}
                <Button
                  variant="chip"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Página siguiente"
                >
                  ›
                </Button>
              </div>
            )}
          </nav>
        )}

        {isFilterSheetOpen && (
          <>
            <button
              type="button"
              aria-label="Cerrar filtros"
              onClick={() => setIsFilterSheetOpen(false)}
              className="fixed inset-0 z-20 bg-bg-deep/80 backdrop-blur-sm"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Filtros"
              className="fixed inset-x-0 bottom-0 z-30 flex flex-col gap-4 rounded-t-lg border-t border-border bg-bg-surface p-4 pb-[calc(24px+env(safe-area-inset-bottom))]"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-section-title text-text-primary">Filtros</h2>
                <button
                  type="button"
                  onClick={() => setIsFilterSheetOpen(false)}
                  className={`flex min-h-11 min-w-11 items-center justify-center rounded text-text-muted ${focusRing}`}
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-label uppercase text-text-muted">Género</span>
                <select
                  id="explore-genre"
                  value={genre}
                  onChange={(e) => updateParam("genre", e.target.value)}
                  className={`${selectClass} px-4`}
                >
                  <option value="">Todos los géneros</option>
                  {genres.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-label uppercase text-text-muted">Ordenar por</span>
                <select
                  id="explore-sort"
                  value={sort ?? "title"}
                  onChange={(e) => updateParam("sort", e.target.value === "title" ? "" : e.target.value)}
                  className={`${selectClass} px-4`}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <Button onClick={() => setIsFilterSheetOpen(false)}>
                Mostrar {albums.length} {albums.length === 1 ? "álbum" : "álbumes"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
