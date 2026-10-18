import { Injectable } from "@nestjs/common";
import type { AlbumOverlay } from "@project/shared";
import { MysqlService } from "@/shared/db/mysql.service";
import { AlbumOverlayRepository } from "@/modules/album/domain/album-overlay.repository";

interface OverlayRow {
  id: string;
  is_album_of_the_month: number;
  editorial_note: string | null;
  created_at: Date;
}

function toOverlay(row: OverlayRow): AlbumOverlay {
  return {
    id: row.id,
    isAlbumOfTheMonth: Boolean(row.is_album_of_the_month),
    editorialNote: row.editorial_note,
    createdAt: row.created_at,
  };
}

@Injectable()
export class MysqlAlbumOverlayRepository extends AlbumOverlayRepository {
  constructor(private readonly db: MysqlService) {
    super();
  }

  async findAll(): Promise<AlbumOverlay[]> {
    const rows = await this.db.select<OverlayRow>(`SELECT * FROM album_overlays ORDER BY created_at`);
    return rows.map(toOverlay);
  }

  async findById(id: string): Promise<AlbumOverlay | null> {
    const rows = await this.db.select<OverlayRow>(`SELECT * FROM album_overlays WHERE id = ?`, [id]);
    return rows[0] ? toOverlay(rows[0]) : null;
  }
}
