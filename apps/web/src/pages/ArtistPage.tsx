import type { JSX } from "react";
import { useParams } from "react-router-dom";
import { useAlbums } from "@/entities/album/api";
import { AlbumCard } from "@/entities/album/ui/AlbumCard";

export function ArtistPage(): JSX.Element {
  const { slug } = useParams<{ slug: string }>();
  const { data: albums, isLoading, isError } = useAlbums({});

  if (isLoading) {
    return <p className="px-4 pt-8 text-body text-text-secondary">Cargando artista…</p>;
  }
  if (isError) {
    return (
      <p role="alert" className="px-4 pt-8 text-body text-text-secondary">
        No se pudo cargar este artista.
      </p>
    );
  }

  const artistAlbums = (albums ?? []).filter((a) => a.artist.slug === slug);
  const [firstAlbum] = artistAlbums;

  if (!firstAlbum) {
    return (
      <p role="alert" className="px-4 pt-8 text-body text-text-secondary">
        Artista no encontrado.
      </p>
    );
  }

  const artist = firstAlbum.artist;
  const sorted = [...artistAlbums].sort((a, b) => a.year - b.year);

  return (
    <article className="flex flex-col gap-6 px-4 pt-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-page-title text-text-primary">{artist.name}</h1>
        <p className="text-body text-text-secondary">
          {sorted.length} álbum{sorted.length === 1 ? "" : "es"} en el catálogo
        </p>
      </header>

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {sorted.map((album) => (
          <AlbumCard key={album.id} album={album} variant="grid" />
        ))}
      </div>
    </article>
  );
}
