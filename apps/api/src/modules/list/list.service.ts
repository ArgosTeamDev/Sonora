import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { AddListItemDto, CreateListDto, List } from "@project/shared";
import { MysqlService } from "@/shared/db/mysql.service";

interface ListRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: Date;
}

interface ItemRow {
  list_id: string;
  album_id: string;
}

function toList(row: ListRow, albumIds: string[]): List {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    albumIds,
    createdAt: row.created_at,
  };
}

@Injectable()
export class ListService {
  constructor(private readonly db: MysqlService) {}

  async findByUsername(username: string): Promise<List[]> {
    const rows = await this.db.select<ListRow>(
      `SELECT l.id, l.user_id, l.name, l.description, l.created_at
       FROM lists l JOIN users u ON u.id = l.user_id
       WHERE u.username = ? ORDER BY l.created_at DESC`,
      [username],
    );
    return this.withItems(rows);
  }

  // Newest lists that actually have something in them — empty ones would
  // render as blank cards on the home page.
  async findRecent(limit: number): Promise<List[]> {
    const rows = await this.db.select<ListRow>(
      `SELECT l.id, l.user_id, l.name, l.description, l.created_at
       FROM lists l
       WHERE EXISTS (SELECT 1 FROM list_items i WHERE i.list_id = l.id)
       ORDER BY l.created_at DESC LIMIT ?`,
      [limit],
    );
    return this.withItems(rows);
  }

  async create(userId: string, dto: CreateListDto): Promise<List> {
    const id = randomUUID();
    await this.db.execute(
      `INSERT INTO lists (id, user_id, name, description, created_at) VALUES (?, ?, ?, ?, UTC_TIMESTAMP(3))`,
      [id, userId, dto.name, dto.description ?? null],
    );
    return this.getOwned(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.getOwned(id, userId);
    await this.db.execute(`DELETE FROM lists WHERE id = ?`, [id]);
  }

  async addItem(id: string, userId: string, dto: AddListItemDto): Promise<List> {
    await this.getOwned(id, userId);
    // Idempotent: adding an album already in the list keeps its position.
    await this.db.execute(
      `INSERT IGNORE INTO list_items (list_id, album_id, position, created_at)
       SELECT ?, ?, COALESCE(MAX(position), 0) + 1, UTC_TIMESTAMP(3) FROM list_items WHERE list_id = ?`,
      [id, dto.albumId, id],
    );
    return this.getOwned(id, userId);
  }

  async removeItem(id: string, userId: string, albumId: string): Promise<List> {
    await this.getOwned(id, userId);
    await this.db.execute(`DELETE FROM list_items WHERE list_id = ? AND album_id = ?`, [id, albumId]);
    return this.getOwned(id, userId);
  }

  private async getOwned(id: string, userId: string): Promise<List> {
    const rows = await this.db.select<ListRow>(
      `SELECT id, user_id, name, description, created_at FROM lists WHERE id = ?`,
      [id],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException({ code: "NOT_FOUND", message: `List ${id} not found` });
    if (row.user_id !== userId) {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "Solo podés editar tus propias listas." });
    }
    return (await this.withItems([row]))[0]!;
  }

  private async withItems(rows: ListRow[]): Promise<List[]> {
    if (rows.length === 0) return [];
    const items = await this.db.select<ItemRow>(
      `SELECT list_id, album_id FROM list_items WHERE list_id IN (?) ORDER BY position`,
      [rows.map((r) => r.id)],
    );
    return rows.map((row) =>
      toList(
        row,
        items.filter((i) => i.list_id === row.id).map((i) => i.album_id),
      ),
    );
  }
}
