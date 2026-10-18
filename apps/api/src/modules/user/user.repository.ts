import { Injectable } from "@nestjs/common";
import type { Favorite, User } from "@project/shared";
import { PgService } from "@/shared/db/pg.service";

interface UserRow {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
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
    createdAt: row.created_at,
    version: row.version,
  };
}

function toUserWithPasswordHash(row: UserRow): UserWithPasswordHash {
  return { ...toUser(row), passwordHash: row.password_hash };
}

const USER_COLUMNS = `u.id, u.username, u.name, u.bio, u.avatar_url, u.password_hash, u.created_at, u.version`;
const RETURNING = `RETURNING id, username, name, bio, avatar_url, password_hash, created_at, version`;

// password_hash never leaves this file: every other layer works with the
// public `User` shape from @project/shared.
@Injectable()
export class UserRepository {
  constructor(private readonly pg: PgService) {}

  async findAll(query?: string): Promise<User[]> {
    const normalized = query?.trim().toLowerCase();
    const { rows } = normalized
      ? await this.pg.query<UserRow>(
          `SELECT ${USER_COLUMNS} FROM users u
           WHERE lower(u.username) LIKE $1 OR lower(u.name) LIKE $1 ORDER BY u.username`,
          [`%${normalized}%`],
        )
      : await this.pg.query<UserRow>(`SELECT ${USER_COLUMNS} FROM users u ORDER BY u.username`);
    return rows.map(toUser);
  }

  async findById(id: string): Promise<User | null> {
    const { rows } = await this.pg.query<UserRow>(`SELECT ${USER_COLUMNS} FROM users u WHERE u.id = $1`, [id]);
    return rows[0] ? toUser(rows[0]) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const { rows } = await this.pg.query<UserRow>(
      `SELECT ${USER_COLUMNS} FROM users u WHERE u.username = $1`,
      [username],
    );
    return rows[0] ? toUser(rows[0]) : null;
  }

  async findByUsernameWithPassword(username: string): Promise<UserWithPasswordHash | null> {
    const { rows } = await this.pg.query<UserRow>(
      `SELECT ${USER_COLUMNS} FROM users u WHERE u.username = $1`,
      [username],
    );
    return rows[0] ? toUserWithPasswordHash(rows[0]) : null;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const { rowCount } = await this.pg.query(`SELECT 1 FROM users WHERE username = $1`, [username]);
    return (rowCount ?? 0) > 0;
  }

  async insert(user: {
    id: string;
    username: string;
    name: string;
    passwordHash: string;
    createdAt: Date;
  }): Promise<User> {
    const { rows } = await this.pg.query<UserRow>(
      `INSERT INTO users (id, username, name, bio, avatar_url, password_hash, created_at, version)
       VALUES ($1, $2, $3, NULL, NULL, $4, $5, 1) ${RETURNING}`,
      [user.id, user.username, user.name, user.passwordHash, user.createdAt],
    );
    return toUser(rows[0]!);
  }

  async update(
    id: string,
    patch: { name?: string; bio?: string | null; avatarUrl?: string | null },
    nextVersion: number,
  ): Promise<User> {
    const { rows } = await this.pg.query<UserRow>(
      `UPDATE users SET
         name = COALESCE($2, name),
         bio = CASE WHEN $3::boolean THEN $4 ELSE bio END,
         avatar_url = CASE WHEN $5::boolean THEN $6 ELSE avatar_url END,
         version = $7
       WHERE id = $1 ${RETURNING}`,
      [
        id,
        patch.name ?? null,
        patch.bio !== undefined,
        patch.bio ?? null,
        patch.avatarUrl !== undefined,
        patch.avatarUrl ?? null,
        nextVersion,
      ],
    );
    if (!rows[0]) throw new Error(`User ${id} not found`);
    return toUser(rows[0]!);
  }

  async findFollowing(userId: string): Promise<User[]> {
    const { rows } = await this.pg.query<UserRow>(
      `SELECT ${USER_COLUMNS} FROM follows f JOIN users u ON u.id = f.following_id
       WHERE f.follower_id = $1 ORDER BY f.created_at`,
      [userId],
    );
    return rows.map(toUser);
  }

  async findFollowers(userId: string): Promise<User[]> {
    const { rows } = await this.pg.query<UserRow>(
      `SELECT ${USER_COLUMNS} FROM follows f JOIN users u ON u.id = f.follower_id
       WHERE f.following_id = $1 ORDER BY f.created_at`,
      [userId],
    );
    return rows.map(toUser);
  }

  async findFavorites(userId: string): Promise<Favorite[]> {
    const { rows } = await this.pg.query<{ user_id: string; album_id: string; created_at: Date }>(
      `SELECT user_id, album_id, created_at FROM favorites WHERE user_id = $1 ORDER BY created_at`,
      [userId],
    );
    return rows.map((r) => ({ userId: r.user_id, albumId: r.album_id, createdAt: r.created_at }));
  }
}
