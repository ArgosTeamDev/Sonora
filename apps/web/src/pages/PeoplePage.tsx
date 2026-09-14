import { useEffect, useState } from "react";
import type { JSX } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSearchUsers } from "@/entities/user/api";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base";

function initials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

export function PeoplePage(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";

  // Same debounce pattern as Explorar's album search — the input updates
  // instantly, the actual request follows after a short pause.
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput === query) return;
      const next = new URLSearchParams(searchParams);
      if (searchInput) next.set("q", searchInput);
      else next.delete("q");
      setSearchParams(next);
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const { data: results, isLoading, isError } = useSearchUsers(query);

  return (
    <div className="flex flex-col gap-6 px-4 pt-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-page-title text-text-primary md:text-page-title-lg">Buscar perfiles</h1>
        <p className="text-body text-text-secondary">Encontrá a otros oyentes por nombre o usuario.</p>
      </header>

      <label className="relative flex items-center">
        <span className="sr-only">Buscar por nombre o usuario</span>
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
          autoFocus
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Nombre o @usuario…"
          className={`min-h-11 w-full rounded bg-bg-raised py-2 pl-10 pr-4 text-body text-text-primary placeholder:text-text-muted ${focusRing}`}
        />
      </label>

      {query.trim().length === 0 && (
        <p className="text-body text-text-secondary">Escribí algo para empezar a buscar.</p>
      )}
      {isLoading && <p className="text-body text-text-secondary">Buscando…</p>}
      {isError && (
        <p role="alert" className="text-body text-text-secondary">
          No se pudo buscar. Intentá de nuevo.
        </p>
      )}
      {results && results.length === 0 && (
        <p className="text-body text-text-secondary">Nadie coincide con "{query}".</p>
      )}

      {results && results.length > 0 && (
        <ul className="flex flex-col gap-2">
          {results.map((user) => (
            <li key={user.id}>
              <Link
                to={`/u/${user.username}`}
                className={`flex items-center gap-3 rounded-lg border border-border bg-bg-surface p-3 hover:bg-bg-hover ${focusRing}`}
              >
                <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-strong text-label text-text-primary">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials(user.username)
                  )}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-secondary font-semibold text-text-primary">{user.name}</span>
                  <span className="truncate text-label text-text-muted">@{user.username}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
