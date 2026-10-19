import { useEffect, useState } from "react";
import type { JSX } from "react";
import { useSearchParams } from "react-router-dom";
import { useCurrentUser } from "@/entities/auth/api";
import { useFollowers, useFollowing, useSearchUsers, useUsers } from "@/entities/user/api";
import { PersonRow } from "@/features/follow-user/PersonRow";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base";

const SUGGESTIONS_SHOWN = 8;

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

  const { data: currentUser } = useCurrentUser();
  const { data: myFollowing } = useFollowing(currentUser?.username ?? "");
  const { data: myFollowers } = useFollowers(currentUser?.username ?? "");
  const { data: results, isLoading, isError } = useSearchUsers(query);
  const { data: everyone } = useUsers();

  const followingIds = new Set((myFollowing ?? []).map((u) => u.id));
  const followerIds = new Set((myFollowers ?? []).map((u) => u.id));

  // With nothing typed, offer people you don't follow yet — those who already
  // follow you first, since following back is the most likely next step.
  const suggestions = (everyone ?? [])
    .filter((u) => u.id !== currentUser?.id && !followingIds.has(u.id))
    .sort((a, b) => Number(followerIds.has(b.id)) - Number(followerIds.has(a.id)))
    .slice(0, SUGGESTIONS_SHOWN);

  const isSearching = query.trim().length > 0;

  return (
    <div className="flex flex-col gap-6 px-4 pb-8 pt-8 lg:px-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-page-title text-text-primary md:text-page-title-lg">Personas</h1>
        <p className="text-body text-text-secondary">Encuentra a otros oyentes por nombre o usuario y sigue su diario.</p>
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

      {isSearching && isLoading && <p className="text-body text-text-secondary">Buscando…</p>}
      {isSearching && isError && (
        <p role="alert" className="text-body text-text-secondary">
          No se pudo buscar. Intenta de nuevo.
        </p>
      )}
      {isSearching && results && results.length === 0 && (
        <p className="text-body text-text-secondary">Nadie coincide con "{query}".</p>
      )}

      {isSearching && results && results.length > 0 && (
        <section aria-label="Resultados" className="flex flex-col gap-3">
          <h2 className="text-label uppercase text-text-secondary">
            {results.length} resultado{results.length === 1 ? "" : "s"}
          </h2>
          <ul className="grid gap-2 lg:grid-cols-2">
            {results.map((user) => (
              <PersonRow key={user.id} user={user} currentUser={currentUser} followsYou={followerIds.has(user.id)} />
            ))}
          </ul>
        </section>
      )}

      {!isSearching && suggestions.length > 0 && (
        <section aria-label="Sugerencias" className="flex flex-col gap-3">
          <div className="flex flex-col">
            <h2 className="text-section-title-lg text-text-primary">Personas que quizá conozcas</h2>
            <p className="text-secondary text-text-secondary">Gente de Sonora que todavía no sigues.</p>
          </div>
          <ul className="grid gap-2 lg:grid-cols-2">
            {suggestions.map((user) => (
              <PersonRow key={user.id} user={user} currentUser={currentUser} followsYou={followerIds.has(user.id)} />
            ))}
          </ul>
        </section>
      )}

      {!isSearching && suggestions.length === 0 && (
        <p className="text-body text-text-secondary">Escribe un nombre o usuario para empezar a buscar.</p>
      )}
    </div>
  );
}
