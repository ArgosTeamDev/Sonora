import { Injectable } from "@nestjs/common";
import type { AlbumOverlay } from "@project/shared";
import { JsonDb } from "@/shared/json-db/json-db.service";
import { AlbumOverlayRepository } from "@/modules/album/domain/album-overlay.repository";

@Injectable()
export class JsonAlbumOverlayRepository extends AlbumOverlayRepository {
  constructor(private readonly db: JsonDb) {
    super();
  }

  async findAll(): Promise<AlbumOverlay[]> {
    return this.db.state.albumOverlays;
  }

  async findById(id: string): Promise<AlbumOverlay | null> {
    return this.db.state.albumOverlays.find((o) => o.id === id) ?? null;
  }
}
