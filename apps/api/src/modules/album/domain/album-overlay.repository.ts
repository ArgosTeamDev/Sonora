import type { AlbumOverlay } from "@project/shared";

export abstract class AlbumOverlayRepository {
  abstract findAll(): Promise<AlbumOverlay[]>;
  abstract findById(id: string): Promise<AlbumOverlay | null>;
}
