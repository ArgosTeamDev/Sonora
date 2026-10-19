import { Injectable } from "@nestjs/common";
import type { Favorite, User } from "@project/shared";
import { MysqlService } from "@/shared/db/mysql.service";

interface UserRow {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  badge: string | null;
  is_pro_curator: number;
  password_hash: string;
  created_at: Date;
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
    location: row.location,
    badge: row.badge,
    isProCurator: Boolean(row.is_pro_curator),
    createdAt: row.created_at,
    version: row.version,
  };
}

function toUserWithPasswordHash(row: UserRow): UserWithPasswordHash {
  return { ...toUser(row), passwordHash: row.password_hash };
}

const USER_COLUMNS = `u.id, u.username, u.name, u.bio, u.avatar_url, u.location, u.badge, u.is_pro_curator, u.password_hash, u.created_at, u.version`;

// password_hash never leaves this file: every other layer works with the
// public `User` shape from @project/shared.
@Injectable()
export class UserRepository {
  constructor(private readonly db: MysqlService) {}

  async findAll(query?: string): Promise<User[]> {
    const normalized = query?.trim().toLowerCase();
    const rows = normalized
      ? await this.db.select<UserRow>(
          `SELECT ${USER_COLUMNS} FROM users u
           WHERE lower(u.username) LIKE ? OR lower(u.name) LIKE ? ORDER BY u.username`,
          [`%${normalized}%`, `%${normalized}%`],
        )
      : await this.db.select<UserRow>(`SELECT ${USER_COLUMNS} FROM users u ORDER BY u.username`);
    return rows.map(toUser);
  }

  async findById(id: string): Promise<User | null> {
    const rows = await this.db.select<UserRow>(`SELECT ${USER_COLUMNS} FROM users u WHERE u.id = ?`, [id]);
    return rows[0] ? toUser(rows[0]) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const rows = await this.db.select<UserRow>(`SELECT ${USER_COLUMNS} FROM users u WHERE u.username = ?`, [
      username,
    ]);
    return rows[0] ? toUser(rows[0]) : null;
  }

  async findByUsernameWithPassword(username: string): Promise<UserWithPasswordHash | null> {
    const rows = await this.db.select<UserRow>(`SELECT ${USER_COLUMNS} FROM users u WHERE u.username = ?`, [
      username,
    ]);
    return rows[0] ? toUserWithPasswordHash(rows[0]) : null;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const rows = await this.db.select(`SELECT 1 FROM users WHERE username = ?`, [username]);
    return rows.length > 0;
  }

  async insert(user: {
    id: string;
    username: string;
    name: string;
    passwordHash: string;
    createdAt: Date;
  }): Promise<User> {
    await this.db.execute(
      `INSERT INTO users (id, username, name, bio, avatar_url, password_hash, created_at, version)
       VALUES (?, ?, ?, NULL, NULL, ?, ?, 1)`,
      [user.id, user.username, user.name, user.passwordHash, user.createdAt],
    );
    const created = await this.findById(user.id);
    if (!created) throw new Error(`Failed to read back inserted user ${user.id}`);
    return created;
  }

  async update(
    id: string,
    patch: {
      name?: string;
      bio?: string | null;
      avatarUrl?: string | null;
      location?: string | null;
      badge?: string | null;
    },
    nextVersion: number,
  ): Promise<User> {
    await this.db.execute(
      `UPDATE users SET
         name = COALESCE(?, name),
         bio = IF(?, ?, bio),
         avatar_url = IF(?, ?, avatar_url),
         location = IF(?, ?, location),
         badge = IF(?, ?, badge),
         version = ?
       WHERE id = ?`,
      [
        patch.name ?? null,
        patch.bio !== undefined,
        patch.bio ?? null,
        patch.avatarUrl !== undefined,
        patch.avatarUrl ?? null,
        patch.location !== undefined,
        patch.location ?? null,
        patch.badge !== undefined,
        patch.badge ?? null,
        nextVersion,
        id,
      ],
    );
    const updated = await this.findById(id);
    if (!updated) throw new Error(`User ${id} not found`);
    return updated;
  }

  async findFollowing(userId: string): Promise<User[]> {
    const rows = await this.db.select<UserRow>(
      `SELECT ${USER_COLUMNS} FROM follows f JOIN users u ON u.id = f.following_id
       WHERE f.follower_id = ? ORDER BY f.created_at`,
      [userId],
    );
    return rows.map(toUser);
  }

  async findFollowers(userId: string): Promise<User[]> {
    const rows = await this.db.select<UserRow>(
      `SELECT ${USER_COLUMNS} FROM follows f JOIN users u ON u.id = f.follower_id
       WHERE f.following_id = ? ORDER BY f.created_at`,
      [userId],
    );
    return rows.map(toUser);
  }

  async findFavorites(userId: string): Promise<Favorite[]> {
    const rows = await this.db.select<{ user_id: string; album_id: string; created_at: Date }>(
      `SELECT user_id, album_id, created_at FROM favorites WHERE user_id = ? ORDER BY created_at`,
      [userId],
    );
    return rows.map((r) => ({ userId: r.user_id, albumId: r.album_id, createdAt: r.created_at }));
  }
}
