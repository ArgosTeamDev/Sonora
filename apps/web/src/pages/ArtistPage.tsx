import type { JSX } from "react";
import { useParams } from "react-router-dom";
import { useArtist } from "@/entities/artist/api";
import { AlbumCard } from "@/entities/album/ui/AlbumCard";
import { HttpError } from "@/shared/api/http";
import { BackButton } from "@/shared/ui/BackButton";
import { PageSkeleton } from "@/shared/ui/Skeleton";

export function ArtistPage(): JSX.Element {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError, error } = useArtist(slug ?? "");

  if (isLoading) {
    return <PageSkeleton label="Cargando artista…" rows={4} />;
  }
  if (isError || !data) {
    const notFound = error instanceof HttpError && error.status === 404;
    return (
      <p role="alert" className="px-4 pt-8 text-body text-text-secondary">
        {notFound ? "Artista no encontrado." : "No se pudo cargar este artista."}
      </p>
    );
  }

  const { artist } = data;
  // Newest first: the latest release is what people come looking for.
  const albums = [...data.albums].sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());

  const fullAlbums = albums.filter((a) => !a.isSingle);
  const singles = albums.filter((a) => a.isSingle);

  return (
    <article className="flex flex-col gap-6 px-4 pt-4 md:pt-8">
      <BackButton />
      <header className="flex flex-col gap-2">
        <h1 className="text-page-title text-text-primary">{artist.name}</h1>
        <p className="text-body text-text-secondary">
          {albums.length} álbum{albums.length === 1 ? "" : "es"} en el catálogo
        </p>
      </header>

      {albums.length === 0 && (
        <p className="text-body text-text-secondary">No encontramos álbumes de este artista.</p>
      )}
      {[
        { title: "Álbumes", group: fullAlbums },
        { title: "Sencillos y EPs", group: singles },
      ].map(
        ({ title, group }) =>
          group.length > 0 && (
            <section key={title} aria-label={title} className="flex flex-col gap-3">
              <h2 className="text-section-title-lg font-bold text-text-primary">{title}</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
                {group.map((album) => (
                  <AlbumCard key={album.id} album={album} variant="grid" />
                ))}
              </div>
            </section>
          ),
      )}
    </article>
  );
}
