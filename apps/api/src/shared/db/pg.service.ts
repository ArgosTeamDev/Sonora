import { Injectable, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { Pool, type QueryResult, type QueryResultRow } from "pg";

const DEFAULT_URL = "postgres://sonora:sonora@localhost:5433/sonora";

// Albums and artists aren't stored: catalog data comes live from iTunes, so
// album_id columns are plain iTunes collectionIds with no FK. Everything
// else (users, reviews, follows, favorites) is relational.
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id            uuid PRIMARY KEY,
    username      text UNIQUE NOT NULL,
    name          text NOT NULL,
    bio           text,
    avatar_url    text,
    password_hash text NOT NULL,
    created_at    timestamptz NOT NULL,
    version       integer NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS album_overlays (
    id                    text PRIMARY KEY,
    is_album_of_the_month boolean NOT NULL DEFAULT false,
    editorial_note        text,
    created_at            timestamptz NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id          uuid PRIMARY KEY,
    user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    album_id    text NOT NULL,
    rating      numeric(2,1) NOT NULL CHECK (rating >= 0.5 AND rating <= 5 AND (rating * 2) = trunc(rating * 2)),
    text        text,
    is_relisten boolean NOT NULL DEFAULT false,
    listened_at timestamptz NOT NULL,
    version     integer NOT NULL DEFAULT 1,
    created_at  timestamptz NOT NULL,
    updated_at  timestamptz NOT NULL,
    UNIQUE (user_id, album_id)
  );
  CREATE INDEX IF NOT EXISTS reviews_album_idx ON reviews (album_id);
  CREATE INDEX IF NOT EXISTS reviews_user_recent_idx ON reviews (user_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS follows (
    follower_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   timestamptz NOT NULL,
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id <> following_id)
  );

  CREATE TABLE IF NOT EXISTS favorites (
    user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    album_id   text NOT NULL,
    created_at timestamptz NOT NULL,
    PRIMARY KEY (user_id, album_id)
  );
`;

@Injectable()
export class PgService implements OnModuleInit, OnModuleDestroy {
  readonly pool = new Pool({ connectionString: process.env.DATABASE_URL ?? DEFAULT_URL });

  async onModuleInit(): Promise<void> {
    await this.pool.query(SCHEMA);
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  query<R extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<R>> {
    return this.pool.query<R>(text, params);
  }
}
