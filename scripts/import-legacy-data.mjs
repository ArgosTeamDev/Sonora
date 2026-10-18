// One-time import of the legacy stores into MySQL:
//   users                                  <- data/sonora.db (SQLite)
//   albumOverlays/reviews/follows/favorites <- data/db.json (falls back to db.seed.json)
// The tables come from the SQL migrations, so run `pnpm db:migrate` first or
// this exits with a hint. Safe to re-run: every insert is INSERT IGNORE.
import { createRequire } from "node:module";
import { DatabaseSync } from "node:sqlite";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(root, "..", "data");
const { createConnection } = createRequire(path.join(root, "..", "apps", "api", "package.json"))(
  "mysql2/promise",
);

try {
  process.loadEnvFile(path.join(root, "..", ".env"));
} catch {
  // no .env; fall back to the environment / default below
}
const url = process.env.DATABASE_URL ?? "mysql://sonora:sonora@localhost:3307/sonora";
const jsonPath = [path.join(dataDir, "db.json"), path.join(dataDir, "db.seed.json")].find(existsSync);
const sqlitePath = path.join(dataDir, "sonora.db");

const json = JSON.parse(readFileSync(jsonPath, "utf8"));
const users = existsSync(sqlitePath)
  ? new DatabaseSync(sqlitePath).prepare("SELECT * FROM users").all()
  : [];

// timezone "Z" so the ISO strings/Dates below are stored as UTC.
const db = await createConnection({ uri: url, timezone: "Z" });

const [tables] = await db.query("SHOW TABLES LIKE 'users'");
if (tables.length === 0) {
  console.error("Tables don't exist yet. Run `pnpm db:migrate` first, then re-run.");
  await db.end();
  process.exit(1);
}

const counts = {};
async function insertAll(label, sql, items, toParams) {
  let n = 0;
  for (const item of items) {
    const [res] = await db.query(sql, toParams(item));
    n += res.affectedRows;
  }
  counts[label] = `${n}/${items.length}`;
}
const date = (value) => new Date(value);

try {
  await db.beginTransaction();
  await insertAll(
    "users",
    `INSERT IGNORE INTO users (id, username, name, bio, avatar_url, password_hash, created_at, version)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    users,
    (u) => [u.id, u.username, u.name, u.bio, u.avatar_url, u.password_hash, date(u.created_at), u.version],
  );
  await insertAll(
    "album_overlays",
    `INSERT IGNORE INTO album_overlays (id, is_album_of_the_month, editorial_note, created_at) VALUES (?, ?, ?, ?)`,
    json.albumOverlays ?? [],
    (o) => [o.id, o.isAlbumOfTheMonth ?? false, o.editorialNote ?? null, date(o.createdAt)],
  );
  await insertAll(
    "reviews",
    `INSERT IGNORE INTO reviews (id, user_id, album_id, rating, \`text\`, is_relisten, listened_at, version, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    json.reviews ?? [],
    (r) => [
      r.id, r.userId, r.albumId, r.rating, r.text, r.isRelisten,
      date(r.listenedAt), r.version, date(r.createdAt), date(r.updatedAt),
    ],
  );
  await insertAll(
    "follows",
    `INSERT IGNORE INTO follows (follower_id, following_id, created_at) VALUES (?, ?, ?)`,
    json.follows ?? [],
    (f) => [f.followerId, f.followingId, date(f.createdAt)],
  );
  await insertAll(
    "favorites",
    `INSERT IGNORE INTO favorites (user_id, album_id, created_at) VALUES (?, ?, ?)`,
    json.favorites ?? [],
    (f) => [f.userId, f.albumId, date(f.createdAt)],
  );
  await db.commit();
} catch (err) {
  await db.rollback();
  throw err;
} finally {
  await db.end();
}

console.log(`Imported (inserted/found) from ${path.basename(jsonPath)} + sonora.db:`);
console.table(counts);
