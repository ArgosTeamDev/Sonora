// One-time import of the legacy stores into PostgreSQL:
//   users                                  <- data/sonora.db (SQLite)
//   albumOverlays/reviews/follows/favorites <- data/db.json (falls back to db.seed.json)
// The tables are created by the API on startup, so boot it once first
// (`pnpm dev`) or this exits with a hint. Safe to re-run: every insert is
// ON CONFLICT DO NOTHING.
import { createRequire } from "node:module";
import { DatabaseSync } from "node:sqlite";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(root, "..", "data");
const { Client } = createRequire(path.join(root, "..", "apps", "api", "package.json"))("pg");

const DEFAULT_URL = "postgres://sonora:sonora@localhost:5433/sonora";
const jsonPath = [path.join(dataDir, "db.json"), path.join(dataDir, "db.seed.json")].find(existsSync);
const sqlitePath = path.join(dataDir, "sonora.db");

const json = JSON.parse(readFileSync(jsonPath, "utf8"));
const users = existsSync(sqlitePath)
  ? new DatabaseSync(sqlitePath).prepare("SELECT * FROM users").all()
  : [];

const client = new Client({ connectionString: process.env.DATABASE_URL ?? DEFAULT_URL });
await client.connect();

const { rows } = await client.query("SELECT to_regclass('public.users') AS t");
if (!rows[0].t) {
  console.error("Tables don't exist yet. Start the API once (pnpm dev) so it creates the schema, then re-run.");
  await client.end();
  process.exit(1);
}

const counts = {};
async function insertAll(label, sql, items, toParams) {
  let n = 0;
  for (const item of items) {
    const res = await client.query(`${sql} ON CONFLICT DO NOTHING`, toParams(item));
    n += res.rowCount ?? 0;
  }
  counts[label] = `${n}/${items.length}`;
}

try {
  await client.query("BEGIN");
  await insertAll(
    "users",
    `INSERT INTO users (id, username, name, bio, avatar_url, password_hash, created_at, version)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    users,
    (u) => [u.id, u.username, u.name, u.bio, u.avatar_url, u.password_hash, u.created_at, u.version],
  );
  await insertAll(
    "album_overlays",
    `INSERT INTO album_overlays (id, is_album_of_the_month, editorial_note, created_at) VALUES ($1, $2, $3, $4)`,
    json.albumOverlays ?? [],
    (o) => [o.id, o.isAlbumOfTheMonth ?? false, o.editorialNote ?? null, o.createdAt],
  );
  await insertAll(
    "reviews",
    `INSERT INTO reviews (id, user_id, album_id, rating, text, is_relisten, listened_at, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    json.reviews ?? [],
    (r) => [r.id, r.userId, r.albumId, r.rating, r.text, r.isRelisten, r.listenedAt, r.version, r.createdAt, r.updatedAt],
  );
  await insertAll(
    "follows",
    `INSERT INTO follows (follower_id, following_id, created_at) VALUES ($1, $2, $3)`,
    json.follows ?? [],
    (f) => [f.followerId, f.followingId, f.createdAt],
  );
  await insertAll(
    "favorites",
    `INSERT INTO favorites (user_id, album_id, created_at) VALUES ($1, $2, $3)`,
    json.favorites ?? [],
    (f) => [f.userId, f.albumId, f.createdAt],
  );
  await client.query("COMMIT");
} catch (err) {
  await client.query("ROLLBACK");
  throw err;
} finally {
  await client.end();
}

console.log(`Imported (inserted/found) from ${path.basename(jsonPath)} + sonora.db:`);
console.table(counts);
