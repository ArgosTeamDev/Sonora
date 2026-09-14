import { Injectable } from "@nestjs/common";
import type { User } from "@project/shared";
import { SqliteService } from "@/shared/db/sqlite.service";

interface UserRow {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  password_hash: string;
  created_at: string;
  version: number;
}

export interface UserWithPasswordHash extends User {
  passwordHash: string;
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    createdAt: new Date(row.created_at),
    version: row.version,
  };
}

function toUserWithPasswordHash(row: UserRow): UserWithPasswordHash {
  return { ...toUser(row), passwordHash: row.password_hash };
}

// The only repository backed by SQLite instead of the JSON store — see
// CLAUDE.md and apps/api/src/shared/db/sqlite.service.ts. password_hash
// never leaves this file: every other layer works with the public `User`
// shape from @project/shared.
@Injectable()
export class UserRepository {
  constructor(private readonly sqlite: SqliteService) {}

  findAll(query?: string): User[] {
    const normalized = query?.trim().toLowerCase();
    const rows = normalized
      ? (this.sqlite.db
          .prepare(`SELECT * FROM users WHERE lower(username) LIKE ? OR lower(name) LIKE ? ORDER BY username`)
          .all(`%${normalized}%`, `%${normalized}%`) as unknown as UserRow[])
      : (this.sqlite.db.prepare(`SELECT * FROM users ORDER BY username`).all() as unknown as UserRow[]);
    return rows.map(toUser);
  }

  findById(id: string): User | null {
    const row = this.sqlite.db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as UserRow | undefined;
    return row ? toUser(row) : null;
  }

  findByUsername(username: string): User | null {
    const row = this.sqlite.db.prepare(`SELECT * FROM users WHERE username = ?`).get(username) as
      | UserRow
      | undefined;
    return row ? toUser(row) : null;
  }

  findByUsernameWithPassword(username: string): UserWithPasswordHash | null {
    const row = this.sqlite.db.prepare(`SELECT * FROM users WHERE username = ?`).get(username) as
      | UserRow
      | undefined;
    return row ? toUserWithPasswordHash(row) : null;
  }

  existsByUsername(username: string): boolean {
    const row = this.sqlite.db.prepare(`SELECT 1 FROM users WHERE username = ?`).get(username);
    return row !== undefined;
  }

  insert(user: { id: string; username: string; name: string; passwordHash: string; createdAt: Date }): User {
    this.sqlite.db
      .prepare(
        `INSERT INTO users (id, username, name, bio, avatar_url, password_hash, created_at, version)
         VALUES (?, ?, ?, NULL, NULL, ?, ?, 1)`,
      )
      .run(user.id, user.username, user.name, user.passwordHash, user.createdAt.toISOString());
    const created = this.findById(user.id);
    if (!created) throw new Error(`Failed to read back inserted user ${user.id}`);
    return created;
  }

  update(id: string, patch: { name?: string; bio?: string | null; avatarUrl?: string | null }, nextVersion: number): User {
    const current = this.findById(id);
    if (!current) throw new Error(`User ${id} not found`);

    this.sqlite.db
      .prepare(`UPDATE users SET name = ?, bio = ?, avatar_url = ?, version = ? WHERE id = ?`)
      .run(
        patch.name ?? current.name,
        patch.bio !== undefined ? patch.bio : current.bio,
        patch.avatarUrl !== undefined ? patch.avatarUrl : current.avatarUrl,
        nextVersion,
        id,
      );

    const updated = this.findById(id);
    if (!updated) throw new Error(`Failed to read back updated user ${id}`);
    return updated;
  }
}
