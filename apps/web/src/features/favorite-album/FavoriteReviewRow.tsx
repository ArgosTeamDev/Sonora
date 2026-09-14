import type { JSX } from "react";
import type { AlbumWithStats, Review } from "@project/shared";
import { ReviewRow } from "@/entities/review/ui/ReviewRow";
import { useFavoriteAlbum } from "./useFavoriteAlbum";

interface FavoriteReviewRowProps {
  review: Review;
  album: AlbumWithStats;
  username: string;
  userId: string;
  isFavorite: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

// Same reasoning as FavoriteAlbumCard: needs its own useFavoriteAlbum call
// per album, so a list of these can't share a single hook instance.
export function FavoriteReviewRow({
  review,
  album,
  username,
  userId,
  isFavorite,
  onEdit,
  onDelete,
  isDeleting,
}: FavoriteReviewRowProps): JSX.Element {
  const favoriteAlbum = useFavoriteAlbum({ username, userId, albumId: album.id });

  return (
    <ReviewRow
      review={review}
      album={album}
      onEdit={onEdit}
      onDelete={onDelete}
      isDeleting={isDeleting}
      isFavorite={isFavorite}
      onToggleFavorite={() => favoriteAlbum.mutate(!isFavorite)}
    />
  );
}
