import type { JSX } from "react";
import type { AlbumWithStats } from "@project/shared";
import { AlbumCard } from "@/entities/album/ui/AlbumCard";
import { useFavoriteAlbum } from "./useFavoriteAlbum";

interface FavoriteAlbumCardProps {
  album: AlbumWithStats;
  variant?: "grid" | "row";
  username: string;
  userId: string;
  isFavorite: boolean;
}

// Wraps AlbumCard with the favorite toggle wired in — needs its own
// useFavoriteAlbum call per album, so it can't just be a prop on a list
// (hooks can't run inside .map), hence this one-album-per-instance wrapper.
export function FavoriteAlbumCard({
  album,
  variant = "grid",
  username,
  userId,
  isFavorite,
}: FavoriteAlbumCardProps): JSX.Element {
  const favoriteAlbum = useFavoriteAlbum({ username, userId, albumId: album.id });

  return (
    <AlbumCard
      album={album}
      variant={variant}
      isFavorite={isFavorite}
      onToggleFavorite={() => favoriteAlbum.mutate(!isFavorite)}
    />
  );
}
